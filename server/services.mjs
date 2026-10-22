import {RELEASE_INFO} from './release.mjs';
import {HOUSING} from './world-profile.mjs';
import {housingRows} from './housing-runtime.mjs';
import {productionRows} from './regional-production.mjs';
import {legendaryRows} from './legendary-missions.mjs';
import {siegeEngineRows} from './sieges.mjs';
import {caravanRows} from './caravans.mjs';
import {siegeRows,repairRows} from './sieges.mjs';
import {servicePosition,missionBuilding} from './service-locations.mjs';
import {cosmeticRows} from './cosmetics.mjs';
import {bankRows} from './banking.mjs';
import {characterRows} from './character-master.mjs';
import {FACTION_TOWNS} from './master-rules.mjs';
import {accountFor,authorizedTown,masterEnabled} from './accounts.mjs';
import {contractRows} from './contracts.mjs';import {friendRows} from './friends.mjs';import {settlementRows} from './settlements.mjs';import {societyRows} from './societies.mjs';
export function serviceActors(r,p){if(!masterEnabled(r))return [];return FACTION_TOWNS.filter(t=>t.traderZone!==false).flatMap(t=>[{id:'contracts:'+t.id,name:'Caravan Board',service:'caravans',x:t.x,y:t.y+80,interior:null,faction:t.faction,protected:true},{id:'missions:'+t.id,name:'Mission Master',service:'contracts',x:t.id.startsWith('day2-master-')?465:270,y:240,interior:missionBuilding(t),faction:t.faction,protected:true,recruitable:false},...['characters','bank'].map(service=>({id:service+':'+t.id,name:service==='bank'?'Banker':'Character Master',service,...servicePosition(t,service),faction:t.faction,protected:true}))]).filter(s=>(s.interior||null)===(p.interior||null)&&Math.hypot(p.x-s.x,p.y-s.y)<900);}
export function openService(r,p,id){const s=serviceActors(r,p).find(x=>x.id===id);if(!s||(s.faction!=='neutral'&&p.faction!==s.faction)||Math.hypot(p.x-s.x,p.y-s.y)>110)throw Error('Approach your faction town service');p.openService=s.service;p.openMerchant=null;p.openContainer=null;}
export function serviceViews(r,p){const a=accountFor(r,p);return {...(HOUSING?{housing:{title:'HOUSING',rows:housingRows(r,p)}}:{}),caravans:{title:'CARAVAN CONTRACTS',rows:caravanRows(r,p)},shop:{title:'SHOP & COSMETIC MARKET',tabs:['Catalog','Wardrobe','Marketplace','Cash'],rows:[{group:'Catalog',name:'Server '+RELEASE_INFO.version,detail:'Smaller map: 49,920 × 33,280 • 10 copper = 1 silver • 10 silver = 1 gold',action:null},...cosmeticRows(r,p)]},contracts:{title:'THE FORSAKEN CONTRACTS',rows:[...legendaryRows(p),...contractRows(p)]},friends:{title:'FRIENDS',rows:friendRows(r,p)},settlement:{title:'SETTLEMENT',rows:[...settlementRows(r,p),...siegeRows(r,p),...siegeEngineRows(r,p),...repairRows(r,p)]},societies:{title:'NPC SOCIETIES',rows:[...societyRows(r),...productionRows(r)]},characters:{title:'CHARACTER MASTER',rows:characterRows(r,p)},bank:{title:'SAFE-TOWN BANK',rows:bankRows(r,p)}};}




