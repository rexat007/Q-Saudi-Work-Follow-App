import type {User} from 'firebase/auth';
import type {SqlOfflineCoordinator} from '../services/offline/sqlOfflineCoordinator';
import type {SqlUiClient} from '../services/sqlUiClient.service';
import type {SqlAccountDto,SqlProjectDto} from './sqlGovernance';
/** Trusted root dependency. No browser storage, URL or user-controlled backend choice. */
export interface SqlIdentityPort {current():User|null;subscribe(change:()=>void):()=>void;signIn():Promise<void>;signOut():Promise<void>}
export interface SqlUiComposition {identity:SqlIdentityPort;client:SqlUiClient;epoch:Readonly<{backendEpoch:string;epochRevision:number}>}
export interface SqlUiState {generation:number;principal:string|null;company:string;account:SqlAccountDto|null;missing:boolean;busy:boolean;error:string;companies:{companyId:string;name:string|null;status:string}[];companyCursor:string|null;projects:SqlProjectDto[];projectCursor:string|null;project:SqlProjectDto|null;offlineReady:boolean;pendingOperation?:string}
export interface SqlUiDependencies {ui:SqlUiComposition;coordinator:SqlOfflineCoordinator;companyId:string}
