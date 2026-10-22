package com.morongaming.forsakenrealm;
/** Stable ranged lock; invalid, occluded, protected and out-of-range targets cannot be selected. */
final class TargetLock {
 static int choose(String retained,String[] ids,double[] distances,boolean[] eligible,double range){
  int nearest=-1;double best=range+.001;
  for(int i=0;i<ids.length;i++){if(!eligible[i]||distances[i]>range+.001)continue;if(!retained.isEmpty()&&retained.equals(ids[i]))return i;if(distances[i]<best){best=distances[i];nearest=i;}}
  return nearest;
 }
}

