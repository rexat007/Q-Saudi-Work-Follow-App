import type { UserRole } from './common';
import type { TripStatus } from './entities';
const origin: UserRole[] = ['SUPER_ADMIN', 'PROJECT_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'SITE_SUPERVISOR'];
const scale: UserRole[] = ['SUPER_ADMIN', 'PROJECT_ADMIN', 'SCALE_OPERATOR', 'SUPERVISOR', 'SITE_SUPERVISOR'];
// One role/action policy shared by UI adapters and the authoritative server.
export const TRIP_COMMANDS = {
  DISPATCH_TRIP: { roles: origin, fields: ['carrierId', 'truckId', 'driverId', 'materialId', 'pricingRuleId'] },
  RECORD_LOADING: { roles: [...origin, 'SCALE_OPERATOR'] as UserRole[], fields: ['carrierId', 'truckId', 'driverId', 'materialId', 'pricingRuleId', 'originTareKg', 'originGrossKg', 'originTicketNo'] },
  IMPORT_TRIP: { roles: origin, fields: ['carrierId', 'truckId', 'driverId', 'materialId', 'pricingRuleId', 'pricingMode', 'sourceType', 'loadingDataSource', 'unloadingDataSource', 'sourceMetadata', 'operationalData'] },
  ARRIVE_ORIGIN: { roles: origin, fields: [], target: 'AT_ORIGIN' },
  START_LOADING: { roles: [...origin, 'SCALE_OPERATOR'] as UserRole[], fields: [], target: 'LOADING' },
  COMPLETE_LOADING: {roles:origin,fields:[]},
  START_UNLOADING: {roles:scale,fields:[]},
  ASSOCIATE_DRIVER: {roles:origin,fields:['driverId']},
  RECORD_ORIGIN_WEIGHT: { roles: [...origin, 'SCALE_OPERATOR'] as UserRole[], fields: ['originTareKg', 'originGrossKg', 'originTicketNo'], target: 'WEIGHED_ORIGIN' },
  START_TRANSIT: { roles: origin, fields: [], target: 'IN_TRANSIT' },
  RECORD_ARRIVAL: { roles: [...scale, 'DRIVER'] as UserRole[], fields: [], target: 'AT_DESTINATION' },
  RECORD_DESTINATION_WEIGHT: { roles: scale, fields: ['destinationTareKg', 'destinationGrossKg', 'destinationTicketNo'], target: 'WEIGHED_DESTINATION' },
  RECORD_DESTINATION_NET: { roles: scale, fields: ['destinationNetKg', 'destinationTicketNo'], target: 'WEIGHED_DESTINATION' },
  ACCEPT_ORIGIN_NET: { roles: scale, fields: [], target: 'WEIGHED_DESTINATION' },
  COMPLETE_UNLOADING: { roles: scale, fields: [], target: 'OFFLOADED' },
  COMPLETE_TRIP: { roles: scale, fields: [], target: 'COMPLETED' },
  CANCEL_TRIP: { roles: origin, fields: [], target: 'CANCELLED' },
  REPORT_EXCEPTION: { roles: [...origin, 'SCALE_OPERATOR'] as UserRole[], fields: ['exceptionId', 'type', 'severity', 'descriptionAr', 'descriptionEn'] },
} as const;
export type TripCommandName = keyof typeof TRIP_COMMANDS;
export function canExecuteTripCommand(role: UserRole, command: TripCommandName): boolean {
  return (TRIP_COMMANDS[command].roles as readonly UserRole[]).includes(role);
}
export const STATUS_COMMANDS: Partial<Record<TripStatus, TripCommandName>> = {
  AT_ORIGIN: 'ARRIVE_ORIGIN', LOADING: 'START_LOADING', WEIGHED_ORIGIN: 'RECORD_ORIGIN_WEIGHT', IN_TRANSIT: 'START_TRANSIT',
  AT_DESTINATION: 'RECORD_ARRIVAL', WEIGHED_DESTINATION: 'RECORD_DESTINATION_WEIGHT', OFFLOADED: 'COMPLETE_UNLOADING',
  COMPLETED: 'COMPLETE_TRIP', CANCELLED: 'CANCEL_TRIP',
};
