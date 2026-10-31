/** DEVELOPMENT/OPERATOR ONLY. Not imported by server routes or Project UI.
 * Usage: node --import tsx scripts/captureWorkspaceBlueprint.ts
 * --spreadsheet <reference-id> --script <reference-script-id> --policy <review-policy.json> --out </tmp/draft.json>
 * A transient operator token is read from stdin; never a command argument, file or output.
 * Output is a sanitized UNAPPROVED draft. Review and software release are separate steps. */
import { google } from 'googleapis';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { captureWorkspaceBlueprint, canonicalBlueprintJson, type CapturePolicy } from '../src/services/googleWorkspaceBlueprint/capture';
async function main() {
  const {values}=parseArgs({options:{spreadsheet:{type:'string'},script:{type:'string'},policy:{type:'string'},out:{type:'string'},'workbook-export':{type:'string'},'script-export':{type:'string'}}});
  if(!values.policy||!values.out||!values.out.startsWith('/tmp/'))throw new Error('EXPLICIT_REFERENCE_POLICY_AND_TMP_OUTPUT_REQUIRED');
  const policy=JSON.parse(await readFile(values.policy,'utf8')) as CapturePolicy;
  let workbook:any,content:any;
  if(values['workbook-export']&&values['script-export']) {
    workbook=JSON.parse(await readFile(values['workbook-export'],'utf8'));
    content=JSON.parse(await readFile(values['script-export'],'utf8'));
  } else {
    if(!values.spreadsheet||!values.script)throw new Error('EXPLICIT_REFERENCE_IDS_REQUIRED');
    const chunks:Buffer[]=[];for await(const chunk of process.stdin)chunks.push(Buffer.from(chunk));
    const token=Buffer.concat(chunks).toString('utf8').trim();if(!token)throw new Error('OPERATOR_AUTHORIZATION_REQUIRED');
    const auth=new google.auth.OAuth2();auth.setCredentials({access_token:token});
    workbook=(await google.sheets({version:'v4',auth}).spreadsheets.get({spreadsheetId:values.spreadsheet,includeGridData:true})).data;
    content=(await google.script({version:'v1',auth}).projects.getContent({scriptId:values.script})).data;
  }
  const result=captureWorkspaceBlueprint(workbook,content.files||[],policy);
  // No raw Google response, source IDs, credentials, or removed operational values are emitted.
  const output=resolve(values.out);
  if((await realpath(dirname(output)))!=='/tmp'&&!(await realpath(dirname(output))).startsWith('/tmp/'))throw new Error('TMP_OUTPUT_REQUIRED');
  await writeFile(output,canonicalBlueprintJson(result),{mode:0o600,flag:'wx'});
  process.stdout.write(JSON.stringify({result:'UNAPPROVED_DRAFT_CAPTURED',...result.report})+'\n');
}
main().catch(()=>{process.stderr.write('BLUEPRINT_CAPTURE_FAILED: inspect operator permissions/reference/policy without logging credentials.\n');process.exitCode=1});
