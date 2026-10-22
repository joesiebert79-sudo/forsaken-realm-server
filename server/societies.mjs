import {COMPACT,LAYOUT} from './world-profile.mjs';
import {tickNpcTravel} from './npc-travel.mjs';
import {tickNpcWarfare,diplomacyRows} from './npc-warfare.mjs';
import {tickNpcRaids} from './npc-raids.mjs';
import {CLAN_RANKS,FACTION_TOWNS} from './master-rules.mjs';
import {BUILDINGS,buildingBlocks,WORLD_BUILDINGS} from './catalog.mjs';
import {clearStrike,recordHit,defend} from './combat.mjs';
export function npcBuildOrder(r,clan,home){
 if(home.hp<=0||!clan.leader||r.clock()<(home.nextBuildAt||0))return null;
 home.builtSlots??={};
 const needs=BUILDINGS.palisade.needs;if(Object.entries(needs).some(([k,n])=>(clan.stock[k]||0)<n))return null;
 for(let slot=0;slot<24;slot++){
  // Leave a wide southern entrance; stagger the oval perimeter slightly.
  if(slot>=5&&slot<=7||home.builtSlots[slot])continue;
  const angle=slot*Math.PI*2/24,x=home.x+Math.cos(angle)*(140+8*Math.sin(slot*1.7)),y=home.y+Math.sin(angle)*115;
  if(r.blocks(x,y)||r.safe({x,y})||r.roadGeometry.nearRoad(x,y,24)||Object.values(r.state.structures).some(s=>Math.hypot(s.x-x,s.y-y)<35))continue;
  return {slot,x,y,needs};
 }
 return null;
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const themes=COMPACT?[['ash-wardens','Ash Wardens','survivor',2400,450],['black-banner','Black Banner','bandit',400,2200]]:[['ash-wardens','Ash Wardens','survivor',2500,1800],['iron-brotherhood','Iron Brotherhood','survivor',7000,2000],['black-banner','Black Banner','bandit',5500,7000],['red-talons','Red Talons','bandit',10500,10000]];
export function ensureSocieties(r){if(r.state.societiesVersion)return;r.state.npcClans??={};r.state.npcSettlements??={};
 for(const [id,name,faction,ax,ay] of themes){let x=ax,y=ay;for(let n=0;n<100;n++){const cx=Math.floor(x/256),cy=Math.floor(y/256),key=cx+','+cy;if(!r.state.claims[key]&&!WORLD_BUILDINGS.some(b=>Math.floor(b.x/256)===cx&&Math.floor(b.y/256)===cy)&&!FACTION_TOWNS.some(t=>dist(t,{x,y})<t.radius+300)&&!r.blocks(x,y))break;x+=256;}
 const clan={resourceId:r.state.resources.find(n=>n.kind==='wood'&&dist(n,{x,y})<700)?.id,id,name,faction,members:[],leader:null,alliances:[],gold:100,stock:{wood:40,stone:40,bread:20},lastEconomy:r.clock(),leaderlessAt:null};r.state.npcClans[id]=clan;r.state.npcSettlements[id]={id,cell:Math.floor(x/256)+','+Math.floor(y/256),x,y,name,ownerType:'npc',owner:id,hp:1500,maxHp:1500};
 CLAN_RANKS.forEach((rank,i)=>{const nid='society:'+id+':'+i;const angle=i*Math.PI/4,nx=x+Math.cos(angle)*70,ny=y+Math.sin(angle)*70;const npc={id:nid,societyId:id,kind:'settlement guard',name:name+' '+rank,rank,faction,job:i<2?'gather':i<4?'trade':i<6?'patrol':'defend',x:nx,y:ny,homeX:x,homeY:y,hp:100,maxHp:100,damage:8,speed:55,range:50,lastAttack:0,respawnAt:Number.MAX_SAFE_INTEGER,active:false,equippedWeapon:'spear',equippedShield:true,equippedArmour:'tunic',inventory:{spear:1,shield:1,tunic:1,bread:2,gold:5},route:i};r.state.enemies[nid]=npc;clan.members.push(nid);if(rank==='Warlord')clan.leader=nid;});
 }
 for(const c of Object.values(r.state.npcClans))c.alliances=Object.values(r.state.npcClans).filter(other=>other.id!==c.id&&other.faction===c.faction).map(o=>o.id);r.state.societiesVersion=1;
}
function walk(npc,target,dt,r){const d=dist(npc,target);if(d<2)return;const step=Math.min(d,55*dt),x=npc.x+(target.x-npc.x)/d*step,y=npc.y+(target.y-npc.y)/d*step;if(!r.blocks(x,y)&&!r.safe({x,y})){npc.x=x;npc.y=y;npc.active=true;}}
export function societyDeath(r,npc){const c=r.state.npcClans?.[npc.societyId];if(c?.leader===npc.id){c.leader=null;c.leaderlessAt=r.clock();const delay=r.serviceBalance?.npcSuccessionDelayMs;c.successionAt=Number.isSafeInteger(delay)&&delay>0?r.clock()+delay+Math.floor((Math.abs([...npc.id].reduce((h,ch)=>(h*31+ch.charCodeAt(0))|0,0))%10001)/10000*Math.max(0,(r.serviceBalance.npcSuccessionMaxDelayMs||delay*1.5)-delay)):null;}}
export function npcBadge(r,npc){const c=r.state.npcClans?.[npc.societyId];return c?{name:c.name,rank:npc.rank,alliance:c.alliances.length?'Allied pact':''}:null;}
export function tickSocieties(r,dt){ensureSocieties(r);const now=r.clock(),humans=[...r.sessions.keys()].map(id=>r.state.players[id]).filter(p=>p.hp>0&&!p.interior&&!p.creationRequired);let budget=0;const attacks=new Map(r.activeEnemyCounts||[]);
 for(const clan of Object.values(r.state.npcClans)){
 const home=r.state.npcSettlements[clan.id],alive=clan.members.map(id=>r.state.enemies[id]).filter(n=>n?.hp>0);if(!home)continue;
 if(!clan.leader&&clan.leaderlessAt!=null&&!clan.successionAt&&Number.isSafeInteger(r.serviceBalance.npcSuccessionDelayMs)){clan.successionAt=Math.max(now,clan.leaderlessAt+r.serviceBalance.npcSuccessionDelayMs);}
 if(!clan.leader&&clan.successionAt&&now>=clan.successionAt){const senior=alive.filter(n=>CLAN_RANKS.indexOf(n.rank)>=4).sort((a,b)=>CLAN_RANKS.indexOf(b.rank)-CLAN_RANKS.indexOf(a.rank))[0];if(senior){senior.rank='Warlord';senior.job='defend';clan.leader=senior.id;clan.leaderlessAt=null;clan.successionAt=null;}}
 // Bounded distant economy: inventory moves between a worker and its clan treasury.
 if(now-clan.lastEconomy>=30000){clan.lastEconomy=now;const resource=r.state.resources.find(n=>n.id===clan.resourceId);for(const npc of alive.filter(n=>n.job==='gather'))if(resource&&(npc.inventory.wood||0)<50){if(resource.remaining<=0&&now>=resource.readyAt)resource.remaining=12;if(resource.remaining>0){resource.remaining--;npc.inventory.wood=(npc.inventory.wood||0)+1;if(!resource.remaining)resource.readyAt=now+300000;}}for(const npc of alive){if((npc.inventory.wood||0)>0&&clan.gold>0){npc.inventory.wood--;clan.stock.wood=(clan.stock.wood||0)+1;clan.gold--;npc.inventory.gold=(npc.inventory.gold||0)+1;}if((npc.inventory.bread||0)<2&&npc.inventory.gold>=2&&clan.stock.bread>0){npc.inventory.gold-=2;clan.gold+=2;npc.inventory.bread=(npc.inventory.bread||0)+1;clan.stock.bread--;}}}
 const order=npcBuildOrder(r,clan,home),builder=order?alive.find(n=>n.job==='gather'&&!n.retaliating&&!n.journey&&!n.raidClan&&!n.warId&&!n.ambushClan):null;
 for(const npc of alive){if(npc.retaliating)continue;npc.active=false;if(npc.ambushClan||npc.journey||npc.raidClan||npc.warId||npc.warDefenseId||npc.returningHome||budget>=16||!humans.some(p=>dist(p,npc)<750))continue;budget++;if(builder===npc&&order&&!humans.some(p=>p.faction!==clan.faction&&dist(p,home)<220)){if(dist(npc,order)>35)walk(npc,order,dt,r);else{for(const [k,n]of Object.entries(order.needs))clan.stock[k]-=n;const id='npc-wall:'+clan.id+':'+order.slot;r.state.structures[id]={id,kind:'palisade',owner:clan.id,npcSettlementId:clan.id,x:order.x,y:order.y,hp:BUILDINGS.palisade.hp,maxHp:BUILDINGS.palisade.hp};home.builtSlots[order.slot]=true;home.nextBuildAt=now+30000;npc.lastGather=now;r.state.revision++;}continue;}const enemy=humans.filter(p=>(p.faction!==clan.faction||npc.aggro===p.id)&&!r.safe(p)&&dist(p,home)<220&&dist(p,npc)<180).sort((a,b)=>dist(a,npc)-dist(b,npc))[0];
 if(enemy&&(attacks.get(enemy.id)||0)<2){attacks.set(enemy.id,(attacks.get(enemy.id)||0)+1);if(dist(npc,enemy)>50)walk(npc,enemy,dt,r);else if(now-npc.lastAttack>=1400&&clearStrike(npc,enemy,r.blocks)){recordHit(npc,enemy,'spear',defend(enemy,8,now),now);if(enemy.hp<=0)r.die(enemy,now);}}
 else{const radius=npc.job==='defend'?50:npc.job==='patrol'?140:95,angle=(now/20000+npc.route)*Math.PI/4;walk(npc,{x:home.x+Math.cos(angle)*radius,y:home.y+Math.sin(angle)*radius},dt,r);}
 }
 }
 tickNpcTravel(r,dt);tickNpcWarfare(r,dt);tickNpcRaids(r,dt);
}
export function societyRows(r){return [...Object.values(r.state.npcClans||{}).map(c=>({name:c.name+' • '+c.faction,detail:c.members.filter(id=>r.state.enemies[id]?.hp>0).length+' living'+(c.ambush?' • Ambush '+c.ambush.phase:'')+' • '+(c.leader?'Warlord active':'Leadership vacuum')+' • '+c.alliances.length+' allies • '+c.members.filter(id=>r.state.enemies[id]?.journey).length+' travelling traders • Camp '+Math.round(r.state.npcSettlements[c.id].x)+', '+Math.round(r.state.npcSettlements[c.id].y)})),...diplomacyRows(r)];}



