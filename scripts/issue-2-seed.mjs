import {WorldStore} from '../server/store.mjs';
import {databasePath,LAYOUT} from '../server/world-profile.mjs';

// Ephemeral CI-only save. Never run against a real player database.
const scene=process.argv[2],base=process.env.REALM_WORLD_DB;
if(!base||!base.includes('issue-2-capture'))throw Error('Refusing non-test database path');
const village=LAYOUT.settlements.find(s=>s.id==='village-2');
const trader=LAYOUT.settlements.find(s=>s.id==='day2-survivor');
const house=LAYOUT.buildings.find(b=>b.id==='day2-neutral-smithy');
const positions={map:trader,village,wilderness:{x:34000,y:17000},trader,house:{x:house.x+180,y:house.y+160}};
const at=positions[scene];if(!at)throw Error('Unknown capture scene');
const store=new WorldStore(databasePath(base),()=>Date.now(),{ruleset:'master-v1'});
try{store.transaction(r=>{r.join('capture-player');r.command('capture-player',{id:'create-capture',type:'createCharacter',appearance:'male-1',profession:'melee',faction:'survivor'});const p=r.player('capture-player');p.x=at.x;p.y=at.y;p.hp=p.maxHp||100;p.stamina=100;const pet=r.state.companions?.[p.id];if(pet){pet.x=p.x+80;pet.y=p.y+80;}r.snapshot(p.id);});}finally{store.close();}
console.log(scene,at.x,at.y);
