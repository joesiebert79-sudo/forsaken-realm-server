import test from 'node:test';
import assert from 'node:assert/strict';
import {Realm} from '../server/world.mjs';
import {FIELD_ITEMS,FIELD_RECIPES,fieldId} from '../server/field-catalog.mjs';
import {grantFieldLot,fieldIngredientPlan,fieldAvailability,restoreFieldCatalog} from '../server/field-inventory.mjs';
import {fieldMerchantRows,fieldTrade} from '../server/field-market.mjs';
import {accountFor} from '../server/accounts.mjs';
import {coinValue} from '../server/currency.mjs';

test('field recipes have resolvable ingredients and remain marked draft',()=>{
 assert.equal(Object.keys(FIELD_RECIPES).length,53);
 for(const r of Object.values(FIELD_RECIPES)){
  assert.equal(r.balanceStatus,'draft-playtest');
  assert.ok(r.craftMs>0);
  for(const id of Object.keys(r.output))assert.ok(FIELD_ITEMS[id]);
 }
});

test('fresh wildlife lots retain quality, origin, and spoilage across a save restore',()=>{
 let now=1_000_000;
 const r=new Realm(undefined,()=>now);r.join('hunter');
 const p=r.player('hunter');
 const id=grantFieldLot(r,p.inventory,fieldId('venison'),2,{quality:'fine',provenance:{species:'deer',carcass:'a'}});
 assert.equal(fieldAvailability(r,p)[fieldId('anyMeat')],2);
 const saved=structuredClone(r.state),reloaded=new Realm(saved,()=>now);
 restoreFieldCatalog(reloaded);
 assert.equal(reloaded.state.fieldLots[id].quality,'fine');
 assert.equal(reloaded.state.fieldLots[id].provenance.carcass,'a');
 now+=4*3600000;
 assert.equal(fieldAvailability(reloaded,reloaded.state.players.hunter)[fieldId('anyMeat')],undefined);
 assert.throws(()=>fieldIngredientPlan(reloaded,reloaded.state.players.hunter,FIELD_RECIPES[fieldId('driedMeatRations')]),/Missing fresh/);
});

test('field crafting plans provenance before consuming inventory',()=>{
 const r=new Realm();r.join('hunter');const p=r.player('hunter');
 grantFieldLot(r,p.inventory,fieldId('pelt'),1,{provenance:{species:'wolf'}});
 p.inventory.salt=2;
 assert.throws(()=>fieldIngredientPlan(r,p,FIELD_RECIPES[fieldId('bearRug')]),/provenance/);
 assert.equal(p.inventory.salt,2);
 assert.equal(fieldIngredientPlan(r,p,FIELD_RECIPES[fieldId('wolfRug')]).length,2);
});

test('world command starts timed craft and delivers one tracked output',()=>{
 let now=2_000_000;
 const r=new Realm(undefined,()=>now);r.join('maker');const p=r.player('maker');
 p.role='melee';p.roleRequired=false;p.learnedTech=['campcraft'];p.inventory.berry=2;p.inventory.driedApples=1;
 r.command('maker',{id:'start-trailmix',type:'craft',recipe:fieldId('trailMix')});
 assert.equal(p.inventory.berry,undefined);
 assert.equal(p.inventory.driedApples,undefined);
 assert.equal(p.fieldCraft.recipe,fieldId('trailMix'));
 now+=15_000;r.tick(0);
 const output=Object.keys(p.inventory).find(id=>id.startsWith('lot:'));
 assert.ok(output);
 assert.equal(r.state.fieldLots[output].baseId,fieldId('trailMix'));
 assert.equal(p.fieldCraft,undefined);
 const count=p.inventory[output];r.tick(0);assert.equal(p.inventory[output],count);
});

test('draft merchant stock trades in 100:1 copper value without buyback profit',()=>{
 const r=new Realm();r.join('buyer');const p=r.player('buyer');p.role='melee';
 const wallet=accountFor(r,p);wallet.copper=1000;const m={id:'test-tavern',shop:'Tavern'};
 const before=Number(coinValue(wallet.copper,'copper')+coinValue(wallet.silver||0,'silver')+coinValue(wallet.gold||0,'gold'));
 const row=fieldMerchantRows(r,p,m).find(row=>row.item===fieldId('cleanWater'));
 assert.ok(row.stock>0);
 fieldTrade(r,p,m,{id:'buy',type:'merchantBuy',item:row.item,amount:1,expectedTotal:row.buy,expectedCurrency:'copper'});
 const lot=Object.keys(p.inventory).find(id=>id.startsWith('lot:'));
 assert.ok(lot);
 const sale=fieldMerchantRows(r,p,m).find(row=>row.item===lot);
 assert.ok(sale.sell<row.buy);
 fieldTrade(r,p,m,{id:'sell',type:'merchantSell',item:lot,amount:1,expectedTotal:sale.sell,expectedCurrency:'copper'});
 const after=Number(coinValue(wallet.copper||0,'copper')+coinValue(wallet.silver||0,'silver')+coinValue(wallet.gold||0,'gold'));
 assert.ok(after<before);
 assert.equal(p.inventory[lot],undefined);
});
