import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';import {createInterface} from 'node:readline/promises';
import {playerStorage} from './player-storage.mjs';
import {customPlayerCode,normalizePlayerCode,validatePlayerCodes} from '../server/player-code-auth.mjs';
/** Owner-only local utility. Codes rotate; player identities and world files do not. */
export function changePlayerCode(directory,playerId,requested){
 if(!customPlayerCode(requested))throw Error('Use 6 to 20 letters or numbers, with no spaces or symbols.');
 const file=resolve(directory,'players.json'),bytes=readFileSync(file),tokens=validatePlayerCodes(JSON.parse(bytes));
 if(!Object.values(tokens).includes(playerId))throw Error('Choose an existing player; no new account was created.');
 const code=normalizePlayerCode(requested);if(Object.entries(tokens).some(([key,id])=>normalizePlayerCode(key)===code&&id!==playerId))throw Error('Another player already uses that code. Choose a different one.');
 const next=Object.fromEntries(Object.entries(tokens).filter(([,id])=>id!==playerId));next[code]=playerId;validatePlayerCodes(next);
 const backup=resolve(directory,'code-backups');mkdirSync(backup,{recursive:true,mode:0o700});const receipt=resolve(backup,'players-before-'+Date.now()+'-'+randomUUID()+'.json');writeFileSync(receipt,bytes,{flag:'wx',mode:0o600});
 const temporary=resolve(directory,'.players-'+randomUUID()+'.tmp');writeFileSync(temporary,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});renameSync(temporary,file);return {playerId,code,backup:receipt};
}
async function main(){const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),development=resolve(root,'Development-World');const dataDirectory=process.env.REALM_DATA_DIR||(existsSync(resolve(development,'REBUILD-VERIFIED.json'))?development:undefined);const storage=playerStorage(root,process.env.LOCALAPPDATA,{dataDirectory});const ids=[...new Set(Object.values(storage.tokens))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const rl=createInterface({input:process.stdin,output:process.stdout});try{console.log('FORSAKEN REALM — CHANGE PLAYER CODE\nYour characters and saves stay intact. Codes use 6–20 letters or numbers.\n');ids.forEach((id,i)=>console.log((i+1)+'. '+id));const choice=(await rl.question('\nChoose player number (or press Enter to cancel): ')).trim();if(!choice)return;const id=ids[Number(choice)-1];if(!/^\d+$/.test(choice)||!id)throw Error('Choose one of the listed players.');const code=await rl.question('New code (6–20 letters or numbers): ');const again=await rl.question('Enter it again: ');if(normalizePlayerCode(code)!==normalizePlayerCode(again))throw Error('Codes did not match; nothing changed.');changePlayerCode(storage.data,id,code);
  const info=resolve(root,'CONNECTION-INFO.txt');if(existsSync(info)){const lines=readFileSync(info,'utf8').split(/\r?\n/).map(line=>line.startsWith(id+' access code: ')?id+' access code: '+normalizePlayerCode(code):line);writeFileSync(info,lines.join('\r\n'),{mode:0o600});}
  console.log('\nSaved for '+id+'. Use the new code in the phone connection settings. The running updated server picks it up automatically.');
 }finally{rl.close();}}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
