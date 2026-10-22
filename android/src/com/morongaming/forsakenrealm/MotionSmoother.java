package com.morongaming.forsakenrealm;
import java.util.HashMap;
/** Render-only interpolation: never changes server positions or collision checks. */
final class MotionSmoother {
 private static final class Point {float sx,sy,x,y;long at,sampledAt;float interval=100,duration=100,gaitStart,gaitEnd;int frame;boolean left;final WalkCycle walk=new WalkCycle();}
 private final HashMap<String,Point> points=new HashMap<>();private String room="";private int frame;
 void begin(String nextRoom){if(!room.equals(nextRoom)){points.clear();room=nextRoom;}frame++;}
 private float blend(Point p,long now){return Math.max(0,Math.min(1,(now-p.at)/p.duration));}
 void accept(String id,float x,float y,long now){Point p=points.get(id);if(p==null){p=new Point();p.sx=p.x=x;p.sy=p.y=y;points.put(id,p);}else{long elapsed=now-p.sampledAt;p.sampledAt=now;p.frame=frame;if(x==p.x&&y==p.y){p.walk.sample(x,y,now);return;}float t=blend(p,now),sx=p.sx+(p.x-p.sx)*t,sy=p.sy+(p.y-p.sy)*t;float gait=p.gaitStart+(p.gaitEnd-p.gaitStart)*t;float travel=(float)Math.hypot(x-sx,y-sy);if(travel>180||now-p.at>350){sx=x;sy=y;travel=0;}p.gaitStart=gait;p.gaitEnd=gait+travel/9f;if(Math.abs((x-sx)-(y-sy))>.01f)p.left=(x-sx)-(y-sy)<0;if(elapsed>0&&elapsed<350)p.interval=p.interval*.75f+elapsed*.25f;p.duration=id.equals("you")?Math.max(80,Math.min(140,p.interval)):Math.max(80,Math.min(180,p.interval*1.05f));p.sx=sx;p.sy=sy;p.x=x;p.y=y;}p.at=now;p.sampledAt=now;p.frame=frame;p.walk.sample(x,y,now);}
 void end(){java.util.Iterator<Point> it=points.values().iterator();while(it.hasNext())if(it.next().frame!=frame)it.remove();}
 float x(String id,float fallback,long now){Point p=points.get(id);return p==null?fallback:p.sx+(p.x-p.sx)*blend(p,now);}
 float y(String id,float fallback,long now){Point p=points.get(id);return p==null?fallback:p.sy+(p.y-p.sy)*blend(p,now);}
 boolean moving(String id,long now){Point p=points.get(id);return p!=null&&p.walk.moving(now);}
 float phase(String id,long now){Point p=points.get(id);return p==null?0:p.walk.phase(now);}
 boolean facingLeft(String id){Point p=points.get(id);return p!=null&&p.left;}
 int size(){return points.size();}
}


