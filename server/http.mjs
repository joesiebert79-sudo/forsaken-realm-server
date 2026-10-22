import {RELEASE_INFO} from './release.mjs';
import {sceneTransport} from './scene-transport.mjs';
import {COMPACT,databasePath} from './world-profile.mjs';
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { WorldStore } from './store.mjs';
// Provision test identities externally. Never accept a character ID from a request body.
const tokens=JSON.parse(process.env.REALM_TEST_TOKENS||'{}');
if(!Object.keys(tokens).length)throw new Error('Set REALM_TEST_TOKENS to a JSON object mapping opaque test tokens to character IDs. This development server has no public registration.');
const store=new WorldStore(databasePath(process.env.REALM_WORLD_DB||'forsaken-development.sqlite'),undefined,{ruleset:COMPACT?'master-v1':process.env.REALM_RULESET||undefined});
const authenticate=req=>{const input=Buffer.from((req.headers.authorization||'').replace(/^Bearer /,''));for(const [token,id]of Object.entries(tokens)){const expected=Buffer.from(token);if(input.length===expected.length&&timingSafeEqual(input,expected))return id;}return null;};
const server=createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 const send=(status,body)=>{if(status===200&&req.headers['x-realm-scene']!==undefined){if(body.state)body={...body,state:sceneTransport(body.state,req.headers['x-realm-scene'])};else if(body.you)body=sceneTransport(body,req.url==='/join'?null:req.headers['x-realm-scene']);}res.writeHead(status);res.end(JSON.stringify(body));};
 if(req.url?.split('?')[0]==='/version.json'&&req.method==='GET')return send(200,RELEASE_INFO);
 if(req.url==='/health'&&req.method==='GET')return send(200,{...RELEASE_INFO,status:'development',players:store.realm.sessions.size,capacity:64});
 const id=authenticate(req);if(!id)return send(401,{error:'Unauthorized'});
 try{
  if(req.url==='/join'&&req.method==='POST'){store.transaction(r=>r.join(id));return send(200,store.realm.snapshot(id,true));}
  if(req.url==='/state'&&req.method==='GET'){store.realm.player(id);store.realm.sessions.set(id,Date.now());return send(200,store.realm.snapshot(id,false));}
  if(req.url==='/action'&&req.method==='POST'){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,{error:'Action too large'});}
   const command=JSON.parse(body);const result=command?.type==='move'?store.movement(id,command):store.transaction(r=>r.command(id,command));return send(200,{...result,state:store.realm.snapshot(id,command.type==='housingConfirm'||command.type==='characterSwitch'||command.type==='createCharacter')});
  }
  return send(404,{error:'Not found'});
 }catch(error){return send(400,{error:error.message});}
});
const tick=setInterval(()=>{try{store.transaction(r=>r.tick(.1));}catch(error){console.error("World tick persistence failed",error.message);}},100);
server.listen(Number(process.env.PORT||8788),process.env.REALM_BIND_HOST||'127.0.0.1',()=>console.log('Realm server ready on port '+server.address().port));
server.on('error',error=>{console.error('Server could not start:',error.message);clearInterval(tick);store.close();process.exit(1);});
function stop(){clearInterval(tick);server.close(()=>{store.transaction(()=>{});store.close();process.exit(0);});}
process.on('SIGTERM',stop);process.on('SIGINT',stop);





