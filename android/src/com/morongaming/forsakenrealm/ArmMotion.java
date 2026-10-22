package com.morongaming.forsakenrealm;
/** Pose math only: no changes to combat timing or damage. */
final class ArmMotion {
 static float attackWeight(float phase){if(phase<=0||phase>=1)return 0;float s=(float)Math.sin(Math.PI*phase);return s*s;}
 static float elbowBend(float distance){return (float)Math.sqrt(Math.max(0,16*16-distance*distance*.25f));}
}
