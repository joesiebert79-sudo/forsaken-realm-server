package com.morongaming.forsakenrealm;
import android.app.*;import android.os.*;import android.content.*;import android.net.Uri;import android.provider.Settings;import android.widget.Toast;import java.io.*;import java.net.*;import java.security.MessageDigest;import java.util.Locale;import java.util.concurrent.*;import org.json.JSONObject;
final class AppUpdates {
 private static final String MANIFEST="https://raw.githubusercontent.com/joesiebert79-sudo/forsaken-realm-server/main/app-release.json";
 private final Activity host;private final ExecutorService worker=Executors.newSingleThreadExecutor();private final Handler ui=new Handler(Looper.getMainLooper());private final UpdateCheckPolicy policy=new UpdateCheckPolicy();
 private boolean foreground,busy,promptOpen,closed;private int pendingVersion,lastPromptVersion;private long lastPromptAt;
 private final Runnable retry=()->check(false,true);
 AppUpdates(Activity host){this.host=host;}
 private long installed()throws Exception{return host.getPackageManager().getPackageInfo(host.getPackageName(),0).versionCode;}
 String versionLabel(){try{return "Installed: "+host.getPackageManager().getPackageInfo(host.getPackageName(),0).versionName+" — tap to check";}catch(Exception e){return "Tap to check for updates";}}
 void check(){check(false,false);}
 void checkNow(){check(true,true);}
 private void check(boolean manual,boolean force){
  if(closed||busy||promptOpen||!policy.begin(SystemClock.elapsedRealtime(),force))return;
  ui.removeCallbacks(retry);if(manual)Toast.makeText(host,"Checking for app updates…",Toast.LENGTH_SHORT).show();
  worker.execute(()->{try{
   HttpURLConnection c=(HttpURLConnection)new URL(MANIFEST+"?check="+System.currentTimeMillis()).openConnection();c.setUseCaches(false);c.setConnectTimeout(10000);c.setReadTimeout(10000);c.setRequestProperty("Cache-Control","no-cache, no-store");JSONObject info;
   try(InputStream in=c.getInputStream()){info=new JSONObject(new String(read(in,16384),"UTF-8"));}finally{c.disconnect();}
   long current=installed();int next=info.getInt("versionCode");if(next<=0)throw new IOException("Invalid app version");
   if(next>current){URL url=new URL(info.getString("apkUrl"));if(!"https".equals(url.getProtocol())||!"github.com".equals(url.getHost())||!url.getPath().startsWith("/joesiebert79-sudo/forsaken-realm-server/releases/download/")||!info.getString("apkSha256").matches("[a-fA-F0-9]{64}"))throw new IOException("Invalid update information");}
   host.runOnUiThread(()->{policy.success();if(closed||!foreground||host.isFinishing()||host.isDestroyed())return;if(next<=current){if(manual)Toast.makeText(host,"Forsaken Realm is up to date.",Toast.LENGTH_LONG).show();return;}
    long now=SystemClock.elapsedRealtime();if(!manual&&next==lastPromptVersion&&now-lastPromptAt<3600000)return;lastPromptVersion=next;lastPromptAt=now;promptOpen=true;
    AlertDialog dialog=new AlertDialog.Builder(host).setTitle("Forsaken Realm update").setMessage("A new app update is ready. Download and install it now?").setPositiveButton("Update",(d,w)->download(info)).setNegativeButton("Later",null).create();dialog.setOnDismissListener(d->promptOpen=false);dialog.show();
   });
  }catch(Exception e){host.runOnUiThread(()->{long delay=policy.failure();if(closed||!foreground)return;if(manual||delay<0)Toast.makeText(host,"Could not check app updates. Check your internet connection, or retry in Settings > General.",Toast.LENGTH_LONG).show();if(delay>0)ui.postDelayed(retry,delay);});}});
 }
 private static byte[] read(InputStream in,int limit)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>limit)throw new IOException("Download too large");}return out.toByteArray();}
 private void download(JSONObject info){if(busy||closed)return;busy=true;Toast.makeText(host,"Downloading update…",Toast.LENGTH_LONG).show();worker.execute(()->{try{
  HttpURLConnection c=(HttpURLConnection)new URL(info.getString("apkUrl")).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(20000);File part=new File(host.getCacheDir(),"apk-update.part");MessageDigest digest=MessageDigest.getInstance("SHA-256");long size=0;
  try(InputStream in=c.getInputStream();OutputStream out=new FileOutputStream(part)){byte[] bytes=new byte[32768];int n;while((n=in.read(bytes))!=-1){size+=n;if(size>160L*1024*1024)throw new IOException("Update too large");digest.update(bytes,0,n);out.write(bytes,0,n);}}finally{c.disconnect();}
  StringBuilder actual=new StringBuilder();for(byte b:digest.digest())actual.append(String.format(Locale.ROOT,"%02x",b&255));if(!actual.toString().equalsIgnoreCase(info.getString("apkSha256")))throw new IOException("Update could not be verified");File target=new File(host.getCacheDir(),"apk-update.apk");if(target.exists()&&!target.delete())throw new IOException("Cannot replace update");if(!part.renameTo(target))throw new IOException("Cannot prepare update");int version=info.getInt("versionCode");host.runOnUiThread(()->{busy=false;pendingVersion=version;if(foreground&&!closed)install();});
 }catch(Exception e){host.runOnUiThread(()->{busy=false;if(!closed)Toast.makeText(host,"Update download failed. Retry in Settings > General > Check for app updates.",Toast.LENGTH_LONG).show();});}});}
 void resume(){foreground=true;policy.foreground();if(pendingVersion>0&&new File(host.getCacheDir(),"apk-update.apk").isFile()&&(Build.VERSION.SDK_INT<26||host.getPackageManager().canRequestPackageInstalls()))install();else check();}
 void pause(){foreground=false;ui.removeCallbacks(retry);}
 private void install(){try{if(pendingVersion<=installed()){pendingVersion=0;return;}if(Build.VERSION.SDK_INT>=26&&!host.getPackageManager().canRequestPackageInstalls()){
  new AlertDialog.Builder(host).setTitle("Allow app updates").setMessage("Android needs your permission to install updates from Forsaken Realm. Your game progress stays on your server.").setPositiveButton("Open Android settings",(d,w)->host.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+host.getPackageName())))).setNegativeButton("Later",null).show();return;
 }Intent install=new Intent(Intent.ACTION_VIEW);install.setDataAndType(Uri.parse("content://"+host.getPackageName()+".updates/update.apk"),"application/vnd.android.package-archive");install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);host.startActivity(install);pendingVersion=0;
 }catch(Exception e){Toast.makeText(host,"Android could not open the installer. Retry from app Settings.",Toast.LENGTH_LONG).show();}}
 void close(){closed=true;ui.removeCallbacks(retry);worker.shutdownNow();}
}
