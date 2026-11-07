-- Migration: 002_roles_and_rls.sql
-- Architecture Authority: ARCH-R1 / Revision 1.2 & ADR-001 (Section 17.4)
-- Scope: AR2-U01 Database Roles, Grants, and Row Level Security (FORCE RLS)

-- ============================================================================
-- 1. Create Roles (Safe Execution)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'qsa_migrator') THEN
    CREATE ROLE qsa_migrator WITH LOGIN;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'qsa_runtime') THEN
    CREATE ROLE qsa_runtime WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'qsa_worker') THEN
    CREATE ROLE qsa_worker WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

-- ============================================================================
-- 2. Grants for Runtime and Worker Roles
-- ============================================================================

GRANT USAGE ON SCHEMA public TO qsa_runtime, qsa_worker;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qsa_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qsa_worker;

-- ============================================================================
-- 3. Row Level Security Policies (FORCE ROW LEVEL SECURITY)
-- ============================================================================

-- Macro-like policy helper applied to all tenant tables
-- Rule: company_id must match transaction-local current_setting('app.company_id', true)

DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'projects',
    'project_access',
    'carriers',
    'materials',
    'drivers',
    'trucks',
    'identity_keys',
    'identity_key_reservations',
    'project_carriers',
    'project_materials',
    'project_drivers',
    'project_trucks',
    'driver_carrier_affiliations',
    'truck_carrier_affiliations',
    'driver_truck_assignments',
    'truck_material_allocations',
    'pricing_rules',
    'trips',
    'trip_events',
    'trip_weight_records',
    'receipts',
    'pricing_snapshots',
    'exceptions',
    'operational_adjustments',
    'import_sessions',
    'import_source_artifacts',
    'import_row_decisions',
    'import_execution_groups',
    'import_execution_receipts',
    'idempotency_receipts',
    'outbox_events',
    'workspace_bindings',
    'workspace_sync_receipts',
    'project_foundation_summaries',
    'report_snapshots',
    'migration_runs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    
    -- Drop existing policy if any
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
    
    -- Create strict company isolation policy (Permissive policy required so matching rows are allowed)
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I ' ||
      'FOR ALL TO public ' ||
      'USING (company_id = nullif(current_setting(''app.company_id'', true), '''')::uuid) ' ||
      'WITH CHECK (company_id = nullif(current_setting(''app.company_id'', true), '''')::uuid);',
      tbl
    );
  END LOOP;
END $$;
