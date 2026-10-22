import {ITEMS} from './catalog.mjs';
export function gridSize(p){const slots=p.inventory?.[p.equippedBackpack]>0?ITEMS[p.equippedBackpack]?.backpackSlots:0;return slots>=20?[8,6]:slots>=16?[8,5]:slots>=12?[6,5]:[6,4];}
export function footprint(id){const item=ITEMS[id];return [item?.inventoryWidth||1,item?.inventoryHeight||1];}
export function packedItems(p){const result={...(p.inventory||{})};const worn=[...Object.values(p.armorSlots||{}),p.equippedShield?'shield':'',p.equippedWeapon,p.equippedBackpack];if(!p.armorSlots)worn.push(p.equippedHelmet,p.equippedArmour);for(const id of worn)if(result[id]>0)result[id]--;return Object.fromEntries(Object.entries(result).filter(([,n])=>n>0));}
function fits(cells,cols,rows,x,y,w,h){if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+w>cols||y+h>rows)return false;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(cells[yy*cols+xx])return false;return true;}
function mark(cells,cols,e){for(let y=e.y;y<e.y+e.h;y++)for(let x=e.x;x<e.x+e.w;x++)cells[y*cols+x]=true;}
export function arrange(p,strict=false){const [cols,rows]=gridSize(p),items=packedItems(p),old=p.backpackGrid||{entries:[],overflow:[]},cells=[],entries=[],pending=[];
 for(const id of Object.keys(items)){const [w,h]=footprint(id),prior=old.entries.find(e=>e.id===id),e=prior?{id,x:prior.x,y:prior.y,w:prior.rotated?h:w,h:prior.rotated?w:h,rotated:!!prior.rotated,count:items[id]}:null;if(e&&fits(cells,cols,rows,e.x,e.y,e.w,e.h)){entries.push(e);mark(cells,cols,e);}else pending.push(id);}
 pending.sort((a,b)=>{const A=footprint(a),B=footprint(b);return B[0]*B[1]-A[0]*A[1]||a.localeCompare(b);});const overflow=[];
 for(const id of pending){const [w,h]=footprint(id);let found=null;for(const rotated of [false,true]){const ww=rotated?h:w,hh=rotated?w:h;for(let y=0;y<=rows-hh&&!found;y++)for(let x=0;x<=cols-ww;x++)if(fits(cells,cols,rows,x,y,ww,hh)){found={id,x,y,w:ww,h:hh,rotated,count:items[id]};break;}if(found)break;}if(found){entries.push(found);mark(cells,cols,found);}else overflow.push({id,count:items[id]});}
 if(strict&&overflow.some(e=>!old.overflow.some(o=>o.id===e.id&&o.count>=e.count)))throw Error('Item does not fit. Rearrange, rotate, store or drop items.');
 p.backpackGrid={cols,rows,entries,overflow};return p.backpackGrid;}
export function placeItem(p,command){const g=arrange(p),[w,h]=footprint(command.item),prior=g.entries.find(e=>e.id===command.item);if(!packedItems(p)[command.item])throw Error('Item is not in backpack');const rotated=command.rotate?!prior?.rotated:!!prior?.rotated,x=command.rotate?prior?.x:command.x,y=command.rotate?prior?.y:command.y,e={id:command.item,x,y,w:rotated?h:w,h:rotated?w:h,rotated,count:packedItems(p)[command.item]},cells=[];for(const other of g.entries)if(other.id!==e.id)mark(cells,g.cols,other);if(!fits(cells,g.cols,g.rows,x,y,e.w,e.h))throw Error('Item does not fit there');g.entries=g.entries.filter(o=>o.id!==e.id);g.entries.push(e);g.overflow=g.overflow.filter(o=>o.id!==e.id);}


