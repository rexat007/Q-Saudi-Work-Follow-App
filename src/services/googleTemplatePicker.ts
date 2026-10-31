/** Normal Project UI selects only a writable destination folder. Blueprint authoring is operator-only. */
export async function selectWorkspaceDestinationFolder(token: string):Promise<string> {
  const env=(import.meta.env||{}) as Record<string,string|undefined>;
  if(!env.VITE_GOOGLE_PICKER_API_KEY||!env.VITE_GOOGLE_APP_ID) throw new Error('GOOGLE_PICKER_CONFIGURATION_REQUIRED');
  const api=window as any;
  if(!api.gapi) await new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://apis.google.com/js/api.js';
    script.onload=()=>resolve();script.onerror=()=>reject(new Error('NETWORK_ERROR'));document.head.appendChild(script);
  });
  await new Promise<void>((resolve,reject)=>api.gapi.load('picker',{callback:resolve,onerror:()=>reject(new Error('NETWORK_ERROR')),timeout:15000,ontimeout:()=>reject(new Error('NETWORK_ERROR'))}));
  return new Promise<string>((resolve,reject)=>{
    const picker=api.google.picker;
    const view=new picker.DocsView(picker.ViewId.FOLDERS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder');
    const instance=new picker.PickerBuilder().setOAuthToken(token).setDeveloperKey(env.VITE_GOOGLE_PICKER_API_KEY)
      .setAppId(env.VITE_GOOGLE_APP_ID).setOrigin(window.location.origin).addView(view)
      .setCallback((data:any)=>{
        if(data.action===picker.Action.CANCEL) return reject(new Error('AUTHORIZATION_DENIED'));
        if(data.action===picker.Action.PICKED) {
          instance.setVisible(false);
          if(data.docs?.length!==1||!data.docs[0].id||data.docs[0].mimeType!=='application/vnd.google-apps.folder') return reject(new Error('DESTINATION_FOLDER_INVALID'));
          resolve(data.docs[0].id);
        }
      }).build();
    instance.setVisible(true);
  });
}
