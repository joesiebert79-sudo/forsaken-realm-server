import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareHousing,confirmHousing,validateHousingPlacement} from '../server/housing.mjs';
// Fixture values exercise the engine; these are not approved gameplay prices.
const design={id:'fixture',price:100,width:80,depth:60,tier:1,snapPoints:[{id:'hearth',x:50,y:50}]};
function setup(){return {state:{accounts:{a:{gold:1000},b:{gold:1000}},properties:{},settlements:{}},p:{id:'a',hp:100,x:400,y:400},options:{catalogue:[design],world:{width:1000,height:1000,validLand:()=>true,occupied:[],roads:[],streams:[],protected:[],vacant:[{id:'house',status:'vacant',design:'fixture',x:420,y:420,door:{x:420,y:450}}]},now:100,id:()=> 'property-a'}};}
test('preview costs nothing; confirmation persists ownership, tier and interior exactly once',()=>{
 const {state,p,options}=setup(),q=prepareHousing(state,p,{design:'fixture',x:450,y:450,rotation:90},options);
 assert.equal(state.accounts.a.gold,1000);assert.deepEqual(state.properties,{});
 const home=confirmHousing(state,p,q.nonce,options);assert.equal(state.accounts.a.gold,900);assert.equal(home.rotation,90);assert.equal(home.interiorState.snapPoints[0].id,'hearth');
 assert.throws(()=>confirmHousing(state,p,q.nonce,options));assert.equal(state.accounts.a.gold,900);
 const restored=JSON.parse(JSON.stringify(state));assert.deepEqual(restored.properties,state.properties);
});
test('two players preview one vacant house: only one purchase succeeds',()=>{
 const {state,p,options}=setup(),b={...p,id:'b'},request={design:'fixture',target:'house'};
 const a=prepareHousing(state,p,request,options),q=prepareHousing(state,b,request,options);
 confirmHousing(state,p,a.nonce,options);assert.throws(()=>confirmHousing(state,b,q.nonce,{...options,id:()=> 'property-b'}),/not for sale/);assert.equal(state.accounts.b.gold,1000);
});
test('reject protected areas, road crossings, water, occupied sites, invalid rotation and terrain',()=>{
 const {options}=setup(),pos={x:450,y:450};
 for(const extra of [{protected:[{x:450,y:450,radius:30}]},{roads:[{width:20,points:[{x:100,y:450},{x:900,y:450}]}]},{streams:[{width:10,points:[{x:450,y:100},{x:450,y:900}]}]},{occupied:[{left:450,right:460,top:450,bottom:460}]},{validLand:()=>false}])assert.throws(()=>validateHousingPlacement(design,pos,0,{...options.world,...extra}));
 assert.throws(()=>validateHousingPlacement(design,pos,45,options.world));assert.throws(()=>validateHousingPlacement(design,{x:NaN,y:400},0,options.world));
});
test('settlement allowance, clan authority, lock and abandoned-loot distinction cannot be bypassed',()=>{
 const {state,p,options}=setup(),req={design:'fixture',target:'house'};
 state.accounts.a.settlementId='existing';assert.throws(()=>prepareHousing(state,p,req,options));delete state.accounts.a.settlementId;
 state.accounts.a.relocationLockedUntil=1000;assert.throws(()=>prepareHousing(state,p,req,options));delete state.accounts.a.relocationLockedUntil;
 state.accounts.a.clanId='clan';state.clans={clan:{id:'clan',leader:'b'}};assert.throws(()=>prepareHousing(state,p,req,options),/leader/);delete state.accounts.a.clanId;
 options.world.vacant[0].status='abandoned';assert.throws(()=>prepareHousing(state,p,req,options),/not for sale/);
});
test('expired, moved, depleted-funds and changed-price confirmations leave gold and land untouched',()=>{
 for(const scenario of ['time','move','gold','price']){
  const {state,p,options}=setup(),q=prepareHousing(state,p,{design:'fixture',target:'house'},options);
  if(scenario==='time')options.now=200000;if(scenario==='move')p.x=900;if(scenario==='gold')state.accounts.a.gold=0;if(scenario==='price')options.catalogue=[{...design,price:200}];
  const gold=state.accounts.a.gold;assert.throws(()=>confirmHousing(state,p,q.nonce,options));assert.equal(state.accounts.a.gold,gold);assert.deepEqual(state.properties,{});
 }
});


test('final compound reservation blocks later construction and persists without enlarging the main house',()=>{
 const {state,p,options}=setup();options.catalogue=[{...design,reservedWidth:240,reservedDepth:200}];
 assert.throws(()=>validateHousingPlacement(options.catalogue[0],{x:450,y:450},0,{...options.world,occupied:[{left:540,right:550,top:450,bottom:460}]}),/overlaps/);
 const q=prepareHousing(state,p,{design:'fixture',x:450,y:450},options);
 const home=confirmHousing(state,p,q.nonce,options);assert.equal(home.width,80);assert.equal(home.depth,60);assert.equal(home.reservedWidth,240);assert.equal(home.reservedDepth,200);
 assert.deepEqual(JSON.parse(JSON.stringify(home)),home);
});
test('changed compound reservation requires a fresh preview without charging',()=>{
 const {state,p,options}=setup();const q=prepareHousing(state,p,{design:'fixture',x:450,y:450},options);
 options.catalogue=[{...design,reservedWidth:240,reservedDepth:200}];
 assert.throws(()=>confirmHousing(state,p,q.nonce,options),/offer changed/);assert.equal(state.accounts.a.gold,1000);assert.deepEqual(state.properties,{});
});
