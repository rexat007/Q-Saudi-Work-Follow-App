-- AR2-U03: retain all accepted EXCLUDE history; do not edit migrations 001-004.
DO $$ BEGIN
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='qsa_temporal_history_writer') THEN
    CREATE ROLE qsa_temporal_history_writer NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF EXISTS(SELECT FROM pg_roles WHERE rolname='qsa_temporal_history_writer'
    AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolreplication))
    OR EXISTS(SELECT FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='qsa_temporal_history_writer') THEN
    RAISE EXCEPTION 'Unsafe temporal history capability; DBA reconciliation required';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO qsa_temporal_history_writer;

DO $$ DECLARE tbl text; entity text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['driver_carrier_affiliations','truck_carrier_affiliations',
    'driver_truck_assignments','truck_material_allocations'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN external_id text, ADD COLUMN revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
      ADD COLUMN created_by uuid REFERENCES users(id), ADD COLUMN created_role text,
      ADD COLUMN updated_by uuid REFERENCES users(id), ADD COLUMN updated_role text, ADD COLUMN updated_at timestamptz,
      ADD COLUMN opened_operation_id text, ADD COLUMN closed_operation_id text,
      ADD COLUMN close_reason text CHECK(length(close_reason)<=2000), ADD COLUMN legacy_firestore_path text,
      ADD UNIQUE(company_id,project_id,id)',tbl);
    -- Preserve unresolved legacy rows; enforce correct boundaries on new/changed rows.
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK(
      NOT isempty(valid_period) AND NOT lower_inf(valid_period) AND isfinite(lower(valid_period))
      AND lower_inc(valid_period) AND NOT upper_inc(valid_period)
      AND (upper_inf(valid_period) OR isfinite(upper(valid_period)))) NOT VALID',tbl,tbl || '_half_open_period');
    EXECUTE format('CREATE UNIQUE INDEX %I ON %I(company_id,external_id) WHERE external_id IS NOT NULL',tbl || '_external_uq',tbl);
    entity := CASE WHEN tbl='driver_carrier_affiliations' OR tbl='driver_truck_assignments' THEN 'driver_id' ELSE 'truck_id' END;
    EXECUTE format('CREATE INDEX %I ON %I(company_id,project_id,%I,lower(valid_period) DESC,id DESC)',tbl || '_history_idx',tbl,entity);
    EXECUTE format('GRANT INSERT ON %I TO qsa_runtime',tbl);
    EXECUTE format('GRANT UPDATE(valid_period,revision,updated_by,updated_role,updated_at,closed_operation_id,close_reason) ON %I TO qsa_runtime',tbl);
    -- 004's restrictive project policy already covers SELECT; extend it to writes.
    EXECUTE format('CREATE POLICY runtime_temporal_insert ON %I AS RESTRICTIVE FOR INSERT TO qsa_runtime
      WITH CHECK(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',tbl);
    EXECUTE format('CREATE POLICY runtime_temporal_update ON %I AS RESTRICTIVE FOR UPDATE TO qsa_runtime
      USING(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)
      WITH CHECK(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',tbl);
    EXECUTE format('CREATE TABLE %I (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, project_id uuid NOT NULL,
      relationship_id uuid NOT NULL, revision bigint NOT NULL CHECK(revision>=1),
      operation_id text NOT NULL, action text NOT NULL, actor_id uuid NOT NULL REFERENCES users(id), actor_role text NOT NULL,
      effective_at timestamptz NOT NULL, before_record jsonb, after_record jsonb NOT NULL,
      UNIQUE(company_id,relationship_id,revision),
      FOREIGN KEY(company_id,project_id,relationship_id) REFERENCES %I(company_id,project_id,id) ON DELETE RESTRICT
    )',tbl || '_events',tbl);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tbl || '_events');
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',tbl || '_events');
    EXECUTE format('CREATE POLICY temporal_event_scope ON %I FOR ALL TO public
      USING(company_id=nullif(current_setting(''app.company_id'',true),'''')::uuid
        AND project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)
      WITH CHECK(company_id=nullif(current_setting(''app.company_id'',true),'''')::uuid
        AND project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',tbl || '_events');
    EXECUTE format('GRANT SELECT ON %I TO qsa_runtime',tbl || '_events');
    EXECUTE format('GRANT INSERT ON %I TO qsa_temporal_history_writer',tbl || '_events');
  END LOOP;
END $$;
CREATE INDEX assignment_truck_history_idx ON driver_truck_assignments(company_id,project_id,truck_id,lower(valid_period) DESC,id DESC);
CREATE INDEX allocation_material_dependency_idx ON truck_material_allocations(company_id,project_id,material_id)
  WHERE record_status='ACCEPTED' AND voided_at IS NULL;

CREATE FUNCTION qsa_validate_temporal_mutation() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid := nullif(current_setting('app.actor_id',true),'')::uuid;
  role_value text := nullif(current_setting('app.commercial_role',true),'');
  operation text := nullif(current_setting('app.operation_id',true),'');
  at_time timestamptz := nullif(current_setting('app.temporal_at',true),'')::timestamptz;
  valid_history boolean;
BEGIN
  -- Privileged historical reconciliation is a separate approved migration, not
  -- a normal runtime command. Old rows/provenance are never guessed here.
  IF session_user<>'qsa_runtime' THEN RETURN NEW; END IF;
  IF actor IS NULL OR operation IS NULL OR at_time IS NULL OR role_value IS NULL
    OR role_value NOT IN ('SUPER_ADMIN','COMPANY_ADMIN','PROJECT_ADMIN') THEN
    RAISE EXCEPTION 'TEMPORAL_CONTEXT_REQUIRED' USING ERRCODE='42501';
  END IF;
  PERFORM operation::uuid;
  IF TG_OP='INSERT' THEN
    IF NEW.record_status<>'ACCEPTED' OR NEW.voided_at IS NOT NULL OR NEW.revision<>1
      OR NEW.created_by IS DISTINCT FROM actor OR NEW.updated_by IS DISTINCT FROM actor
      OR NEW.created_role IS DISTINCT FROM role_value OR NEW.updated_role IS DISTINCT FROM role_value
      OR NEW.opened_operation_id IS DISTINCT FROM operation OR NEW.closed_operation_id IS NOT NULL
      OR NEW.created_at IS DISTINCT FROM at_time OR NEW.updated_at IS DISTINCT FROM at_time
      OR lower(NEW.valid_period) IS DISTINCT FROM at_time OR NOT upper_inf(NEW.valid_period)
      OR isempty(NEW.valid_period) THEN RAISE EXCEPTION 'INVALID_TEMPORAL_INSERT' USING ERRCODE='23514'; END IF;
    IF TG_TABLE_NAME='driver_truck_assignments' AND (NEW.external_id IS NULL OR NEW.external_id !~ '^ASN-[a-zA-Z0-9_-]{1,124}$')
      OR TG_TABLE_NAME='truck_material_allocations' AND (NEW.external_id IS NULL OR NEW.external_id !~ '^TMA-[a-zA-Z0-9_-]{1,124}$') THEN
      RAISE EXCEPTION 'TEMPORAL_EXTERNAL_ID_REQUIRED' USING ERRCODE='23514';
    END IF;
  ELSE
    IF OLD.record_status<>'ACCEPTED' OR OLD.voided_at IS NOT NULL OR NOT upper_inf(OLD.valid_period)
      OR OLD.revision<1 OR OLD.created_by IS NULL OR OLD.opened_operation_id IS NULL THEN
      RAISE EXCEPTION 'TEMPORAL_HISTORY_IMMUTABLE' USING ERRCODE='23514';
    END IF;
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I e WHERE e.company_id=$1 AND e.project_id=$2
      AND e.relationship_id=$3 AND e.revision=$4 AND jsonb_populate_record(NULL::public.%I,e.after_record)
      IS NOT DISTINCT FROM jsonb_populate_record(NULL::public.%I,$5))',TG_TABLE_NAME || '_events',TG_TABLE_NAME,TG_TABLE_NAME)
      INTO valid_history USING OLD.company_id,OLD.project_id,OLD.id,OLD.revision,to_jsonb(OLD);
    IF NOT valid_history THEN RAISE EXCEPTION 'TEMPORAL_HISTORY_IMMUTABLE' USING ERRCODE='23514'; END IF;
    IF (to_jsonb(NEW)-ARRAY['valid_period','revision','updated_by','updated_role','updated_at','closed_operation_id','close_reason'])
       IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['valid_period','revision','updated_by','updated_role','updated_at','closed_operation_id','close_reason'])
      OR NEW.revision<>OLD.revision+1 OR NEW.updated_by IS DISTINCT FROM actor OR NEW.updated_role IS DISTINCT FROM role_value
      OR NEW.updated_at IS DISTINCT FROM at_time OR NEW.closed_operation_id IS DISTINCT FROM operation
      OR lower(OLD.valid_period)>=at_time OR isempty(NEW.valid_period)
      OR lower(NEW.valid_period) IS DISTINCT FROM lower(OLD.valid_period)
      OR upper(NEW.valid_period) IS DISTINCT FROM at_time THEN
      RAISE EXCEPTION 'INVALID_TEMPORAL_CLOSURE' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION qsa_validate_temporal_mutation() FROM PUBLIC;

CREATE FUNCTION qsa_capture_temporal_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  IF session_user<>'qsa_runtime' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME NOT IN ('driver_carrier_affiliations','truck_carrier_affiliations',
    'driver_truck_assignments','truck_material_allocations') THEN RAISE EXCEPTION 'INVALID_TEMPORAL_EVENT_TARGET'; END IF;
  EXECUTE format('INSERT INTO public.%I
    (company_id,project_id,relationship_id,revision,operation_id,action,actor_id,actor_role,effective_at,before_record,after_record)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',TG_TABLE_NAME || '_events')
    USING NEW.company_id,NEW.project_id,NEW.id,NEW.revision,current_setting('app.operation_id'),
      coalesce(nullif(current_setting('app.temporal_action',true),''),TG_OP),NEW.updated_by,NEW.updated_role,NEW.updated_at,
      CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,to_jsonb(NEW);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION qsa_capture_temporal_event() FROM PUBLIC;
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['driver_carrier_affiliations','truck_carrier_affiliations',
    'driver_truck_assignments','truck_material_allocations'] LOOP
    EXECUTE format('CREATE TRIGGER temporal_mutation_guard BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION qsa_validate_temporal_mutation()',tbl);
    EXECUTE format('CREATE TRIGGER temporal_event_capture AFTER INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION qsa_capture_temporal_event()',tbl);
  END LOOP;
END $$;

GRANT CREATE ON SCHEMA public TO qsa_temporal_history_writer;
DO $$ BEGIN EXECUTE format('GRANT qsa_temporal_history_writer TO %I WITH SET TRUE,INHERIT FALSE',current_user); END $$;
ALTER FUNCTION qsa_capture_temporal_event() OWNER TO qsa_temporal_history_writer;
DO $$ BEGIN EXECUTE format('GRANT qsa_temporal_history_writer TO %I WITH SET FALSE,INHERIT FALSE',current_user); END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_temporal_history_writer;
