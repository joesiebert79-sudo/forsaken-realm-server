// Deterministic street-side clusters. IDs, room shapes and interaction rules stay stable.
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export function naturalBuildings(buildings,villages,towns){
 const placed=[],fixed=buildings.filter(b=>b.style==='Castle'||towns.some(t=>Math.hypot(t.x-b.x,t.y-b.y)<480+180));
 placed.push(...fixed);
 for(const b of buildings){if(fixed.includes(b))continue;const v=villages.reduce((a,v)=>Math.hypot(v.x-b.x,v.y-b.y)<Math.hypot(a.x-b.x,a.y-b.y)?v:a),seed=hash(b.id),rural=/Farmstead|Crofter|Stable|Granary/.test(b.name);let chosen;
  for(let n=0;n<80;n++){const angle=((seed%6283)/1000+n*2.399),radius=(rural?1050:350)+(seed%430)+n*23;const x=Math.round(v.x+Math.cos(angle)*radius),y=Math.round(v.y+Math.sin(angle)*radius*.72);const p={...b,x,y};if(x-b.halfWidth<50||y-b.depth<50||x+b.halfWidth>62190||y>62000)continue;if(villages.some(t=>Math.hypot(x-t.x,y-t.y)<240)||towns.some(t=>Math.hypot(x-t.x,y-t.y)<480+180))continue;if(placed.some(o=>Math.abs(o.x-x)<o.halfWidth+b.halfWidth+150&&Math.abs(o.y-y)<Math.max(o.depth,b.depth)+230))continue;chosen=p;break;}
  placed.push({...chosen||b,rural,yard:rural?'farm':b.kind==='house'?'garden':null});
 }
 return buildings.map(b=>placed.find(p=>p.id===b.id));
}



