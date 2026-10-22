export const HOUSE_DESIGNS=Object.freeze([
 ['hut','Hut',200,1,100,70,480,360],['cottage','Cottage',500,2,150,95,620,460],['farmhouse','Farmhouse',1200,3,190,120,760,540],['townhouse','Townhouse',3000,4,220,140,880,620],['manor','Manor',7500,5,260,170,1040,720]
].map(([id,name,price,tier,width,depth,roomWidth,roomHeight])=>({id,name,price,tier,width,depth,roomWidth,roomHeight,snapPoints:[{id:'hearth',x:roomWidth-100,y:60},{id:'storage',x:roomWidth-100,y:roomHeight-190},{id:'workbench',x:70,y:roomHeight-160}]})));
export function homeRoom(id,designId){const design=HOUSE_DESIGNS.find(d=>d.id===(designId||(/^home:([a-z]+):/.exec(id||'')||[])[1]));if(!design)return null;
 const w=design.roomWidth,h=design.roomHeight;
 if(id.endsWith(':basement'))return {id,name:design.name+' Trophy Vault',type:'basement',width:w,height:h,exit:{x:w/2,y:h-45},fixtures:[],displayAnchors:[{id:'weapon-wall',x:w/2,y:75},{id:'left-display',x:90,y:h/2},{id:'right-display',x:w-90,y:h/2}]};
 const fixtures=[{kind:'bed',x:55,y:55,w:90,h:125},{kind:'hearth',x:w-110,y:55,w:65,h:65}];
 return {id,name:design.name,type:'cottage',width:w,height:h,exit:{x:w/2,y:h-45},fixtures,portal:{x:w/2,y:95,label:'TROPHY VAULT',floor:'basement'},snapPoints:design.snapPoints};
}


