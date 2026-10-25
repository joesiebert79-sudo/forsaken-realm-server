import {readFileSync} from 'node:fs';
import {resolve,relative,dirname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const COUNTS=Object.freeze({idle:12,walk:12,run:16,attack:12,hit:6,death:12,special:16,turn:4});
export const ENTITY_IDS=Object.freeze(['warrior','archer','mage','rogue','paladin','necromancer','wolf','direWolf','warBear','raven','loneWolf','familiar','horse']);
const hash=b=>createHash('sha256').update(b).digest('hex');
function inside(root,path){if(typeof path!=='string'||!path.length)throw Error('Missing asset path');const target=resolve(root,path),rel=relative(root,target);if(rel==='..'||rel.startsWith('..'+sep)||resolve(path)===path)throw Error('Asset path escapes root');return target;}
export function auditActors(root,manifest){
 if(manifest.schemaVersion!==1)throw Error('Unknown actor manifest schema');
 if(manifest.directions!==16||JSON.stringify(manifest.actions)!==JSON.stringify(COUNTS))throw Error('Animation target changed');
 const ids=manifest.entities.map(e=>e.id);
 if(ids.length!==13||new Set(ids).size!==13||ENTITY_IDS.some(id=>!ids.includes(id)))throw Error('Expected six classes and seven companions');
 for(const ref of manifest.references){const bytes=readFileSync(inside(root,ref.path));if(hash(bytes)!==ref.sha256)throw Error('Approved reference fingerprint mismatch: '+ref.path);}
 if(manifest.references.length!==3)throw Error('Expected three exact approved references');
 let approvedFrames=0;const coverage=[];
 for(const entity of manifest.entities){
  let actual=0;const clips=entity.clips||[];
  if(entity.status!=='approved-production'){
   if(clips.length)throw Error('Draft clips cannot enter runtime: '+entity.id);
   coverage.push({id:entity.id,approvedFrames:0,requiredFrames:1440,status:entity.status});continue;
  }
  if(entity.review?.approved!==true)throw Error('Missing fidelity review: '+entity.id);
  const pages=new Map();
  for(const page of entity.pages||[]){
   if(!/^[a-zA-Z0-9_-]+$/.test(page.id)||pages.has(page.id))throw Error('Invalid atlas page');
   const bytes=readFileSync(inside(root,page.path));
   if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.readUInt32BE(8)!==13||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Expected PNG atlas');
   const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
   if(width<1||height<1||width>2048||height>2048||bytes[25]!==6)throw Error('Atlas must be RGBA and at most 2048px');
   if(hash(bytes)!==page.sha256)throw Error('Atlas fingerprint mismatch');pages.set(page.id,{width,height});
  }
  const keys=new Set(),rects=new Set();
  for(const clip of clips){
   const key=clip.action+':'+clip.direction;
   if(!Object.hasOwn(COUNTS,clip.action)||!Number.isInteger(clip.direction)||clip.direction<0||clip.direction>=16||keys.has(key))throw Error('Invalid or duplicate directional clip');
   keys.add(key);
   if(!Number.isFinite(clip.fps)||clip.fps<1||clip.fps>60||clip.frames?.length!==COUNTS[clip.action])throw Error('Missing frames or invalid FPS');
   for(const frame of clip.frames){
    const page=pages.get(frame.page),{x,y,w,h,anchorX,anchorY}=frame;
    if(!page||![x,y,w,h,anchorX,anchorY].every(Number.isInteger)||x<0||y<0||w<1||h<1||x+w>page.width||y+h>page.height||anchorX<0||anchorX>w||anchorY<0||anchorY>h)throw Error('Invalid atlas frame or feet anchor');
    const rect=[frame.page,x,y,w,h].join(':');if(rects.has(rect))throw Error('Reused rectangle does not count as a newly produced frame');rects.add(rect);actual++;
   }
  }
  if(keys.size!==16*8||actual!==1440)throw Error('Incomplete production entity: '+entity.id);
  approvedFrames+=actual;coverage.push({id:entity.id,approvedFrames:actual,requiredFrames:1440,status:entity.status});
 }
 return {requiredFrames:18720,approvedFrames,complete:approvedFrames===18720,entities:coverage,additionalFrames:['horse rider and mount/dismount','raven and dragon takeoff/landing']};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),manifest=JSON.parse(readFileSync(resolve(root,'references/phase-2-approved/actors.json'),'utf8'));
 const result=auditActors(root,manifest);console.log(JSON.stringify(result,null,2));
 if(process.argv.includes('--require-complete')&&!result.complete)process.exitCode=1;
}
