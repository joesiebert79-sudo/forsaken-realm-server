import {MASTER} from './world-profile.mjs';
import {isCoin,coinRows,canAfford,debitCoins,changeWallet} from './currency.mjs';
import {deedRows} from './house-deeds.mjs';
import {clanFor} from './clans.mjs';
import {nearService} from './service-locations.mjs';
import {RECLAMATION_TOKENS,positive,whole,addWhole,BANK_TIERS} from './master-rules.mjs';
import {accountFor,authorizedTown} from './accounts.mjs';
export const CLAN_BANK_TIERS=Object.freeze([{capacity:4,gold:500},{capacity:8,gold:850},{capacity:12,gold:1200}]);
export function bankCommand(r,p,c){
 const town=authorizedTown(r,p);
 if(!town)throw Error('Use a bank in an authorized faction safe town');
 if(!nearService(p,town,'bank'))throw Error('Approach the town bank service point');
 if(c.type.startsWith('clanBank'))return clanBankCommand(r,p,c);
 if(!['bankOpen','bankUpgrade','bankDeposit','bankWithdraw'].includes(c.type))throw Error('Unknown bank action');
 const a=accountFor(r,p);enableTokenStacking(r,a.bank);
 a.bankTransactions??={};const receiptKey=JSON.stringify(c.id);if(c.id&&Object.hasOwn(a.bankTransactions,receiptKey))return;
 const record=()=>{if(c.id)a.bankTransactions[receiptKey]={type:c.type,item:c.item,amount:c.amount,at:r.clock()};};
 if(c.type==='bankOpen'){if(a.bank)throw Error('Bank account already open');const quote=bankOpeningQuote(r,p);if(quote===null)throw Error('Bank opening fee is awaiting approval');if(c.quote!==quote)throw Error('Confirm the current opening fee of '+quote+' gold');if(!canAfford(a,quote))throw Error('Opening an account costs '+quote+' gold. You carry '+a.gold+' gold; sell goods to a trader to earn the remaining '+(quote-a.gold)+'.');debitCoins(a,quote);a.bank={gold:0,tokens:{},tier:1,extraSlots:0,tokenStackLimit:r.serviceBalance.bankTokenStackLimit};record();return;}
 if(!a.bank)throw Error('Bank account is not open');
 const bank=a.bank;if(c.type==='bankUpgrade'){const upgrade=bankUpgradeQuote(r,bank);if(!upgrade)throw Error('Bank upgrade prices are awaiting approval');if(c.quote!==upgrade.gold||!canAfford(a,upgrade.gold))throw Error('Confirm the upgrade price and carry enough gold');const nextSlots=addWhole(bank.extraSlots||0,upgrade.slots);debitCoins(a,upgrade.gold);if(bank.tier<8)bank.tier++;else{bank.extraSlots=nextSlots;bank.expansions=addWhole(bank.expansions||0,1);}record();return;}const n=positive(c.amount);
 if(c.item==='gold'||MASTER&&isCoin(c.item)){
  whole(a[c.item]??0);whole(bank[c.item]??0);const from=c.type==='bankDeposit'?a:bank,to=c.type==='bankDeposit'?bank:a;
  if(!canAfford(from,n,c.item))throw Error('Insufficient coins');const source=changeWallet(from,n,c.item,false,{pouch:from===a&&MASTER}),target=changeWallet(to,n,c.item,true,{pouch:to===a&&MASTER});Object.assign(from,source);Object.assign(to,target);record();return;
 }
 if(!Object.hasOwn(RECLAMATION_TOKENS,c.item))throw Error('Only gold and Skill Reclamation Tokens may be banked');
 // Token capacity remains disabled until the approved stack interpretation is configured.
 if(!Number.isSafeInteger(bank.tokenStackLimit)||bank.tokenStackLimit<1)throw Error('Bank token stacking is awaiting approval');
 const from=c.type==='bankDeposit'?p.inventory:bank.tokens,to=c.type==='bankDeposit'?bank.tokens:p.inventory;
 if((from[c.item]||0)<n)throw Error('Insufficient tokens');const total=addWhole(to[c.item]||0,n);
 if(c.type==='bankDeposit'){
  const tier=BANK_TIERS[bank.tier-1];if(!tier)throw Error('Invalid bank tier');
  const used=Object.entries({...bank.tokens,[c.item]:total}).reduce((sum,[,count])=>sum+Math.ceil(whole(count)/bank.tokenStackLimit),0);
  if(used>tier.slots+(bank.extraSlots||0))throw Error('Bank is full');
 }
 from[c.item]-=n;if(!from[c.item])delete from[c.item];to[c.item]=total;record();
}
export function reclaimSkills(p,token,selection,nodes){
 const refund=Object.hasOwn(RECLAMATION_TOKENS,token)?RECLAMATION_TOKENS[token]:null;if(!refund||!(p.inventory[token]>0))throw Error('Reclamation token unavailable');
 if(!selection||typeof selection!=='object'||Array.isArray(selection))throw Error('Select allocated points');
 const next={...p.skills};let points=0;
 for(const [id,n] of Object.entries(selection)){positive(n);if(!Object.hasOwn(nodes,id)||n>(next[id]||0))throw Error('Invalid skill selection');const node=nodes[id],rank=next[id];if(node.costs){if(!Array.isArray(node.costs)||rank>node.costs.length)throw Error('Invalid skill rank');for(let i=rank-n;i<rank;i++)points=addWhole(points,positive(node.costs[i],'Rank cost'));}else points=addWhole(points,n);next[id]-=n;}
 if(points!==refund)throw Error(`Select exactly ${refund} allocated points`);
 for(const [id,rank] of Object.entries(next))if(rank>0){const node=nodes[id];if(!node||Object.entries(node.requires||{}).some(([key,n])=>(next[key]||0)<n))throw Error('Dependent skill prerequisites must remain satisfied');}
 const total=addWhole(p.skillPoints||0,refund);p.inventory[token]--;if(!p.inventory[token])delete p.inventory[token];p.skills=next;p.skillPoints=total;
}

function enableTokenStacking(r,bank){
 const limit=r.serviceBalance?.bankTokenStackLimit;
 if(bank&&!Number.isSafeInteger(bank.tokenStackLimit)&&Number.isSafeInteger(limit)&&limit>0)bank.tokenStackLimit=limit;
}
export function bankUpgradeQuote(r,bank){
 const cfg=r.serviceBalance||{};
 if(bank.tier<8){const prices=cfg.bankUpgradeGold;if(!Array.isArray(prices)||prices.length!==7||!Number.isSafeInteger(prices[bank.tier-1])||prices[bank.tier-1]<1)return null;return {gold:prices[bank.tier-1],slots:0};}
 const {bankExpansionSlots:slots,bankExpansionBaseGold:base,bankExpansionStepGold:step}=cfg;
 if(![slots,base,step].every(n=>Number.isSafeInteger(n)&&n>0))return null;
 const gold=base+(bank.expansions||0)*step;if(!Number.isSafeInteger(gold)||gold<1)return null;
 return {gold,slots};
}

export function bankOpeningQuote(){return 20;}
function personalBankRows(r,p){const a=accountFor(r,p),b=a.bank,cost=bankOpeningQuote(r,p);enableTokenStacking(r,b);if(!b)return [{name:'Open permanent bank account',detail:cost===null?'Opening fee and token limits are not yet available.':'One-time fee: '+cost+' gold. Deposits and withdrawals are free.',confirm:'Pay the bank opening fee?',action:cost===null?null:{type:'bankOpen',quote:cost}}];const rows=[{name:BANK_TIERS[b.tier-1].name,detail:(BANK_TIERS[b.tier-1].slots+(b.extraSlots||0))+' token slots • Gold uses no slots'}];for(const item of [...(MASTER?['copper','silver','gold']:['gold']),...(Number.isSafeInteger(b.tokenStackLimit)&&b.tokenStackLimit>0?Object.keys(RECLAMATION_TOKENS):[])])for(const deposit of [true,false])rows.push({name:(deposit?'Deposit ':'Withdraw ')+item,detail:'Available: '+(isCoin(item)?(deposit?(a[item]??0):(b[item]??0)):((deposit?p.inventory:b.tokens)[item]||0)),prompt:'Amount',field:'amount',numeric:true,action:{type:deposit?'bankDeposit':'bankWithdraw',item}});const upgrade=bankUpgradeQuote(r,b);if(upgrade)rows.push({name:b.tier<8?'Upgrade to '+BANK_TIERS[b.tier].name:'Expand vault by '+upgrade.slots+' slots',detail:upgrade.gold+' gold • permanent capacity',confirm:'Purchase this bank upgrade?',action:{type:'bankUpgrade',quote:upgrade.gold}});return rows;}

export function bankRows(r,p){return [...personalBankRows(r,p),...deedRows(r,p),...coinRows(accountFor(r,p)),...clanBankRows(r,p)];}
function clanBankRows(r,p){
 const c=clanFor(r,p);if(!c||!Object.hasOwn(c.members,p.id))return [];
 const b=c.bank,leader=c.leader===p.id,rows=[{name:c.name+' — Clan bank',detail:b?b.gold+' gold • capacity '+b.capacity+' members':'No clan bank account'}];
 if(leader)for(const tier of CLAN_BANK_TIERS)if(tier.capacity>=Object.keys(c.members).length&&(!b||tier.capacity>b.capacity)){const cost=tier.gold-(b?.openingGold||0);rows.push({name:(b?'Expand':'Open')+' clan bank: '+tier.capacity+' members',detail:cost+' gold • one-time fee • shared deposits and withdrawals',confirm:'Pay '+cost+' gold for this clan bank capacity?',action:{type:'clanBankOpen',capacity:tier.capacity,quote:cost}});}
 if(b){rows.push({name:'Deposit clan gold',detail:'Carried: '+accountFor(r,p).gold,prompt:'Amount',field:'amount',numeric:true,action:{type:'clanBankDeposit',item:'gold'}});rows.push({name:'Withdraw clan gold',detail:'Banked: '+b.gold,prompt:'Amount',field:'amount',numeric:true,action:{type:'clanBankWithdraw',item:'gold'}});}
 return rows;
}
function clanBankCommand(r,p,cmd){
 const c=clanFor(r,p);if(!c||!Object.hasOwn(c.members,p.id))throw Error('Join a clan first');
 if(!['clanBankOpen','clanBankDeposit','clanBankWithdraw'].includes(cmd.type))throw Error('Unknown clan bank action');
 if(cmd.type==='clanBankOpen'&&c.leader!==p.id)throw Error('Only the Warlord may open or expand the clan bank');
 c.bankTransactions??={};const key=JSON.stringify([p.id,cmd.id]);if(cmd.id&&Object.hasOwn(c.bankTransactions,key))return;
 const a=accountFor(r,p);
 if(cmd.type==='clanBankOpen'){
  const tier=CLAN_BANK_TIERS.find(t=>t.capacity===cmd.capacity),b=c.bank;
  if(!tier||tier.capacity<Object.keys(c.members).length||(b&&tier.capacity<=b.capacity))throw Error('Choose a larger clan capacity that fits all members');
  const cost=tier.gold-(b?.openingGold||0);if(cmd.quote!==cost||!canAfford(a,cost))throw Error('Confirm the current fee and carry enough gold');
  debitCoins(a,cost);c.bank={gold:b?.gold||0,capacity:tier.capacity,openingGold:tier.gold};
 }else{
  if(!c.bank)throw Error('Open a clan bank first');if(cmd.item!=='gold')throw Error('Clan bank accepts gold only');
  const n=positive(cmd.amount),from=cmd.type==='clanBankDeposit'?a:c.bank,to=cmd.type==='clanBankDeposit'?c.bank:a;
  if(whole(from.gold)<n)throw Error('Insufficient gold');const total=addWhole(to.gold,n);from.gold-=n;to.gold=total;
 }
 if(cmd.id)c.bankTransactions[key]={type:cmd.type,at:r.clock()};
}




