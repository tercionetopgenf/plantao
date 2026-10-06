import type {Point} from './hospital-preview';

export const GAME_SECONDS=30*60;
export const PLAYER_SPEED=230;
export const KEY_STEP=24;
export const roomPoints:Record<string,Point>={kta:{x:155,y:155},cfir:{x:530,y:175},facilitation:{x:790,y:185},staff:{x:180,y:500},reaim:{x:520,y:490},final:{x:745,y:515}};
// Positions follow furniture in the raster map. Document markers sit on tables.
const sourcePoints:Record<string,Point>[]=[
 {nurse:{x:375,y:175},tech:{x:100,y:445},audit:{x:465,y:375}},
 {charge:{x:90,y:415},night:{x:220,y:445},supply:{x:845,y:112}},
 {new:{x:375,y:175},champion:{x:710,y:180},leader:{x:125,y:455}},
];
export function evidencePoint(teamId:number,id:string,room:string,index:number):Point{return sourcePoints[teamId]?.[id]||{x:roomPoints[room].x+(index%2?65:-65),y:roomPoints[room].y-25};}
export function secondsLeft(deadline:number,now:number):number{return Math.max(0,Math.ceil((deadline-now)/1000));}
export function timerLabel(seconds:number):string{return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
export const studyFiles=['/hospital-preview/resumo-aurora.pdf','/hospital-preview/resumo-nexo.pdf','/hospital-preview/resumo-pulsar.pdf'];
