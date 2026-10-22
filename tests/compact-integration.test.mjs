import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.REALM_WORLD_PROFILE='day2-compact';
const {WorldStore}=await import('../server/store.mjs');
const {databasePath}=await import('../server/world-profile.mjs');
const {WORLD_BUILDINGS}=await import('../server/catalog.mjs');
test('compact world: two identities, all authorized doors, bank receipts and restart isolation',()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-compact-')),original=join(dir,'world.sqlite');writeFileSync(original,'original-save-sentinel');let clock=1000000,store;
 try{
 store=new WorldStore(databasePath(original),()=>clock,{ruleset:'master-v1'});let r=store.realm,seq=0;
 const action=(id,type,args={})=>store.transaction(r=>r.command(id,{id:'test-'+(++seq),type,...args}));
 for(const [id,faction,appearance] of [['one','survivor','male-1'],['two','bandit','female-1']]){store.transaction(r=>r.join(id));action(id,'createCharacter',{faction,appearance,profession:'farmer'});assert.equal(r.player(id).creationRequired,false);}
 assert.deepEqual(r.snapshot('one').worldSize,{width:6860,height:6860});assert.equal(r.snapshot('one').towns.length,2);
 for(const b of WORLD_BUILDINGS){const id=b.faction==='bandit'?'two':'one',p=r.player(id);p.interior=null;p.x=b.x;p.y=b.y+35;action(id,'enter',{target:b.id});assert.equal(p.interior,b.id);p.x=310;p.y=415;action(id,'exit');assert.ok(!p.interior);}
 const p=r.player('one'),bank=WORLD_BUILDINGS.find(b=>b.id==='day2-survivor-bank');p.x=bank.x;p.y=bank.y+35;action('one','enter',{target:bank.id});p.x=120;p.y=350;
 r.state.accounts.one.gold=100;action('one','bankOpen',{quote:20});action('one','bankDeposit',{item:'gold',amount:30});action('one','bankWithdraw',{item:'gold',amount:10});assert.equal(r.state.accounts.one.bank.gold,20);
 p.interior=null;p.x=3430;p.y=3430;const other=r.player('two');other.interior=null;other.x=3460;other.y=3430;
 assert.ok(r.snapshot('one').players.some(v=>v.id==='two'));
 const start=p.x;for(let i=0;i<20;i++){clock+=100;store.movement('one',{id:'walk-'+i,type:'move',dx:1,dy:0,dt:.1});store.movement('two',{id:'walk-b-'+i,type:'move',dx:0,dy:1,dt:.1});store.transaction(r=>r.tick(.1));}assert.ok(p.x>start);assert.ok(Number.isFinite(other.y));
 const character=p.characterId;store.close();store=new WorldStore(databasePath(original),()=>clock,{ruleset:'master-v1'});r=store.realm;store.transaction(r=>r.join('one'));assert.equal(r.player('one').characterId,character);assert.equal(r.state.accounts.one.bank.gold,20);assert.equal(readFileSync(original,'utf8'),'original-save-sentinel');
 }finally{store?.close();rmSync(dir,{recursive:true,force:true});}
});

test('only two merchant/service zones; central village has no trading NPCs',async()=>{
 const {MERCHANTS}=await import('../server/merchants.mjs');const {FACTION_TOWNS}=await import('../server/master-rules.mjs');
 assert.deepEqual([...new Set(MERCHANTS.map(m=>m.townId))].sort(),['day2-bandit','day2-survivor']);assert.equal(FACTION_TOWNS.length,2);assert.ok(!MERCHANTS.some(m=>m.interior.startsWith('day2-neutral')));
});
