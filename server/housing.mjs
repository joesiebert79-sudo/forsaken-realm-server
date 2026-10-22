import {canAfford,debitCoins} from './currency.mjs';
import {randomUUID} from 'node:crypto';
import {carriedDeed} from './house-deeds.mjs';

// Staged Day 4 domain service. No global registration or live-world mutation.
// Catalogue and map eligibility are supplied only after owner approval.
const fail=message=>{throw Error(message);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const active=p=>!p.abandonedAt;
export function housingController(state,player){
 const account=state.accounts?.[player.id];if(!account)fail('Account unavailable');
 const clan=account.clanId&&state.clans?.[account.clanId];
 if(account.clanId&&!clan)fail('Clan unavailable');
 if(clan&&clan.leader!==player.id)fail('Only the clan leader can purchase property');
 return {account,ownerType:clan?'clan':'account',owner:clan?clan.id:player.id,clan};
}
export function ownedHousing(state,player){
 const account=state.accounts?.[player.id];
 return Object.values(state.properties||{}).find(p=>active(p)&&
  (p.ownerType==='account'&&p.owner===player.id||p.ownerType==='clan'&&p.owner===account?.clanId))||null;
}
function available(state,player,now){
 const c=housingController(state,player);
 if(player.hp<=0||player.interior)fail('Approach the property outdoors while alive');
 if(ownedHousing(state,player)||Object.values(state.settlements||{}).some(s=>active(s)&&
  (s.ownerType==='account'&&s.owner===player.id||s.ownerType==='clan'&&s.owner===c.clan?.id)))fail('One property or settlement per player or clan');
 if(c.account.settlementId||c.clan?.settlementId)fail('Resolve your existing settlement before buying a home');
 if(Math.max(c.account.relocationLockedUntil||0,c.clan?.relocationLockedUntil||0)>now)fail('Your existing relocation lock is active');
 return c;
}
export function footprint(design,position,rotation){
 if(![0,90,180,270].includes(rotation))fail('Choose a quarter-turn orientation');
 const w=rotation%180?design.depth:design.width,h=rotation%180?design.width:design.depth;
 return {left:position.x-w/2,right:position.x+w/2,top:position.y-h/2,bottom:position.y+h/2};
}
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function segmentHits(a,b,box){
 let lo=0,hi=1;
 for(const [start,delta,min,max] of [[a.x,b.x-a.x,box.left,box.right],[a.y,b.y-a.y,box.top,box.bottom]]){
  if(delta===0){if(start<min||start>max)return false;continue;}
  let t0=(min-start)/delta,t1=(max-start)/delta;if(t0>t1)[t0,t1]=[t1,t0];
  lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;
 }
 return true;
}
// Reserve the approved final compound size when a catalogue provides it.
// Existing homes without a reservation keep their established footprint.
export function reservedFootprint(design,position,rotation){
 const width=design.reservedWidth??design.width,depth=design.reservedDepth??design.depth;
 if(!Number.isFinite(width)||!Number.isFinite(depth)||width<design.width||depth<design.depth)fail('Invalid compound reservation');
 return footprint({...design,width,depth},position,rotation);
}
export function validateHousingPlacement(design,position,rotation,world){
 if(!Number.isFinite(position.x)||!Number.isFinite(position.y))fail('Invalid position');
 const box=reservedFootprint(design,position,rotation),pad=24;
 const clear={left:box.left-pad,right:box.right+pad,top:box.top-pad,bottom:box.bottom+pad};
 if(clear.left<0||clear.top<0||clear.right>world.width||clear.bottom>world.height)fail('Outside world boundary');
 if((world.occupied||[]).some(b=>overlap(clear,b)))fail('Property or building overlaps this site');
 for(const zone of world.protected||[]){const x=Math.max(clear.left,Math.min(zone.x,clear.right)),y=Math.max(clear.top,Math.min(zone.y,clear.bottom));if(Math.hypot(x-zone.x,y-zone.y)<=zone.radius)fail('Protected town land cannot be purchased');}
 for(const road of [...world.roads||[],...world.streams||[]]){
  const margin=(road.width||0)/2,expanded={left:clear.left-margin,right:clear.right+margin,top:clear.top-margin,bottom:clear.bottom+margin};
  for(let i=1;i<road.points.length;i++)if(segmentHits(road.points[i-1],road.points[i],expanded))fail('Keep roads and waterways clear');
 }
 // Caller supplies authoritative terrain and claim tests for the entire rectangle,
 // not just the centre, so narrow obstacles cannot be skipped by a sampling grid.
 if(typeof world.validLand!=='function'||!world.validLand(clear))fail('Unsuitable terrain or territory');
 return box;
}
function designFor(catalogue,id){
 const d=catalogue.find(d=>d.id===id);
 if(!d||!Number.isSafeInteger(d.price)||d.price<=0||!Number.isFinite(d.width)||d.width<=0||!Number.isFinite(d.depth)||d.depth<=0||!Number.isSafeInteger(d.tier)||d.tier<1||d.tier>5)fail('Approved house design unavailable');
 return d;
}
export function prepareHousing(state,player,request,{catalogue,world,payment,now=Date.now(),nonce=randomUUID}={}){
 const {account,owner,ownerType}=available(state,player,now),d=designFor(catalogue,request.design);
 let position,rotation=request.rotation??0,target=null;
 if(request.target){
  const house=world.vacant?.find(h=>h.id===request.target&&h.status==='vacant'&&h.design===d.id);
  if(!house||Object.values(state.properties||{}).some(p=>active(p)&&p.buildingId===house.id))fail('House is not for sale');
  if(distance(player,house.door)>100)fail('Approach the property sign');
  position={x:house.x,y:house.y};rotation=house.rotation||0;target=house.id;
 }else{
  position={x:request.x,y:request.y};if(distance(player,position)>250)fail('Choose a nearby building site');
  validateHousingPlacement(d,position,rotation,world);
 }
 const deed=payment==='deed'?carriedDeed(state,player,d.id,request.deed):null;
 if(payment==='deed'&&!deed)fail('Carry a matching unused '+d.name+' house deed from the banker');
 if(payment!=='deed'&&!canAfford(account,d.price))fail('Not enough gold');
 const proposal={nonce:nonce(),payment:payment||'gold',deed:deed?.id||null,owner,ownerType,design:d.id,tier:d.tier,price:d.price,width:d.width,depth:d.depth,...position,rotation,target,reservedWidth:d.reservedWidth??d.width,reservedDepth:d.reservedDepth??d.depth,expiresAt:now+120000};
 // Preview is an account-local ephemeral proposal; no gold or land is reserved.
 account.housingProposal=proposal;return structuredClone(proposal);
}
export function confirmHousing(state,player,token,options){
 const now=options.now??Date.now(),c=available(state,player,now),q=c.account.housingProposal;
 if(!q||q.nonce!==token||q.expiresAt<=now||q.owner!==c.owner||q.ownerType!==c.ownerType)fail('Property preview expired');
 const d=designFor(options.catalogue,q.design);
 if((options.payment||'gold')!==q.payment)fail('House payment method changed; preview again');
 if(d.price!==q.price||d.width!==q.width||d.depth!==q.depth||d.tier!==q.tier||(d.reservedWidth??d.width)!==q.reservedWidth||(d.reservedDepth??d.depth)!==q.reservedDepth)fail('House offer changed; preview again');
 // Revalidate occupancy, funds and proximity at confirmation. This synchronous
 // transaction is serialized by the existing single-process server command loop.
 prepareHousing(state,player,{design:q.design,target:q.target,x:q.x,y:q.y,rotation:q.rotation,deed:q.deed},{...options,now,nonce:()=>q.nonce});
 const id=(options.id||randomUUID)();if(state.properties?.[id])fail('Property ID collision');
 const property={id,buildingId:q.target||id,design:q.design,tier:q.tier,owner:q.owner,ownerType:q.ownerType,x:q.x,y:q.y,rotation:q.rotation,width:q.width,depth:q.depth,reservedWidth:q.reservedWidth,reservedDepth:q.reservedDepth,createdAt:now,interiorState:{containers:{},fixtures:[],snapPoints:structuredClone(d.snapPoints||[])}};
 state.properties??={};state.properties[id]=property;if(q.payment==='deed'){const deed=carriedDeed(state,player,q.design,q.deed);if(!deed)fail('House deed unavailable');delete player.inventory[deed.id];deed.status='used';deed.propertyId=id;deed.usedAt=now;}else debitCoins(c.account,q.price);delete c.account.housingProposal;
 return structuredClone(property);
}


