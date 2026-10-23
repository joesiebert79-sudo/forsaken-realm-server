import {spawnSync} from 'node:child_process';
import {createUpdateManager} from './update-manager.mjs';
import {playerStorage} from './player-storage.mjs';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const updates=createUpdateManager(root);process.env.REALM_PHONE_DOWNLOADS=updates.phone;
if(process.env.REALM_UPDATES_OFF!=='1'&&process.env.REALM_LOOPBACK_TEST!=='1'){try{if(await updates.applyPending())process.exit(75);}catch(error){console.log('The staged update was not installed: '+error.message);}}

// The packaged test launcher opts in explicitly. Existing direct/live launchers
// retain their original behavior and are never silently rebuilt.
if(process.argv.includes('--development')){
 const marker=resolve(root,'Development-World','REBUILD-VERIFIED.json');
 if(!existsSync(marker)){
  console.log('Preparing approved full development map; preserving original saves and player codes.');
  const prepared=spawnSync(process.execPath,[resolve(root,'windows','prepare-development.mjs')],{stdio:'inherit',env:process.env});
  if(prepared.status!==0||!existsSync(marker))throw Error('Full-map preparation failed. Original world is unchanged.');
 }
 const verified=JSON.parse(readFileSync(marker,'utf8'));
 if(verified.developmentOnly!==true||verified.profile!=='master-reference')throw Error('Development world verification is invalid');
 process.env.REALM_DATA_DIR=resolve(root,'Development-World');
 process.env.REALM_WORLD_DB=resolve(root,'Development-World','world.sqlite');
 process.env.REALM_WORLD_PROFILE='master-reference';
 console.log('FORSAKEN REALM v0.89 — SMALLER WORLD: 49920 x 33280; 2 Trader Towns, 12 villages, 5 castle landmarks.');
}

// Only a verified copy-on-rebuild opts this installation into the new world.
if(!process.env.REALM_DATA_DIR&&existsSync(resolve(root,'Development-World','REBUILD-VERIFIED.json'))){
 process.env.REALM_DATA_DIR=resolve(root,'Development-World');
 process.env.REALM_WORLD_DB=resolve(root,'Development-World','world.sqlite');
 process.env.REALM_WORLD_PROFILE='master-reference';
}
const {data,tokens}=playerStorage(root,process.env.LOCALAPPDATA,{allowNew:process.argv.includes('--new-world')});
console.log('Permanent world and player-code folder: '+data);
const port=Number(process.env.PORT||8788);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Choose a valid server PORT from 1024 to 65535');
const addresses=Object.entries(process.argv.includes('--development')&&process.env.REALM_LOOPBACK_TEST==='1'?{}:networkInterfaces()).flatMap(([name,entries])=>entries.filter(e=>e.family==='IPv4'&&!e.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(e.address)).map(e=>({name,address:e.address})));
if(!addresses.length&&process.argv.includes('--development')&&process.env.REALM_LOOPBACK_TEST==='1')addresses.push({name:'Local test only',address:'127.0.0.1'});
if(!addresses.length)throw Error('No private home-network IPv4 address found. Connect the PC to your home router and retry.');
const lines=['THE FORSAKEN REALM: BLOOD & IRON — HOME LAN TEST','',
 'In the Android LAN app, open Settings. Use the Ethernet address below.',
 ...addresses.map(a=>`${a.name}: http://${a.address}:${port}`),'',
 ...Object.entries(tokens).map(([token,id])=>`${id} access code: ${token}`),'',
 'Use a different player code on each phone. Keep this file private.',
 'Choose your own 6–20 letter/number code with windows/Change-Player-Codes.cmd.',
 'Local test traffic is unencrypted. Use only on your trusted home network.',
 'Do not forward this port or expose the server to the Internet.',
 'Stop with Ctrl+C before backing up: '+data];
writeFileSync(resolve(root,'CONNECTION-INFO.txt'),lines.join('\r\n'),{mode:0o600});
for(const a of addresses)console.log('PHONE INSTALL / UPDATE: http://'+a.address+':'+port+'/phone');
lines.push('', 'Phone install/update: '+addresses.map(a=>'http://'+a.address+':'+port+'/phone').join(' or '));writeFileSync(resolve(root,'CONNECTION-INFO.txt'),lines.join('\r\n'),{mode:0o600});
console.log(lines.join('\n'));
process.env.REALM_TEST_TOKENS=JSON.stringify(tokens);process.env.REALM_PLAYER_CODES_FILE=resolve(data,'players.json');
process.env.REALM_WORLD_DB=process.env.REALM_WORLD_DB||resolve(data,'world.sqlite');
process.env.REALM_BIND_HOST='0.0.0.0';process.env.PORT=String(port);
const http=await import('../server/http.mjs');updates.start();
const updateIdle=setInterval(()=>{if(updates.pending&&http.activePlayers()===0){console.log('No players are connected. Saving and restarting to install the verified server update.');updates.stop();clearInterval(updateIdle);http.shutdown(75);}},30000);updateIdle.unref();
if(process.stdin.isTTY){process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim().toLowerCase()==='r'&&updates.pending){console.log('Saving and restarting for the staged update.');updates.stop();http.shutdown(75);}});}







