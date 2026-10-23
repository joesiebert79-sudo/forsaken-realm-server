import test from 'node:test';
import assert from 'node:assert/strict';
import {sellBackTotal,sellBackQuotes} from '../server/sell-back.mjs';
import {changeWallet,walletValue} from '../server/currency.mjs';
test('25% resale converts denominations before rounding',()=>{
 assert.equal(sellBackTotal(3,'silver'),7);
 assert.equal(sellBackTotal(3,'silver',4),30);
 assert.equal(sellBackTotal(1,'gold'),25);
 assert.equal(sellBackTotal(3,'copper'),0);
 assert.equal(sellBackTotal(3,'copper',4),3);
 assert.deepEqual(sellBackQuotes(3,'copper',4),[0,0,1,2,3]);
});
test('splitting sales cannot increase payout and stock cannot inflate resale',()=>{
 for(let base=1;base<200;base++)for(let qty=1;qty<100;qty++){
  const split=Math.floor(qty/2);
  assert.ok(sellBackTotal(base,'copper',split)+sellBackTotal(base,'copper',qty-split)<=sellBackTotal(base,'copper',qty));
  assert.ok(sellBackTotal(base,'copper',qty)<Math.ceil(base*.75)*qty);
 }
});
test('mixed coins pay silver quotes and preserve exact change',()=>{
 const before={gold:0,silver:1,copper:48};
 const after=changeWallet(before,2,'silver',false);
 assert.equal(walletValue(after),38n);
 assert.equal(walletValue(changeWallet(after,7,'copper',true)),45n);
});
test('invalid and overflowing totals are rejected',()=>{
 for(const n of [-1,1.5,NaN,Infinity])assert.throws(()=>sellBackTotal(1,'copper',n));
 assert.throws(()=>sellBackTotal(Number.MAX_SAFE_INTEGER,'gold',100));
 assert.throws(()=>sellBackTotal(1,'fake',1));
});
