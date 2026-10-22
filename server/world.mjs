import {migrateMap} from './map-migration.mjs';
import {RELEASE_INFO} from './release.mjs';
import {ensureMasterEncounters} from './master-encounters.mjs';
import {isCoin,wallet,validatePouch} from './currency.mjs';
import {nearbyFountains} from './fountains.mjs';
import {deedCommand,restoreDeedDefinitions} from './house-deeds.mjs';
import {masterBlocked,localMasterPolygons,ensureMasterResources} from './master-geography.mjs';
import {staticNearby} from './spatial-index.mjs';
import {migrateTraderVillage} from './trader-village-migration.mjs';
import {migrateTravelLayout} from './travel-migration.mjs';
import {COMPACT,LAYOUT,DAY4,HOUSING,EFFICIENCY,MASTER} from './world-profile.mjs';
import {buildingPresentation} from './building-presentation.mjs';
import {arrange,placeItem} from './backpack-grid.mjs';
import {payCraft,craftingStorageView} from './craft-storage.mjs';
import {backpackCapacity,backpackSlots,checkBackpack,carryWeight,burden,checkWeight} from './backpack-capacity.mjs';
import {CASTLE_WALLS,castleWallBlocks,localCastleWalls,clearWallOverlap} from './castle-walls.mjs';
import {worldTime,visibility,inSight} from './world-visibility.mjs';
import {tickRegionalProduction} from './regional-production.mjs';
import {legendaryCommand} from './legendary-missions.mjs';
import {applyBattleEffect,tickBattleEffects} from './battle-effects.mjs';
import {deploySiege,fireSiege} from './sieges.mjs';
import {ammunition,weaponReady,spendAttack,shotHits,ammoDamage} from './weapon-actions.mjs';
import {ensureCaravans,tickCaravans,caravanCommand,caravanActors,caravanTarget,attackCaravan,noteCaravanAttack} from './caravans.mjs';
import {repairStructure,structureTarget,attackStructure,tickSieges,revokeRepairProtection} from './sieges.mjs';
import {createYards,localYards} from './yards.mjs';
import {roadsForWorld} from './landscape.mjs';
import {ensureDungeons,tickDungeons} from './dungeons.mjs';
import {civicLabel} from './service-locations.mjs';
import {prepareTownExpansion,clearStaticApproaches} from './town-expansion.mjs';
import {ensureCosmetics,equippedCosmetic} from './cosmetics.mjs';
import {readFileSync} from 'node:fs';
import {characterMasterCommand} from './character-master.mjs';
import {contractProgress,contractKill,claimContract,discoverContract} from './contracts.mjs';
import {friendsCommand} from './friends.mjs';
import {housingCommand,housingView,refreshHousing,canEnterHome,initializeHousing} from './housing-runtime.mjs';
import {settlementCommand,buildSettlement,settlementOwnsStructure,privateStationActive,tickSettlements} from './settlements.mjs';
import {ensureSocieties,tickSocieties,npcBadge} from './societies.mjs';
import {serviceViews,serviceActors,openService} from './services.mjs';
import {trainCompanion,companionProgressionView} from './companion-progression.mjs';
import {ensureArmor,equipArmor,syncArmor,armorPenalty,masteryCommand,masteryView,repairArmor,moveArmorCondition} from './armor.mjs';
import {PLAYTEST_SKILLS,EXPERIENCE,skillRank,maxHealth,maxStamina,weaponDamage} from './skill-balance.mjs';
import {validateBalance,ensureCharacterProgression,progressionCommand,progressionView,awardXp} from './character-progression.mjs';
import {clanCommand,clanView,clanBadge,clanFriendlyFireBlocked} from './clans.mjs';
import {merchantActors,merchantForBuilding,merchantView,trade} from './merchants.mjs';
import {shopCommand,shopView} from './shop.mjs';
import {masterEnabled,accountFor,accountView,createCharacter,authorizedTown,canEnter,spawnFor,expireCorpses} from './accounts.mjs';
import {APPEARANCES,INITIAL_PROFESSIONS,FACTION_TOWNS,addWhole} from './master-rules.mjs';
import {bankCommand} from './banking.mjs';
import {checkHarvestTool,addHandGathering,requiredTool} from './harvesting.mjs';
import {ensureCompanion,resetCompanion,rideCompanion,dismount,commandCompanion,tickCompanions,companionView,findCompanion,downCompanion,companionDamage,COMPANIONS} from './companions.mjs';
import {ROLES,chooseRole,respawnKit} from './roles.mjs';
import {dropItem,interact,containerView,transferContainer,openContainer,nearbyContainers} from './interaction.mjs';
import {ensureProgression,knowledge,learn} from './progression.mjs';
import {block,dodge,defend,clearStrike,recordHit} from './combat.mjs';
import {localTerrain,expandLandscape,naturalizeStones,worldMap,localRoads,nearRoad,STREAMS} from './landscape.mjs';
import {buildingById,roomFor,roomBlocked,enterRoom,exitRoom,stationInRoom,clearDoorApproaches} from './interiors.mjs';
import {migrateVitals,tickSurvival} from './survival.mjs';
import { randomUUID } from 'node:crypto';
import {createEnemies,tickEnemies,killEnemy,equipEnemy} from './enemies.mjs';
import { WORLD, ITEMS, ACCOUNT_ITEMS, RECIPES, BUILDINGS, PROFESSIONS, TOWN_BUILDINGS, WORLD_BUILDINGS, VILLAGES, buildingBlocks } from './catalog.mjs';
const fail = message => { throw new Error(message); };
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const finite = n => typeof n === 'number' && Number.isFinite(n);
export function initialWorld() {
  if(COMPACT)return {schema:1,profile:MASTER?'master-reference':EFFICIENCY?'day2-efficiency':'day2-compact',travelLayoutVersion:3,revision:0,players:{},kingdoms:{},claims:{},structures:{},corpses:{},resources:structuredClone(LAYOUT.resources),time:0,environmentVersion:1,frontierVersion:1,landscapeVersion:2,powderResourcesVersion:1,catalogueVersion:1,wildResourceLogicVersion:1};
  const resources = [];
  for(let i=0;i<600;i++) resources.push({id:`resource-${i}`,x:250+(i*137)%3500,y:250+(i*271)%3500,kind:['wood','stone','fiber','ironOre'][i%4],remaining:12,readyAt:0});
  return {schema:1,revision:0,players:{},kingdoms:{},claims:{},structures:{},corpses:{},resources,time:0};
}
export class Realm {
  constructor(state=initialWorld(), clock=()=>Date.now(), options={}) {
    if(COMPACT&&state.profile!==(MASTER?'master-reference':EFFICIENCY?'day2-efficiency':'day2-compact'))fail('Refusing to open a different world profile in this test mode');
    if(!COMPACT&&['day2-compact','day2-efficiency','master-reference'].includes(state.profile))fail('Refusing to open a compact save in full-world mode');
    if(options.ruleset && options.ruleset!=='master-v1') fail('Unsupported ruleset');
    if(options.ruleset)state.ruleset=options.ruleset;
    restoreDeedDefinitions(state);
    if(state.schema!==1) fail('Unsupported world schema');
    if(COMPACT)migrateTravelLayout(state,LAYOUT);migrateMap(state);
    migrateTraderVillage(state);this.state=state;this.clock=clock;this.townExpansion=prepareTownExpansion(state);this.buildings=this.townExpansion.buildings;initializeHousing(this);this.blocks=(x,y)=>(MASTER&&masterBlocked(x,y))||this.townExpansion.blocks(x,y)||this.housingBlocks(x,y)||castleWallBlocks(x,y);for(const p of Object.values(state.players||{}))clearWallOverlap(p,this.blocks);for(const p of Object.values(state.companions||{}))clearWallOverlap(p,this.blocks);this.roadGeometry=roadsForWorld(state);this.yards=createYards(this.buildings,this.roadGeometry,state);state.enemies??=createEnemies();if(COMPACT&&!state.compactEnemyVersion){state.enemies=Object.fromEntries(Object.entries(state.enemies).filter(([id,e])=>e.x>80&&e.y>80&&e.x<LAYOUT.width-80&&e.y<LAYOUT.height-80&&!this.blocks(e.x,e.y)&&!LAYOUT.settlements.some(t=>distance(t,e)<650)).slice(0,10));state.compactEnemyVersion=1;}
    if(!state.environmentVersion){
      for(let i=0;i<900;i++){
        const x=100+(i*743)%3890,y=100+(i*1091)%3890;
        if(WORLD.safeTowns.some(t=>distance(t,{x,y})<t.radius+70)||this.blocks(x,y))continue;
        state.resources.push({id:`forest-${i}`,x,y,kind:i%7===0?'stone':i%5===0?'fiber':'wood',remaining:12,readyAt:0});
      }
      state.environmentVersion=1;
    }
    if(!state.frontierVersion){
      for(let i=0;i<2400;i++){const x=150+(i*1543)%13250,y=150+(i*2269)%13250;if((x<4100&&y<4100)||this.blocks(x,y))continue;state.resources.push({id:`frontier-resource-${i}`,x,y,kind:i%9===0?'ironOre':i%5===0?'stone':i%4===0?'fiber':'wood',remaining:12,readyAt:0});}
      const templates=Object.values(createEnemies());for(let i=0;i<180;i++){const x=4300+(i*317)%8800,y=200+(i*641)%12800;if(this.blocks(x,y))continue;const e=structuredClone(templates[i%templates.length]);e.id=`frontier-enemy-${i}`;e.x=e.homeX=x;e.y=e.homeY=y;state.enemies[e.id]=e;}
      state.frontierVersion=1;
    }
    expandLandscape(state);if(!COMPACT){addHandGathering(state);naturalizeStones(state);}
    if(!state.powderResourcesVersion){for(const v of VILLAGES)for(const [i,kind] of ['sulfur','saltpetre','leadOre'].entries()){const id='powder-'+v.id+'-'+kind;if(state.resources.some(n=>n.id===id))continue;for(let step=0;step<40;step++){const angle=(i*2+step*.17),x=v.x+Math.cos(angle)*(1000+step*12),y=v.y+Math.sin(angle)*(1000+step*12);if(x<30||y<30||x>WORLD.width-30||y>WORLD.height-30||this.blocks(x,y)||nearRoad(x,y,100))continue;state.resources.push({id,x,y,kind,remaining:12,readyAt:0});break;}}state.powderResourcesVersion=1;}
    if(!state.catalogueVersion){const kinds=['clay','limestone','copperOre','tinOre','salt','flaxSeed','barley','oats','peas','cabbage','onion','carrot','apple','berry','herb','mushroom','rawFish','wool','milk','egg','honey','bark'];const used=new Set(state.resources.map(r=>r.id));for(const v of VILLAGES)for(let i=0;i<kinds.length;i++){const angle=i*Math.PI*2/kinds.length,x=v.x+Math.cos(angle)*(780+i%3*90),y=v.y+Math.sin(angle)*(780+i%3*90),id=`gatherable-${v.id}-${i}`;if(x<30||y<30||x>WORLD.width-30||y>WORLD.height-30||this.blocks(x,y)||used.has(id)||nearRoad(x,y,100))continue;state.resources.push({id,x,y,kind:kinds[i],remaining:12,readyAt:0});}state.catalogueVersion=1;}
    // Legacy village-ring livestock/fish nodes could appear in arbitrary woodland.
    // Keep node identity and depletion timers; replace only those generated wild nodes.
    if(!state.wildResourceLogicVersion){const wildKinds={milk:'herb',egg:'mushroom',wool:'fiber',rawFish:'berry'};for(const node of state.resources)if(node.id?.startsWith('gatherable-')&&wildKinds[node.kind])node.kind=wildKinds[node.kind];state.wildResourceLogicVersion=1;}

    for(const e of Object.values(state.enemies))equipEnemy(e);state.containers??={};state.companions??={};
    this.progressionBalance=validateBalance(Object.hasOwn(options,'progressionBalance')?options.progressionBalance:state.ruleset==='master-v1'?PLAYTEST_SKILLS:null);
    if(!COMPACT&&state.ruleset==='master-v1'){clearDoorApproaches(state);clearStaticApproaches(state,this.buildings,this.roadGeometry);}
    this.state=state; this.clock=clock;worldTime(state,clock()); this.sessions=new Map();this.serviceBalance=options.serviceBalance||JSON.parse(readFileSync(new URL('./expansion-settings.json',import.meta.url),'utf8'));if(masterEnabled(this)){ensureSocieties(this);ensureCosmetics(this);ensureDungeons(this);ensureCaravans(this);}
  }
  safe(position) {const location=position.interior?buildingById(position.interior,this.buildings):position;return !!location&&(COMPACT?WORLD.safeTowns:masterEnabled(this)?FACTION_TOWNS:WORLD.safeTowns).some(t=>distance(t,location)<=t.radius);}
  join(identity) {
    if(typeof identity!=='string'||!identity.length||identity.length>128||['__proto__','constructor','prototype'].includes(identity)) fail('Invalid identity');
    if(!this.sessions.has(identity)&&this.sessions.size>=WORLD.capacity) fail('World is full');
    if(!this.state.players[identity]) this.state.players[identity]={id:identity,x:512,y:512,hp:100,stamina:100,hunger:100,inventory:{},role:null,roleRequired:true,professions:Object.fromEntries(PROFESSIONS.map(p=>[p,0])),kingdom:null,deadUntil:0,lastAttack:0,receipts:[]};
    const existing=this.state.players[identity];migrateVitals(existing);ensureProgression(existing);if(!existing.interior&&this.blocks(existing.x,existing.y)){Object.assign(existing,MASTER?spawnFor(existing):{x:512,y:512});}
    if(masterEnabled(this)){accountFor(this,existing);ensureCharacterProgression(existing);ensureArmor(existing);existing.skillEffectsEnabled=!!this.progressionBalance;}ensureCompanion(this,existing);this.sessions.set(identity,this.clock());return this.state.players[identity];
  }
  leave(id){dismount(this,this.state.players[id]);this.sessions.delete(id);const pet=this.state.companions[id];if(pet){pet.target=null;pet.active=false;if(pet.mode==='attack')pet.mode='follow';}}
  player(id){const p=this.state.players[id];if(!p||!this.sessions.has(id)) fail('Not connected');return p;}
  canPay(p,needs){return Object.entries(needs).every(([k,n])=>(p.inventory[k]||0)>=n);}
  pay(p,needs){if(!this.canPay(p,needs)) fail('Missing materials');for(const [k,n] of Object.entries(needs)) {p.inventory[k]-=n;if(!p.inventory[k])delete p.inventory[k];}}
  grant(p,items){for(const [k,n] of Object.entries(items)){if(masterEnabled(this)&&(k==='gold'||MASTER&&isCoin(k))){const a=accountFor(this,p);a[k]=addWhole(a[k]||0,n);}else p.inventory[k]=addWhole(p.inventory[k]||0,n);}}
  command(id,command) {
    const p=this.player(id); const coinsBefore=MASTER?wallet(accountFor(this,p)):null; arrange(p); const capacityBefore=backpackCapacity(p),slotsBefore=backpackSlots(p),weightBefore=carryWeight(p); const now=this.clock();if(masterEnabled(this)&&command?.type!=='move')expireCorpses(this);
    if(!command||typeof command.id!=='string'||command.id.length>80||!command.id.length)fail('Action ID required');
    if(p.receipts.includes(command.id)) return {duplicate:true,revision:this.state.revision};
    if(masterEnabled(this)&&p.creationRequired&&command.type!=='createCharacter'&&!(p.legacyCharacter&&command.type==='respawn'))fail('Complete character creation first');
    if(masterEnabled(this)&&command.type==='chooseRole')fail('Use permanent character creation');
    if(p.roleRequired&&command.type!=='createCharacter'&&command.type!=='chooseRole'&&command.type!=='respawn')fail('Choose your permanent role first');
    if(p.hp<=0 && command.type!=='respawn') fail('You are dead');
    if(p.interior&&!String(command.type).startsWith('clan')&&!['contractClaim','legendaryStart','legendaryClaim','characterUnlock','characterSwitch','openService','companionFollow','friendInvite','friendAccept','friendDecline','friendRemove','closeService','learnMastery','reclaimMastery','repairArmor','companionLearnSkill','learnSkill','reclaimSkills','move','exit','craft','eat','attack','loot','respawn','equipShield','block','dodge','research','use','interact','packItem','take','takeEquip','drop','deposit','closeContainer','openContainer','chooseRole','unequip','companionAttack','companionRetreat','companionStay','ride','hotbar','merchantBuy','merchantSell','closeMerchant','houseDeedBuy','houseDeedRedeem','bankUpgrade','bankOpen','bankDeposit','bankWithdraw','cosmeticGift','cosmeticEquip','shopBuy','cosmeticList','cosmeticCancel','cosmeticBuy'].includes(command.type))fail('Leave the building to do that');
    if(p.mounted&&['attack','gather','harvest','block','dodge'].includes(command.type))fail('Dismount to fight or harvest');
    // All commands are synchronous. Validation precedes mutations; durable store wraps this in a transaction.
    switch(command.type){
      case 'houseDeedBuy':case 'houseDeedRedeem':if(!masterEnabled(this))fail('Account system unavailable');deedCommand(this,p,command);break;
      case 'housingPreview':case 'housingConfirm':case 'housingCancel':housingCommand(this,p,command);break;
      case 'packItem': placeItem(p,command);break;
      case 'characterSwitch': case 'characterUnlock':characterMasterCommand(this,p,command);break;
      case 'siegeDeploy':deploySiege(this,p,command);break;
      case 'siegeFire':fireSiege(this,p,command);break;
      case 'repairStructure':repairStructure(this,p,command);break;
      case 'caravanEscort':caravanCommand(this,p,command);break;
      case 'legendaryStart':case 'legendaryClaim':legendaryCommand(this,p,command);break;
      case 'contractClaim': claimContract(this,p,command);break;
      case 'friendInvite': case 'friendAccept': case 'friendDecline': case 'friendRemove': friendsCommand(this,p,command);break;
      case 'settlementPrepare': case 'settlementConfirm': case 'settlementPlace': case 'settlementRestore': settlementCommand(this,p,command);break;
      case 'openService': openService(this,p,command.target);break;
      case 'closeService':p.openService=null;break;
      case 'companionLearnSkill': {if(!masterEnabled(this))fail('Companion progression unavailable');const pet=ensureCompanion(this,p);if(!pet)fail('No companion');trainCompanion(pet,command);ensureCompanion(this,p);break;}
      case 'learnMastery': case 'reclaimMastery': if(!masterEnabled(this))fail('Mastery unavailable');masteryCommand(p,command);break;
      case 'repairArmor': if(!masterEnabled(this))fail('Repair unavailable');repairArmor(this,p,command.item);break;
      case 'learnSkill': case 'reclaimSkills': if(!masterEnabled(this))fail('Character progression unavailable');progressionCommand(p,command,this.progressionBalance);p.hp=Math.min(p.hp,maxHealth(p));p.stamina=Math.min(p.stamina,(maxStamina(p)*(1-burden(p)*.5)));break;
      case 'clanCreate': case 'clanInvite': case 'clanAccept': case 'clanDecline': case 'clanRank': case 'clanPermission': case 'clanSettings': case 'clanKick': case 'clanLeave': case 'clanTransfer': clanCommand(this,p,command);break;
      case 'createCharacter': if(!masterEnabled(this))fail('Update the development server for character creation');createCharacter(this,p,command);break;
      case 'merchantBuy': case 'merchantSell': trade(this,p,command);break;
      case 'closeMerchant': p.openMerchant=null;break;
      case 'cosmeticGift':case 'cosmeticEquip':case 'shopBuy': case 'cosmeticList': case 'cosmeticCancel': case 'cosmeticBuy': if(!masterEnabled(this))fail('Shop unavailable');shopCommand(this,p,command);break;
      case 'clanBankOpen':case 'clanBankDeposit':case 'clanBankWithdraw':case 'bankUpgrade':case 'bankOpen': case 'bankDeposit': case 'bankWithdraw': if(!masterEnabled(this))fail('Account system unavailable');bankCommand(this,p,command);break;
      case 'chooseRole': chooseRole(this,p,command.role);ensureCompanion(this,p);break;
      case 'ride': rideCompanion(this,p);break;
      case 'companionAttack': case 'companionRetreat': case 'companionFollow': case 'companionStay': commandCompanion(this,p,command);break;
      case 'hotbar': {const [slotText,item,...extra]=String(command.binding||'').split(':');const slot=Number(slotText);if(extra.length||!/^([0-4])$/.test(slotText)||item===undefined||item!==''&&(!(Object.hasOwn(ITEMS,item)||(masterEnabled(this)&&Object.hasOwn(ACCOUNT_ITEMS,item)))||!(p.inventory[item]>0)))fail('Hotbar needs slot 1–5 and an owned item');p.hotbar=Array.from({length:5},(_,i)=>typeof p.hotbar?.[i]==='string'?p.hotbar[i]:'');p.hotbar[slot]=item;break;}
      case 'drop':dropItem(this,p,command);break;
      case 'openContainer': openContainer(this,p,command.target);break;
      case 'unequip': if(command.slot==='backpack')p.equippedBackpack=null;else if(p.armorSlots&&['head','body','helmet','chest','gloves','leggings','boots'].includes(command.slot)){delete p.armorSlots[({head:'helmet',body:'chest'})[command.slot]||command.slot];syncArmor(p);}else if(command.slot==='hands')p.equippedWeapon='unarmed';else if(command.slot==='head')p.equippedHelmet=null;else if(command.slot==='body')p.equippedArmour=null;else if(command.slot==='shield'){p.equippedShield=false;p.blockUntil=0;}else fail('Unknown equipment slot');break;
      case 'interact': interact(this,p);break;
      case 'take': transferContainer(this,p,command,false);break;
      case 'deposit': transferContainer(this,p,command,true);break;
      case 'closeContainer': {const c=this.state.corpses[p.openContainer];if(c&&!Object.keys(c.items).length)delete this.state.corpses[p.openContainer];p.openContainer=null;break;}
      case 'research': learn(p,command.tech);break;
      case 'takeEquip': {
        const gear=ITEMS[command.item];if(!gear||!(gear.armorSlot||gear.backpackSlots||gear.damage||gear.handheld||command.item==='shield'))fail('Choose equipment');
        transferContainer(this,p,{...command,target:p.openContainer,amount:1},false);
        // Continue into the normal equipment rules within the same transaction.
      }
      case 'use': {const item=ITEMS[command.item];if(!item||!(p.inventory[command.item]>0))fail('Item is not in your backpack');
       if(item.backpackSlots){p.equippedBackpack=command.item;}
       else if(item.siegeEngine){deploySiege(this,p,{item:command.item});}
       else if(item.blackpowderAmmo){p.selectedAmmo=command.item;}
       else if(item.nutrition!==undefined){this.pay(p,{[command.item]:1});p.hunger=Math.min(100,p.hunger+(item.nutrition||0)*(1+skillRank(p,'preservation')*.02));p.thirst=Math.max(0,Math.min(100,p.thirst+(item.hydration||0)));}
       else if(command.item==='shield'){p.equippedShield=command.type==='takeEquip'?true:!p.equippedShield;p.blockUntil=0;}
       else if(item.damage||item.handheld){p.equippedWeapon=command.item;}
       else if(item.armour&&masterEnabled(this)){if(command.type!=='takeEquip'||p.armorSlots?.[item.armorSlot]!==command.item)equipArmor(p,command.item);}
       else if(item.armour){if(command.item==='helmet')p.equippedHelmet=p.equippedHelmet?null:'helmet';else p.equippedArmour=p.equippedArmour===command.item?null:command.item;}
       else if(command.item==='bandage'){if(p.hp>=maxHealth(p))fail('Already at full health');this.pay(p,{bandage:1});p.hp=Math.min(maxHealth(p),p.hp+20);}
       else if(command.item==='torch'){this.pay(p,{torch:1});p.torchUntil=now+300000;}
       else if(command.item==='waterskin'){if(p.interior||!VILLAGES.some(v=>distance(p,v)<100))fail('Fill the waterskin at a village well');p.inventory.water=Math.min(20,(p.inventory.water||0)+5);}
       else fail('This is an ingredient or a passive tool');break;}
      case 'equipShield': if(command.enabled&&!(p.inventory.shield>0))fail('No shield in backpack');p.equippedShield=command.enabled===true;p.blockUntil=0;break;
      case 'block': block(p,command.enabled===true,now);break;
      case 'dodge': {const room=roomFor(p.interior);dodge(p,command,now,room?((x,y)=>roomBlocked(room,x,y)):((x,y)=>this.blocks(x,y)||(masterEnabled(this)&&!canEnter(this,p,{x,y}))),room||WORLD);break;}
      case 'enter': canEnterHome(this,p,command.target);if(!this.buildings.some(b=>b.id===command.target))fail('Building unavailable');if(masterEnabled(this)&&!canEnter(this,p,{interior:command.target}))fail('That town belongs to the other faction');enterRoom(p,command.target,this.buildings);if(masterEnabled(this))discoverContract(p);break;
      case 'exit': exitRoom(p,this.buildings);break;
      case 'move': {
        if(!finite(command.dx)||!finite(command.dy)||!finite(command.dt)||command.dt<=0||command.dt>0.25)fail('Invalid movement');
        const elapsed=Math.max(0,Math.min(.25,(now-(p.lastMove??now-100))/1000));
        const dt=Math.min(elapsed,command.dt); const length=Math.hypot(command.dx,command.dy); if(command.blocking===true)block(p,true,now);const sprint=command.sprint===true&&p.stamina>2&&!(p.blockUntil>now);const mount=p.mounted&&this.state.companions[p.id]?.kind==='horse'&&this.state.companions[p.id].hp>0;const speed=(mount?(sprint?310:220):p.blockUntil>now?65:sprint?180:110)*(p.slowUntil>now?.65:1)*(1-armorPenalty(p));if(sprint)p.stamina=Math.max(0,p.stamina-9*dt*(1+armorPenalty(p)*2)*(1+burden(p)*2));
        const nx=Math.max(0,Math.min(WORLD.width,p.x+command.dx/Math.max(1,length)*speed*dt));
        const ny=Math.max(0,Math.min(WORLD.height,p.y+command.dy/Math.max(1,length)*speed*dt));
        const room=roomFor(p.interior);const blocked=room?((x,y)=>roomBlocked(room,x,y)):((x,y)=>this.blocks(x,y)||(masterEnabled(this)&&!canEnter(this,p,{x,y})));
        const steps=Math.max(1,Math.ceil(Math.hypot(nx-p.x,ny-p.y)/6)),sx=(nx-p.x)/steps,sy=(ny-p.y)/steps;for(let i=0;i<steps;i++){if(!blocked(p.x+sx,p.y))p.x+=sx;if(!blocked(p.x,p.y+sy))p.y+=sy;}if(mount){const horse=this.state.companions[p.id];horse.facingDX=command.dx;horse.facingDY=command.dy;horse.x=p.x;horse.y=p.y;}p.lastMove=now;break;
      }
      case 'gather': {
        const node=this.state.resources.find(r=>r.id===command.target);
        if(!node||distance(p,node)>120)fail('Move closer to the resource trunk or base (120 units)');
        if(now-(p.lastGather||0)<700)fail('Gather cooldown');
        if(node.remaining<=0) {if(now<node.readyAt)fail('Resource depleted');node.remaining=12;}
        const harvestTool=checkHarvestTool(p,node);if(command.toolOnly===true&&!harvestTool)fail('Use INTERACT or HARVEST to pick up loose materials by hand');
        node.remaining--;if(!node.remaining)node.readyAt=now+300000;
        const mineral=['sulfur','saltpetre','leadOre','stone','ironOre','copperOre','tinOre','clay','limestone','salt'].includes(node.kind);const amount=node.loose?1:node.kind==='wood'?5+skillRank(p,'timberYield'):node.kind==='stone'||node.kind==='fiber'?3:mineral&&harvestTool==='pickaxe'?2:1;this.grant(p,{[node.kind]:amount});node.lastHarvestAt=now;p.harvestResult={id:command.id,at:now,x:node.x,y:node.y,interior:p.interior||null,items:{[node.kind]:amount}};p.professions[node.kind==='wood'?'woodcraft':mineral?'mining':'farming']++;p.lastGather=now;p.gatherDX=node.x-p.x;p.gatherDY=node.y-p.y;p.gatherTool=harvestTool||'';if(masterEnabled(this)){awardXp(p,EXPERIENCE.gather,this.progressionBalance);contractProgress(p,node.kind,amount);contractProgress(p,'profession:'+(node.kind==='wood'?'woodcraft':mineral?'mining':'farming'));}break;
      }
      case 'craft': {
        const recipe=RECIPES[command.recipe];if(!recipe)fail('Unknown recipe');
        ensureProgression(p);if(recipe.tech&&!p.learnedTech.includes(recipe.tech))fail('Research '+recipe.tech+' first');if(p.professions[recipe.profession]<recipe.level)fail('Profession level too low');
        if(recipe.station&&!stationInRoom(p,recipe.station)&&!Object.values(this.state.structures).some(s=>!p.interior&&s.kind===recipe.station&&distance(s,p)<100&&this.owns(p,s)&&privateStationActive(this,p,s)))fail('Required station unavailable');
        payCraft(this,p,recipe);this.grant(p,recipe.output);p.professions[recipe.profession]++;if(masterEnabled(this)){awardXp(p,Math.floor(EXPERIENCE.craft*(1+skillRank(p,'forgePractice')*.05)),this.progressionBalance);contractProgress(p,'craft');contractProgress(p,'crafted:'+command.recipe);contractProgress(p,'profession:'+recipe.profession);}break;
      }
      case 'kingdom': {
        if(masterEnabled(this))fail('Clan creation is awaiting the settlement migration stage');
        if(p.kingdom)fail('Already in a kingdom');
        const name=String(command.name||'').trim();if(!/^[\p{L}\p{N} '-]{3,32}$/u.test(name))fail('Kingdom name must be 3–32 characters');
        if(Object.values(this.state.kingdoms).some(k=>k.name.toLowerCase()===name.toLowerCase()))fail('Kingdom name taken');
        const key=randomUUID();this.state.kingdoms[key]={id:key,name,leader:id,members:[id]};p.kingdom=key;break;
      }
      case 'claim': {
        if(masterEnabled(this))fail('Permanent settlement ownership migration is not ready');
        if(!p.kingdom)fail('Join a kingdom first');if(this.safe(p))fail('Safe towns cannot be claimed');
        const key=`${Math.floor(p.x/256)},${Math.floor(p.y/256)}`;
        if(this.state.claims[key])fail('Territory already owned');
        // Blocks an entire claim if any part intersects a safe town.
        const [cx,cy]=key.split(',').map(Number);
        if(WORLD.safeTowns.some(t=>Math.hypot(t.x-Math.max(cx*256,Math.min(t.x,(cx+1)*256)),t.y-Math.max(cy*256,Math.min(t.y,(cy+1)*256)))<=t.radius))fail('Too close to a safe town');
        this.pay(p,{wood:20,stone:20});this.state.claims[key]={kingdom:p.kingdom,createdAt:now};break;
      }
      case 'build': {
        if(masterEnabled(this)){buildSettlement(this,p,command);break;}
        const definition=BUILDINGS[command.kind];if(!definition)fail('Unknown structure');
        if(!finite(command.x)||!finite(command.y))fail('Invalid placement');
        const pos={x:command.x,y:command.y};if(distance(pos,p)>100||pos.x<0||pos.y<0||pos.x>WORLD.width||pos.y>WORLD.height||this.safe(pos))fail('Invalid placement');
        const claim=this.state.claims[`${Math.floor(pos.x/256)},${Math.floor(pos.y/256)}`];
        if(!claim||claim.kingdom!==p.kingdom)fail('Build on your kingdom territory');
        if(Object.values(this.state.structures).some(s=>distance(s,pos)<40))fail('Placement occupied');
        this.pay(p,definition.needs);const key=randomUUID();this.state.structures[key]={id:key,kind:command.kind,...pos,hp:Math.round(definition.hp*(p.inventory.hammer>0?1.1:1)),owner:id,kingdom:p.kingdom};break;
      }
      case 'plant': {
        const farm=this.state.structures[command.target];if(!farm||farm.kind!=='farm'||!this.owns(p,farm)||distance(p,farm)>100)fail('Farm unavailable');if(farm.crop)fail('Already planted');
        const crop=command.crop||'wheat';const seeds={wheat:'seed',flax:'flaxSeed',barley:'barley',oats:'oats',peas:'peas',carrot:'carrot',cabbage:'cabbage'};if(!seeds[crop])fail('Unknown crop');this.pay(p,{[seeds[crop]]:1});farm.crop={kind:crop,readyAt:now+600000};break;
      }
      case 'harvest': {
        const farm=this.state.structures[command.target];if(!farm||!this.owns(p,farm)||distance(p,farm)>100||!farm.crop||now<farm.crop.readyAt)fail('Crop not ready');
        checkHarvestTool(p,{kind:'fiber'});const crop=farm.crop.kind||'wheat',bonus=1+skillRank(p,'cropYield');this.grant(p,crop==='wheat'?{wheat:3+bonus,seed:2}:crop==='flax'?{fiber:4+bonus,flaxSeed:2}:{[crop]:4+bonus});delete farm.crop;p.professions.farming++;p.lastGather=now;p.gatherDX=farm.x-p.x;p.gatherDY=farm.y-p.y;p.gatherTool='sickle';p.harvestResult={id:command.id,at:now,x:farm.x,y:farm.y,interior:null,items:crop==='wheat'?{wheat:3+bonus,seed:2}:crop==='flax'?{fiber:4+bonus,flaxSeed:2}:{[crop]:4+bonus}};if(masterEnabled(this)){awardXp(p,EXPERIENCE.harvest,this.progressionBalance);contractProgress(p,'harvest');contractProgress(p,'profession:farming');}break;
      }
      case 'attack': {
        if(masterEnabled(this)&&caravanTarget(this,command.target)){attackCaravan(this,p,command);break;}
        if(masterEnabled(this)&&structureTarget(this,command.target)){attackStructure(this,p,command);break;}
        if(p.blockUntil>now||p.dodgeUntil>now)fail('Release block or finish dodge before attacking');
        const enemy=this.state.enemies[command.target];const pet=findCompanion(this,command.target);const victim=enemy||this.state.players[command.target]||pet;const weapon=ITEMS[command.weapon];
        if(victim&&this.state.players[victim.id]===victim&&!this.sessions.has(victim.id))fail('Player is offline');
        if(victim&&clanFriendlyFireBlocked(this,p,pet?this.state.players[pet.owner]||pet:victim))fail('Clan friendly fire is disabled');
        if(!weapon?.damage||!p.inventory[command.weapon])fail('Weapon unavailable');
        if(pet&&(pet.owner===p.id||!this.sessions.has(pet.owner)))fail('Companion protected');
        if(!victim||(victim.interior||null)!==(p.interior||null)||victim===p||victim.hp<=0||this.safe(p)||this.safe(victim))fail('Target protected or unavailable');
        if(weapon.siegeEngine)fail('Deploy and operate siege equipment from settlement services');if(weapon.blackpowder&&p.equippedWeapon!==command.weapon)fail('Equip your firearm first');if(distance(p,victim)>weapon.range)fail('Target out of reach');weaponReady(p,weapon,now);
        const strikeRoom=roomFor(p.interior);if(!clearStrike(p,victim,strikeRoom?((x,y)=>roomBlocked(strikeRoom,x,y)):this.blocks))fail('Target blocked by an obstacle');
        const damageType=spendAttack(this,p,weapon,now);if(!shotHits(weapon,distance(p,victim))){recordHit(p,{...victim},command.weapon,0,now);p.lastShotMissed=true;break;}p.lastShotMissed=false;
        if(masterEnabled(this)&&!enemy)revokeRepairProtection(this,p);if(enemy?.caravanId){const convoy=caravanTarget(this,enemy.caravanId);if(convoy)noteCaravanAttack(this,p,convoy);}if(enemy){enemy.aggro=p.id;enemy.aggroUntil=now+15000;}const damage=ammoDamage(damageType,weaponDamage(p,weapon));recordHit(p,victim,command.weapon,pet?companionDamage(pet,damage):defend(victim,damage,now,['hammer','mace','founderHammer'].includes(command.weapon)?'blunt':damageType==='explosive'?'blunt':damageType),now);applyBattleEffect(this,p,victim,damageType);if(victim.hp===0){if(enemy){killEnemy(this,enemy,now);if(masterEnabled(this)){awardXp(p,EXPERIENCE.enemy,this.progressionBalance);contractKill(p,enemy);}}else if(pet)downCompanion(this,pet);else this.die(victim,now);}break;
      }
      case 'loot': {
        // Legacy loot requests must use the same reachability and town ownership
        // checks as the inventory UI; otherwise dropped deeds could be stolen in banks.
        openContainer(this,p,command.target);transferContainer(this,p,{target:command.target,item:'all'},false);break;
      }
      case 'drink': if(p.interior||!VILLAGES.some(t=>distance(t,p)<100))fail('Drink at a town well in the central square');p.thirst=Math.min(100,p.thirst+40);break;
      case 'eat': this.pay(p,{bread:1});p.hunger=Math.min(100,p.hunger+30);break;
      case 'respawn': if(p.hp>0||now<p.deadUntil)fail('Respawn not ready');p.interior=null;Object.assign(p,masterEnabled(this)?spawnFor(p):{x:512,y:512});p.hp=maxHealth(p);p.stamina=(maxStamina(p)*(1-burden(p)*.5));p.hunger=100;p.thirst=100;p.temperature=50;p.deadUntil=0;p.slowUntil=0;respawnKit(this,p);if(masterEnabled(this)){delete p.armorSlots;ensureArmor(p);}resetCompanion(this,p);if(this.state.companions[p.id])this.state.companions[p.id].mode='follow';break;
      default:fail('Unknown action');
    }
    if(p.mounted&&p.interior)dismount(this,p);
    if(MASTER)validatePouch(accountFor(this,p),coinsBefore);checkBackpack(slotsBefore,p,capacityBefore);checkWeight(weightBefore,p);p.stamina=Math.min(p.stamina,(maxStamina(p)*(1-burden(p)*.5)));
    p.receipts.push(command.id);if(p.receipts.length>256)p.receipts.shift();
    this.sessions.set(id,now);this.state.revision++;return {revision:this.state.revision};
  }
  owns(p,s){if(masterEnabled(this)){const owned=settlementOwnsStructure(this,p,s);if(owned!==null)return owned;}return s.owner===p.id||(p.kingdom&&s.kingdom===p.kingdom);}
  die(p,now){if(masterEnabled(this)){const a=accountFor(this,p);for(const coin of MASTER?['copper','silver','gold']:['gold'])if(a[coin]){p.inventory[coin]=addWhole(p.inventory[coin]||0,a[coin]);a[coin]=0;}}const key=randomUUID();this.state.corpses[key]={id:key,x:p.x,y:p.y,items:p.inventory,armorCondition:{...p.armorCondition},interior:p.interior||null,owner:p.id,createdAt:now};p.inventory={};p.equippedBackpack=null;if(masterEnabled(this)){p.armorSlots={};p.armorCondition={};}p.openContainer=null;p.equippedShield=false;p.blockUntil=0;p.dodgeUntil=0;p.deadUntil=now+5000;resetCompanion(this,p);}
  tick(dt){if(masterEnabled(this))expireCorpses(this);dt=Math.max(0,Math.min(1,dt));for(const [id,last] of this.sessions){if(this.clock()-last>30000){this.leave(id);continue;}const p=this.state.players[id];if(p.hp>0&&!p.roleRequired){tickSurvival(this,p,dt);p.stamina=Math.min((maxStamina(p)*(1-burden(p)*.5)),p.stamina+dt*(p.hunger>0&&p.thirst>0?8:2)*(1-burden(p)*.75));}}tickCompanions(this,dt);tickEnemies(this,dt);if(masterEnabled(this)){tickSocieties(this,dt);tickDungeons(this,dt);tickSettlements(this);tickSieges(this);tickCaravans(this,dt);tickRegionalProduction(this);tickBattleEffects(this);}this.state.time+=dt;}
  snapshot(id,includeMap=true){const p=this.player(id);if(MASTER){ensureMasterResources(this.state,p,this.buildings);ensureMasterEncounters(this,p);}const view=visibility(this.state,p);const nearby=values=>Object.values(values).filter(v=>(v.interior||null)===(p.interior||null)&&distance(p,v)<900);return {release:RELEASE_INFO,...(masterEnabled(this)?{ruleset:'master-v1',services:serviceViews(this,p),openService:p.openService||null,progression:progressionView(p,this.progressionBalance),armorMastery:masteryView(p),companionProgression:companionProgressionView(this.state.companions[p.id]),account:accountView(this,p),clans:clanView(this,p),shop:shopView(this),characterCreation:{appearances:APPEARANCES,factions:['survivor','bandit'],professions:INITIAL_PROFESSIONS}}:{}),...(HOUSING?{housing:housingView(this,p),mapBuildings:this.buildings.map(({id,name,kind,x,y,halfWidth,depth,shop})=>({id,name,kind,x,y,halfWidth,depth,shop}))}:{}),serverTime:this.clock(),gameTime:worldTime(this.state,this.clock()),visibility:view,revision:this.state.revision,you:{...structuredClone(p),...(MASTER?{coinPouch:wallet(accountFor(this,p))}:{}),backpackGrid:arrange(p),backpackCapacity:backpackCapacity(p),carryWeight:carryWeight(p),carryLimit:50,burden:burden(p),cosmetic:equippedCosmetic(this,p.id),maxHp:maxHealth(p),maxStamina:(maxStamina(p)*(1-burden(p)*.5)),clanBadge:clanBadge(this,p),mountId:p.mounted?this.state.companions[p.id]?.id:null,knowledge:knowledge(p)},craftingStorage:craftingStorageView(this,p),stationsAvailable:Object.keys(BUILDINGS).filter(kind=>stationInRoom(p,kind)||(!p.interior&&Object.values(this.state.structures).some(s=>s.kind===kind&&distance(s,p)<100&&this.owns(p,s)&&privateStationActive(this,p,s)))),room:roomFor(p.interior),worldProfile:MASTER?'master-reference':COMPACT?'day2-compact':'full',worldSize:{width:WORLD.width,height:WORLD.height},clientBuild:35,merchants:[...merchantActors(this,p),...serviceActors(this,p)].filter(a=>inSight(p,a)),openMerchant:merchantView(this,p),companion:companionView(this.state.companions[id],id),companions:nearby(this.state.companions).filter(c=>this.sessions.has(c.owner)&&c.hp>0&&inSight(p,c)).map(c=>({...companionView(c,id),cosmetic:equippedCosmetic(this,c.owner,"companion")})),nearbyContainers:nearbyContainers(this,p),openContainer:containerView(this,p),...(includeMap?{mapExplored:Object.keys(this.state.exploration?.[p.characterId||p.id]||{}),roles:(masterEnabled(this)?ROLES.filter(r=>INITIAL_PROFESSIONS.includes(r.id)):ROLES).map(r=>({...r,companion:masterEnabled(this)&&r.id==='farmer'?COMPANIONS.soldier:COMPANIONS[r.id]})),worldMap:{...worldMap,castleWalls:CASTLE_WALLS,roads:this.roadGeometry.ROADS.filter(r=>r.kind==='road'),paths:this.roadGeometry.ROADS.filter(r=>r.kind==='path')},mapBuildings:this.buildings.map(({id,name,kind,x,y,halfWidth,depth,shop})=>({id,name,kind,x,y,halfWidth,depth,shop:shop||civicLabel(id)||(masterEnabled(this)?merchantForBuilding(id)?.shop:null)}))}:{}),yards:p.interior?[]:[...localYards(this.yards,p,this.state),...localCastleWalls(p)],...(MASTER?{terrainPolygons:p.interior?[]:localMasterPolygons(p)}:{}),terrain:p.interior?[]:localTerrain(p),roads:p.interior?[]:this.roadGeometry.localRoads(p),streams:p.interior?[]:STREAMS,fountains:nearbyFountains(p),settlements:p.interior?[]:nearby(VILLAGES),outsidePosition:p.interior?this.buildings.find(b=>b.id===p.interior.replace(/:(?:dungeon|basement)$/,'')):null,protected:this.safe(p),towns:p.interior?[]:(COMPACT?WORLD.safeTowns:masterEnabled(this)?FACTION_TOWNS:WORLD.safeTowns),village:p.interior?[]:staticNearby(this.buildings,p).map(b=>({...b,...buildingPresentation(b),shop:b.shop||civicLabel(b.id)||(masterEnabled(this)?merchantForBuilding(b.id)?.shop:null)})),enemies:nearby(this.state.enemies).filter(e=>e.hp>0&&inSight(p,e)).map(({id,kind,x,y,hp,maxHp,active,lastAttack,equippedWeapon,equippedShield,equippedArmour,attackDX,attackDY,attackWeapon,lastHitAt,lastHitDamage,societyId,rank,travelLabel})=>({id,kind,x,y,hp,maxHp,active,lastAttack,equippedWeapon,equippedShield,equippedArmour,attackDX,attackDY,attackWeapon,lastHitAt,lastHitDamage,travelLabel,clanBadge:societyId?npcBadge(this,{societyId,rank}):null})),players:nearby(this.state.players).filter(v=>v.id!==id&&inSight(p,v)).map(v=>({id:v.id,appearance:v.appearance,blockUntil:v.blockUntil,armorSlots:{...(v.armorSlots||{})},equippedHelmet:v.equippedHelmet,equippedArmour:v.equippedArmour,cosmetic:equippedCosmetic(this,v.id),clanBadge:clanBadge(this,v),x:v.x,y:v.y,hp:v.hp,kingdom:v.kingdom,mounted:!!v.mounted,mountId:v.mounted?this.state.companions[v.id]?.id:null,lastAttack:v.lastAttack,attackDX:v.attackDX,attackDY:v.attackDY,attackWeapon:v.attackWeapon,equippedWeapon:v.equippedWeapon,equippedShield:v.equippedShield,lastHitAt:v.lastHitAt,lastHitDamage:v.lastHitDamage,lastGather:v.lastGather,gatherDX:v.gatherDX,gatherDY:v.gatherDY,gatherTool:v.gatherTool})),resources:staticNearby(this.state.resources,p).filter(r=>!this.blocks(r.x,r.y)).map(r=>({...r,requiredTool:requiredTool(r),depleted:r.remaining<=0&&this.clock()<r.readyAt})),structures:[...caravanActors(this,p).filter(a=>inSight(p,a)),...nearby(this.state.structures).map(({items,...s})=>({...s,targetGroup:"structures",yours:this.owns(p,s)})),...nearby(this.state.settlements||{}).filter(s=>s.flagActive&&!s.abandonedAt).map(s=>({id:s.id,kind:'flag',targetGroup:'structures',x:s.x,y:s.y,hp:s.flagHp,maxHp:500,yours:s.owner===p.id||s.owner===this.state.accounts?.[p.id]?.clanId})),...nearby(this.state.npcSettlements||{}).map(s=>({id:s.id,kind:'npcCamp',targetGroup:'structures',x:s.x,y:s.y,hp:s.hp,maxHp:s.maxHp}))],corpses:nearby(this.state.corpses).map(({items,...c})=>c),claims:this.state.claims,kingdoms:Object.values(this.state.kingdoms).map(({id,name})=>({id,name}))};}
}






