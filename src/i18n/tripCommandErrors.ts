// Presentation-only command error mapping; never grants operational authority.
export function tripCommandErrorKey(code: string): string | undefined {
  if (['FORBIDDEN_TRIP_ACTION', 'FORBIDDEN_PROJECT_ACCESS', 'ACCOUNT_NOT_ACTIVE', 'INVALID_ACCOUNT_PROFILE', 'UNAUTHENTICATED'].includes(code)) return 'trip_commands.errors.denied';
  if (code === 'DRIVER_IDENTITY_NOT_LINKED') return 'trip_commands.errors.unlinked';
  if (code === 'FORBIDDEN_DRIVER_OWNERSHIP') return 'trip_commands.errors.ownership';
  if (['INVALID_TRIP_COMMAND', 'INVALID_DESTINATION_WEIGHT', 'TRIP_COMMAND_REQUIRED'].includes(code)) return 'trip_commands.errors.invalid';
  if (code === 'TRIP_COMMAND_CONFLICT') return 'trip_commands.errors.conflict';
  if (['TRIP_NOT_FOUND', 'TRIP_COMMAND_FAILED'].includes(code)) return 'trip_commands.errors.failed';
}
