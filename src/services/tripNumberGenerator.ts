import { 
  doc, 
  getDoc,
  runTransaction, 
  getDocs, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { TripEntity } from '../types/entities';

export class TripNumberGenerator {
  private static inMemoryCounters: Record<string, number> = {};

  /**
   * Resets in-memory counters for testing purposes
   */
  public static resetInMemorySequence(projectId: string, startVal = 1): void {
    this.inMemoryCounters[projectId] = startVal;
  }

  /**
   * Generates next unique sequential trip number per project.
   * Concurrency-safe: uses a transaction on systemCounters/tripNumber_{projectId}.
   * Falls back to in-memory count if unauthenticated or offline.
   */
  public static async getNextTripNumber(projectId: string, projectNumberVal?: number): Promise<string> {
    let formattedProjNum = 'Q-PRJ-0000';
    
    if (projectNumberVal !== undefined) {
      formattedProjNum = `Q-PRJ-${String(projectNumberVal).padStart(4, '0')}`;
    } else {
      // Fetch project to get its projectNumber
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const projData = projectSnap.data();
          if (projData && typeof projData.projectNumber === 'number') {
            formattedProjNum = `Q-PRJ-${String(projData.projectNumber).padStart(4, '0')}`;
          }
        }
      } catch (err) {
        console.warn('[TripNumberGenerator] Could not fetch project for formatting, falling back:', err);
      }
    }

    let nextNumber = 1;

    if (!auth.currentUser) {
      const current = this.inMemoryCounters[projectId] || 1;
      this.inMemoryCounters[projectId] = current + 1;
      nextNumber = current;
    } else {
      try {
        const counterRef = doc(db, 'systemCounters', `tripNumber_${projectId}`);
        nextNumber = await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          let seq = 1;
          if (counterSnap.exists()) {
            const data = counterSnap.data();
            seq = typeof data.nextNumber === 'number' ? data.nextNumber : 1;
          } else {
            // Check existing trips to find the max index as fallback
            try {
              const tripsSnap = await getDocs(collection(db, 'projects', projectId, 'trips'));
              let maxExisting = 0;
              tripsSnap.docs.forEach((d) => {
                const data = d.data() as TripEntity;
                if (data && data.tripNumber) {
                  const parts = data.tripNumber.split('-TRP-');
                  if (parts.length === 2) {
                    const idx = parseInt(parts[1], 10);
                    if (!isNaN(idx)) {
                      maxExisting = Math.max(maxExisting, idx);
                    }
                  }
                }
              });
              seq = maxExisting > 0 ? maxExisting + 1 : 1;
            } catch {
              seq = 1;
            }
          }

          transaction.set(counterRef, {
            nextNumber: seq + 1,
            updatedAt: serverTimestamp(),
          });

          return seq;
        });
      } catch (error) {
        console.warn('[TripNumberGenerator] Firestore transaction fallback to in-memory sequence:', error);
        const current = this.inMemoryCounters[projectId] || 1;
        this.inMemoryCounters[projectId] = current + 1;
        nextNumber = current;
      }
    }

    const formattedTripNum = `TRP-${String(nextNumber).padStart(5, '0')}`;
    return `${formattedProjNum}-${formattedTripNum}`;
  }
}
