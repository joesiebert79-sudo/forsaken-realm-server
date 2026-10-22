package com.morongaming.forsakenrealm;
/** Sprint touch ownership is independent of movement and attack fingers. */
final class SprintInput {
 private boolean active;private int pointer=-1;
 boolean active(){return active;}
 void press(int id,boolean toggle){if(toggle){active=!active;pointer=-1;}else{active=true;pointer=id;}}
 void release(int id){if(id==pointer){active=false;pointer=-1;}}
 void cancel(){active=false;pointer=-1;}
}

