import {roomFor,roomBlocked,enterRoom,exitRoom,roomWorkstations,stationInRoom} from './interiors.mjs';
/** Explicit isolated-world adapter. Never registers compact IDs in the live catalogue. */
export function createDay2Interiors(layout){
 const buildings=structuredClone(layout.buildings);
 const byId=new Map(buildings.map(b=>[b.id,b]));
 if(byId.size!==12||buildings.some(b=>!['smithy','bank','workshop','merchant'].includes(b.role)))throw Error('Expected twelve Day 2 service buildings');
 return Object.freeze({
  room:id=>roomFor(id,buildings),
  enter:(player,id)=>enterRoom(player,id,buildings),
  exit:player=>exitRoom(player,buildings),
  blocked:(id,x,y)=>{const room=roomFor(id,buildings);return !room||roomBlocked(room,x,y);},
  workstations:player=>roomWorkstations(player,buildings),
  canCraftAt:(player,station)=>!!stationInRoom(player,station,buildings),
 });
}

