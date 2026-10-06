import {freshTeams,commitDecision,walkable,type Point,type TeamState} from '../src/lib/hospital-preview.ts';
import {cases} from '../src/lib/hospital-missions.ts';
import {GAME_SECONDS,secondsLeft} from '../src/lib/hospital-session.ts';
export type Person={kind:'captain'|'viewer'|'professor'|'seminar';team:number|null;actor:number|null};
export type Invitation={label:string;code:string;person:Person};
export type RoomData={teams:TeamState[];positions:Point[];meeting:boolean;released:boolean;timer:{remaining:number;deadline:number|null};invites:Invitation[];sessions:Record<string,Person>;created:number;revision:number};
export const initialPositions=():Point[]=>[{x:135,y:285},{x:360,y:285},{x:660,y:285},{x:510,y:300},{x:810,y:300},{x:570,y:255},{x:180,y:300},{x:420,y:255},{x:705,y:300},{x:285,y:255}];
const key=()=>crypto.randomUUID().replaceAll('-','');
export function newRoom(now=Date.now()):RoomData{const names=['Aurora','Nexo','Pulsar'];const invites:Invitation[]=[];names.forEach((name,i)=>{invites.push({label:`Representante · ${name}`,code:key(),person:{kind:'captain',team:i,actor:i}});invites.push({label:`10 participantes · ${name}`,code:key(),person:{kind:'viewer',team:i,actor:null}});});invites.push({label:'Professor',code:key(),person:{kind:'professor',team:null,actor:3}});for(let i=0;i<6;i++)invites.push({label:`Seminário ${i+1}`,code:key(),person:{kind:'seminar',team:null,actor:i+4}});return {teams:freshTeams(),positions:initialPositions(),meeting:false,released:false,timer:{remaining:GAME_SECONDS,deadline:null},invites,sessions:{},created:now,revision:0};}
export function joinRoom(data:RoomData,code:string):{token:string;person:Person}{const invite=data.invites.find(i=>i.code===code);if(!invite)throw new Error('Convite inválido. Confira o link recebido.');const person=invite.person;let token:string|undefined;
 if(person.actor!==null)token=Object.keys(data.sessions).find(t=>data.sessions[t].actor===person.actor);
 else if(Object.values(data.sessions).filter(p=>p.kind==='viewer'&&p.team===person.team).length>=10)throw new Error('Os dez acessos de acompanhamento desta equipe já foram utilizados. Reabra o mesmo navegador para retomar sua sessão.');
 if(!token){token=key();data.sessions[token]={...person};}return {token,person:{...person}};
}
export function visibleSnapshot(data:RoomData,me:Person,online:number,now=Date.now()){
 const faculty=me.kind==='professor'||me.kind==='seminar';
 return {teams:data.teams.map((t,i)=>faculty||me.team===i?t:{...freshTeams()[i],stage:t.stage,complete:t.complete}),positions:data.positions,meeting:data.meeting,released:data.released,timer:{remaining:data.timer.deadline===null?data.timer.remaining:secondsLeft(data.timer.deadline,now),deadline:data.timer.deadline},revision:data.revision,online,serverNow:now,...(me.kind==='professor'?{invites:data.invites}:{} )};
}
export type Command={type:string;[key:string]:unknown};
export function applyCommand(data:RoomData,me:Person,cmd:Command,now=Date.now()):void{
 const faculty=me.kind==='professor'||me.kind==='seminar';const captain=me.kind==='captain';const team=me.team;const fail=(s:string):never=>{throw new Error(s);};
 if(cmd.type==='timer'){
  if(!faculty||data.released)fail('Somente a mediação controla o tempo.');
  if(data.timer.deadline!==null){data.timer.remaining=secondsLeft(data.timer.deadline,now);data.timer.deadline=null;}
  else if(data.timer.remaining>0)data.timer.deadline=now+data.timer.remaining*1000;
 }else if(cmd.type==='summon'){
  if(!faculty||!data.teams.every(t=>t.stage>=4))fail('A reunião aguarda as quatro etapas iniciais de todas as equipes.');
  data.meeting=true;data.positions=initialPositions().map((_,i)=>({x:675+(i%4)*45,y:480+Math.floor(i/4)*25}));
 }else if(cmd.type==='release'){
  if(!faculty||!data.meeting||!data.teams.every(t=>t.complete))fail('Concluam as cinco missões das três equipes antes da entrega.');
  data.released=true;if(data.timer.deadline!==null)data.timer.remaining=secondsLeft(data.timer.deadline,now);data.timer.deadline=null;
 }else if(cmd.type==='review'){
  if(!faculty||!Number.isInteger(cmd.team)||Number(cmd.team)<0||Number(cmd.team)>2||typeof cmd.text!=='string'||cmd.text.length>1500)fail('Devolutiva inválida.');
  data.teams[Number(cmd.team)].review=String(cmd.text).trim();
 }else{
  if(!captain||team===null)fail('Somente o representante registra as decisões da sua equipe.');
  const id=team as number;const state=data.teams[id];
  if(cmd.type==='clue'){
   const e=cases[id].evidence.find(e=>e.id===cmd.id);if(!e)fail('Fonte inválida para esta equipe.');
   if(!state.clues.includes(e!.id)){state.clues.push(e!.id);state.notes.push(`${e!.person}: ${e!.finding}`);}
  }else if(cmd.type==='read-event'){
   if(!state.eventDelivered)fail('Ainda não há comunicado.');state.eventRead=true;
  }else if(cmd.type==='decision'){
   const stage=Number(cmd.stage),choice=Number(cmd.choice);const mission=cases[id].missions[stage];
   if(!Number.isInteger(stage)||!mission||stage>state.stage||!Number.isInteger(choice)||!mission.options[choice]||typeof cmd.memo!=='string'||cmd.memo.trim().length<30||cmd.memo.length>1200)fail('Decisão ou justificativa inválida.');
   if(stage===4&&!data.meeting)fail('Aguarde a convocação ao auditório.');
   if(stage>=3&&state.eventDelivered&&!state.eventRead)fail('Leia o comunicado na coordenação.');
   if((mission.requires||[]).some(id=>!state.clues.includes(id)))fail('Registre todas as fontes desta missão.');
   const option=mission.options[choice];data.teams[id]=commitDecision(state,stage,{option:choice,plan:option.action,memo:String(cmd.memo).trim(),consequence:option.consequence},cases[id].event);
  }else fail('Comando desconhecido.');
 }
 data.revision++;
}
export function movePerson(data:RoomData,me:Person,p:Point):boolean{if(me.actor===null||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!walkable(p))return false;data.positions[me.actor]={x:p.x,y:p.y};return true;}
