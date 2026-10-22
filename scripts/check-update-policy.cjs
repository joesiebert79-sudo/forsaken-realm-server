const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'forsaken-update-check-'));
const bundled=path.resolve(__dirname,'../../android-tools/jdk');let javaHome=process.env.JAVA_HOME;
if(!javaHome&&fs.existsSync(bundled))javaHome=path.join(bundled,fs.readdirSync(bundled)[0]);
const exe=n=>javaHome?path.join(javaHome,'bin',n+(process.platform==='win32'?'.exe':'')):n;
const harness=path.join(tmp,'UpdatePolicyCheck.java');fs.writeFileSync(harness,`package com.morongaming.forsakenrealm;
public class UpdatePolicyCheck {
 static void ok(boolean b,String message){if(!b)throw new AssertionError(message);}
 public static void main(String[] a){
  UpdateCheckPolicy p=new UpdateCheckPolicy();
  ok(p.begin(0,false),"first foreground checks");
  ok(!p.begin(1,true),"overlapping startup/resume/manual checks coalesce");
  ok(p.failure()==10000,"first failure retries after ten seconds");
  ok(p.begin(10000,true),"retry is not blocked for the whole app session");
  ok(p.failure()==30000,"second failure backs off");
  ok(p.begin(40000,true),"second retry runs");
  ok(p.failure()==-1,"stop repeated retries after third failure");
  p.foreground();ok(p.begin(100000,false),"returning to app checks again");p.success();
  ok(!p.begin(100001,false),"fast lifecycle changes do not duplicate requests");
  ok(p.begin(100001,true),"manual retry bypasses cooldown");p.success();
  ok(p.begin(160001,false),"next foreground check is allowed");
  ok(p.failure()==10000,"success resets failure backoff");
  System.out.println("PASS: foreground update checks, request coalescing, bounded retries and manual retry");
 }
}`);
function run(name,args){const r=spawnSync(exe(name),args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.error||name+' failed');if(r.stdout)process.stdout.write(r.stdout);}
try{run('javac',['-encoding','UTF-8','-d',tmp,path.join(root,'android/src/com/morongaming/forsakenrealm/UpdateCheckPolicy.java'),harness]);run('java',['-cp',tmp,'com.morongaming.forsakenrealm.UpdatePolicyCheck']);}finally{fs.rmSync(tmp,{recursive:true,force:true});}
