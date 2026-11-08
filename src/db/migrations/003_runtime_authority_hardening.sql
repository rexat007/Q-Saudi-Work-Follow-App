-- AR2-U01-SG1: additive privilege correction; 001/002 remain immutable.
-- Run as the dedicated database owner/migration identity with CREATEROLE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'qsa_auth') THEN
    CREATE ROLE qsa_auth LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  END IF;
END $$;

-- A non-superuser migrator cannot change superuser/replication flags. Refuse
-- unsafe pre-existing roles instead of requiring a superuser migration login.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname IN ('qsa_runtime', 'qsa_worker', 'qsa_auth')
    AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolreplication)) THEN
    RAISE EXCEPTION 'Unsafe service role attributes; DBA reconciliation required';
  END IF;
END $$;

-- No inheritance/escalation path from a service identity to another role.
DO $$
DECLARE membership record;
BEGIN
  FOR membership IN
    SELECT parent.rolname AS parent, member.rolname AS member
    FROM pg_auth_members m JOIN pg_roles parent ON parent.oid = m.roleid
    JOIN pg_roles member ON member.oid = m.member
    WHERE member.rolname IN ('qsa_runtime', 'qsa_worker', 'qsa_auth')
  LOOP
    EXECUTE format('REVOKE %I FROM %I', membership.parent, membership.member);
  END LOOP;
END $$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC, qsa_runtime, qsa_worker, qsa_auth;
GRANT USAGE ON SCHEMA public TO qsa_auth;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, qsa_runtime, qsa_worker, qsa_auth;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, qsa_runtime, qsa_worker, qsa_auth;

-- Only operations implemented in U01 are enabled. Later units grant their own
-- required domain mutations explicitly instead of inheriting blanket DML.
GRANT SELECT ON projects TO qsa_runtime;
GRANT SELECT, INSERT, UPDATE ON idempotency_receipts TO qsa_runtime;
GRANT SELECT, INSERT ON outbox_events TO qsa_runtime;
GRANT INSERT ON audit_events, worker_jobs TO qsa_runtime;

-- Worker authority is confined to delivery/lease state in a selected company.
GRANT SELECT ON worker_jobs, outbox_events, workspace_bindings TO qsa_worker;
GRANT UPDATE (status, attempts, available_at, lease_until, last_error_code, updated_at)
  ON worker_jobs TO qsa_worker;
GRANT SELECT, INSERT ON workspace_sync_receipts TO qsa_worker;

-- Authentication is a separate trusted, read-only server credential, never the
-- runtime credential. It can inspect only columns needed by the adapter.
GRANT SELECT (id, firebase_uid, status, display_name) ON users TO qsa_auth;
GRANT SELECT (id, status) ON companies TO qsa_auth;
GRANT SELECT (company_id, user_id, role, status, valid_from, valid_to, created_at)
  ON user_company_roles TO qsa_auth;
GRANT SELECT (company_id, user_id, project_id, status, valid_period) ON project_access TO qsa_auth;
GRANT SELECT (id, company_id) ON projects TO qsa_auth;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['user_company_roles', 'audit_events', 'worker_jobs'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I FOR ALL TO public '
      'USING (company_id = nullif(current_setting(''app.company_id'', true), '''')::uuid) '
      'WITH CHECK (company_id = nullif(current_setting(''app.company_id'', true), '''')::uuid)', tbl);
  END LOOP;
  FOREACH tbl IN ARRAY ARRAY['user_company_roles', 'project_access', 'projects'] LOOP
    EXECUTE format('CREATE POLICY authentication_lookup ON %I FOR SELECT TO qsa_auth USING (true)', tbl);
  END LOOP;
END $$;

-- Restrictive policies supplement company isolation, including the missing
-- composite event/company relationship, without changing canonical columns.
CREATE POLICY runtime_queue_insert ON worker_jobs AS RESTRICTIVE FOR INSERT TO qsa_runtime
WITH CHECK (
  status = 'PENDING' AND attempts = 0 AND lease_until IS NULL AND last_error_code IS NULL
  AND EXISTS (SELECT 1 FROM outbox_events e WHERE e.id = event_id AND e.company_id = worker_jobs.company_id)
);
CREATE POLICY runtime_audit_insert ON audit_events AS RESTRICTIVE FOR INSERT TO qsa_runtime
WITH CHECK (
  actor_id = nullif(current_setting('app.actor_id', true), '')::uuid
  AND (project_id IS NULL OR EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND p.company_id = audit_events.company_id
  ))
);

-- Future objects are private by default for the migration identity.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM qsa_runtime, qsa_worker, qsa_auth, PUBLIC;
