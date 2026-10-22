import {createReadStream,createWriteStream} from 'node:fs';
import {readFile,writeFile,mkdir,rename,stat,lstat,copyFile,unlink} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawnSync} from 'node:child_process';
const repo='joesiebert79-sudo/forsaken-realm-server',raw=`https://raw.githubusercontent.com/${repo}/main/`,pages='https://joesiebert79-sudo.github.io/forsaken-realm-server/';
export const newer=(a,b)=>{const av=String(a).split('-')[0].split('.').map(Number),bv=String(b).split('-')[0].split('.').map(Number);for(let i=0;i<3;i++){if((av[i]||0)!==(bv[i]||0))return(av[i]||0)>(bv[i]||0);}return false;};
const version=v=>typeof v==='string'&&/^\d+\.\d+(?:\.\d+)?$/.test(v);
export function allowedDownload(value){try{const u=new URL(value);return u.protocol==='https:'&&(u.host==='github.com'&&u.pathname.startsWith(`/${repo}/releases/download/`)||u.origin==='https://joesiebert79-sudo.github.io'&&u.pathname.startsWith('/forsaken-realm-server/'));}catch{return false;}}
export async function digest(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
async function exists(file){try{await stat(file);return true;}catch{return false;}}
async function atomicJson(file,value){await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(file+'.tmp',file);}
export async function downloadVerified(url,sha,file,{fetchImpl=fetch,maxBytes=512*1024*1024}={}){
 if(!allowedDownload(url)||!/^([a-f0-9]{64})$/.test(sha))throw Error('Update download source or checksum is invalid');
 await mkdir(dirname(file),{recursive:true});const part=file+'.part';let bytes=0;const hash=createHash('sha256');
 try{const response=await fetchImpl(url,{signal:AbortSignal.timeout(15*60*1000),headers:{'Cache-Control':'no-cache'}});if(!response.ok||!response.body)throw Error('Update download is unavailable');
 const verify=new Transform({transform(chunk,encoding,callback){bytes+=chunk.length;if(bytes>maxBytes)return callback(Error('Update exceeds the download limit'));hash.update(chunk);callback(null,chunk);}});
 await pipeline(response.body,verify,createWriteStream(part));if(bytes<1||hash.digest('hex')!==sha)throw Error('Update checksum did not match');await rename(part,file);return bytes;
 }catch(error){await unlink(part).catch(()=>{});throw error;}
}
export function packageFiles(bytes){
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}if(end<0)throw Error('Update ZIP directory is missing');
 const count=bytes.readUInt16LE(end+10),offset=bytes.readUInt32LE(end+16),size=bytes.readUInt32LE(end+12);if(count===65535||offset+size>end||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw Error('Unsupported update ZIP');
 const names=[],seen=new Set();let at=offset,total=0;
 for(let i=0;i<count;i++){
  if(at+46>offset+size||bytes.readUInt32LE(at)!==0x02014b50)throw Error('Invalid ZIP directory');
  const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),length=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),attr=bytes.readUInt32LE(at+38),name=bytes.subarray(at+46,at+46+length).toString('utf8');total+=bytes.readUInt32LE(at+24);at+=46+length+extra+comment;
  if(flags&1||![0,8].includes(method)||((attr>>>16)&0xf000)===0xa000||total>1536*1024*1024)throw Error('Unsafe update archive entry');
  const parts=name.replace(/\/$/,'').split('/');if(!name||name.startsWith('/')||/[\\:\0]/.test(name)||parts.some(p=>!p||p==='.'||p==='..'||['.git','data','Development-World'].includes(p))||/players\.json|\.sqlite(?:-|$)|\.p12$|password|\.env(?:$|\.)/i.test(name))throw Error('Update cannot contain private data or unsafe paths');
  if(!/^(server\/|windows\/|runtime\/|phone\/|Start-Server\.cmd$|README\.md$|DAY4-STATUS\.md$|MENU-STATUS\.md$|UPDATE-STATUS\.md$|RELEASE-[\w.-]+\.txt$)/.test(name))throw Error('Update contains an unsupported destination');
  const key=name.toLowerCase();if(seen.has(key))throw Error('Duplicate update entry');seen.add(key);if(!name.endsWith('/')&&!name.startsWith('runtime/'))names.push(name);
 }
 if(!names.includes('server/release.mjs')||!names.includes('windows/start.mjs'))throw Error('Server update is incomplete');return names;
}
async function extract(zip,stage){
 const result=process.platform==='win32'?spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory($env:REALM_UPDATE_ARCHIVE, $env:REALM_UPDATE_STAGE)'],{windowsHide:true,encoding:'utf8',env:{...process.env,REALM_UPDATE_ARCHIVE:zip,REALM_UPDATE_STAGE:stage}}):spawnSync('unzip',['-q',zip,'-d',stage],{encoding:'utf8'});
 if(result.status!==0)throw Error('Could not extract the verified update: '+(result.error?.message||result.stderr||result.stdout));
}
function within(root,name){const full=resolve(root,name),rel=relative(root,full);if(!rel||rel.startsWith('..')||resolve(root)===full)throw Error('Update path escaped the installation');return full;}
export async function installServerPackage(root,zip,info,{extractImpl=extract,copyImpl=copyFile}={}){
 root=resolve(root);if(!version(info.version)||!/^([a-f0-9]{64})$/.test(info.zipSha256)||await digest(zip)!==info.zipSha256)throw Error('Server update verification failed');
 const files=packageFiles(await readFile(zip)),stamp=Date.now()+'-'+info.version,stage=within(root,'updates/staging/'+stamp),backup=within(root,'updates/backups/'+stamp);await mkdir(stage,{recursive:true});await mkdir(backup,{recursive:true});await extractImpl(zip,stage);
 const release=await readFile(within(stage,'server/release.mjs'),'utf8'),declared=/RELEASE\s*=\s*['"']([\d.]+)/.exec(release);if(!declared||declared[1]!==info.version)throw Error('Server package version does not match its update manifest');
 const prior=[];
 for(const name of files){const source=within(stage,name),details=await lstat(source);if(!details.isFile()||details.isSymbolicLink())throw Error('Extracted update file is invalid');const destination=within(root,name),previous=await exists(destination);prior.push({name,previous});if(previous){const b=within(backup,name);await mkdir(dirname(b),{recursive:true});await copyFile(destination,b);}}
 const applied=[];try{for(const item of prior){const destination=within(root,item.name);await mkdir(dirname(destination),{recursive:true});applied.push(item);await copyImpl(within(stage,item.name),destination);}}
 catch(error){for(const item of applied.reverse()){const destination=within(root,item.name);if(item.previous)await copyFile(within(backup,item.name),destination);else await unlink(destination).catch(()=>{});}throw Error('Server update was rolled back; existing files and player data were retained');}
 await atomicJson(within(backup,'receipt.json'),{version:info.version,at:new Date().toISOString(),files});return {version:info.version,backup};
}
async function json(url,fetchImpl){const r=await fetchImpl(url,{signal:AbortSignal.timeout(8000),headers:{'Cache-Control':'no-cache'}});if(!r.ok)throw Error('Update check is unavailable');const text=await r.text();if(text.length>16384)throw Error('Update manifest is too large');return JSON.parse(text);}
export function createUpdateManager(root,{fetchImpl=fetch,log=console.log}={}){
 root=resolve(root);const phone=within(root,'phone'),cache=within(root,'updates'),pendingFile=within(cache,'pending-server.json');let running=false,stopped=false,timer,pending=null;
 async function installedVersion(){const text=await readFile(within(root,'server/release.mjs'),'utf8'),match=/RELEASE\s*=\s*['"]([\d.]+)/.exec(text);if(!match)throw Error('Installed server version is unavailable');return match[1];}
 async function applyPending(){if(!await exists(pendingFile))return false;const info=JSON.parse(await readFile(pendingFile,'utf8'));if(!version(info.version)||!newer(info.version,await installedVersion())){await unlink(pendingFile);return false;}const zip=within(cache,`server-v${info.version}.zip`);await installServerPackage(root,zip,info);await unlink(pendingFile);log('Server update installed. Reloading the updated server.');return true;}
 async function refreshPhone(){const info=await json(raw+'app-release.json?check='+Date.now(),fetchImpl);if(!Number.isSafeInteger(info.versionCode)||info.versionCode<1||!version(info.versionName)||!/^([a-f0-9]{64})$/.test(info.apkSha256)||!allowedDownload(info.apkUrl))throw Error('Published app update is invalid');const file=`Forsaken-Realm-v${info.versionName}.apk`,target=within(phone,file);let local;try{local=JSON.parse(await readFile(within(phone,'app-release.json'),'utf8'));}catch{}
 if(local?.versionCode>info.versionCode)return;
 if(local?.versionCode===info.versionCode&&local.apkSha256===info.apkSha256&&await exists(target)&&await digest(target)===info.apkSha256)return;
 if(!await exists(target)||await digest(target)!==info.apkSha256){try{await downloadVerified(pages+`Forsaken-Realm.apk?v=${info.versionCode}`,info.apkSha256,target,{fetchImpl,maxBytes:160*1024*1024});}catch{await downloadVerified(info.apkUrl,info.apkSha256,target,{fetchImpl,maxBytes:160*1024*1024});}}
 await atomicJson(within(phone,'app-release.json'),{versionCode:info.versionCode,versionName:info.versionName,apkSha256:info.apkSha256,file});log('Verified phone app is ready on this server: v'+info.versionName);}
 async function refreshServer(){const info=await json(raw+'server-release.json?check='+Date.now(),fetchImpl);if(!version(info.version)||!allowedDownload(info.zipUrl)||!/^([a-f0-9]{64})$/.test(info.zipSha256))throw Error('Published server update is invalid');if(!newer(info.version,await installedVersion()))return false;const zip=within(cache,`server-v${info.version}.zip`);if(!await exists(zip)||await digest(zip)!==info.zipSha256)await downloadVerified(info.zipUrl,info.zipSha256,zip,{fetchImpl});packageFiles(await readFile(zip));await atomicJson(pendingFile,info);pending=info;return true;}
 async function check(){if(running||stopped)return;running=true;try{const results=await Promise.allSettled([refreshPhone(),refreshServer()]);for(let i=0;i<results.length;i++)if(results[i].status==='rejected')log((i===0?'Phone app':'Server')+' update check could not finish; the current game remains available and the next check will retry.');if(pending)log('Server update v'+pending.version+' is verified and staged. It will install after players leave, or after the next restart.');}finally{running=false;}}
 return {phone,applyPending,check,refreshPhone,refreshServer,get pending(){return pending;},start(){if(process.env.REALM_UPDATES_OFF==='1')return;void check();timer=setInterval(()=>void check(),15*60*1000);timer.unref();},stop(){stopped=true;clearInterval(timer);}};
}



