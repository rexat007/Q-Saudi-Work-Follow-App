import {createHash} from 'node:crypto';
import {google} from 'googleapis';
import {configureWorkspaceGoogleTransport} from './workspaceGoogleTransport';
import {gwsFail} from '../src/services/projectGoogleWorkspace.server';
import type {GoogleOfflineProvider,OfflineConfig} from '../src/services/workspaceGoogleOfflineAuthorization.server';
export function googleOfflineProvider(c:OfflineConfig):GoogleOfflineProvider {
  const client=()=>{const auth=new google.auth.OAuth2(c.clientId,c.clientSecret,c.redirectUri);configureWorkspaceGoogleTransport(auth);return auth;};
  return {
    authorizationUrl({state,challenge,nonce,scopes}){return client().generateAuthUrl({access_type:'offline',prompt:'consent',include_granted_scopes:false,scope:[...scopes],state,nonce,code_challenge:challenge,code_challenge_method:'S256' as any});},
    async exchange(code,verifier,nonceHash){
      const auth=client(),response=await auth.getToken({code,codeVerifier:verifier,redirect_uri:c.redirectUri});
      const tokens=response.tokens;if(!tokens.id_token||!tokens.refresh_token||!tokens.access_token)return gwsFail('AUTHORIZATION_REQUIRED',401);
      const ticket=await auth.verifyIdToken({idToken:tokens.id_token,audience:c.clientId}),p=ticket.getPayload() as any;
      if(!p?.sub||!['https://accounts.google.com','accounts.google.com'].includes(p.iss)||typeof p.nonce!=='string'||createHash('sha256').update(p.nonce).digest('base64url')!==nonceHash)return gwsFail('GOOGLE_OAUTH_TRANSACTION_INVALID',403);
      const info=await auth.getTokenInfo(tokens.access_token);if(info.aud!==c.clientId)return gwsFail('AUTHORIZATION_REQUIRED',401);
      return {refreshToken:tokens.refresh_token,subject:p.sub,scopes:info.scopes};
    },
    async refresh(refreshToken){
      const auth=client();auth.setCredentials({refresh_token:refreshToken});
      let token:string|null|undefined;
      try{token=(await auth.getAccessToken()).token;}catch(error){
        const e=error as any;if(e.response?.data?.error==='invalid_grant'||e.response?.status===401)return gwsFail('AUTHORIZATION_REQUIRED',401);
        return gwsFail('GOOGLE_REFRESH_UNAVAILABLE',502);
      }
      if(!token)return gwsFail('AUTHORIZATION_REQUIRED',401);
      const info=await auth.getTokenInfo(token);if(info.aud!==c.clientId)return gwsFail('AUTHORIZATION_REQUIRED',401);
      const user=await google.oauth2({version:'v2',auth}).userinfo.get();
      if(!user.data.id)return gwsFail('AUTHORIZATION_REQUIRED',401);
      return {accessToken:token,subject:user.data.id,scopes:info.scopes};
    },
    async revoke(refreshToken){await client().revokeToken(refreshToken);},
  };
}
