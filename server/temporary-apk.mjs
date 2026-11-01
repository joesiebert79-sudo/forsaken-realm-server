import {createReadStream,createWriteStream,existsSync,statSync,unlinkSync,renameSync} from 'node:fs';
import {createHash,timingSafeEqual} from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
const file='/tmp/forsaken-realm-render-v0967.apk';
const expected='06e835ce02500cfc0f5a1d4968d25990a63f79d883c5e6cae3cb3f2ac99a64';
const max=160*1024*1024;
export async function temporaryApk(req,res){
 const path=req.url?.split('?')[0];
 if(path==='/android/Forsaken-Realm-Render-v0.96.7.apk'&&req.method==='GET'){
  if(!existsSync(file)){res.writeHead(503,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Installer temporarily unavailable');return true;}
  res.writeHead(200,{'Content-Type':'application/vnd.android.package-archive','Content-Disposition':'attachment; filename="Forsaken-Realm-Render-v0.96.7.apk"','Content-Length':statSync(file).size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
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
  const verify=new Transform({transform(chunk,encoding,callback){bytes+=chunk.length;if(bytes>max){callback(Error('too large'));return;}hash.update(chunk);callback(null,chunk);}});
  await pipeline(req,verify,createWriteStream(temp));
  const actual=hash.digest('hex');
  if(bytes!==length||actual!==expected)throw Error('checksum mismatch: '+bytes+'/'+length+' '+actual);
  renameSync(temp,file);res.writeHead(201,{'Content-Type':'application/json'});res.end(JSON.stringify({ready:true,bytes}));
 }catch(err){try{unlinkSync(temp);}catch{}console.error('APK upload rejected:',err.message);res.writeHead(400);res.end('Invalid installer: '+err.message);}
 return true;
}
