import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPhoneDownloads(directory){
 let cached,cacheKey;
 async function current(){
  const pointer=resolve(directory,'app-release.json'),info=JSON.parse(await readFile(pointer,'utf8'));
  if(!Number.isSafeInteger(info.versionCode)||info.versionCode<1||!/^\d+\.\d+(?:\.\d+)?$/.test(info.versionName)||!/^Forsaken-Realm-v\d+\.\d+(?:\.\d+)?\.apk$/.test(info.file)||!/^([a-f0-9]{64})$/.test(info.apkSha256))throw Error('Phone installer metadata is invalid');
  const file=resolve(directory,info.file),details=await stat(file);if(!details.isFile()||details.size<1||details.size>160*1024*1024)throw Error('Phone installer is invalid');
  const key=JSON.stringify([info,details.size,details.mtimeMs]);if(cacheKey===key&&cached)return cached;
  const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);if(hash.digest('hex')!==info.apkSha256)throw Error('Phone installer checksum does not match');
  cacheKey=key;cached={...info,path:file,bytes:details.size};return cached;
 }
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 return async function phoneDownloads(req,res){
  const path=req.url?.split('?')[0];if(!['/phone','/phone/','/updates/app-release.json','/updates/Forsaken-Realm.apk'].includes(path))return false;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return true;}
  let app;try{app=await current();}catch{if(path.startsWith('/phone')){res.writeHead(503,{'Content-Type':'text/html; charset=utf-8','Retry-After':'15','Cache-Control':'no-store'});res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Forsaken Realm</title><h1>Phone download is preparing</h1><p>The server is checking the installer. Try again shortly.</p>');}else json(res,503,{error:'Verified phone installer is not available yet'});return true;}
  if(path==='/updates/app-release.json'){json(res,200,{versionCode:app.versionCode,versionName:app.versionName,apkUrl:'/updates/Forsaken-Realm.apk',apkSha256:app.apkSha256,apkBytes:app.bytes});return true;}
  if(path.startsWith('/phone')){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});if(req.method==='HEAD'){res.end();return true;}
   res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#151912"><title>Forsaken Realm — Phone install</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#101610;color:#eee7d6;font:18px/1.5 system-ui;padding:22px}main{max-width:520px;padding:30px 24px;border:1px solid #a98b50;border-radius:14px;background:#20251b}h1{font:38px/1.1 Georgia,serif;color:#e4c48b}a{display:block;text-align:center;background:#e4c48b;color:#171a12;padding:20px 10px;border-radius:9px;font-size:21px;font-weight:750;text-decoration:none}a:focus{outline:3px solid white;outline-offset:4px}.meta{font-size:14px;color:#c9c2ac}.step{margin-top:26px}strong{color:#e4c48b}</style><main><h1>Forsaken Realm</h1><p>Your game is ready on this server.</p><a href="/updates/Forsaken-Realm.apk?v=${app.versionCode}" download="${escape(basename(app.path))}">Download for Android</a><p class="meta">Version ${escape(app.versionName)} · ${(app.bytes/1048576).toFixed(1)} MB · From your PC over your home network</p><p class="step">When it finishes, tap the downloaded file, then <strong>Update</strong> and <strong>Open</strong>. Approve Android’s installation permission if asked.</p><p class="meta">Keep your existing game installed. No GitHub or ChatGPT account is needed. Keep the phone on the same Wi-Fi as this server.</p></main></html>`);return true;
  }
  const etag='"'+app.apkSha256+'"';let start=0,end=app.bytes-1,status=200;
  if(req.headers.range&&(!req.headers['if-range']||req.headers['if-range']===etag)){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||!match[1]&&!match[2]){res.writeHead(416,{'Content-Range':`bytes */${app.bytes}`});res.end();return true;}
   if(!match[1]){const tail=Number(match[2]);start=Math.max(0,app.bytes-tail);if(tail===0)start=app.bytes;}else{start=Number(match[1]);if(match[2])end=Number(match[2]);}
   end=Math.min(end,app.bytes-1);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||start>=app.bytes){res.writeHead(416,{'Content-Range':`bytes */${app.bytes}`});res.end();return true;}status=206;
  }
  const headers={'Content-Type':'application/vnd.android.package-archive','Content-Disposition':`attachment; filename="${basename(app.path)}"`,'Content-Length':end-start+1,'Accept-Ranges':'bytes',ETag:etag,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${app.bytes}`;
  res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return true;}
  const stream=createReadStream(app.path,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return true;
 };
}
