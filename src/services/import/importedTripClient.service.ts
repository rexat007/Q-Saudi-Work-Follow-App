import { sendTripCommand } from '../tripCommandClient.service';
import { TRIP_COMMANDS } from '../../types/tripCommands';
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

    const payload = Object.fromEntries(TRIP_COMMANDS.IMPORT_TRIP.fields.filter(key => params[key as keyof ImportedTripDispatchParams] !== undefined).map(key => [key, params[key as keyof ImportedTripDispatchParams]]));
    const result = await sendTripCommand(projectId, 'IMPORT_TRIP', payload, params.clientUUID || crypto.randomUUID());

    return {
      trip: result.trip,
      idempotentReplay: result.idempotentReplay,
    };
  }
}

export const importedTripClientService = new ImportedTripClientService();
