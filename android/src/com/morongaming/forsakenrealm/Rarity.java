package com.morongaming.forsakenrealm;
import org.json.JSONObject;
final class Rarity {
 private static final String[] NAMES={"Common","Uncommon","Rare","Epic","Legendary"};
 private static final int[] COLORS={0xffd0d4cf,0xff90d895,0xff83bbf5,0xffcd9ff0,0xffffcb6b};
 static int level(JSONObject item){return Math.max(1,Math.min(5,item==null?1:item.optInt("rarity",1)));}
 static String name(int level){return NAMES[Math.max(0,Math.min(4,level-1))];}
 static int color(int level){return COLORS[Math.max(0,Math.min(4,level-1))];}
}

