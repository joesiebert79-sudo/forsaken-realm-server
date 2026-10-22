import {abandonSoloForClan,atOwnedFlag} from './settlements.mjs';
import {randomUUID} from 'node:crypto';
import {CLAN_RANKS} from './master-rules.mjs';
import {accountFor,masterEnabled,authorizedTown} from './accounts.mjs';
const fail=m=>{throw Error(m);};
export function clanFor(r,p){const id=r.state.accounts?.[p.id]?.clanId;return id&&r.state.clans?.[id]||null;}
export function clanBadge(r,p){const c=clanFor(r,p);return c&&Object.hasOwn(c.members,p.id)?{name:c.name,rank:c.members[p.id]}:null;}
export function clanFriendlyFireBlocked(r,a,b){const c=clanFor(r,a);return !!c&&!c.friendlyFire&&Object.hasOwn(c.members,b.id);}
export function clanView(r,p){if(!masterEnabled(r))return null;const c=clanFor(r,p);return {clan:c?{id:c.id,name:c.name,leader:c.leader,mixedFaction:c.mixedFaction,friendlyFire:c.friendlyFire,permissions:c.permissions,members:Object.entries(c.members).map(([id,rank])=>({id,rank,online:r.sessions.has(id)}))}:null,invitations:Object.values(r.state.clans||{}).filter(c=>Object.hasOwn(c.invitations,p.id)).map(c=>({id:c.id,name:c.name})),ranks:CLAN_RANKS};}
export function clanCommand(r,p,cmd){
 if(!masterEnabled(r))fail('Update the server for clans');r.state.clans??={};const a=accountFor(r,p),c=clanFor(r,p);
 if(cmd.type==='clanCreate'){
  if(a.clanId)fail('Already in a clan');if(a.clanBanUntil>r.clock())fail('Clan exile is active');
  if(a.settlementId&&!r.state.settlements?.[a.settlementId])fail('Settlement transfer must be implemented before changing ownership');
  const name=typeof cmd.name==='string'?cmd.name.trim():'';if(!/^[A-Za-z0-9][A-Za-z0-9 '-]{2,23}$/.test(name))fail('Clan names need 3–24 letters, numbers, spaces or apostrophes');
  if(Object.values(r.state.clans).some(c=>c.name.toLowerCase()===name.toLowerCase()))fail('Clan name is taken');
  if(a.settlementId)abandonSoloForClan(r,p);const id=randomUUID();r.state.clans[id]={id,name,leader:p.id,members:{[p.id]:'Warlord'},permissions:Object.fromEntries(CLAN_RANKS.slice(0,-1).map(rank=>[rank,{invite:false}])),invitations:{},mixedFaction:false,friendlyFire:false};a.clanId=id;return;
 }
 if(cmd.type==='clanAccept'||cmd.type==='clanDecline'){
  const target=r.state.clans[cmd.clanId];if(!target||!Object.hasOwn(target.invitations,p.id))fail('Invitation unavailable');
  if(cmd.type==='clanDecline'){delete target.invitations[p.id];return;}
  if(Object.keys(target.members).length>=12)fail('Clans are limited to 12 members');
  if(target.bank&&Object.keys(target.members).length>=target.bank.capacity)fail('Clan capacity reached; the Warlord must expand the clan bank');
  if(a.clanId)fail('Leave your current clan first');if(a.clanBanUntil>r.clock())fail('Clan exile is active');
  if(a.settlementId&&!r.state.settlements?.[a.settlementId])fail('Solo settlement abandonment is not implemented yet; your land is preserved');
  if(!target.mixedFaction&&r.state.players[target.leader]?.faction!==p.faction)fail('This clan currently allows only its leader faction');
  if(a.settlementId)abandonSoloForClan(r,p);target.members[p.id]='Recruit';a.clanId=target.id;for(const other of Object.values(r.state.clans))delete other.invitations[p.id];return;
 }
 if(!c||!Object.hasOwn(c.members,p.id))fail('Join a clan first');
 if(cmd.type==='clanInvite'){
  if(Object.keys(c.members).length>=Math.min(12,c.bank?.capacity||12))fail('Clan member capacity reached');
  if(c.leader!==p.id&&!c.permissions[c.members[p.id]]?.invite)fail('Your rank cannot invite');
  if(!authorizedTown(r,p)&&!atOwnedFlag(r,p))fail('Invite from your faction safe town or active flag');
  if(!Object.hasOwn(r.state.players,cmd.target))fail('Player unavailable');
  const target=r.state.players[cmd.target],account=r.state.accounts?.[cmd.target];
  if(!target||!account||target.creationRequired)fail('Player must complete character creation first');
  if(account.clanId)fail('Player already belongs to a clan');if(account.clanBanUntil>r.clock())fail('Player is in clan exile');
  if(!c.mixedFaction&&target.faction!==r.state.players[c.leader]?.faction)fail('Leader must enable mixed-faction membership');
  c.invitations[target.id]={from:p.id,at:r.clock()};return;
 }
 if(cmd.type==='clanLeave'){
  if(c.leader===p.id)fail('Transfer leadership before leaving');delete c.members[p.id];a.clanId=null;return;
 }
 if(c.leader!==p.id)fail('Only the Warlord may do that');
 if(cmd.type==='clanSettings'){
  if(typeof cmd.mixedFaction!=='boolean'||typeof cmd.friendlyFire!=='boolean')fail('Invalid clan settings');c.mixedFaction=cmd.mixedFaction;c.friendlyFire=cmd.friendlyFire;return;
 }
 if(cmd.type==='clanPermission'){
  if(!CLAN_RANKS.slice(0,-1).includes(cmd.rank)||typeof cmd.invite!=='boolean')fail('Invalid rank permission');c.permissions[cmd.rank]={invite:cmd.invite};return;
 }
 if(!Object.hasOwn(c.members,cmd.target)||cmd.target===p.id)fail('Choose another clan member; self-promotion is forbidden');
 if(cmd.type==='clanRank'){
  if(!CLAN_RANKS.slice(0,-1).includes(cmd.rank))fail('Choose a fixed rank below Warlord');c.members[cmd.target]=cmd.rank;return;
 }
 if(cmd.type==='clanTransfer') {c.members[p.id]='Commander';c.members[cmd.target]='Warlord';c.leader=cmd.target;return;}
 if(cmd.type==='clanKick'){delete c.members[cmd.target];r.state.accounts[cmd.target].clanId=null;return;}
 fail('Unknown clan action');
}



