import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';
test('Android map heading matches authoritative XY displacement; frame sampler reports measured intervals',()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-java-'));try{
 const src=fileURLToPath(new URL('../android/src/com/morongaming/forsakenrealm/',import.meta.url));
 writeFileSync(join(dir,'Check.java'),`package com.morongaming.forsakenrealm;public class Check{public static void main(String[] a){MapHeading h=new MapHeading();h.record(0,0,"");h.record(20,0,"");if(h.degrees!=90)throw new Error("east");h.record(20,-20,"");if(h.degrees!=0)throw new Error("north");h.record(500,500,"room");if(h.degrees!=0)throw new Error("door changed heading");FrameStats f=new FrameStats();for(int i=0;i<50;i++)f.frame(1000+i*33);if(!f.report().contains("30.3 FPS"))throw new Error(f.report());}}`);
 const compile=spawnSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-d',dir,src+'MapHeading.java',src+'FrameStats.java',join(dir,'Check.java')],{encoding:'utf8'});assert.equal(compile.status,0,compile.stderr);const run=spawnSync('java',['-cp',dir,'com.morongaming.forsakenrealm.Check'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
