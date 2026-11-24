// Cloudflare Pages Function. Bind a D1 database as DB; apply schema.sql first.
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function onRequest({request,env}){
 if(!env.DB)return json({error:'Ranking sin configurar'},503);
 try{
  if(request.method==='GET'){
   const {results}=await env.DB.prepare('SELECT name,score,wave,kills,won,date FROM scores ORDER BY score DESC,date ASC LIMIT 20').all();
   return json({scores:results});
  }
  if(request.method!=='POST')return json({error:'Método no permitido'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origen no permitido'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON requerido'},415);
  const reader=request.body?.getReader();if(!reader)return json({error:'Cuerpo requerido'},400);
  let size=0,chunks=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();return json({error:'Datos demasiado grandes'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
  let v;try{v=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'JSON inválido'},400);}
  if(!v||typeof v.name!=='string'||!v.name.trim()||v.name.length>20||/[\u0000-\u001f<>]/.test(v.name)||typeof v.runId!=='string'||! /^[a-zA-Z0-9-]{8,80}$/.test(v.runId)||!Number.isInteger(v.wave)||v.wave<0||v.wave>10||!Number.isInteger(v.kills)||v.kills<0||v.kills>100000||typeof v.won!=='boolean'||v.won&&v.wave!==10)return json({error:'Puntuación inválida'},400);
  const score=v.wave*100+v.kills*10+(v.won?500:0);
  await env.DB.prepare('INSERT OR IGNORE INTO scores (run_id,name,score,wave,kills,won,date) VALUES (?,?,?,?,?,?,?)').bind(v.runId,v.name.trim(),score,v.wave,v.kills,v.won?1:0,Date.now()).run();
  return json({ok:true});
 }catch{return json({error:'Servicio temporalmente no disponible'},503);}
}
