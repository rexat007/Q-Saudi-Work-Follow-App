/**
 * BLOCK 115 — Canonical Repositories & Firestore Adapters
 * Implements the 10 canonical repositories mapping to strict Firestore paths per Blocks 106 & 109.
 * Zero database writes or schema changes.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { 
  CanonicalProject, 
  CanonicalProjectRoster, 
  CanonicalPricingRule, 
  CanonicalTrip, 
  CanonicalException, 
  CanonicalImportOperation, 
  CanonicalUser, 
  CanonicalProjectMembership, 
  CanonicalAuditLog, 
  CanonicalStorageProfile,
  ConcurrencyContext,
  IdempotencyContext 
} from '../types/canonicalContracts';

export class CanonicalProjectRepository {
  private readonly collectionName = 'projects';

  async getById(projectId: string): Promise<CanonicalProject | null> {
    if (!auth.currentUser) return null;
    const path = `${this.collectionName}/${projectId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, projectId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalProject;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  async listProjects(): Promise<CanonicalProject[]> {
    if (!auth.currentUser) return [];
    try {
      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs.map(d => d.data() as CanonicalProject);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      return [];
    }
  }
}

export class CanonicalProjectRosterRepository {
  async getById(projectId: string, rosterId: string): Promise<CanonicalProjectRoster | null> {
    if (!auth.currentUser) return null;
    const path = `projects/${projectId}/roster/${rosterId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'roster', rosterId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalProjectRoster;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  async listByProject(projectId: string): Promise<CanonicalProjectRoster[]> {
    if (!auth.currentUser) return [];
    const path = `projects/${projectId}/roster`;
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'roster'));
      return snap.docs.map(d => d.data() as CanonicalProjectRoster);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
}

export class CanonicalPricingRepository {
  async getById(projectId: string, pricingRuleId: string): Promise<CanonicalPricingRule | null> {
    if (!auth.currentUser) return null;
    const path = `projects/${projectId}/pricingRules/${pricingRuleId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'pricingRules', pricingRuleId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalPricingRule;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  async listByProject(projectId: string): Promise<CanonicalPricingRule[]> {
    if (!auth.currentUser) return [];
    const path = `projects/${projectId}/pricingRules`;
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'pricingRules'));
      return snap.docs.map(d => d.data() as CanonicalPricingRule);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
}

export class CanonicalTripRepository {
  async getById(projectId: string, tripId: string): Promise<CanonicalTrip | null> {
    if (!auth.currentUser) return null;
    const path = `projects/${projectId}/trips/${tripId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'trips', tripId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalTrip;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  async listByProject(projectId: string): Promise<CanonicalTrip[]> {
    if (!auth.currentUser) return [];
    const path = `projects/${projectId}/trips`;
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'trips'));
      return snap.docs.map(d => d.data() as CanonicalTrip);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
}

export class CanonicalExceptionRepository {
  async getById(projectId: string, exceptionId: string): Promise<CanonicalException | null> {
    if (!auth.currentUser) return null;
    const path = `projects/${projectId}/exceptions/${exceptionId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'exceptions', exceptionId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalException;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }
}

export class CanonicalImportRepository {
  async getById(projectId: string, importId: string): Promise<CanonicalImportOperation | null> {
    if (!auth.currentUser) return null;
    const path = `projects/${projectId}/imports/${importId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'imports', importId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalImportOperation;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }
}

export class CanonicalUserRepository {
  async getById(userId: string): Promise<CanonicalUser | null> {
    if (!auth.currentUser) return null;
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }
}

export class CanonicalMembershipRepository {
  async listByProject(projectId: string): Promise<CanonicalProjectMembership[]> {
    if (!auth.currentUser) return [];
    const path = `projects/${projectId}/membership`;
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'membership'));
      return snap.docs.map(d => d.data() as CanonicalProjectMembership);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
}

export class CanonicalAuditRepository {
  async listRecent(): Promise<CanonicalAuditLog[]> {
    if (!auth.currentUser) return [];
    const path = 'auditLogs';
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      return snap.docs.map(d => d.data() as CanonicalAuditLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
}

export class CanonicalStorageRepository {
  async getProfile(userId: string): Promise<CanonicalStorageProfile | null> {
    if (!auth.currentUser) return null;
    const path = `users/${userId}/storageProfile`;
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'storageProfile'));
      if (!snap.exists()) return null;
      return snap.data() as CanonicalStorageProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }
}

// Export singletons for canonical persistence adapters
export const projectRepository = new CanonicalProjectRepository();
export const projectRosterRepository = new CanonicalProjectRosterRepository();
export const pricingRepository = new CanonicalPricingRepository();
export const tripRepository = new CanonicalTripRepository();
export const exceptionRepository = new CanonicalExceptionRepository();
export const importRepository = new CanonicalImportRepository();
export const userRepository = new CanonicalUserRepository();
export const membershipRepository = new CanonicalMembershipRepository();
export const auditRepository = new CanonicalAuditRepository();
export const storageRepository = new CanonicalStorageRepository();
