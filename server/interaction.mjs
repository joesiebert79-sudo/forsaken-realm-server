import {defenseCommand} from './base-defenses.mjs';
import {isCoin} from './currency.mjs';
import {MASTER} from './world-profile.mjs';
import {nearbyFountains,refillFountain} from './fountains.mjs';
import {canEnterHome,openPropertySign} from './housing-runtime.mjs';
import {rollContainerLoot} from './container-loot.mjs';
import {discoverContract} from './contracts.mjs';
import {serviceActors,openService} from './services.mjs';
import {moveArmorCondition,syncArmor} from './armor.mjs';
import {merchantActors,openMerchant} from './merchants.mjs';
import {masterEnabled,canEnter,accountFor} from './accounts.mjs';
import {requiredTool} from './harvesting.mjs';
import {descendDungeon,roomWorkstations,roomFor,enterRoom,exitRoom} from './interiors.mjs';
import {WORLD_BUILDINGS,ITEMS,ACCOUNT_ITEMS} from './catalog.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const same=(a,b)=>(a.interior||null)===(b.interior||null);
const fail=message=>{throw Error(message);};
function fixtures(r,p){const room=roomFor(p.interior,r.buildings);return room?room.fixtures.flatMap((f,i)=>['crate','box','chest'].includes(f.kind)?[{id:`fixture:${room.id}:${i}`,name:`${f.name||f.kind} — ${room.name}`,kind:f.kind,x:f.x+f.w/2,y:f.y+f.h/2,interior:room.id}]:[]):[];}
function findContainer(r,p,id){
 const corpse=r.state.corpses[id];if(corpse)return {...corpse,name:corpse.name||'Dropped equipment',source:corpse,corpse:true};
 const chest=r.state.structures[id];if(chest?.kind==='chest')return {...chest,name:'Storage chest',source:chest};
 const fixture=fixtures(r,p).find(f=>f.id===id);if(fixture)return {...fixture,source:r.state.containers[id]};
 return null;
}
function reachable(r,p,id){if(p.interior)canEnterHome(r,p,p.interior);const c=findContainer(r,p,id);if(!c||p.hp<=0||!same(c,p)||dist(c,p)>100)fail('Container out of reach');if(c.corpse&&r.safe(c)&&c.owner&&c.owner!==p.id)fail('Other players’ belongings are protected in Trader Town');if(c.kind==='chest'&&r.safe(c)&&!r.owns(p,c))fail('This chest is protected');return c;}
export function containerView(r,p){if(!p.openContainer)return null;try{const c=reachable(r,p,p.openContainer);return {id:c.id,name:c.name,items:{...(c.source?.items||{})},canDeposit:c.kind==='chest'};}catch{return null;}}
export function interact(r,p){
 const targets=[];const add=(object,type,range)=>{const d=dist(p,object);if(d<=range)targets.push({object,type,d});};
 for(const m of merchantActors(r,p))add(m,'merchant',110);for(const s of serviceActors(r,p))add(s,'service',110);
 if(p.interior){const room=roomFor(p.interior,r.buildings);if(room){add(room.exit,'exit',90);if(room.portal)add(room.portal,'dungeon',80);}for(const f of fixtures(r,p))add(f,'container',100);for(const bench of roomWorkstations(p,r.buildings))add(bench,'workbench',100);for(const s of Object.values(r.state.structures||{}))if(s.kind==='farm'&&s.interior===p.interior&&s.hp>0&&r.owns(p,s))add(s,'farm',100);}
 else{for(const s of Object.values(r.state.structures||{}))if(s.hp>0&&!s.abandonedAt&&r.owns(p,s)&&(['gate','stonewall','walkway','tower'].includes(s.kind)||s.kind==='keep'&&s.corner))add(s,'defense',85);for(const f of nearbyFountains(p))add(f,'fountain',100);for(const b of r.buildings||WORLD_BUILDINGS)add({...b,x:b.door?.x??b.x,y:b.door?.y??b.y+35},'enter',100);for(const s of Object.values(r.state.structures||{}))if(s.kind==='chest')add(s,'container',100);else if(s.kind==='farm'&&r.owns(p,s))add(s,'farm',100);for(const node of r.state.resources)if(node.remaining>0||r.clock()>=node.readyAt)add(node,'gather',120);}
 for(const c of Object.values(r.state.corpses))if(same(c,p))add(c,'container',70);
 targets.sort((a,b)=>a.d-b.d);let target=targets[0];if(target?.type==='gather'&&requiredTool(target.object)&&requiredTool(target.object)!==p.equippedWeapon){const matching=targets.find(t=>t.type==='gather'&&requiredTool(t.object)===p.equippedWeapon&&p.inventory[p.equippedWeapon]>0);if(matching)target=matching;}if(!target)fail('Move closer to a door, crate, chest, dropped gear or resource');
 const {object,type}=target;p.openContainer=null;p.openFarm=null;p.openMerchant=null;p.openService=null;p.openWorkbench=null;
 if(type==='defense')defenseCommand(r,p,{type:object.kind==='gate'?'baseGateToggle':p.onDefense===object.id?'baseDescend':'baseClimb',target:object.id});else if(type==='fountain')refillFountain(r,p,object.id);else if(type==='workbench')p.openWorkbench=object.station;else if(type==='service')openService(r,p,object.id);else if(type==='merchant')openMerchant(r,p,object.id);else if(type==='enter'){if(openPropertySign(r,p,object.id))return;canEnterHome(r,p,object.id);if(masterEnabled(r)&&!canEnter(r,p,{interior:object.id}))fail('That town belongs to the other faction');enterRoom(p,object.id,r.buildings);if(masterEnabled(r))discoverContract(p);}else if(type==='exit')exitRoom(p,r.buildings);else if(type==='dungeon'){canEnterHome(r,p,p.interior);descendDungeon(p);}
 else if(type==='farm')p.openFarm=object.id;
 else if(type==='gather')r.command(p.id,{id:`gather-${crypto.randomUUID()}`,type:'gather',target:object.id});
 else {const c=reachable(r,p,object.id);if(!c.source){r.state.containers[c.id]={items:rollContainerLoot(roomFor(p.interior,r.buildings)?.type)};}else c.source.items??={};p.openContainer=object.id;}
}
export function transferContainer(r,p,command,deposit){
 if(command.target!==p.openContainer)fail('Open this container first');const c=reachable(r,p,command.target);
 if(!c.source)fail('Container unavailable');if(deposit&&c.kind!=='chest')fail('Only storage chests accept deposits');
 c.source.items??={};const from=deposit?p.inventory:c.source.items,to=deposit?c.source.items:p.inventory;
 const entries=command.item==='all'&&!deposit?Object.entries(from):[[command.item,command.amount??1]];
 for(const [item,n] of entries)if(!(Object.hasOwn(ITEMS,item)||(masterEnabled(r)&&Object.hasOwn(ACCOUNT_ITEMS,item)))||!Number.isSafeInteger(n)||n<=0||n>(from[item]||0))fail('Item unavailable');
 for(const [item,n] of entries){from[item]-=n;if(!from[item])delete from[item];if(masterEnabled(r)&&!deposit&&(item==='gold'||MASTER&&isCoin(item)))r.grant(p,{[item]:n});else to[item]=(to[item]||0)+n;moveArmorCondition(deposit?p:c.source,deposit?c.source:p,item);}syncArmor(p);
 if(!p.inventory.shield){p.equippedShield=false;p.blockUntil=0;}
 if(p.equippedWeapon&&!p.inventory[p.equippedWeapon])p.equippedWeapon=null;
 if(p.equippedArmour&&!p.inventory[p.equippedArmour])p.equippedArmour=null;
 if(p.equippedHelmet&&!p.inventory[p.equippedHelmet])p.equippedHelmet=null;
 // Empty corpses remain until closed so the client can display an empty loot panel.
}

export function nearbyContainers(r,p){const candidates=[...fixtures(r,p),...Object.values(r.state.structures||{}).filter(s=>s.kind==='chest'),...Object.values(r.state.corpses)];return candidates.filter(c=>same(c,p)&&dist(c,p)<=(r.state.corpses[c.id]?70:100)).map(c=>({id:c.id,name:c.name||(c.kind==='chest'?'Storage chest':'Dropped equipment'),kind:c.kind||'corpse',distance:Math.round(dist(c,p))})).sort((a,b)=>a.distance-b.distance);}
export function openContainer(r,p,id){const c=reachable(r,p,id);if(!c.source)r.state.containers[c.id]={items:rollContainerLoot(roomFor(p.interior,r.buildings)?.type)};else c.source.items??={};p.openContainer=id;}



export function dropItem(r,p,command){
 const item=command.item,amount=command.amount??1;
 if(!Object.hasOwn(ITEMS,item)||!Number.isSafeInteger(amount)||amount<=0||amount>(p.inventory[item]||0))fail('Choose an owned item and valid quantity');
 const id=crypto.randomUUID(),pile={id,name:'Dropped '+ITEMS[item].name,x:p.x,y:p.y,interior:p.interior||null,owner:p.id,createdAt:r.clock(),items:{[item]:amount}};
 p.inventory[item]-=amount;if(!p.inventory[item])delete p.inventory[item];
 moveArmorCondition(p,pile,item);syncArmor(p);
 if(!p.inventory[p.equippedWeapon])p.equippedWeapon='unarmed';
 if(!p.inventory.shield){p.equippedShield=false;p.blockUntil=0;}
 if(!p.inventory[p.equippedHelmet])p.equippedHelmet=null;
 if(!p.inventory[p.equippedArmour])p.equippedArmour=null;
 r.state.corpses[id]=pile;p.openContainer=id;
}






