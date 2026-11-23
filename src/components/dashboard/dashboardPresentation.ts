export type DashboardSourceId='PROJECTS'|'CARRIERS'|'MATERIALS'|'TRUCKS'|'DRIVERS'|'TRIPS';
export type DashboardSourceState='LOADING'|'READY_WITH_DATA'|'READY_EMPTY'|'PARTIAL'|'UNAVAILABLE'|'RETAINED_LOCAL_SNAPSHOT';
export interface DashboardSourceView {state:DashboardSourceState;data:any[];provenance:'CANONICAL_READ'|'LOCAL_CACHE'|'RETAINED_VIEW';availability:'LOADING'|'AVAILABLE'|'PARTIAL'|'UNAVAILABLE';observedAt?:string;reason?:'CACHE_EMPTY_UNKNOWN'|'CACHE_FAILED';failedProjects?:number}
export type DashboardSources=Record<DashboardSourceId,DashboardSourceView>;
export const dashboardSourceIds:DashboardSourceId[]=['PROJECTS','CARRIERS','MATERIALS','TRUCKS','DRIVERS','TRIPS'];
export const dashboardSourceNames:Record<DashboardSourceId,string>={PROJECTS:'ui7.projects',CARRIERS:'ui7.carriers',MATERIALS:'ui7.materials',TRUCKS:'ui7.trucks',DRIVERS:'ui7.drivers',TRIPS:'ui7.trips'};
export const dashboardStateLabels:Record<DashboardSourceState|'FILTER_EMPTY',string>={LOADING:'ui7.loading',READY_WITH_DATA:'ui7.ready',READY_EMPTY:'ui7.empty',PARTIAL:'ui7.partial',UNAVAILABLE:'ui7.unavailable',RETAINED_LOCAL_SNAPSHOT:'ui7.local_badge',FILTER_EMPTY:'ui7.filter_empty'};
export const emptyDashboardSources=():DashboardSources=>Object.fromEntries(dashboardSourceIds.map(id=>[id,{state:'LOADING',data:[],provenance:id==='TRIPS'?'LOCAL_CACHE':'CANONICAL_READ',availability:'LOADING'}])) as DashboardSources;
export function completedDashboardSource(data:any[],provenance:DashboardSourceView['provenance'],partial=false,failedProjects=0):DashboardSourceView{return {data,provenance,availability:partial?'PARTIAL':'AVAILABLE',state:partial?'PARTIAL':data.length?provenance==='CANONICAL_READ'?'READY_WITH_DATA':'RETAINED_LOCAL_SNAPSHOT':'READY_EMPTY',observedAt:new Date().toISOString(),failedProjects};}
export function failedDashboardSource(old:DashboardSourceView,reason?:DashboardSourceView['reason']):DashboardSourceView{return {...old,state:old.data.length?'RETAINED_LOCAL_SNAPSHOT':'UNAVAILABLE',availability:'UNAVAILABLE',reason};}
export function dashboardWidgetState(sources:DashboardSources,auxiliary:DashboardSourceId[],filteredCount:number):DashboardSourceState|'FILTER_EMPTY'{
 const trips=sources.TRIPS;
 if(!trips.data.length&&trips.availability==='LOADING')return 'LOADING';
 if(!trips.data.length&&trips.availability==='UNAVAILABLE')return 'UNAVAILABLE';
 if(auxiliary.some(id=>sources[id].availability!=='AVAILABLE'))return 'PARTIAL';
 if(!filteredCount)return trips.data.length?'FILTER_EMPTY':'READY_EMPTY';
 return 'RETAINED_LOCAL_SNAPSHOT';
}
// Existing metric/filter authority remains in dashboardService; this helper never changes it.
export function hasDashboardDataAccess(role:string,scope:string[]|undefined):boolean{return ['SUPER_ADMIN','PROJECT_ADMIN','SITE_SUPERVISOR','FINANCE_AUDITOR','AUDITOR'].includes(role)&&(role==='SUPER_ADMIN'||Boolean(scope?.length));}
