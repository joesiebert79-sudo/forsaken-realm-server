package com.morongaming.forsakenrealm;
/** Single touch owns repeating attacks; no queued burst after stalls. */
final class HoldAttack {
 private int pointer=-1;private long next;
 void press(int id,long now){pointer=id;next=now+150;}
 void release(int id){if(id==pointer)cancel();}
 void cancel(){pointer=-1;}
 boolean due(long now,boolean ready){if(pointer<0||!ready||now<next)return false;next=now+150;return true;}
}

