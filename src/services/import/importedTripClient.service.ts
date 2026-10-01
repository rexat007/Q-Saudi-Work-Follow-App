import { auth } from '../../firebase/config';
import { ImportedTripDispatchParams } from '../trip.service';
import { TripEntity } from '../../types/entities';

export interface DispatchImportedTripResponse {
  success: boolean;
  trip?: TripEntity;
  idempotentReplay?: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export class ImportedTripClientService {
  public async dispatchImportedTrip(
    projectId: string,
    params: ImportedTripDispatchParams
  ): Promise<{ trip: TripEntity; idempotentReplay?: boolean }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('UNAUTHENTICATED: سياق المستخدم مفقود');
    }

    const token = await currentUser.getIdToken();

    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/trips/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    let result: DispatchImportedTripResponse;
    try {
      result = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !result.success || !result.trip) {
      const error = new Error(result.error || `فشل إنشاء الرحلة المستوردة HTTP ${response.status}`);
      (error as any).code = result.code || `HTTP_${response.status}`;
      (error as any).status = response.status;
      throw error;
    }

    return {
      trip: result.trip,
      idempotentReplay: result.idempotentReplay,
    };
  }
}

export const importedTripClientService = new ImportedTripClientService();
