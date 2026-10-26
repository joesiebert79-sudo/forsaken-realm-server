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
 private final Host host;private final Paint paint=new Paint(3);private int step=0,sex=-1,role=-1,companion=-1,faction=-1;
 private String name="",message="";private float downX,downY;private long changedStep;
 SurvivorCreationView(Context context,Host host){super(context);this.host=host;JSONObject saved=host.previewCharacter();if(saved!=null){name=saved.optString("characterName","");String look=saved.optString("appearance","");if(look.startsWith("female"))sex=1;else if(look.startsWith("male"))sex=0;String side=saved.optString("faction","");if(side.equals("survivor"))faction=0;else if(side.equals("bandit"))faction=1;}setContentDescription("Character creation, six steps: name, gender, class, companion, allegiance, enter realm.");}
 String appearance(){JSONObject saved=host.previewCharacter();String old=saved==null?"":saved.optString("appearance","");return (sex==1?"female-":"male-")+(old.endsWith("-2")?"2":"1");}
 String profession(){return host.legacyProfession().isEmpty()?CLASSES[Math.max(0,role)]:host.legacyProfession();}
 String className(){if(!host.legacyProfession().isEmpty())return title(host.legacyProfession());return role<0?"Select a class":CLASS_NAMES[role];}
 String petName(){return companion<0?"Select a companion":PET_NAMES[companion];}
 String factionId(){return faction==1?"bandit":"survivor";}
 String factionName(){return faction==1?"Bandits":faction==0?"Allies":"Choose allegiance";}
 String title(String value){return value.isEmpty()?value:Character.toUpperCase(value.charAt(0))+value.substring(1);}
 void back(){if(step>0){step--;invalidate();}else host.back();}
 private void text(Canvas canvas,String value,float x,float y,float size,int color){paint.setTypeface(android.graphics.Typeface.create("serif",0));paint.setTextSize(size);paint.setColor(color);canvas.drawText(value,x,y,paint);}
 private void dark(Canvas canvas,float x,float y,float w,float h){paint.setColor(0xf00b0b0c);canvas.drawRect(x,y,x+w,y+h,paint);}
 private void outline(Canvas canvas,float left,float top,float right,float bottom){paint.setColor(0xffffb864);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(6);canvas.drawRoundRect(new RectF(left,top,right,bottom),8,8,paint);paint.setStyle(Paint.Style.FILL);}
 private void navigationButton(Canvas canvas,float left,float top,float right,float bottom,String label){paint.setColor(0xee170f0d);canvas.drawRoundRect(new RectF(left,top,right,bottom),10,10,paint);paint.setColor(0xffd6a762);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(4);canvas.drawRoundRect(new RectF(left,top,right,bottom),10,10,paint);paint.setStyle(Paint.Style.FILL);paint.setTypeface(android.graphics.Typeface.create("serif",android.graphics.Typeface.BOLD));paint.setTextSize(26);paint.setColor(Color.WHITE);canvas.drawText(label,left+(right-left-paint.measureText(label))/2,top+(bottom-top)/2+9,paint);}
 private void chosenPreview(Canvas canvas){
  float left=step==4?547:441,right=step==4?1125:1223,top=step==4?247:260,bottom=step==4?745:710;
  dark(canvas,left,top,right-left,bottom-top);outline(canvas,left,top,right,bottom);
  text(canvas,"YOUR CLASS & COMPANION",left+33,top+43,22,0xffe7c797);
  try{
   ApprovedReferenceSprites.load(getContext());
   JSONObject hero=new JSONObject().put("role",profession()).put("appearance",appearance());
   JSONObject pet=new JSONObject().put("kind",PETS[companion]);
   float middle=(left+right)/2;
   ClassSprites.preview(canvas,hero,new RectF(left+33,top+60,middle-10,bottom-66));
   CompanionSprites.preview(canvas,pet,new RectF(middle+10,top+60,right-33,bottom-66));
   text(canvas,className(),left+45,bottom-27,23,Color.WHITE);
   text(canvas,petName(),middle+16,bottom-27,23,Color.WHITE);
  }catch(org.json.JSONException ignored){}
 }
 @Override protected void onDraw(Canvas canvas){
  ApprovedMenuScenes.draw(canvas,this,step+2);
  ApprovedMenuScenes.beginOverlay(canvas,this,step+2);
  if(step==0){dark(canvas,572,414,528,48);text(canvas,name.isEmpty()?"Tap to enter your name":name,585,449,27,name.isEmpty()?0xff98938b:0xfff4e9d3);dark(canvas,1053,473,56,27);text(canvas,name.length()+"/20",1060,493,18,0xfff4e9d3);}
  if(step==1&&sex>=0)outline(canvas,sex==0?401:850,245,sex==0?818:1264,677);
  if(step==2&&role>=0)outline(canvas,72+role*255,344,317+role*255,690);
  if(step==3&&companion>=0)outline(canvas,37+companion*221,377,255+companion*221,714);
  if(step>=4&&companion>=0)chosenPreview(canvas);
  if(step==4){
   if(faction>=0)outline(canvas,faction==0?80:1167,257,faction==0?507:1598,773);
   dark(canvas,530,843,615,35);text(canvas,name+"   |   "+(sex==1?"Female":"Male")+"   |   "+className()+"   |   "+petName(),575,870,20,Color.WHITE);
  }
  if(step==5){
   dark(canvas,166,309,227,351);
   text(canvas,name,170,346,21,Color.WHITE);text(canvas,sex==1?"Female":"Male",170,407,21,Color.WHITE);
   text(canvas,className(),170,468,21,Color.WHITE);text(canvas,petName(),170,529,21,Color.WHITE);
   text(canvas,"ALLEGIANCE",170,583,17,0xffe7c797);text(canvas,factionName(),170,613,21,Color.WHITE);
   dark(canvas,153,818,117,27);text(canvas,name,160,839,16,Color.WHITE);
   dark(canvas,385,818,143,27);text(canvas,sex==1?"Female":"Male",397,839,16,Color.WHITE);
   dark(canvas,669,818,102,27);text(canvas,className(),676,839,16,Color.WHITE);
   dark(canvas,890,818,164,27);text(canvas,petName(),895,839,16,Color.WHITE);
   dark(canvas,1152,818,105,27);text(canvas,factionName(),1157,839,16,Color.WHITE);
  }
  if(step>0&&step<4){dark(canvas,122,800,1440,45);if(!name.isEmpty())text(canvas,name,150,832,18,0xffe9dfc9);if(sex>=0)text(canvas,sex==1?"Female":"Male",414,832,18,0xffe9dfc9);if(role>=0||!host.legacyProfession().isEmpty())text(canvas,className(),674,832,18,0xffe9dfc9);if(companion>=0)text(canvas,petName(),923,832,18,0xffe9dfc9);}
  if(!message.isEmpty()){dark(canvas,560,699,560,41);text(canvas,message,583,728,21,0xffffae99);}
  if(step==0)navigationButton(canvas,34,865,266,930,"‹  BACK");
  // The approved gender, companion and review pictures already contain their buttons.
  if(step==2)navigationButton(canvas,1360,865,1640,930,"NEXT  ›");
  canvas.restore();
 }
 private void editName(){EditText input=new EditText(getContext());input.setSingleLine(true);input.setText(name);input.setSelection(input.length());input.setFilters(new InputFilter[]{new InputFilter.LengthFilter(20)});input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_CAP_WORDS);new AlertDialog.Builder(getContext()).setTitle("Enter your character name").setView(input).setPositiveButton("Save",(dialog,which)->{String value=input.getText().toString().trim();if(value.matches("[\\p{L}\\p{N} '-]{1,20}")){name=value;message="";}else message="Use 1–20 letters, numbers, spaces, ' or -";invalidate();}).setNegativeButton("Cancel",null).show();}
 private boolean ready(){if(step==0)return name.matches("[\\p{L}\\p{N} '-]{1,20}");if(step==1)return sex>=0;if(step==2)return role>=0||!host.legacyProfession().isEmpty();if(step==3)return companion>=0;if(step==4)return faction>=0;return true;}
 private void next(){if(!ready()){message=step==0?"Enter a name to continue":step==1?"Choose male or female":step==2?"Choose a class":step==3?"Choose a companion":"Choose Allies or Bandits";invalidate();return;}message="";if(step<5){step++;changedStep=android.os.SystemClock.elapsedRealtime();invalidate();}else if(android.os.SystemClock.elapsedRealtime()-changedStep>=250){host.create(name,appearance(),factionId(),profession(),PETS[companion]);}}
 @Override public boolean performClick(){super.performClick();return true;}
 @Override public boolean onTouchEvent(MotionEvent event){float x=ApprovedMenuScenes.x(this,event.getX(),step+2),y=ApprovedMenuScenes.y(this,event.getY(),step+2);if(event.getActionMasked()==MotionEvent.ACTION_DOWN){downX=x;downY=y;return true;}if(event.getActionMasked()!=MotionEvent.ACTION_UP)return true;if(Math.hypot(x-downX,y-downY)>24)return true;performClick();
  if(step==0){if(x<=280&&y>=842){back();return true;}if(x>=552&&x<=1120&&y>=392&&y<=483){editName();return true;}if(x>=650&&x<=1035&&y>=558&&y<=658)next();return true;}
  if(y>=842&&x<=280){back();return true;}
  if(step==1&&y>=250&&y<=678){if(x>=393&&x<=822)sex=0;else if(x>=846&&x<=1273)sex=1;}
  if(step==2&&y>=341&&y<=701&&x>=67&&x<=1617)role=Math.min(5,(int)((x-67)/257));
  if(step==3&&y>=371&&y<=720&&x>=29&&x<=1370)companion=Math.min(5,(int)((x-29)/223));
  if(step==4&&y>=250&&y<=800){if(x>=70&&x<=515)faction=0;else if(x>=1155&&x<=1605)faction=1;}
  if(step==5){if(x>=630&&x<=1055&&y>=845)next();}
  else if(x>=1320&&x<=1640&&y>=841)next();
  invalidate();return true;
 }
}
