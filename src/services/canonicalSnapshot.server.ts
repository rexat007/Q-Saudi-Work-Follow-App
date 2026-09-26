import { adminDb } from '../firebase/admin';

export class SnapshotError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, SnapshotError.prototype);
  }
}

export interface CanonicalSnapshotIds {
  carrierId: string;
  truckId: string;
  driverId: string;
  materialId: string;
}

export interface CanonicalSnapshotContext {
  userId: string;
  role?: string;
}

export interface CarrierSnapshot {
  carrierId: string;
  companyNameAr: string;
  commercialRegistrationNo: string;
}

export interface TruckSnapshot {
  truckId: string;
  plateNumberAr: string;
  tareWeightKg: number;
  legalPayloadLimitKg: number;
}

export interface DriverSnapshot {
  driverId: string;
  fullNameAr: string;
  nationalOrIqamaId: string;
  phone: string;
}

export interface MaterialSnapshot {
  materialId: string;
  code: string;
  nameAr: string;
  unitOfMeasure: string;
}

export interface CanonicalSnapshotBundle {
  projectId: string;
  carrierSnapshot: CarrierSnapshot;
  truckSnapshot: TruckSnapshot;
  driverSnapshot: DriverSnapshot;
  materialSnapshot: MaterialSnapshot;
}

export class CanonicalSnapshotServerService {
  public async getTripCanonicalSnapshot(
    projectId: string,
    ids: CanonicalSnapshotIds,
    context: CanonicalSnapshotContext
  ): Promise<CanonicalSnapshotBundle> {
    // 1. Basic Server Invariant Validations (Section B)
    if (!context || !context.userId) {
      throw new SnapshotError('UNAUTHENTICATED', 'المستخدم غير مصادق عليه');
    }
    if (!projectId || !projectId.trim()) {
      throw new SnapshotError('PROJECT_ID_REQUIRED', 'معرف المشروع مطلوب');
    }
    if (!ids.carrierId || !ids.carrierId.trim()) {
      throw new SnapshotError('CANONICAL_CARRIER_ID_REQUIRED', 'معرف الناقل المعتمد مطلوب');
    }
    if (!ids.truckId || !ids.truckId.trim()) {
      throw new SnapshotError('CANONICAL_TRUCK_ID_REQUIRED', 'معرف الشاحنة المعتمد مطلوب');
    }
    if (!ids.driverId || !ids.driverId.trim()) {
      throw new SnapshotError('CANONICAL_DRIVER_ID_REQUIRED', 'معرف السائق المعتمد مطلوب');
    }
    if (!ids.materialId || !ids.materialId.trim()) {
      throw new SnapshotError('CANONICAL_MATERIAL_ID_REQUIRED', 'معرف المادة المعتمد مطلوب');
    }

    const { carrierId, truckId, driverId, materialId } = ids;

    // 2. ACTIVE Project Membership Verification (Section C)
    const [
      carrierMembership,
      truckMembership,
      driverMembership,
      materialMembership
    ] = await Promise.all([
      adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId).get(),
      adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId).get(),
      adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId).get(),
      adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId).get(),
    ]);

    if (!carrierMembership.exists || carrierMembership.data()?.status !== 'ACTIVE') {
      throw new SnapshotError('CARRIER_NOT_ACTIVE_IN_PROJECT', 'الناقل ليس نشطاً في هذا المشروع');
    }
    if (!truckMembership.exists || truckMembership.data()?.status !== 'ACTIVE') {
      throw new SnapshotError('TRUCK_NOT_ACTIVE_IN_PROJECT', 'الشاحنة ليست نشطة في هذا المشروع');
    }
    if (!driverMembership.exists || driverMembership.data()?.status !== 'ACTIVE') {
      throw new SnapshotError('DRIVER_NOT_ACTIVE_IN_PROJECT', 'السائق ليس نشطاً في هذا المشروع');
    }
    if (!materialMembership.exists || materialMembership.data()?.status !== 'ACTIVE') {
      throw new SnapshotError('MATERIAL_NOT_ACTIVE_IN_PROJECT', 'المادة ليست نشطة في هذا المشروع');
    }

    // 3. Global Canonical Read (Section D)
    const [
      carrierDoc,
      truckDoc,
      driverDoc,
      materialDoc
    ] = await Promise.all([
      adminDb.collection('carriers').doc(carrierId).get(),
      adminDb.collection('trucks').doc(truckId).get(),
      adminDb.collection('drivers').doc(driverId).get(),
      adminDb.collection('materials').doc(materialId).get(),
    ]);

    // 4. Global Doc Existence & ID Integrity (Section E)
    if (!carrierDoc.exists) {
      throw new SnapshotError('CANONICAL_CARRIER_NOT_FOUND', 'لم يتم العثور على الناقل المعتمد');
    }
    if (!truckDoc.exists) {
      throw new SnapshotError('CANONICAL_TRUCK_NOT_FOUND', 'لم يتم العثور على الشاحنة المعتمدة');
    }
    if (!driverDoc.exists) {
      throw new SnapshotError('CANONICAL_DRIVER_NOT_FOUND', 'لم يتم العثور على السائق المعتمد');
    }
    if (!materialDoc.exists) {
      throw new SnapshotError('CANONICAL_MATERIAL_NOT_FOUND', 'لم يتم العثور على المادة المعتمدة');
    }

    const carrierData = carrierDoc.data();
    const truckData = truckDoc.data();
    const driverData = driverDoc.data();
    const materialData = materialDoc.data();

    if (carrierData.carrierId && carrierData.carrierId !== carrierId) {
      throw new SnapshotError('CANONICAL_IDENTITY_MISMATCH', 'معرف الكيان المخزن للناقل لا يطابق المطلوب');
    }
    if (truckData.truckId && truckData.truckId !== truckId) {
      throw new SnapshotError('CANONICAL_IDENTITY_MISMATCH', 'معرف الكيان المخزن للشاحنة لا يطابق المطلوب');
    }
    if (driverData.driverId && driverData.driverId !== driverId) {
      throw new SnapshotError('CANONICAL_IDENTITY_MISMATCH', 'معرف الكيان المخزن للسائق لا يطابق المطلوب');
    }
    if (materialData.materialId && materialData.materialId !== materialId) {
      throw new SnapshotError('CANONICAL_IDENTITY_MISMATCH', 'معرف الكيان المخزن للمادة لا يطابق المطلوب');
    }

    // 5. Relationship Integrity (Section F)
    const [driverAffiliation, truckAffiliation] = await Promise.all([
      adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId).get(),
      adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId).get(),
    ]);

    if (!driverAffiliation.exists || driverAffiliation.data()?.carrierId !== carrierId) {
      throw new SnapshotError('DRIVER_CARRIER_AFFILIATION_CONFLICT', 'تعارض في ارتباط السائق بالناقل في هذا المشروع');
    }
    if (!truckAffiliation.exists || truckAffiliation.data()?.carrierId !== carrierId) {
      throw new SnapshotError('TRUCK_CARRIER_AFFILIATION_CONFLICT', 'تعارض في ارتباط الشاحنة بالناقل في هذا المشروع');
    }

    // 6. Normalization & Fail-Closed Checks (Section G)
    const companyNameAr = carrierData.nameAr || carrierData.companyNameAr || carrierData.companyName || carrierData.name;
    const commercialRegistrationNo = carrierData.commercialRegistrationNo;

    if (!companyNameAr || !commercialRegistrationNo) {
      throw new SnapshotError('CANONICAL_SNAPSHOT_DATA_MISSING', 'بيانات لقطة الناقل ناقصة في المرجع العالمي');
    }

    const plateNumberAr = truckData.plate || truckData.plateNumberAr;
    const tareWeightKg = truckData.tareWeightKg;
    let legalPayloadLimitKg = truckData.legalPayloadLimitKg;

    if (legalPayloadLimitKg === undefined || legalPayloadLimitKg === null) {
      const maxGrossWeightKg = truckData.maxGrossWeightKg;
      if (tareWeightKg !== undefined && tareWeightKg !== null && maxGrossWeightKg !== undefined && maxGrossWeightKg !== null) {
        legalPayloadLimitKg = maxGrossWeightKg - tareWeightKg;
      }
    }

    if (!plateNumberAr || tareWeightKg === undefined || tareWeightKg === null || legalPayloadLimitKg === undefined || legalPayloadLimitKg === null) {
      throw new SnapshotError('CANONICAL_SNAPSHOT_DATA_MISSING', 'بيانات لقطة الشاحنة ناقصة في المرجع العالمي');
    }

    const fullNameAr = driverData.fullNameAr || driverData.name;
    const nationalOrIqamaId = driverData.nationalId || driverData.nationalOrIqamaId || driverData.idNumber;
    const phone = driverData.phone;

    if (!fullNameAr || !nationalOrIqamaId || !phone) {
      throw new SnapshotError('CANONICAL_SNAPSHOT_DATA_MISSING', 'بيانات لقطة السائق ناقصة في المرجع العالمي');
    }

    const code = materialData.code;
    const nameAr = materialData.nameAr || materialData.name;
    const unitOfMeasure = materialData.unitOfMeasure;

    if (!code || !nameAr || !unitOfMeasure) {
      throw new SnapshotError('CANONICAL_SNAPSHOT_DATA_MISSING', 'بيانات لقطة المادة ناقصة في المرجع العالمي');
    }

    // 7. Response Contract (Section H)
    return {
      projectId,
      carrierSnapshot: {
        carrierId,
        companyNameAr,
        commercialRegistrationNo,
      },
      truckSnapshot: {
        truckId,
        plateNumberAr,
        tareWeightKg,
        legalPayloadLimitKg,
      },
      driverSnapshot: {
        driverId,
        fullNameAr,
        nationalOrIqamaId,
        phone,
      },
      materialSnapshot: {
        materialId,
        code,
        nameAr,
        unitOfMeasure,
      },
    };
  }
}

export const canonicalSnapshotServerService = new CanonicalSnapshotServerService();
