import { decodeSessionChunks, encodeSessionChunks, validateSessionChunk } from './import/sessionArtifactCodec';
import { createHash } from 'node:crypto';
import { sessionError } from './import/durableSessionContract';

export const SESSION_CHUNK_BYTES = 240000;
export interface SessionArtifactManifest { artifactId: string; count: number; digest: string; }
export const artifactDigest = (value: string) => createHash('sha256').update(value).digest('hex');
export function validateManifest(value: any): void {
  if (!value || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.artifactId) || !Number.isSafeInteger(value.count) || value.count < 1 || value.count > 2048 || !/^[0-9a-f]{64}$/.test(value.digest)) sessionError('INVALID_IMPORT_SESSION_ARTIFACT');
}
export async function readSessionArtifact(reader: (ref: any) => Promise<any>, sessionRef: any, manifest: SessionArtifactManifest, expectedVersion?: number): Promise<any> {
  validateManifest(manifest);
  const chunks: string[] = [];
  // Independent immutable chunk reads are bounded in parallel; no writes occur before completeness validation.
  for (let offset=0;offset<manifest.count;offset+=32) {
    const group=await Promise.all(Array.from({length:Math.min(32,manifest.count-offset)},async(_,relative)=>{
      const index=offset+relative;
      const snap=await reader(sessionRef.collection('checkpointChunks').doc(`${manifest.artifactId}_${index}`));
      const chunk=snap.exists?snap.data():null;
      if(!chunk||chunk.artifactId!==manifest.artifactId||chunk.index!==index||chunk.count!==manifest.count||chunk.digest!==manifest.digest||typeof chunk.text!=='string'||Buffer.byteLength(chunk.text)>SESSION_CHUNK_BYTES)sessionError('INVALID_IMPORT_SESSION_ARTIFACT');
      if(expectedVersion!==undefined&&chunk.stagedVersion!==expectedVersion)sessionError('INVALID_IMPORT_SESSION_ARTIFACT_REVISION');
      validateSessionChunk(chunk.text);return chunk.text as string;
    }));
    chunks.push(...group);
  }
  if (artifactDigest(chunks.join('')) !== manifest.digest) sessionError('INVALID_IMPORT_SESSION_ARTIFACT');
  return decodeSessionChunks(chunks);
}
/** Server-side packing for small callers/tests; large browser callers stage the same format over bounded requests. */
export function packSessionArtifact(value: unknown) {
  const chunks = encodeSessionChunks(value);
  const digest = artifactDigest(chunks.join(''));
  const manifest = { artifactId: crypto.randomUUID(), count: chunks.length, digest };
  validateManifest(manifest);
  return { manifest, chunks };
}
