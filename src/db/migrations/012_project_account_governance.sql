-- RB1 additive authority only. Published 001-011 are immutable. No production activation.
ALTER TABLE users DROP CONSTRAINT users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK(status IN('PENDING_APPROVAL','ACTIVE','REJECTED','SUSPENDED'));
ALTER TABLE users ADD COLUMN governance_revision bigint NOT NULL DEFAULT 0 CHECK(governance_revision>=0);
ALTER TABLE projects ADD COLUMN governance_foundation jsonb, ADD COLUMN created_by uuid REFERENCES users(id), ADD COLUMN updated_by uuid REFERENCES users(id);
CREATE TABLE account_applications(company_id uuid NOT NULL REFERENCES companies(id),user_id uuid NOT NULL REFERENCES users(id),status text NOT NULL CHECK(status IN('PENDING_APPROVAL','ACTIVE','REJECTED','SUSPENDED')),revision bigint NOT NULL DEFAULT 0,requested_role text,request_encrypted text,approved_role text,approved_by uuid REFERENCES users(id),approved_at timestamptz,rejected_by uuid REFERENCES users(id),rejected_at timestamptz,rejection_encrypted text,suspended_roles text[],updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(company_id,user_id));
CREATE TABLE governance_receipts(company_id uuid NOT NULL REFERENCES companies(id),actor_id uuid NOT NULL REFERENCES users(id),operation_id text NOT NULL,project_id uuid,request_digest text NOT NULL,result_encrypted text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(company_id,actor_id,operation_id),FOREIGN KEY(company_id,project_id) REFERENCES projects(company_id,id));
CREATE TABLE governance_history(id uuid PRIMARY KEY,company_id uuid NOT NULL REFERENCES companies(id),project_id uuid,actor_id uuid NOT NULL REFERENCES users(id),operation_id text NOT NULL,command text NOT NULL,target text NOT NULL,before_encrypted text NOT NULL,after_encrypted text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),FOREIGN KEY(company_id,project_id) REFERENCES projects(company_id,id));
CREATE TABLE governance_access_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES companies(id),project_id uuid,actor_id uuid REFERENCES users(id),operation_id text,table_name text NOT NULL,before_record jsonb,after_record jsonb,origin text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),FOREIGN KEY(company_id,project_id) REFERENCES projects(company_id,id));
CREATE TABLE governance_inventory_revisions(company_id uuid NOT NULL REFERENCES companies(id),scope_id uuid NOT NULL,revision bigint NOT NULL DEFAULT 0,PRIMARY KEY(company_id,scope_id));
CREATE TABLE governance_project_counter(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),next_number bigint NOT NULL CHECK(next_number>0));
CREATE UNIQUE INDEX governance_active_driver_owner ON trip_driver_links(company_id,driver_id) WHERE status='ACTIVE';
CREATE INDEX governance_project_inventory ON projects(company_id,id);
CREATE INDEX governance_access_inventory ON project_access(company_id,user_id,status,project_id);
CREATE INDEX governance_account_inventory ON account_applications(company_id,user_id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='qsa_governance_authorizer') THEN CREATE ROLE qsa_governance_authorizer NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='qsa_governance_authorizer' AND(rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication)) OR EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='qsa_governance_authorizer') THEN RAISE EXCEPTION 'UNSAFE_GOVERNANCE_ROLE';END IF;
END $$;
GRANT USAGE ON SCHEMA public TO qsa_governance_authorizer;
GRANT SELECT,INSERT,UPDATE ON users,user_company_roles,projects,project_access,trip_driver_links TO qsa_governance_authorizer;
GRANT SELECT,UPDATE(id) ON companies TO qsa_governance_authorizer;
GRANT SELECT,INSERT,UPDATE ON runtime_reconciliation_revisions TO qsa_governance_authorizer;
CREATE POLICY governance_internal ON runtime_reconciliation_revisions TO qsa_governance_authorizer USING(true) WITH CHECK(true);
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['users','user_company_roles','projects','project_access','trip_driver_links'] LOOP
  IF EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.'||t) AND relrowsecurity) THEN EXECUTE format('CREATE POLICY governance_internal ON public.%I TO qsa_governance_authorizer USING(true) WITH CHECK(true)',t);END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['account_applications','governance_receipts','governance_history','governance_access_events','governance_inventory_revisions','governance_project_counter'] LOOP
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,qsa_runtime,qsa_auth,qsa_worker',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO qsa_governance_authorizer',t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY governance_internal ON public.%I TO qsa_governance_authorizer USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
GRANT SELECT,INSERT ON governance_receipts,governance_history TO qsa_runtime;
CREATE POLICY governance_receipt_actor ON governance_receipts TO qsa_runtime USING(company_id=nullif(current_setting('app.company_id',true),'')::uuid AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid) WITH CHECK(company_id=nullif(current_setting('app.company_id',true),'')::uuid AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid);
CREATE POLICY governance_history_actor ON governance_history TO qsa_runtime USING(company_id=nullif(current_setting('app.company_id',true),'')::uuid AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid) WITH CHECK(company_id=nullif(current_setting('app.company_id',true),'')::uuid AND actor_id=nullif(current_setting('app.actor_id',true),'')::uuid);
-- Explicitly delegate existing capabilities only to the narrow NOLOGIN owner.
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
SET LOCAL ROLE qsa_command_authorizer;
GRANT EXECUTE ON FUNCTION qsa_assert_runtime_writer(text,bigint),qsa_authorize_canonical_command(boolean) TO qsa_governance_authorizer;
RESET ROLE;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
CREATE FUNCTION qsa_governance_version() RETURNS integer LANGUAGE sql SET search_path=pg_catalog,pg_temp AS $$SELECT 1$$;
CREATE FUNCTION qsa_governance_fence() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF nullif(current_setting('app.writer_epoch',true),'') IS NULL OR nullif(current_setting('app.writer_epoch_revision',true),'') IS NULL THEN RAISE EXCEPTION 'RUNTIME_WRITER_FENCE_REQUIRED' USING ERRCODE='42501';END IF;
 PERFORM public.qsa_assert_runtime_writer(current_setting('app.writer_epoch'),current_setting('app.writer_epoch_revision')::bigint);
END $$;
CREATE FUNCTION qsa_governance_revision() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$BEGIN IF NEW IS DISTINCT FROM OLD THEN NEW.governance_revision:=OLD.governance_revision+1;NEW.updated_at:=clock_timestamp();END IF;RETURN NEW;END $$;
CREATE TRIGGER governance_user_revision BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION qsa_governance_revision();
CREATE FUNCTION qsa_governance_bump() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE b jsonb;co uuid;pr uuid;BEGIN
 b:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 IF TG_TABLE_NAME='users' THEN
  FOR co IN SELECT DISTINCT company_id FROM public.user_company_roles WHERE user_id=(b->>'id')::uuid LOOP INSERT INTO public.governance_inventory_revisions VALUES(co,'00000000-0000-0000-0000-000000000000',1) ON CONFLICT(company_id,scope_id) DO UPDATE SET revision=governance_inventory_revisions.revision+1;END LOOP;
 ELSE
  co:=CASE WHEN TG_TABLE_NAME='companies' THEN (b->>'id')::uuid ELSE (b->>'company_id')::uuid END;
  IF TG_OP='DELETE' AND TG_TABLE_NAME='companies' THEN RETURN OLD;END IF;
  INSERT INTO public.governance_inventory_revisions VALUES(co,coalesce(CASE WHEN TG_TABLE_NAME='projects' THEN nullif(b->>'id','')::uuid ELSE nullif(b->>'project_id','')::uuid END,'00000000-0000-0000-0000-000000000000'),1) ON CONFLICT(company_id,scope_id) DO UPDATE SET revision=governance_inventory_revisions.revision+1;
  IF TG_TABLE_NAME IN('account_applications','governance_receipts','governance_history','governance_access_events') THEN
   pr:=nullif(b->>'project_id','')::uuid;INSERT INTO public.runtime_reconciliation_revisions VALUES(co,coalesce(pr,'00000000-0000-0000-0000-000000000000'),1) ON CONFLICT(company_id,scope_id) DO UPDATE SET revision=runtime_reconciliation_revisions.revision+1;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE FUNCTION qsa_governance_permission_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE b jsonb;a jsonb;co uuid;pr uuid;who uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;BEGIN
 b:=CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END;a:=CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END;
 IF TG_OP='UPDATE' AND a IS NOT DISTINCT FROM b THEN RETURN NEW;END IF;
 IF TG_TABLE_NAME='users' THEN
  IF TG_OP<>'UPDATE' OR NEW.status=OLD.status THEN RETURN NEW;END IF;
  b:=jsonb_build_object('id',OLD.id,'status',OLD.status,'revision',OLD.governance_revision);a:=jsonb_build_object('id',NEW.id,'status',NEW.status,'revision',NEW.governance_revision);
  FOR co IN SELECT DISTINCT company_id FROM public.user_company_roles WHERE user_id=NEW.id LOOP INSERT INTO public.governance_access_events(company_id,actor_id,operation_id,table_name,before_record,after_record,origin) VALUES(co,who,nullif(current_setting('app.operation_id',true),''),TG_TABLE_NAME,b,a,CASE WHEN session_user='qsa_runtime' THEN 'AUTHENTICATED_COMMAND' ELSE 'PRIVILEGED_SQL' END);END LOOP;
 ELSE
  co:=(coalesce(a,b)->>'company_id')::uuid;pr:=nullif(coalesce(a,b)->>'project_id','')::uuid;
  INSERT INTO public.governance_access_events(company_id,project_id,actor_id,operation_id,table_name,before_record,after_record,origin) VALUES(co,pr,who,nullif(current_setting('app.operation_id',true),''),TG_TABLE_NAME,b,a,CASE WHEN session_user='qsa_runtime' THEN 'AUTHENTICATED_COMMAND' ELSE 'PRIVILEGED_SQL' END);
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE FUNCTION qsa_governance_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$BEGIN RAISE EXCEPTION 'GOVERNANCE_EVIDENCE_APPEND_ONLY' USING ERRCODE='23514';END $$;
CREATE FUNCTION qsa_governance_table_fence() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$BEGIN IF session_user='qsa_runtime' THEN PERFORM public.qsa_governance_fence();END IF;RETURN NEW;END $$;
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['users','companies','user_company_roles','projects','project_access','account_applications','governance_receipts','governance_history','governance_access_events'] LOOP EXECUTE format('CREATE TRIGGER governance_inventory_revision AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION qsa_governance_bump()',t);END LOOP;
 FOREACH t IN ARRAY ARRAY['users','user_company_roles','project_access','trip_driver_links'] LOOP EXECUTE format('CREATE TRIGGER governance_permission_history AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION qsa_governance_permission_event()',t);END LOOP;
 FOREACH t IN ARRAY ARRAY['governance_receipts','governance_history','governance_access_events'] LOOP EXECUTE format('CREATE TRIGGER governance_append_only BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION qsa_governance_immutable()',t);END LOOP;
 FOREACH t IN ARRAY ARRAY['account_applications','governance_receipts','governance_history'] LOOP EXECUTE format('CREATE TRIGGER governance_epoch_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION qsa_governance_table_fence()',t);END LOOP;
END $$;
CREATE FUNCTION qsa_governance_register(uid text,display_value text,email_value text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;BEGIN
 PERFORM public.qsa_governance_fence();IF uid IS NULL OR length(uid) NOT BETWEEN 1 AND 128 OR uid IS DISTINCT FROM current_setting('app.firebase_uid',true) THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('governance-registration/'||uid,0));
 SELECT id INTO actor FROM public.users WHERE firebase_uid=uid FOR UPDATE;
 IF actor IS NULL THEN actor:=nullif(current_setting('app.actor_id',true),'')::uuid;INSERT INTO public.users(id,firebase_uid,display_name,email,status) VALUES(actor,uid,display_value,email_value,'PENDING_APPROVAL');END IF;
 PERFORM set_config('app.actor_id',actor::text,true);RETURN actor;
END $$;
CREATE FUNCTION qsa_governance_self() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE u public.users;BEGIN
 PERFORM public.qsa_governance_fence();SELECT * INTO u FROM public.users WHERE id=nullif(current_setting('app.actor_id',true),'')::uuid AND firebase_uid=current_setting('app.firebase_uid',true) FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'USER_NOT_REGISTERED' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('id',u.id,'principal',u.firebase_uid,'displayName',u.display_name,'email',u.email,'status',u.status,'revision',u.governance_revision::text,'membershipRevision',md5(coalesce((SELECT string_agg(v,',' ORDER BY v) FROM(SELECT r.id::text||r.role||r.status||r.valid_from::text||coalesce(r.valid_to::text,'')||c.status v FROM public.user_company_roles r JOIN public.companies c ON c.id=r.company_id WHERE r.user_id=u.id UNION ALL SELECT a.company_id::text||a.status||a.revision::text FROM public.account_applications a WHERE a.user_id=u.id) f),'')),'validUntil',(SELECT min(t) FROM(SELECT valid_from t FROM public.user_company_roles WHERE user_id=u.id UNION ALL SELECT valid_to FROM public.user_company_roles WHERE user_id=u.id) b WHERE t>statement_timestamp() AND isfinite(t)));
END $$;
CREATE FUNCTION qsa_governance_context(external_project text DEFAULT NULL,requirement text DEFAULT 'READ') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;co uuid:=nullif(current_setting('app.company_id',true),'')::uuid;roles text[];p public.projects;app public.account_applications;project_admin boolean:=false;rev bigint;boundary timestamptz;BEGIN
 PERFORM public.qsa_governance_fence();
 PERFORM 1 FROM public.users WHERE id=actor AND status='ACTIVE' FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.companies WHERE id=co AND status='ACTIVE' FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_COMPANY' USING ERRCODE='42501';END IF;
 SELECT array_agg(r.role ORDER BY r.role) INTO roles FROM(SELECT role FROM public.user_company_roles WHERE company_id=co AND user_id=actor AND status='ACTIVE' AND valid_from<=clock_timestamp() AND(valid_to IS NULL OR valid_to>clock_timestamp()) ORDER BY id FOR SHARE) r;
 SELECT * INTO app FROM public.account_applications WHERE company_id=co AND user_id=actor FOR SHARE;
 IF roles IS NULL OR app.status IS NOT NULL AND app.status<>'ACTIVE' THEN RAISE EXCEPTION 'NO_ACTIVE_COMPANY_ROLE' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM unnest(roles) r WHERE r NOT IN('SUPER_ADMIN','COMPANY_ADMIN','PROJECT_ADMIN','SITE_SUPERVISOR','SUPERVISOR','DISPATCHER','FINANCE_AUDITOR','SCALE_OPERATOR','DRIVER','VIEWER')) THEN RAISE EXCEPTION 'UNSUPPORTED_COMMERCIAL_ROLE' USING ERRCODE='42501';END IF;
 IF requirement IN('ACCOUNT_ADMIN','CREATE_PROJECT') AND NOT('SUPER_ADMIN'=ANY(roles)) THEN RAISE EXCEPTION 'FORBIDDEN_GOVERNANCE_COMMAND' USING ERRCODE='42501';END IF;
 IF external_project IS NOT NULL THEN
  SELECT * INTO p FROM public.projects WHERE company_id=co AND external_id=external_project FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND' USING ERRCODE='42501';END IF;
  PERFORM 1 FROM public.project_access WHERE company_id=co AND project_id=p.id AND user_id=actor AND role=ANY(roles) AND status='ACTIVE' AND valid_period @> clock_timestamp() ORDER BY id FOR SHARE;
  project_admin:='PROJECT_ADMIN'=ANY(roles) AND EXISTS(SELECT 1 FROM public.project_access WHERE company_id=co AND project_id=p.id AND user_id=actor AND role='PROJECT_ADMIN' AND status='ACTIVE' AND valid_period @> clock_timestamp());
  IF NOT('SUPER_ADMIN'=ANY(roles) OR 'COMPANY_ADMIN'=ANY(roles) OR FOUND) THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND' USING ERRCODE='42501';END IF;
  IF requirement='PROJECT_COMMAND' AND NOT('SUPER_ADMIN'=ANY(roles) OR project_admin) THEN RAISE EXCEPTION 'FORBIDDEN_GOVERNANCE_COMMAND' USING ERRCODE='42501';END IF;
 END IF;
 SELECT sum(revision)::bigint INTO rev FROM public.governance_inventory_revisions WHERE company_id=co;
 SELECT min(t) INTO boundary FROM(SELECT valid_from t FROM public.user_company_roles WHERE company_id=co AND user_id=actor UNION ALL SELECT valid_to FROM public.user_company_roles WHERE company_id=co AND user_id=actor UNION ALL SELECT lower(valid_period) FROM public.project_access WHERE company_id=co AND user_id=actor UNION ALL SELECT upper(valid_period) FROM public.project_access WHERE company_id=co AND user_id=actor) b WHERE t>statement_timestamp() AND isfinite(t);
 RETURN jsonb_build_object('roles',roles,'project',CASE WHEN p.id IS NULL THEN NULL ELSE to_jsonb(p) END,'canManageProject','SUPER_ADMIN'=ANY(roles) OR project_admin,'inventoryRevision',coalesce(rev,0)::text,'validUntil',boundary);
END $$;
CREATE FUNCTION qsa_governance_account(target_uid text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;co uuid:=nullif(current_setting('app.company_id',true),'')::uuid;u public.users;app public.account_applications;roles text[];d text;n bigint;BEGIN
 PERFORM public.qsa_governance_fence();IF target_uid IS NULL THEN SELECT firebase_uid INTO target_uid FROM public.users WHERE id=actor;ELSE PERFORM public.qsa_governance_context(NULL,'ACCOUNT_ADMIN');END IF;
 SELECT * INTO u FROM public.users WHERE firebase_uid=target_uid FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'USER_NOT_REGISTERED' USING ERRCODE='42501';END IF;
 SELECT * INTO app FROM public.account_applications WHERE company_id=co AND user_id=u.id FOR SHARE;
 SELECT array_agg(role ORDER BY role) INTO roles FROM public.user_company_roles WHERE company_id=co AND user_id=u.id AND status='ACTIVE' AND valid_from<=statement_timestamp() AND(valid_to IS NULL OR valid_to>statement_timestamp());
 IF target_uid IS DISTINCT FROM current_setting('app.firebase_uid',true) AND app.user_id IS NULL AND NOT EXISTS(SELECT 1 FROM public.user_company_roles WHERE company_id=co AND user_id=u.id) THEN RAISE EXCEPTION 'TARGET_USER_NOT_FOUND' USING ERRCODE='42501';END IF;
 SELECT count(DISTINCT project_id) INTO n FROM public.project_access WHERE company_id=co AND user_id=u.id AND status='ACTIVE' AND valid_period @> statement_timestamp();
 SELECT dr.external_id INTO d FROM public.trip_driver_links l JOIN public.drivers dr ON dr.company_id=l.company_id AND dr.id=l.driver_id WHERE l.company_id=co AND l.user_id=u.id AND l.status='ACTIVE';
 RETURN jsonb_build_object('id',u.id,'principal',u.firebase_uid,'displayName',u.display_name,'email',u.email,'status',u.status,'revision',u.governance_revision::text,'membership',CASE WHEN app.user_id IS NULL AND roles IS NULL AND NOT EXISTS(SELECT 1 FROM public.user_company_roles WHERE company_id=co AND user_id=u.id) THEN NULL ELSE jsonb_build_object('companyId',co,'status',CASE WHEN (SELECT status FROM public.companies WHERE id=co)='SUSPENDED' THEN 'SUSPENDED' ELSE coalesce(app.status,CASE WHEN roles IS NULL THEN 'ACCESS_REVOKED' ELSE 'ACTIVE' END) END,'revision',coalesce(app.revision,0)::text,'roles',CASE WHEN u.status='ACTIVE' AND coalesce(app.status,'ACTIVE')='ACTIVE' AND EXISTS(SELECT 1 FROM public.companies WHERE id=co AND status='ACTIVE') THEN coalesce(roles,ARRAY[]::text[]) ELSE ARRAY[]::text[] END,'requestedRole',app.requested_role,'approvedAt',app.approved_at,'approvedBy',(SELECT firebase_uid FROM public.users WHERE id=app.approved_by),'rejectedAt',app.rejected_at,'rejectedBy',(SELECT firebase_uid FROM public.users WHERE id=app.rejected_by),'rejectionEncrypted',app.rejection_encrypted,'assignedProjectCount',n,'linkedDriverId',d) END);
END $$;
CREATE FUNCTION qsa_governance_application(request_role text,encrypted_request text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;co uuid:=nullif(current_setting('app.company_id',true),'')::uuid;BEGIN
 PERFORM public.qsa_governance_fence();PERFORM 1 FROM public.companies WHERE id=co AND status='ACTIVE' FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN_COMPANY' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.users WHERE id=actor AND status IN('ACTIVE','PENDING_APPROVAL') FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM public.account_applications WHERE company_id=co AND user_id=actor) OR EXISTS(SELECT 1 FROM public.user_company_roles WHERE company_id=co AND user_id=actor) THEN RAISE EXCEPTION 'ACCOUNT_APPLICATION_EXISTS' USING ERRCODE='23514';END IF;
 INSERT INTO public.account_applications(company_id,user_id,status,requested_role,request_encrypted) VALUES(co,actor,'PENDING_APPROVAL',request_role,encrypted_request);
 INSERT INTO public.user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),co,actor,'VIEWER','REVOKED') ON CONFLICT(company_id,user_id,role) DO NOTHING;
END $$;

GRANT SELECT ON drivers TO qsa_governance_authorizer;
GRANT UPDATE(id) ON drivers TO qsa_governance_authorizer;
CREATE POLICY governance_internal ON drivers FOR SELECT TO qsa_governance_authorizer USING(true);
CREATE FUNCTION qsa_governance_account_apply(target_uid text,command_value text,expected_revision bigint,data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;co uuid:=nullif(current_setting('app.company_id',true),'')::uuid;u public.users;app public.account_applications;roles text[];chosen text;ids uuid[];external_ids text[];dr uuid;viable bigint;BEGIN
 PERFORM public.qsa_governance_context(NULL,'ACCOUNT_ADMIN');
 SELECT * INTO u FROM public.users WHERE firebase_uid=target_uid FOR UPDATE;
 IF NOT FOUND OR NOT(EXISTS(SELECT 1 FROM public.account_applications WHERE company_id=co AND user_id=u.id) OR EXISTS(SELECT 1 FROM public.user_company_roles WHERE company_id=co AND user_id=u.id)) THEN RAISE EXCEPTION 'TARGET_USER_NOT_FOUND' USING ERRCODE='42501';END IF;
 IF u.id=actor THEN RAISE EXCEPTION 'SELF_ADMIN_ACTION_BLOCKED' USING ERRCODE='42501';END IF;
 SELECT array_agg(role ORDER BY role) INTO roles FROM public.user_company_roles WHERE company_id=co AND user_id=u.id AND status='ACTIVE' AND valid_from<=clock_timestamp() AND(valid_to IS NULL OR valid_to>clock_timestamp());
 SELECT * INTO app FROM public.account_applications WHERE company_id=co AND user_id=u.id FOR UPDATE;
 IF coalesce(app.revision,0) IS DISTINCT FROM expected_revision THEN RAISE EXCEPTION 'GOVERNANCE_REVISION_CONFLICT' USING ERRCODE='P0001';END IF;
 IF app.user_id IS NULL THEN
  INSERT INTO public.account_applications(company_id,user_id,status,approved_role) VALUES(co,u.id,CASE WHEN u.status='ACTIVE' THEN 'ACTIVE' ELSE u.status END,CASE WHEN cardinality(roles)=1 THEN roles[1] ELSE NULL END) RETURNING * INTO app;
 END IF;
 IF 'SUPER_ADMIN'=ANY(roles) AND(command_value IN('suspendAccount','rejectAccount') OR command_value='changeUserRole' AND data->>'newRole'<>'SUPER_ADMIN') THEN
  SELECT count(*) INTO viable FROM public.user_company_roles r JOIN public.users a ON a.id=r.user_id LEFT JOIN public.account_applications ap ON ap.company_id=r.company_id AND ap.user_id=r.user_id WHERE r.company_id=co AND r.role='SUPER_ADMIN' AND r.status='ACTIVE' AND r.valid_from<=clock_timestamp() AND(r.valid_to IS NULL OR r.valid_to>clock_timestamp()) AND a.status='ACTIVE' AND coalesce(ap.status,'ACTIVE')='ACTIVE';
  IF viable<=1 THEN RAISE EXCEPTION 'LAST_SUPER_ADMIN_PROTECTED' USING ERRCODE='23514';END IF;
 END IF;
 IF command_value='approveAccount' THEN
  IF app.status<>'PENDING_APPROVAL' THEN RAISE EXCEPTION 'ADMIN_UPDATE_CONFLICT' USING ERRCODE='23514';END IF;chosen:=data->>'approvedRole';
 ELSIF command_value='rejectAccount' THEN
  IF app.status<>'PENDING_APPROVAL' THEN RAISE EXCEPTION 'ADMIN_UPDATE_CONFLICT' USING ERRCODE='23514';END IF;
  UPDATE public.account_applications SET status='REJECTED',rejected_by=actor,rejected_at=clock_timestamp(),rejection_encrypted=data->>'_rejectionEncrypted' WHERE company_id=co AND user_id=u.id;
 ELSIF command_value='suspendAccount' THEN
  IF app.status<>'ACTIVE' THEN RAISE EXCEPTION 'ADMIN_UPDATE_CONFLICT' USING ERRCODE='23514';END IF;
  UPDATE public.account_applications SET status='SUSPENDED',suspended_roles=coalesce(roles,ARRAY[]::text[]) WHERE company_id=co AND user_id=u.id;
  UPDATE public.user_company_roles SET status='REVOKED' WHERE company_id=co AND user_id=u.id AND status='ACTIVE';
 ELSIF command_value='reactivateAccount' THEN
  IF app.status NOT IN('SUSPENDED','REJECTED') THEN RAISE EXCEPTION 'ADMIN_UPDATE_CONFLICT' USING ERRCODE='23514';END IF;
  IF u.status='SUSPENDED' THEN RAISE EXCEPTION 'GLOBAL_ACCOUNT_SUSPENSION_REQUIRES_OPERATOR' USING ERRCODE='42501';END IF;
  IF u.status IN('PENDING_APPROVAL','REJECTED') THEN
   IF EXISTS(SELECT 1 FROM public.user_company_roles WHERE user_id=u.id AND company_id<>co AND status='ACTIVE') THEN RAISE EXCEPTION 'ACCOUNT_MEMBERSHIP_RECONCILIATION_REQUIRED' USING ERRCODE='23514';END IF;
   UPDATE public.users SET status='ACTIVE' WHERE id=u.id;
  END IF;
  FOREACH chosen IN ARRAY CASE WHEN cardinality(app.suspended_roles)>0 THEN app.suspended_roles ELSE ARRAY[coalesce(app.approved_role,'VIEWER')] END LOOP
   INSERT INTO public.user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),co,u.id,chosen,'ACTIVE') ON CONFLICT(company_id,user_id,role) DO UPDATE SET status='ACTIVE',valid_from=clock_timestamp(),valid_to=NULL;
  END LOOP;
  chosen:=NULL;UPDATE public.account_applications SET status='ACTIVE' WHERE company_id=co AND user_id=u.id;
 ELSIF command_value='changeUserRole' THEN chosen:=data->>'newRole';
 ELSIF command_value='replaceAssignedProjects' THEN NULL;
 ELSIF command_value='linkDriverIdentity' THEN
  IF roles IS DISTINCT FROM ARRAY['DRIVER']::text[] THEN RAISE EXCEPTION 'INVALID_ADMIN_COMMAND' USING ERRCODE='23514';END IF;
  SELECT id INTO dr FROM public.drivers WHERE company_id=co AND external_id=data->>'linkedDriverId' AND natural_key_hmac IS NOT NULL FOR SHARE;
  IF dr IS NULL THEN RAISE EXCEPTION 'DRIVER_IDENTITY_UNVERIFIED' USING ERRCODE='23514';END IF;
  INSERT INTO public.trip_driver_links VALUES(co,u.id,dr,'ACTIVE') ON CONFLICT(company_id,user_id) DO UPDATE SET driver_id=excluded.driver_id,status='ACTIVE';
 ELSIF command_value='unlinkDriverIdentity' THEN UPDATE public.trip_driver_links SET status='REVOKED' WHERE company_id=co AND user_id=u.id;
 ELSE RAISE EXCEPTION 'INVALID_ADMIN_COMMAND' USING ERRCODE='22023';END IF;
 IF chosen IS NOT NULL THEN
  IF chosen NOT IN('SUPER_ADMIN','PROJECT_ADMIN','SITE_SUPERVISOR','SUPERVISOR','DISPATCHER','FINANCE_AUDITOR','SCALE_OPERATOR','DRIVER','VIEWER') THEN RAISE EXCEPTION 'INVALID_ADMIN_COMMAND' USING ERRCODE='22023';END IF;
  IF command_value='approveAccount' THEN
   IF u.status='SUSPENDED' OR EXISTS(SELECT 1 FROM public.user_company_roles WHERE user_id=u.id AND company_id<>co AND status='ACTIVE') AND u.status<>'ACTIVE' THEN RAISE EXCEPTION 'ACCOUNT_MEMBERSHIP_RECONCILIATION_REQUIRED' USING ERRCODE='23514';END IF;
   IF u.status IN('PENDING_APPROVAL','REJECTED') THEN UPDATE public.users SET status='ACTIVE' WHERE id=u.id;END IF;
   UPDATE public.account_applications SET status='ACTIVE',approved_by=actor,approved_at=clock_timestamp() WHERE company_id=co AND user_id=u.id;
  END IF;
  INSERT INTO public.user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),co,u.id,chosen,CASE WHEN command_value='approveAccount' OR app.status='ACTIVE' THEN 'ACTIVE' ELSE 'REVOKED' END) ON CONFLICT(company_id,user_id,role) DO UPDATE SET status=excluded.status,valid_from=clock_timestamp(),valid_to=NULL;
  UPDATE public.user_company_roles SET status='REVOKED' WHERE company_id=co AND user_id=u.id AND role<>chosen AND status='ACTIVE';
  INSERT INTO public.project_access(id,company_id,project_id,user_id,role,status) SELECT gen_random_uuid(),co,p.project_id,u.id,chosen,'ACTIVE' FROM(SELECT DISTINCT project_id FROM public.project_access WHERE company_id=co AND user_id=u.id AND status='ACTIVE' AND valid_period @> clock_timestamp()) p ON CONFLICT(company_id,project_id,user_id,role) DO UPDATE SET status='ACTIVE';
  UPDATE public.project_access SET status='REVOKED' WHERE company_id=co AND user_id=u.id AND role<>chosen AND status='ACTIVE';
  UPDATE public.account_applications SET approved_role=chosen,suspended_roles=CASE WHEN app.status='SUSPENDED' THEN ARRAY[chosen] ELSE suspended_roles END WHERE company_id=co AND user_id=u.id;
  IF chosen<>'DRIVER' THEN UPDATE public.trip_driver_links SET status='REVOKED' WHERE company_id=co AND user_id=u.id;END IF;
 END IF;
 IF command_value IN('approveAccount','replaceAssignedProjects') THEN
  IF jsonb_typeof(data->'assignedProjectIds')<>'array' OR jsonb_array_length(data->'assignedProjectIds')>1000 THEN RAISE EXCEPTION 'INVALID_ADMIN_COMMAND' USING ERRCODE='22023';END IF;
  SELECT array_agg(value),count(DISTINCT value) INTO external_ids,viable FROM jsonb_array_elements_text(data->'assignedProjectIds');
  IF viable<>coalesce(cardinality(external_ids),0) THEN RAISE EXCEPTION 'INVALID_ADMIN_COMMAND' USING ERRCODE='22023';END IF;
  SELECT array_agg(id) INTO ids FROM public.projects WHERE company_id=co AND external_id=ANY(coalesce(external_ids,ARRAY[]::text[]));
  IF coalesce(cardinality(ids),0)<>coalesce(cardinality(external_ids),0) THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND' USING ERRCODE='42501';END IF;
  IF EXISTS(SELECT 1 FROM public.projects p WHERE p.company_id=co AND p.id=ANY(ids) AND p.status NOT IN('SETUP','READY_FOR_REVIEW','APPROVED','ACTIVE') AND NOT EXISTS(SELECT 1 FROM public.project_access a WHERE a.company_id=co AND a.project_id=p.id AND a.user_id=u.id AND a.status='ACTIVE')) THEN RAISE EXCEPTION 'PROJECT_LIFECYCLE_MUTATION_DENIED' USING ERRCODE='23514';END IF;
  UPDATE public.project_access SET status='REVOKED' WHERE company_id=co AND user_id=u.id AND status='ACTIVE' AND NOT(project_id=ANY(coalesce(ids,ARRAY[]::uuid[])));
  SELECT approved_role INTO chosen FROM public.account_applications WHERE company_id=co AND user_id=u.id;
  IF chosen IS NULL THEN
   IF cardinality(roles)<>1 THEN RAISE EXCEPTION 'AMBIGUOUS_ACCOUNT_ROLE' USING ERRCODE='23514';END IF;chosen:=roles[1];
  END IF;
  INSERT INTO public.project_access(id,company_id,project_id,user_id,role,status) SELECT gen_random_uuid(),co,id,u.id,chosen,'ACTIVE' FROM unnest(coalesce(ids,ARRAY[]::uuid[])) id ON CONFLICT(company_id,project_id,user_id,role) DO UPDATE SET status='ACTIVE',valid_period=tstzrange(clock_timestamp(),NULL,'[)');
 END IF;
 UPDATE public.account_applications SET revision=revision+1,updated_at=clock_timestamp() WHERE company_id=co AND user_id=u.id;
END $$;
CREATE FUNCTION qsa_governance_project_apply(command_value text,external_project text,expected_revision bigint,data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE co uuid:=nullif(current_setting('app.company_id',true),'')::uuid;actor uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;p public.projects;number_value bigint;BEGIN
 PERFORM public.qsa_governance_context(CASE WHEN command_value='CREATE_PROJECT' THEN NULL ELSE external_project END,CASE WHEN command_value='CREATE_PROJECT' THEN 'CREATE_PROJECT' ELSE 'PROJECT_COMMAND' END);
 IF command_value='CREATE_PROJECT' THEN
  IF expected_revision<>0 THEN RAISE EXCEPTION 'GOVERNANCE_REVISION_CONFLICT' USING ERRCODE='P0001';END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('governance-project-number',0));
  IF NOT EXISTS(SELECT 1 FROM public.governance_project_counter) THEN
   SELECT greatest(coalesce(max(CASE WHEN project_number~'^[0-9]{1,15}$' THEN project_number::bigint ELSE 0 END),0),coalesce(max(CASE WHEN external_id~'^Q-PRJ-[0-9]{1,15}$' THEN substring(external_id FROM 7)::bigint ELSE 0 END),0))+1 INTO number_value FROM public.projects;
   INSERT INTO public.governance_project_counter VALUES(true,number_value);
  END IF;
  SELECT next_number INTO number_value FROM public.governance_project_counter WHERE singleton FOR UPDATE;
  IF number_value>9007199254740990 THEN RAISE EXCEPTION 'PROJECT_COUNTER_INVALID' USING ERRCODE='23514';END IF;
  UPDATE public.governance_project_counter SET next_number=number_value+1 WHERE singleton;
  INSERT INTO public.projects(id,company_id,external_id,project_number,name,status,governance_foundation,created_by,updated_by) VALUES(gen_random_uuid(),co,'Q-PRJ-'||lpad(number_value::text,greatest(3,length(number_value::text)),'0'),number_value::text,data->'foundation'->>'nameAr','SETUP',data->'foundation',actor,actor) RETURNING * INTO p;
 ELSE
  SELECT * INTO p FROM public.projects WHERE company_id=co AND external_id=external_project FOR UPDATE;
  IF p.version<>expected_revision THEN RAISE EXCEPTION 'GOVERNANCE_REVISION_CONFLICT' USING ERRCODE='P0001';END IF;
  IF command_value='UPDATE_FOUNDATION' THEN UPDATE public.projects SET governance_foundation=data->'foundation',name=data->'foundation'->>'nameAr',updated_by=actor,updated_at=clock_timestamp(),version=version+1 WHERE id=p.id RETURNING * INTO p;
  ELSIF command_value='CONFIGURE_OPERATIONS' THEN UPDATE public.projects SET operational_configuration=data->'configuration',operational_profile=data->>'profile',updated_by=actor,updated_at=clock_timestamp(),version=version+1 WHERE id=p.id RETURNING * INTO p;
  ELSIF command_value IN('TRANSITION','ACTIVATE','REACTIVATE') THEN UPDATE public.projects SET status=data->>'status',updated_by=actor,updated_at=clock_timestamp(),version=version+1 WHERE id=p.id RETURNING * INTO p;
  ELSE RAISE EXCEPTION 'INVALID_PROJECT_COMMAND' USING ERRCODE='22023';END IF;
 END IF;
 PERFORM set_config('app.project_id',p.id::text,true);RETURN to_jsonb(p);
END $$;
CREATE FUNCTION qsa_governance_projects(after_id uuid,page_limit integer) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE ctx jsonb;BEGIN
 ctx:=public.qsa_governance_context();IF page_limit IS NULL OR page_limit<1 OR page_limit>51 THEN RAISE EXCEPTION 'INVALID_GOVERNANCE_PAGE' USING ERRCODE='22023';END IF;
 RETURN QUERY SELECT to_jsonb(pr)||jsonb_build_object('_canManageProject',(ctx->'roles')?'SUPER_ADMIN' OR((ctx->'roles')?'PROJECT_ADMIN' AND EXISTS(SELECT 1 FROM public.project_access a WHERE a.company_id=pr.company_id AND a.project_id=pr.id AND a.user_id=nullif(current_setting('app.actor_id',true),'')::uuid AND a.role='PROJECT_ADMIN' AND a.status='ACTIVE' AND a.valid_period @> clock_timestamp()))) FROM public.projects pr WHERE pr.company_id=nullif(current_setting('app.company_id',true),'')::uuid AND(after_id IS NULL OR pr.id>after_id) AND((ctx->'roles')?'SUPER_ADMIN' OR(ctx->'roles')?'COMPANY_ADMIN' OR EXISTS(SELECT 1 FROM public.project_access a WHERE a.company_id=pr.company_id AND a.project_id=pr.id AND a.user_id=nullif(current_setting('app.actor_id',true),'')::uuid AND a.role IN(SELECT jsonb_array_elements_text(ctx->'roles')) AND a.status='ACTIVE' AND a.valid_period @> clock_timestamp())) ORDER BY pr.id LIMIT page_limit;
END $$;
CREATE FUNCTION qsa_governance_accounts(after_id uuid,page_limit integer) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE u public.users;co uuid:=nullif(current_setting('app.company_id',true),'')::uuid;BEGIN
 PERFORM public.qsa_governance_context(NULL,'ACCOUNT_ADMIN');IF page_limit IS NULL OR page_limit<1 OR page_limit>51 THEN RAISE EXCEPTION 'INVALID_GOVERNANCE_PAGE' USING ERRCODE='22023';END IF;
 FOR u IN SELECT us.* FROM public.users us WHERE(after_id IS NULL OR us.id>after_id) AND(EXISTS(SELECT 1 FROM public.user_company_roles r WHERE r.company_id=co AND r.user_id=us.id) OR EXISTS(SELECT 1 FROM public.account_applications a WHERE a.company_id=co AND a.user_id=us.id)) ORDER BY us.id LIMIT page_limit LOOP RETURN NEXT public.qsa_governance_account(u.firebase_uid);END LOOP;
END $$;
CREATE FUNCTION qsa_governance_companies(after_id uuid,page_limit integer) RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=nullif(current_setting('app.actor_id',true),'')::uuid;BEGIN
 IF (public.qsa_governance_self()->>'status') NOT IN('ACTIVE','PENDING_APPROVAL') THEN RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE' USING ERRCODE='42501';END IF;IF page_limit IS NULL OR page_limit<1 OR page_limit>51 THEN RAISE EXCEPTION 'INVALID_GOVERNANCE_PAGE' USING ERRCODE='22023';END IF;
 RETURN QUERY SELECT jsonb_build_object('id',c.id,'companyId',c.id,'name',CASE WHEN c.status='ACTIVE' AND EXISTS(SELECT 1 FROM public.user_company_roles r WHERE r.company_id=c.id AND r.user_id=actor AND r.status='ACTIVE' AND r.valid_from<=clock_timestamp() AND(r.valid_to IS NULL OR r.valid_to>clock_timestamp())) THEN c.name ELSE NULL END,'status',CASE WHEN c.status='SUSPENDED' THEN 'SUSPENDED' ELSE coalesce(a.status,'ACTIVE') END) FROM public.companies c LEFT JOIN public.account_applications a ON a.company_id=c.id AND a.user_id=actor WHERE(after_id IS NULL OR c.id>after_id) AND(a.user_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.user_company_roles r WHERE r.company_id=c.id AND r.user_id=actor AND r.status='ACTIVE' AND r.valid_from<=clock_timestamp() AND(r.valid_to IS NULL OR r.valid_to>clock_timestamp()))) ORDER BY c.id LIMIT page_limit;
END $$;
CREATE FUNCTION qsa_governance_frame() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE value jsonb;BEGIN PERFORM public.qsa_authorize_canonical_command(true);
 SELECT jsonb_build_object('inventoryRevision',coalesce((SELECT sum(revision)::text FROM public.governance_inventory_revisions WHERE company_id=nullif(current_setting('app.company_id',true),'')::uuid),'0'),'projectCounter',(SELECT next_number::text FROM public.governance_project_counter WHERE singleton)) INTO value;RETURN value;
END $$;

-- Authorization-only lookup before acquiring the shared canonical project lock.
-- No row locks here: final current authorization is repeated under the epoch fence.
CREATE FUNCTION qsa_governance_project_preflight(external_project text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE result uuid;BEGIN
 SELECT p.id INTO result FROM public.projects p JOIN public.companies c ON c.id=p.company_id AND c.status='ACTIVE' JOIN public.users u ON u.id=nullif(current_setting('app.actor_id',true),'')::uuid AND u.status='ACTIVE' WHERE p.company_id=nullif(current_setting('app.company_id',true),'')::uuid AND p.external_id=external_project AND EXISTS(SELECT 1 FROM public.user_company_roles r WHERE r.company_id=p.company_id AND r.user_id=u.id AND r.status='ACTIVE' AND r.valid_from<=statement_timestamp() AND(r.valid_to IS NULL OR r.valid_to>statement_timestamp()) AND(r.role IN('SUPER_ADMIN','COMPANY_ADMIN') OR EXISTS(SELECT 1 FROM public.project_access a WHERE a.company_id=p.company_id AND a.project_id=p.id AND a.user_id=u.id AND a.role=r.role AND a.status='ACTIVE' AND a.valid_period @> statement_timestamp())));
 IF result IS NULL THEN RAISE EXCEPTION 'PROJECT_NOT_FOUND' USING ERRCODE='42501';END IF;RETURN result;
END $$;
GRANT CREATE ON SCHEMA public TO qsa_reconciliation_reader;
DO $$ BEGIN EXECUTE format('GRANT qsa_reconciliation_reader TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
SET LOCAL ROLE qsa_reconciliation_reader;
CREATE OR REPLACE FUNCTION qsa_readiness_inventory(table_name text,after_key text,page_limit integer) RETURNS TABLE(row_key text,row_digest text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp SET timezone='UTC' AS $$
DECLARE company uuid:=nullif(current_setting('app.company_id',true),'')::uuid;project uuid:=nullif(current_setting('app.project_id',true),'')::uuid;predicate text;key_expression text;
BEGIN
 PERFORM public.qsa_authorize_canonical_command(true);
 IF table_name IS NULL OR page_limit IS NULL OR NOT(table_name=ANY(ARRAY['companies','users','user_company_roles','projects','project_access','carriers','materials','drivers','trucks','identity_keys','identity_key_reservations','project_carriers','project_materials','project_drivers','project_trucks','driver_carrier_affiliations','truck_carrier_affiliations','driver_truck_assignments','truck_material_allocations','pricing_rules','trips','trip_events','trip_weight_records','receipts','pricing_snapshots','exceptions','operational_adjustments','import_sessions','import_source_artifacts','import_row_decisions','import_execution_groups','import_execution_receipts','idempotency_receipts','audit_events','outbox_events','worker_jobs','workspace_bindings','workspace_sync_receipts','project_foundation_summaries','report_snapshots','migration_runs','legacy_identity_mappings','import_artifact_chunks','import_executions','trip_number_counters','trip_driver_links','pricing_rule_revisions','trip_settlements','account_applications','governance_receipts','governance_history','governance_access_events'])) OR page_limit<1 OR page_limit>51 OR length(coalesce(after_key,''))>2048 THEN RAISE EXCEPTION 'INVALID_INVENTORY_PAGE' USING ERRCODE='22023';END IF;
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
  ELSIF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.'||table_name) AND attname='project_id' AND NOT attisdropped) THEN predicate:=predicate||CASE WHEN table_name IN('governance_receipts','governance_history','governance_access_events') THEN ' AND (t.project_id=$2 OR t.project_id IS NULL)' ELSE ' AND t.project_id=$2' END;
  ELSIF table_name='worker_jobs' THEN predicate:=predicate||' AND EXISTS(SELECT 1 FROM public.outbox_events e WHERE e.company_id=$1 AND e.project_id=$2 AND e.id=t.event_id)';END IF;
 END IF;
 RETURN QUERY EXECUTE format('SELECT q.k,q.d FROM (SELECT %s k,encode(sha256(convert_to(to_jsonb(t)::text,''UTF8'')),''hex'') d FROM public.%I t WHERE %s) q WHERE ($3 IS NULL OR q.k COLLATE "C">$3 COLLATE "C") ORDER BY q.k COLLATE "C" LIMIT $4',key_expression,table_name,predicate) USING company,project,after_key,page_limit;
END $$;
RESET ROLE;
DO $$ BEGIN EXECUTE format('GRANT qsa_reconciliation_reader TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_reconciliation_reader;
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['account_applications','governance_receipts','governance_history','governance_access_events'] LOOP
 EXECUTE format('GRANT SELECT ON public.%I TO qsa_reconciliation_reader',t);EXECUTE format('CREATE POLICY reconciliation_internal ON public.%I FOR SELECT TO qsa_reconciliation_reader USING(true)',t);
END LOOP;END $$;
GRANT CREATE ON SCHEMA public TO qsa_governance_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_governance_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
DO $$ DECLARE f record;BEGIN FOR f IN SELECT p.oid::regprocedure AS signature,p.prorettype FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'qsa_governance_%' LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.signature);
 IF f.prorettype<>'trigger'::regtype THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO qsa_runtime',f.signature);END IF;
 EXECUTE format('ALTER FUNCTION %s OWNER TO qsa_governance_authorizer',f.signature);
END LOOP;END $$;
DO $$ BEGIN EXECUTE format('GRANT qsa_governance_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_governance_authorizer;
