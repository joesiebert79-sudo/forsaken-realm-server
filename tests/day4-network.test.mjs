import {fileURLToPath} from 'node:url';
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';
process.env.REALM_WORLD_PROFILE='day4-housing';const {buyFixtureDeed}=await import('./deed-fixture.mjs');const {WorldStore}=await import('../server/store.mjs');
test('two HTTP clients compete for one house, move concurrently and reconnect with stable identities',{timeout:20000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'housing-net-')),base=join(dir,'world.sqlite'),seed=new WorldStore(base+'.day2-compact.sqlite',undefined,{ruleset:'master-v1'});let seq=0;
 const r=seed.realm;for(const id of ['one','two']){seed.transaction(r=>r.join(id));seed.transaction(r=>r.command(id,{id:'create-'+id,type:'createCharacter',faction:'survivor',appearance:'male-1',profession:'farmer'}));}
 const b=r.buildings.find(b=>b.housingStatus==='vacant');seed.transaction(r=>{for(const id of ['one','two']){r.state.accounts[id].gold=2000;r.player(id).inventory.sword=1;r.player(id).equippedWeapon='sword';Object.assign(r.player(id),{x:b.x,y:b.y+35});}});for(const id of ['one','two'])buyFixtureDeed(seed,id,b.houseDesign);seed.close();
 const child=spawn(process.execPath,[fileURLToPath(new URL('../server/http.mjs',import.meta.url))],{cwd:process.cwd(),env:{...process.env,PORT:'0',REALM_BIND_HOST:'127.0.0.1',REALM_WORLD_DB:base,REALM_TEST_TOKENS:JSON.stringify({'fixture-one':'one','fixture-two':'two'})},stdio:['ignore','pipe','pipe']});
 try{const port=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',d=>{text+=d;const m=/ready on port (\d+)/.exec(text);if(m)resolve(Number(m[1]));});child.on('exit',c=>reject(Error('Server exited '+c)));});
 const call=async(id,path,body)=>{const res=await fetch('http://127.0.0.1:'+port+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer fixture-'+id,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {ok:res.ok,data:await res.json()};};
 const action=(id,type,args={})=>call(id,'/action',{id:'net-'+(++seq),type,...args});
 const initial=await Promise.all(['one','two'].map(id=>call(id,'/join',{})));assert.ok(initial.every(x=>x.ok));
 const firstHit=await action('one','attack',{target:'two',weapon:'sword'});assert.ok(firstHit.ok,JSON.stringify(firstHit.data));const hurt=await call('two','/state');assert.ok(hurt.data.you.hp<initial[1].data.you.hp);const retaliation=await action('two','attack',{target:'one',weapon:'sword'});assert.ok(retaliation.ok);assert.ok((await call('one','/state')).data.you.hp<initial[0].data.you.hp);
 const offers=await Promise.all(['one','two'].map(id=>action(id,'housingPreview',{target:b.id,design:b.houseDesign})));assert.ok(offers.every(x=>x.ok));
 const purchases=await Promise.all(['one','two'].map((id,i)=>action(id,'housingConfirm',{nonce:offers[i].data.state.housing.preview.nonce})));assert.equal(purchases.filter(x=>x.ok).length,1);
 const owner=purchases[0].ok?'one':'two',visitor=owner==='one'?'two':'one';const entered=await action(owner,'enter',{target:b.id});assert.ok(entered.ok);assert.equal(entered.data.state.you.interior,b.id);assert.ok(!(await action(visitor,'enter',{target:b.id})).ok);assert.ok((await action(owner,'exit')).ok);
 for(let i=0;i<10;i++){const moves=await Promise.all(['one','two'].map(id=>action(id,'move',{dx:0,dy:1,dt:.1})));assert.ok(moves.every(x=>x.ok));}
 for(let i=0;i<2;i++){const id=['one','two'][i],again=await call(id,'/join',{});assert.equal(again.data.you.characterId,initial[i].data.you.characterId);assert.ok(Number.isFinite(again.data.you.y));assert.equal(again.data.account.gold,2000);}
 }finally{child.kill('SIGTERM');await once(child,'exit');rmSync(dir,{recursive:true,force:true});}
});


