import {readFileSync} from 'node:fs';
export const PROGRESSION=JSON.parse(readFileSync(new URL('./progression-data.json',import.meta.url),'utf8'));
export const TECHNOLOGIES=Object.fromEntries(PROGRESSION.technologies.map(t=>[t.id,t]));
export function ensureProgression(p){p.learnedTech??=['campcraft'];p.knowledgeSpent??=0;}
export function knowledge(p){return Math.max(0,3+Math.floor(Object.values(p.professions||{}).reduce((a,v)=>a+v,0)/4)-(p.knowledgeSpent||0));}
export function learn(p,id){ensureProgression(p);const t=TECHNOLOGIES[id];if(!t)throw Error('Unknown technology');if(p.learnedTech.includes(id))throw Error('Already researched');if(!t.requires.every(k=>p.learnedTech.includes(k)))throw Error('Research the prerequisites first');if(knowledge(p)<t.cost)throw Error('Earn more knowledge through gathering and crafting');p.knowledgeSpent+=t.cost;p.learnedTech.push(id);}



