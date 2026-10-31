import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {selectWorkspaceDestinationFolder} from '../services/googleTemplatePicker';
let chosen:any,viewId:string,include:boolean,select:boolean,mime:string;
beforeEach(()=>{
 vi.stubEnv('VITE_GOOGLE_PICKER_API_KEY','fixture-public-key');vi.stubEnv('VITE_GOOGLE_APP_ID','fixture-app');
 class View {constructor(id:string){viewId=id}setIncludeFolders(v:boolean){include=v;return this}setSelectFolderEnabled(v:boolean){select=v;return this}setMimeTypes(v:string){mime=v;return this}}
 class Builder {cb:any;setOAuthToken(){return this}setDeveloperKey(){return this}setAppId(){return this}setOrigin(){return this}addView(){return this}setCallback(cb:any){this.cb=cb;return this}build(){return {setVisible:(visible:boolean)=>{if(visible)queueMicrotask(()=>this.cb(chosen))}}}}
 vi.stubGlobal('window',{location:{origin:'https://controlled.invalid'},gapi:{load:(_name:string,opts:any)=>opts.callback()},google:{picker:{DocsView:View,PickerBuilder:Builder,ViewId:{FOLDERS:'folders'},Action:{CANCEL:'cancel',PICKED:'picked'}}}});
 chosen={action:'picked',docs:[{id:'destination',mimeType:'application/vnd.google-apps.folder'}]};
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
describe('GWS1B destination folder picker',()=>{
 it('opens only folders and returns one destination ID, with no template lookup',async()=>{expect(await selectWorkspaceDestinationFolder('fixture-token')).toBe('destination');expect([viewId,include,select,mime]).toEqual(['folders',true,true,'application/vnd.google-apps.folder']);});
 it.each(['application/vnd.google-apps.spreadsheet','application/pdf'])('rejects a selected non-folder %s',async type=>{chosen.docs[0].mimeType=type;await expect(selectWorkspaceDestinationFolder('fixture')).rejects.toThrow('DESTINATION_FOLDER_INVALID')});
 it('rejects multiple destinations',async()=>{chosen.docs.push({...chosen.docs[0],id:'other'});await expect(selectWorkspaceDestinationFolder('fixture')).rejects.toThrow('DESTINATION_FOLDER_INVALID')});
 it('cancellation does not invent a default destination',async()=>{chosen={action:'cancel'};await expect(selectWorkspaceDestinationFolder('fixture')).rejects.toThrow('AUTHORIZATION_DENIED')});
});
