import {APPROVED_WORLD,COMPACT,LAYOUT} from './world-profile.mjs';
import {navigate} from './navigation.mjs';
import {weaponReady,spendAttack,ammunition} from './weapon-actions.mjs';
import {planCaravanRoute} from './caravan-routing.mjs';
import {contractProgress} from './contracts.mjs';
import {FACTION_TOWNS,addWhole} from './master-rules.mjs';
import {authorizedTown,accountFor} from './accounts.mjs';
import {MERCHANTS,merchantStock,marketTotal,offers} from './merchants.mjs';
import {killEnemy} from './enemies.mjs';
import {ITEMS} from './catalog.mjs';
import {clearStrike,recordHit,defend} from './combat.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),LOADING=120000,REPLACE=3600000,SPEED=45;
const town=id=>FACTION_TOWNS.find(t=>t.id===id);
// Reuse bounded navigation caches; town activity adds no NPCs or combat.
const townNavigation=new WeakMap();
function townWalk(r,c,n,index,dt){
 const t=town(c.from);if(!t)return;
 let views=townNavigation.get(r);if(!views){views=new Map();townNavigation.set(r,views);}
 let view=views.get(t.id);if(!view){view={clock:r.clock,blocks:(x,y)=>r.blocks(x,y),safe:p=>dist(p,t)>t.radius-24};views.set(t.id,view);}
 n.active=false;
 if(n.townStop&&dist(n,n.townStop)<8){n.townWaitUntil??=r.clock()+1500+(index+1)*400;if(r.clock()<n.townWaitUntil)return;delete n.townStop;delete n.townWaitUntil;}
 if(n.townStop&&r.clock()>(n.townStopUntil||0))delete n.townStop;
 if(!n.townStop){
  n.townVisit=(n.townVisit||0)+1;
  for(let attempt=0;attempt<16;attempt++){
   const angle=index*Math.PI/2+n.townVisit*.73+attempt*.39;
   const radius=index===4?110:175+(index%2)*65;
   const target={x:t.x+Math.cos(angle)*radius,y:t.y+Math.sin(angle)*radius};
   if(view.safe(target)||r.blocks(target.x,target.y)||r.blocks(target.x-18,target.y)||r.blocks(target.x+18,target.y)||r.blocks(target.x,target.y-18)||r.blocks(target.x,target.y+18))continue;
   if((r.buildings||[]).some(b=>dist(target,{x:b.x,y:b.y+(b.depth||0)})<65))continue;
   if(c.guards.some(id=>id!==n.id&&r.state.enemies[id]?.townStop&&dist(target,r.state.enemies[id].townStop)<55))continue;
   n.townStop=target;n.townStopUntil=r.clock()+20000;break;
  }
 }
 if(n.townStop)navigate(view,n,n.townStop,Math.min(.25,Math.max(0,dt)));
}

export function caravanRoute(r,from,to){return planCaravanRoute(r,from,to)?.points||null;}
function depositCargo(r,c){for(const [item,count]of Object.entries(c.cargo)){const m=MERCHANTS.find(m=>m.townId===c.to&&Object.hasOwn(merchantStock(r,m).items,item));if(m){const s=merchantStock(r,m);s.items[item]=addWhole(s.items[item]||0,count);}else{const depot=r.state.caravanDepots[c.to];depot.goods[item]=addWhole(depot.goods[item]||0,count);}}c.cargo={};}
function retireGuards(r,c,destination=c.to||c.from){for(const id of [...c.guards,...(c.merchant?[c.merchant]:[])]){const n=r.state.enemies[id];if(n?.hp>0){const depot=r.state.caravanDepots[destination];depot.gold=addWhole(depot.gold,n.inventory.gold||0);for(const [item,count]of Object.entries(n.inventory))if(item!=='gold')depot.goods[item]=addWhole(depot.goods[item]||0,count);}delete r.state.enemies[id];}}
export function ensureCaravans(r){if(!r.state.caravansVersion){r.state.caravans??={};r.state.caravanDepots??={};for(const t of FACTION_TOWNS)r.state.caravanDepots[t.id]??={gold:300,goods:{spear:4,shield:4,tunic:4}};for(const faction of ['survivor','bandit']){const t=FACTION_TOWNS.find(t=>t.faction===faction)||FACTION_TOWNS.filter(t=>t.faction==='neutral')[faction==='bandit'?1:0];if(!t)throw Error('Missing caravan origin');r.state.caravans[faction]={id:'caravan:'+faction,faction,x:t.x,y:t.y,hp:400,maxHp:400,from:t.id,to:null,status:'waiting',readyAt:r.clock(),trip:0,guards:[],cargo:{},gold:0,escorts:{},history:[],ambushes:[]};}r.state.caravansVersion=1;}}
export function reconcileApprovedCaravans(r){
 if(!APPROVED_WORLD)return;
 // v0.94 saves can already be marked reconciled while still referring to the
 // master map's trader IDs. Move those depots and route endpoints before ticks.
 const aliases={'day2-master-trader-a':'day2-survivor','day2-master-trader-b':'day2-bandit'};
 let remapped=false;
 r.state.caravanDepots??={};
 for(const [oldId,newId] of Object.entries(aliases)){
  if(!r.state.caravanDepots[oldId])continue;
  r.state.caravanDepots[newId]??=r.state.caravanDepots[oldId];
  delete r.state.caravanDepots[oldId];
  remapped=true;
 }
 // Existing v0.95 saves may already have valid route IDs but no destination
 // depot for a neutral village. Arriving caravans must always have a depot.
 for(const t of FACTION_TOWNS)r.state.caravanDepots[t.id]??={gold:300,goods:{spear:4,shield:4,tunic:4}};
 for(const c of Object.values(r.state.caravans||{})){
  for(const key of ['from','to'])if(aliases[c[key]]){c[key]=aliases[c[key]];remapped=true;}
 }
 if(remapped)r.state.approvedCaravansVersion=0;
 if(r.state.approvedCaravansVersion)return;
 for(const c of Object.values(r.state.caravans||{})){
  if(!['loading','travelling'].includes(c.status)||!c.to)continue;
  const from=town(c.from),to=town(c.to),route=from&&to?planCaravanRoute(r,from,to,c):null;
  if(!route)throw Error('Saved caravan route cannot be transferred to the approved world');
  c.path=route.points;c.routeRoads=route.roads;c.index=1;c.x=route.points[0].x;c.y=route.points[0].y;c.totalDistance=route.points.slice(1).reduce((sum,p,i)=>sum+dist(route.points[i],p),0);c.travelled=0;c.status='loading';c.departAt=r.clock()+5000;
  for(const id of [...(c.guards||[]),...(c.merchant?[c.merchant]:[])]){const e=r.state.enemies?.[id];if(e){e.x=c.x;e.y=c.y;e.active=false;}}
 }
 r.state.approvedCaravansVersion=1;
}
function load(r,c){const from=town(c.from),depot=r.state.caravanDepots[from.id];const smith=MERCHANTS.find(m=>m.townId===from.id&&m.shop==='Smithy');if(smith){const stock=merchantStock(r,smith);for(const item of ['spear','shield','tunic']){const missing=Math.max(0,4-(depot.goods[item]||0));if(!missing||(stock.items[item]||0)<missing)continue;const price=marketTotal(offers.Smithy[item][0],stock.items[item],missing,true);if(depot.gold-price<100)continue;depot.gold-=price;stock.items[item]-=missing;depot.goods[item]=(depot.goods[item]||0)+missing;}}if(depot.gold<100||['spear','shield','tunic'].some(item=>(depot.goods[item]||0)<4))return;const choices=FACTION_TOWNS.filter(t=>(t.faction===c.faction||COMPACT&&t.faction==='neutral')&&t.id!==from.id).map(to=>({to,route:planCaravanRoute(r,from,to,c)})).filter(o=>o.route).map(o=>({...o,path:o.route.points})).sort((a,b)=>{const score=t=>(c.history.at(-1)?.from===t.to.id?100:0)+c.ambushes.filter(e=>e.to===t.to.id&&r.clock()-e.at<REPLACE*3).length*200;return score(a)-score(b)||a.to.id.localeCompare(b.to.id);});if(!choices.length)return;const chosen=choices[0],cargo={};for(const m of MERCHANTS.filter(m=>m.townId===from.id)){const stock=merchantStock(r,m);for(const item of ['wood','stone','bread','bandage','wheat','flour','thread','linen','ironOre','iron','plank','charcoal']){const n=Math.min(5,stock.items[item]||0);if(n){stock.items[item]-=n;cargo[item]=(cargo[item]||0)+n;}}}if(!Object.keys(cargo).length)return;
 for(const item of ['spear','shield','tunic'])depot.goods[item]-=4;depot.gold-=100;Object.assign(c,{to:chosen.to.id,path:chosen.path,routeRoads:chosen.route.roads,index:1,x:chosen.path[0].x,y:chosen.path[0].y,hp:400,cargo,originalCargo:structuredClone(cargo),gold:80,escorts:{},status:'loading',departAt:r.clock()+LOADING,trip:c.trip+1,travelled:0,totalDistance:chosen.path.slice(1).reduce((sum,p,i)=>sum+dist(chosen.path[i],p),0),attackers:{},guards:[],detours:0,needsDetour:false,destroyedAt:null});
 c.merchant=c.id+':'+c.trip+':merchant';r.state.enemies[c.merchant]={id:c.merchant,kind:'caravan merchant',caravanId:c.id,faction:c.faction,x:c.x,y:c.y,hp:80,maxHp:80,speed:45,damage:0,range:0,lastAttack:0,active:false,equippedWeapon:null,inventory:{},respawnAt:Number.MAX_SAFE_INTEGER};
 for(let i=0;i<4;i++){const id=c.id+':'+c.trip+':guard:'+i;c.guards.push(id);r.state.enemies[id]={id,kind:'caravan guard',caravanId:c.id,faction:c.faction,x:c.x+(i%2?35:-35),y:c.y+Math.floor(i/2)*30,hp:100,maxHp:100,speed:55,damage:8,range:50,lastAttack:0,active:false,equippedWeapon:'spear',equippedShield:true,equippedArmour:'tunic',inventory:{spear:1,shield:1,tunic:1,gold:5},respawnAt:Number.MAX_SAFE_INTEGER};}
}
function arrive(r,c){const preserved=Object.values(c.cargo).reduce((a,b)=>a+b,0)/Math.max(1,Object.values(c.originalCargo).reduce((a,b)=>a+b,0));for(const [id,escort]of Object.entries(c.escorts)){if(escort.betrayed)continue;const amount=Math.min(c.gold,Math.floor(10*preserved*Math.min(1,escort.distance/Math.max(1,c.totalDistance))));const a=r.state.accounts[id];if(a&&amount>0){a.gold=addWhole(a.gold,amount);c.gold-=amount;escort.paid=amount;const player=r.state.players[id];if(player?.characterId===escort.characterId)contractProgress(player,"escorts");}}depositCargo(r,c);r.state.caravanDepots[c.to].gold=addWhole(r.state.caravanDepots[c.to].gold,c.gold);c.gold=0;retireGuards(r,c);c.history.push({trip:c.trip,from:c.from,to:c.to,roads:c.routeRoads||[],arrivedAt:r.clock(),escorts:c.escorts});c.history=c.history.slice(-12);c.from=c.to;c.status='waiting';c.readyAt=r.clock()+LOADING;c.guards=[];}
export function caravanTarget(r,id){return Object.values(r.state.caravans||{}).find(c=>c.id===id);}
export function noteCaravanAttack(r,p,c){c.attackers??={};if(!c.attackers[p.id]){const a=accountFor(r,p);a.reputation=(a.reputation||0)+(c.faction==='survivor'?-1:1);c.attackers[p.id]=true;}if(c.escorts[p.id])c.escorts[p.id].betrayed=true;c.lastAttacker=p.id;c.needsDetour=true;if(!c.ambushes.some(e=>e.trip===c.trip)){c.ambushes.push({trip:c.trip,to:c.to,x:c.x,y:c.y,at:r.clock()});c.ambushes=c.ambushes.slice(-12);}}
export function attackCaravan(r,p,cmd){const c=caravanTarget(r,cmd.target),w=ITEMS[cmd.weapon],now=r.clock();if(!c||!['loading','travelling'].includes(c.status)||c.hp<=0||p.interior||r.safe(p)||r.safe(c))throw Error('Caravan protected or unavailable');if(!w?.damage||p.equippedWeapon!==cmd.weapon||!p.inventory[cmd.weapon])throw Error('Equip your weapon first');if(p.blockUntil>now||p.dodgeUntil>now)throw Error('Release block or dodge');weaponReady(p,w,now);if(dist(p,c)>w.range||!clearStrike(p,c,r.blocks))throw Error('Caravan out of reach or blocked');spendAttack(r,p,w,now);noteCaravanAttack(r,p,c);recordHit(p,c,cmd.weapon,w.damage,now);
 damageCaravan(r,c,now);
}
function damageCaravan(r,c,now){
 for(const [item,n]of Object.entries(c.originalCargo))c.cargo[item]=Math.min(c.cargo[item]||0,Math.ceil(n*(.5+.5*c.hp/c.maxHp)));
 if(c.hp<=0){const id='caravan-loot:'+c.id+':'+c.trip;r.state.corpses[id]={id,x:c.x,y:c.y,items:{...c.cargo,gold:c.gold},name:'Destroyed caravan',createdAt:now};c.cargo={};c.gold=0;c.status='destroyed';c.destroyedAt=now;c.readyAt=now+REPLACE;}
}
export function caravanCommand(r,p,cmd){const t=authorizedTown(r,p),c=caravanTarget(r,cmd.target);if(cmd.type!=='caravanEscort'||!c||!t||p.interior||dist(p,{x:t.x,y:t.y+80})>110)throw Error('Use your departure-town Caravan Contracts board');if(c.faction!==p.faction||c.from!==t.id||c.status!=='loading'||r.clock()>=c.departAt)throw Error('Accept only at departure before the caravan leaves');if(c.escorts[p.id])return;if(Object.keys(c.escorts).length>=6)throw Error('All six escort places are filled');c.escorts[p.id]={acceptedAt:r.clock(),characterId:p.characterId,distance:0,paid:0,betrayed:false};}
function detour(r,c){if(!c.needsDetour||c.detours>=2||c.index>=c.path.length)return;c.needsDetour=false;const goal=c.path[c.index],d=dist(c,goal);if(d<30)return;const ux=(goal.x-c.x)/d,uy=(goal.y-c.y)/d;for(const sign of [1,-1]){const bend={x:c.x-uy*160*sign+ux*80,y:c.y+ux*160*sign+uy*80},route=[{x:c.x,y:c.y},bend,goal];let clear=true;for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],steps=Math.ceil(dist(a,b)/12);for(let j=1;j<=steps;j++){const p={x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps};if(p.x<0||p.y<0||r.blocks(p.x,p.y)||FACTION_TOWNS.some(t=>t.faction!==c.faction&&dist(t,p)<t.radius)){clear=false;break;}}}if(clear){c.path.splice(c.index,0,bend);c.totalDistance+=dist(c,bend)+dist(bend,goal)-d;c.detours++;return;}}}
export function tickCaravans(r,dt){ensureCaravans(r);for(const c of Object.values(r.state.caravans)){if(c.status==='destroyed'){if(r.clock()>=c.readyAt){retireGuards(r,c,c.from);c.status='waiting';c.to=null;c.hp=c.maxHp;}else continue;}if(c.status==='waiting'){if(r.clock()>=c.readyAt)load(r,c);continue;}if(c.status==='loading'&&r.clock()>=c.departAt)c.status='travelling';if(c.status==='travelling'){detour(r,c);let left=SPEED*dt,moved=0;while(left>0&&c.index<c.path.length){const target=c.path[c.index],d=dist(c,target),step=Math.min(left,d);if(d>0){c.x+=(target.x-c.x)*step/d;c.y+=(target.y-c.y)*step/d;}left-=step;moved+=step;if(d<=step)c.index++;else break;}c.travelled+=moved;for(const [id,e]of Object.entries(c.escorts)){const p=r.state.players[id];if(!e.betrayed&&r.sessions.has(id)&&r.clock()-r.sessions.get(id)<=30000&&p?.hp>0&&!p.interior&&p.characterId===e.characterId&&dist(p,c)<500)e.distance+=moved;}if(c.index>=c.path.length){arrive(r,c);continue;}}
 const merchant=r.state.enemies[c.merchant];if(merchant?.hp>0){if(c.status==='loading')townWalk(r,c,merchant,4,dt);else{merchant.x=c.x;merchant.y=c.y+18;merchant.active=c.status==='travelling';delete merchant.townStop;delete merchant.townWaitUntil;}}
 for(const [i,id]of c.guards.entries()){const n=r.state.enemies[id];if(!n||n.hp<=0)continue;if(c.status==='loading'){townWalk(r,c,n,i,dt);continue;}delete n.townStop;delete n.townWaitUntil;const attacker=r.state.players[c.lastAttacker]||r.state.enemies[c.lastAttacker];if(attacker?.hp>0&&!attacker.interior&&(r.sessions.has(attacker.id)||!!attacker.societyId)&&!r.safe(attacker)&&!r.safe(n)&&dist(n,attacker)<160){if(dist(n,attacker)<=50&&r.clock()-n.lastAttack>=1400&&clearStrike(n,attacker,r.blocks)){recordHit(n,attacker,'spear',defend(attacker,8,r.clock()),r.clock());if(attacker.hp<=0){if(attacker.societyId)killEnemy(r,attacker,r.clock());else r.die(attacker,r.clock());}}else if(dist(n,attacker)>50){const d=dist(n,attacker),step=Math.min(d,55*dt),x=n.x+(attacker.x-n.x)*step/d,y=n.y+(attacker.y-n.y)*step/d;if(!r.blocks(x,y)&&!r.safe({x,y})){n.x=x;n.y=y;}}}else{const target={x:c.x+(i%2?30:-30),y:c.y+(i<2?-30:30)},d=dist(n,target),step=Math.min(d,55*dt);if(d>0){const x=n.x+(target.x-n.x)*step/d,y=n.y+(target.y-n.y)*step/d;if(!r.blocks(x,y)){n.x=x;n.y=y;}}}n.active=c.status==='travelling';}
 }}
export function caravanRows(r,p){const t=authorizedTown(r,p);if(!t)return [{name:'Caravan Contracts',detail:'Visit your faction contract board for information.'}];const c=r.state.caravans?.[p.faction];if(!c)return [];if(c.status==='destroyed'||c.status==='waiting')return [{name:'Caravan unavailable',detail:c.status==='destroyed'?'A replacement is being prepared.':'Awaiting goods and funding.'}];const registered=c.escorts[p.id];return [{name:'Caravan Contracts — '+town(c.to).name,detail:'Estimated arrival: '+Math.ceil(((c.totalDistance-c.travelled)/SPEED+Math.max(0,(c.departAt-r.clock())/1000))/60)+' minutes',action:c.status==='loading'&&t.id===c.from&&!registered?{type:'caravanEscort',target:c.id}:null},...(registered?[{name:registered.betrayed?'Escort forfeited':'Registered escort',detail:registered.betrayed?'Attacking your convoy forfeits payment.':'Wagon at '+Math.round(c.x)+', '+Math.round(c.y)+' • reward follows cargo and distance protected'}]:[])];}
export function caravanActors(r,p){return Object.values(r.state.caravans||{}).filter(c=>['loading','travelling'].includes(c.status)&&!p.interior&&dist(p,c)<900).map(c=>({id:c.id,targetGroup:'structures',kind:'caravan',name:c.faction+' caravan',x:c.x,y:c.y,hp:c.hp,maxHp:c.maxHp}));}

export function npcAttackCaravan(r,n,c){if(!n?.societyId||n.hp<=0||!c||c.status!=='travelling'||c.hp<=0||n.faction===c.faction||r.safe(n)||r.safe(c)||dist(n,c)>50||r.clock()-n.lastAttack<1400||!clearStrike(n,c,r.blocks))return false;recordHit(n,c,n.equippedWeapon||'spear',n.damage||8,r.clock());c.lastAttacker=n.id;c.needsDetour=true;if(!c.ambushes.some(e=>e.trip===c.trip)){c.ambushes.push({trip:c.trip,to:c.to,x:c.x,y:c.y,at:r.clock()});c.ambushes=c.ambushes.slice(-12);}damageCaravan(r,c,r.clock());return true;}





