import {defend} from './combat.mjs';
import {killEnemy} from './enemies.mjs';
import {downCompanion} from './companions.mjs';
import {contractKill} from './contracts.mjs';
export function applyBattleEffect(r,source,target,type){if(!['fire','poison','bleeding'].includes(type)||target.hp<=0)return;r.state.battleEffects??={};r.state.battleEffects[target.id]={target:target.id,source:source.id,character:source.characterId,type,remaining:5,nextAt:r.clock()+1000,expiresAt:r.clock()+7000};}
export function tickBattleEffects(r){const now=r.clock();for(const [id,e]of Object.entries(r.state.battleEffects||{})){const victim=r.state.enemies[id]||r.state.players[id]||Object.values(r.state.companions||{}).find(p=>p.id===id);if(!victim||victim.hp<=0||r.safe(victim)||now>=e.expiresAt){delete r.state.battleEffects[id];continue;}if(now<e.nextAt)continue;e.nextAt=now+1000;if(r.state.players[id]&&!r.sessions.has(id))continue;const damage=defend(victim,e.type==='bleeding'?3:2,now,e.type==='bleeding'?'physical':e.type);victim.hp=Math.max(0,victim.hp-damage);victim.lastHitAt=now;victim.lastHitDamage=damage;e.remaining--;if(victim.hp<=0){if(r.state.enemies[id]){killEnemy(r,victim,now);const source=r.state.players[e.source];if(source?.characterId===e.character)contractKill(source,victim);}else if(r.state.players[id])r.die(victim,now);else downCompanion(r,victim);}if(e.remaining<=0||victim.hp<=0)delete r.state.battleEffects[id];}}



