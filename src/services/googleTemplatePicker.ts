/** drive.file grants access to files explicitly selected/opened with this application.
 * A shared template URL alone does not grant the OAuth app per-file access. */
export async function authorizeTemplateSelection(token: string, templateId: string) {
  const env=(import.meta as any).env||{};
  if(!env.VITE_GOOGLE_PICKER_API_KEY||!env.VITE_GOOGLE_APP_ID) throw new Error('GOOGLE_PICKER_CONFIGURATION_REQUIRED');
  const api=window as any;
  if(!api.gapi) await new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://apis.google.com/js/api.js';
    script.onload=()=>resolve();script.onerror=()=>reject(new Error('NETWORK_ERROR'));document.head.appendChild(script);
  });
  await new Promise<void>((resolve,reject)=>api.gapi.load('picker',{callback:resolve,onerror:()=>reject(new Error('NETWORK_ERROR')),timeout:15000,ontimeout:()=>reject(new Error('NETWORK_ERROR'))}));
  await new Promise<void>((resolve,reject)=>{
    const picker=api.google.picker;
    const view=new picker.DocsView(picker.ViewId.SPREADSHEETS).setIncludeFolders(false);
    const instance=new picker.PickerBuilder().setOAuthToken(token).setDeveloperKey(env.VITE_GOOGLE_PICKER_API_KEY)
      .setAppId(env.VITE_GOOGLE_APP_ID).setOrigin(window.location.origin).addView(view)
      .setCallback((data:any)=>{
        if(data.action===picker.Action.CANCEL) return reject(new Error('AUTHORIZATION_DENIED'));
        if(data.action===picker.Action.PICKED) {
          instance.setVisible(false);
          if(data.docs?.length!==1||data.docs[0].id!==templateId) return reject(new Error('TEMPLATE_SELECTION_MISMATCH'));
          resolve();
        }
      }).build();
    instance.setVisible(true);
  });
}
