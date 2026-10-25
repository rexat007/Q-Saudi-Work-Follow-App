import { auth } from '../firebase/config';
/** Protected projection transport. No fallback to browser repositories or offline cache. */
export async function canonicalProjectRead<T = any>(projectId: string, surface: string): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('UNAUTHENTICATED');
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/${surface}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`CANONICAL_PROJECT_READ_FAILED:${response.status}`);
  const json = await response.json(); if (json.success !== true || !Object.hasOwn(json, 'data')) throw new Error('CANONICAL_PROJECT_READ_INVALID');
  if (json.data && !Array.isArray(json.data) && json.data.projectId !== projectId) throw new Error('CANONICAL_PROJECT_READ_SCOPE_MISMATCH');
  return json.data;
}
