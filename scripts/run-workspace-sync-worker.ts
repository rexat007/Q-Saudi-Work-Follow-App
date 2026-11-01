import {runWorkspaceSyncWorker} from '../server/workspaceSyncWorker';
// Deploy as a scheduled/background command; no browser session or public secret DTO.
runWorkspaceSyncWorker().then(result=>{console.log(JSON.stringify(result));}).catch(()=>{console.error('WORKSPACE_WORKER_UNAVAILABLE');process.exitCode=1;});
