import { useLayoutEffect, useRef } from 'react';
import { ProjectContextLifetime, type ProjectContextToken } from '../../utils/projectContextLifetime';

/** Reuses the existing lifetime semantics for close/reopen and A→B→A editor instances. */
export function useProjectEditorLifetime(projectId: string, open: boolean, ownerIsCurrent?: () => boolean) {
  const lifetime = useRef(new ProjectContextLifetime()).current;
  lifetime.enter(open ? projectId : null, 'editor');
  const owner = useRef(ownerIsCurrent); owner.current = ownerIsCurrent;
  useLayoutEffect(() => {
    lifetime.enter(open ? projectId : null, 'editor');
    return () => lifetime.dispose();
  }, [lifetime]);
  return {
    capture: () => lifetime.capture(),
    isCurrent: (token: ProjectContextToken) => lifetime.isCurrent(token, projectId) && (!owner.current || owner.current()),
  };
}
