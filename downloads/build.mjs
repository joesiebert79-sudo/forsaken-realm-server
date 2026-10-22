import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const repository='joesiebert79-sudo/forsaken-realm-server';
const response=await fetch(`https://api.github.com/repos/${repository}/releases/latest`,{headers:{Accept:'application/vnd.github+json'}});
if(!response.ok)throw Error(`Release lookup failed: ${response.status}`);
const release=await response.json();
if(release.draft||release.prerelease)throw Error('Only public stable releases may be hosted');
const apk=release.assets.find(a=>/\.apk$/.test(a.name));
const server=release.assets.find(a=>/Windows-Server\.zip$/.test(a.name));
if(!apk||!server)throw Error('Both published downloads are required');
const directory='_download-site';await fs.mkdir(directory,{recursive:true});
async function copy(asset,name){
 const url=new URL(asset.browser_download_url);
 if(url.origin!=='https://github.com'||!url.pathname.startsWith(`/${repository}/releases/download/`))throw Error('Unexpected download source');
 if(!/^sha256:[a-f0-9]{64}$/.test(asset.digest||''))throw Error('Published checksum required');
 const r=await fetch(url);if(!r.ok)throw Error(`Download failed: ${r.status}`);
 const bytes=Buffer.from(await r.arrayBuffer());
 const digest=createHash('sha256').update(bytes).digest('hex');
 if(bytes.length!==asset.size||'sha256:'+digest!==asset.digest)throw Error(`Published file verification failed: ${name}`);
 await fs.writeFile(`${directory}/${name}`,bytes);console.log(`Verified ${name}: ${bytes.length} bytes`);return digest;
}
const [apkHash,serverHash]=await Promise.all([copy(apk,'Forsaken-Realm.apk'),copy(server,'Forsaken-Realm-Windows-Server.zip')]);
const version=release.tag_name.replace(/^v/,'');if(!/^\d+\.\d+(\.\d+)?$/.test(version))throw Error('Unexpected version');
const size=(apk.size/1048576).toFixed(1);
await fs.writeFile(`${directory}/.nojekyll`,'');
await fs.writeFile(`${directory}/downloads.json`,JSON.stringify({version,apk:'Forsaken-Realm.apk',apkSha256:apkHash,apkBytes:apk.size,server:'Forsaken-Realm-Windows-Server.zip',serverSha256:serverHash,release:release.html_url},null,2));
await fs.writeFile(`${directory}/index.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#171713"><title>Download Forsaken Realm</title><meta name="description" content="Download Forsaken Realm for Android. No account required."><style>*{box-sizing:border-box}body{margin:0;background:#10130f;color:#eee7d6;font:17px/1.55 system-ui,sans-serif;padding:32px 20px;min-height:100dvh;display:grid;place-items:center}main{width:min(100%,540px);padding:32px 26px;border:1px solid #8d7546;border-radius:14px;background:linear-gradient(145deg,#25271f,#151713);box-shadow:0 20px 80px #0008}h1{font:700 38px/1.15 Georgia,serif;margin:10px 0 18px;color:#e0c184}.eyebrow{font-size:13px;letter-spacing:.16em;color:#c2b99f}p{color:#cfcab9}a{color:#e3c683}a.primary{display:block;text-align:center;background:#e0c184;color:#1a1c15;text-decoration:none;font-weight:750;border-radius:9px;padding:18px 12px;font-size:20px;border:2px solid #f6dfae;min-height:64px}a.primary:hover{background:#f4db9f}a:focus-visible{outline:3px solid #fff;outline-offset:4px}.meta{font-size:14px;text-align:center}.help{margin:24px 0;padding-top:18px;border-top:1px solid #71603e;font-size:15px}details{font-size:15px;margin-top:26px}summary{cursor:pointer;color:#e3c683;min-height:44px}footer{font-size:13px;margin-top:24px;color:#b4af9c}</style></head><body><main><div class="eyebrow">ANDROID GAME</div><h1>Forsaken Realm</h1><p>Download the game straight to your phone.</p><a class="primary" href="Forsaken-Realm.apk?v=${version}" download="Forsaken-Realm-v${version}.apk">Download for Android</a><p class="meta">Version ${version} · ${size} MB · No account required</p><p class="help">When the download finishes, tap the file, approve Android’s installation prompt, then tap <strong>Open</strong>.<br><br>Already installed? Keep the existing app and choose <strong>Update</strong> if Android offers it.</p><details><summary>Windows server download</summary><p>For the person hosting the game on a PC.</p><p><a href="Forsaken-Realm-Windows-Server.zip?v=${version}" download>Download PC server ZIP</a></p><p>The app and server must use the same local network. Stop the server before replacing its files.</p></details><footer>Keep this link pinned in Discord. It refreshes when a new release is published.</footer></main></body></html>`);
console.log(`Prepared public direct downloads for ${version}`);
