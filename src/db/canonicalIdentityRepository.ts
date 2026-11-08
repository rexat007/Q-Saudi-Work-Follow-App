import { randomUUID } from 'node:crypto';
import { GLOBAL_IDENTITIES, GlobalIdentityError, normalizeNaturalKey, validGlobalId, type GlobalKind } from '../utils/globalIdentityPolicy';
import { normalizeArabicText, normalizePhone, normalizeIdNumber } from '../utils/normalization';
import { IdentityProtection, stableValue } from './identityProtection.js';
import type { UnitOfWork } from './unitOfWork.js';

export const identitySpec = (kind: GlobalKind) => {
  if (!Object.hasOwn(GLOBAL_IDENTITIES, kind)) throw new GlobalIdentityError('INVALID_NATURAL_KEY');
  return { table: GLOBAL_IDENTITIES[kind].collection, member: `project_${GLOBAL_IDENTITIES[kind].collection}`,
    field: `${GLOBAL_IDENTITIES[kind].kind}_id`, prefix: { DRIVER: 'DRV', TRUCK: 'TRK', CARRIER: 'CAR', MATERIAL: 'MAT' }[kind] };
};
export interface LegacyIdentitySource { legacyId: string; firestorePath: string }
export interface CreateIdentityInput {
  kind: GlobalKind; naturalKey: string; profile: Record<string, unknown>;
  externalId?: string; source?: LegacyIdentitySource;
}

const fields: Record<GlobalKind, string[]> = {
  DRIVER: ['fullNameAr','phone','licenseNumber','licenseValidUntil','nationality'],
  TRUCK: ['vin','truckType','tareWeightKg','maxGrossWeightKg','legalPayloadLimitKg','primaryCarrierId','mvpiValidUntil','insuranceValidUntil'],
  CARRIER: ['nameAr','transportLicenseNo','vatNumber','contactPerson'],
  MATERIAL: ['nameAr','nameEn','unitOfMeasure','standardDensityTonPerM3','maxAllowableMoisturePercent'],
};
const invalid = (): never => { throw new GlobalIdentityError('INVALID_GLOBAL_PROFILE'); };

export function canonicalProfile(input: CreateIdentityInput): Record<string, any> {
  identitySpec(input.kind);
  const key = normalizeNaturalKey(input.kind, input.naturalKey);
  if (!input.profile || typeof input.profile !== 'object' || Array.isArray(input.profile)
    || Object.keys(input.profile).some(field => !fields[input.kind].includes(field))) invalid();
  const profile = stableValue(input.profile) as Record<string, any>;
  for (const [field, value] of Object.entries(profile)) {
    if (field === 'contactPerson') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !['name','phone','email'].includes(k))
        || ['name','phone','email'].some(k => typeof value[k] !== 'string' || value[k].length > 300)) invalid();
      value.phone = normalizePhone(value.phone);
    } else if (field.endsWith('Kg') || field === 'standardDensityTonPerM3' || field === 'maxAllowableMoisturePercent') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e9) invalid();
    } else if (typeof value !== 'string' || value.length > 2000) invalid();
    if (field.endsWith('ValidUntil') && (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))) invalid();
  }
  if (input.kind === 'DRIVER') {
    if (typeof profile.fullNameAr !== 'string' || !profile.fullNameAr.trim()) invalid();
    profile.fullNameAr = normalizeArabicText(profile.fullNameAr);
    profile.phone = normalizePhone(profile.phone || '');
    profile.nationalId = key;
  } else if (input.kind === 'TRUCK') {
    profile.plate = input.naturalKey.trim(); profile.normalizedPlate = key;
    if (profile.truckType !== undefined && !['TIPPER_32M3','TRAILER_24M','FLATBED','DUMPER'].includes(profile.truckType)) invalid();
    if (profile.primaryCarrierId !== undefined && !validGlobalId(profile.primaryCarrierId)) invalid();
    if (profile.tareWeightKg !== undefined && profile.maxGrossWeightKg !== undefined) {
      if (profile.maxGrossWeightKg <= profile.tareWeightKg) invalid();
      const payload = profile.maxGrossWeightKg - profile.tareWeightKg;
      if (profile.legalPayloadLimitKg !== undefined && profile.legalPayloadLimitKg !== payload) invalid();
      profile.legalPayloadLimitKg = payload;
    }
  } else {
    if (typeof profile.nameAr !== 'string' || !profile.nameAr.trim()) invalid();
    profile.nameAr = normalizeArabicText(profile.nameAr);
    if (input.kind === 'CARRIER') profile.commercialRegistrationNo = key;
    else {
      if (!['TON','M3','TRIP'].includes(profile.unitOfMeasure)) invalid();
      if (profile.maxAllowableMoisturePercent !== undefined && profile.maxAllowableMoisturePercent > 100) invalid();
      profile.code = key;
    }
  }
  if (Buffer.byteLength(JSON.stringify(profile)) > 16000) invalid();
  return profile;
}

export class CanonicalIdentityRepository {
  constructor(private uow: UnitOfWork, private protection: IdentityProtection) {}
  private scope(kind: GlobalKind, external: string) { return `${this.uow.context.companyId}/${kind}/${external}`; }

  toIdentity(kind: GlobalKind, row: any) {
    if (!row || !validGlobalId(row.external_id) || !GLOBAL_IDENTITIES[kind].statuses.includes(row.status as never)
      || !row.profile_encrypted || row.crypto_key_version !== this.protection.version || !Buffer.isBuffer(row.natural_key_hmac)) {
      throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    }
    const profile = this.protection.open<Record<string, any>>(row.profile_encrypted, this.scope(kind, row.external_id));
    const raw = profile[GLOBAL_IDENTITIES[kind].natural];
    if (!this.protection.natural(this.uow.context.companyId, kind, raw).equals(row.natural_key_hmac)) {
      throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    }
    if ((kind==='DRIVER' && (!Buffer.isBuffer(row.identity_key_hmac) || !row.identity_key_hmac.equals(row.natural_key_hmac)))
      || (kind==='CARRIER' && (!Buffer.isBuffer(row.registration_key_hmac) || !row.registration_key_hmac.equals(row.natural_key_hmac)))
      || (kind==='TRUCK' && row.normalized_plate!==profile.normalizedPlate)
      || (kind==='MATERIAL' && row.code_normalized!==profile.code)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    const revision = Number(row.revision);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    return { ...profile, [GLOBAL_IDENTITIES[kind].id]:row.external_id,
      id: row.id as string, externalId: row.external_id as string, kind, status: row.status as string,
      revision, version:revision, profile, createdAt: row.created_at, updatedAt: row.updated_at,
      createdBy: row.created_by, updatedBy: row.updated_by };
  }

  async get(kind: GlobalKind, identifier: string, lock = false) {
    const { table } = identitySpec(kind);
    if (!validGlobalId(identifier)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    const result = await this.uow.query(`SELECT * FROM ${table} WHERE company_id=$1
      AND (id::text=$2 OR external_id=$2) ${lock ? 'FOR UPDATE' : ''}`, [this.uow.context.companyId, identifier]);
    if (!result.rowCount) throw new GlobalIdentityError('GLOBAL_ENTITY_NOT_FOUND', kind);
    if (result.rowCount !== 1) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    this.toIdentity(kind, result.rows[0]);
    return result.rows[0];
  }

  async resolve(kind: GlobalKind, raw: string) {
    const { table } = identitySpec(kind), company = this.uow.context.companyId;
    const key = this.protection.natural(company, kind, raw);
    await this.assertReconciled(kind);
    const rows = await this.uow.query(`SELECT * FROM ${table} WHERE company_id=$1 AND natural_key_hmac=$2`, [company, key]);
    const lookup = await this.uow.query(`SELECT target_external_id,verification_status FROM identity_keys
      WHERE company_id=$1 AND kind=$2 AND key_hmac=$3`, [company, kind, key]);
    if (!rows.rowCount && !lookup.rowCount) return null;
    if (rows.rowCount !== 1 || lookup.rowCount !== 1 || lookup.rows[0].verification_status !== 'VERIFIED'
      || lookup.rows[0].target_external_id !== rows.rows[0].external_id) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    return this.toIdentity(kind, rows.rows[0]);
  }

  private async assertReconciled(kind: GlobalKind) {
    const {table} = identitySpec(kind);
    if ((await this.uow.query(`SELECT 1 FROM ${table} WHERE company_id=$1 AND
      (natural_key_hmac IS NULL OR crypto_key_version IS DISTINCT FROM $2) LIMIT 1`,
    [this.uow.context.companyId,this.protection.version])).rowCount) throw new GlobalIdentityError('IDENTITY_RECONCILIATION_REQUIRED');
  }

  async create(input: CreateIdentityInput, operationId: string) {
    const { table, prefix } = identitySpec(input.kind), { companyId, actorId } = this.uow.context;
    const profile = canonicalProfile(input);
    const key = this.protection.natural(companyId, input.kind, input.naturalKey);
    await this.uow.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`identity/${companyId}/${input.kind}/${key.toString('hex')}`]);
    // Unknown legacy/HMAC provenance cannot safely participate in deduplication.
    await this.assertReconciled(input.kind);
    const existing = await this.resolve(input.kind, input.naturalKey);
    if (existing && input.externalId && existing.externalId !== input.externalId) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    let identity = existing;
    if (!identity) {
      const external = input.externalId || `${prefix}-${randomUUID().replaceAll('-', '')}`;
      const normalized = normalizeNaturalKey(input.kind, input.naturalKey);
      if (!validGlobalId(external) || (['DRIVER','CARRIER'].includes(input.kind) && normalizeIdNumber(external).includes(normalized))) invalid();
      if ((await this.uow.query(`SELECT 1 FROM ${table} WHERE company_id=$1 AND id::text=$2`,[companyId,external])).rowCount) {
        throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
      }
      const reservation = await this.uow.query(`INSERT INTO identity_key_reservations
        (id,company_id,kind,key_hmac,operation_id,expires_at) VALUES($1,$2,$3,$4,$5,clock_timestamp()+interval '5 minutes')
        ON CONFLICT(company_id,kind,key_hmac) DO UPDATE SET operation_id=EXCLUDED.operation_id,expires_at=EXCLUDED.expires_at
        WHERE identity_key_reservations.expires_at<=clock_timestamp() OR identity_key_reservations.operation_id=EXCLUDED.operation_id
        RETURNING id`, [randomUUID(),companyId,input.kind,key,operationId]);
      if (!reservation.rowCount) throw new GlobalIdentityError('IDENTITY_RESERVATION_CONFLICT');
      if (input.kind === 'TRUCK' && profile.primaryCarrierId && !(await this.uow.query(
        'SELECT 1 FROM carriers WHERE company_id=$1 AND external_id=$2', [companyId,profile.primaryCarrierId])).rowCount) {
        throw new GlobalIdentityError('GLOBAL_ENTITY_NOT_FOUND', 'CARRIER');
      }
      const columns = ['id','company_id','external_id','status','natural_key_hmac','profile_encrypted','crypto_key_version','created_by','updated_by'];
      const values: unknown[] = [randomUUID(),companyId,external,'ACTIVE',key,
        this.protection.seal(profile,this.scope(input.kind,external)),this.protection.version,actorId,actorId];
      if (input.kind !== 'TRUCK') { columns.push('name'); values.push(input.kind === 'DRIVER' ? external : profile.nameAr); }
      if (input.kind === 'DRIVER') { columns.push('identity_key_hmac','name_encrypted','phone_encrypted');
        values.push(key,this.protection.seal(profile.fullNameAr,this.scope(input.kind,external)+'/name'),
          this.protection.seal(profile.phone,this.scope(input.kind,external)+'/phone')); }
      if (input.kind === 'CARRIER') { columns.push('registration_key_hmac'); values.push(key); }
      if (input.kind === 'TRUCK') { columns.push('normalized_plate','type','weights_profile');
        values.push(profile.normalizedPlate,profile.truckType || 'UNSPECIFIED',JSON.stringify({ tareWeightKg:profile.tareWeightKg,
          maxGrossWeightKg:profile.maxGrossWeightKg,legalPayloadLimitKg:profile.legalPayloadLimitKg })); }
      if (input.kind === 'MATERIAL') { columns.push('code_normalized','unit'); values.push(profile.code,profile.unitOfMeasure); }
      const inserted = await this.uow.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${values.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,values);
      await this.uow.query(`INSERT INTO identity_keys(id,company_id,kind,key_hmac,target_external_id,verification_status)
        VALUES($1,$2,$3,$4,$5,'VERIFIED')`, [randomUUID(),companyId,input.kind,key,external]);
      identity = this.toIdentity(input.kind,inserted.rows[0]);
    }
    let mapped = false;
    if (input.source) mapped = await this.mapSource(input.kind,identity.externalId,input.source);
    return { identity, created: !existing, changed: !existing || mapped };
  }

  private async mapSource(kind: GlobalKind, external: string, source: LegacyIdentitySource) {
    const spec = GLOBAL_IDENTITIES[kind];
    if (!source || Object.keys(source).some(k=>!['legacyId','firestorePath'].includes(k)) || !validGlobalId(source.legacyId)
      || source.firestorePath !== `${spec.collection}/${source.legacyId}`) throw new GlobalIdentityError('INVALID_LEGACY_IDENTITY_MAPPING');
    const {companyId,actorId} = this.uow.context;
    const hash = this.protection.digest('legacy',[companyId,kind,source.firestorePath]);
    const result = await this.uow.query(`INSERT INTO legacy_identity_mappings
      (id,company_id,kind,source_key_hmac,source_encrypted,target_external_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(company_id,kind,source_key_hmac) DO NOTHING RETURNING id`,
    [randomUUID(),companyId,kind,hash,this.protection.seal(source,`${companyId}/${kind}/legacy/${hash.toString('hex')}`),external,actorId]);
    if (!result.rowCount) {
      const previous = await this.uow.query(`SELECT target_external_id FROM legacy_identity_mappings WHERE company_id=$1 AND kind=$2 AND source_key_hmac=$3`,[companyId,kind,hash]);
      if (previous.rows[0]?.target_external_id !== external) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    }
    return Boolean(result.rowCount);
  }
}
