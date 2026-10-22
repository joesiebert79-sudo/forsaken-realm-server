import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.REALM_WORLD_PROFILE='day2-efficiency';
const {WorldStore}=await import('../server/store.mjs');
const {databasePath,LAYOUT}=await import('../server/world-profile.mjs');
const {blocks,segmentDistance,overlapsBuildingArt}=await import('../server/day2-layout.mjs');
const {MERCHANTS}=await import('../server/merchants.mjs');
test('Day 2 efficiency: 2800 map, twelve buildings, only neutral town protected, clear paths and canopy placement',()=>{
 assert.deepEqual([LAYOUT.width,LAYOUT.height],[2800,2800]);assert.equal(LAYOUT.buildings.length,12);assert.equal(LAYOUT.protection.zones.length,1);assert.equal(LAYOUT.protection.zones[0].faction,'neutral');
 assert.ok(LAYOUT.resources.length>20&&LAYOUT.resources.length<280);
 for(const road of LAYOUT.roads)for(const p of road.points)assert.ok(!blocks(LAYOUT.buildings,p.x,p.y,road.width/2),road.id);
 for(const n of LAYOUT.resources){assert.ok(!overlapsBuildingArt(n,LAYOUT.buildings));for(const line of [...LAYOUT.roads,...LAYOUT.streams])for(let i=1;i<line.points.length;i++)assert.ok(segmentDistance(n,line.points[i-1],line.points[i])>=line.width/2+44);}
 assert.equal(MERCHANTS.filter(m=>m.faction==='neutral').length,2);
});
test('Day 2 efficiency preserves other databases, neutral services, all doors, two-player combat and reconnect',()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-efficiency-')),base=join(dir,'world.sqlite');let clock=1000000,store,seq=0;
 writeFileSync(base,'full-world-sentinel');writeFileSync(base+'.day2-compact.sqlite','existing-test-world-sentinel');
 try{
  store=new WorldStore(databasePath(base),()=>clock,{ruleset:'master-v1'});let r=store.realm;
  const action=(id,type,args={})=>{clock+=1000;return store.transaction(r=>r.command(id,{id:'eff-'+(++seq),type,...args}));};
  for(const [id,faction] of [['one','survivor'],['two','bandit']]){store.transaction(r=>r.join(id));action(id,'createCharacter',{faction,appearance:'male-1',profession:'farmer'});}
  assert.equal(r.safe(r.player('one')),false);assert.equal(r.safe(r.player('two')),false);assert.equal(r.safe({x:1350,y:1350}),true);
  const p=r.player('one'),other=r.player('two');
  for(const b of LAYOUT.buildings){p.interior=null;p.x=b.x;p.y=b.y+35;action('one','enter',{target:b.id});assert.equal(p.interior,b.id);p.x=310;p.y=415;action('one','exit');assert.equal(p.interior,null);}
  const bank=LAYOUT.buildings.find(b=>b.id==='day2-neutral-bank');p.x=bank.x;p.y=bank.y+35;action('one','enter',{target:bank.id});p.x=120;p.y=350;r.state.accounts.one.gold=100;action('one','bankOpen',{quote:20});action('one','bankDeposit',{item:'gold',amount:30});action('one','bankWithdraw',{item:'gold',amount:10});assert.equal(r.state.accounts.one.bank.gold,20);
  p.interior=null;p.x=550;p.y=550;other.x=580;other.y=550;
  for(const player of [p,other]){player.inventory.sword=1;player.equippedWeapon='sword';}
  const hp=other.hp;action('one','attack',{target:'two',weapon:'sword'});assert.ok(other.hp<hp);const hp1=p.hp;action('two','attack',{target:'one',weapon:'sword'});assert.ok(p.hp<hp1);
  const start=p.y;for(let i=0;i<10;i++){clock+=100;store.movement('one',{id:'move-'+i,type:'move',dx:0,dy:1,dt:.1});store.movement('two',{id:'move2-'+i,type:'move',dx:0,dy:1,dt:.1});}assert.ok(p.y>start);
  const character=p.characterId;store.close();store=new WorldStore(databasePath(base),()=>clock,{ruleset:'master-v1'});r=store.realm;store.transaction(r=>r.join('one'));assert.equal(r.player('one').characterId,character);assert.equal(r.state.accounts.one.bank.gold,20);assert.equal(readFileSync(base,'utf8'),'full-world-sentinel');assert.equal(readFileSync(base+'.day2-compact.sqlite','utf8'),'existing-test-world-sentinel');
 }finally{store?.close();rmSync(dir,{recursive:true,force:true});}
});

test('Day 2 efficiency two HTTP clients: authoritative movement, mutual damage, door transitions, map and reconnect',{timeout:20000},async()=>{
 const {spawn}=await import('node:child_process');const {once}=await import('node:events');const {fileURLToPath}=await import('node:url');
 const dir=mkdtempSync(join(tmpdir(),'eff-net-')),base=join(dir,'world.sqlite'),seed=new WorldStore(databasePath(base),undefined,{ruleset:'master-v1'});let seq=0;
 for(const [id,faction] of [['one','survivor'],['two','bandit']]){seed.transaction(r=>r.join(id));seed.transaction(r=>r.command(id,{id:'create-'+id,type:'createCharacter',faction,appearance:'male-1',profession:'farmer'}));}
 const b=LAYOUT.buildings.find(b=>b.id==='day2-survivor-bank');seed.transaction(r=>{for(const id of ['one','two'])Object.assign(r.player(id),{x:b.x,y:b.y+35,inventory:{sword:1},equippedWeapon:'sword'});});seed.close();
 const child=spawn(process.execPath,[fileURLToPath(new URL('../server/http.mjs',import.meta.url))],{env:{...process.env,PORT:'0',REALM_BIND_HOST:'127.0.0.1',REALM_WORLD_DB:base,REALM_TEST_TOKENS:JSON.stringify({'fixture-one':'one','fixture-two':'two'})},stdio:['ignore','pipe','pipe']});
 try{
  const port=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',d=>{text+=d;const m=/ready on port (\d+)/.exec(text);if(m)resolve(Number(m[1]));});child.on('exit',c=>reject(Error('Server exited '+c)));});
  const call=async(id,path,body)=>{const res=await fetch('http://127.0.0.1:'+port+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer fixture-'+id,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await res.json();assert.ok(res.ok,JSON.stringify(data));return data;};
  const action=(id,type,args={})=>call(id,'/action',{id:'http-'+(++seq),type,...args});
  const initial=await Promise.all(['one','two'].map(id=>call(id,'/join',{})));assert.deepEqual(initial[0].worldSize,{width:2800,height:2800});assert.equal(initial[0].mapBuildings.length,12);
  await action('one','attack',{target:'two',weapon:'sword'});assert.ok((await call('two','/state')).you.hp<initial[1].you.hp);await action('two','attack',{target:'one',weapon:'sword'});assert.ok((await call('one','/state')).you.hp<initial[0].you.hp);
  assert.equal((await action('one','enter',{target:b.id})).state.you.interior,b.id);assert.equal((await action('one','exit')).state.you.interior,null);
  for(let i=0;i<10;i++)await Promise.all(['one','two'].map(id=>action(id,'move',{dx:0,dy:1,dt:.1})));
  for(let i=0;i<2;i++){const again=await call(['one','two'][i],'/join',{});assert.equal(again.you.characterId,initial[i].you.characterId);assert.ok(again.you.y>initial[i].you.y);}
 }finally{child.kill('SIGTERM');await once(child,'exit');rmSync(dir,{recursive:true,force:true});}
});
