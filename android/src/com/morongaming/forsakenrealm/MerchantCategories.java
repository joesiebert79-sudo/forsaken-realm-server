package com.morongaming.forsakenrealm;
import java.util.*;
/** Only categories represented by this merchant's own stock become menu buttons. */
final class MerchantCategories {
 static String category(String shop,String original){return "Tavern".equals(shop)&&"Provisions".equals(original)?"Food":"Provisioner".equals(shop)&&"Provisions".equals(original)?"Supplies":original;}
 static String[] names(String shop,String[] offered){LinkedHashSet<String> actual=new LinkedHashSet<>(),result=new LinkedHashSet<>();for(String c:offered)if(c!=null&&!c.isEmpty())actual.add(category(shop,c));String[] order="Smithy".equals(shop)?new String[]{"Weapons","Armor","Shields","Tools"}:"Tavern".equals(shop)?new String[]{"Food"}:new String[]{"Supplies","Materials","Tools","Weapons","Armor","Shields"};for(String c:order)if(actual.contains(c))result.add(c);if(!"Smithy".equals(shop))result.addAll(actual);return result.toArray(new String[0]);}
}
