import {adminDb} from '../firebase/admin';
import {ProjectReadinessAdminReadContext} from './projectReadiness.server';
import type {AuthUserContext} from '../types/common';
/** Bounded projection of the two existing canonical audit locations. */
export async function readProjectAudit(projectId:string,authenticated:AuthUserContext,options:{limit?:number;afterProject?:string;afterGlobal?:string}={},database:any=adminDb){
  const limit=options.limit??100;
  if(!Number.isSafeInteger(limit)||limit<1||limit>100||[options.afterProject,options.afterGlobal].some(v=>v!==undefined&&(typeof v!=='string'||!/^[a-zA-Z0-9_.:-]{1,256}$/.test(v))))throw Object.assign(Error('INVALID_AUDIT_PAGE'),{code:'INVALID_AUDIT_PAGE',status:400});
  return database.runTransaction(async(tx:any)=>{
    const actor=await new ProjectReadinessAdminReadContext(database,r=>tx.get(r)).currentPrincipal(projectId,authenticated);
    if(!['SUPER_ADMIN','PROJECT_ADMIN','FINANCE_AUDITOR'].includes(actor.role))throw Object.assign(Error('FORBIDDEN_AUDIT_ACCESS'),{code:'FORBIDDEN_AUDIT_ACCESS',status:403});
    const root=database.collection('projects').doc(projectId);if(!(await tx.get(root)).exists)throw Object.assign(Error('PROJECT_NOT_FOUND'),{code:'PROJECT_NOT_FOUND',status:404});
    const read=async(query:any,after:string|undefined)=>{
      if(after==='DONE')return {rows:[],next:'DONE'};
      let q=query.orderBy('__name__').limit(limit+1);if(after)q=q.startAfter(after);
      const s=await tx.get(q),selected=s.docs.slice(0,limit);
      const rows=selected.map((d:any)=>{
        const data=d.data();if(data.projectId!==projectId)throw Object.assign(Error('AUDIT_SCOPE_INTEGRITY'),{code:'AUDIT_SCOPE_INTEGRITY',status:409});
        return {...data,auditPath:d.ref.path};
      });
      return {rows,next:s.docs.length>limit?selected.at(-1).id:'DONE'};
    };
    const [project,global]=await Promise.all([read(root.collection('audit_logs'),options.afterProject),read(database.collection('audit_logs').where('projectId','==',projectId),options.afterGlobal)]);
    return {auditLogs:[...project.rows,...global.rows],continuation:{afterProject:project.next,afterGlobal:global.next},complete:project.next==='DONE'&&global.next==='DONE'};
  });
}
