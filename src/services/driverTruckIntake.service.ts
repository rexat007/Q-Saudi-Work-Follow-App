import { auth } from '../firebase/config';
import { AuthUserContext } from '../types/common';

export interface DriverTruckIntakePayload {
  projectId: string;
  carrierId: string;
  materialId: string;
  driverName: string;
  plateNumber: string;
  phone?: string;
  residencyId?: string;
  truckType?: 'TIPPER_32M3' | 'TRAILER_24M' | 'FLATBED' | 'DUMPER';
  tareWeightKg?: number;
  maxGrossWeightKg?: number;
}

export interface DriverTruckIntakeResult {
  projectId: string;
  driverId: string;
  truckId: string;
  carrierId: string;
  materialId: string;
  driverMembershipStatus: string;
  truckMembershipStatus: string;
  driverCarrierAffiliationStatus: string;
  truckCarrierAffiliationStatus: string;
  assignmentId: string;
  allocationId: string;
  driver?: {
    driverId: string;
    name: string;
    idNumber: string;
  };
  truck?: {
    truckId: string;
    plate: string;
  };
}

export class DriverTruckIntakeService {
  async processSharedIntake(
    payload: DriverTruckIntakePayload,
    context: AuthUserContext
  ): Promise<DriverTruckIntakeResult> {
    const projectId = payload.projectId ? payload.projectId.trim() : '';
    if (!projectId) {
      throw new Error('معرف المشروع مطلوب');
    }

    const {
      carrierId,
      materialId,
      driverName,
      plateNumber,
      residencyId,
    } = payload;

    if (!carrierId || !carrierId.trim()) throw new Error('معرف الناقل مطلوب');
    if (!materialId || !materialId.trim()) throw new Error('معرف المادة مطلوب');
    if (!driverName || !driverName.trim()) throw new Error('اسم السائق مطلوب');
    if (!plateNumber || !plateNumber.trim()) throw new Error('رقم لوحة الشاحنة مطلوب');
    if (!residencyId || !residencyId.trim()) {
      throw new Error('رقم الهوية الوطنية أو الإقامة مطلوب وغير موجود');
    }

    const user = auth.currentUser;
    if (typeof window === 'undefined' || !user) {
      const serverPath = './driverTruckIntake.server';
      const { driverTruckIntakeServer } = await import(/* @vite-ignore */ serverPath);
      return await driverTruckIntakeServer.processSharedIntake(payload, context);
    }
    
    const token = await user.getIdToken();
    const res = await fetch('/api/intake/canonical', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'فشلت عملية التسجيل');
    }

    const json = await res.json();
    return json.data;
  }
}

export const driverTruckIntakeService = new DriverTruckIntakeService();
