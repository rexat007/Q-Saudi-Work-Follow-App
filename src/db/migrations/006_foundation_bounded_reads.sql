-- AR2-U04. Published migrations 001-005 remain immutable.
ALTER TABLE project_foundation_summaries
  ADD COLUMN foundation_revision bigint NOT NULL DEFAULT 0 CHECK(foundation_revision>=0),
  ADD COLUMN source_revision bigint CHECK(source_revision>=0),
  ADD COLUMN valid_until timestamptz;
-- Read authorization uses the existing narrow NOLOGIN authorization capability.
CREATE FUNCTION qsa_authorize_project_read(external_project text)
RETURNS TABLE(project_id uuid,commercial_role text,authorization_scope text,
  project_version bigint,source_revision bigint,project_status text,scope_setting text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
  SELECT p.id,r.role,
    md5(jsonb_build_array(u.id,u.status,c.id,c.status,r.company_id,r.user_id,r.role,r.status,r.valid_from,r.valid_to,
      a.id,a.role,a.status,a.valid_period)::text),p.version,p.readiness_revision,p.status,
    set_config('app.project_id',p.id::text,true)
  FROM public.users u JOIN public.companies c ON c.id=nullif(current_setting('app.company_id',true),'')::uuid AND c.status='ACTIVE'
  JOIN public.projects p ON p.company_id=c.id AND p.external_id=external_project
  JOIN public.user_company_roles r ON r.company_id=c.id AND r.user_id=u.id AND r.status='ACTIVE'
    AND r.valid_from<=statement_timestamp() AND (r.valid_to IS NULL OR r.valid_to>statement_timestamp())
  LEFT JOIN public.project_access a ON a.company_id=c.id AND a.project_id=p.id AND a.user_id=u.id
    AND a.status='ACTIVE' AND a.valid_period @> statement_timestamp() AND a.role=r.role
  WHERE u.id=nullif(current_setting('app.actor_id',true),'')::uuid AND u.status='ACTIVE'
    AND (r.role IN ('SUPER_ADMIN','COMPANY_ADMIN') OR (r.role IN ('PROJECT_ADMIN','FINANCE_AUDITOR') AND a.id IS NOT NULL))
  ORDER BY CASE r.role WHEN 'SUPER_ADMIN' THEN 0 WHEN 'COMPANY_ADMIN' THEN 1 WHEN 'PROJECT_ADMIN' THEN 2 ELSE 3 END,r.created_at,a.id
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION qsa_authorize_project_read(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION qsa_authorize_project_read(text) TO qsa_runtime;
GRANT CREATE ON SCHEMA public TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user); END $$;
ALTER FUNCTION qsa_authorize_project_read(text) OWNER TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user); END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_command_authorizer;

GRANT SELECT ON project_foundation_summaries TO qsa_runtime;
GRANT SELECT(company_id,project_id,id) ON workspace_bindings TO qsa_runtime;
CREATE POLICY runtime_summary_project ON project_foundation_summaries AS RESTRICTIVE FOR SELECT TO qsa_runtime
  USING(project_id=nullif(current_setting('app.project_id',true),'')::uuid);
CREATE POLICY runtime_workspace_project ON workspace_bindings AS RESTRICTIVE FOR SELECT TO qsa_runtime
  USING(project_id=nullif(current_setting('app.project_id',true),'')::uuid);

DO $$ BEGIN
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='qsa_foundation_invalidator') THEN
    CREATE ROLE qsa_foundation_invalidator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF EXISTS(SELECT FROM pg_roles WHERE rolname='qsa_foundation_invalidator'
    AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication))
    OR EXISTS(SELECT FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='qsa_foundation_invalidator') THEN
    RAISE EXCEPTION 'Unsafe Foundation invalidator';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO qsa_foundation_invalidator;
GRANT SELECT(company_id,id,version,readiness_revision) ON projects TO qsa_foundation_invalidator;
GRANT UPDATE(version,readiness_revision) ON projects TO qsa_foundation_invalidator;
GRANT SELECT(company_id,project_id) ON project_foundation_summaries TO qsa_foundation_invalidator;
GRANT UPDATE(stale) ON project_foundation_summaries TO qsa_foundation_invalidator;
CREATE POLICY foundation_invalidation ON projects TO qsa_foundation_invalidator USING(true) WITH CHECK(true);
CREATE POLICY foundation_invalidation ON project_foundation_summaries TO qsa_foundation_invalidator USING(true) WITH CHECK(true);

CREATE FUNCTION qsa_invalidate_foundation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp AS $$
DECLARE row_value jsonb; previous jsonb; company uuid; project uuid; field text;
BEGIN
  IF TG_OP='UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
  row_value:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  company:=(row_value->>'company_id')::uuid;
  IF TG_TABLE_NAME IN ('drivers','trucks','carriers','materials') THEN
    field:=CASE TG_TABLE_NAME WHEN 'drivers' THEN 'driver_id' WHEN 'trucks' THEN 'truck_id' WHEN 'carriers' THEN 'carrier_id' ELSE 'material_id' END;
    EXECUTE format('UPDATE public.projects p SET version=version+1,readiness_revision=readiness_revision+1
      WHERE p.company_id=$1 AND p.id IN (SELECT project_id FROM public.%I WHERE company_id=$1 AND %I=$2)',
      'project_' || TG_TABLE_NAME,field) USING company,(row_value->>'id')::uuid;
  ELSIF TG_TABLE_NAME='projects' THEN
    UPDATE public.project_foundation_summaries SET stale=true WHERE company_id=company AND project_id=(row_value->>'id')::uuid;
  ELSE
    project:=(row_value->>'project_id')::uuid;
    UPDATE public.projects SET version=version+1,readiness_revision=readiness_revision+1 WHERE company_id=company AND id=project;
    -- A privileged reconciliation moving a reference invalidates both old and new scopes.
    IF TG_OP='UPDATE' THEN
      previous:=to_jsonb(OLD);
      IF (previous->>'company_id',previous->>'project_id') IS DISTINCT FROM (row_value->>'company_id',row_value->>'project_id') THEN
        UPDATE public.projects SET version=version+1,readiness_revision=readiness_revision+1
          WHERE company_id=(previous->>'company_id')::uuid AND id=(previous->>'project_id')::uuid;
      END IF;
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION qsa_invalidate_foundation() FROM PUBLIC;

CREATE FUNCTION qsa_project_read_revision() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog,pg_temp AS $$ BEGIN
  IF NEW IS DISTINCT FROM OLD THEN
    NEW.version:=greatest(NEW.version,OLD.version+1);
    NEW.readiness_revision:=greatest(NEW.readiness_revision,OLD.readiness_revision+1);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION qsa_project_read_revision() FROM PUBLIC;
CREATE TRIGGER project_read_revision BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION qsa_project_read_revision();
CREATE TRIGGER project_summary_invalidation AFTER UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION qsa_invalidate_foundation();

DO $$ DECLARE entity text; tbl text; field text; BEGIN
  FOREACH entity IN ARRAY ARRAY['drivers','trucks','carriers','materials'] LOOP
    field:=CASE entity WHEN 'drivers' THEN 'driver_id' WHEN 'trucks' THEN 'truck_id' WHEN 'carriers' THEN 'carrier_id' ELSE 'material_id' END;
    EXECUTE format('CREATE INDEX %I ON %I(company_id,project_id,id)', 'project_' || entity || '_page_idx','project_' || entity);
    EXECUTE format('CREATE INDEX %I ON %I(company_id,%I,project_id)', 'project_' || entity || '_invalidation_idx','project_' || entity,field);
    EXECUTE format('GRANT SELECT(company_id,project_id,%I) ON %I TO qsa_foundation_invalidator',field,'project_' || entity);
    EXECUTE format('CREATE POLICY foundation_invalidation ON %I FOR SELECT TO qsa_foundation_invalidator USING(true)','project_' || entity);
    EXECUTE format('CREATE TRIGGER foundation_global_invalidation AFTER UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION qsa_invalidate_foundation()',entity);
  END LOOP;
  FOREACH tbl IN ARRAY ARRAY['project_drivers','project_trucks','project_carriers','project_materials',
    'driver_carrier_affiliations','truck_carrier_affiliations','driver_truck_assignments','truck_material_allocations',
    'workspace_bindings','pricing_rules','trips','import_sessions','project_access'] LOOP
    EXECUTE format('CREATE TRIGGER foundation_dependency_invalidation AFTER INSERT OR UPDATE OR DELETE ON %I
      FOR EACH ROW EXECUTE FUNCTION qsa_invalidate_foundation()',tbl);
  END LOOP;
END $$;
GRANT CREATE ON SCHEMA public TO qsa_foundation_invalidator;
DO $$ BEGIN EXECUTE format('GRANT qsa_foundation_invalidator TO %I WITH SET TRUE,INHERIT FALSE',current_user); END $$;
ALTER FUNCTION qsa_invalidate_foundation() OWNER TO qsa_foundation_invalidator;
DO $$ BEGIN EXECUTE format('GRANT qsa_foundation_invalidator TO %I WITH SET FALSE,INHERIT FALSE',current_user); END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_foundation_invalidator;
