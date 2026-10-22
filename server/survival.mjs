import {skillRank} from './skill-balance.mjs';
export function migrateVitals(p){p.thirst??=100;p.temperature??=50;p.hunger??=100;}
export function tickSurvival(realm,p,dt){
 migrateVitals(p);if(p.hp<=0)return;
 const metabolism=1-skillRank(p,'wilderness')*.03;p.hunger=Math.max(0,p.hunger-dt*.025*metabolism);p.thirst=Math.max(0,p.thirst-dt*.04*metabolism);
 const nearFire=(p.torchUntil||0)>realm.clock()||Object.values(realm.state.structures).some(s=>s.kind==='hearth'&&Math.hypot(p.x-s.x,p.y-s.y)<120);
 const sheltered=realm.safe(p)||!!p.interior;const cold=p.y<1800&&p.x>2000;const hot=p.y>2200&&p.x<1800;
 const target=sheltered||nearFire?50:cold?10:hot?90:50;
 p.temperature+=Math.sign(target-p.temperature)*Math.min(Math.abs(target-p.temperature),dt*.12);
 const danger=(p.hunger<=0?1:0)+(p.thirst<=0?2:0)+(p.temperature<15||p.temperature>85?1:0);
 if(danger){p.hp=Math.max(0,p.hp-dt*danger);if(p.hp===0)realm.die(p,realm.clock());}
}




