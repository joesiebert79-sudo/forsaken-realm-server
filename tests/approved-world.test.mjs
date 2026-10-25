import test from 'node:test';
import assert from 'node:assert/strict';
import {createApprovedWorldLayout} from '../server/approved-world-layout.mjs';
import {createDay2Layout} from '../server/day2-layout.mjs';
import {masterBlocked} from '../server/master-geography.mjs';
import {migrateApprovedWorld,migrateMasterSaveToApproved} from '../server/approved-world-migration.mjs';
import {Realm} from '../server/world.mjs';
import {AI_LIMITS,tickEnemies} from '../server/enemies.mjs';
import {SIGHT_RADIUS,inSight} from '../server/world-visibility.mjs';
import {planCaravanRoute} from '../server/caravan-routing.mjs';
import {reconcileApprovedCaravans} from '../server/caravans.mjs';
import {WorldStore} from '../server/store.mjs';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('approved geography preserves building identities and clear approaches',()=>{
 const old=createDay2Layout(true),w=createApprovedWorldLayout();
 assert.equal(w.settlements.filter(s=>s.kind==='trader').length,2);
 assert.equal(w.settlements.filter(s=>s.kind==='village').length,12);
 assert.equal(w.castles.length,5);
 assert.equal(w.buildings.filter(b=>b.houseDesign).length,147);
 assert.ok(w.width>old.width*5&&w.height>old.height*4);
 for(const b of old.buildings)assert.ok(w.buildings.some(n=>n.id===b.id&&n.houseDesign===b.houseDesign),b.id);
 for(const b of w.buildings)assert.equal(masterBlocked(b.x,b.y+35),false,b.id+' door');
 for(const road of w.roads.filter(r=>r.kind==='path'))for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/20);
  for(let n=0;n<=steps;n++){const x=a.x+(b.x-a.x)*n/steps,y=a.y+(b.y-a.y)*n/steps;
   assert.ok(!w.buildings.some(h=>Math.abs(x-h.x)<h.halfWidth+8&&y>h.y-h.depth-8&&y<h.y+8),road.id+' clear');
  }
 }
});

test('trader-to-trader caravan follows the continuous authored road network',()=>{
 const r=new Realm(undefined,()=>1000000,{ruleset:'master-v1'}),towns=createApprovedWorldLayout().settlements;
 const route=planCaravanRoute(r,towns[0],towns[1]);assert.ok(route&&route.points.length>10);
 assert.ok(route.cost>20000);assert.ok(route.roads.length>=2);
 assert.ok(Math.hypot(route.points[0].x-towns[0].x,route.points[0].y-towns[0].y)<3);
 assert.ok(Math.hypot(route.points.at(-1).x-towns[1].x,route.points.at(-1).y-towns[1].y)<3);
});

test('saved identity, ownership, inventory and interior remain intact after relocation',()=>{
 const old=createDay2Layout(true),w=createApprovedWorldLayout();
 const home=old.buildings.find(b=>b.houseDesign),propertyId='owned-home';
 const state={players:{p:{id:'p',x:home.x,y:home.y+35,inventory:{iron:27},level:9,interior:null}},companions:{p:{owner:'p',x:home.x+20,y:home.y+40,level:4}},properties:{[propertyId]:{id:propertyId,buildingId:home.id,x:home.x,y:home.y,design:home.houseDesign,level:5,owner:'p'}},structures:{forge:{id:'forge',propertyId,x:home.x+90,y:home.y+140,kind:'forge'},interior:{id:'interior',interior:home.id,x:40,y:55}},claims:{},resources:[],exploration:{},accounts:{p:{gold:777,bank:{gold:123}}}};
 const before=structuredClone(state);assert.equal(migrateApprovedWorld(state,w),true);
 const placed=w.buildings.find(b=>b.id===home.id);
 assert.deepEqual([state.properties[propertyId].x,state.properties[propertyId].y],[placed.x,placed.y]);
 assert.equal(state.structures.forge.x-placed.x,90);
 assert.equal(state.structures.forge.y-placed.y,140);
 assert.deepEqual([state.structures.interior.x,state.structures.interior.y],[40,55]);
 assert.deepEqual(state.players.p.inventory,before.players.p.inventory);
 assert.deepEqual(state.accounts,before.accounts);
 assert.equal(state.players.p.level,9);assert.equal(state.companions.p.level,4);
 const once=structuredClone(state);assert.equal(migrateApprovedWorld(state,w),false);assert.deepEqual(state,once);
});

test('first saved-world migration makes a recoverable SQLite checkpoint',()=>{
 const dir=mkdtempSync(join(tmpdir(),'approved-world-')),path=join(dir,'world.sqlite');
 try{
  const old=createDay2Layout(true),home=old.buildings.find(b=>b.houseDesign);
  const r=new Realm(undefined,()=>1000000,{ruleset:'master-v1'});r.join('keeper');r.command('keeper',{id:'created',type:'createCharacter',appearance:'male-1',profession:'melee',faction:'survivor'});
  const p=r.player('keeper');p.x=home.x;p.y=home.y+35;p.level=8;p.inventory.iron=17;
  r.state.properties={saved:{id:'saved',buildingId:home.id,x:home.x,y:home.y,design:home.houseDesign,level:6,owner:'keeper'}};
  delete r.state.approvedWorldVersion;delete r.state.approvedCaravansVersion;delete r.state.caravans;delete r.state.caravansVersion;
  const db=new DatabaseSync(path);db.exec('CREATE TABLE world(id INTEGER PRIMARY KEY,body TEXT NOT NULL);CREATE TABLE movement(id TEXT PRIMARY KEY,body TEXT NOT NULL)');db.prepare('INSERT INTO world(id,body) VALUES(1,?)').run(JSON.stringify(r.state));db.close();
  const store=new WorldStore(path,()=>1000001,{ruleset:'master-v1'});
  try{store.realm.join('keeper');assert.ok(existsSync(path+'.before-world-v1.sqlite'));assert.equal(store.realm.player('keeper').level,8);assert.equal(store.realm.player('keeper').inventory.iron,17);assert.equal(store.realm.state.properties.saved.level,6);assert.equal(store.realm.state.approvedWorldVersion,1);}finally{store.close();}
  const backup=new DatabaseSync(path+'.before-world-v1.sqlite',{readOnly:true});try{const state=JSON.parse(backup.prepare('SELECT body FROM world WHERE id=1').get().body);assert.equal(state.players.keeper.x,home.x);assert.equal(state.approvedWorldVersion,undefined);}finally{backup.close();}
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('the active v0.94 master save keeps progress and usable interiors on the approved layout',()=>{
 const layout=createApprovedWorldLayout(),owned='master-village-1-home-0';
 const state={profile:'master-reference',mapScale:32.5,players:{owner:{id:'owner',interior:owned,x:15600,y:5400,level:9,inventory:{wood:17}},banker:{id:'banker',interior:'day2-master-trader-a-bank',x:5750,y:8000}},companions:{owner:{owner:'owner',interior:owned,x:15600,y:5400,level:4}},properties:{home:{id:'home',buildingId:owned,design:'hut',owner:'owner',x:15600,y:5400,level:5}},accounts:{owner:{gold:777}},resources:[],structures:{},enemies:{},claims:{}};
 assert.equal(migrateMasterSaveToApproved(state,layout),true);
 assert.equal(state.profile,'day2-compact');assert.equal(state.approvedWorldVersion,1);
 assert.equal(state.players.owner.interior,owned);assert.equal(state.companions.owner.interior,owned);
 assert.equal(state.players.banker.interior,'day2-survivor-bank');
 assert.equal(state.players.owner.level,9);assert.equal(state.players.owner.inventory.wood,17);
 assert.equal(state.accounts.owner.gold,777);assert.equal(state.properties.home.level,5);
 assert.equal(migrateMasterSaveToApproved(state,layout),false);
});

test('wilderness travel returns visible enemies and animals while trader towns stay protected',()=>{
 const r=new Realm(undefined,()=>1000000,{ruleset:'master-v1'});r.join('walker');
 r.command('walker',{id:'created',type:'createCharacter',name:'Pathfinder',appearance:'female-1',profession:'ranged',faction:'survivor',companion:'wolf'});
 const p=r.player('walker');let spot;
 for(let y=3000;y<24000&&!spot;y+=900)for(let x=3000;x<36000;x+=900)if(!r.safe({x,y})&&!r.blocks(x,y)){spot={x,y};break;}
 assert.ok(spot);Object.assign(p,spot);
 const view=r.snapshot('walker');assert.ok(view.enemies.length>0,'at least one living wilderness creature is visible');
 const kinds=Object.values(r.state.enemies).map(e=>e.kind);
 assert.ok(kinds.some(k=>/wolf|boar|bear|rat|hound/.test(k)),'animal encounters exist');
 assert.ok(kinds.some(k=>!/wolf|boar|bear|rat|hound/.test(k)),'hostile human encounters exist');
 p.x=layoutTown().x;p.y=layoutTown().y;assert.equal(r.snapshot('walker').enemies.length,0,'the protected trader plaza stays clear');
 function layoutTown(){return createApprovedWorldLayout().settlements[0];}
});

test('500-unit sight and longer pursuit preserve protected towns',()=>{
 assert.equal(SIGHT_RADIUS,500);
 assert.equal(inSight({x:0,y:0},{x:500,y:0}),true);
 assert.equal(inSight({x:0,y:0},{x:501,y:0}),false);
 assert.ok(AI_LIMITS.leash>=600);
 let now=1000000;
 const p={id:'walker',x:200,y:0,hp:100};
 const e={id:'wolf',kind:'wolf',x:0,y:0,homeX:0,homeY:0,hp:50,maxHp:50,speed:85,range:35,lastAttack:0};
 const realm={clock:()=>now,sessions:new Map([['walker',now]]),state:{players:{walker:p},enemies:{wolf:e},companions:{}},safe:()=>false,blocks:()=>false};
 tickEnemies(realm,1);assert.equal(e.aggro,'walker');
 p.x=610;now+=1000;tickEnemies(realm,1);assert.equal(e.active,true);assert.equal(e.aggro,'walker');
 p.x=1200;now+=1000;tickEnemies(realm,1);assert.equal(e.aggro,undefined);
 realm.safe=target=>target===p;p.x=250;now+=1000;tickEnemies(realm,1);assert.equal(e.active,false);
});

test('already migrated caravan saves recover missing neutral destination depots',()=>{
 const r=new Realm(undefined,()=>1000000,{ruleset:'master-v1'});
 const c=r.state.caravans.bandit;
 c.from='day2-bandit';c.to='day2-neutral';c.status='travelling';
 r.state.approvedCaravansVersion=1;
 delete r.state.caravanDepots['day2-neutral'];
 reconcileApprovedCaravans(r);
 assert.ok(r.state.caravanDepots['day2-neutral']);
 assert.equal(r.state.caravanDepots['day2-neutral'].goods.spear,4);
});
