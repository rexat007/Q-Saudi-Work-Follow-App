import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import pg from 'pg';

/** Test-only real transport outage, independent of the operational PostgreSQL host/port.
 * Keep an ephemeral loopback port owned until cleanup and reset every connection.
 * Unlike closing a reserved port, this cannot race with another server reusing it.
 */
export async function unavailablePostgres(connectionString:string|undefined,connectionTimeoutMillis:number){
  assert.equal(process.env.QSA_TEST_DATABASE_ISOLATED,'1');
  assert.ok(connectionString,'An isolated PostgreSQL connection string is required');
  assert.ok(Number.isSafeInteger(connectionTimeoutMillis)&&connectionTimeoutMillis>0&&connectionTimeoutMillis<=1000);
  const endpoint=new URL(connectionString);
  let rejectedConnections=0;
  const rejector=createServer(socket=>{rejectedConnections++;socket.on('error',()=>{});socket.resetAndDestroy();});
  await new Promise<void>((resolve,reject)=>{rejector.once('error',reject);rejector.listen(0,'127.0.0.1',resolve);});
  const address=rejector.address();
  assert.ok(address&&typeof address==='object'&&address.address==='127.0.0.1'&&address.port>0);
  endpoint.hostname='127.0.0.1';endpoint.port=String(address.port);
  // Remove query overrides such as host/port/hostaddr, retaining the actual test account/database.
  endpoint.search='';endpoint.hash='';
  const pool=new pg.Pool({connectionString:endpoint.toString(),connectionTimeoutMillis,max:1});
  const close=async()=>{try{await pool.end();}finally{await new Promise<void>((resolve,reject)=>rejector.close(error=>error?reject(error):resolve()));}};
  try{
    await assert.rejects(pool.connect().then(client=>{client.release(true);return client;}),(error:NodeJS.ErrnoException)=>
      error.code==='ECONNRESET'||error.code==='EPIPE'||error.message==='Connection terminated unexpectedly',
      'The outage endpoint must reject via a real TCP reset, not PostgreSQL authentication or a timeout');
    assert.ok(rejectedConnections>0,'The transport probe must reach the owned loopback endpoint');
    return {pool,rejectedConnections:()=>rejectedConnections,close};
  }catch(error){await close();throw error;}
}
