import type {WorkspaceWorkbookInspection} from './inspection';
import {planOwnedOperationalTabs} from './operationalTabs';
import type {sheets_v4} from 'googleapis';
import {assertBlueprint,cellEntries,blueprintRequests,type WorkspaceBlueprint} from './contract';
import {LOADING_WRITABLE,OFFLOAD_WRITABLE} from '../projectGoogleSheetContract';
import {columnIndex} from './contract';

type Sheet=sheets_v4.Schema$Sheet;
/** Expected properties may omit provider defaults and resource-generated IDs. */
const contains=(expected:any,actual:any,key=''):boolean=>expected&&typeof expected==='object'
  ?Array.isArray(expected)?Array.isArray(actual)&&expected.length===actual.length&&expected.every((v,i)=>contains(v,actual[i]))
  :Object.entries(expected).every(([key,v])=>contains(v,actual?.[key],key))
  :expected===actual||(actual===undefined&&(expected===false||expected===0||key==='alpha'&&expected===1));
export interface WorkbookRepairPlan {requests:sheets_v4.Schema$Request[];drift:string[];conflicts:string[]}
/** Never uses updateCells '*' or clears inputs. IDs are resolved by title, not position.
 * Non-formula values occupying formula cells are preserved and reported for review. */
export function planWorkbookRepair(blueprint:WorkspaceBlueprint,current:WorkspaceWorkbookInspection|sheets_v4.Schema$Spreadsheet):WorkbookRepairPlan {
  assertBlueprint(blueprint,false);
  if(blueprint.operationalTabOwnershipSchema===1)return planOwnedOperationalTabs(blueprint,current,legacy=>blueprintRequests(legacy,current,true));
  const requests:sheets_v4.Schema$Request[]=[],drift:string[]=[],conflicts:string[]=[];
  const existing=current.sheets||[],used=new Set(existing.map(s=>s.properties?.sheetId));
  const mapping=new Map<number,number>();const selected=new Map<string,Sheet|undefined>();
  for(const sheet of blueprint.sheets){
    const title=sheet.properties!.title!,expectedId=sheet.properties!.sheetId!;
    const candidates=existing.filter(s=>s.properties?.title===title);
    if(candidates.length>1)throw Error('WORKBOOK_AMBIGUOUS_TAB');
    let actual=candidates[0];
    // A renamed tab is recognizable only by canonical ID AND its nontrivial header.
    if(!actual){const byId=existing.find(s=>s.properties?.sheetId===expectedId);
      const header=cellEntries(sheet).filter(c=>c.row===0&&c.cell.userEnteredValue);
      const cells=new Map(byId?cellEntries(byId).map(c=>[`${c.row}:${c.column}`,c.cell]):[]);
      if(byId&&header.length>1&&header.every(c=>contains(c.cell.userEnteredValue,cells.get(`0:${c.column}`)?.userEnteredValue))&&!blueprint.sheets.some(s=>s.properties?.title===byId.properties?.title))actual=byId;
    }
    let id=actual?.properties?.sheetId??expectedId;
    if(!actual){while(used.has(id))id++;used.add(id);requests.push({addSheet:{properties:{...sheet.properties,sheetId:id}}});drift.push('MISSING_TAB:'+title);}
    else if(actual.properties?.title!==title){requests.push({updateSheetProperties:{properties:{sheetId:id,title},fields:'title'}});drift.push('RENAMED_TAB:'+title);}
    mapping.set(expectedId,id);selected.set(title,actual);
  }
  const remap=(value:any):any=>Array.isArray(value)?value.map(remap):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,(k==='sheetId'||k==='sourceSheetId')&&typeof v==='number'?(mapping.get(v)??v):remap(v)])):value;
  const add=(reason:string,request:sheets_v4.Schema$Request)=>{drift.push(reason);requests.push(request)};
  for(const sheet of blueprint.sheets){
    const title=sheet.properties!.title!,id=mapping.get(sheet.properties!.sheetId!)!,actual=selected.get(title);
    const grid=sheet.properties!.gridProperties!,actualGrid=actual?.properties?.gridProperties;
    if(actual&&((actualGrid?.rowCount||0)<grid.rowCount!||(actualGrid?.columnCount||0)<grid.columnCount!))add('GRID:'+title,{updateSheetProperties:{properties:{sheetId:id,gridProperties:{rowCount:Math.max(grid.rowCount!,actualGrid?.rowCount||0),columnCount:Math.max(grid.columnCount!,actualGrid?.columnCount||0)}},fields:'gridProperties.rowCount,gridProperties.columnCount'}});
    const frozen={frozenRowCount:grid.frozenRowCount||0,frozenColumnCount:grid.frozenColumnCount||0};
    if(actual&&!contains(frozen,actualGrid))add('FROZEN:'+title,{updateSheetProperties:{properties:{sheetId:id,gridProperties:frozen},fields:'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'}});
    const cells=new Map(actual?cellEntries(actual).map(c=>[`${c.row}:${c.column}`,c.cell]):[]);
    const input=(title==='Loading Register'?LOADING_WRITABLE:title==='Offload Data'?[...OFFLOAD_WRITABLE,'J','K','L']:[]).map(columnIndex);
    // Group contiguous cells with identical field masks. No gaps are ever cleared.
    const writes:Array<{row:number;col:number;fields:string[];cell:sheets_v4.Schema$CellData}>=[];
    for(const {row,column,cell} of cellEntries(sheet)){
      const found=cells.get(`${row}:${column}`),patch:sheets_v4.Schema$CellData={},fields:string[]=[];
      for(const key of ['userEnteredFormat','dataValidation'] as const)if(cell[key]&&!contains(cell[key],found?.[key])){patch[key]=cell[key] as any;fields.push(key);}
      const expected=cell.userEnteredValue,value=found?.userEnteredValue;
      if(expected&&!(row>0&&input.includes(column))&&!contains(expected,value)){
        if(!value||row===0||expected.formulaValue&&value.formulaValue){patch.userEnteredValue=expected;fields.push('userEnteredValue');}
        else conflicts.push(`${title}:${row+1}:${column+1}`);
      }
      if(fields.length)writes.push({row,col:column,fields,cell:patch});
    }
    for(let i=0;i<writes.length;){const first=writes[i],values=[first.cell];let j=i+1;
      while(j<writes.length&&writes[j].row===first.row&&writes[j].col===first.col+values.length&&writes[j].fields.join()===first.fields.join())values.push(writes[j++].cell);
      requests.push({updateCells:{start:{sheetId:id,rowIndex:first.row,columnIndex:first.col},rows:[{values}],fields:first.fields.join(',')}});i=j;
    }
    if(writes.length)drift.push('CELLS:'+title);
    for(const merge of sheet.merges||[]){const range=remap(merge);
      if(!(actual?.merges||[]).some(m=>contains(range,m))){
        const overlap=(actual?.merges||[]).some(m=>(m.startRowIndex||0)<(range.endRowIndex||Infinity)&&(range.startRowIndex||0)<(m.endRowIndex||Infinity)&&(m.startColumnIndex||0)<(range.endColumnIndex||Infinity)&&(range.startColumnIndex||0)<(m.endColumnIndex||Infinity));
        if(overlap)conflicts.push('MERGE:'+title);else add('MERGE:'+title,{mergeCells:{range,mergeType:'MERGE_ALL'}});
      }
    }
    for(const rule of sheet.conditionalFormats||[]){const mapped=remap(rule);if(!(actual?.conditionalFormats||[]).some(r=>contains(mapped,r)))add('CONDITIONAL_FORMAT:'+title,{addConditionalFormatRule:{rule:mapped,index:0}});}
    for(const protection of sheet.protectedRanges||[]){const mapped=remap(protection);delete mapped.protectedRangeId;if(!(actual?.protectedRanges||[]).some(r=>contains(mapped,r)))add('PROTECTION:'+title,{addProtectedRange:{protectedRange:mapped}});}
    for(const chart of sheet.charts||[]){const mapped=remap(chart);delete mapped.chartId;
      if(!(actual?.charts||[]).some(c=>contains(mapped.spec,c.spec))){const sameTitle=actual?.charts?.find(c=>c.spec?.title===mapped.spec?.title);
        if(sameTitle?.chartId!==undefined)add('CHART:'+title,{updateChartSpec:{chartId:sameTitle.chartId,spec:mapped.spec}});else add('CHART:'+title,{addChart:{chart:mapped}});
      }
    }
    for(const data of sheet.data||[])for(const [dimension,metadata] of [['ROWS',data.rowMetadata],['COLUMNS',data.columnMetadata]] as const){
      for(const [offset,expected] of (metadata||[]).entries()){
        const index=offset+(dimension==='ROWS'?(data.startRow||0):(data.startColumn||0)),key=dimension==='ROWS'?'rowMetadata':'columnMetadata';
        const found=actual?.data?.slice().reverse().find(g=>index>=(dimension==='ROWS'?(g.startRow||0):(g.startColumn||0))&&index<(dimension==='ROWS'?(g.startRow||0):(g.startColumn||0))+(g[key]?.length||0));
        const value=found?.[key]?.[index-(dimension==='ROWS'?(found.startRow||0):(found.startColumn||0))];
        if(Object.keys(expected).length&&!contains(expected,value))add('DIMENSION:'+title,{updateDimensionProperties:{range:{sheetId:id,dimension,startIndex:index,endIndex:index+1},properties:expected,fields:Object.keys(expected).join(',')}});
      }
    }
    for(const key of ['rowGroups','columnGroups'] as const)for(const group of sheet[key]||[]){
      const mapped=remap(group),found=(actual?.[key]||[]).find(g=>contains(mapped.range,g.range)&&g.depth===mapped.depth);
      if(!found)add('GROUP:'+title,{addDimensionGroup:{range:mapped.range}});
      if(!contains(mapped.collapsed||false,found?.collapsed))add('GROUP_STATE:'+title,{updateDimensionGroup:{dimensionGroup:mapped,fields:'collapsed'}});
    }
    if(sheet.basicFilter&&!contains(remap(sheet.basicFilter),actual?.basicFilter))add('FILTER:'+title,{setBasicFilter:{filter:remap(sheet.basicFilter)}});
    for(const view of sheet.filterViews||[]){const mapped=remap(view);delete mapped.filterViewId;if(!(actual?.filterViews||[]).some(v=>contains(mapped,v)))add('FILTER_VIEW:'+title,{addFilterView:{filter:mapped}});}
    for(const band of sheet.bandedRanges||[]){const mapped=remap(band);delete mapped.bandedRangeId;if(!(actual?.bandedRanges||[]).some(b=>contains(mapped,b)))add('BANDING:'+title,{addBanding:{bandedRange:mapped}});}
  }
  for(const named of blueprint.namedRanges){const range=remap(named.range),found=current.namedRanges?.find(r=>r.name===named.name);
    if(!found)add('NAMED_RANGE:'+named.name,{addNamedRange:{namedRange:{name:named.name,range}}});
    else if(!contains(range,found.range))add('NAMED_RANGE:'+named.name,{updateNamedRange:{namedRange:{namedRangeId:found.namedRangeId,range},fields:'range'}});
  }
  if(!contains(blueprint.properties,current.properties))add('PROPERTIES',{updateSpreadsheetProperties:{properties:blueprint.properties,fields:Object.keys(blueprint.properties).join(',')}});
  for(const extra of existing)if(!('kind' in current)&&extra.properties?.title==='Sheet1'&&!blueprint.sheets.some(s=>s.properties?.title==='Sheet1')&&!cellEntries(extra).some(c=>c.cell.userEnteredValue||c.cell.note)&&!extra.charts?.length&&!extra.protectedRanges?.length&&!extra.merges?.length) add('EMPTY_DEFAULT_TAB',{deleteSheet:{sheetId:extra.properties.sheetId}});
  return {requests,drift:[...new Set(drift)],conflicts};
}
