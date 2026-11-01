/** Every Google HTTP request has a bounded timeout. Leased delivery additionally
 * rechecks/renews its current Project owner before each provider request, including
 * requests made internally by tab reconciliation. No request/header is logged. */
export function configureWorkspaceGoogleTransport(auth:any,beforeRequest:()=>Promise<void>=async()=>{}) {
  auth.transporter?.interceptors?.request?.add({resolved:async(options:any)=>{
    await beforeRequest();return {...options,timeout:15000,retry:false};
  }});
}
