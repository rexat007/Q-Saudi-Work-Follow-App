/** One closed provider classification authority. Never returns input messages, payloads or URLs. */
export const GOOGLE_PROVIDER_CODES=['TOKEN_EXPIRED','SCOPE_DENIED','GOOGLE_PERMISSION_DENIED','API_ACCESS_DISABLED','PROJECT_WORKSPACE_FILE_MISSING','GOOGLE_INVALID_REQUEST','GOOGLE_RATE_LIMITED','GOOGLE_QUOTA_EXCEEDED','GOOGLE_SERVICE_UNAVAILABLE','GOOGLE_NETWORK_ERROR'] as const;
export type GoogleProviderCode=typeof GOOGLE_PROVIDER_CODES[number];
export const GOOGLE_PROVIDER_REASONS={
 ACCESS_TOKEN_SCOPE_INSUFFICIENT:'SCOPE_DENIED',insufficientPermissions:'SCOPE_DENIED',insufficient_scope:'SCOPE_DENIED',invalid_scope:'SCOPE_DENIED',
 SERVICE_DISABLED:'API_ACCESS_DISABLED',accessNotConfigured:'API_ACCESS_DISABLED',API_DISABLED:'API_ACCESS_DISABLED',API_ACCESS_DISABLED:'API_ACCESS_DISABLED',
 invalid_token:'TOKEN_EXPIRED',invalid_grant:'TOKEN_EXPIRED',authError:'TOKEN_EXPIRED',UNAUTHENTICATED:'TOKEN_EXPIRED',ACCESS_TOKEN_EXPIRED:'TOKEN_EXPIRED',invalidCredentials:'TOKEN_EXPIRED',
 quotaExceeded:'GOOGLE_QUOTA_EXCEEDED',dailyLimitExceeded:'GOOGLE_QUOTA_EXCEEDED',rateLimitExceeded:'GOOGLE_RATE_LIMITED',userRateLimitExceeded:'GOOGLE_RATE_LIMITED',RESOURCE_EXHAUSTED:'GOOGLE_RATE_LIMITED',
 NOT_FOUND:'PROJECT_WORKSPACE_FILE_MISSING',notFound:'PROJECT_WORKSPACE_FILE_MISSING',INVALID_ARGUMENT:'GOOGLE_INVALID_REQUEST',badRequest:'GOOGLE_INVALID_REQUEST',FAILED_PRECONDITION:'GOOGLE_INVALID_REQUEST',
 PERMISSION_DENIED:'GOOGLE_PERMISSION_DENIED',forbidden:'GOOGLE_PERMISSION_DENIED',
} as const;
const object=(v:unknown):Record<string,any>=>v&&typeof v==='object'?v as Record<string,any>:{};
export function classifyGoogleProviderFailure(error:unknown){
 const e=object(error),response=object(e.response),data=object(response.data),provider=object(data.error);
 const status=[response.status,e.status,e.code,provider.code].find(n=>typeof n==='number'&&Number.isInteger(n)&&n>=400&&n<=599) as number|undefined;
 const details=Array.isArray(provider.details)?provider.details.slice(0,8).map(object):[],errors=Array.isArray(provider.errors)?provider.errors.slice(0,8).map(object):[];
 const evidence=[...details.map(d=>d.reason),...errors.map(d=>d.reason),provider.status,typeof data.error==='string'?data.error:undefined];
 // Exact credential phrases are bounded evidence, never emitted or broadly message-matched.
 if(['Invalid Credentials','Invalid token','Invalid Token','Invalid authentication credentials'].includes(provider.message))evidence.push('invalid_token');
 const reason=(Object.keys(GOOGLE_PROVIDER_REASONS) as Array<keyof typeof GOOGLE_PROVIDER_REASONS>).find(r=>evidence.includes(r));
 const reasonCode=reason?GOOGLE_PROVIDER_REASONS[reason]:undefined;
 const network=['ETIMEDOUT','ECONNABORTED','ECONNRESET','ECONNREFUSED','ENOTFOUND','EAI_AGAIN','ERR_NETWORK','ABORT_ERR','UND_ERR_CONNECT_TIMEOUT'].includes(e.code)||['AbortError','TimeoutError'].includes(e.name)||['request-timeout','system'].includes(e.type)||['ETIMEDOUT','ECONNRESET','ENOTFOUND','UND_ERR_CONNECT_TIMEOUT'].includes(object(e.cause).code);
 const code:GoogleProviderCode=status===401?'TOKEN_EXPIRED':status===404?'PROJECT_WORKSPACE_FILE_MISSING':status===408?'GOOGLE_NETWORK_ERROR':status===429?(reasonCode==='GOOGLE_QUOTA_EXCEEDED'?reasonCode:'GOOGLE_RATE_LIMITED'):status&&status>=500?'GOOGLE_SERVICE_UNAVAILABLE':reasonCode|| (status===403?'GOOGLE_PERMISSION_DENIED':status?'GOOGLE_INVALID_REQUEST':'GOOGLE_NETWORK_ERROR');
 let service:'drive.googleapis.com'|'sheets.googleapis.com'|'script.googleapis.com'|'UNKNOWN'='UNKNOWN';const services=['drive.googleapis.com','sheets.googleapis.com','script.googleapis.com'];
 const reported=details.map(d=>object(d.metadata).service).find(s=>services.includes(s));if(reported)service=reported as typeof service;else try{const url=new URL(object(e.config).url);if(services.includes(url.hostname))service=url.hostname as typeof service;else if(url.hostname==='www.googleapis.com'&&url.pathname.startsWith('/drive/'))service='drive.googleapis.com';}catch{/* No untrusted URL is returned. */}
 return {code,status:code==='TOKEN_EXPIRED'?401:code==='PROJECT_WORKSPACE_FILE_MISSING'?404:['SCOPE_DENIED','GOOGLE_PERMISSION_DENIED','API_ACCESS_DISABLED'].includes(code)?403:code==='GOOGLE_INVALID_REQUEST'?400:['GOOGLE_RATE_LIMITED','GOOGLE_QUOTA_EXCEEDED'].includes(code)?429:code==='GOOGLE_SERVICE_UNAVAILABLE'?503:502,httpStatus:status??null,providerReason:reason||'UNRECOGNIZED' as keyof typeof GOOGLE_PROVIDER_REASONS|'UNRECOGNIZED',service,recognized:Boolean(status||reason||network)};
}
export const isGoogleProviderCode=(code:string):code is GoogleProviderCode=>(GOOGLE_PROVIDER_CODES as readonly string[]).includes(code);
