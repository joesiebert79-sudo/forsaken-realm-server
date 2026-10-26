package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.MotionEvent;
import android.view.View;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Owner-approved Chronicles artwork and the first three manuscript chapters. */
final class ChroniclesView extends View {
 interface Host { void closeChronicles(); }
 private static final String[] FILES={"chapter-1.md","chapter-2.md","chapter-3.md"};
 private static final String[] TITLES={"Before the World Was Forsaken","The Crown That Remembered","The Names Beneath the Stone"};
 private final Host host;
 private final Paint paint=new Paint(3);
 private final List<List<String>> chapters=new ArrayList<>();
 private final List<List<String>> pages=new ArrayList<>();
 private Bitmap artwork;
 private TextToSpeech speech;
 private int chapter=-1,page=0;
 private boolean talking=false,speechReady=false;
 private float downX,downY;
 ChroniclesView(Context context,Host host){
  super(context);this.host=host;
  try(InputStream in=context.getAssets().open("menu/chronicles-approved.png")){
   BitmapFactory.Options opt=new BitmapFactory.Options();opt.inPreferredConfig=Bitmap.Config.RGB_565;
   artwork=BitmapFactory.decodeStream(in,null,opt);
  }catch(Exception ignored){}
  for(String file:FILES)chapters.add(readChapter(file));
  chapter=context.getSharedPreferences("chronicles",0).getInt("chapter",-1);
  if(chapter<0||chapter>=3)chapter=-1;
  page=context.getSharedPreferences("chronicles",0).getInt("page",0);
  if(chapter>=0)paginate(chapter);
  setContentDescription("Forsaken Realm Chronicles. Three chapters available.");
 }
 private List<String> readChapter(String file){
  List<String> paragraphs=new ArrayList<>();
  try(BufferedReader in=new BufferedReader(new InputStreamReader(getContext().getAssets().open("chronicles/"+file),"UTF-8"))){
   String line;StringBuilder p=new StringBuilder();
   while((line=in.readLine())!=null){
    line=line.trim();
    if(line.startsWith("#")||line.startsWith("---")||line.startsWith("**Living manuscript")||line.startsWith("This manuscript preserves")||line.startsWith("*Editorial")||line.startsWith("*Working future")||line.startsWith("*This passage"))continue;
    if(line.isEmpty()){if(p.length()>0){paragraphs.add(p.toString());p.setLength(0);}continue;}
    if(p.length()>0)p.append(' ');p.append(line.replace("*",""));
   }
   if(p.length()>0)paragraphs.add(p.toString());
  }catch(Exception ignored){}
  return paragraphs;
 }
 private void paginate(int selected){
  pages.clear();List<String> current=new ArrayList<>();
  paint.setTypeface(android.graphics.Typeface.create("serif",0));paint.setTextSize(24);
  int lines=0;
  for(String paragraph:chapters.get(selected)){
   String[] words=paragraph.split("\\s+");StringBuilder line=new StringBuilder();
   for(String word:words){
    String candidate=line.length()==0?word:line+" "+word;
    if(paint.measureText(candidate)>570&&line.length()>0){
     if(lines>=15){pages.add(current);current=new ArrayList<>();lines=0;}
     current.add(line.toString());lines++;line.setLength(0);
    }
    if(line.length()>0)line.append(' ');line.append(word);
   }
   if(line.length()>0){if(lines>=15){pages.add(current);current=new ArrayList<>();lines=0;}current.add(line.toString());lines++;}
   if(lines>=15){pages.add(current);current=new ArrayList<>();lines=0;}
   else {current.add("");lines++;}
  }
  if(!current.isEmpty())pages.add(current);
  page=Math.max(0,Math.min(page,Math.max(0,pages.size()-1)));
 }
 private void save(){getContext().getSharedPreferences("chronicles",0).edit().putInt("chapter",chapter).putInt("page",page).apply();}
 private void open(int index){stopSpeech();chapter=index;page=0;paginate(index);save();invalidate();}
 private void index(){stopSpeech();chapter=-1;page=0;save();invalidate();}
 private void turn(int direction){if(chapter<0)return;int spread=(page/2)*2;int next=Math.max(0,Math.min(Math.max(0,pages.size()-1),spread+direction*2));if(next!=page){stopSpeech();page=next;save();invalidate();}}
 private String pageText(){if(chapter<0||pages.isEmpty())return "";StringBuilder s=new StringBuilder();for(String line:pages.get(page)){if(line.isEmpty())s.append("\n");else s.append(line).append(' ');}return s.toString().trim();}
 private void speak(){
  if(chapter<0)return;
  if(speech==null){
   speech=new TextToSpeech(getContext(),status->{speechReady=status==TextToSpeech.SUCCESS;if(speechReady){speech.setLanguage(Locale.US);post(this::speakPage);}});
  }else if(speechReady)speakPage();
  talking=true;invalidate();
 }
 private void speakPage(){
  if(!talking||!speechReady)return;
  speech.setOnUtteranceProgressListener(new UtteranceProgressListener(){
   @Override public void onStart(String id){}
   @Override public void onError(String id){}
   @Override public void onDone(String id){post(()->{if(!talking||chapter<0)return;if(page+1<pages.size()){page++;save();invalidate();speakPage();}else{talking=false;invalidate();}});}
  });
  speech.speak(pageText(),TextToSpeech.QUEUE_FLUSH,null,"chronicles-"+chapter+"-"+page);
 }
 private void stopSpeech(){talking=false;if(speech!=null)speech.stop();invalidate();}
 void pauseNarration(){stopSpeech();}
 void release(){stopSpeech();if(speech!=null){speech.shutdown();speech=null;}if(artwork!=null){artwork.recycle();artwork=null;}}
 @Override protected void onDraw(Canvas canvas){
  canvas.drawColor(Color.BLACK);
  if(artwork!=null){paint.setColor(Color.WHITE);canvas.drawBitmap(artwork,null,new RectF(0,0,getWidth(),getHeight()),paint);}
  canvas.save();canvas.scale(getWidth()/1536f,getHeight()/1024f);
  if(chapter<0){
   paint.setTypeface(android.graphics.Typeface.create("serif",1));paint.setTextSize(21);
   paint.setColor(0xffe1bd77);
   canvas.drawText("CHAPTERS I–III AVAILABLE",1040,944,paint);
  }else{
   paint.setColor(0xffdec5a0);canvas.drawRoundRect(new RectF(170,190,744,840),10,10,paint);
   canvas.drawRoundRect(new RectF(796,190,1370,840),10,10,paint);
   paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(3);paint.setColor(0xff75502f);
   canvas.drawRoundRect(new RectF(170,190,744,840),10,10,paint);canvas.drawRoundRect(new RectF(796,190,1370,840),10,10,paint);paint.setStyle(Paint.Style.FILL);
   paint.setColor(0xff382015);paint.setTypeface(android.graphics.Typeface.create("serif",1));paint.setTextSize(23);
   canvas.drawText("CHAPTER "+(chapter+1)+" — "+TITLES[chapter],198,232,paint);
   paint.setTextSize(22);canvas.drawText("THE FORSAKEN REALM CHRONICLES",825,232,paint);
   paint.setTypeface(android.graphics.Typeface.create("serif",0));paint.setTextSize(24);
   int spread=(page/2)*2;
   for(int side=0;side<2;side++){
    int number=spread+side;if(number>=pages.size())continue;
    int x=side==0?198:825,y=287;
    for(String line:pages.get(number)){canvas.drawText(line,x,y,paint);y+=31;}
    paint.setTextSize(19);canvas.drawText("Page "+(number+1)+" of "+pages.size(),x,801,paint);paint.setTextSize(24);
   }
   paint.setColor(0xfff2dcae);paint.setTypeface(android.graphics.Typeface.create("serif",1));paint.setTextSize(25);
   canvas.drawText("◀ PREVIOUS",330,900,paint);canvas.drawText("NEXT ▶",1120,900,paint);
   canvas.drawText(talking?"PAUSE":"READ ALOUD",570,900,paint);canvas.drawText("REPLAY",850,900,paint);
   canvas.drawText("CONTENTS",1280,966,paint);
  }
  paint.setColor(0xfff2dcae);paint.setTypeface(android.graphics.Typeface.create("serif",1));paint.setTextSize(25);
  canvas.drawText("BACK",75,966,paint);
  canvas.restore();
 }
 @Override public boolean performClick(){super.performClick();return true;}
 @Override public boolean onTouchEvent(MotionEvent event){
  float x=event.getX()*1536f/Math.max(1,getWidth()),y=event.getY()*1024f/Math.max(1,getHeight());
  if(event.getActionMasked()==MotionEvent.ACTION_DOWN){downX=x;downY=y;return true;}
  if(event.getActionMasked()!=MotionEvent.ACTION_UP)return true;
  if(Math.hypot(x-downX,y-downY)>35)return true;
  performClick();
  if(x<190&&y>895){if(chapter<0)host.closeChronicles();else index();return true;}
  if(chapter<0){if(x>=205&&x<=700){if(y>=400&&y<475)open(0);else if(y>=475&&y<540)open(1);else if(y>=540&&y<605)open(2);}}
  else if(y>=860&&y<935){if(x<510)turn(-1);else if(x<805){if(talking)stopSpeech();else speak();}else if(x<1030){stopSpeech();speak();}else turn(1);}
  else if(y>=935&&x>1180)index();
  return true;
 }
}
