import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../economy/store-trader-v1.catalog.json',import.meta.url)));
test('360 uniquely named priced proposals reconcile existing and missing items',()=>{
 assert.equal(catalog.items.length,360);assert.equal(new Set(catalog.items.map(i=>i.id)).size,360);assert.equal(new Set(catalog.items.map(i=>i.name.toLowerCase())).size,360);
 assert.equal(catalog.items.filter(i=>i.provenance==='existing-game-item').length,165);assert.equal(catalog.items.filter(i=>i.provenance==='owner-authorized-new-proposal').length,195);
 assert.equal(catalog.missingProposedItemCount,0);
 for(const item of catalog.items){const p=item.proposedPrice;assert.ok(Number.isSafeInteger(p.totalCopper)&&p.totalCopper>0,item.id);assert.equal(p.amount*({gold:100,silver:10,copper:1}[p.currency]),p.totalCopper,item.id);assert.equal(item.proposedSellBack.unitCopper,Math.floor(p.totalCopper/4));if(item.ordinaryTraderStockAllowed){assert.ok(['Smithy','Tavern','Provisioner'].includes(item.trader),item.id);assert.ok([1,5,10,18,28].includes(item.level.purchase),item.id);}if(item.rarity.level>=6)assert.equal(item.ordinaryTraderStockAllowed,false,item.id);}
});
test('new proposals remain outside gameplay until review',()=>{
 assert.equal(catalog.runtimeIntegration,false);for(const item of catalog.items.filter(i=>i.provenance==='owner-authorized-new-proposal')){assert.equal(item.runtimeImplemented,false);assert.ok(item.reviewRequired.length);}
 assert.equal(catalog.policies.cashStore.cosmeticsOnly,true);assert.equal(catalog.policies.cashStore.gameplayAdvantagesAllowed,false);
});
