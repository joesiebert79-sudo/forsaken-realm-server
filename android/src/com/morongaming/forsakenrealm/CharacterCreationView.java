package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;
/** Four image-led steps, all fitted to the viewport. */
final class CharacterCreationView extends View {
 interface Host {void create(String appearance,String faction,String profession);String status();String legacyProfession();}
 private final Host host;private final MenuArt art;private final Paint paint=new Paint(3);private int step=0,sex=-1,body=-1,profession=-1,faction=-1;private float scale=1,left,top;
 CharacterCreationView(Context c,Host h){super(c);host=h;art=MenuArt.get(c);setContentDescription("Choose sex, body style, profession and faction");}
 private String appearance(int gender,int build){return (gender==1?"female-":"male-")+(build==1?"2":"1");}
 private int selected(){return step==0?sex:step==1?body:step==2?profession:faction;}
 private void text(Canvas c,String s,float x,float y,int size,int color){paint.setColor(color);paint.setTextSize(size);c.drawText(s,x,y,paint);}
 protected void onDraw(Canvas c){scale=Math.min(getWidth()/960f,getHeight()/540f);left=(getWidth()-960*scale)/2;top=(getHeight()-540*scale)/2;MenuArt.get(getContext()).backdrop(c);c.save();c.translate(left,top);c.scale(scale,scale);
 text(c,"CREATE YOUR CHARACTER",28,40,26,0xffead9b9);String[] steps={"Male / Female","Body style","Starting role","Faction"};for(int i=0;i<4;i++)text(c,(i+1)+"  "+steps[i],28+i*235,75,17,i==step?0xffffdf91:0xff89998a);
 boolean legacy=!host.legacyProfession().isEmpty();String[] labels=step==0?new String[]{"Male","Female"}:step==1?new String[]{"Lean","Sturdy"}:step==2?(legacy?new String[]{"Keep "+host.legacyProfession()}:new String[]{"Farmer • Dog","Hunter • Wolf"}):new String[]{"Survivor","Bandit"};float width=880f/labels.length;
 for(int i=0;i<labels.length;i++){float x=40+i*width;paint.setColor(i==selected()?0xff7b6339:0xff29362b);c.drawRoundRect(x,98,x+width-12,354,9,9,paint);if(step<2){art.survivor(c,appearance(step==0?i:sex,step==1?i:0),"",new RectF(x+30,107,x+width-42,307));}else if(step==2&&!legacy){art.role(c,i,new RectF(x+12,108,x+width-24,284));text(c,i==0?"Axe, sickle, seeds, food and water":"Bow, arrows, food and water",x+18,308,15,0xffdfd9c7);}else if(step==2){art.survivor(c,appearance(sex,body),"",new RectF(x+100,110,x+width-112,300));}else{art.survivor(c,appearance(sex,body),"",new RectF(x+18,110,x+145,303));text(c,i==0?"Ashenhold":"Bloodhaven",x+175,179,23,0xffead9b9);text(c,"Protected starting town",x+175,219,17,0xffc5c7ba);text(c,i==0?"Survivor allegiance":"Bandit allegiance",x+175,255,17,0xffc5c7ba);}text(c,labels[i],x+18,337,22,0xffffe5b5);}
 text(c,step<2?"Appearance only: both body styles have equal base stats.":step==2?(legacy?"Your existing profession, equipment and companion are retained.":"Your role determines your starting gear and companion."):"Your faction determines which safe towns you may enter.",28,384,17,0xffc5c7ba);
 paint.setColor(0xff384237);c.drawRect(40,408,210,474,paint);text(c,"BACK",90,449,19,Color.WHITE);paint.setColor(selected()<0?0xff384237:0xff80683b);c.drawRect(600,408,920,474,paint);text(c,step==3?"CONFIRM CHARACTER":"CONTINUE",630,449,19,Color.WHITE);String status=host.status();text(c,status.length()>108?status.substring(0,108):status,28,515,14,0xffdac9a6);c.restore();}
 public boolean onTouchEvent(MotionEvent e){if(e.getActionMasked()!=MotionEvent.ACTION_UP)return true;float x=(e.getX()-left)/scale,y=(e.getY()-top)/scale;int count=step==2&&!host.legacyProfession().isEmpty()?1:2;if(y>=98&&y<=354&&x>=40&&x<920){int choice=(int)((x-40)/(880f/count));if(step==0)sex=choice;else if(step==1)body=choice;else if(step==2)profession=choice;else faction=choice;}if(y>=408&&y<=474){if(x>=40&&x<=210&&step>0)step--;else if(x>=600&&x<=920&&selected()>=0){if(step<3)step++;else host.create(appearance(sex,body),faction==0?"survivor":"bandit",host.legacyProfession().isEmpty()?(profession==0?"farmer":"hunter"):host.legacyProfession());}}invalidate();return true;}
}


