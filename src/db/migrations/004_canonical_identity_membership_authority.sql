-- AR2-U02. Additive compatibility only; 001/002/003 are immutable.
ALTER TABLE drivers DROP CONSTRAINT drivers_status_check;
ALTER TABLE drivers ADD CONSTRAINT drivers_status_check CHECK (status IN ('ACTIVE','SUSPENDED','INACTIVE'));
ALTER TABLE carriers DROP CONSTRAINT carriers_status_check;
ALTER TABLE carriers ADD CONSTRAINT carriers_status_check CHECK (status IN ('ACTIVE','SUSPENDED','INACTIVE'));
ALTER TABLE trucks DROP CONSTRAINT trucks_status_check;
ALTER TABLE trucks ADD CONSTRAINT trucks_status_check CHECK (status IN ('ACTIVE','MAINTENANCE','INACTIVE'));

DO $$
DECLARE entity text; member text;
BEGIN
  FOREACH entity IN ARRAY ARRAY['carriers','materials','drivers','trucks'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN natural_key_hmac bytea, ADD COLUMN profile_encrypted text,
      ADD COLUMN crypto_key_version text, ADD COLUMN revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
      ADD COLUMN created_by uuid REFERENCES users(id), ADD COLUMN updated_by uuid REFERENCES users(id)', entity);
    EXECUTE format('CREATE UNIQUE INDEX %I ON %I(company_id,natural_key_hmac) WHERE natural_key_hmac IS NOT NULL', entity || '_natural_key_uq', entity);
    EXECUTE format('CREATE UNIQUE INDEX %I ON %I(company_id,legacy_id) WHERE legacy_id IS NOT NULL', entity || '_legacy_id_uq', entity);
    EXECUTE format('ALTER TABLE %I ADD CHECK(natural_key_hmac IS NULL OR
      (octet_length(natural_key_hmac)=32 AND profile_encrypted IS NOT NULL AND crypto_key_version IS NOT NULL))',entity);
    EXECUTE format('GRANT SELECT, INSERT ON %I TO qsa_runtime', entity);
    EXECUTE format('GRANT UPDATE(status,revision,updated_at,updated_by) ON %I TO qsa_runtime', entity);
    member := 'project_' || entity;
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', member, member || '_status_check');
    -- INACTIVE stays only for unresolved historical rows; commands reject it.
    EXECUTE format('ALTER TABLE %I ADD CHECK(status IN (''ACTIVE'',''SUSPENDED'',''REMOVED'',''INACTIVE'')),
      ADD COLUMN created_by uuid REFERENCES users(id), ADD COLUMN updated_by uuid REFERENCES users(id),
      ADD COLUMN updated_at timestamptz, ADD COLUMN status_changed_at timestamptz,
      ADD COLUMN status_reason text CHECK(length(status_reason)<=2000),
      ADD COLUMN legacy_id text, ADD COLUMN legacy_firestore_path text,
      ADD UNIQUE(company_id,project_id,id)', member);
    EXECUTE format('CREATE TABLE %I (
      id uuid PRIMARY KEY, company_id uuid NOT NULL, project_id uuid NOT NULL, membership_id uuid NOT NULL,
      revision bigint NOT NULL CHECK(revision>=1), previous_status text, status text NOT NULL,
      previous_period tstzrange, effective_at timestamptz NOT NULL,
      actor_id uuid NOT NULL REFERENCES users(id), actor_role text NOT NULL, operation_id text NOT NULL, reason text,
      CHECK(previous_status IS NULL OR previous_status IN (''ACTIVE'',''SUSPENDED'',''REMOVED'')),
      CHECK(status IN (''ACTIVE'',''SUSPENDED'',''REMOVED'')),
      UNIQUE(company_id,membership_id,revision),
      FOREIGN KEY(company_id,project_id,membership_id) REFERENCES %I(company_id,project_id,id) ON DELETE RESTRICT
    )', member || '_history', member);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', member || '_history');
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', member || '_history');
    EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL TO public
      USING(company_id=nullif(current_setting(''app.company_id'',true),'''')::uuid)
      WITH CHECK(company_id=nullif(current_setting(''app.company_id'',true),'''')::uuid)', member || '_history');
    EXECUTE format('GRANT SELECT,INSERT ON %I TO qsa_runtime', member || '_history');
    EXECUTE format('GRANT SELECT,INSERT ON %I TO qsa_runtime', member);
    EXECUTE format('CREATE POLICY runtime_project_scope ON %I AS RESTRICTIVE FOR ALL TO qsa_runtime
      USING(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)
      WITH CHECK(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',member);
    EXECUTE format('CREATE POLICY runtime_project_scope ON %I AS RESTRICTIVE FOR ALL TO qsa_runtime
      USING(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)
      WITH CHECK(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',member || '_history');
    EXECUTE format('GRANT UPDATE(status,revision,valid_period,updated_at,updated_by,status_changed_at,status_reason) ON %I TO qsa_runtime', member);
  END LOOP;
END $$;

CREATE UNIQUE INDEX carriers_registration_key_uq ON carriers(company_id,registration_key_hmac)
  WHERE registration_key_hmac IS NOT NULL;
ALTER TABLE idempotency_receipts ADD COLUMN result_encrypted text;
ALTER TABLE audit_events ADD COLUMN actor_role text;

CREATE TABLE legacy_identity_mappings (
  id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES companies(id),
  kind text NOT NULL CHECK(kind IN ('DRIVER','TRUCK','CARRIER','MATERIAL')),
  source_key_hmac bytea NOT NULL, source_encrypted text NOT NULL, target_external_id text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id,kind,source_key_hmac)
);
ALTER TABLE legacy_identity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_identity_mappings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON legacy_identity_mappings FOR ALL TO public
USING(company_id=nullif(current_setting('app.company_id',true),'')::uuid)
WITH CHECK(company_id=nullif(current_setting('app.company_id',true),'')::uuid);
GRANT SELECT,INSERT ON legacy_identity_mappings,identity_keys,identity_key_reservations TO qsa_runtime;
GRANT UPDATE(operation_id,expires_at) ON identity_key_reservations TO qsa_runtime;

CREATE FUNCTION qsa_validate_identity_reference() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog,pg_temp AS $$
DECLARE target_table text; target_key bytea;
BEGIN
  target_table := CASE NEW.kind WHEN 'DRIVER' THEN 'drivers' WHEN 'TRUCK' THEN 'trucks'
    WHEN 'CARRIER' THEN 'carriers' WHEN 'MATERIAL' THEN 'materials' END;
  IF target_table IS NULL THEN RAISE EXCEPTION 'IDENTITY_LOOKUP_INTEGRITY_ERROR'; END IF;
  EXECUTE format('SELECT natural_key_hmac FROM public.%I WHERE company_id=$1 AND external_id=$2',target_table)
    INTO target_key USING NEW.company_id,NEW.target_external_id;
  IF target_key IS NULL THEN RAISE EXCEPTION 'IDENTITY_LOOKUP_INTEGRITY_ERROR'; END IF;
  IF TG_TABLE_NAME='identity_keys' THEN
    IF target_key IS DISTINCT FROM NEW.key_hmac THEN RAISE EXCEPTION 'IDENTITY_LOOKUP_INTEGRITY_ERROR'; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION qsa_validate_identity_reference() FROM PUBLIC;
CREATE TRIGGER identity_key_target_integrity BEFORE INSERT OR UPDATE ON identity_keys
  FOR EACH ROW EXECUTE FUNCTION qsa_validate_identity_reference();
CREATE TRIGGER legacy_mapping_target_integrity BEFORE INSERT OR UPDATE ON legacy_identity_mappings
  FOR EACH ROW EXECUTE FUNCTION qsa_validate_identity_reference();

-- Read-only dependency guards; temporal mutation belongs to U03.
GRANT SELECT ON driver_carrier_affiliations,truck_carrier_affiliations,
  driver_truck_assignments,truck_material_allocations,pricing_rules TO qsa_runtime;
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['driver_carrier_affiliations','truck_carrier_affiliations',
    'driver_truck_assignments','truck_material_allocations','pricing_rules'] LOOP
    EXECUTE format('CREATE POLICY runtime_project_scope ON %I AS RESTRICTIVE FOR SELECT TO qsa_runtime
      USING(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',tbl);
  END LOOP;
END $$;

-- A non-login, non-owner capability rechecks/locks current authority in the domain
-- transaction without granting runtime access to global user/role tables.
DO $$ BEGIN
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='qsa_command_authorizer') THEN
    CREATE ROLE qsa_command_authorizer NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF EXISTS(SELECT FROM pg_roles WHERE rolname='qsa_command_authorizer'
    AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolreplication)) THEN
    RAISE EXCEPTION 'Unsafe command authorizer role; DBA reconciliation required';
  END IF;
  IF EXISTS(SELECT FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='qsa_command_authorizer') THEN
    RAISE EXCEPTION 'Command authorizer must not inherit other roles';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO qsa_command_authorizer;
GRANT SELECT ON users,companies,user_company_roles,projects,project_access TO qsa_command_authorizer;
GRANT UPDATE(id) ON users,companies,user_company_roles,projects,project_access TO qsa_command_authorizer;
CREATE POLICY command_authorization_lookup ON user_company_roles FOR SELECT TO qsa_command_authorizer USING(true);
CREATE POLICY command_authorization_lookup ON projects FOR SELECT TO qsa_command_authorizer USING(true);
CREATE POLICY command_authorization_lookup ON project_access FOR SELECT TO qsa_command_authorizer USING(true);

CREATE FUNCTION qsa_authorize_canonical_command(governance boolean DEFAULT false)
RETURNS TABLE(commercial_role text,project_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid := nullif(current_setting('app.actor_id',true),'')::uuid;
  company uuid := nullif(current_setting('app.company_id',true),'')::uuid;
  project uuid := nullif(current_setting('app.project_id',true),'')::uuid;
  role_value text; status_value text;
BEGIN
  IF actor IS NULL OR company IS NULL OR project IS NULL THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.users u WHERE u.id=actor AND u.status='ACTIVE' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.companies c WHERE c.id=company AND c.status='ACTIVE' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501'; END IF;
  SELECT p.status INTO status_value FROM public.projects p WHERE p.id=project AND p.company_id=company FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND' USING ERRCODE='42501'; END IF;
  SELECT r.role INTO role_value FROM public.user_company_roles r
    WHERE r.company_id=company AND r.user_id=actor AND r.status='ACTIVE'
      AND r.valid_from<=clock_timestamp() AND (r.valid_to IS NULL OR r.valid_to>clock_timestamp())
      AND r.role IN ('SUPER_ADMIN','COMPANY_ADMIN','PROJECT_ADMIN')
    ORDER BY CASE r.role WHEN 'SUPER_ADMIN' THEN 0 WHEN 'COMPANY_ADMIN' THEN 1 ELSE 2 END,r.id
    LIMIT 1 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501'; END IF;
  IF role_value='PROJECT_ADMIN' THEN
    IF governance THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501'; END IF;
    PERFORM 1 FROM public.project_access a WHERE a.company_id=company AND a.project_id=project
      AND a.user_id=actor AND a.role='PROJECT_ADMIN' AND a.status='ACTIVE'
      AND a.valid_period @> clock_timestamp() FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN QUERY SELECT role_value,status_value;
END $$;
REVOKE ALL ON FUNCTION qsa_authorize_canonical_command(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION qsa_authorize_canonical_command(boolean) TO qsa_runtime;
-- Ownership transfer enables SET temporarily. The migration administrator retains
-- ADMIN with SET/INHERIT disabled for future databases/migrations. Services gain none.
GRANT CREATE ON SCHEMA public TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE, INHERIT FALSE',current_user); END $$;
ALTER FUNCTION qsa_authorize_canonical_command(boolean) OWNER TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE, INHERIT FALSE',current_user); END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_command_authorizer;
