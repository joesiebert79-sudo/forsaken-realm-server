import {validatePlayerCodes} from '../server/player-code-auth.mjs';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const digest=b=>createHash('sha256').update(b).digest('hex');
/** Copy-on-rebuild: never writes the source database or identity file. */
export async function rebuildDevelopment({sourceData,sourceDatabase,destination,development=false}){
 if(!development)throw Error('Explicit development-world authorization required');
 const source=realpathSync(sourceData),dbPath=realpathSync(sourceDatabase),target=resolve(destination);
 if(existsSync(target))throw Error('Destination must be a new directory; existing worlds are never overwritten');
 const identityPath=resolve(source,'players.json'),bytes=readFileSync(identityPath),tokens=JSON.parse(bytes);
 validatePlayerCodes(tokens);
 mkdirSync(target,{recursive:true,mode:0o700});const backup=resolve(target,'backup-before-rebuild');mkdirSync(backup,{mode:0o700});
 writeFileSync(resolve(backup,'players.json'),bytes,{flag:'wx',mode:0o600});
 if(digest(readFileSync(resolve(backup,'players.json')))!==digest(bytes))throw Error('Identity backup verification failed');
 const old=new DatabaseSync(dbPath,{readOnly:true});let previous;
 try{
  old.prepare('VACUUM INTO ?').run(resolve(backup,'world.sqlite'));
  const copy=new DatabaseSync(resolve(backup,'world.sqlite'),{readOnly:true});
  try{if(copy.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Database backup integrity failed');previous=JSON.parse(copy.prepare('SELECT body FROM world WHERE id=1').get().body);for(const row of copy.prepare('SELECT body FROM movement').all()){const patch=JSON.parse(row.body);previous.players[patch.player.id]=patch.player;}}finally{copy.close();}
 }finally{old.close();}
 const ids=[...new Set([...Object.values(tokens),...Object.keys(previous.players||{}),...Object.keys(previous.accounts||{})])].sort();
 process.env.REALM_WORLD_PROFILE='master-reference';
 const {PROFILE,databasePath}=await import('../server/world-profile.mjs');if(PROFILE!=='master-reference')throw Error('Run rebuild in a fresh process with the master-reference profile');
 const {WorldStore}=await import('../server/store.mjs');const store=new WorldStore(databasePath(resolve(target,'world.sqlite')),undefined,{ruleset:'master-v1'});
 try{store.transaction(r=>{for(const id of ids){r.join(id);const oldAccount=previous.accounts?.[id];if(oldAccount?.username)r.state.accounts[id].username=oldAccount.username;}r.state.developmentRebuild={id:randomUUID(),at:Date.now(),identityCount:ids.length,identitySha256:digest(bytes)};});
  if(JSON.stringify(Object.keys(store.realm.state.players).sort())!==JSON.stringify(ids))throw Error('Player identity verification failed');
 }finally{store.close();}
 writeFileSync(resolve(target,'players.json'),bytes,{flag:'wx',mode:0o600});
 if(digest(readFileSync(identityPath))!==digest(bytes)||digest(readFileSync(resolve(target,'players.json')))!==digest(bytes))throw Error('Player codes changed during rebuild; do not activate destination');
 const report={developmentOnly:true,sourceUnmodified:true,identityCount:ids.length,identitySha256:digest(bytes),profile:'master-reference',backup:'backup-before-rebuild',databaseIntegrity:'ok'};
 writeFileSync(resolve(target,'REBUILD-VERIFIED.json'),JSON.stringify(report,null,2),{flag:'wx'});return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [sourceData,sourceDatabase,destination,authorization]=process.argv.slice(2);
 if(!sourceData||!sourceDatabase||!destination||authorization!=='--development-only')throw Error('Usage: node rebuild-development.mjs SOURCE_DATA SOURCE_DATABASE NEW_DESTINATION --development-only');
 console.log(JSON.stringify(await rebuildDevelopment({sourceData,sourceDatabase,destination,development:true}),null,2));
}

