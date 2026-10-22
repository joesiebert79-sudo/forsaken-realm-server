package com.morongaming.forsakenrealm;
import java.net.*;import java.nio.charset.StandardCharsets;import org.json.JSONObject;
final class ServerDiscovery {
 static String find(){try(DatagramSocket socket=new DatagramSocket()){socket.setBroadcast(true);socket.setSoTimeout(2500);byte[] query="FORSAKEN_REALM_DISCOVER_V1".getBytes(StandardCharsets.UTF_8);socket.send(new DatagramPacket(query,query.length,InetAddress.getByName("255.255.255.255"),8789));byte[] data=new byte[2048];DatagramPacket reply=new DatagramPacket(data,data.length);socket.receive(reply);JSONObject info=new JSONObject(new String(reply.getData(),0,reply.getLength(),StandardCharsets.UTF_8));if(!"Forsaken Realm".equals(info.optString("game")))return "";int port=info.optInt("port");if(port<1024||port>65535)return "";String url="http://"+reply.getAddress().getHostAddress()+":"+port;return ConnectionPolicy.accepts(url)?url:"";}catch(Exception ignored){return "";}}
}
