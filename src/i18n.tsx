import {useSyncExternalStore} from 'react';
import {translate,type Language} from './lib/translation';
export type {Language} from './lib/translation';
const storageKey='plantao-language';
function initial():Language{try{return localStorage.getItem(storageKey)==='en'?'en':'pt';}catch{return 'pt';}}
let language:Language=initial();
const listeners=new Set<()=>void>();
function subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
function getLanguage(){return language;}
function applyDocument(){if(typeof document==='undefined')return;document.documentElement.lang=language==='en'?'en':'pt-BR';document.title=translate('Plantão da Mudança',language);}
function setLanguage(next:Language){if(next!=='pt'&&next!=='en')return;language=next;try{localStorage.setItem(storageKey,next);}catch{}applyDocument();listeners.forEach(fn=>fn());}
export function tr<T>(value:T):T{return translate(value,language);}
export function useLanguage(){const current=useSyncExternalStore(subscribe,getLanguage,()=> 'pt' as Language);return {language:current,setLanguage,tr};}
export function LanguageSelector(){const {language,setLanguage}=useLanguage();return <div className="pl-language" role="group" aria-label={language==='en'?'Choose language':'Escolher idioma'}><span aria-hidden="true">PT / EN</span><button type="button" lang="pt-BR" aria-pressed={language==='pt'} onClick={()=>setLanguage('pt')}>Português</button><button type="button" lang="en" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>English</button></div>;}
applyDocument();
