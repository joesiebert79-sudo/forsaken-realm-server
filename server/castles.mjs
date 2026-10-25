import {APPROVED_WORLD,COMPACT,LAYOUT,MASTER} from './world-profile.mjs';
export const CASTLES=MASTER||APPROVED_WORLD?LAYOUT.castles:COMPACT?[]:[['Wolfswatch',9000,22000],['Blackthorn',27000,31000],['Stormkeep',41000,9000],['Ironcrown',51000,35000],['Duskfort',16000,51000]].map(([name,x,y],i)=>({id:'castle-'+i,kind:'keep',style:'Castle',name:name+' Castle',x,y,halfWidth:195,depth:160,size:700}));




