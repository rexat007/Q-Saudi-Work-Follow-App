import { assertSessionPayload, sessionError } from './durableSessionContract';
type Token = ['o'|'a', string|null] | ['e'] | ['v',string|null,number|boolean|null] | ['s',string|null,number,string];
const invalid = (): never => sessionError('INVALID_IMPORT_SESSION_ARTIFACT');
function validateKey(key: unknown) {
  if(key===null)return;
  if(typeof key!=='string'||key.length>1000)return invalid();
  if(['__proto__','prototype','constructor'].includes(key))sessionError('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  assertSessionPayload({[key as string]:null});
}
/** Streaming tree tokens avoid repeating every ancestor path for every scalar in a 10,000-row review.
 * Every key and scalar remains independently inspectable before a staged Firestore write.
 */
export function encodeSessionChunks(input: unknown): string[] {
  assertSessionPayload(input);
  const chunks:string[]=[];let parts:string[]=[];let length=2;
  const emit=(token:Token)=>{
    const serialized=JSON.stringify(token);
    if(length+serialized.length+1>40000 && parts.length){chunks.push(`[${parts.join(',')}]`);parts=[];length=2;}
    parts.push(serialized);length+=serialized.length+1;
  };
  const visit=(value:any,key:string|null)=>{
    if(typeof value==='string'){
      for(let offset=0;offset<Math.max(1,value.length);offset+=4000)emit(['s',key,offset,value.slice(offset,offset+4000)]);
    }else if(value&&typeof value==='object'){
      emit([Array.isArray(value)?'a':'o',key]);
      if(Array.isArray(value)) for(let index=0;index<value.length;index++)visit(value[index]===undefined?null:value[index],String(index));
      else for(const [childKey,child]of Object.entries(value))if(child!==undefined)visit(child,childKey);
      emit(['e']);
    }else emit(['v',key,value===undefined?null:value]);
  };
  visit(input,null);if(parts.length)chunks.push(`[${parts.join(',')}]`);return chunks;
}
export function validateSessionChunk(text:string):Token[]{
  let tokens:any;try{tokens=JSON.parse(text);}catch{return invalid();}
  if(!Array.isArray(tokens)||!tokens.length)invalid();
  for(const token of tokens){
    if(!Array.isArray(token))invalid();
    const [kind,key]=token;
    if(kind==='e'){if(token.length!==1)invalid();continue;}
    validateKey(key);
    if(kind==='o'||kind==='a'){if(token.length!==2)invalid();}
    else if(kind==='v'){if(token.length!==3||(token[2]!==null&&!['number','boolean'].includes(typeof token[2])))invalid();assertSessionPayload(token[2]);}
    else if(kind==='s'){if(token.length!==4||!Number.isSafeInteger(token[2])||token[2]<0||typeof token[3]!=='string')invalid();}
    else invalid();
  }
  return tokens;
}
export function decodeSessionChunks(chunks:string[]):any{
  let root:any;let initialized=false;
  const stack:{value:any;keys:Set<string>}[]=[];
  for(const chunk of chunks)for(const token of validateSessionChunk(chunk)){
    if(token[0]==='e'){if(!stack.length)invalid();stack.pop();continue;}
    const kind=token[0],key=token[1],parent=stack.at(-1);
    const continuing=kind==='s'&&token[2]!==0;
    let old:any;
    if(key===null){if(parent||initialized&&!continuing)invalid();old=root;}
    else{
      if(!parent)invalid();
      old=parent!.value[key];
      if(continuing ? !parent!.keys.has(key) : parent!.keys.has(key))invalid();
      if(!continuing&&Array.isArray(parent!.value)&&key!==String(parent!.value.length))invalid();
    }
    let value:any;
    if(kind==='o')value={};else if(kind==='a')value=[];
    else if(kind==='v')value=token[2];
    else{if(continuing&&(typeof old!=='string'||old.length!==token[2]))invalid();value=continuing?old+token[3]:token[3];}
    if(key===null){root=value;initialized=true;}
    else{parent!.keys.add(key);Object.defineProperty(parent!.value,key,{value,writable:true,enumerable:true,configurable:true});}
    if(kind==='o'||kind==='a'){if(stack.length>=100)invalid();stack.push({value,keys:new Set()});}
  }
  if(!initialized||stack.length)invalid();assertSessionPayload(root);return root;
}
