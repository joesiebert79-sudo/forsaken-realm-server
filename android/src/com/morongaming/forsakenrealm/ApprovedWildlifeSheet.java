package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/** Exact crops of the owner-approved wildlife sheet, pending animation frames. */
final class ApprovedWildlifeSheet {
 private static Bitmap sheet;
 private static final Paint paint=new Paint(Paint.FILTER_BITMAP_FLAG);
 private static final Map<String,Rect> crops=new HashMap<>();
 private static void row(String names,int[] edges,int top,int bottom){String[] ids=names.split(" ");for(int i=0;i<ids.length;i++)crops.put(ids[i],new Rect(edges[i],top,edges[i+1],bottom));}
 static {
  row("deer doe fawn elk wildBoar fox rabbit squirrel badger raccoon",new int[]{18,144,268,388,584,752,918,1040,1172,1375,1516},147,265);
  row("mountainGoat ibex bighornSheep bear snowBear wolf snowWolf lynx mountainLion",new int[]{18,197,348,524,719,898,1033,1197,1345,1518},350,465);
  row("bison cow bull horse wildHorse plainsElk antelope pronghorn coyote prairieDog",new int[]{17,178,304,455,615,733,869,998,1124,1393,1515},535,660);
  row("beaver otter muskrat duck goose crane heron turkey",new int[]{18,135,255,369,479,601,700,790,909},733,825);
  row("trout salmon pike bass catfish",new int[]{931,1059,1176,1299,1403,1519},749,821);
  row("cougar bobcat javelina desertBighorn roadrunner rattlesnake lizard scorpion",new int[]{17,147,257,350,462,589,697,788,884},900,988);
  row("moose blackBear albinoDeer redFox goldenEagle",new int[]{908,1037,1155,1270,1371,1517},895,990);
  crops.put("coyote",new Rect(1124,535,1249,660));
 }
 static void load(Context context){if(sheet!=null)return;try(InputStream stream=context.getAssets().open("approved-wildlife-reference.png")){BitmapFactory.Options options=new BitmapFactory.Options();options.inPreferredConfig=Bitmap.Config.ARGB_8888;sheet=BitmapFactory.decodeStream(stream,null,options);}catch(Exception ignored){}}
 static boolean draw(Canvas canvas,JSONObject animal,long renderTime){if(sheet==null||animal==null)return false;Rect source=crops.get(animal.optString("species"));if(source==null)return false;
  float width=animal.optString("species").matches("(?:bear|snowBear|blackBear|bison|elk|plainsElk|moose|wildBoar|horse|wildHorse)")?86:66;
  float height=width*source.height()/source.width();float bob=animal.optLong("lastMoveAt")>0&&renderTime-animal.optLong("lastMoveAt")<300?(float)Math.sin(renderTime*.018)*2:0;
  canvas.save();if(animal.optDouble("direction")>Math.PI/2&&animal.optDouble("direction")<Math.PI*1.5)canvas.scale(-1,1);
  canvas.clipRect(-width/2,-height-23,width/2,0);paint.setColor(Color.WHITE);canvas.drawBitmap(sheet,source,new RectF(-width/2,-height-23+bob,width/2,-23+bob),paint);canvas.restore();
  paint.setColor(0xbbe9d6ab);paint.setTextSize(9);String name=animal.optString("species");canvas.drawText(name,-Math.min(24,name.length()*2.2f),-height-25,paint);paint.setColor(Color.WHITE);
  return true;
 }
 private ApprovedWildlifeSheet(){}
}
