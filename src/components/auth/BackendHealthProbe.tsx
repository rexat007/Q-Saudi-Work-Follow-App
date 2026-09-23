import { useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/authContext';

export function BackendHealthProbe() {
  const { idToken, user } = useAuth();
  const ranRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !idToken) {
      return;
    }

    // Only run once per unique token to prevent repeated execution on render cycles
    if (ranRef.current === idToken) {
      return;
    }
    ranRef.current = idToken;

    console.log('[BackendHealthProbe] START');

    fetch('/api/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        console.log(`[BackendHealthProbe] HTTP ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          // Report success and only safe fields
          console.log('[BackendHealthProbe] SUCCESS', {
            status: data.status,
            service: data.service,
            sourceOfTruth: data.sourceOfTruth,
            projection: data.projection,
          });
        } else {
          const errText = await response.text();
          console.error(`[BackendHealthProbe] FAILURE ${response.status}: ${errText}`);
        }
      })
      .catch((error) => {
        console.error('[BackendHealthProbe] FAILURE Network/Request error:', error.message || error);
      });
  }, [idToken, user]);

  return null;
}
