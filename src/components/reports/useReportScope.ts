import {useEffect, useRef} from 'react';
import {useAuth} from '../../firebase/authContext';
import {auth} from '../../firebase/config';
import {hasProjectScope} from '../../utils/projectScope';
import {canEditProject} from '../../utils/permissions';
import {navigationService} from '../../services/navigation.service';

/** Presentation fence only. Firestore Rules and server reauthorization remain authoritative. */
export function useReportScope(projectId?: string) {
  const {user, userProfile, isAuthReady, isProfileLoading, profileAuthority} = useAuth();
  const key = JSON.stringify([user?.uid, userProfile?.userId, userProfile?.role,
    userProfile?.status, userProfile?.isActive, [...(userProfile?.assignedProjectIds || [])].sort(),
    profileAuthority, isAuthReady, isProfileLoading, projectId, auth.currentUser?.uid]);
  const current = useRef({key, generation: 0});
  if (current.current.key !== key) current.current = {key, generation: current.current.generation + 1};
  const captured = current.current; // Object identity also fences an A → B → A context cycle.
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const verifying = !isAuthReady || isProfileLoading || profileAuthority === 'LOADING';
  const unavailable = profileAuthority === 'UNAVAILABLE_TRANSIENT';
  const allowed = Boolean(!verifying && !unavailable && profileAuthority === 'AVAILABLE' &&
    user?.uid && auth.currentUser?.uid === user.uid && userProfile?.userId === user.uid && userProfile.status === 'ACTIVE' &&
    userProfile.isActive !== false && navigationService.isTabAuthorizedForRole('REPORTS_ENGINE', userProfile.role) &&
    (!projectId || hasProjectScope(userProfile, projectId)));
  return {key: JSON.stringify([key, captured.generation]), allowed, verifying, unavailable, profile: userProfile,
    canRefresh: Boolean(allowed && projectId && canEditProject(userProfile, projectId)),
    isCurrent: () => Boolean(mounted.current && current.current === captured && allowed && auth.currentUser?.uid === user?.uid)};
}
