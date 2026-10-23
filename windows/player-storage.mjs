import {validatePlayerCodes} from '../server/player-code-auth.mjs';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
/** Updating never creates or regenerates player identities. */
export function playerStorage(root,localAppData,{dataDirectory=process.env.REALM_DATA_DIR}={}){
 const candidates=dataDirectory?[resolve(dataDirectory)]:[
 ...(localAppData?[resolve(localAppData,'MoronGaming','ForsakenRealmLAN','data')]:[]),
 resolve(root,'data'),
 ...(localAppData?[resolve(localAppData,'MoronGaming','Forsaken Realm','data'),resolve(localAppData,'Forsaken Realm','data')]:[])];
 const found=[...new Set(candidates)].filter(p=>existsSync(resolve(p,'players.json')));
 if(!found.length)throw Error('Existing players.json was not found. Keep your data folder and set REALM_DATA_DIR to its location. No codes or saves were created.');
 const entries=found.map(data=>({data,tokens:JSON.parse(readFileSync(resolve(data,'players.json'),'utf8'))}));
 for(const entry of entries){try{validatePlayerCodes(entry.tokens);}catch{throw Error('Saved player codes are invalid; restore your backup. Codes were not changed.');}}
 const canonical=tokens=>JSON.stringify(Object.entries(tokens).sort(([a],[b])=>a.localeCompare(b)));
 if(entries.some(e=>canonical(e.tokens)!==canonical(entries[0].tokens)))throw Error('Several different player-code folders exist. Set REALM_DATA_DIR to your active data folder; nothing was changed.');
 return entries[0];
}

