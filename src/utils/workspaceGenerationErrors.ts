/** Display classification only; never deletes durable evidence or changes Google validation. */
const legacy=new Set(['TEMPLATE_SELECTION_MISMATCH','TEMPLATE_TIMEZONE_INVALID','RUNTIME_TEMPLATE_SELECTION_RETIRED']);
export function isLegacyWorkspaceError(code:string|null|undefined):boolean{return Boolean(code&&legacy.has(code));}
export function workspaceFailureCode(code:string):string {
 if(code==='APP_UPDATE_REQUIRED'||[...legacy].some(value=>code.includes(value)))return 'APP_UPDATE_REQUIRED';
 return code;
}
export function visiblePreviousWorkspaceError(code:string|null|undefined,current?:string):string|null {
 if(!code||isLegacyWorkspaceError(code)||current?.includes(code))return null;
 return code;
}
