import { ProjectContextLifetime,type ProjectContextToken } from '../utils/projectContextLifetime';
import type { FoundationSummary,BoundedProjectPage,BoundedProjectReadPort } from '../types/boundedProjectReads';

/** Inactive Wizard/Fleet integration seam. No network, polling or offline writes.
 * A cutover composition may supply the port; current production does not instantiate it.
 * A partial page must never be handed to ProjectCanonicalRefresh's snapshot barrier.
 */
export class BoundedProjectReadSession {
  private readonly lifetime=new ProjectContextLifetime();
  private summaryValue:FoundationSummary|null=null;
  private pageValue:BoundedProjectPage|null=null;
  private pending:{generation:number;promise:Promise<FoundationSummary|null>}|null=null;
  private owner='';
  constructor(readonly port:BoundedProjectReadPort){}
  enter(project:string|null,principal:string,epoch:string){
    const owner=JSON.stringify([principal,epoch]);
    const before=this.lifetime.capture();
    this.lifetime.enter(project,owner);
    if(before.generation!==this.lifetime.capture().generation||this.owner!==owner){this.summaryValue=null;this.pageValue=null;}
    this.owner=owner;
  }
  capture(){return this.lifetime.capture();}
  invalidate(){this.lifetime.invalidate();this.summaryValue=null;this.pageValue=null;this.pending=null;}
  /** Explicit consumer action only: one summary request per current generation. */
  async loadSummary():Promise<FoundationSummary|null>{
    const token=this.capture();if(!token.projectId)throw Error('PROJECT_SCOPE_REQUIRED');
    if(this.summaryValue)return this.summaryValue;
    if(this.pending?.generation===token.generation)return this.pending.promise;
    const promise=this.port.summary(token.projectId).then(value=>this.acceptSummary(token,value)?value:null);
    this.pending={generation:token.generation,promise};
    try{return await promise;}finally{if(this.pending?.promise===promise)this.pending=null;}
  }
  acceptSummary(token:ProjectContextToken,value:FoundationSummary){
    if(!this.lifetime.isCurrent(token,value.data.projectExternalId)||JSON.parse(this.owner)[1]!==value.meta.backendEpoch)return false;
    if(this.summaryValue&&BigInt(value.data.sourceRevision)<BigInt(this.summaryValue.data.sourceRevision))return false;
    if(this.pageValue&&this.pageValue.sourceRevision!==value.data.sourceRevision)this.pageValue=null;
    this.summaryValue=value;return true;
  }
  acceptPage(token:ProjectContextToken,value:BoundedProjectPage){
    if(!this.lifetime.isCurrent(token,value.projectExternalId)||JSON.parse(this.owner)[1]!==value.meta.backendEpoch
      ||value.fullSnapshot!==false||value.items.length>50)return false;
    if(this.summaryValue&&this.summaryValue.data.sourceRevision!==value.sourceRevision)return false;
    if(this.pageValue&&BigInt(value.sourceRevision)<BigInt(this.pageValue.sourceRevision))return false;
    this.pageValue=value;return true;
  }
  current(){return {summary:this.summaryValue,page:this.pageValue};}
  dispose(){this.lifetime.dispose();this.summaryValue=null;this.pageValue=null;}
}
