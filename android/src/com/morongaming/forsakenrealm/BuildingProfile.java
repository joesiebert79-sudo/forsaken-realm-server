package com.morongaming.forsakenrealm;
import org.json.JSONObject;
import java.util.Locale;
/** Presentation only. Does not create a shop, workstation, collision or safe zone. */
final class BuildingProfile {
 static String role(JSONObject b){
  String explicit=b.optString("role");
  if(explicit.equals("smithy")||explicit.equals("bank")||explicit.equals("workshop")||explicit.equals("merchant"))return explicit;
  String shop=b.optString("shop","").toLowerCase(Locale.ROOT);
  String identity=(b.optString("name")+" "+b.optString("style")).toLowerCase(Locale.ROOT);
  if(shop.contains("bank"))return "bank";
  if(shop.equals("smithy")||identity.contains("smith"))return "smithy";
  if(shop.equals("provisioner")||shop.equals("merchant"))return "merchant";
  if(shop.contains("workshop")||identity.contains("crafting workshop"))return "workshop";
  return "ordinary";
 }
 static boolean bandit(JSONObject b){return b.optString("faction").equals("bandit");}
 static String cacheKey(JSONObject b){return Math.floorMod(b.optString("id").hashCode(),20)+":"+b.optBoolean("rural")+":"+b.optString("style")+":"+b.optString("kind")+":"+b.optDouble("halfWidth",125)+":"+b.optDouble("depth",80)+":"+role(b)+":"+bandit(b)+":"+b.optString("name").contains("Tavern");}
 static String label(String shop){return shop.equals("Smithy")?"BLACKSMITH":shop.equals("Tavern")?"INN":shop.equals("Provisioner")?"MERCHANT":shop.toUpperCase(Locale.ROOT);}
}
