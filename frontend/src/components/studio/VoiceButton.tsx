"use client";
import {useRef,useState} from "react";
import {Mic,MicOff} from "lucide-react";
type ResultEvent={results:ArrayLike<ArrayLike<{transcript:string}>>;resultIndex:number};
type SpeechSession={lang:string;continuous:boolean;interimResults:boolean;
 onresult:((event:ResultEvent)=>void)|null;onend:(()=>void)|null;onerror:(()=>void)|null;start:()=>void;stop:()=>void};
type RecognitionConstructor=new()=>SpeechSession;
export function VoiceButton({onText,disabled=false}:{onText:(text:string)=>void;disabled?:boolean}){
 const [listening,setListening]=useState(false);
 const recognition=useRef<SpeechSession|null>(null);
 function toggle(){
  if(listening){recognition.current?.stop();setListening(false);return;}
  const w=window as unknown as {SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
  const Ctor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Ctor){window.alert("Ditado por voz não disponível neste navegador. Tente o Chrome e habilite o microfone.");return;}
  const r=new Ctor();r.lang="pt-BR";r.continuous=true;r.interimResults=false;
  r.onresult=(ev)=>{for(let i=ev.resultIndex;i<ev.results.length;i++){const text=ev.results[i]?.[0]?.transcript?.trim();if(text)onText(text);}};
  r.onerror=()=>setListening(false);r.onend=()=>setListening(false);
  recognition.current=r;
  try{r.start();setListening(true);}catch{setListening(false);}
 }
 return <button type="button" disabled={disabled} onClick={toggle} title={listening?"Parar gravação":"Ditar mensagem"} aria-label={listening?"Parar ditado":"Falar com a IA"} aria-pressed={listening}
 className={"inline-flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-40 "+(listening?"border-red-400/60 bg-red-500/15 text-red-300":"border-white/15 bg-white/[.055] text-emerald-200 hover:bg-emerald-400/10")}>
  {listening?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}
 </button>;
}
