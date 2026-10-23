import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {once} from 'node:events';
process.env.REALM_WORLD_PROFILE='master-reference';
const {WorldStore}=await import('../server/store.mjs'),{validateBaseLand}=await import('../server/base-land.mjs'),{towerPoint}=await import('../server/base-defenses.mjs'),{refreshHousing}=await import('../server/housing-runtime.mjs'),{initializeAnnexContents}=await import('../server/base-interior-functions.mjs');
test('two HTTP clients synchronize corner construction, upgrades, elevated combat, property permissions and map markers',{timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-base-network-')),base=join(dir,'world.sqlite'),seed=new WorldStore(base+'.master-reference.sqlite',undefined,{ruleset:'master-v1'});let sequence=0,child;
 let corner,annexId='annex:storehouse:network';
 seed.transaction(r=>{for(const id of ['owner','visitor']){r.join(id);r.command(id,{id:'create-'+id,type:'createCharacter',appearance:'male-1',profession:'melee',faction:'survivor'});}
  const h={id:'network-home',buildingId:'home:hut:network',design:'hut',tier:1,rotation:0,width:100,depth:70,ownerType:'account',owner:'owner',settlementId:'network-land',baseLevel:8,landRadius:720,constructionBenchLevel:8};let found=false;
  for(let x=8000;x<45000&&!found;x+=800)for(let y=8000;y<45000&&!found;y+=800){Object.assign(h,{x,y});try{validateBaseLand(r,h,8);const t=towerPoint(h,'northwest');if(!r.blocks(t.x,t.y)&&!r.blocks(t.x+100,t.y))found=true;}catch{}}
  assert.ok(found,'clear base location');r.state.properties??={};r.state.settlements??={};r.state.properties[h.id]=h;r.state.settlements['network-land']={id:'network-land',propertyId:h.id,ownerType:'account',owner:'owner',flagActive:true,x:h.x,y:h.y+80};r.state.accounts.owner.settlementId='network-land';
  r.state.structures.materials={id:'materials',kind:'chest',owner:'owner',settlementId:'network-land',hp:200,x:h.x+100,y:h.y+100,items:{stone:500,plank:500,iron:500}};
  const annex={id:annexId,kind:'storehouse',owner:'owner',propertyId:h.id,settlementId:'network-land',hp:1500,maxHp:1500,x:h.x+200,y:h.y};r.state.structures[annexId]=annex;initializeAnnexContents(r,annex);refreshHousing(r);corner=towerPoint(h,'northwest');
  Object.assign(r.player('owner'),{x:corner.x-45,y:corner.y,interior:null,inventory:{bow:1,arrow:10},equippedWeapon:'bow'});Object.assign(r.player('visitor'),{x:corner.x+100,y:corner.y,interior:null,inventory:{sword:1},equippedWeapon:'sword'});
 });seed.close();
 try{child=spawn(process.execPath,[fileURLToPath(new URL('../server/http.mjs',import.meta.url))],{env:{...process.env,PORT:'0',REALM_BIND_HOST:'127.0.0.1',REALM_WORLD_DB:base,REALM_TEST_TOKENS:JSON.stringify({'network-owner':'owner','network-visitor':'visitor'})},stdio:['ignore','pipe','pipe']});
  const port=await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',d=>{output+=d;const m=/ready on port (\d+)/.exec(output);if(m)resolve(+m[1]);});child.on('exit',code=>reject(Error('Server exited '+code)));});
  const call=async(id,path,body)=>{const result=await fetch('http://127.0.0.1:'+port+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer network-'+id,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {ok:result.ok,data:await result.json()};};
  const action=(id,type,args={})=>call(id,'/action',{id:'base-network-'+(++sequence),type,...args});
  const initial=await Promise.all(['owner','visitor'].map(id=>call(id,'/join',{})));assert.ok(initial.every(v=>v.ok));
  let result=await action('owner','build',{kind:'tower',corner:'northwest',...corner});assert.ok(result.ok,JSON.stringify(result.data));const tower=result.data.state.mapBuildings.find(b=>b.kind==='tower');assert.ok(tower);
  result=await action('owner','baseDefenseUpgrade',{target:tower.id,expectedLevel:1});assert.ok(result.ok,JSON.stringify(result.data));result=await action('owner','baseClimb',{target:tower.id});assert.ok(result.ok,JSON.stringify(result.data));assert.equal(result.data.state.you.elevation,59);
  const visitor=await call('visitor','/state');assert.equal(visitor.data.players.find(p=>p.id==='owner').elevation,59);for(const id of [tower.id,annexId])assert.ok(visitor.data.mapBuildings.some(b=>b.id===id));
  const hp=visitor.data.you.hp;result=await action('owner','attack',{target:'visitor',weapon:'bow'});assert.ok(result.ok,JSON.stringify(result.data));assert.ok((await call('visitor','/state')).data.you.hp<hp,'ranged attack from tower reaches ground player');
  result=await action('visitor','enter',{target:annexId});assert.equal(result.ok,false);assert.match(result.data.error,/belongs|owned|property|doorway/i);
  result=await action('owner','baseDescend',{target:tower.id});assert.ok(result.ok,JSON.stringify(result.data));assert.equal(result.data.state.you.elevation,0);
  const again=await call('owner','/join',{});assert.equal(again.data.you.characterId,initial[0].data.you.characterId);assert.ok(again.data.mapBuildings.some(b=>b.id===tower.id));
 }finally{if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}rmSync(dir,{recursive:true,force:true});}
});

