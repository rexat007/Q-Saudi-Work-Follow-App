import {assertProfileAuthorityAvailable} from '../firebase/authSession';
/** Bounded transport: timeout ends client ownership; a retry must re-read canonical mutation state. */
export function importRequest(input:RequestInfo|URL,init?:RequestInit){if(!['GET','HEAD'].includes((init?.method||'GET').toUpperCase()))assertProfileAuthorityAvailable();return fetch(input,{...init,signal:init?.signal||AbortSignal.timeout(30000)});}
