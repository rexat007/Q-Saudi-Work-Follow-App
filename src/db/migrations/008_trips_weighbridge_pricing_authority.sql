-- AR2-U06. Additive only: published migrations 001-007 stay immutable.
-- Legacy rows remain unclassified; no inferred driver, measurement or commercial facts.
ALTER TABLE projects ADD COLUMN operational_configuration jsonb;
ALTER TABLE trips ALTER COLUMN driver_id DROP NOT NULL;
ALTER TABLE trips ADD COLUMN source_row_key text, ADD COLUMN source_ticket_hmac bytea, ADD COLUMN authority_schema integer,
  ADD COLUMN created_by uuid REFERENCES users(id), ADD COLUMN updated_by uuid REFERENCES users(id),
  ADD COLUMN operational_snapshot jsonb, ADD COLUMN projection_encrypted text,
  ADD COLUMN last_event_at timestamptz,
  ADD CONSTRAINT trip_project_identity UNIQUE(company_id,project_id,id);
ALTER TABLE trip_events ADD COLUMN resulting_state text, ADD COLUMN actor_id uuid REFERENCES users(id),
  ADD COLUMN payload_schema_version integer, ADD COLUMN projection_digest text,
  ADD CONSTRAINT trip_event_project_fk FOREIGN KEY(company_id,project_id,trip_id) REFERENCES trips(company_id,project_id,id) NOT VALID,
  ADD CONSTRAINT trip_event_scope_identity UNIQUE(company_id,project_id,trip_id,id);
ALTER TABLE trip_weight_records ADD COLUMN event_id uuid, ADD COLUMN actor_id uuid REFERENCES users(id),
  ADD COLUMN source_correction jsonb, ADD COLUMN raw_value text, ADD COLUMN source_type text, ADD COLUMN source_file_hash text,
  ADD COLUMN source_event_key text, ADD COLUMN correction_of uuid,
  ADD COLUMN correction_reason text, ADD COLUMN observed_at timestamptz,
  ADD CONSTRAINT trip_weight_event_fk FOREIGN KEY(company_id,project_id,trip_id,event_id) REFERENCES trip_events(company_id,project_id,trip_id,id) DEFERRABLE INITIALLY DEFERRED NOT VALID,
  ADD CONSTRAINT trip_weight_identity UNIQUE(company_id,project_id,trip_id,id),
  ADD CONSTRAINT trip_weight_correction_fk FOREIGN KEY(company_id,project_id,trip_id,correction_of) REFERENCES trip_weight_records(company_id,project_id,trip_id,id) NOT VALID;
CREATE UNIQUE INDEX trip_weight_source_event ON trip_weight_records(company_id,project_id,source_type,source_event_key,measurement_type) WHERE source_event_key IS NOT NULL;
CREATE INDEX trip_weight_provenance ON trip_weight_records(company_id,project_id,trip_id,captured_at,id);
ALTER TABLE receipts ALTER COLUMN quantity_kg DROP NOT NULL;
ALTER TABLE receipts ADD COLUMN event_id uuid,
  ADD CONSTRAINT receipt_trip_project_fk FOREIGN KEY(company_id,project_id,trip_id) REFERENCES trips(company_id,project_id,id) NOT VALID,
  ADD CONSTRAINT receipt_event_fk FOREIGN KEY(company_id,project_id,trip_id,event_id) REFERENCES trip_events(company_id,project_id,trip_id,id) DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE exceptions ADD CONSTRAINT exception_trip_project_fk FOREIGN KEY(company_id,project_id,trip_id) REFERENCES trips(company_id,project_id,id) NOT VALID;
ALTER TABLE operational_adjustments ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE operational_adjustments ADD COLUMN rate_adjustment numeric(18,4), ADD COLUMN status text, ADD COLUMN request_encrypted text,
  ADD COLUMN external_id text, ADD COLUMN event_id uuid,
  ADD CONSTRAINT adjustment_trip_project_fk FOREIGN KEY(company_id,project_id,trip_id) REFERENCES trips(company_id,project_id,id) NOT VALID,
  ADD CONSTRAINT adjustment_external_identity UNIQUE(company_id,project_id,external_id);

CREATE TABLE trip_number_counters(
 company_id uuid NOT NULL,project_id uuid NOT NULL,next_number bigint NOT NULL CHECK(next_number>0),
 PRIMARY KEY(company_id,project_id),FOREIGN KEY(company_id,project_id) REFERENCES projects(company_id,id));
CREATE TABLE trip_driver_links(
 company_id uuid NOT NULL,user_id uuid NOT NULL REFERENCES users(id),driver_id uuid NOT NULL,status text NOT NULL CHECK(status IN ('ACTIVE','REVOKED')),
 PRIMARY KEY(company_id,user_id),FOREIGN KEY(company_id,driver_id) REFERENCES drivers(company_id,id));

ALTER TABLE pricing_rules ADD COLUMN external_id text, ADD COLUMN status text,
  ADD COLUMN commercial_terms jsonb, ADD COLUMN parent_rule_id uuid, ADD COLUMN successor_rule_id uuid,
  ADD COLUMN superseded_from timestamptz, ADD COLUMN created_by uuid REFERENCES users(id),
  ADD COLUMN updated_by uuid REFERENCES users(id),ADD COLUMN updated_at timestamptz,
  ADD CONSTRAINT pricing_scope_identity UNIQUE(company_id,project_id,id),
  ADD CONSTRAINT pricing_external_identity UNIQUE(company_id,project_id,external_id),
  ADD CONSTRAINT pricing_carrier_fk FOREIGN KEY(company_id,carrier_id) REFERENCES carriers(company_id,id) NOT VALID,
  ADD CONSTRAINT pricing_material_fk FOREIGN KEY(company_id,material_id) REFERENCES materials(company_id,id) NOT VALID,
  ADD CONSTRAINT pricing_parent_fk FOREIGN KEY(company_id,project_id,parent_rule_id) REFERENCES pricing_rules(company_id,project_id,id) DEFERRABLE INITIALLY DEFERRED NOT VALID,
  ADD CONSTRAINT pricing_successor_fk FOREIGN KEY(company_id,project_id,successor_rule_id) REFERENCES pricing_rules(company_id,project_id,id) DEFERRABLE INITIALLY DEFERRED NOT VALID;
CREATE INDEX pricing_resolution_scope ON pricing_rules(company_id,project_id,carrier_id,material_id,status);
CREATE INDEX pricing_resolution_period ON pricing_rules USING gist(company_id,project_id,effective_period);
CREATE TABLE pricing_rule_revisions(
 id uuid PRIMARY KEY,company_id uuid NOT NULL,project_id uuid NOT NULL,rule_id uuid NOT NULL,
 commercial_revision bigint NOT NULL,terms jsonb NOT NULL,rate numeric(18,4) NOT NULL CHECK(rate>0),
 actor_id uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(company_id,project_id,rule_id,commercial_revision),UNIQUE(company_id,project_id,id),
 FOREIGN KEY(company_id,project_id,rule_id) REFERENCES pricing_rules(company_id,project_id,id));
-- Old required zero-like fields become nullable for honest pending terms. Existing values stay unchanged.
ALTER TABLE pricing_snapshots ALTER COLUMN pricing_rule_id DROP NOT NULL,
 ALTER COLUMN pricing_rule_version DROP NOT NULL,ALTER COLUMN rate DROP NOT NULL,
 ALTER COLUMN quantity_basis DROP NOT NULL,ALTER COLUMN tax DROP NOT NULL,ALTER COLUMN final_amount DROP NOT NULL;
ALTER TABLE pricing_snapshots ADD COLUMN terms_revision_id uuid,ADD COLUMN resolution_status text,
 ADD COLUMN frozen_terms jsonb,ADD COLUMN priced_at timestamptz,
 ADD CONSTRAINT snapshot_trip_project_fk FOREIGN KEY(company_id,project_id,trip_id) REFERENCES trips(company_id,project_id,id) NOT VALID,
 ADD CONSTRAINT snapshot_rule_version_fk FOREIGN KEY(company_id,project_id,terms_revision_id) REFERENCES pricing_rule_revisions(company_id,project_id,id) NOT VALID,
 ADD CONSTRAINT snapshot_scope_identity UNIQUE(company_id,project_id,id);
CREATE TABLE trip_settlements(
 id uuid PRIMARY KEY,company_id uuid NOT NULL,project_id uuid NOT NULL,trip_id uuid NOT NULL,event_id uuid NOT NULL,
 snapshot_id uuid NOT NULL,version bigint NOT NULL,status text NOT NULL CHECK(status IN ('PENDING_PRICING','PENDING_QUANTITY','PROVISIONAL','FINAL')),
 terms_revision_id uuid,quantity_kg numeric(18,3),quantity_basis numeric(18,3),base_amount numeric(18,2),
 demurrage numeric(18,2),deductions numeric(18,2),adjustment numeric(18,2),quoted_amount numeric(18,2),subtotal numeric(18,2),tax numeric(18,2),final_amount numeric(18,2),
 evidence jsonb NOT NULL,reason text NOT NULL,actor_id uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(company_id,project_id,trip_id,version),
 FOREIGN KEY(company_id,project_id,trip_id,event_id) REFERENCES trip_events(company_id,project_id,trip_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(company_id,project_id,snapshot_id) REFERENCES pricing_snapshots(company_id,project_id,id),
 FOREIGN KEY(company_id,project_id,terms_revision_id) REFERENCES pricing_rule_revisions(company_id,project_id,id),
 CHECK(status<>'FINAL' OR (terms_revision_id IS NOT NULL AND base_amount IS NOT NULL AND final_amount IS NOT NULL)));
CREATE INDEX trip_settlement_latest ON trip_settlements(company_id,project_id,trip_id,version DESC);

CREATE FUNCTION qsa_trip_append_only() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN RAISE EXCEPTION 'TRIP_HISTORY_IMMUTABLE' USING ERRCODE='23514'; END $$;
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['trip_events','trip_weight_records','receipts','pricing_snapshots','pricing_rule_revisions','trip_settlements'] LOOP
  EXECUTE format('CREATE TRIGGER trip_immutable BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION qsa_trip_append_only()',t);
 END LOOP;
END $$;
-- Validate the accepted event stream's latest projection at transaction end.
CREATE FUNCTION qsa_trip_projection_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
DECLARE t record;e record;BEGIN
 SELECT * INTO t FROM public.trips WHERE company_id=NEW.company_id AND id=NEW.id;
 IF t.authority_schema IS DISTINCT FROM 1 THEN RETURN NULL;END IF;
 SELECT * INTO e FROM public.trip_events WHERE company_id=t.company_id AND trip_id=t.id ORDER BY seq DESC LIMIT 1;
 IF e.seq IS DISTINCT FROM t.version OR e.resulting_state IS DISTINCT FROM t.state
  OR e.projection_digest IS DISTINCT FROM md5(t.projection_encrypted) THEN
  RAISE EXCEPTION 'TRIP_EVENT_PROJECTION_MISMATCH' USING ERRCODE='23514';END IF;
 RETURN NULL;END $$;
CREATE CONSTRAINT TRIGGER trip_projection_consistency AFTER INSERT OR UPDATE ON trips DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION qsa_trip_projection_guard();
CREATE FUNCTION qsa_trip_event_order() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
DECLARE n bigint;BEGIN
 PERFORM 1 FROM public.trips WHERE company_id=NEW.company_id AND project_id=NEW.project_id AND id=NEW.trip_id FOR UPDATE;
 SELECT seq INTO n FROM public.trip_events WHERE company_id=NEW.company_id AND trip_id=NEW.trip_id ORDER BY seq DESC LIMIT 1;
 IF NEW.seq<>coalesce(n,0)+1 THEN RAISE EXCEPTION 'TRIP_EVENT_SEQUENCE_CONFLICT' USING ERRCODE='23514';END IF;
 RETURN NEW;END $$;
CREATE TRIGGER trip_event_sequence BEFORE INSERT ON trip_events FOR EACH ROW EXECUTE FUNCTION qsa_trip_event_order();
CREATE INDEX trip_events_latest ON trip_events(company_id,project_id,trip_id,seq DESC);
CREATE INDEX trip_read_page ON trips(company_id,project_id,external_id);

-- Narrow current-authority capability; no new access to account tables for runtime.
GRANT SELECT,UPDATE(user_id) ON trip_driver_links TO qsa_command_authorizer;
CREATE FUNCTION qsa_authorize_trip_command()
RETURNS TABLE(commercial_role text,project_status text,linked_driver_id uuid,company_timezone text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;
 c uuid:=nullif(current_setting('app.company_id',true),'')::uuid;p uuid:=nullif(current_setting('app.project_id',true),'')::uuid;
 r text;s text;d uuid;z text;BEGIN
 IF a IS NULL OR c IS NULL OR p IS NULL THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.users WHERE id=a AND status='ACTIVE' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE' USING ERRCODE='42501';END IF;
 SELECT timezone INTO z FROM public.companies WHERE id=c AND status='ACTIVE' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501';END IF;
 SELECT status INTO s FROM public.projects WHERE id=p AND company_id=c FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND' USING ERRCODE='42501';END IF;
 SELECT role INTO r FROM public.user_company_roles WHERE company_id=c AND user_id=a AND status='ACTIVE'
  AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())
  AND role IN ('SUPER_ADMIN','PROJECT_ADMIN','DISPATCHER','SUPERVISOR','SITE_SUPERVISOR','SCALE_OPERATOR','DRIVER','FINANCE_AUDITOR','VIEWER')
  ORDER BY CASE role WHEN 'SUPER_ADMIN' THEN 0 WHEN 'PROJECT_ADMIN' THEN 1 ELSE 2 END,id LIMIT 1 FOR SHARE;
 IF r IS NULL THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501';END IF;
 IF r<>'SUPER_ADMIN' THEN
  PERFORM 1 FROM public.project_access WHERE company_id=c AND project_id=p AND user_id=a AND role=r AND status='ACTIVE' AND valid_period @> clock_timestamp() FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_GLOBAL_COMMAND' USING ERRCODE='42501';END IF;
 END IF;
 SELECT driver_id INTO d FROM public.trip_driver_links WHERE company_id=c AND user_id=a AND status='ACTIVE' FOR SHARE;
 RETURN QUERY SELECT r,s,d,z;
END $$;
REVOKE ALL ON FUNCTION qsa_authorize_trip_command() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION qsa_authorize_trip_command() TO qsa_runtime;
GRANT CREATE ON SCHEMA public TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
ALTER FUNCTION qsa_authorize_trip_command() OWNER TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_command_authorizer;

DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['trip_number_counters','trip_driver_links','pricing_rule_revisions','trip_settlements'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format($p$CREATE POLICY tenant_scope ON %I USING(company_id=nullif(current_setting('app.company_id',true),'')::uuid) WITH CHECK(company_id=nullif(current_setting('app.company_id',true),'')::uuid)$p$,t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['trips','trip_events','trip_weight_records','receipts','pricing_rules','pricing_snapshots','exceptions','operational_adjustments','trip_number_counters','pricing_rule_revisions','trip_settlements'] LOOP
  EXECUTE format($p$CREATE POLICY trip_project_scope ON %I AS RESTRICTIVE TO qsa_runtime USING(project_id=nullif(current_setting('app.project_id',true),'')::uuid) WITH CHECK(project_id=nullif(current_setting('app.project_id',true),'')::uuid)$p$,t);
 END LOOP;
END $$;
CREATE POLICY trip_authorization_lookup ON trip_driver_links FOR SELECT TO qsa_command_authorizer USING(true);
GRANT SELECT,INSERT ON trips,trip_events,trip_weight_records,receipts,pricing_rules,pricing_rule_revisions,pricing_snapshots,trip_settlements,exceptions,operational_adjustments,trip_number_counters TO qsa_runtime;
GRANT UPDATE(source_ticket_hmac,state,version,driver_id,updated_at,updated_by,last_event_at,projection_encrypted) ON trips TO qsa_runtime;
GRANT UPDATE(next_number) ON trip_number_counters TO qsa_runtime;
GRANT UPDATE(carrier_id,material_id,pricing_model,tax_policy,version,status,commercial_terms,rate,effective_period,parent_rule_id,successor_rule_id,superseded_from,updated_at,updated_by) ON pricing_rules TO qsa_runtime;
GRANT UPDATE(status,resolved_by,event_id) ON operational_adjustments TO qsa_runtime;
-- No generic account, configuration or driver-link writes are granted.

ALTER TABLE pricing_rules ADD CONSTRAINT active_pricing_window_exclusion EXCLUDE USING gist
(company_id WITH =,project_id WITH =,carrier_id WITH =,(coalesce(material_id,'00000000-0000-0000-0000-000000000000'::uuid)) WITH =,effective_period WITH &&) WHERE(status='ACTIVE');
CREATE UNIQUE INDEX trip_weight_ticket_identity ON trip_weight_records(company_id,project_id,source_type,source_ref,measurement_type)
 WHERE source_ref IS NOT NULL AND source_type IN ('MANUAL','WEIGHBRIDGE','API') AND authority_status<>'APPROVED_CORRECTION';
CREATE INDEX trip_weight_page ON trip_weight_records(company_id,project_id,trip_id,id);
CREATE UNIQUE INDEX trip_source_row_once ON trips(company_id,project_id,source_row_key) WHERE source_row_key IS NOT NULL;
CREATE UNIQUE INDEX trip_source_ticket_once ON trips(company_id,project_id,source_ticket_hmac) WHERE source_ticket_hmac IS NOT NULL;
CREATE FUNCTION qsa_trip_source_key_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN IF OLD.source_row_key IS DISTINCT FROM NEW.source_row_key OR OLD.source_ticket_hmac IS NOT NULL AND OLD.source_ticket_hmac IS DISTINCT FROM NEW.source_ticket_hmac THEN
 RAISE EXCEPTION 'TRIP_SOURCE_IDENTITY_IMMUTABLE' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER trip_source_key_immutable BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION qsa_trip_source_key_guard();

CREATE INDEX trip_settlement_terms_usage ON trip_settlements(company_id,project_id,terms_revision_id) WHERE terms_revision_id IS NOT NULL;
