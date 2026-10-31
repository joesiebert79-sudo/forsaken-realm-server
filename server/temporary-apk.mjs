import {createReadStream,createWriteStream,existsSync,statSync,unlinkSync,renameSync} from 'node:fs';
import {createHash,timingSafeEqual} from 'node:crypto';
import {pipeline} from 'node:stream/promises';
const file='/tmp/forsaken-realm-render-v0966.apk';
const expected='3b13ae93661fcbe7ff87f5d0aaf32631cb59b22a1cf6a1d03f17ab8dc05e8e1f';
const max=160*1024*1024;
export async function temporaryApk(req,res){
 const path=req.url?.split('?')[0];
 if(path==='/android/Forsaken-Realm-Render-v0.96.6.apk'&&req.method==='GET'){
  if(!existsSync(file)){res.writeHead(503,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Installer temporarily unavailable');return true;}
  res.writeHead(200,{'Content-Type':'application/vnd.android.package-archive','Content-Disposition':'attachment; filename="Forsaken-Realm-Render-v0.96.6.apk"','Content-Length':statSync(file).size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  createReadStream(file).pipe(res);return true;
 }
 if(path!=='/internal/upload-render-apk'||req.method!=='POST')return false;
 const secret=process.env.REALM_APK_UPLOAD_TOKEN||'';
 const supplied=req.headers['x-upload-token']||'';
 const a=Buffer.from(secret),b=Buffer.from(String(supplied));
 if(a.length<32||a.length!==b.length||!timingSafeEqual(a,b)){res.writeHead(403);res.end();return true;}
 const length=Number(req.headers['content-length']);
 if(!Number.isSafeInteger(length)||length<1||length>max){res.writeHead(413);res.end();return true;}
 const temp=file+'.part';const hash=createHash('sha256');let bytes=0;
 try{
  for await(const chunk of req){bytes+=chunk.length;if(bytes>max)throw Error('too large');hash.update(chunk);await new Promise((ok,bad)=>{const out=createWriteStream(temp,{flags:bytes===chunk.length?'w':'a'});out.on('error',bad);out.end(chunk,ok);});}
  if(bytes!==length||hash.digest('hex')!==expected)throw Error('checksum mismatch');
  renameSync(temp,file);res.writeHead(201,{'Content-Type':'application/json'});res.end(JSON.stringify({ready:true,bytes}));
 }catch{try{unlinkSync(temp);}catch{}res.writeHead(400);res.end('Invalid installer');}
 return true;
}
