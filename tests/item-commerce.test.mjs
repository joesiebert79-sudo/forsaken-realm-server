import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
process.env.REALM_WORLD_PROFILE='master-reference';
const {ITEM_COMMERCE,restrictedEquipment,rareEquipmentDrop,itemPrice,supplyPrice,flashPrice}=await import('../server/item-commerce.mjs');
const {PROGRESSION}=await import('../server/progression.mjs');const {WorldStore}=await import('../server/store.mjs');
const {cosmeticRows,MAIN_SHOP_IDS}=await import('../server/cosmetics.mjs');const {shopView}=await import('../server/shop.mjs');const {offers}=await import('../server/merchants.mjs');
function fixture(){const s=new WorldStore(':memory:',()=>1000000,{ruleset:'master-v1'});s.transaction(r=>{r.join('owner');r.command('owner',{id:'create',type:'createCharacter',appearance:'male-1',profession:'melee',faction:'survivor'});r.player('owner').inventory={};r.state.accounts.owner.gold=10000;});return s;}
test('every existing item has an atlas/category audit, valid cells and preserved crafting requirements',()=>{
 assert.equal(Object.keys(ITEM_COMMERCE).length,PROGRESSION.items.length);
 for(const i of PROGRESSION.items){const d=ITEM_COMMERCE[i.id];assert.ok(d);assert.equal(d.equipmentTier,i.equipmentTier||null);assert.equal(d.rarity,i.rarity);if(d.rect){assert.ok(d.rect.x>=0&&d.rect.y>=0&&d.rect.x+d.rect.w<=1536&&d.rect.y+d.rect.h<=1024);}
  const recipe=PROGRESSION.recipes.find(r=>Object.hasOwn(r.output||{},i.id));if(recipe)assert.equal(d.crafting.level,recipe.level);
 }
 assert.deepEqual(PROGRESSION.items.filter(i=>i.equipmentTier>=6).reduce((m,i)=>(m[i.equipmentTier]=ITEM_COMMERCE[i.id].rarityName,m),{}),{6:'Legendary',7:'Mythic',8:'Unique'});
 assert.deepEqual(JSON.parse(readFileSync(new URL('../android/assets/progression-data.json',import.meta.url))),PROGRESSION);
});
test('normal trader stocks exclude all restricted gear and keep appropriate stock categories',()=>{
 for(const [shop,stock]of Object.entries(offers))for(const id of Object.keys(stock))assert.equal(restrictedEquipment(id),false,shop+':'+id);
 for(const id of ['dagger','emberStaff','graveStaff','mace','crude_chest','brigandine_chest'])assert.ok(offers.Smithy[id],id);
 assert.ok(offers.Tavern.stew);assert.ok(offers.Provisioner.rope);assert.equal(offers.Smithy.stew,undefined);
});
test('rare flash gear is purchasable once per receipt; old regular offers and high crafting cannot bypass policy',()=>{
 const s=fixture();try{let r=s.realm,p=r.player('owner');cosmeticRows(r,p);const flash=shopView(r).offers.find(o=>o.id.startsWith('flash-rare-'));assert.ok(flash);assert.equal(flash.featured,'flash');assert.ok(restrictedEquipment(flash.item));
  const command={id:'rare-buy',type:'shopBuy',offer:flash.id};s.transaction(r=>r.command(p.id,command));const gold=s.realm.state.accounts.owner.gold,stock=s.realm.state.shop.offers[flash.id].stock;assert.equal(s.realm.player('owner').inventory[flash.item],1);s.transaction(r=>r.command(p.id,command));assert.equal(s.realm.state.accounts.owner.gold,gold);assert.equal(s.realm.state.shop.offers[flash.id].stock,stock);
  r=s.realm;r.state.shop.offers['catalog-plate-chest']={id:'catalog-plate-chest',item:'plate_chest',kind:'supplies',supplies:{plate_chest:1},gold:1,basic:true};
  MAIN_SHOP_IDS.add('catalog-plate-chest');assert.throws(()=>s.transaction(r=>r.command(p.id,{id:'bypass',type:'shopBuy',offer:'catalog-plate-chest'})),/only available/);MAIN_SHOP_IDS.delete('catalog-plate-chest');
  const recipe=PROGRESSION.recipes.find(r=>r.output?.plate_chest);assert.ok(recipe);assert.throws(()=>s.transaction(r=>r.command(p.id,{id:'craft-bypass',type:'craft',recipe:recipe.id})),/only available/);
 }finally{s.close();}
});
test('rare drops require dangerous exploration or a boss; rarity distribution covers all three remaining levels',()=>{
 assert.equal(rareEquipmentDrop('cottage',()=>0),null);assert.equal(rareEquipmentDrop('dangerous-exploration',()=>.5),null);
 for(const [roll,tier]of [[.1,6],[.9,7],[.99,8]]){const q=[roll,0];const id=rareEquipmentDrop('boss',()=>q.shift());assert.equal(ITEM_COMMERCE[id].equipmentTier||6,tier);}
 const q=[0,.99,0];assert.equal(ITEM_COMMERCE[rareEquipmentDrop('dangerous-exploration',()=>q.shift())].equipmentTier,8);
});
test('boss loot is a persistent corpse item and a repeated death cannot reroll or duplicate it',async()=>{
 const {killEnemy}=await import('../server/enemies.mjs');const state={players:{},accounts:{},corpses:{}};
 const enemy={id:'boss-test',kind:'Oathbreaker knight',legendaryOwner:'owner',hp:0,x:5000,y:5000,inventory:{sword:1}};
 const realm={state,safe:()=>false};killEnemy(realm,enemy,1000);const corpse=state.corpses['loot-boss-test-1000'];assert.ok(corpse);assert.equal(Object.keys(corpse.items).filter(restrictedEquipment).length,1);const before=JSON.stringify(state);killEnemy(realm,enemy,2000);assert.equal(JSON.stringify(state),before);
});
test('store packs and trader unit prices agree in total coin value, with no pack buyback profit',()=>{const factors={copper:1,silver:10,gold:100};for(const [shop,stock]of Object.entries(offers))for(const [id,q]of Object.entries(stock)){const unit=itemPrice(id);assert.equal(q[0]*factors[q[2]],unit.amount*factors[unit.currency],shop+':'+id);assert.equal(q[1],Math.floor(q[0]*factors[q[2]]/4));assert.ok(q[1]<q[0]*factors[q[2]]);}const arrows=supplyPrice({arrow:20}),unit=itemPrice('arrow');assert.equal(arrows.amount*factors[arrows.currency],20*unit.amount*factors[unit.currency]);for(const [amount,currency]of [[1,'gold'],[1,'silver'],[1,'copper'],[3,'gold'],[10,'silver']]){const flash=flashPrice(amount,currency);assert.ok(flash.gold*factors[flash.currency]<=amount*factors[currency]);if(flash.regularGold)assert.ok(flash.regularGold>flash.gold);}});

test('expired rare flash offers cannot be bought after restart and saved dungeon loot never rerolls',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{rollContainerLoot}=await import('../server/container-loot.mjs');const dir=mkdtempSync(join(tmpdir(),'realm-rare-save-')),file=join(dir,'world.sqlite');let now=1000000,s=new WorldStore(file,()=>now,{ruleset:'master-v1'}),flash,loot;
 try{s.transaction(r=>{r.join('owner');r.command('owner',{id:'rare-create',type:'createCharacter',appearance:'male-1',profession:'melee',faction:'survivor'});r.state.accounts.owner.gold=500;flash=shopView(r).offers.find(o=>o.id.startsWith('flash-rare-'));const rolls=[0,0,.1,0];loot=rollContainerLoot('dungeon',()=>rolls.shift()??0);assert.ok(Object.keys(loot).some(restrictedEquipment));r.state.containers['fixture:saved-dungeon:0']={items:loot};});s.close();now=flash.endsAt;s=new WorldStore(file,()=>now,{ruleset:'master-v1'});s.transaction(r=>r.join('owner'));assert.deepEqual(s.realm.state.containers['fixture:saved-dungeon:0'].items,loot);assert.ok(!shopView(s.realm).offers.some(o=>o.id===flash.id));const before=JSON.stringify(s.realm.state.accounts.owner),stock=s.realm.state.shop.offers[flash.id].stock;assert.throws(()=>s.transaction(r=>r.command('owner',{id:'expired-rare',type:'shopBuy',offer:flash.id})),/unavailable/);assert.equal(JSON.stringify(s.realm.state.accounts.owner),before);assert.equal(s.realm.state.shop.offers[flash.id].stock,stock);assert.deepEqual(s.realm.state.containers['fixture:saved-dungeon:0'].items,loot);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
