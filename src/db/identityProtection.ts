import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { GlobalIdentityError, normalizeNaturalKey, type GlobalKind } from '../utils/globalIdentityPolicy';

function secret(variable: string): Buffer {
  const value = process.env[variable];
  if (!value || !/^[0-9a-f]{64}$/i.test(value)) throw new GlobalIdentityError('IDENTITY_SECRET_UNAVAILABLE');
  return Buffer.from(value, 'hex');
}

/** Keys are provisioned by the server's secret manager. No fallback or logging. */
export class IdentityProtection {
  private readonly hmac = secret('QSA_IDENTITY_HMAC_KEY');
  private readonly encryption = secret('QSA_IDENTITY_ENCRYPTION_KEY');
  readonly version: string;

  constructor() {
    const label = process.env.QSA_IDENTITY_KEY_VERSION || '1';
    if (this.hmac.equals(this.encryption) || !/^[a-zA-Z0-9_-]{1,32}$/.test(label)) {
      throw new GlobalIdentityError('IDENTITY_SECRET_UNAVAILABLE');
    }
    // Detect accidental secret replacement even if an operator reuses the label.
    this.version = label + ':' + createHmac('sha256',this.hmac).update(this.encryption).digest('hex').slice(0,24);
  }

  digest(domain: string, value: unknown): Buffer {
    return createHmac('sha256', this.hmac).update(JSON.stringify([this.version, domain, value])).digest();
  }

  natural(company: string, kind: GlobalKind, raw: unknown): Buffer {
    return this.digest('natural', [company.toLowerCase(), kind, normalizeNaturalKey(kind, raw)]);
  }

  seal(value: unknown, scope: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryption, iv);
    cipher.setAAD(Buffer.from(JSON.stringify([this.version, scope])));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return [this.version, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
  }

  open<T>(sealed: string, scope: string): T {
    try {
      const [version, iv, tag, data, extra] = sealed.split('.');
      if (version !== this.version || extra !== undefined) throw new Error();
      const decipher = createDecipheriv('aes-256-gcm', this.encryption, Buffer.from(iv, 'base64url'));
      decipher.setAAD(Buffer.from(JSON.stringify([version, scope])));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8'));
    } catch {
      throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    }
  }
}

/** Stable command hashing is keyed because low-entropy natural IDs are sensitive. */
export function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([, child]) => child !== undefined).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => [key, stableValue(child)]));
  return value;
}
