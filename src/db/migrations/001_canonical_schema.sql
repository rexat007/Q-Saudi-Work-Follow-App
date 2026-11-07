-- Migration: 001_canonical_schema.sql
-- Architecture Authority: ARCH-R1 / Revision 1.2 & ADR-001 (Sections 7 and 17)
-- Scope: AR2-U01 Canonical Schema for PostgreSQL 17

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Schema migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  name text NOT NULL,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 1. Governance & Tenant Isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  timezone text NOT NULL DEFAULT 'Asia/Riyadh',
  currency text NOT NULL DEFAULT 'SAR',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  firebase_uid text NOT NULL UNIQUE,
  display_name text,
  email text,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  last_auth_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS user_company_roles (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  valid_from timestamptz NOT NULL DEFAULT clock_timestamp(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  project_number text,
  name text NOT NULL,
  status text NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  operational_profile text,
  readiness_revision bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id)
);

CREATE TABLE IF NOT EXISTS project_access (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  valid_period tstzrange NOT NULL DEFAULT tstzrange(clock_timestamp(), NULL, '[)'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, user_id, role)
);

-- ============================================================================
-- 2. Master Global Identities (Company-Scoped)
-- ============================================================================

CREATE TABLE IF NOT EXISTS carriers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  name text NOT NULL,
  registration_key_hmac bytea,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  legacy_id text,
  legacy_firestore_path text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id)
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  name text NOT NULL,
  code_normalized text NOT NULL,
  unit text NOT NULL DEFAULT 'TON',
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  legacy_id text,
  legacy_firestore_path text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id),
  UNIQUE(company_id, code_normalized)
);

CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  name text NOT NULL,
  name_encrypted text,
  identity_key_hmac bytea,
  phone_encrypted text,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  legacy_id text,
  legacy_firestore_path text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id),
  UNIQUE(company_id, identity_key_hmac)
);

CREATE TABLE IF NOT EXISTS trucks (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  normalized_plate text NOT NULL,
  type text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  weights_profile jsonb,
  legacy_id text,
  legacy_firestore_path text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id),
  UNIQUE(company_id, normalized_plate)
);

CREATE TABLE IF NOT EXISTS identity_keys (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  kind text NOT NULL,
  key_hmac bytea NOT NULL,
  target_external_id text NOT NULL,
  verification_status text NOT NULL CHECK (verification_status IN ('RESERVED', 'VERIFIED', 'SUPERSEDED')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, kind, key_hmac)
);

CREATE TABLE IF NOT EXISTS identity_key_reservations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  kind text NOT NULL,
  key_hmac bytea NOT NULL,
  operation_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, kind, key_hmac)
);

-- ============================================================================
-- 3. Project Memberships
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_carriers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  carrier_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  valid_period tstzrange NOT NULL DEFAULT tstzrange(clock_timestamp(), NULL, '[)'),
  revision bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, carrier_id) REFERENCES carriers(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, carrier_id)
);

CREATE TABLE IF NOT EXISTS project_materials (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  material_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  valid_period tstzrange NOT NULL DEFAULT tstzrange(clock_timestamp(), NULL, '[)'),
  revision bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, material_id) REFERENCES materials(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, material_id)
);

CREATE TABLE IF NOT EXISTS project_drivers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  valid_period tstzrange NOT NULL DEFAULT tstzrange(clock_timestamp(), NULL, '[)'),
  revision bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, driver_id) REFERENCES drivers(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, driver_id)
);

CREATE TABLE IF NOT EXISTS project_trucks (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  valid_period tstzrange NOT NULL DEFAULT tstzrange(clock_timestamp(), NULL, '[)'),
  revision bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, truck_id) REFERENCES trucks(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, truck_id)
);

-- ============================================================================
-- 4. Temporal Relationships & Exclusion Constraints (EXCLUDE USING gist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_carrier_affiliations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  carrier_id uuid NOT NULL,
  valid_period tstzrange NOT NULL,
  record_status text NOT NULL CHECK (record_status IN ('ACCEPTED', 'VOIDED')),
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (NOT isempty(valid_period)),
  CHECK ((record_status = 'ACCEPTED' AND voided_at IS NULL) OR
         (record_status = 'VOIDED' AND voided_at IS NOT NULL)),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, driver_id) REFERENCES drivers(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, carrier_id) REFERENCES carriers(company_id, id) ON DELETE RESTRICT,
  CONSTRAINT driver_carrier_one_carrier_per_period
    EXCLUDE USING gist (company_id WITH =, driver_id WITH =, valid_period WITH &&)
    WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL)
);

CREATE TABLE IF NOT EXISTS truck_carrier_affiliations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  carrier_id uuid NOT NULL,
  valid_period tstzrange NOT NULL,
  record_status text NOT NULL CHECK (record_status IN ('ACCEPTED', 'VOIDED')),
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (NOT isempty(valid_period)),
  CHECK ((record_status = 'ACCEPTED' AND voided_at IS NULL) OR
         (record_status = 'VOIDED' AND voided_at IS NOT NULL)),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, truck_id) REFERENCES trucks(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, carrier_id) REFERENCES carriers(company_id, id) ON DELETE RESTRICT,
  CONSTRAINT truck_carrier_one_carrier_per_period
    EXCLUDE USING gist (company_id WITH =, truck_id WITH =, valid_period WITH &&)
    WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL)
);

CREATE TABLE IF NOT EXISTS driver_truck_assignments (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  valid_period tstzrange NOT NULL,
  record_status text NOT NULL CHECK (record_status IN ('ACCEPTED', 'VOIDED')),
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (NOT isempty(valid_period)),
  CHECK ((record_status = 'ACCEPTED' AND voided_at IS NULL) OR
         (record_status = 'VOIDED' AND voided_at IS NOT NULL)),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, driver_id) REFERENCES drivers(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, truck_id) REFERENCES trucks(company_id, id) ON DELETE RESTRICT,
  CONSTRAINT assignment_one_driver_per_period
    EXCLUDE USING gist (company_id WITH =, driver_id WITH =, valid_period WITH &&)
    WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL),
  CONSTRAINT assignment_one_truck_per_period
    EXCLUDE USING gist (company_id WITH =, truck_id WITH =, valid_period WITH &&)
    WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL)
);

CREATE TABLE IF NOT EXISTS truck_material_allocations (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  material_id uuid NOT NULL,
  valid_period tstzrange NOT NULL,
  record_status text NOT NULL CHECK (record_status IN ('ACCEPTED', 'VOIDED')),
  voided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (NOT isempty(valid_period)),
  CHECK ((record_status = 'ACCEPTED' AND voided_at IS NULL) OR
         (record_status = 'VOIDED' AND voided_at IS NOT NULL)),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, truck_id) REFERENCES trucks(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, material_id) REFERENCES materials(company_id, id) ON DELETE RESTRICT,
  CONSTRAINT allocation_one_material_per_period
    EXCLUDE USING gist (company_id WITH =, truck_id WITH =, valid_period WITH &&)
    WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL)
);

-- ============================================================================
-- 5. Operations: Pricing, Trips, Events, Weights, Receipts
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  carrier_id uuid,
  material_id uuid,
  version bigint NOT NULL DEFAULT 1,
  effective_period tstzrange NOT NULL,
  pricing_model text NOT NULL,
  rate numeric(18,4) NOT NULL,
  tax_policy text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  external_id text NOT NULL,
  trip_number text NOT NULL,
  carrier_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  material_id uuid NOT NULL,
  state text NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, carrier_id) REFERENCES carriers(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, driver_id) REFERENCES drivers(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, truck_id) REFERENCES trucks(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, material_id) REFERENCES materials(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, id),
  UNIQUE(company_id, project_id, trip_number),
  UNIQUE(company_id, external_id)
);

CREATE TABLE IF NOT EXISTS trip_events (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  seq bigint NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  operation_id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, trip_id) REFERENCES trips(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, trip_id, seq)
);

CREATE TABLE IF NOT EXISTS trip_weight_records (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  measurement_type text NOT NULL,
  weight_kg numeric(18,3) NOT NULL,
  source_unit text NOT NULL DEFAULT 'KG',
  source_ref text,
  captured_at timestamptz NOT NULL,
  authority_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, trip_id) REFERENCES trips(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  receipt_type text NOT NULL,
  quantity_kg numeric(18,3) NOT NULL,
  received_at timestamptz NOT NULL,
  actor_id uuid NOT NULL,
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, trip_id) REFERENCES trips(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pricing_snapshots (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  pricing_rule_id uuid NOT NULL,
  pricing_rule_version bigint NOT NULL,
  rate numeric(18,4) NOT NULL,
  quantity_basis numeric(18,3) NOT NULL,
  tax numeric(18,2) NOT NULL,
  final_amount numeric(18,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, trip_id) REFERENCES trips(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, trip_id)
);

CREATE TABLE IF NOT EXISTS exceptions (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  trip_id uuid,
  reason text NOT NULL,
  status text NOT NULL,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS operational_adjustments (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  adjustment_type text NOT NULL,
  amount numeric(18,2) NOT NULL,
  reason text NOT NULL,
  resolved_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT
);

-- ============================================================================
-- 6. Smart Import Ledgers, Fencing & Durable Idempotency
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_sessions (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  external_id text NOT NULL,
  state text NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  source_hash text NOT NULL,
  reviewed_signature text,
  fence bigint NOT NULL DEFAULT 0,
  schema_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, external_id)
);

CREATE TABLE IF NOT EXISTS import_source_artifacts (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL REFERENCES import_sessions(id) ON DELETE RESTRICT,
  content_sha256 text NOT NULL,
  object_uri text NOT NULL,
  manifest jsonb NOT NULL,
  byte_length bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS import_row_decisions (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL REFERENCES import_sessions(id) ON DELETE RESTRICT,
  source_row_key text NOT NULL,
  decision text NOT NULL,
  resolved_ids jsonb NOT NULL,
  review_version bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, session_id, source_row_key, review_version)
);

CREATE TABLE IF NOT EXISTS import_execution_groups (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL REFERENCES import_sessions(id) ON DELETE RESTRICT,
  operation_id text NOT NULL,
  group_key text NOT NULL,
  state text NOT NULL,
  fence bigint NOT NULL,
  version bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, session_id, group_key)
);

CREATE TABLE IF NOT EXISTS import_execution_receipts (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL REFERENCES import_sessions(id) ON DELETE RESTRICT,
  operation_id text NOT NULL,
  group_key text NOT NULL,
  result_hash text NOT NULL,
  committed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, session_id, operation_id, group_key)
);

CREATE TABLE IF NOT EXISTS idempotency_receipts (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  operation_id text NOT NULL,
  actor_id uuid NOT NULL,
  request_hash text NOT NULL,
  result_ref text,
  state text NOT NULL CHECK (state IN ('IN_FLIGHT', 'COMMITTED', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, operation_id)
);

-- ============================================================================
-- 7. Audit, Outbox, Worker & Projections
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_kind text NOT NULL,
  entity_id text NOT NULL,
  operation_id text NOT NULL,
  before_digest text,
  after_digest text,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  aggregate_version bigint NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS worker_jobs (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES outbox_events(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('PENDING', 'LEASED', 'COMPLETED', 'DEAD_LETTER')),
  attempts int NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  lease_until timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS workspace_bindings (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  folder_id text,
  spreadsheet_id text,
  script_id text,
  google_subject text,
  authorization_ref text,
  template_version text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id)
);

CREATE TABLE IF NOT EXISTS workspace_sync_receipts (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  event_id uuid NOT NULL,
  destination_id text NOT NULL,
  delivery_revision bigint NOT NULL,
  delivery_status text NOT NULL,
  delivered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id, event_id, destination_id)
);

CREATE TABLE IF NOT EXISTS project_foundation_summaries (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  project_revision bigint NOT NULL,
  ready_stage_count int NOT NULL DEFAULT 0,
  carrier_count int NOT NULL DEFAULT 0,
  material_count int NOT NULL DEFAULT 0,
  driver_count int NOT NULL DEFAULT 0,
  truck_count int NOT NULL DEFAULT 0,
  readiness_state text NOT NULL DEFAULT 'NOT_READY',
  stale boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT,
  UNIQUE(company_id, project_id)
);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL,
  report_kind text NOT NULL,
  through_revision bigint NOT NULL,
  payload_ref text,
  generated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS migration_runs (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  batch_id text NOT NULL,
  source_path text NOT NULL,
  target_kind text NOT NULL,
  target_id text NOT NULL,
  source_hash text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(company_id, source_path)
);

-- ============================================================================
-- 8. Core Indexes for Foundation, Fleet Paging & Tenancy
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_project_access_user ON project_access(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_carriers_company ON carriers(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_company ON materials(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_trucks_company ON trucks(company_id);

CREATE INDEX IF NOT EXISTS idx_project_carriers_lookup ON project_carriers(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_lookup ON project_materials(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_drivers_lookup ON project_drivers(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_trucks_lookup ON project_trucks(company_id, project_id);

CREATE INDEX IF NOT EXISTS idx_assignments_project_driver ON driver_truck_assignments(company_id, project_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_truck ON driver_truck_assignments(company_id, project_id, truck_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project_truck ON truck_material_allocations(company_id, project_id, truck_id);

CREATE INDEX IF NOT EXISTS idx_trips_project_state ON trips(company_id, project_id, state);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip_seq ON trip_events(company_id, trip_id, seq);
CREATE INDEX IF NOT EXISTS idx_outbox_events_project ON outbox_events(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_worker_jobs_status_available ON worker_jobs(status, available_at);
