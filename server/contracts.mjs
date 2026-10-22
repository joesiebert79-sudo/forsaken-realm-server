import {nearMission} from './service-locations.mjs';
import {accountFor,authorizedTown} from './accounts.mjs';
import {CASTLES} from './castles.mjs';
import {addWhole} from './master-rules.mjs';
// Playtest rewards; no reclamation-token drop rate is silently selected.
export const CONTRACTS=[
 ...[1,3,10].map((goal,i)=>({id:'escort-'+goal,name:'Caravan guardian '+(i+1),event:'escorts',goal,gold:[10,30,70][i]})),
 ...[1,3,5].map((goal,i)=>({id:'repair-'+goal,name:'Settlement engineer '+(i+1),event:'repairs',goal,gold:[5,10,20][i]})),
 ...['woodcraft','mining','smithing','leatherwork','cooking','farming','masonry'].flatMap(profession=>[5,20,50].map((goal,i)=>({id:'profession-'+profession+'-'+goal,name:profession+' commission '+(i+1),event:'profession:'+profession,goal,gold:[10,30,70][i]}))),
 ...[1,3,5].map((goal,i)=>({id:'explore-castles-'+goal,name:'Explore '+goal+' castles',event:'castles',goal,gold:[10,30,70][i]})),
 ...[2,5,10].map((goal,i)=>({id:'dungeon-guards-'+goal,name:'Dungeon expedition '+(i+1),event:'dungeonGuards',goal,gold:[10,30,70][i]})),
 ...['boar','bear'].flatMap(kind=>[5,15,30].map((goal,i)=>({id:kind+'-'+goal,name:'Hunt '+goal+' '+kind,event:kind,goal,gold:[10,20,30][i]}))),
 ...[5,15,30,50,100,200].map((goal,i)=>({id:'wolves-'+goal,name:'Wolf Hunt '+(i+1),event:'wolves',goal,gold:[10,20,30,40,80,160][i]})),
 ...['wood','stone','fiber'].flatMap(item=>[50,150,500].map((goal,i)=>({id:item+'-'+goal,name:'Gather '+goal+' '+item,event:item,goal,gold:[10,25,60][i]}))),
 ...[5,25,100].map((goal,i)=>({id:'craft-'+goal,name:'Craft '+goal+' items',event:'craft',goal,gold:[10,30,80][i]})),
 ...[5,20,50].map((goal,i)=>({id:'harvest-'+goal,name:'Harvest '+goal+' crops',event:'harvest',goal,gold:[10,30,70][i]}))
];
export function contractProgress(p,event,amount=1){p.contracts??={progress:{},claimed:{}};if(!Number.isSafeInteger(amount)||amount<1)throw Error('Invalid contract progress');p.contracts.progress[event]=addWhole(p.contracts.progress[event]||0,amount);}
export function contractKill(p,enemy){if(/wolf/.test(enemy.kind))contractProgress(p,'wolves');for(const kind of ['boar','bear'])if(enemy.kind.includes(kind))contractProgress(p,kind);if(enemy.interior?.endsWith(':dungeon'))contractProgress(p,'dungeonGuards');}
export function claimContract(r,p,c){if(!authorizedTown(r,p))throw Error('Visit your faction contract board');const town=authorizedTown(r,p);if(!nearMission(p,town)&&(p.interior||Math.hypot(p.x-town.x,p.y-(town.y+80))>110))throw Error('Approach the contract board');const def=CONTRACTS.find(d=>d.id===c.contract);if(!def)throw Error('Unknown contract');p.contracts??={progress:{},claimed:{}};if(p.contracts.claimed[def.id])return;if((p.contracts.progress[def.event]||0)<def.goal)throw Error('Contract objectives incomplete');const a=accountFor(r,p);a.gold=addWhole(a.gold,def.gold);p.contracts.claimed[def.id]={at:r.clock(),gold:def.gold};p.achievements??={};p.achievements[def.id]=true;}
export function contractRows(p){return CONTRACTS.map(d=>({name:d.name,detail:Math.min(d.goal,p.contracts?.progress[d.event]||0)+' / '+d.goal+' • '+d.gold+' gold'+(p.contracts?.claimed[d.id]?' • COMPLETED':''),action:p.contracts?.claimed[d.id]?null:{type:'contractClaim',contract:d.id}}));}

export function discoverContract(p){const id=p.interior?.replace(/:dungeon$/,'');if(!CASTLES.some(c=>c.id===id))return;p.contracts??={progress:{},claimed:{}};p.contracts.discovered??={};if(p.contracts.discovered[id])return;p.contracts.discovered[id]=true;contractProgress(p,'castles');}



