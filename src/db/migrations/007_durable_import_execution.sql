-- AR2-U05: additive only. Legacy rows remain unreconciled; no inferred provenance.
ALTER TABLE import_sessions ADD UNIQUE(company_id,project_id,id),
  ADD COLUMN operation_id text, ADD COLUMN batch_external_id text,
  ADD COLUMN checkpoint_artifact uuid, ADD COLUMN source_artifact uuid,
  ADD COLUMN created_by uuid REFERENCES users(id), ADD COLUMN updated_by uuid REFERENCES users(id);
ALTER TABLE import_source_artifacts ADD COLUMN project_id uuid,
  ADD COLUMN artifact_kind text CHECK(artifact_kind IN ('SOURCE','CHECKPOINT')),
  ADD UNIQUE(company_id,project_id,session_id,id),
  ADD FOREIGN KEY(company_id,project_id,session_id) REFERENCES import_sessions(company_id,project_id,id)
    DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE import_sessions ADD FOREIGN KEY(company_id,project_id,id,checkpoint_artifact)
  REFERENCES import_source_artifacts(company_id,project_id,session_id,id) DEFERRABLE INITIALLY DEFERRED NOT VALID,
  ADD FOREIGN KEY(company_id,project_id,id,source_artifact)
  REFERENCES import_source_artifacts(company_id,project_id,session_id,id) DEFERRABLE INITIALLY DEFERRED NOT VALID;
CREATE TABLE import_artifact_chunks (
  company_id uuid NOT NULL,project_id uuid NOT NULL,session_id uuid NOT NULL,artifact_id uuid NOT NULL,
  chunk_index int NOT NULL CHECK(chunk_index>=0 AND chunk_index<256),
  content_sha256 text NOT NULL CHECK(content_sha256 ~ '^[0-9a-f]{64}$'),
  content_encrypted text NOT NULL CHECK(octet_length(content_encrypted)<=400000),
  PRIMARY KEY(company_id,project_id,artifact_id,chunk_index),
  FOREIGN KEY(company_id,project_id,session_id,artifact_id)
    REFERENCES import_source_artifacts(company_id,project_id,session_id,id) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE import_executions (
  company_id uuid NOT NULL,project_id uuid NOT NULL,session_id uuid NOT NULL,operation_id text NOT NULL,
  binding_hash text NOT NULL CHECK(length(binding_hash)=64),reviewed_signature text CHECK(length(reviewed_signature)=64),
  state text NOT NULL CHECK(state IN ('READY','EXECUTING','PARTIAL','REVIEW_REQUIRED','CANCELLED','COMPLETED')),
  version bigint NOT NULL CHECK(version>=1),fence bigint NOT NULL CHECK(fence>=0),request_version bigint NOT NULL,
  group_count int NOT NULL CHECK(group_count BETWEEN 0 AND 500),completed_groups int NOT NULL DEFAULT 0,
  failure_code text,created_by uuid NOT NULL REFERENCES users(id),updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(company_id,project_id,session_id,operation_id),UNIQUE(company_id,project_id,session_id),
  CHECK(completed_groups BETWEEN 0 AND group_count),
  CHECK((group_count>0 AND reviewed_signature IS NOT NULL) OR
    (group_count=0 AND reviewed_signature IS NULL AND failure_code IS NOT NULL AND failure_code='U06_TRIP_AUTHORITY_REQUIRED' AND state IN ('REVIEW_REQUIRED','CANCELLED'))),
  FOREIGN KEY(company_id,project_id,session_id) REFERENCES import_sessions(company_id,project_id,id)
);
ALTER TABLE import_row_decisions ADD COLUMN project_id uuid,ADD COLUMN decision_encrypted text,
  ADD FOREIGN KEY(company_id,project_id,session_id) REFERENCES import_sessions(company_id,project_id,id) NOT VALID;
ALTER TABLE import_execution_groups ADD COLUMN project_id uuid,ADD COLUMN plan_encrypted text,ADD COLUMN plan_hash text,
  ADD UNIQUE(company_id,project_id,session_id,operation_id,group_key),
  ADD FOREIGN KEY(company_id,project_id,session_id,operation_id)
    REFERENCES import_executions(company_id,project_id,session_id,operation_id) NOT VALID;
ALTER TABLE import_execution_receipts ADD COLUMN project_id uuid,ADD COLUMN receipt_encrypted text,
  ADD COLUMN binding_hash text,ADD COLUMN fence bigint,
  ADD FOREIGN KEY(company_id,project_id,session_id,operation_id,group_key)
    REFERENCES import_execution_groups(company_id,project_id,session_id,operation_id,group_key) NOT VALID;
CREATE INDEX import_groups_pending_idx ON import_execution_groups(company_id,project_id,session_id,operation_id,state,group_key);
CREATE INDEX import_receipts_page_idx ON import_execution_receipts(company_id,project_id,session_id,operation_id,group_key);
CREATE INDEX import_artifacts_session_idx ON import_source_artifacts(company_id,project_id,session_id,artifact_kind);
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['import_artifact_chunks','import_executions'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',tbl);
    EXECUTE format('CREATE POLICY import_tenant ON %I TO public
      USING(company_id=nullif(current_setting(''app.company_id'',true),'''')::uuid)
      WITH CHECK(company_id=nullif(current_setting(''app.company_id'',true),'''')::uuid)',tbl);
  END LOOP;
  FOREACH tbl IN ARRAY ARRAY['import_sessions','import_source_artifacts','import_artifact_chunks','import_row_decisions',
    'import_executions','import_execution_groups','import_execution_receipts'] LOOP
    EXECUTE format('CREATE POLICY import_project ON %I AS RESTRICTIVE TO qsa_runtime
      USING(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)
      WITH CHECK(project_id=nullif(current_setting(''app.project_id'',true),'''')::uuid)',tbl);
    EXECUTE format('GRANT SELECT,INSERT ON %I TO qsa_runtime',tbl);
  END LOOP;
END $$;
GRANT UPDATE(state,version,fence,checkpoint_artifact,source_artifact,source_hash,reviewed_signature,updated_at,updated_by) ON import_sessions TO qsa_runtime;
GRANT UPDATE(state,version,fence,completed_groups,failure_code,updated_by,updated_at) ON import_executions TO qsa_runtime;
GRANT UPDATE(state,version,fence) ON import_execution_groups TO qsa_runtime;
-- Completed evidence has INSERT/SELECT only, never UPDATE or DELETE.
CREATE FUNCTION qsa_import_journal_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  IF TG_OP='UPDATE' THEN
    IF TG_TABLE_NAME='import_sessions' AND OLD.state IN ('COMMITTED','CANCELLED','FAILED_TERMINAL')
      OR TG_TABLE_NAME='import_executions' AND OLD.state IN ('COMPLETED','CANCELLED')
      OR TG_TABLE_NAME='import_execution_groups' AND OLD.state='COMMITTED' THEN
      RAISE EXCEPTION 'IMPORT_JOURNAL_IMMUTABLE' USING ERRCODE='23514';
    END IF;
    IF NEW.version<>OLD.version+1 OR NEW.fence<OLD.fence THEN
      RAISE EXCEPTION 'IMPORT_JOURNAL_VERSION' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION qsa_import_journal_guard() FROM PUBLIC;
CREATE TRIGGER import_journal_guard BEFORE UPDATE ON import_sessions FOR EACH ROW EXECUTE FUNCTION qsa_import_journal_guard();
CREATE TRIGGER import_journal_guard BEFORE UPDATE ON import_executions FOR EACH ROW EXECUTE FUNCTION qsa_import_journal_guard();
CREATE TRIGGER import_journal_guard BEFORE UPDATE ON import_execution_groups FOR EACH ROW EXECUTE FUNCTION qsa_import_journal_guard();
