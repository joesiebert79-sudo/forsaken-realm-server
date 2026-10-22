// Balance is supplied by the server, never by an action request. No draft curve
// or skill price becomes a live rule merely by upgrading the server.
import {positive,whole,addWhole} from './master-rules.mjs';
import {reclaimSkills} from './banking.mjs';
const own=(o,k)=>Object.hasOwn(o,k);
export const SKILL_BRANCHES=Object.freeze({
 soldier:['defense','weapons'],woodsman:['forestry','axes'],smith:['forging','repair'],
 farmer:['cropYield','farming','husbandry','preservation','production'],
 hunter:['tracking','archery','stealth','traps','wilderness'],
 shared:['health','stamina','carrying','crafting','combat']
});
export function xpInteger(value){
 if(typeof value==='number'){whole(value,'XP');return BigInt(value);}
 if(typeof value!=='string'||value.length>1000||!/^(0|[1-9][0-9]*)$/.test(value))throw Error('Invalid XP');
 return BigInt(value);
}
export function ensureCharacterProgression(p){
 p.level??=1;p.xp??=0;p.skillPoints??=0;p.skills??={};p.armorMastery??={};
 positive(p.level,'Level');xpInteger(p.xp);whole(p.skillPoints,'Skill points');
}
export function validateBalance(input){
 if(input==null)return null;
 const b=structuredClone(input);positive(b.baseXp,'Base XP');positive(b.growthXp,'XP growth');positive(b.pointsPerLevel,'Points per level');
 if(!b.nodes||typeof b.nodes!=='object'||Array.isArray(b.nodes))throw Error('Skill nodes required');
 for(const [id,n] of Object.entries(b.nodes)){
  if(!/^[a-z][a-zA-Z0-9]*$/.test(id)||['constructor','prototype'].includes(id))throw Error('Invalid skill ID');
  if(!SKILL_BRANCHES[n.profession]?.includes(n.branch))throw Error('Invalid profession skill branch');
  if(!Array.isArray(n.costs)||!n.costs.length)throw Error('Rank costs required');n.costs.forEach(v=>positive(v,'Rank cost'));
  for(const [key,rank] of Object.entries(n.requires||{})){
   positive(rank,'Prerequisite rank');const required=b.nodes[key];
   if(!own(b.nodes,key)||!required.costs||rank>required.costs.length)throw Error('Invalid prerequisite');
   if(required.profession!=='shared'&&required.profession!==n.profession)throw Error('Unreachable profession prerequisite');
  }
 }
 const visiting=new Set(),visited=new Set();
 function visit(id){if(visiting.has(id))throw Error('Cyclic skill prerequisites');if(visited.has(id))return;visiting.add(id);for(const key of Object.keys(b.nodes[id].requires||{}))visit(key);visiting.delete(id);visited.add(id);}
 Object.keys(b.nodes).forEach(visit);return b;
}
// Configurable quadratic cost; cumulative arithmetic avoids a level-by-level
// loop and uses exact integers even when lifetime XP exceeds Number precision.
function totalToLevel(level,b){const n=BigInt(level-1);return BigInt(b.baseXp)*n+BigInt(b.growthXp)*n*(n-1n)*(2n*n-1n)/6n;}
export function nextLevelXp(level,b){positive(level,'Level');const n=BigInt(level-1);return (BigInt(b.baseXp)+BigInt(b.growthXp)*n*n).toString();}
export function awardXp(p,amount,b){
 if(!b)return false;ensureCharacterProgression(p);const gain=xpInteger(amount);if(gain===0n)return false;
 const pool=totalToLevel(p.level,b)+xpInteger(p.xp)+gain;let lo=p.level,hi=Number.MAX_SAFE_INTEGER;
 while(lo<hi){const mid=lo+Math.ceil((hi-lo)/2);if(totalToLevel(mid,b)<=pool)lo=mid;else hi=mid-1;}
 if(lo===Number.MAX_SAFE_INTEGER)throw Error('Level exceeds storage precision');
 const points=addWhole(p.skillPoints,(lo-p.level)*b.pointsPerLevel);
 p.xp=(pool-totalToLevel(lo,b)).toString();p.level=lo;p.skillPoints=points;return true;
}
export function progressionCommand(p,c,b){
 if(!b)throw Error('Skill balance is awaiting approval');ensureCharacterProgression(p);
 const receipt=typeof c.id==='string'?JSON.stringify(c.id):null;if(receipt&&Object.hasOwn(p.skillTransactions||{},receipt))return;
 const record=()=>{if(receipt){p.skillTransactions??={};p.skillTransactions[receipt]=true;}};
 if(c.type==='reclaimSkills'){reclaimSkills(p,c.token,c.selection,b.nodes);record();return;}
 if(c.type!=='learnSkill')throw Error('Unknown progression action');
 if(typeof c.skill!=='string'||!own(b.nodes,c.skill))throw Error('Unknown skill');const n=b.nodes[c.skill];
 if(n.profession!=='shared'&&n.profession!==p.role)throw Error('Skill belongs to another profession');
 const rank=own(p.skills,c.skill)?p.skills[c.skill]:0;whole(rank,'Skill rank');
 if(rank>=n.costs.length)throw Error('Skill is fully trained');
 if(Object.entries(n.requires||{}).some(([key,min])=>!own(p.skills,key)||p.skills[key]<min))throw Error('Learn prerequisite skills first');
 const cost=n.costs[rank];if(p.skillPoints<cost)throw Error('Not enough skill points');
 p.skillPoints-=cost;p.skills[c.skill]=rank+1;record();
}
export function progressionView(p,b){
 ensureCharacterProgression(p);return {configured:!!b,level:p.level,xp:String(p.xp),nextLevelXp:b?nextLevelXp(p.level,b):null,skillPoints:p.skillPoints,
 nodes:b?Object.entries(b.nodes).filter(([,n])=>n.profession==='shared'||n.profession===p.role).map(([id,n])=>({id,...structuredClone(n),rank:p.skills[id]||0})):[],branches:SKILL_BRANCHES};
}



