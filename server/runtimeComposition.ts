import type {Express} from 'express';
import {readFirestoreAuthority} from '../src/runtime/firestoreAuthority.server';
import {assertFirestoreAuthority,RuntimeAuthorityError} from '../src/types/runtimeAuthority';
/** No SQL pools, activation switch or epoch mutation exists in production composition. */
export function registerProductionRuntimeBoundary(app:Express,database:any){
 app.get('/api/runtime-authority',async(_req,res)=>{try{res.set('Cache-Control','private, no-store').json(await readFirestoreAuthority(database));}catch{res.status(503).json({code:'RUNTIME_AUTHORITY_UNAVAILABLE'});}});
 app.use('/api',async(req,res,next)=>{
  try{if(req.path.startsWith('/v2/'))throw new RuntimeAuthorityError('SQL_RUNTIME_INACTIVE',503);
   assertFirestoreAuthority(await readFirestoreAuthority(database));next();
  }catch(e){const error=e instanceof RuntimeAuthorityError?e:new RuntimeAuthorityError('RUNTIME_AUTHORITY_UNAVAILABLE',503);res.status(error.status).json({code:error.code});}
 });
}
