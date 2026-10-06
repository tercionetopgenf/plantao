import assert from 'node:assert/strict';
import {newRoom,joinRoom,visibleSnapshot,applyCommand,movePerson,type Person} from '../worker/session.ts';
import {cases} from '../src/lib/hospital-missions.ts';
const room=newRoom(1000);const professor=joinRoom(room,room.invites.find(i=>i.person.kind==='professor')!.code).person;
const captains:Person[]=[];const viewers:Person[]=[];
for(let i=0;i<3;i++){
 const code=room.invites.find(v=>v.person.kind==='captain'&&v.person.team===i)!.code;
 const first=joinRoom(room,code);assert.equal(first.token,joinRoom(room,code).token);captains.push(first.person);
 const watch=room.invites.find(v=>v.person.kind==='viewer'&&v.person.team===i)!.code;
 for(let j=0;j<10;j++)viewers.push(joinRoom(room,watch).person);
 assert.throws(()=>joinRoom(room,watch),/dez/);
}
for(const invite of room.invites.filter(i=>i.person.kind==='seminar'))joinRoom(room,invite.code);
assert.equal(Object.keys(room.sessions).length,40);
assert.throws(()=>joinRoom(room,'bad'),/inválido/);
assert.throws(()=>applyCommand(room,viewers[0],{type:'decision',stage:0,choice:0,memo:'This is a sufficiently long educational justification.'}),/representante/);
assert.throws(()=>applyCommand(room,captains[0],{type:'timer'}),/mediação/);
assert.throws(()=>applyCommand(room,captains[0],{type:'release'}));
applyCommand(room,professor,{type:'timer'},1000);assert.equal(room.timer.deadline,1801000);
assert.equal(visibleSnapshot(room,captains[0],40,61000).timer.remaining,1740);
applyCommand(room,professor,{type:'timer'},61000);assert.equal(room.timer.remaining,1740);assert.equal(room.timer.deadline,null);
applyCommand(room,professor,{type:'timer'},81000);assert.equal(room.timer.deadline,1821000);
for(let i=0;i<3;i++){
 const cap=captains[i];const decide=(stage:number)=>applyCommand(room,cap,{type:'decision',stage,choice:0,memo:`Our team ${i} relates the evidence to the proposed strategy and describes a relevant limitation.`},100000);
 assert.throws(()=>decide(1));decide(0);
 assert.throws(()=>decide(1),/fontes/);
 for(const e of cases[i].evidence)applyCommand(room,cap,{type:'clue',id:e.id});
 decide(1);assert.equal(room.teams[i].eventDelivered,false);decide(2);assert.equal(room.teams[i].eventDelivered,true);
 assert.throws(()=>decide(3),/comunicado/);applyCommand(room,cap,{type:'read-event'});decide(2);assert.equal(room.teams[i].notes.filter(n=>n.startsWith('Comunicado recebido')).length,1);decide(3);
 assert.throws(()=>decide(4),/convocação/);
 const snap=visibleSnapshot(room,cap,40);assert(snap.teams[i].decisions.length===4);
 for(let j=0;j<3;j++)if(j!==i){assert.equal(snap.teams[j].notes.length,0);assert.equal(snap.teams[j].decisions.length,0);assert.equal(snap.teams[j].event,'');}
 assert(!('invites' in snap));
}
applyCommand(room,professor,{type:'summon'});assert(room.meeting);assert.equal(room.positions.length,10);
for(const cap of captains)applyCommand(room,cap,{type:'decision',stage:4,choice:0,memo:'We explain the indicator and the limitations of our proposed evaluation.'});
applyCommand(room,professor,{type:'review',team:2,text:'Revisar os denominadores.'});
assert.equal(visibleSnapshot(room,captains[0],40).teams[2].review,'');
assert.equal(visibleSnapshot(room,professor,40).teams[2].review,'Revisar os denominadores.');
assert('invites' in visibleSnapshot(room,professor,40));
applyCommand(room,professor,{type:'release'},120000);assert(room.released);assert.equal(room.timer.deadline,null);
assert(!movePerson(room,viewers[0],{x:400,y:280}));assert(!movePerson(room,captains[0],{x:NaN,y:1}));assert(!movePerson(room,captains[0],{x:0,y:0}));assert(movePerson(room,captains[0],{x:450,y:280}));
assert.equal(room.positions[0].x,450);
console.log('PASS: 40 seats, invitation roles, team isolation, mission gates, one event, timer pause/resume, auditorium, study release, faculty review and movement restrictions.');
