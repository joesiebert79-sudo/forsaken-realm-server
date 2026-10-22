import {FACTION_TOWNS} from './master-rules.mjs';
export function civicBuilding(town){return town.id.startsWith('day2-')?town.id+'-bank':['greyhaven','ironwatch'].includes(town.mapId)?town.mapId+'-keep':town.id+'-shop-2';}
export function missionBuilding(town){return town.id.startsWith('day2-master-')?town.id+'-missions':town.id.startsWith('day2-')?town.id+'-workshop':['greyhaven','ironwatch'].includes(town.mapId)?town.mapId+'-house3':'frontier-'+town.mapId.replace('march-','')+'-cottage';}
export function nearMission(p,town){return p.interior===missionBuilding(town)&&Math.hypot(p.x-(town.id.startsWith('day2-master-')?465:270),p.y-240)<=110;}
export function civicLabel(id){if(FACTION_TOWNS.some(t=>t.traderZone!==false&&missionBuilding(t)===id))return 'MISSIONS';return FACTION_TOWNS.some(t=>t.traderZone!==false&&civicBuilding(t)===id)?'BANK & CHARACTER MASTER':null;}
export function servicePosition(town,service){return {interior:civicBuilding(town),x:service==='bank'?120:335,y:350};}
export function nearService(p,town,service){const s=servicePosition(town,service);return p.interior===s.interior&&Math.hypot(p.x-s.x,p.y-s.y)<=110;}





