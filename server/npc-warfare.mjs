import {npcAttackCaravan} from './caravans.mjs';
import {navigate} from './navigation.mjs';
import {CLAN_RANKS} from './master-rules.mjs';
import {clearStrike,recordHit,defend} from './combat.mjs';
import {killEnemy} from './enemies.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function nearestLiving(origin,actors){let best,minimum=Infinity;for(const actor of actors){if(actor.hp<=0)continue;const dx=actor.x-origin.x,dy=actor.y-origin.y,d=Math.hypot(dx,dy);if(d<minimum){minimum=d;best=actor;}}return best;}
const living=(r,c)=>c.members.map(id=>r.state.enemies[id]).filter(n=>n?.hp>0);
export function ensureDiplomacy(r){r.state.npcWars??={};r.state.npcTreaties??={};for(const c of Object.values(r.state.npcClans||{})){c.relations??={};for(const other of Object.values(r.state.npcClans))if(other.id!==c.id)c.relations[other.id]??={standing:c.alliances.includes(other.id)?40:c.faction===other.faction?10:-40,reason:'Established relations',at:r.clock()};}}
export function npcAllied(r,a,b){return a?.id===b?.id||!!a?.alliances.includes(b?.id)&&!!b?.alliances.includes(a?.id);}
export function formNpcAlliance(r,a,b){if(!a||!b||a===b||!a.leader||!b.leader)return false;ensureDiplomacy(r);if(a.relations[b.id].standing<0||b.relations[a.id].standing<0||Object.values(r.state.npcWars).some(w=>w.status==='active'&&[w.attacker,w.defender].includes(a.id)&&[w.attacker,w.defender].includes(b.id)))return false;if(!a.alliances.includes(b.id))a.alliances.push(b.id);if(!b.alliances.includes(a.id))b.alliances.push(a.id);a.relations[b.id]={standing:60,reason:'Mutual defense pact',at:r.clock()};b.relations[a.id]={...a.relations[b.id]};return true;}
export function startNpcWar(r,a,b,reason='Leadership vacuum'){
 ensureDiplomacy(r);if(!a?.leader||!b||a.id===b.id||npcAllied(r,a,b)||truceActive(r,a.id,b.id)||a.raid||Object.values(r.state.npcWars).some(w=>w.status==='active'&&[w.attacker,w.defender].some(id=>id===a.id||id===b.id)))return null;
 const home=r.state.npcSettlements[b.id];if(!home||home.hp<=0||!living(r,b).length)return null;
 const available=living(r,a).filter(n=>n.rank!=='Warlord'&&!n.ambushClan&&!n.journey&&!n.raidClan&&!n.warId&&!n.warDefenseId&&!n.returningHome).sort((x,y)=>CLAN_RANKS.indexOf(y.rank)-CLAN_RANKS.indexOf(x.rank));
 // Small, bounded playtest squads retain a home defense; rank grants no stat bonus.
 const squad=available.slice(0,Math.min(3,Math.max(0,available.length-2)));if(squad.length<2)return null;
 const id=a.id+':'+b.id+':'+r.clock(),war={id,attacker:a.id,defender:b.id,reason,status:'active',startedAt:r.clock(),members:squad.map(n=>n.id),allies:[]};r.state.npcWars[id]=war;for(const n of squad)n.warId=id;for(const n of living(r,b))n.warDefenseId=id;
 a.relations[b.id]={standing:-80,reason,at:r.clock()};b.relations[a.id]={standing:-80,reason:'Camp attacked',at:r.clock()};
 for(const allyId of b.alliances){const ally=r.state.npcClans[allyId];if(!npcAllied(r,b,ally)||!ally.leader||ally.raid)continue;const helper=living(r,ally).find(n=>n.job==='patrol'&&!n.ambushClan&&!n.journey&&!n.warId&&!n.warDefenseId&&!n.raidClan&&!n.returningHome);if(helper){helper.warId=id;war.allies.push(helper.id);}}
 return war;
}
export function finishNpcWar(r,w,reason){w.status='ended';w.endedAt=r.clock();w.outcome=reason;for(const n of Object.values(r.state.enemies))if(n.warDefenseId===w.id)delete n.warDefenseId;for(const id of [...w.members,...w.allies]){const n=r.state.enemies[id];if(n?.warId===w.id){delete n.warId;n.returningHome=true;}}const completed=Object.values(r.state.npcWars).filter(w=>w.status==='ended').sort((a,b)=>b.endedAt-a.endedAt);for(const old of completed.slice(32))delete r.state.npcWars[old.id];}
const treatyKey=(a,b)=>[a,b].sort().join(':');
export function truceActive(r,a,b){return (r.state.npcTreaties?.[treatyKey(a,b)]?.until||0)>r.clock();}
export function proposeNpcTruce(r,war){
 if(!war||war.status!=='active'||war.proposal)return false;
 const a=r.state.npcClans[war.attacker],b=r.state.npcClans[war.defender];
 if(!a?.leader||!b?.leader)return false;
 war.proposal={kind:'ceasefire',from:a.id,to:b.id,at:r.clock(),reviewAt:r.clock()+30000,leaders:[a.leader,b.leader]};return true;
}
export function negotiateNpcPeace(r,war){
 const proposal=war.proposal;if(!proposal||r.clock()<proposal.reviewAt||war.status!=='active')return false;
 const a=r.state.npcClans[war.attacker],b=r.state.npcClans[war.defender];
 if(!a?.leader||!b?.leader||proposal.leaders[0]!==a.leader||proposal.leaders[1]!==b.leader){delete war.proposal;return false;}
 const until=r.clock()+1800000;r.state.npcTreaties[treatyKey(a.id,b.id)]={a:a.id,b:b.id,kind:'ceasefire',at:r.clock(),until};
 for(const [one,other] of [[a,b],[b,a]])one.relations[other.id]={standing:-20,reason:'Negotiated ceasefire',at:r.clock()};
 finishNpcWar(r,war,'Negotiated ceasefire');return true;
}
const move=(r,n,target,dt)=>{if(!n.retaliating)navigate(r,n,target,dt);};

function strike(r,n,target){if(n.retaliating||r.clock()-n.lastAttack<1400||!clearStrike(n,target,r.blocks)||r.safe(n)||r.safe(target))return;recordHit(n,target,n.equippedWeapon||'spear',defend(target,n.damage||8,r.clock()),r.clock());if(target.hp<=0)killEnemy(r,target,r.clock());}
export function tickNpcWarfare(r,dt){ensureDiplomacy(r);const now=r.clock();
 if(now>=(r.state.nextDiplomacyAt||0)){r.state.nextDiplomacyAt=now+30000;const clans=Object.values(r.state.npcClans);for(const weak of clans.filter(c=>!c.leader&&c.leaderlessAt!=null)){const candidates=clans.filter(c=>c.leader&&!npcAllied(r,c,weak)&&c.relations[weak.id]?.standing<0).sort((a,b)=>distance(r.state.npcSettlements[a.id],r.state.npcSettlements[weak.id])-distance(r.state.npcSettlements[b.id],r.state.npcSettlements[weak.id]));if(candidates[0]&&weak.pressuredLeadershipAt!==weak.leaderlessAt){const war=startNpcWar(r,candidates[0],weak);if(war)weak.pressuredLeadershipAt=weak.leaderlessAt;}}
  // Same-faction clans with cordial relations may formalize mutual defense.
  for(const a of clans)for(const b of clans)if(a.id<b.id&&a.faction===b.faction&&!npcAllied(r,a,b))formNpcAlliance(r,a,b);
 }
 for(const w of Object.values(r.state.npcWars)){if(w.status!=='active')continue;const a=r.state.npcClans[w.attacker],b=r.state.npcClans[w.defender],home=r.state.npcSettlements[w.defender];const attackers=w.members.map(id=>r.state.enemies[id]).filter(n=>n?.hp>0),defenders=[...living(r,b).filter(n=>!n.raidClan),...w.allies.map(id=>r.state.enemies[id]).filter(n=>n?.hp>0)];
  if(!attackers.length||!home||home.hp<=0||!defenders.length){finishNpcWar(r,w,!attackers.length?'Attack repelled':'Defenders defeated');continue;}
  if(negotiateNpcPeace(r,w))continue;
  if(now-w.startedAt>=300000&&(attackers.length<=Math.ceil(w.members.length/2)||living(r,b).length<=Math.ceil(b.members.length/2)))proposeNpcTruce(r,w);

  for(const n of attackers){if(n.retaliating)continue;const target=nearestLiving(n,defenders);if(!target)break;if(distance(n,target)>50)move(r,n,target,dt);else strike(r,n,target);}
  for(const n of defenders){if(n.hp<=0||n.retaliating)continue;const target=nearestLiving(n,attackers);if(!target)break;if(distance(n,target)<220){if(distance(n,target)>50)move(r,n,target,dt);else strike(r,n,target);}else if(w.allies.includes(n.id))move(r,n,home,dt);}
 }
 tickNpcAmbushes(r,dt);tickConvoyAmbushes(r,dt);
 for(const n of Object.values(r.state.enemies)){if(!n.returningHome||n.hp<=0)continue;move(r,n,{x:n.homeX,y:n.homeY},dt);if(distance(n,{x:n.homeX,y:n.homeY})<5)delete n.returningHome;}
}
export function diplomacyRows(r){return Object.values(r.state.npcWars||{}).map(w=>({name:r.state.npcClans[w.attacker].name+' → '+r.state.npcClans[w.defender].name,detail:w.status==='active'?w.reason+(w.proposal?' • Ceasefire under review':'')+' • '+w.members.filter(id=>r.state.enemies[id]?.hp>0).length+' attackers • '+w.allies.length+' allied defenders':w.outcome}));}

export function startNpcAmbush(r,clan,target){
 ensureDiplomacy(r);const rival=r.state.npcClans[target?.societyId];
 if(!clan?.leader||clan.ambush||clan.convoyAmbush||r.clock()<(clan.nextAmbushAt||0)||!rival||rival.id===clan.id||npcAllied(r,clan,rival)||truceActive(r,clan.id,rival.id)||rival.leader||!target.journey||target.hp<=0||r.safe(target))return false;
 const troops=living(r,clan).filter(n=>n.job==='patrol'&&!n.ambushClan&&!n.warId&&!n.warDefenseId&&!n.raidClan&&!n.returningHome&&!n.journey&&distance(n,target)<900).slice(0,2);
 if(troops.length<2)return false;
 clan.ambush={target:target.id,rival:rival.id,phase:'assembling',startedAt:r.clock(),members:troops.map(n=>n.id)};clan.nextAmbushAt=r.clock()+3600000;
 for(const n of troops)n.ambushClan=clan.id;return true;
}
function endAmbush(r,clan,reason){const order=clan.ambush;for(const id of order.members){const n=r.state.enemies[id];if(n?.ambushClan===clan.id){delete n.ambushClan;if(n.hp>0)n.returningHome=true;}}clan.lastAmbush={...order,endedAt:r.clock(),outcome:reason};clan.ambush=null;}
export function tickNpcAmbushes(r,dt){
 const now=r.clock();for(const clan of Object.values(r.state.npcClans||{})){
 if(!clan.ambush&&now>=(clan.nextAmbushScanAt||0)){clan.nextAmbushScanAt=now+30000;const target=Object.values(r.state.enemies).find(n=>n.journey&&n.hp>0&&n.societyId!==clan.id&&r.state.npcClans[n.societyId]&&!r.state.npcClans[n.societyId].leader&&distance(r.state.npcSettlements[clan.id],n)<800);if(target)startNpcAmbush(r,clan,target);}
 const order=clan.ambush;if(!order)continue;const target=r.state.enemies[order.target],troops=order.members.map(id=>r.state.enemies[id]).filter(n=>n?.hp>0);
 if(!target||target.hp<=0||!troops.length||r.safe(target)||target.interior||now-order.startedAt>=120000||truceActive(r,clan.id,order.rival)){endAmbush(r,clan,target?.hp<=0?'Target defeated':'Withdrawn');continue;}
 if(troops.every(n=>distance(n,target)<120)||now-order.startedAt>=15000)order.phase='attacking';
 for(const [i,n]of troops.entries()){if(n.retaliating)continue;if(target.hp<=0)break;const d=distance(n,target);if(order.phase==='attacking'&&d<=50)strike(r,n,target);else{const side=i%2?1:-1,goal=order.phase==='assembling'?{x:target.x+side*65,y:target.y-45}:target;move(r,n,goal,dt);}}
 // The travelling trader fights back using its actual equipped weapon and normal lootable inventory.
 const closest=nearestLiving(target,troops);if(target.hp>0&&closest&&distance(closest,target)<=50)strike(r,target,closest);
 }
}

export function tickConvoyAmbushes(r,dt){const now=r.clock();for(const clan of Object.values(r.state.npcClans||{})){if(!clan.convoyAmbush&&clan.leader&&!clan.ambush&&now>=(clan.nextAmbushAt||0)&&now>=(clan.nextConvoyScanAt||0)){clan.nextConvoyScanAt=now+30000;const convoy=Object.values(r.state.caravans||{}).find(c=>c.status==='travelling'&&c.faction!==clan.faction&&!r.safe(c)&&distance(r.state.npcSettlements[clan.id],c)<800);if(convoy){const members=living(r,clan).filter(n=>n.job==='patrol'&&!n.ambushClan&&!n.journey&&!n.warId&&!n.warDefenseId&&!n.raidClan&&!n.returningHome).slice(0,2);if(members.length===2){clan.convoyAmbush={target:convoy.id,members:members.map(n=>n.id),startedAt:now};clan.nextAmbushAt=now+3600000;for(const n of members)n.ambushClan=clan.id;}}}const order=clan.convoyAmbush;if(!order)continue;const c=Object.values(r.state.caravans||{}).find(c=>c.id===order.target),members=order.members.map(id=>r.state.enemies[id]).filter(n=>n?.hp>0);if(!c||c.status!=='travelling'||r.safe(c)||!members.length||now-order.startedAt>180000){for(const n of members){delete n.ambushClan;n.returningHome=true;}clan.lastConvoyAmbush={...order,endedAt:now};clan.convoyAmbush=null;continue;}for(const n of members){if(n.retaliating)continue;if(distance(n,c)>50)navigate(r,n,c,dt);else npcAttackCaravan(r,n,c);}}}



