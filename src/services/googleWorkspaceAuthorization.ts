/** Workspace permission grant only. Never calls Firebase sign-in/reauth or creates an app identity. */
const scopes=['openid','email','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.file'];
let loading: Promise<void> | undefined;
async function identityLibrary(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return;
  if (!loading) loading=new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    script.onload=()=>resolve();script.onerror=()=>{loading=undefined;reject(new Error('NETWORK_ERROR'));};
    document.head.appendChild(script);
  });
  await loading;
}
/** Preload on the Workspace layer; no account grant, popup, token or Firebase event. */
export async function prepareWorkspaceGoogleAuthorization() {
  if (!import.meta.env?.VITE_FIREBASE_OAUTH_CLIENT_ID) throw new Error('GOOGLE_OAUTH_CONFIGURATION_REQUIRED');
  await identityLibrary();
}
export async function requestWorkspaceGoogleToken(expectedSubject: string, stillCurrent:()=>boolean):Promise<string> {
  const clientId=import.meta.env?.VITE_FIREBASE_OAUTH_CLIENT_ID;
  const appId=import.meta.env?.VITE_GOOGLE_APP_ID;
  if (!clientId || (appId && clientId.split('-')[0] !== appId)) throw new Error('GOOGLE_OAUTH_CONFIGURATION_REQUIRED');
  if (!expectedSubject || !stillCurrent()) throw new Error('WORKSPACE_IDENTITY_CHANGED');
  await identityLibrary();
  if (!stillCurrent()) throw new Error('WORKSPACE_IDENTITY_CHANGED');
  const token=await new Promise<string>((resolve,reject)=>{
    const client=(window as any).google.accounts.oauth2.initTokenClient({
      client_id:clientId,scope:scopes.join(' '),prompt:'consent',
      callback:(response:any)=>{
        if(response.error) return reject({code:response.error,error_description:response.error_description});
        if(!response.access_token) return reject(new Error('AUTHORIZATION_DENIED'));
        const granted=new Set(String(response.scope||'').split(' '));
        if(!scopes.slice(2).every(s=>granted.has(s))) return reject(new Error('SCOPE_DENIED'));
        resolve(response.access_token);
      },
      error_callback:(error:any)=>reject({code:error.type==='popup_closed'?'popup_closed_by_user':error.type==='popup_failed_to_open'?'popup_blocked':'network_error'}),
    });
    client.requestAccessToken();
  });
  if(!stillCurrent()) throw new Error('WORKSPACE_IDENTITY_CHANGED');
  // Verify the provider account, not only the unchanged Firebase UID. Never log response/token.
  const response=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok) throw new Error(response.status===401?'TOKEN_EXPIRED':'AUTHORIZATION_DENIED');
  const identity=await response.json();
  if(!stillCurrent() || identity.sub!==expectedSubject) throw new Error('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH');
  return token;
}
