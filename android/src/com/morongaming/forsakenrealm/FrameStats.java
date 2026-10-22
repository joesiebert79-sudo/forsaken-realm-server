package com.morongaming.forsakenrealm;
import java.util.Arrays;
/** Bounded frame-interval sampling; no allocation in the drawing loop. */
final class FrameStats {
 private final long[] samples=new long[240];private int count,index;private long last;
 void frame(long now){if(last>0){long dt=now-last;if(dt>0&&dt<1000){samples[index++%samples.length]=dt;count=Math.min(count+1,samples.length);}}last=now;}
 String report(){if(count<30)return "Walk around first to collect at least 30 frames.";long[] copy=Arrays.copyOf(samples,count);Arrays.sort(copy);long total=0;for(long value:copy)total+=value;Runtime r=Runtime.getRuntime();return String.format(java.util.Locale.US,"Recent frame intervals (%d frames)\nAverage: %.1f FPS\nMedian: %d ms • 95th percentile: %d ms\nJava heap: %d / %d MiB\nIncludes frame scheduling; not GPU render time. Compare Low and High in the same scene.",count,1000.0*count/total,copy[count/2],copy[(int)Math.ceil(count*.95)-1],(r.totalMemory()-r.freeMemory())/1048576,r.maxMemory()/1048576);}
}
