-- U09 source preparation only. Published migrations 001-010 are immutable.
-- Nothing arms enforcement, advances the epoch or migrates business data here.
CREATE TABLE runtime_write_enforcement(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enforced boolean NOT NULL DEFAULT false);
INSERT INTO runtime_write_enforcement VALUES(true,false);
REVOKE ALL ON runtime_write_enforcement FROM PUBLIC,qsa_runtime,qsa_auth,qsa_worker;
GRANT SELECT,UPDATE(singleton) ON runtime_write_enforcement TO qsa_command_authorizer;
CREATE FUNCTION qsa_enforcement_forward_only() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'RUNTIME_ENFORCEMENT_REGRESSION' USING ERRCODE='23514';END IF;
 IF OLD.enforced AND NOT NEW.enforced THEN RAISE EXCEPTION 'RUNTIME_ENFORCEMENT_REGRESSION' USING ERRCODE='23514';END IF;
 IF NEW.enforced AND NOT EXISTS(SELECT 1 FROM public.backend_authority_epoch WHERE singleton AND canonical_store='postgres') THEN RAISE EXCEPTION 'SQL_EPOCH_REQUIRED' USING ERRCODE='23514';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER runtime_enforcement_forward BEFORE UPDATE OR DELETE ON runtime_write_enforcement FOR EACH ROW EXECUTE FUNCTION qsa_enforcement_forward_only();
CREATE FUNCTION qsa_read_runtime_state() RETURNS TABLE(backend_epoch text,epoch_revision bigint,canonical_store text,enforced boolean)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT e.backend_epoch,e.epoch_revision,e.canonical_store,g.enforced FROM public.backend_authority_epoch e CROSS JOIN public.runtime_write_enforcement g WHERE e.singleton AND g.singleton $$;
CREATE FUNCTION qsa_assert_runtime_writer(expected_epoch text,expected_revision bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 -- All writer/activation lock acquisition follows guard -> epoch order.
 PERFORM 1 FROM public.runtime_write_enforcement WHERE singleton FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'RUNTIME_ENFORCEMENT_UNVERIFIED' USING ERRCODE='P0001';END IF;
 PERFORM public.qsa_assert_offline_epoch(expected_epoch,expected_revision);
 PERFORM set_config('app.writer_epoch',expected_epoch,true);
 PERFORM set_config('app.writer_epoch_revision',expected_revision::text,true);
END $$;
CREATE FUNCTION qsa_assert_runtime_read(expected_epoch text,expected_revision bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 -- A READ ONLY repeatable-read transaction verifies its own consistent snapshot.
 IF NOT EXISTS(SELECT 1 FROM public.backend_authority_epoch WHERE singleton AND canonical_store='postgres' AND backend_epoch=expected_epoch AND epoch_revision=expected_revision) THEN
  RAISE EXCEPTION 'BACKEND_EPOCH_MISMATCH' USING ERRCODE='P0001';END IF;
END $$;
CREATE FUNCTION qsa_guard_runtime_write() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE armed boolean;
BEGIN
 IF session_user='qsa_runtime' OR current_setting('role',true)='qsa_runtime' THEN
  SELECT enforced INTO armed FROM public.runtime_write_enforcement WHERE singleton FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RUNTIME_ENFORCEMENT_UNVERIFIED' USING ERRCODE='P0001';END IF;
  IF armed THEN
   IF nullif(current_setting('app.writer_epoch',true),'') IS NULL OR nullif(current_setting('app.writer_epoch_revision',true),'') IS NULL THEN
    RAISE EXCEPTION 'RUNTIME_WRITER_FENCE_REQUIRED' USING ERRCODE='42501';END IF;
   PERFORM public.qsa_assert_offline_epoch(current_setting('app.writer_epoch'),current_setting('app.writer_epoch_revision')::bigint);
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION qsa_enforcement_forward_only(),qsa_read_runtime_state(),qsa_assert_runtime_writer(text,bigint),qsa_assert_runtime_read(text,bigint),qsa_guard_runtime_write() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION qsa_read_runtime_state(),qsa_assert_runtime_writer(text,bigint),qsa_assert_runtime_read(text,bigint) TO qsa_runtime;
GRANT CREATE ON SCHEMA public TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
ALTER FUNCTION qsa_read_runtime_state() OWNER TO qsa_command_authorizer;
ALTER FUNCTION qsa_assert_runtime_writer(text,bigint) OWNER TO qsa_command_authorizer;
ALTER FUNCTION qsa_assert_runtime_read(text,bigint) OWNER TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_command_authorizer;

-- Private read-only fingerprint capability; never returns raw profiles/source cells.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='qsa_reconciliation_reader') THEN
  CREATE ROLE qsa_reconciliation_reader NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='qsa_reconciliation_reader' AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication)) THEN RAISE EXCEPTION 'UNSAFE_RECONCILIATION_ROLE';END IF;
END $$;
GRANT USAGE ON SCHEMA public TO qsa_reconciliation_reader;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
SET LOCAL ROLE qsa_command_authorizer;
GRANT EXECUTE ON FUNCTION qsa_authorize_canonical_command(boolean) TO qsa_reconciliation_reader;
RESET ROLE;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
CREATE TABLE runtime_reconciliation_revisions(company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,scope_id uuid NOT NULL,revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),PRIMARY KEY(company_id,scope_id));
REVOKE ALL ON runtime_reconciliation_revisions FROM PUBLIC,qsa_runtime,qsa_auth,qsa_worker;
GRANT SELECT,INSERT,UPDATE ON runtime_reconciliation_revisions TO qsa_reconciliation_reader;
ALTER TABLE runtime_reconciliation_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_reconciliation_revisions FORCE ROW LEVEL SECURITY;
CREATE POLICY reconciliation_internal ON runtime_reconciliation_revisions TO qsa_reconciliation_reader USING(true) WITH CHECK(true);
CREATE FUNCTION qsa_bump_reconciliation_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE body jsonb;previous jsonb;company uuid;scope uuid;old_company uuid;old_scope uuid;
BEGIN
 IF TG_OP='DELETE' THEN body:=to_jsonb(OLD);ELSE body:=to_jsonb(NEW);END IF;
 IF TG_TABLE_NAME='companies' THEN
  IF TG_OP='DELETE' THEN RETURN OLD;END IF;company:=(body->>'id')::uuid;
 ELSIF TG_TABLE_NAME='users' THEN
  FOR company IN SELECT DISTINCT r.company_id FROM public.user_company_roles r WHERE r.user_id=(body->>'id')::uuid LOOP
   INSERT INTO public.runtime_reconciliation_revisions VALUES(company,'00000000-0000-0000-0000-000000000000',1)
    ON CONFLICT(company_id,scope_id) DO UPDATE SET revision=runtime_reconciliation_revisions.revision+1;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
 ELSE company:=nullif(body->>'company_id','')::uuid;END IF;
 IF TG_OP='UPDATE' AND TG_TABLE_NAME NOT IN('companies','users') THEN
  previous:=to_jsonb(OLD);
  IF (previous->>'company_id',previous->>'project_id',previous->>'event_id') IS DISTINCT FROM (body->>'company_id',body->>'project_id',body->>'event_id') THEN
   old_company:=nullif(previous->>'company_id','')::uuid;old_scope:=nullif(previous->>'project_id','')::uuid;
   IF TG_TABLE_NAME='projects' THEN old_scope:=(previous->>'id')::uuid;END IF;
   IF TG_TABLE_NAME='worker_jobs' THEN SELECT e.project_id INTO old_scope FROM public.outbox_events e WHERE e.company_id=old_company AND e.id=(previous->>'event_id')::uuid;END IF;
   IF old_company IS NOT NULL THEN INSERT INTO public.runtime_reconciliation_revisions VALUES(old_company,coalesce(old_scope,'00000000-0000-0000-0000-000000000000'),1)
    ON CONFLICT(company_id,scope_id) DO UPDATE SET revision=runtime_reconciliation_revisions.revision+1;END IF;
  END IF;
 END IF;
 IF company IS NOT NULL THEN
  scope:=nullif(body->>'project_id','')::uuid;
  IF TG_TABLE_NAME='projects' THEN scope:=(body->>'id')::uuid;END IF;
  IF TG_TABLE_NAME='worker_jobs' THEN SELECT e.project_id INTO scope FROM public.outbox_events e WHERE e.company_id=company AND e.id=(body->>'event_id')::uuid;END IF;
  INSERT INTO public.runtime_reconciliation_revisions VALUES(company,coalesce(scope,'00000000-0000-0000-0000-000000000000'),1)
   ON CONFLICT(company_id,scope_id) DO UPDATE SET revision=runtime_reconciliation_revisions.revision+1;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE FUNCTION qsa_readiness_revisions() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE company uuid:=nullif(current_setting('app.company_id',true),'')::uuid;project uuid:=nullif(current_setting('app.project_id',true),'')::uuid;result jsonb;
BEGIN
 PERFORM public.qsa_authorize_canonical_command(true);
 INSERT INTO public.runtime_reconciliation_revisions VALUES(company,'00000000-0000-0000-0000-000000000000',0),(company,project,0) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.runtime_reconciliation_revisions WHERE company_id=company AND scope_id IN(project,'00000000-0000-0000-0000-000000000000') ORDER BY scope_id FOR SHARE;
 SELECT jsonb_object_agg(scope_id::text,revision::text) INTO result FROM public.runtime_reconciliation_revisions WHERE company_id=company AND scope_id IN(project,'00000000-0000-0000-0000-000000000000');RETURN result;
END $$;
CREATE FUNCTION qsa_readiness_inventory(table_name text,after_key text,page_limit integer) RETURNS TABLE(row_key text,row_digest text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp SET timezone='UTC' AS $$
DECLARE company uuid:=nullif(current_setting('app.company_id',true),'')::uuid;project uuid:=nullif(current_setting('app.project_id',true),'')::uuid;predicate text;key_expression text;
BEGIN
 PERFORM public.qsa_authorize_canonical_command(true);
 IF table_name IS NULL OR page_limit IS NULL OR NOT(table_name=ANY(ARRAY['companies','users','user_company_roles','projects','project_access','carriers','materials','drivers','trucks','identity_keys','identity_key_reservations','project_carriers','project_materials','project_drivers','project_trucks','driver_carrier_affiliations','truck_carrier_affiliations','driver_truck_assignments','truck_material_allocations','pricing_rules','trips','trip_events','trip_weight_records','receipts','pricing_snapshots','exceptions','operational_adjustments','import_sessions','import_source_artifacts','import_row_decisions','import_execution_groups','import_execution_receipts','idempotency_receipts','audit_events','outbox_events','worker_jobs','workspace_bindings','workspace_sync_receipts','project_foundation_summaries','report_snapshots','migration_runs','legacy_identity_mappings','import_artifact_chunks','import_executions','trip_number_counters','trip_driver_links','pricing_rule_revisions','trip_settlements'])) OR page_limit<1 OR page_limit>51 OR length(coalesce(after_key,''))>2048 THEN RAISE EXCEPTION 'INVALID_INVENTORY_PAGE' USING ERRCODE='22023';END IF;
 SELECT 'jsonb_build_array('||string_agg(format('to_jsonb(t)->%L',a.attname),',' ORDER BY c.ordinality)||')::text' INTO key_expression
  FROM pg_index i CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY c(attnum,ordinality)
  JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=c.attnum
  WHERE i.indrelid=to_regclass('public.'||table_name) AND i.indisprimary;
 IF key_expression IS NULL THEN RAISE EXCEPTION 'UNCLASSIFIED_INVENTORY_KEY';END IF;
 IF table_name='companies' THEN predicate:='t.id=$1';
 ELSIF table_name='users' THEN predicate:='EXISTS(SELECT 1 FROM public.user_company_roles r WHERE r.company_id=$1 AND r.user_id=t.id)';
 ELSE
  predicate:='t.company_id=$1';
  IF table_name='projects' THEN predicate:=predicate||' AND t.id=$2';
  ELSIF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.'||table_name) AND attname='project_id' AND NOT attisdropped) THEN predicate:=predicate||' AND t.project_id=$2';
  ELSIF table_name='worker_jobs' THEN predicate:=predicate||' AND EXISTS(SELECT 1 FROM public.outbox_events e WHERE e.company_id=$1 AND e.project_id=$2 AND e.id=t.event_id)';END IF;
 END IF;
 RETURN QUERY EXECUTE format('SELECT q.k,q.d FROM (SELECT %s k,encode(sha256(convert_to(to_jsonb(t)::text,''UTF8'')),''hex'') d FROM public.%I t WHERE %s) q WHERE ($3 IS NULL OR q.k COLLATE "C">$3 COLLATE "C") ORDER BY q.k COLLATE "C" LIMIT $4',key_expression,table_name,predicate) USING company,project,after_key,page_limit;
END $$;
CREATE FUNCTION qsa_readiness_schema() RETURNS TABLE(version text,checksum text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN PERFORM public.qsa_authorize_canonical_command(true);RETURN QUERY SELECT s.version,s.checksum FROM public.schema_migrations s ORDER BY s.version;END $$;
CREATE FUNCTION qsa_readiness_pending_receipts() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE result bigint;BEGIN PERFORM public.qsa_authorize_canonical_command(true);
 SELECT count(*) INTO result FROM public.idempotency_receipts r WHERE r.company_id=nullif(current_setting('app.company_id',true),'')::uuid AND r.project_id=nullif(current_setting('app.project_id',true),'')::uuid AND r.state<>'COMMITTED';RETURN result;END $$;
REVOKE ALL ON FUNCTION qsa_bump_reconciliation_revision(),qsa_readiness_revisions(),qsa_readiness_inventory(text,text,integer),qsa_readiness_schema(),qsa_readiness_pending_receipts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION qsa_readiness_revisions(),qsa_readiness_inventory(text,text,integer),qsa_readiness_schema(),qsa_readiness_pending_receipts() TO qsa_runtime;
DO $$ DECLARE tbl text;BEGIN
 FOREACH tbl IN ARRAY ARRAY['companies','users','user_company_roles','projects','project_access','carriers','materials','drivers','trucks','identity_keys','identity_key_reservations','project_carriers','project_materials','project_drivers','project_trucks','driver_carrier_affiliations','truck_carrier_affiliations','driver_truck_assignments','truck_material_allocations','pricing_rules','trips','trip_events','trip_weight_records','receipts','pricing_snapshots','exceptions','operational_adjustments','import_sessions','import_source_artifacts','import_row_decisions','import_execution_groups','import_execution_receipts','idempotency_receipts','audit_events','outbox_events','worker_jobs','workspace_bindings','workspace_sync_receipts','project_foundation_summaries','report_snapshots','migration_runs','legacy_identity_mappings','import_artifact_chunks','import_executions','trip_number_counters','trip_driver_links','pricing_rule_revisions','trip_settlements'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO qsa_reconciliation_reader',tbl);
  IF EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.'||tbl) AND relrowsecurity) THEN EXECUTE format('CREATE POLICY reconciliation_internal ON public.%I TO qsa_reconciliation_reader USING(true)',tbl);END IF;
  EXECUTE format('CREATE TRIGGER runtime_writer_epoch_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION qsa_guard_runtime_write()',tbl);
  EXECUTE format('CREATE TRIGGER runtime_reconciliation_revision AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION qsa_bump_reconciliation_revision()',tbl);
 END LOOP;
END $$;
GRANT CREATE ON SCHEMA public TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
ALTER FUNCTION qsa_guard_runtime_write() OWNER TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_command_authorizer;
GRANT SELECT ON schema_migrations TO qsa_reconciliation_reader;
GRANT CREATE ON SCHEMA public TO qsa_reconciliation_reader;
DO $$ BEGIN EXECUTE format('GRANT qsa_reconciliation_reader TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
ALTER FUNCTION qsa_bump_reconciliation_revision() OWNER TO qsa_reconciliation_reader;
ALTER FUNCTION qsa_readiness_revisions() OWNER TO qsa_reconciliation_reader;
ALTER FUNCTION qsa_readiness_inventory(text,text,integer) OWNER TO qsa_reconciliation_reader;
ALTER FUNCTION qsa_readiness_schema() OWNER TO qsa_reconciliation_reader;
ALTER FUNCTION qsa_readiness_pending_receipts() OWNER TO qsa_reconciliation_reader;
DO $$ BEGIN EXECUTE format('GRANT qsa_reconciliation_reader TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_reconciliation_reader;

CREATE TABLE runtime_readiness_runs(
 id uuid PRIMARY KEY,company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,project_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES users(id),
 manifest_digest text NOT NULL CHECK(manifest_digest~'^[0-9a-f]{64}$'),source_watermark text NOT NULL,target_revisions jsonb NOT NULL,
 table_position integer NOT NULL DEFAULT 0,after_key text,state text NOT NULL CHECK(state IN('RUNNING','VERIFIED','BLOCKED')),
 version bigint NOT NULL DEFAULT 1,verified_rows integer NOT NULL DEFAULT 0,last_error_code text,
 FOREIGN KEY(company_id,project_id) REFERENCES projects(company_id,id) ON DELETE CASCADE);
CREATE TABLE runtime_readiness_pages(
 id uuid PRIMARY KEY,company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,project_id uuid NOT NULL,run_id uuid NOT NULL REFERENCES runtime_readiness_runs(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,request_digest text NOT NULL,result jsonb NOT NULL,UNIQUE(company_id,project_id,run_id,request_id),
 FOREIGN KEY(company_id,project_id) REFERENCES projects(company_id,id) ON DELETE CASCADE);
DO $$ DECLARE tbl text;BEGIN FOREACH tbl IN ARRAY ARRAY['runtime_readiness_runs','runtime_readiness_pages'] LOOP
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,qsa_runtime,qsa_auth,qsa_worker',tbl);
 IF tbl='runtime_readiness_pages' THEN EXECUTE format('GRANT SELECT,INSERT ON public.%I TO qsa_runtime',tbl);ELSE EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO qsa_runtime',tbl);END IF;
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tbl);EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',tbl);
 EXECUTE format($policy$CREATE POLICY readiness_scope ON public.%I TO qsa_runtime USING(company_id=nullif(current_setting('app.company_id',true),'')::uuid AND project_id=nullif(current_setting('app.project_id',true),'')::uuid) WITH CHECK(company_id=nullif(current_setting('app.company_id',true),'')::uuid AND project_id=nullif(current_setting('app.project_id',true),'')::uuid)$policy$,tbl);
 END LOOP;END $$;
