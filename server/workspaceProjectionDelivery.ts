import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
export const PROJECTION_LIMITS = { events: 20, requests: 160, rpcBytes: 240000, payloadBytes: 600000, sourceRows: 2000, attempts: 5, markers: 20000 } as const;
export const projectionHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class WorkspaceProjectionError extends Error {constructor(public code:string,public status=409){super(code);}}
export const projectionFailure = (code: string, status = 409): never => { throw new WorkspaceProjectionError(code,status); };
const context = new AsyncLocalStorage<WorkspaceProjectionDelivery>();
export const projectionAsOf = () => context.getStore()?.asOf;
export const inProjectionDelivery = () => Boolean(context.getStore());
export function runProjectionDelivery<T>(delivery: WorkspaceProjectionDelivery, run: () => Promise<T>) { return context.run(delivery, run); }
export async function projectionRequest(options: any, send: (options: any) => Promise<any>) { const active = context.getStore(); return active ? active.request(options, send) : send(options); }
/** One durable outstanding provider RPC per existing project lease. No OAuth material is persisted.
 * Immutable metadata ID + data in one atomic batch prevents a late duplicate overwriting newer data. */
export class WorkspaceProjectionDelivery {
    readonly asOf: Date;
    private queue: Promise<unknown> = Promise.resolve();
    constructor(private db: any, private projectId: string, private binding: any, private owner: string, private authorize: (tx: any) => Promise<unknown>, asOf: string, private deliveryId = owner, private budget={deadline:Date.now()+20000,calls:0}) { this.asOf = new Date(asOf); if (!Number.isFinite(this.asOf.getTime()))
        projectionFailure('WORKSPACE_DELIVERY_PLAN_INVALID'); }
    private ref() { return this.db.collection('projects').doc(this.projectId).collection('workspace_continuity').doc('current'); }
    private rpcRef(id: string) { return this.db.collection('projects').doc(this.projectId).collection('workspace_projection_rpcs').doc(id); }
    private check(s: any) { if (s?.syncOwner !== this.owner || !Number.isFinite(s.syncLeaseExpiresAt) || s.syncLeaseExpiresAt <= Date.now() || s.binding?.projectId !== this.projectId || s.binding?.spreadsheetId !== this.binding.spreadsheetId || s.binding?.revision !== this.binding.revision)
        projectionFailure('WORKSPACE_EXECUTION_FENCED'); }
    private async state() { return this.db.runTransaction(async (tx: any) => { await this.authorize(tx); const s = (await tx.get(this.ref())).data(); this.check(s); return s; }); }
    private async send(send: (o: any) => Promise<any>, options: any) { if (Date.now() > this.budget.deadline || ++this.budget.calls > PROJECTION_LIMITS.requests)
        projectionFailure('WORKSPACE_PROVIDER_BUDGET', 429); await this.state(); return send({ ...options, timeout: Math.max(1, Math.min(15000, this.budget.deadline - Date.now())), retry: false, maxContentLength: 8 * 1024 * 1024 }); }
    private base(options: any, url: string, method: string, data?: unknown) { return { ...options, url, method, params: undefined, data, body: undefined }; }
    private async marker(rpc: any, options: any, send: (o: any) => Promise<any>) {
        try {
            const r = await this.send(send, this.base(options, `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.binding.spreadsheetId)}/developerMetadata/${rpc.markerId}`, 'GET'));
            const m = r.data;
            if (m?.metadataId !== rpc.markerId || m.metadataKey !== 'q' || m.metadataValue !== rpc.hash || m.location?.spreadsheet !== true)
                projectionFailure('WORKSPACE_DELIVERY_RECEIPT_CONFLICT');
            return true;
        }
        catch (error: any) {
            if (error?.response?.status === 404 || error?.status === 404)
                return false;
            throw error;
        }
    }
    private async acknowledge(rpc: any) { await this.db.runTransaction(async (tx: any) => { await this.authorize(tx); const ref = this.ref(), s = (await tx.get(ref)).data(); this.check(s); if (!s.projectionRpc)
        return; if (s.projectionRpc.id !== rpc.id || s.projectionRpc.hash !== rpc.hash)
        projectionFailure('WORKSPACE_DELIVERY_RECEIPT_CONFLICT'); tx.set(this.rpcRef(rpc.id), { projectId: this.projectId, destinationId: this.binding.spreadsheetId, bindingRevision: this.binding.revision, markerId: rpc.markerId, requestHash: rpc.hash, status: 'COMMITTED', committedAt: new Date().toISOString() }); tx.set(ref, { ...s, projectionRpc: null, lastProjectionMarkerId: rpc.markerId, projectionCompletedPlans: { ...s.projectionCompletedPlans, [rpc.planId]: true } }); }); }
    private async recover(options: any, send: (o: any) => Promise<any>) {
        const s = await this.state(), rpc = s.projectionRpc;
        if (!rpc)
            return;
        if (rpc.destinationId !== this.binding.spreadsheetId || rpc.bindingRevision !== this.binding.revision || projectionHash(rpc.requests) !== rpc.hash)
            projectionFailure('WORKSPACE_DELIVERY_RECEIPT_CONFLICT');
        if (!await this.marker(rpc, options, send)) {
            const requests = [...rpc.requests, { createDeveloperMetadata: { developerMetadata: { metadataId: rpc.markerId, metadataKey: 'q', metadataValue: rpc.hash, visibility: 'DOCUMENT', location: { spreadsheet: true } } } }];
            try {
                await this.send(send, this.base(options, `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.binding.spreadsheetId)}:batchUpdate`, 'POST', { requests }));
            }
            catch (error) {
                if (!await this.marker(rpc, options, send))
                    throw error;
            }
            // A transport ACK is not substituted for the destination witness.
            if (!await this.marker(rpc, options, send))
                projectionFailure('WORKSPACE_DELIVERY_RECEIPT_MISSING', 503);
        }
        await this.acknowledge(rpc);
    }
    async request(options: any, send: (o: any) => Promise<any>): Promise<any> {
        const operation = async () => {
            let url: URL;
            try {
                url = new URL(String(options.url));
            }
            catch {
                return this.send(send, options);
            }
            const isSheets = url.hostname === 'sheets.googleapis.com' || url.hostname === 'www.googleapis.com' && url.pathname.startsWith('/sheets/');
            if (!isSheets)
                return this.send(send, options);
            // Credential subject and Drive binding are verified by the authority before its first Sheets call.
            await this.recover(options, send);
            const method = String(options.method || 'GET').toUpperCase();
            if (['GET', 'HEAD'].includes(method) || url.pathname.endsWith('/developerMetadata:search'))
                return this.send(send, options);
            if (!url.pathname.endsWith(`/spreadsheets/${this.binding.spreadsheetId}:batchUpdate`) && !url.pathname.endsWith(`/${this.binding.spreadsheetId}:batchUpdate`))
                projectionFailure('WORKSPACE_NONATOMIC_PROJECTION_REJECTED');
            let body = options.data;
            if (typeof body === 'string')
                body = JSON.parse(body);
            if (!Array.isArray(body?.requests) || body.requests.some((r: any) => r.deleteDeveloperMetadata || r.createDeveloperMetadata?.developerMetadata?.location?.spreadsheet))
                projectionFailure('WORKSPACE_DELIVERY_PLAN_INVALID');
            const encoded = JSON.stringify(body.requests);
            if (Buffer.byteLength(encoded) > PROJECTION_LIMITS.rpcBytes)
                projectionFailure('WORKSPACE_PROVIDER_BUDGET', 429);
            const planId = projectionHash([this.deliveryId, body.requests]);
            const rpc = await this.db.runTransaction(async (tx: any) => {
                await this.authorize(tx);
                const ref = this.ref(), s = (await tx.get(ref)).data();
                this.check(s);
                if (s.projectionCompletedPlans?.[planId])
                    return null;
                if (s.projectionRpc)
                    projectionFailure('WORKSPACE_DELIVERY_RECOVERY_REQUIRED');
                const sequence = Number(s.projectionMarkerSequence || 0) + 1;
                if (sequence > PROJECTION_LIMITS.markers)
                    projectionFailure('WORKSPACE_RECEIPT_CAPACITY_REVIEW_REQUIRED');
                const requests = [...(s.lastProjectionMarkerId ? [{ updateDeveloperMetadata: { dataFilters: [{ developerMetadataLookup: { metadataId: s.lastProjectionMarkerId } }], developerMetadata: { metadataKey: 'q', metadataValue: '' }, fields: 'metadataKey,metadataValue' } }] : []), ...JSON.parse(encoded)];
                const hash = projectionHash(requests), id = projectionHash([this.projectId, this.binding.spreadsheetId, this.binding.revision, sequence, hash]);
                const pending = { id, planId, markerId: 1000000000 + sequence, requests, hash, destinationId: this.binding.spreadsheetId, bindingRevision: this.binding.revision };
                tx.set(ref, { ...s, projectionMarkerSequence: sequence, projectionRpc: pending });
                return pending;
            });
            if (rpc)
                await this.recover(options, send);
            return { status: 200, data: { spreadsheetId: this.binding.spreadsheetId, replies: body.requests.map(() => ({})) }, headers: new Headers(), config: options };
        };
        const pending = this.queue.then(operation);
        this.queue = pending.catch(() => { });
        return pending;
    }
}
/** Only inside the delivery protocol: convert known RAW cell writes to numeric-ID atomic requests. */
export async function atomicValueWrites(sheets: any, fileId: string, data: Array<{
    range: string;
    values: any[][];
}>, metadata?: any) {
    const meta = metadata || await sheets.spreadsheets.get({ spreadsheetId: fileId, includeGridData: false, fields: 'sheets.properties' });
    const requests: any[] = [];
    const growth=new Map<number,{rowCount:number;columnCount:number}>();
    const col = (s: string) => [...s].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
    for (const item of data) {
        const match = item.range.match(/^(?:'((?:[^']|'')+)'|([^!]+))!([A-Z]+)([0-9]+)(?::[A-Z]+[0-9]+)?$/);
        if (!match)
            projectionFailure('WORKSPACE_DELIVERY_PLAN_INVALID');
        const title = (match[1] || match[2]).replace(/''/g, "'"), sheet = meta.data.sheets?.find((s: any) => s.properties?.title === title);
        if (sheet?.properties?.sheetId === undefined)
            projectionFailure('WORKSPACE_STRUCTURE_INVALID');
        const grid=sheet.properties.gridProperties;if(Number.isSafeInteger(grid?.rowCount)&&Number.isSafeInteger(grid?.columnCount)){const size=growth.get(sheet.properties.sheetId)||{rowCount:grid.rowCount,columnCount:grid.columnCount};size.rowCount=Math.max(size.rowCount,Number(match[4])-1+item.values.length);size.columnCount=Math.max(size.columnCount,col(match[3])+Math.max(0,...item.values.map(row=>row.length)));if(size.rowCount>20000||size.columnCount>1024)projectionFailure('WORKSPACE_SOURCE_BUDGET_REVIEW_REQUIRED');growth.set(sheet.properties.sheetId,size);}
        const cell = (v: any) => v === null || v === undefined ? {} : typeof v === 'number' && Number.isFinite(v) ? { userEnteredValue: { numberValue: v } } : typeof v === 'boolean' ? { userEnteredValue: { boolValue: v } } : { userEnteredValue: { stringValue: typeof v === 'object' ? JSON.stringify(v) : String(v) } };
        requests.push({ updateCells: { start: { sheetId: sheet.properties.sheetId, rowIndex: Number(match[4]) - 1, columnIndex: col(match[3]) }, rows: item.values.map(row => ({ values: row.map(cell) })), fields: 'userEnteredValue' } });
    }
    for(const [sheetId,size] of growth){const prior=meta.data.sheets.find((s:any)=>s.properties?.sheetId===sheetId).properties.gridProperties;if(size.rowCount>prior.rowCount||size.columnCount>prior.columnCount)requests.unshift({updateSheetProperties:{properties:{sheetId,gridProperties:size},fields:'gridProperties.rowCount,gridProperties.columnCount'}});}
    return sheets.spreadsheets.batchUpdate({ spreadsheetId: fileId, requestBody: { requests } });
}
