// First playtest balance, authorized 2026-10-19. Keep values server-owned.
export const STARTING_GOLD=20;
const costs=[1,1,2,2,3];
const node=(name,profession,branch,description,requires={})=>({name,profession,branch,description,costs:[...costs],requires});
export const PLAYTEST_SKILLS={baseXp:100,growthXp:25,pointsPerLevel:1,nodes:{
 shieldDrill:node('Shield Drill','soldier','defense','3% less blocked damage per rank'),
 spearDrill:node('Soldier Arms','soldier','weapons','2% melee damage per rank',{shieldDrill:2}),
 timberYield:node('Timbercraft','woodsman','forestry','One additional timber per tree harvest per rank'),
 axeDrill:node('Woodsman Arms','woodsman','axes','2% axe damage per rank',{timberYield:2}),
 forgePractice:node('Forge Practice','smith','forging','5% more crafting XP per rank'),
 metalCare:node('Metal Care','smith','repair','4% lower armor repair material cost per rank',{forgePractice:2}),
 vitality:node('Vitality','shared','health','+2 maximum health per rank'),
 endurance:node('Endurance','shared','stamina','+4 maximum stamina per rank'),
 combat:node('Weapon Training','shared','combat','+1% weapon damage per rank',{endurance:2}),
 cropYield:node('Bountiful Harvest','farmer','cropYield','+1 crop per field harvest per rank'),
 preservation:node('Food Preservation','farmer','preservation','+2% nutrition from food per rank',{cropYield:2}),
 archery:node('Archery','hunter','archery','+2% ranged weapon damage per rank',{combat:2}),
 wilderness:node('Wilderness Survival','hunter','wilderness','3% slower hunger and thirst loss per rank')
}};
export const EXPERIENCE={gather:5,craft:15,harvest:25,enemy:40,companionEnemy:25};
// Only approved, known ranks affect gameplay. Stored legacy/unknown skills remain intact.
export const skillRank=(p,id)=>p.skillEffectsEnabled===true&&Number.isSafeInteger(p.skills?.[id])?Math.max(0,Math.min(5,p.skills[id])):0;
export const maxHealth=p=>100+skillRank(p,'vitality')*2;
export const maxStamina=p=>100+skillRank(p,'endurance')*4;
export const weaponDamage=(p,w)=>w.damage*(1+Math.min(.15,skillRank(p,'combat')*.01+(w.ammo?skillRank(p,'archery')*.02:skillRank(p,'spearDrill')*.02)+(w.id==='axe'?skillRank(p,'axeDrill')*.02:0)));



