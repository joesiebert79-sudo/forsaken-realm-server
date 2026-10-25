import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {auditActors} from '../scripts/validate-actor-atlases.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(resolve(root,'references/phase-2-approved/actors.json')));
test('exact three user uploads remain unchanged, and no unapproved pilot counts as production animation',()=>{
 assert.deepEqual(manifest.references.map(r=>r.sha256),['0b5dc94b86464129ef5f1ede3f6d5512fb220c80deab9ea70b8ad770366ae113','45b4fc23ae88c020a4d011a1b0361de3b73c200cfa73dfc941dc49997c3f441c','47b547536e971356ec3e3fe97932b86598a9732a63a40eab5bd554344517580a']);
 const result=auditActors(root,manifest);assert.equal(result.approvedFrames,0);assert.equal(result.requiredFrames,18720);assert.equal(result.complete,false);assert.equal(result.entities.length,13);
 assert.equal(manifest.entities.find(e=>e.id==='warrior').runtimeId,'melee');assert.equal(manifest.entities.find(e=>e.id==='archer').runtimeId,'ranged');
});
test('incomplete and unreviewed atlases fail closed; source substitution is detected',()=>{
 const bad=structuredClone(manifest);bad.entities[0].status='approved-production';assert.throws(()=>auditActors(root,bad),/fidelity review/);
 bad.entities[0].review.approved=true;assert.throws(()=>auditActors(root,bad),/Incomplete/);
 const modified=structuredClone(manifest);modified.references[0].sha256='0'.repeat(64);assert.throws(()=>auditActors(root,modified),/fingerprint mismatch/);
 const draft=structuredClone(manifest);draft.entities[0].clips=[{}];assert.throws(()=>auditActors(root,draft),/Draft clips/);
});
test('compiled animation timing covers 16 headings, one-shot event replay, looping, turning and death/respawn',()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-animation-java-'));
 try{
  const file=join(dir,'AnimationCheck.java');writeFileSync(file,`package com.morongaming.forsakenrealm;class AnimationCheck{static void ok(boolean b){if(!b)throw new AssertionError();}public static void main(String[] args){
  int count=0;for(int n:AnimationTimeline.COUNTS)count+=n;ok(count==90);
  for(int d=0;d<16;d++){double a=d*Math.PI/8;ok(AnimationTimeline.direction(Math.cos(a),Math.sin(a))==d);}
  for(int a=0;a<8;a++){ok(AnimationTimeline.frame(a,-1)==0);int end=AnimationTimeline.frame(a,Long.MAX_VALUE);ok(end>=0&&end<AnimationTimeline.COUNTS[a]);}
  ok(AnimationTimeline.frame(0,2000)==0);ok(AnimationTimeline.frame(3,99999)==11);
  AnimationTimeline.State state=new AnimationTimeline.State();state.request(3,0,100,7);ok(state.startedAt==100);state.request(3,1,200,7);ok(state.startedAt==100);state.request(0,1,250,-1);ok(state.action==3);state.request(3,2,300,8);ok(state.startedAt==300);state.request(0,2,1400,-1);ok(state.action==0);
  state.request(5,2,1500,9);state.request(0,2,9999,-1);ok(state.action==5);ok(state.frame(9999)==11);state.respawn(10000,0);ok(state.action==0&&state.frame(10000)==0);
  double turned=AnimationTimeline.turn(Math.toRadians(179),Math.toRadians(-179),1,.1);ok(Math.abs(Math.atan2(Math.sin(turned-Math.toRadians(-179)),Math.cos(turned-Math.toRadians(-179))))<.00001);
  try{AnimationTimeline.direction(0,0);throw new AssertionError();}catch(IllegalArgumentException expected){}
 }}`);
  const exe=name=>process.env.JAVA_HOME?join(process.env.JAVA_HOME,'bin',name+(process.platform==='win32'?'.exe':'')):name;
  for(const [name,args]of [['javac',['-encoding','UTF-8','-d',dir,resolve(root,'android/src/com/morongaming/forsakenrealm/AnimationTimeline.java'),file]],['java',['-cp',dir,'com.morongaming.forsakenrealm.AnimationCheck']]]){const r=spawnSync(exe(name),args,{encoding:'utf8'});assert.equal(r.status,0,String(r.error||r.stderr));}
 }finally{rmSync(dir,{recursive:true,force:true});}
});
