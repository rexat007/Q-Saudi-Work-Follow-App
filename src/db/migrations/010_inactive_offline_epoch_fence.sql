-- U07 preparation only. No production authority or epoch is advanced.
CREATE TABLE backend_authority_epoch(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 backend_epoch text NOT NULL,epoch_revision bigint NOT NULL CHECK(epoch_revision>=0),
 canonical_store text NOT NULL CHECK(canonical_store IN ('firestore','postgres')));
INSERT INTO backend_authority_epoch VALUES(true,'FIRESTORE_LEGACY',0,'firestore');
REVOKE ALL ON backend_authority_epoch FROM PUBLIC,qsa_runtime,qsa_auth,qsa_worker;
CREATE FUNCTION qsa_epoch_forward_only() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN IF NEW.epoch_revision<=OLD.epoch_revision OR OLD.canonical_store='postgres' AND NEW.canonical_store<>'postgres' THEN
 RAISE EXCEPTION 'BACKEND_EPOCH_REGRESSION' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER epoch_forward_only BEFORE UPDATE ON backend_authority_epoch FOR EACH ROW EXECUTE FUNCTION qsa_epoch_forward_only();
GRANT SELECT,UPDATE(singleton) ON backend_authority_epoch TO qsa_command_authorizer;
CREATE FUNCTION qsa_read_offline_epoch() RETURNS TABLE(backend_epoch text,epoch_revision bigint,canonical_store text)
 LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT e.backend_epoch,e.epoch_revision,e.canonical_store FROM public.backend_authority_epoch e WHERE singleton FOR SHARE $$;
CREATE FUNCTION qsa_assert_offline_epoch(expected_epoch text,expected_revision bigint) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE e record;BEGIN SELECT * INTO e FROM public.qsa_read_offline_epoch();
 IF e.canonical_store IS DISTINCT FROM 'postgres' OR e.backend_epoch IS DISTINCT FROM expected_epoch OR e.epoch_revision IS DISTINCT FROM expected_revision THEN
 RAISE EXCEPTION 'BACKEND_EPOCH_MISMATCH' USING ERRCODE='P0001';END IF;END $$;
REVOKE ALL ON FUNCTION qsa_read_offline_epoch(),qsa_assert_offline_epoch(text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION qsa_read_offline_epoch(),qsa_assert_offline_epoch(text,bigint) TO qsa_runtime;
GRANT CREATE ON SCHEMA public TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET TRUE,INHERIT FALSE',current_user);END $$;
ALTER FUNCTION qsa_read_offline_epoch() OWNER TO qsa_command_authorizer;
ALTER FUNCTION qsa_assert_offline_epoch(text,bigint) OWNER TO qsa_command_authorizer;
DO $$ BEGIN EXECUTE format('GRANT qsa_command_authorizer TO %I WITH SET FALSE,INHERIT FALSE',current_user);END $$;
REVOKE CREATE ON SCHEMA public FROM qsa_command_authorizer;
