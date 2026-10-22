import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {playerStorage} from './player-storage.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {data}=playerStorage(root,process.env.LOCALAPPDATA);
const base=process.env.REALM_WORLD_DB||resolve(data,'world.sqlite');
const candidates=[base+'.day2-compact.sqlite',base+'.master-reference.sqlite',base].filter(existsSync);
const source=process.env.REALM_REBUILD_SOURCE_DB|| (candidates.length===1?candidates[0]:null);
if(!source)throw Error('Multiple or no saved worlds found. Set REALM_REBUILD_SOURCE_DB to the development database you want to rebuild. Nothing was changed.');
const result=spawnSync(process.execPath,[resolve(root,'windows','rebuild-development.mjs'),data,source,resolve(root,'Development-World'),'--development-only'],{stdio:'inherit',env:{...process.env,REALM_WORLD_PROFILE:'master-reference'}});
process.exitCode=result.status??1;

