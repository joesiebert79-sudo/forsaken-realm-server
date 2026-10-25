import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canAfford} from '../server/currency.mjs';
test('compiled Android coin checks agree with server for every denomination and boundary',()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-currency-java-'));
 try{
  const checks=[];
  for(const copper of [0,1,99,100,9999,10000])for(const silver of [0,1,99,100])for(const gold of [0,1,500])for(const coin of ['copper','silver','gold'])for(const price of [1,99,100,101,10000]){
   const expected=canAfford({copper,silver,gold},price,coin);
   checks.push(`ok(CoinMath.canAfford(${copper}L,${silver}L,${gold}L,${price}L,"${coin}")==${expected});`);
  }
  // Use helper methods to stay below the Java per-method bytecode size limit.
  const methods=[];for(let i=0;i<checks.length;i+=100)methods.push(`static void c${methods.length}(){${checks.slice(i,i+100).join('')}}`);
  const file=join(dir,'CurrencyCheck.java');
  writeFileSync(file,`package com.morongaming.forsakenrealm;class CurrencyCheck{static void ok(boolean b){if(!b)throw new AssertionError("Currency disagreement");}${methods.join('')}public static void main(String[] a){${methods.map((_,i)=>`c${i}();`).join('')}ok(!CoinMath.canAfford(-1,0,0,1,"copper"));ok(!CoinMath.canAfford(0,0,1,1,"invalid"));ok(CoinMath.canAfford(Long.MAX_VALUE,Long.MAX_VALUE,Long.MAX_VALUE,Long.MAX_VALUE,"gold"));}}`);
  const exe=name=>process.env.JAVA_HOME?join(process.env.JAVA_HOME,'bin',name+(process.platform==='win32'?'.exe':'')):name;
  const source=fileURLToPath(new URL('../android/src/com/morongaming/forsakenrealm/CoinMath.java',import.meta.url));
  for(const [name,args] of [['javac',['-encoding','UTF-8','-d',dir,source,file]],['java',['-cp',dir,'com.morongaming.forsakenrealm.CurrencyCheck']]]){
   const r=spawnSync(exe(name),args,{encoding:'utf8'});assert.equal(r.status,0,String(r.error||r.stderr));
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
