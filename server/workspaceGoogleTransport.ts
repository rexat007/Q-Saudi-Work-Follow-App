import {projectionRequest} from './workspaceProjectionDelivery';
/** Every Google HTTP request has a bounded timeout. Leased delivery additionally
 * rechecks/renews its current Project owner before each provider request, including
 * requests made internally by tab reconciliation. No request/header is logged. */
export function configureWorkspaceGoogleTransport(auth:any,beforeRequest:()=>Promise<void>=async()=>{}) {
  if(auth.transporter?.request){const original=auth.transporter.request.bind(auth.transporter);auth.transporter.request=(options:any)=>projectionRequest(options,original);}
  auth.transporter?.interceptors?.request?.add({resolved:async(options:any)=>{
    await beforeRequest();return {...options,maxContentLength:options.maxContentLength??8*1024*1024,timeout:Math.min(options.timeout??15000,15000),retry:false};
  }});
}
