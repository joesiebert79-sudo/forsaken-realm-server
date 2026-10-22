import {accountFor,authorizedTown} from './accounts.mjs';
import {atOwnedFlag} from './settlements.mjs';
export function friendsCommand(r,p,c){const a=accountFor(r,p);a.friends??=[];a.friendInvites??={};const b=Object.hasOwn(r.state.accounts||{},c.target)?r.state.accounts[c.target]:null;if(!b||b===a)throw Error('Choose another existing player ID');b.friends??=[];b.friendInvites??={};
 if(c.type==='friendInvite'){if(!authorizedTown(r,p)&&!atOwnedFlag(r,p))throw Error('Invite from a safe town or your active flag');if(a.friends.includes(b.id))throw Error('Already friends');b.friendInvites[a.id]={at:r.clock()};}
 else if(c.type==='friendAccept'){if(!Object.hasOwn(a.friendInvites,b.id))throw Error('Invitation unavailable');if(!a.friends.includes(b.id))a.friends.push(b.id);if(!b.friends.includes(a.id))b.friends.push(a.id);delete a.friendInvites[b.id];delete b.friendInvites[a.id];}
 else if(c.type==='friendDecline')delete a.friendInvites[b.id];
 else if(c.type==='friendRemove'){a.friends=a.friends.filter(id=>id!==b.id);b.friends=b.friends.filter(id=>id!==a.id);}
 else throw Error('Unknown friend action');
}
export function friendRows(r,p){const a=accountFor(r,p);return [{name:'Invite a friend',detail:'Mutual friendship does not prevent PvP damage.',prompt:'Player ID',field:'target',action:{type:'friendInvite'}},...Object.keys(a.friendInvites||{}).map(id=>({name:'Accept '+id,detail:'Incoming friend request',action:{type:'friendAccept',target:id}})),...(a.friends||[]).map(id=>({name:id,detail:(r.sessions.has(id)?'Online':'Offline')+' • Tap to remove friendship',confirm:'Remove this friend?',action:{type:'friendRemove',target:id}}))];}



