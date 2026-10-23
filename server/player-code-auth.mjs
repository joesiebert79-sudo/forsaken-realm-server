import {readFileSync,statSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
export const customPlayerCode=value=>typeof value==='string'&&/^[A-Za-z0-9]{6,20}$/.test(value);
export const normalizePlayerCode=value=>customPlayerCode(value)?value.toUpperCase():value;
export function validatePlayerCodes(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(value).length)throw Error('Saved player codes are invalid');
 const seen=new Set();for(const [code,id]of Object.entries(value)){
  if((!customPlayerCode(code)&&! /^[a-f0-9]{32}$/.test(code))||typeof id!=='string'||!id.length||['__proto__','constructor','prototype'].includes(id))throw Error('Saved player codes are invalid');
  const key=normalizePlayerCode(code);if(seen.has(key))throw Error('Player codes must be unique');seen.add(key);
 }
 return value;
}
/** Local-file rotation keeps the same player ID and does not expose an admin API. */
export function createPlayerCodeAuth(initial,{file}={}){
 let tokens=initial,key='';
 function refresh(){if(!file)return;try{const s=statSync(file),next=[s.ino,s.mtimeMs,s.ctimeMs,s.size].join(':');if(next===key)return;const candidate=validatePlayerCodes(JSON.parse(readFileSync(file,'utf8')));tokens=candidate;key=next;}catch{/* Keep the last valid mapping if a local file is unavailable or corrupt. */}}
 return supplied=>{refresh();const normalized=normalizePlayerCode(supplied),input=Buffer.from(normalized||'');for(const [code,id]of Object.entries(tokens)){const expected=Buffer.from(normalizePlayerCode(code));if(input.length===expected.length&&timingSafeEqual(input,expected))return id;}return null;};
}
