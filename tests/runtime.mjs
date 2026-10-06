// Integration test starts its own local Worker. It never contacts Cloudflare production.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const folder=await mkdtemp(join(tmpdir(),'plantao-test-'));const key=crypto.randomUUID();
await writeFile(join(folder,'vars'),`SETUP_KEY=${key}\n`);
const proc=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--ip','127.0.0.1','--port','8790','--inspector-port','0','--env-file',join(folder,'vars'),'--persist-to',join(folder,'state')],{stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
let log='';proc.stdout.on('data',v=>log+=v);proc.stderr.on('data',v=>log+=v);
const base='http://127.0.0.1:8790';const sockets=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function request(path,body){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
async function until(fn,ms=8000){const end=Date.now()+ms;while(!fn()){if(Date.now()>end)throw new Error('Timed out waiting for state');await pause(20);}}
async function connect(login){const ws=new WebSocket(`ws://127.0.0.1:8790/api/rooms/${login.room}/ws`);const client={ws,me:login.me,snapshot:null,moves:[],errors:[]};sockets.push(ws);ws.onopen=()=>ws.send(JSON.stringify({type:'auth',token:login.token}));ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='snapshot')client.snapshot=m.data;if(m.type==='move')client.moves.push(m);if(m.type==='error')client.errors.push(m.error);};await until(()=>client.snapshot);return client;}
async function send(client,cmd){const previous=client.snapshot.revision;client.ws.send(JSON.stringify(cmd));await until(()=>client.snapshot.revision>previous||client.errors.length);assert.equal(client.errors.length,0,client.errors.at(-1));}
try{
 const end=Date.now()+45000;while(true){try{const r=await fetch(base);if(r.ok)break;}catch{}if(Date.now()>end)throw new Error('Worker startup failed: '+log.slice(-5000));await pause(150);}
 const html=await (await fetch(base)).text();assert(html.includes('Plantão da Mudança'));
 for(const name of ['aurora','nexo','pulsar']){const r=await fetch(`${base}/hospital-preview/resumo-${name}.pdf`);assert.equal(r.status,200);assert((await r.text()).startsWith('%PDF-'));}
 assert.equal((await request('/api/rooms',{key:'wrong'})).status,403);
 const created=await request('/api/rooms',{key});assert.equal(created.status,201);const room=created.data.room;const professor=await connect(created.data);const invites=professor.snapshot.invites;assert.equal(invites.length,13);
 const captains=[],watchers=[],seminar=[];
 for(const invite of invites){if(invite.person.kind==='professor')continue;const count=invite.person.kind==='viewer'?10:1;for(let i=0;i<count;i++){const joined=await request(`/api/rooms/${room}/join`,{invite:invite.code});assert.equal(joined.status,200);const client=await connect({...joined.data,room});if(client.me.kind==='captain')captains.push(client);else if(client.me.kind==='viewer')watchers.push(client);else seminar.push(client);}if(invite.person.kind==='viewer')assert.equal((await request(`/api/rooms/${room}/join`,{invite:invite.code})).status,403);}
 await until(()=>professor.snapshot.online===40);assert.equal(captains.length,3);assert.equal(watchers.length,30);assert.equal(seminar.length,6);
 const viewer=watchers[0];viewer.ws.send(JSON.stringify({type:'timer'}));await until(()=>viewer.errors.length>0);viewer.errors=[];assert.equal(professor.snapshot.timer.deadline,null);
 await send(professor,{type:'timer'});assert(professor.snapshot.timer.deadline>Date.now());assert(watchers.every(c=>c.snapshot.timer.deadline!==null));await send(seminar[0],{type:'timer'});assert.equal(professor.snapshot.timer.deadline,null);
 const starts=[{x:135,y:285},{x:360,y:285},{x:660,y:285}];for(let i=0;i<3;i++){captains[i].ws.send(JSON.stringify({type:'move',x:starts[i].x+15,y:starts[i].y}));}await until(()=>professor.moves.length>=3);assert(professor.moves.some(m=>m.actor===2));
 // Additional movement traffic reaches all forty clients without persisting each frame.
 for(let round=0;round<4;round++){await pause(160);for(let i=0;i<3;i++)captains[i].ws.send(JSON.stringify({type:'move',x:starts[i].x+15+round*15,y:starts[i].y}));}await until(()=>professor.moves.length>=12);
 const clueIds=[['nurse','tech','audit'],['supply','charge','night'],['new','champion','leader']];
 for(let i=0;i<3;i++){const cap=captains.find(c=>c.me.team===i);await send(cap,{type:'decision',stage:0,choice:0,memo:'We compare evidence and context and explain the conditions and limitations of our proposed strategy.'});for(const id of clueIds[i])await send(cap,{type:'clue',id});await send(cap,{type:'decision',stage:1,choice:0,memo:'We relate the discovered barriers to implementation determinants and propose a way to verify the hypothesis.'});await send(cap,{type:'decision',stage:2,choice:0,memo:'The facilitation plan connects people, innovation and context and states the institutional support it requires.'});assert(cap.snapshot.teams[i].eventDelivered);assert(watchers.filter(c=>c.me.team===i).every(c=>c.snapshot.teams[i].eventDelivered));for(const other of captains.filter(c=>c!==cap)){assert.equal(other.snapshot.teams[i].decisions.length,0);assert.equal(other.snapshot.teams[i].event,'');}await send(cap,{type:'read-event'});await send(cap,{type:'decision',stage:3,choice:0,memo:'Our evaluation specifies the numerator, denominator, data source and follow-up period, considering representativeness.'});}
 await send(professor,{type:'summon'});assert(captains.every(c=>c.snapshot.meeting));assert.equal(professor.snapshot.positions.length,10);
 for(const cap of captains)await send(cap,{type:'decision',stage:4,choice:0,memo:'We identify an implementation outcome, explain how it will be measured, and acknowledge the limits of causal interpretation.'});
 await send(seminar[1],{type:'review',team:1,text:'Retomem a diferença entre adoção e execução.'});await send(professor,{type:'release'});assert(watchers.every(c=>c.snapshot.released));
 const before=professor.snapshot.revision;const cap=captains[0];cap.ws.close();await pause(150);const inv=invites.find(i=>i.person.kind==='captain'&&i.person.team===0);const relog=await request(`/api/rooms/${room}/join`,{invite:inv.code});const resumed=await connect({...relog.data,room});assert.equal(resumed.snapshot.revision,before);assert.equal(resumed.snapshot.teams[0].stage,5);assert(resumed.snapshot.released);
 console.log('PASS: local Worker, static assets/PDFs, role invites, 40 concurrent WebSockets, movement broadcasts, isolated decisions/events, shared timer, 15 missions, faculty feedback, study release and reconnect.');
}finally{for(const ws of sockets)try{ws.close();}catch{}proc.kill('SIGTERM');await pause(300);if(proc.exitCode===null)proc.kill('SIGKILL');await rm(folder,{recursive:true,force:true});}
