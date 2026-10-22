import {createHash} from 'node:crypto';
// Optional wire optimization; older clients continue receiving complete snapshots.
// Hash actual content so ownership, doors, interiors and placements invalidate it.
export const SCENE_FIELDS=['village','roads','streams','terrain','towns','settlements','yards','terrainPolygons'];
export function sceneTransport(snapshot,knownRevision){
 const scene=Object.fromEntries(SCENE_FIELDS.filter(k=>Object.hasOwn(snapshot,k)).map(k=>[k,snapshot[k]]));
 const sceneRevision=createHash('sha256').update(JSON.stringify(scene)).digest('hex').slice(0,24);
 const result={...snapshot,sceneRevision};
 if(knownRevision===sceneRevision)for(const key of SCENE_FIELDS)delete result[key];
 return result;
}

