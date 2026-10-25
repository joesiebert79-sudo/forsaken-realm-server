import {existsSync} from 'node:fs';
import {APPROVED_WORLD,MASTER,DAY4} from './world-profile.mjs';
import {refreshHousing} from './housing-runtime.mjs';
import { DatabaseSync } from 'node:sqlite';
import { Realm, initialWorld } from './world.mjs';
export class WorldStore {
  constructor(path,clock,options={}) {
    this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS world (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);');
    this.db.exec('CREATE TABLE IF NOT EXISTS movement (id TEXT PRIMARY KEY, body TEXT NOT NULL)');
    const saved=this.db.prepare('SELECT body FROM world WHERE id=1').get();
    const state=saved?JSON.parse(saved.body):initialWorld();
    if(saved&&state.currencyVersion!==2&&path!==':memory:'&&!existsSync(path+'.before-currency-100.sqlite'))this.db.prepare('VACUUM INTO ?').run(path+'.before-currency-100.sqlite');
    if(MASTER&&saved&&state.mapScale!==32.5&&path!==':memory:'&&!existsSync(path+'.before-v077.sqlite'))this.db.prepare('VACUUM INTO ?').run(path+'.before-v077.sqlite');
    if(DAY4&&saved&&!state.day4HousingVersion&&path!==':memory:'&&!existsSync(path+'.before-v068.sqlite'))this.db.prepare('VACUUM INTO ?').run(path+'.before-v068.sqlite');
    if(DAY4&&saved&&!state.traderVillageVersion&&path!==':memory:'&&!existsSync(path+'.before-v070.sqlite'))this.db.prepare('VACUUM INTO ?').run(path+'.before-v070.sqlite');
    if(APPROVED_WORLD&&saved&&!state.approvedWorldVersion&&path!==':memory:'&&!existsSync(path+'.before-world-v1.sqlite'))this.db.prepare('VACUUM INTO ?').run(path+'.before-world-v1.sqlite');
    if(DAY4)state.day4HousingVersion=1;
    for(const row of this.db.prepare('SELECT body FROM movement').all()){const patch=JSON.parse(row.body);state.players[patch.player.id]=patch.player;if(patch.companion){state.companions??={};state.companions[patch.player.id]=patch.companion;}state.revision=Math.max(state.revision,patch.revision);}
    this.realm=new Realm(state,clock,options);
    this.writeMovement=this.db.prepare('INSERT INTO movement(id,body) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body');
    this.write=this.db.prepare('INSERT INTO world(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body');
  }
  transaction(fn) {
    const before=JSON.stringify(this.realm.state);const sessions=new Map(this.realm.sessions);
    this.db.exec('BEGIN IMMEDIATE');
    try{const result=fn(this.realm);this.write.run(JSON.stringify(this.realm.state));this.db.exec('DELETE FROM movement');this.db.exec('COMMIT');return result;}
    catch(error){this.db.exec('ROLLBACK');this.realm.state=JSON.parse(before);refreshHousing(this.realm);this.realm.sessions=sessions;throw error;}
  }
  // Movement mutates only its player, mounted companion, revision and session.
  // Persist those small records immediately; the next full save folds them in.
  movement(id,command){
    if(command?.type!=='move')throw Error('Movement command required');
    const r=this.realm,p=r.player(id),before=structuredClone(p),pet=r.state.companions[id],petBefore=pet?structuredClone(pet):null,revision=r.state.revision,last=r.sessions.get(id);
    try{const result=r.command(id,command);if(!result.duplicate)this.writeMovement.run(id,JSON.stringify({player:p,companion:r.state.companions[id]||null,revision:r.state.revision}));return result;}
    catch(error){r.state.players[id]=before;if(petBefore)r.state.companions[id]=petBefore;r.state.revision=revision;r.sessions.set(id,last);throw error;}
  }
  close(){this.db.close();}
}





