package com.morongaming.forsakenrealm;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.InputFilter;
import android.text.InputType;
import android.view.MotionEvent;
import android.view.View;
import android.widget.EditText;
import org.json.JSONObject;
import java.util.Iterator;

/** Six separate, interactive screens drawn from the seven owner-approved pictures. */
final class SurvivorCreationView extends View {
 interface Host{
  void create(String name,String appearance,String faction,String profession,String companion);
  boolean additionalCharacter();boolean existingSurvivor();String status();String legacyProfession();
  JSONObject definition(String profession);JSONObject previewCharacter();String spawnTown(String faction);void back();
 }
 static final String[] CLASSES={"melee","ranged","mage","rogue","paladin","necromancer"};
 static final String[] CLASS_NAMES={"Warrior","Archer","Mage","Rogue","Paladin","Necromancer"};
 static final String[] PETS={"wolf","direWolf","warBear","raven","loneWolf","familiar"};
 static final String[] PET_NAMES={"Wolf","Dire Wolf","War Bear","Raven","Lone Wolf","Familiar"};
 private final Host host;private final Paint paint=new Paint(3);private int step=0,sex=-1,role=-1,companion=-1;
 private String name="",message="";private float downX,downY;private long changedStep;
 SurvivorCreationView(Context context,Host host){super(context);this.host=host;JSONObject saved=host.previewCharacter();if(saved!=null){name=saved.optString("characterName","");String look=saved.optString("appearance","");if(look.startsWith("female"))sex=1;else if(look.startsWith("male"))sex=0;}setContentDescription("Character creation, six separate steps: name, gender, class, companion, review, enter realm.");}
 String appearance(){JSONObject saved=host.previewCharacter();String old=saved==null?"":saved.optString("appearance","");return (sex==1?"female-":"male-")+(old.endsWith("-2")?"2":"1");}
 String profession(){return host.legacyProfession().isEmpty()?CLASSES[Math.max(0,role)]:host.legacyProfession();}
 String className(){if(!host.legacyProfession().isEmpty())return title(host.legacyProfession());return role<0?"Select a class":CLASS_NAMES[role];}
 String petName(){return companion<0?"Select a companion":PET_NAMES[companion];}
 String title(String value){return value.isEmpty()?value:Character.toUpperCase(value.charAt(0))+value.substring(1);}
 void back(){if(step>0){step--;invalidate();}else host.back();}
 private void text(Canvas canvas,String value,float x,float y,float size,int color){paint.setTypeface(android.graphics.Typeface.create("serif",0));paint.setTextSize(size);paint.setColor(color);canvas.drawText(value,x,y,paint);}
 private void dark(Canvas canvas,float x,float y,float w,float h){paint.setColor(0xf00b0b0c);canvas.drawRect(x,y,x+w,y+h,paint);}
 private void outline(Canvas canvas,float left,float top,float right,float bottom){paint.setColor(0xffffb864);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(6);canvas.drawRoundRect(new RectF(left,top,right,bottom),8,8,paint);paint.setStyle(Paint.Style.FILL);}
 private void navigationButton(Canvas canvas,float left,float top,float right,float bottom,String label){paint.setColor(0xee170f0d);canvas.drawRoundRect(new RectF(left,top,right,bottom),10,10,paint);paint.setColor(0xffd6a762);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(4);canvas.drawRoundRect(new RectF(left,top,right,bottom),10,10,paint);paint.setStyle(Paint.Style.FILL);paint.setTypeface(android.graphics.Typeface.create("serif",android.graphics.Typeface.BOLD));paint.setTextSize(26);paint.setColor(Color.WHITE);canvas.drawText(label,left+(right-left-paint.measureText(label))/2,top+(bottom-top)/2+9,paint);}
 @Override protected void onDraw(Canvas canvas){
  ApprovedMenuScenes.draw(canvas,this,step+2);
  canvas.save();canvas.scale(getWidth()/1672f,getHeight()/941f);
  if(step==0){dark(canvas,572,414,528,48);text(canvas,name.isEmpty()?"Tap to enter your name":name,585,449,27,name.isEmpty()?0xff98938b:0xfff4e9d3);dark(canvas,1053,473,56,27);text(canvas,name.length()+"/20",1060,493,18,0xfff4e9d3);}
  if(step==1&&sex>=0)outline(canvas,sex==0?401:850,245,sex==0?818:1264,677);
  if(step==2&&role>=0)outline(canvas,72+role*255,344,317+role*255,690);
  if(step==3&&companion>=0)outline(canvas,37+companion*221,377,255+companion*221,714);
  if(step>=4){
   float x=step==4?116:95,y=step==4?331:300,w=step==4?338:326;
   dark(canvas,x,y,w,step==4?298:247);
   text(canvas,"NAME",x+18,y+24,19,0xffe7c797);text(canvas,name,x+18,y+50,23,Color.WHITE);
   text(canvas,"GENDER",x+18,y+88,19,0xffe7c797);text(canvas,sex==1?"Female":"Male",x+18,y+115,23,Color.WHITE);
   text(canvas,"CLASS",x+18,y+151,19,0xffe7c797);text(canvas,className(),x+18,y+178,23,Color.WHITE);
   text(canvas,"COMPANION",x+18,y+215,19,0xffe7c797);text(canvas,petName(),x+18,y+242,23,Color.WHITE);
   if(step==4){dark(canvas,1312,341,244,304);text(canvas,"STARTING GEAR",1323,366,20,0xffe7c797);JSONObject d=host.definition(profession()),kit=d==null?null:d.optJSONObject("items");if(kit!=null){Iterator<String> ids=kit.keys();int row=0;while(ids.hasNext()&&row<6){String id=ids.next();text(canvas,"• "+MenuArt.get(getContext()).name(id),1322,407+row*37,19,Color.WHITE);row++;}}}
  }
  if(step>0){dark(canvas,122,800,1440,45);if(!name.isEmpty())text(canvas,name,150,832,18,0xffe9dfc9);if(sex>=0)text(canvas,sex==1?"Female":"Male",414,832,18,0xffe9dfc9);if(role>=0||!host.legacyProfession().isEmpty())text(canvas,className(),674,832,18,0xffe9dfc9);if(companion>=0)text(canvas,petName(),923,832,18,0xffe9dfc9);}
  if(!message.isEmpty()){dark(canvas,560,699,560,41);text(canvas,message,583,728,21,0xffffae99);}
  if(step==0)navigationButton(canvas,34,865,266,930,"‹  BACK");
  if(step>=1&&step<=4)navigationButton(canvas,1360,865,1640,930,"NEXT  ›");
  canvas.restore();
 }
 private void editName(){EditText input=new EditText(getContext());input.setSingleLine(true);input.setText(name);input.setSelection(input.length());input.setFilters(new InputFilter[]{new InputFilter.LengthFilter(20)});input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_CAP_WORDS);new AlertDialog.Builder(getContext()).setTitle("Enter your character name").setView(input).setPositiveButton("Save",(dialog,which)->{String value=input.getText().toString().trim();if(value.matches("[\\p{L}\\p{N} '-]{1,20}")){name=value;message="";}else message="Use 1–20 letters, numbers, spaces, ' or -";invalidate();}).setNegativeButton("Cancel",null).show();}
 private boolean ready(){if(step==0)return name.matches("[\\p{L}\\p{N} '-]{1,20}");if(step==1)return sex>=0;if(step==2)return role>=0||!host.legacyProfession().isEmpty();if(step==3)return companion>=0;return true;}
 private void next(){if(!ready()){message=step==0?"Enter a name to continue":step==1?"Choose male or female":step==2?"Choose a class":"Choose a companion";invalidate();return;}message="";if(step<5){step++;changedStep=android.os.SystemClock.elapsedRealtime();invalidate();}else if(android.os.SystemClock.elapsedRealtime()-changedStep>=250){host.create(name,appearance(),"survivor",profession(),PETS[companion]);}}
 @Override public boolean performClick(){super.performClick();return true;}
 @Override public boolean onTouchEvent(MotionEvent event){float x=ApprovedMenuScenes.x(this,event.getX()),y=ApprovedMenuScenes.y(this,event.getY());if(event.getActionMasked()==MotionEvent.ACTION_DOWN){downX=x;downY=y;return true;}if(event.getActionMasked()!=MotionEvent.ACTION_UP)return true;if(Math.hypot(x-downX,y-downY)>24)return true;performClick();
  if(step==0){if(x<=280&&y>=842){back();return true;}if(x>=552&&x<=1120&&y>=392&&y<=483){editName();return true;}if(x>=650&&x<=1035&&y>=558&&y<=658)next();return true;}
  if(y>=842&&x<=280){back();return true;}
  if(step==1&&y>=250&&y<=678){if(x>=393&&x<=822)sex=0;else if(x>=846&&x<=1273)sex=1;}
  if(step==2&&y>=341&&y<=701&&x>=67&&x<=1617)role=Math.min(5,(int)((x-67)/257));
  if(step==3&&y>=371&&y<=720&&x>=29&&x<=1370)companion=Math.min(5,(int)((x-29)/223));
  if(step==4&&x>=161&&x<=407&&y>=630&&y<=682){step=0;invalidate();return true;}
  if(step==5){if(x>=630&&x<=1055&&y>=845)next();}
  else if(x>=1320&&x<=1640&&y>=841)next();
  invalidate();return true;
 }
}
