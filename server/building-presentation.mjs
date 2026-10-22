import {FACTION_TOWNS} from './master-rules.mjs';
import {civicBuilding} from './service-locations.mjs';
import {merchantForBuilding} from './merchants.mjs';
/** Describe existing services for artwork. Never grants trading or town access. */
export function buildingPresentation(building){
 const merchant=merchantForBuilding(building.id);
 const civic=FACTION_TOWNS.find(t=>t.traderZone!==false&&civicBuilding(t)===building.id);
 const role=civic?'bank':merchant?.shop==='Smithy'?'smithy':merchant?.shop==='Provisioner'?'merchant':null;
 return {...(role?{role}:{}),...((merchant?.faction||civic?.faction)?{faction:merchant?.faction||civic.faction}:{})};
}



