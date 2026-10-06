export type Point={x:number;y:number};
export const actors=[{id:0,name:'Equipe Aurora',role:'representante',color:'#50d9c5',unit:'Registros e execução'},{id:1,name:'Equipe Nexo',role:'representante',color:'#ffbb67',unit:'Recursos e abastecimento'},{id:2,name:'Equipe Pulsar',role:'representante',color:'#b4a0ff',unit:'Continuidade e integração'},{id:3,name:'Professor',role:'mediador',color:'#ffe59a',unit:'Acesso a todas as salas'},{id:4,name:'Seminário',role:'organizador',color:'#7dc1ff',unit:'Acesso a todas as salas'}];
actors.push(...Array.from({length:5},(_,i)=>({id:i+5,name:`Seminário ${i+2}`,role:'organizador',color:['#f5b3ce','#f2cf83','#8ed5d0','#c2b1fa','#b9d7a0'][i],unit:'Acesso a todas as salas'})));
actors[4].name='Seminário 1';
export const rooms=[{id:'kta',name:'Coordenação',tag:'KTA',x:155,y:155},{id:'cfir',name:'Posto de enfermagem',tag:'CFIR',x:450,y:210},{id:'facilitation',name:'Almoxarifado',tag:'i-PARIHS',x:745,y:155},{id:'staff',name:'Sala da equipe',tag:'Escuta e contexto',x:155,y:405},{id:'reaim',name:'Núcleo de qualidade',tag:'RE-AIM',x:450,y:440},{id:'final',name:'Auditório',tag:'Desfechos',x:745,y:515}];
export const missionNames=['Localizar a lacuna','Investigar a rotina','Viabilizar a mudança','Planejar a avaliação','Apresentar a incorporação'];
export const stageRooms=['kta','cfir','facilitation','reaim','final'];
export function walkable(p:Point){if(p.x<30||p.x>870||p.y<30||p.y>550)return false;if(p.y>=235&&p.y<=310)return true;for(const [l,r,door]of[[30,263,150],[305,601,450],[650,867,750]]){if(p.x>=l&&p.x<=r&&((p.y>=30&&p.y<=195)||(p.y>=355&&p.y<=540)))return true;if(p.x>=door-25&&p.x<=door+25&&p.y>=190&&p.y<=360)return true;}return false;}
export function findPath(from:Point,to:Point):Point[]{const size=15;const cell=(p:Point)=>({x:Math.round(p.x/size),y:Math.round(p.y/size)});const key=(p:Point)=>`${p.x},${p.y}`;const start=cell(from),goal=cell(to);if(!walkable({x:goal.x*size,y:goal.y*size}))return [];const queue=[start],prev=new Map<string,Point|null>([[key(start),null]]);let index=0;while(index<queue.length){const c=queue[index++];if(key(c)===key(goal)){const path:Point[]=[];let n:Point|null=c;while(n){path.push({x:n.x*size,y:n.y*size});n=prev.get(key(n))||null;}return path.reverse().slice(1);}for(const delta of[[1,0],[-1,0],[0,1],[0,-1]]){const n={x:c.x+delta[0],y:c.y+delta[1]};if(!prev.has(key(n))&&walkable({x:n.x*size,y:n.y*size})){prev.set(key(n),c);queue.push(n);}}}return [];}
export type Decision={option:number;plan:string;memo:string;consequence:string};
export type TeamState={stage:number;clues:string[];notes:string[];decisions:Decision[];event:string;eventDelivered:boolean;eventRead:boolean;complete:boolean;review:string};
export const freshTeams=():TeamState[]=>[0,1,2].map(()=>({stage:0,clues:[],notes:[],decisions:[],event:'',eventDelivered:false,eventRead:false,complete:false,review:''}));
export function commitDecision(state:TeamState,stage:number,decision:Decision,event:string):TeamState{if(stage>state.stage||stage<0||stage>4)return state;const decisions=[...state.decisions];decisions[stage]=decision;const deliver=stage===2&&!state.eventDelivered;return {...state,decisions,stage:Math.max(state.stage,stage+1),complete:state.complete||stage===4,event:deliver?event:state.event,eventDelivered:state.eventDelivered||deliver,notes:[...state.notes,`Etapa ${stage+1}: ${decision.consequence}`,...(deliver?[`Comunicado recebido: ${event}`]:[])]};}
export type Ambient={id:string;name:string;sprite:number;speed:number;path:Point[]};
export const ambientPeople:Ambient[]=[
 {id:'reception',name:'Coordenação',sprite:4,speed:18,path:[{x:165,y:105},{x:230,y:155},{x:155,y:180}]},
 {id:'bedside',name:'Enfermagem',sprite:0,speed:15,path:[{x:320,y:115},{x:320,y:175},{x:340,y:175}]},
 {id:'support',name:'Apoio',sprite:1,speed:21,path:[{x:75,y:400},{x:75,y:500},{x:60,y:515}]},
 {id:'staff-member',name:'Plantão',sprite:2,speed:17,path:[{x:225,y:420},{x:225,y:480},{x:210,y:515}]},
 {id:'stock',name:'Abastecimento',sprite:5,speed:19,path:[{x:740,y:110},{x:720,y:175},{x:810,y:175}]},
 {id:'quality',name:'Qualidade',sprite:4,speed:16,path:[{x:390,y:435},{x:535,y:435},{x:535,y:405}]},
 {id:'visitor',name:'Visitante',sprite:2,speed:23,path:[{x:80,y:255},{x:300,y:255},{x:300,y:300},{x:80,y:300}]},
 {id:'logistics',name:'Logística',sprite:1,speed:25,path:[{x:605,y:255},{x:840,y:255},{x:840,y:305},{x:605,y:305}]},
];
export function ambientPosition(person:Ambient,seconds:number):Point{const lengths=person.path.map((p,i)=>{const q=person.path[(i+1)%person.path.length];return Math.hypot(q.x-p.x,q.y-p.y);});const total=lengths.reduce((a,b)=>a+b,0);let distance=seconds*person.speed%total;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const p=person.path[i],q=person.path[(i+1)%person.path.length],ratio=lengths[i]?distance/lengths[i]:0;return {x:p.x+(q.x-p.x)*ratio,y:p.y+(q.y-p.y)*ratio};}distance-=lengths[i];}return person.path[0];}
