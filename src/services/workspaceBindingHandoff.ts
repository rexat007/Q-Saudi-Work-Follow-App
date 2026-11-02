/** Pure proof shared by first binding commit and recovery of that same operation's interrupted handoff.
 * Does not adopt foreign bindings or revive/reassign credentials. All inputs come from one transaction. */
export function workspaceBindingAdoption(s:any,binding:any,grant:any,authorizationId:string,actorId:string){
 const op=s?.ensureOperation,descriptor=s?.provisioningAuthorization;
 if(!op||op.projectId!==binding?.projectId||op.actorId!==actorId||op.operationId!==s.operationId||descriptor?.operationId!==op.operationId||descriptor.googleSubject!==binding.googleSubject||s.backgroundAuthorizationId!==authorizationId||grant?.status!=='ACTIVE'||grant.actorId!==actorId||grant.projectId!==binding.projectId||grant.subject!==binding.googleSubject||binding.provisionedBy!==actorId||binding.revision!==1||s.fileId!==binding.spreadsheetId||s.folderId!==binding.projectFolderId)return null;
 if(grant.provisioningOperationId&&grant.provisioningOperationId!==op.operationId)return null;
 const unbound=grant.bindingRevision===0&&grant.spreadsheetId==='';
 const bound=grant.bindingRevision===binding.revision&&grant.spreadsheetId===binding.spreadsheetId;
 if(!unbound&&!bound||op.bindingRevision!==0&&op.bindingRevision!==binding.revision||op.spreadsheetId!==null&&op.spreadsheetId!==binding.spreadsheetId)return null;
 return {grant:{...grant,provisioningOperationId:op.operationId,spreadsheetId:binding.spreadsheetId,bindingRevision:binding.revision,updatedAt:Date.now()},operation:{...op,bindingRevision:binding.revision,spreadsheetId:binding.spreadsheetId}};
}
