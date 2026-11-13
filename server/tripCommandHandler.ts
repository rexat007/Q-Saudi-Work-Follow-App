import {TripCommandsServerService, TripCommandError} from '../src/services/tripCommands.server';
/** Shared by production routes and isolated emulator integration. Authentication
 * middleware is installed by the application; the service reauthorizes in-tx. */
export function tripCommandHandler(service?: TripCommandsServerService, receiptOnly = false) {
  return async (req: any, res: any, input: any = req.body) => {
    try {
      const authority=service||new TripCommandsServerService();
      const result = await (receiptOnly ? authority.receipt(req.params.projectId, input, req.user) : authority.execute(req.params.projectId, input, req.user));
      res.json({success: true, ...result});
    } catch (error: any) {
      const known = error instanceof TripCommandError || ['ACCOUNT_NOT_ACTIVE','INVALID_ACCOUNT_PROFILE','TRIP_STATE_CONFLICT'].includes(error.code);
      const code = known ? error.code : 'TRIP_COMMAND_UNAVAILABLE';
      const status = code.startsWith('FORBIDDEN') || ['ACCOUNT_NOT_ACTIVE','INVALID_ACCOUNT_PROFILE','DRIVER_IDENTITY_NOT_LINKED'].includes(code) ? 403 : code === 'TRIP_NOT_FOUND' ? 404 : ['TRIP_REVISION_CONFLICT','TRIP_COMMAND_CONFLICT','TRIP_STATE_CONFLICT'].includes(code) ? 409 : known ? 400 : 503;
      res.status(status).json({success: false, code, error: code});
    }
  };
}
