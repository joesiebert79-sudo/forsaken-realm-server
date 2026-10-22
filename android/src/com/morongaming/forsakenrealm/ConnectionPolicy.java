package com.morongaming.forsakenrealm;
import java.net.URI;

/** Cleartext is limited to numeric RFC1918 addresses in the separate LAN APK. */
final class ConnectionPolicy {
 static boolean accepts(String value) {
  try {
   URI u=new URI(value);
   if(u.getHost()==null||u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null) return false;
   if(u.getPort()==0||u.getPort()>65535) return false;
   if(u.getPath()!=null&&!u.getPath().isEmpty()&&!u.getPath().equals("/")) return false;
   if("https".equals(u.getScheme())) return true;
   if(!"http".equals(u.getScheme())) return false;
   String[] parts=u.getHost().split("\\.");
   if(parts.length!=4)return false;
   int[] a=new int[4];
   for(int i=0;i<4;i++) {if(!parts[i].matches("0|[1-9][0-9]{0,2}"))return false;a[i]=Integer.parseInt(parts[i]);if(a[i]>255)return false;}
   return a[0]==10||(a[0]==172&&a[1]>=16&&a[1]<=31)||(a[0]==192&&a[1]==168);
  }catch(Exception e){return false;}
 }
}

