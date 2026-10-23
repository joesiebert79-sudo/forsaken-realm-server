// Owner-approved adaptation of the existing market-counter style. Stable building
// and town IDs retain their inventory receipts, map positions and access policy.
export const TRADER_HUBS=Object.freeze({
 'day2-master-trader-a-merchant':Object.freeze({name:'The Order of Ashendale Trader',theme:'order',affiliation:'Order of Ashendale'}),
 'day2-master-trader-b-merchant':Object.freeze({name:'The Shadow Covenant Trader',theme:'shadow',affiliation:'Shadow Covenant'})
});
export function traderHub(id){return TRADER_HUBS[id]||null;}
export function traderHubRoom(id){const hub=traderHub(id);if(!hub)return null;
 // Keep the established room boundary, exit and NPC approach coordinates so
 // connected/saved players never require a coordinate or geography migration.
 const fixtures=hub.theme==='order'?[
  {kind:'rack',x:45,y:55,w:75,h:120},
  {kind:'counter',x:170,y:110,w:275,h:65},
  {kind:'rack',x:490,y:55,w:75,h:120},
  {kind:'crate',x:45,y:280,w:60,h:60},
  {kind:'crate',x:510,y:280,w:60,h:60}
 ]:[
  {kind:'rack',x:45,y:55,w:75,h:120},
  {kind:'counter',x:170,y:110,w:275,h:65},
  {kind:'rack',x:490,y:55,w:75,h:120},
  {kind:'table',x:430,y:285,w:105,h:55},
  {kind:'crate',x:45,y:280,w:60,h:60}
 ];
 return {id,name:hub.name,type:'merchant',theme:hub.theme,affiliation:hub.affiliation,width:620,height:460,exit:{x:310,y:415},fixtures};
}
