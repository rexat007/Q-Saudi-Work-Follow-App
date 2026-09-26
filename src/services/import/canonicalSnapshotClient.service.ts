import { auth } from '../../firebase/config';
import { CanonicalSnapshotBundle, CanonicalSnapshotIds } from '../canonicalSnapshot.server';

export class CanonicalSnapshotClientService {
  public async getTripCanonicalSnapshot(
    projectId: string,
    ids: CanonicalSnapshotIds
  ): Promise<CanonicalSnapshotBundle> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('UNAUTHENTICATED');
    }

    const token = await currentUser.getIdToken();

    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/canonical-snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ids),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const error = new Error(result.error || 'Failed to fetch canonical snapshot');
      (error as any).code = result.code || 'CANONICAL_SNAPSHOT_FAILED';
      throw error;
    }

    return result.data;
  }
}

export const canonicalSnapshotClientService = new CanonicalSnapshotClientService();
