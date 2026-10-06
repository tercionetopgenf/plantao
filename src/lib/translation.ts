import {enContent} from './en-content.ts';
import {enUI} from './en-ui.ts';
export type Language='pt'|'en';
export const english:Record<string,string>={...enContent,...enUI};
const variants:Record<string,string>={...english};
for(const [pt,en]of Object.entries(english)){variants[pt.toLocaleUpperCase('pt-BR')]=en.toLocaleUpperCase('en');}
const keys=Object.keys(variants).filter(k=>variants[k]!==k).sort((a,b)=>b.length-a.length);
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Composite status messages contain canonical strings, names and numbers.
// Match their known segments once, without retranslating generated English.
const pattern=new RegExp(keys.map(escape).join('|'),'gu');
export function translate<T>(value:T,language:Language):T{
 if(language==='pt')return value;
 if(Array.isArray(value))return value.map(v=>translate(v,language)) as T;
 if(typeof value!=='string')return value;
 if(Object.hasOwn(variants,value))return variants[value] as T;
 const trimmed=value.trim();
 if(Object.hasOwn(variants,trimmed))return value.replace(trimmed,variants[trimmed]) as T;
 return value.replace(pattern,(match,offset:number,full:string)=>{
  const before=full[offset-1]||'',after=full[offset+match.length]||'';
  if(/\p{L}/u.test(match[0])&&/\p{L}/u.test(before)||/\p{L}/u.test(match.at(-1)!)&&/\p{L}/u.test(after))return match;
  return variants[match];
 }) as T;
}
