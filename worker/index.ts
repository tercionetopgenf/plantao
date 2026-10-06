import {DurableObject} from 'cloudflare:workers';
import {newRoom,joinRoom,visibleSnapshot,applyCommand,movePerson,type RoomData,type Person,type Command} from './session';
interface Env{ROOMS:DurableObjectNamespace<GameRoom>;ASSETS:Fetcher;SETUP_KEY:string;}
type Attachment={token:string;person:Person;point?:{x:number;y:number};lastMove?:number;commands?:number;window?:number};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export class GameRoom extends DurableObject<Env>{
 private data!:RoomData|undefined;
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.blockConcurrencyWhile(async()=>{this.data=await ctx.storage.get<RoomData>('room');if(this.data)for(const ws of ctx.getWebSockets()){const a=ws.deserializeAttachment() as Attachment;if(a?.person.actor!==null&&a?.point)this.data.positions[a.person.actor!]=a.point;}});}
 private async save(){await this.ctx.storage.put('room',this.data);}
 private broadcast(){if(!this.data)return;const sockets=this.ctx.getWebSockets().filter(ws=>(ws.deserializeAttachment() as Attachment)?.token&&ws.readyState===1);for(const ws of sockets){try{const a=ws.deserializeAttachment() as Attachment;ws.send(JSON.stringify({type:'snapshot',data:visibleSnapshot(this.data,a.person,sockets.length)}));}catch{}}}
 async fetch(request:Request):Promise<Response>{const url=new URL(request.url);
  if(url.pathname.endsWith('/create')){if(this.data)return json({error:'Sala já existe.'},409);this.data=newRoom();const teacher=joinRoom(this.data,this.data.invites.find(i=>i.person.kind==='professor')!.code);await this.save();await this.ctx.storage.setAlarm(this.data.created+7*24*3600000);return json({token:teacher.token,me:teacher.person},201);}
  if(!this.data)return json({error:'Sala não encontrada.'},404);
  if(Date.now()-this.data.created>7*24*3600000)return json({error:'Sala expirada. A mediação pode criar uma nova partida.'},410);
  if(url.pathname.endsWith('/join')){try{const text=await request.text();if(text.length>1000)return json({error:'Solicitação muito grande.'},413);const {invite}=JSON.parse(text) as {invite:string};if(typeof invite!=='string'||invite.length>64)return json({error:'Convite inválido.'},400);const joined=joinRoom(this.data,invite);await this.save();return json({token:joined.token,me:joined.person});}catch(e){return json({error:(e as Error).message},403);}}
  if(url.pathname.endsWith('/ws')&&request.headers.get('Upgrade')?.toLowerCase()==='websocket'){
   if(this.ctx.getWebSockets().length>=45)return json({error:'Sala cheia. Aguarde para reconectar.'},429);const pair=new WebSocketPair();const [client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);server.serializeAttachment({token:'',person:{kind:'viewer',team:null,actor:null}} satisfies Attachment);return new Response(null,{status:101,webSocket:client});
  }
  return json({error:'Caminho inválido.'},404);
 }
 async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){if(!this.data||typeof message!=='string'||message.length>4096){ws.close(1008,'Mensagem inválida');return;}
  try{const cmd=JSON.parse(message) as Command;const a=ws.deserializeAttachment() as Attachment;
   if(cmd.type==='auth'){
    const token=typeof cmd.token==='string'?cmd.token:'';const person=this.data.sessions[token];if(!person){ws.close(1008,'Sessão inválida');return;}
    for(const other of this.ctx.getWebSockets())if(other!==ws&&(other.deserializeAttachment() as Attachment)?.token===token)other.close(1000,'Sessão retomada em outra aba');
    ws.serializeAttachment({token,person,point:person.actor===null?undefined:this.data.positions[person.actor]} satisfies Attachment);this.broadcast();return;
   }
   if(!a.token||!this.data.sessions[a.token]){ws.close(1008,'Entre com o convite');return;}
   if(cmd.type==='move'){
    const now=Date.now();if(a.lastMove&&now-a.lastMove<140)return;if(a.person.actor===null)return;
    const p={x:Number(cmd.x),y:Number(cmd.y)},old=this.data.positions[a.person.actor];const elapsed=a.lastMove?Math.min((now-a.lastMove)/1000,2):2;
    if(Math.hypot(p.x-old.x,p.y-old.y)>1000*elapsed+35||!movePerson(this.data,a.person,p))return;
    ws.serializeAttachment({...a,point:p,lastMove:now});const out=JSON.stringify({type:'move',actor:a.person.actor,point:p});for(const other of this.ctx.getWebSockets())if(other!==ws&&(other.deserializeAttachment() as Attachment)?.token){try{other.send(out);}catch{}}return;
   }
   const now=Date.now();const same=a.window&&now-a.window<1000;const count=same?(a.commands||0)+1:1;if(count>12)throw new Error('Aguarde antes de enviar novamente.');ws.serializeAttachment({...a,window:same?a.window:now,commands:count});
   applyCommand(this.data,a.person,cmd);await this.save();this.broadcast();
  }catch(e){ws.send(JSON.stringify({type:'error',error:(e as Error).message}));}
 }
 async alarm(){await this.ctx.storage.deleteAll();this.data=undefined;for(const ws of this.ctx.getWebSockets())ws.close(1000,'Partida expirada após sete dias');}
 webSocketClose(ws:WebSocket){ws.close();this.broadcast();}
 webSocketError(ws:WebSocket){ws.close(1011,'Reconecte para retomar');}
}
export default {async fetch(request:Request,env:Env):Promise<Response>{const url=new URL(request.url);
 if(url.pathname.startsWith('/api/')){
  const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Origem não autorizada.'},403);
  if(url.pathname==='/api/rooms'&&request.method==='POST'){
   if(!env.SETUP_KEY)return json({error:'Configure o segredo SETUP_KEY na Cloudflare para criar partidas.'},503);
   const body=await request.text();if(body.length>1000)return json({error:'Solicitação inválida.'},400);
   let key='';try{key=JSON.parse(body).key;}catch{return json({error:'Solicitação inválida.'},400);}
   if(typeof key!=='string'||key!==env.SETUP_KEY)return json({error:'Chave de criação incorreta.'},403);
   const room=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();const stub=env.ROOMS.get(env.ROOMS.idFromName(room));const response=await stub.fetch(new Request(url.origin+'/create',{method:'POST'}));const data=await response.json();return json({...data as object,room},response.status);
  }
  const match=url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{10})\/(join|ws)$/);if(!match)return json({error:'Caminho não encontrado.'},404);
  if(match[2]==='join'&&request.method!=='POST')return json({error:'Use POST.'},405);
  if(request.headers.get('Content-Length')&&Number(request.headers.get('Content-Length'))>1000)return json({error:'Solicitação muito grande.'},413);
  return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
 }
 return env.ASSETS.fetch(request);
}} satisfies ExportedHandler<Env>;
