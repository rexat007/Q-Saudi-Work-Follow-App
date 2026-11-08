-- AR2-U06-RB1: schedule final projection validation from either side of the stream.
-- Published migrations 001-008 and existing historical rows remain unchanged.
CREATE OR REPLACE FUNCTION qsa_trip_projection_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
DECLARE t record;e record;trip_key uuid;BEGIN
 IF TG_TABLE_NAME='trip_events' THEN trip_key:=NEW.trip_id;ELSE trip_key:=NEW.id;END IF;
 SELECT * INTO t FROM public.trips
  WHERE company_id=NEW.company_id AND project_id=NEW.project_id AND id=trip_key FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'TRIP_EVENT_PARENT_REQUIRED' USING ERRCODE='23514';END IF;
 -- Privileged legacy reconciliation/fixtures retain their existing classification.
 -- The restrictive runtime INSERT policy below prevents extending legacy streams.
 IF t.authority_schema IS DISTINCT FROM 1 THEN RETURN NULL;END IF;
 SELECT * INTO e FROM public.trip_events
  WHERE company_id=t.company_id AND project_id=t.project_id AND trip_id=t.id ORDER BY seq DESC LIMIT 1;
 IF e.id IS NULL OR t.projection_encrypted IS NULL OR t.projection_encrypted=''
  OR e.seq IS DISTINCT FROM t.version OR e.resulting_state IS DISTINCT FROM t.state
  OR e.projection_digest IS DISTINCT FROM md5(t.projection_encrypted) THEN
  RAISE EXCEPTION 'TRIP_EVENT_PROJECTION_MISMATCH' USING ERRCODE='23514';END IF;
 RETURN NULL;END $$;
CREATE CONSTRAINT TRIGGER trip_event_projection_consistency AFTER INSERT ON trip_events
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION qsa_trip_projection_guard();
CREATE POLICY trip_accepted_parent ON trip_events AS RESTRICTIVE FOR INSERT TO qsa_runtime
 WITH CHECK(EXISTS(SELECT 1 FROM trips t WHERE t.company_id=trip_events.company_id
  AND t.project_id=trip_events.project_id AND t.id=trip_events.trip_id AND t.authority_schema=1));
