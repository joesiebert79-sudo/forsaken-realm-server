import {MASTER} from './world-profile.mjs';
export const COINS=Object.freeze(['copper','silver','gold']);
export const COIN_VALUE=Object.freeze({copper:1,silver:10,gold:100});
export const POUCH_CAPACITY=Object.freeze({copper:2000,silver:2000,gold:500});
export const isCoin=id=>COINS.includes(id);
const whole=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid coin quantity');return n;};
export function wallet(account){return Object.fromEntries(COINS.map(id=>[id,whole(account[id]??0)]));}
export function validatePouch(account,previous={}){const coins=wallet(account);for(const id of COINS)if(coins[id]>Math.max(POUCH_CAPACITY[id],previous[id]??0))throw Error(id+' pouch is full; deposit coins at the bank');return coins;}
export function coinValue(amount,coin='gold'){if(!isCoin(coin))throw Error('Invalid currency');return BigInt(whole(amount))*BigInt(COIN_VALUE[coin]);}
export function walletValue(account){const coins=wallet(account);return COINS.reduce((sum,coin)=>sum+coinValue(coins[coin],coin),0n);}
export function canAfford(account,amount,coin='gold'){return walletValue(account)>=coinValue(amount,coin);}
// Integer-only change, including a gold payment for a silver/copper price.
// Preserve legacy over-cap balances; never silently discard excess coins.
export function changeWallet(account,amount,coin='gold',credit=false,{pouch=true}={}){
 const before=wallet(account);let remaining=walletValue(account)+(credit?1n:-1n)*coinValue(amount,coin);
 if(remaining<0n)throw Error('Not enough coins');
 const next={};
 for(const id of ['gold','silver','copper']){
  const value=BigInt(COIN_VALUE[id]),capacity=BigInt(pouch?Math.max(POUCH_CAPACITY[id],before[id]):Number.MAX_SAFE_INTEGER);
  const count=remaining/value;next[id]=Number(count>capacity?capacity:count);remaining-=BigInt(next[id])*value;
 }
 if(remaining>0n)throw Error('Coin pouch is full; deposit coins at the bank');
 if(pouch)validatePouch(next,before);return next;
}
export function debitCoins(account,amount,coin='gold',options){Object.assign(account,changeWallet(account,amount,coin,false,options));}
export function creditCoins(account,amount,coin='gold',options){Object.assign(account,changeWallet(account,amount,coin,true,options));}
export function coinRows(account){if(!MASTER)return[];const coins=wallet(account);return [{name:'Belt coin pouch',detail:`Copper ${coins.copper}/2000 • Silver ${coins.silver}/2000 • Gold ${coins.gold}/500`},{name:'Coin value and change',detail:'10 copper = 1 silver. 10 silver = 1 gold. Traders accept combined coins and return change.'}];}
