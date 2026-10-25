import {createMasterLayout} from './master-geography.mjs';
import {readFileSync} from 'node:fs';
import {createEfficiencyLayout} from './day2-efficiency-layout.mjs';
import {createDay2Layout} from './day2-layout.mjs';
import {createApprovedWorldLayout} from './approved-world-layout.mjs';
let config={};try{config=JSON.parse(readFileSync(new URL('./world-profile.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
export const PROFILE=process.env.REALM_WORLD_PROFILE||config.profile||'full';
if(!['full','day2-compact','day4-housing','day2-efficiency','master-reference'].includes(PROFILE))throw Error('Unknown world profile');
export const MASTER=PROFILE==='master-reference';
export const DAY4=PROFILE==='day4-housing';
export const APPROVED_WORLD=DAY4;
export const HOUSING=DAY4||MASTER;
export const EFFICIENCY=PROFILE==='day2-efficiency';
export const COMPACT=MASTER||EFFICIENCY||PROFILE==='day2-compact'||DAY4;
export const LAYOUT=MASTER?createMasterLayout():APPROVED_WORLD?createApprovedWorldLayout():EFFICIENCY?createEfficiencyLayout():COMPACT?createDay2Layout(DAY4):null;
export function databasePath(original){if(typeof original!=='string'||!original.length)throw Error('World database path required');if(process.env.REALM_WORLD_DB_EXACT==='1')return original;return MASTER?original+'.master-reference.sqlite':EFFICIENCY?original+'.day2-efficiency.sqlite':COMPACT?original+'.day2-compact.sqlite':original;}



