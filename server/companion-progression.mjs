import {progressionCommand,progressionView,ensureCharacterProgression} from './character-progression.mjs';
const node=(name,description)=>({name,description,profession:'shared',branch:'combat',costs:[1,1,2,2,3],requires:{}});
export const COMPANION_BALANCE={baseXp:100,growthXp:25,pointsPerLevel:1,nodes:{
 vigor:node('Vigor','+4% maximum companion health per rank'),
 ferocity:node('Ferocity','+3% companion attack damage per rank'),
 agility:node('Agility','+2% companion movement speed per rank'),
 discipline:node('Discipline','3% shorter special-skill cooldown per rank'),
 recovery:node('Recovery','4 seconds faster recovery when defeated per rank')
}};
export const companionRank=(pet,id)=>Math.max(0,Math.min(5,Number.isSafeInteger(pet.skills?.[id])?pet.skills[id]:0));
export function trainCompanion(pet,c){ensureCharacterProgression(pet);progressionCommand(pet,{...c,type:'learnSkill'},COMPANION_BALANCE);}
export function companionProgressionView(pet){if(!pet)return null;return {...progressionView(pet,COMPANION_BALANCE),title:'COMPANION SKILLS',canReclaim:false};}



