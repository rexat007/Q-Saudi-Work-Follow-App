/** Deterministic atomic Sheets transport model, NOT a live Google acceptance test. */
export function workspaceProjectionProvider() {
    const metadata = new Map<number, any>(), cells = new Map<string, any>(), calls: any[] = [];
    const books=new Map<string,{metadata:Map<number,any>;cells:Map<string,any>}>();
    let effects = 0;
    const control = { before: null as null | ((o: any) => Promise<void>), after: null as null | ((o: any) => Promise<void>) };
    const send = async (o: any) => {
        calls.push({ url: String(o.url), method: o.method, data: structuredClone(o.data), timeout: o.timeout, retry: o.retry });
        await control.before?.(o);
        const url = new URL(o.url);
        const bookId=url.pathname.match(/\/spreadsheets\/([^/:]+)/)?.[1]||'book';
        if(!books.has(bookId))books.set(bookId,{metadata:books.size?new Map():metadata,cells:books.size?new Map():cells});
        const {metadata:bookMetadata,cells:bookCells}=books.get(bookId)!;
        if (o.method === 'GET' && url.pathname.includes('/developerMetadata/')) {
            const id = Number(url.pathname.split('/').at(-1));
            if (!bookMetadata.has(id))
                throw Object.assign(Error('not found'), { status: 404, response: { status: 404, data: { error: { code: 404 } } } });
            return { data: structuredClone(bookMetadata.get(id)), status: 200 };
        }
        if (o.method === 'POST' && url.pathname.endsWith(':batchUpdate')) {
            const requests = o.data.requests, priorM = new Map(bookMetadata), priorC = new Map(bookCells);
            try {
                for (const r of requests) {
                    if (r.createDeveloperMetadata) {
                        const m = r.createDeveloperMetadata.developerMetadata;
                        if (bookMetadata.has(m.metadataId))
                            throw Object.assign(Error('duplicate immutable ID'), { status: 400 });
                        bookMetadata.set(m.metadataId, structuredClone(m));
                    }
                    else if (r.updateDeveloperMetadata) {
                        const id = r.updateDeveloperMetadata.dataFilters[0].developerMetadataLookup.metadataId;
                        if (!bookMetadata.has(id))
                            throw Error('unknown bookMetadata');
                        bookMetadata.set(id, { ...bookMetadata.get(id), ...r.updateDeveloperMetadata.developerMetadata });
                    }
                    else if (r.updateCells) {
                        const u = r.updateCells;
                        for (const [i, row] of (u.rows || []).entries())
                            for (const [j, c] of row.values.entries())
                                bookCells.set(`${u.start.sheetId}:${u.start.rowIndex + i}:${u.start.columnIndex + j}`, structuredClone(c));
                    }
                    else
                        throw Error('unexpected provider mutation');
                }
            }
            catch (error) {
                bookMetadata.clear();
                priorM.forEach((v, k) => bookMetadata.set(k, v));
                bookCells.clear();
                priorC.forEach((v, k) => bookCells.set(k, v));
                throw error;
            }
            effects++;
            await control.after?.(o);
            return { status: 200, data: { replies: requests.map(() => ({})) } };
        }
        if (o.method === 'GET')
            return { status: 200, data: { sheets: [{ properties: { sheetId: 7, title: 'Trips', gridProperties: { rowCount: 200, columnCount: 20 } } }] } };
        throw Error('unexpected provider endpoint');
    };
    return { metadata, cells, calls, control, send, get effects() { return effects; } };
}
export const cellBatch = (file: string, value: string) => ({ url: `https://sheets.googleapis.com/v4/spreadsheets/${file}:batchUpdate`, method: 'POST', data: { requests: [{ updateCells: { start: { sheetId: 7, rowIndex: 1, columnIndex: 0 }, rows: [{ values: [{ userEnteredValue: { stringValue: value } }] }], fields: 'userEnteredValue' } }] } });
