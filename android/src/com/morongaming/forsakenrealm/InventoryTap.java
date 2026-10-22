package com.morongaming.forsakenrealm;
/** A double tap must identify the same stack and open container. */
final class InventoryTap {
 private String item="",container="";private int side=-1;private long at=-1000;
 boolean tap(String id,int panel,String context,long now){boolean twice=id.equals(item)&&panel==side&&context.equals(container)&&now-at>=0&&now-at<=450;if(twice){cancel();return true;}item=id;side=panel;container=context;at=now;return false;}
 // 1 equip, 2 unequip, 3 take stack, 4 store stack, 0 inspect only.
 static int destination(int side,boolean container,boolean equipment){if(side>=2&&side<10)return 2;if(side==0&&container)return equipment?5:3;if(side==1){if(equipment)return 1;if(container)return 4;}return 0;}
 void cancel(){item="";container="";side=-1;at=-1000;}
}

