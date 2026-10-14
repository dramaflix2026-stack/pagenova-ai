"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight,
  Download, FileDown, Image as ImageIcon, ImagePlus, LoaderCircle, MoveDown,
  MoveUp, Palette, PenLine, Plus, Printer, RefreshCw, Save, Sparkles,
  Trash2, Upload, WandSparkles, X, Mic, MicOff, Video, AudioLines, Paperclip,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ebookThemes, makeEmptyPage, normalizeEbook, type EbookImageMode,
  type EbookPage, type EbookPageKind, type EbookProject, type EbookTheme } from "@/lib/ebooks/schema";
import { renderEbookHtml } from "@/lib/ebooks/render";
import {planEbookPages,layoutQuality,isPhotoPage} from "@/lib/ebooks/blueprint";
import { deleteEbook, listEbooks, saveEbook } from "@/lib/ebooks/storage";
import type { EbookSummary } from "@/lib/ebooks/cloud";

const IDEAS = [
  { icon:"✦", title:"Guia prático", prompt:"Crie um guia completo e didático com etapas práticas para quem está começando a empreender no marketing digital, com exemplos e checklists." },
  { icon:"◈", title:"Educação e cursos", prompt:"Escreva um ebook educativo sobre como aprender inteligência artificial do zero, com ferramentas acessíveis, exercícios e aplicações no cotidiano." },
  { icon:"◉", title:"Saúde e bem-estar", prompt:"Crie um ebook sobre hábitos de bem-estar e organização da rotina, com sugestões realistas, sem prometer resultados médicos e sem inventar estudos." },
  { icon:"▧", title:"Negócios e vendas", prompt:"Crie um ebook estratégico para pequenas empresas aprenderem a atrair clientes e melhorar o atendimento, com passos, exemplos e exercícios." },
];
const PAGE_COUNTS=[6,8,10,12,16];
const PAGE_KINDS:{value:EbookPageKind;label:string}[]=[
  {value:"cover",label:"Capa"},{value:"chapter",label:"Capítulo"},
  {value:"feature",label:"Imagem + texto"},{value:"quote",label:"Destaque"},
  {value:"checklist",label:"Checklist visual"},{value:"steps",label:"Passo a passo"},
  {value:"comparison",label:"Comparativo"},{value:"timeline",label:"Linha do tempo"},
  {value:"caseStudy",label:"Estudo de caso"},{value:"gallery",label:"Galeria de ideias"},
  {value:"infographic",label:"Infográfico"},{value:"insight",label:"Dica profissional"},
  {value:"summary",label:"Resumo"},{value:"back",label:"Encerramento"}
];
const IMG_MODES:{value:EbookImageMode;label:string;description:string}[]=[
  {value:"ai",label:"Imagens com IA · recomendado",description:"Fotos temáticas originais (até 8 por ebook). Cada imagem consome uma chamada paga da API."},
  {value:"web",label:"Fotos gratuitas",description:"Fotografias licenciadas do Wikimedia Commons; se não houver foto, os infográficos permanecem."},
  {value:"none",label:"Infográficos, sem fotos",description:"Checklists, etapas, comparativos e arte editorial sem chamadas à API de imagens."},
];
const field="w-full rounded-xl border border-white/10 bg-[#0a111a] px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10";
function errorMessage(err:unknown):string{return err instanceof Error?err.message:"Não foi possível completar esta operação.";}
function slug(value:string):string{return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||"ebook";}
async function responseJson<T>(res:Response):Promise<T>{
  const data=await res.json().catch(()=>({})) as {error?:string}&T;
  if(!res.ok)throw new Error(data.error||"O servidor não concluiu a solicitação.");
  return data;
}
async function imageFromFile(file:File):Promise<string>{
  if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Selecione uma imagem PNG, JPG ou WebP.");
  if(file.size>8*1024*1024)throw new Error("A imagem deve ter até 8 MB.");
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();img.src=url;await img.decode();
    const scale=Math.min(1,1500/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const context=canvas.getContext("2d");if(!context)throw new Error("Falha ao processar a imagem.");
    context.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL("image/webp",0.75);
  }finally{URL.revokeObjectURL(url);}
}


type EbookReference = {
  id: string;
  name: string;
  kind: "image" | "video";
  frames: string[];
};

/** Attach visuals as compact, low-cost vision inputs, never as raw video uploads. */
function canvasFrame(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, 1152 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível ler o anexo visual.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.68);
}
async function imageReference(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error("Use imagens JPG, PNG ou WebP.");
  }
  if (file.size > 15_000_000) throw new Error("A imagem deve ter até 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return canvasFrame(img, img.naturalWidth, img.naturalHeight);
  } finally { URL.revokeObjectURL(url); }
}
async function videoReferences(file: File): Promise<string[]> {
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    throw new Error("Use um vídeo MP4, WebM ou MOV compatível com seu navegador.");
  }
  if (file.size > 100_000_000) throw new Error("O vídeo deve ter até 100 MB.");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px";
  document.body.appendChild(video);
  try {
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("O navegador não conseguiu abrir o vídeo.")), 12000);
      const ok = () => { clearTimeout(timeout); resolve(); };
      const fail = () => { clearTimeout(timeout); reject(new Error("Vídeo não suportado. Prefira MP4 (H.264).")); };
      video.addEventListener("loadeddata", ok, { once: true });
      video.addEventListener("error", fail, { once: true });
      video.load();
    });
    const result = [canvasFrame(video, video.videoWidth, video.videoHeight)];
    if (Number.isFinite(video.duration) && video.duration > 3) {
      try {
        await new Promise<void>((resolve,reject) => {
          const timeout = setTimeout(() => reject(new Error("seek")), 5000);
          const ok = () => { clearTimeout(timeout); resolve(); };
          video.addEventListener("seeked", ok, { once: true });
          video.currentTime = Math.min(video.duration - 0.5, video.duration * 0.55);
        });
        result.push(canvasFrame(video,video.videoWidth,video.videoHeight));
      } catch { /* first frame still usable */ }
    }
    return result;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

export default function EbooksPage(){
  const [prompt,setPrompt]=useState("");
  const [references,setReferences]=useState<EbookReference[]>([]);
  const [attachmentMenu,setAttachmentMenu]=useState(false);
  const [attachmentBusy,setAttachmentBusy]=useState(false);
  const [recording,setRecording]=useState(false);
  const [audioNote,setAudioNote]=useState("");
  const mediaImageInput=useRef<HTMLInputElement|null>(null);
  const mediaVideoInput=useRef<HTMLInputElement|null>(null);
  const mediaAudioInput=useRef<HTMLInputElement|null>(null);
  const recorder=useRef<MediaRecorder|null>(null);
  const recordingStream=useRef<MediaStream|null>(null);
  const [pageCount,setPageCount]=useState(8);
  const [theme,setTheme]=useState<EbookTheme>("editorial");
  const [tone,setTone]=useState("Didático e envolvente");
  const [author,setAuthor]=useState("");
  const [mode,setMode]=useState<EbookImageMode>("ai");
  const [book,setBook]=useState<EbookProject|null>(null);
  const [saved,setSaved]=useState<EbookProject[]>([]);
  const [cloudSaved,setCloudSaved]=useState<EbookSummary[]>([]);
  const [active,setActive]=useState(0);
  const [editorOpen,setEditorOpen]=useState(false);
  const [generating,setGenerating]=useState(false);
  const [imagesBusy,setImagesBusy]=useState(false);
  const [imageIndex,setImageIndex]=useState<number|null>(null);
  const [exporting,setExporting]=useState(false);
  const [savedStatus,setSavedStatus]=useState("");
  const [imageProgress,setImageProgress]=useState("");
  const [revision,setRevision]=useState("");
  const [revising,setRevising]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [scale,setScale]=useState(0.65);
  const previewArea=useRef<HTMLDivElement|null>(null);
  const gestureStart=useRef<{x:number;y:number}|null>(null);
  const uploadInput=useRef<HTMLInputElement|null>(null);
  const cloudWriteQueue=useRef<Promise<void>>(Promise.resolve());
  const activeRef=useRef(0);
  activeRef.current=active;

  useEffect(()=>{
    return () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      recordingStream.current?.getTracks().forEach(track => track.stop());
    };
  },[]);
  useEffect(()=>{
    listEbooks().then(setSaved).catch(()=>setNotice("O armazenamento local está indisponível."));
    void fetch("/api/ebooks",{cache:"no-store"})
      .then(responseJson<{ebooks:EbookSummary[]}>)
      .then(data=>setCloudSaved(data.ebooks||[])).catch(()=>undefined);
  },[]);
  useEffect(()=>{
    if(!book)return;
    setSavedStatus("Salvando...");
    const timer=window.setTimeout(()=>{
      saveEbook(book).then(()=>setSavedStatus("Salvo no dispositivo"))
        .catch(()=>setSavedStatus("Não foi possível salvar no dispositivo"));
    },650);
    return ()=>window.clearTimeout(timer);
  },[book]);
  useEffect(()=>{
    if(!book)return;
    const snapshot=book;
    const timer=window.setTimeout(()=>{
      // Serialize writes so slow responses cannot overwrite a newer draft.
      cloudWriteQueue.current=cloudWriteQueue.current.then(async()=>{
        const response=await fetch("/api/ebooks",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ebook:snapshot}),cache:"no-store",
        });
        const data=await responseJson<{ebook:EbookSummary}>(response);
        setCloudSaved(list=>[data.ebook,...list.filter(item=>item.id!==data.ebook.id)]);
        setSavedStatus("Salvo na sua conta");
      }).catch(()=>{setSavedStatus("Salvo no dispositivo · nuvem indisponível");});
    },2600);
    return ()=>window.clearTimeout(timer);
  },[book]);
  useEffect(()=>{
    if(!book||!previewArea.current)return;
    const target=previewArea.current;
    const measure=()=>{
      const style=window.getComputedStyle(target);
      const innerWidth=target.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
      setScale(Math.max(.18,Math.min(1,Math.max(1,innerWidth)/794)));
    };
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(target);
    return ()=>observer.disconnect();
  },[book]);
  const updateBook=(patch:Partial<EbookProject>)=>{
    setBook(previous=>previous?{...previous,...patch,updatedAt:new Date().toISOString()}:previous);
    setNotice("");setError("");
  };
  const updatePage=(patch:Partial<EbookPage>)=>{
    setBook(previous=>{
      if(!previous)return previous;
      const pages=previous.pages.map((page,index)=>index===activeRef.current?{...page,...patch}:page);
      return {...previous,pages,updatedAt:new Date().toISOString()};
    });
    setError("");
  };
  function openDraft(raw:EbookProject) {
    try{
      const selected=normalizeEbook(raw);
      setBook(selected);setActive(0);setEditorOpen(false);setError("");setNotice("");
    }catch(err){setError(errorMessage(err));}
  }
  async function removeDraft(item:EbookProject|EbookSummary){
    if(!window.confirm("Excluir o ebook \""+item.title+"\" deste dispositivo e da sua conta?"))return;
    try{
      await deleteEbook(item.id);
      const response=await fetch("/api/ebooks/"+encodeURIComponent(item.id),{method:"DELETE"});
      if(!response.ok&&response.status!==404){
        setNotice("Projeto local excluído; não foi possível excluir a cópia na nuvem.");
      }
      setSaved(list=>list.filter(book=>book.id!==item.id));
      setCloudSaved(list=>list.filter(book=>book.id!==item.id));
      if(book?.id===item.id)setBook(null);
    }catch(err){setError(errorMessage(err));}
  }
  async function openCloudDraft(item:EbookSummary){
    try{
      const response=await fetch("/api/ebooks/"+encodeURIComponent(item.id),{cache:"no-store"});
      const data=await responseJson<{ebook:EbookProject}>(response);
      openDraft(data.ebook);
      void saveEbook(data.ebook);
    }catch(err){setError(errorMessage(err));}
  }
  async function embedInternetPhoto(url:string):Promise<string>{
    // Download through our authenticated Commons proxy and embed the compact
    // JPEG in the document. Preview, cloud autosave, and PDF all use the same
    // durable photo rather than a browser-dependent hotlink.
    const res=await fetch("/api/ebooks/images/asset?url="+encodeURIComponent(url),{
      credentials:"same-origin",cache:"force-cache",
    });
    if(!res.ok)throw new Error("O arquivo de imagem não está disponível.");
    const blob=await res.blob();
    if(!blob.type.startsWith("image/"))throw new Error("O banco retornou um arquivo inválido.");
    const objectUrl=URL.createObjectURL(blob);
    try{
      const img=new Image();
      img.src=objectUrl;
      await img.decode();
      const maxEdge=960;
      const scale=Math.min(1,maxEdge/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext("2d");
      if(!ctx)throw new Error("Não foi possível processar esta foto.");
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      let output=canvas.toDataURL("image/jpeg",0.68);
      if(output.length>250_000)output=canvas.toDataURL("image/jpeg",0.48);
      if(output.length>400_000)throw new Error("Foto grande demais para este ebook.");
      return output;
    }finally{URL.revokeObjectURL(objectUrl);}
  }
  async function imageRequest(
    page:EbookPage,source:EbookImageMode,topic="",usedPhotos?:Set<string>,
  ):Promise<{url:string;credit:string}|null>{
    if(source==="none")return null;
    const description=page.imagePrompt||page.title;
    if(source==="ai"){
      const res=await fetch("/api/ebooks/images/generate",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt:description,orientation:page.kind==="cover"||page.kind==="gallery"?"landscape":"portrait"}),cache:"no-store",
      });
      const data=await responseJson<{image?:{url:string;credit:string}|null}>(res);
      if(!data.image)throw new Error("A IA não retornou a imagem.");
      const asset=data.image;
      // Compact images before autosave and PDF export.
      if(asset.url.startsWith("data:image/")){
        const img=new Image();
        img.src=asset.url;
        await img.decode();
        const canvas=document.createElement("canvas");
        const scale=Math.min(1,880/Math.max(img.naturalWidth,img.naturalHeight));
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=canvas.getContext("2d");
        if(ctx){
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          return {url:canvas.toDataURL("image/jpeg",0.68),credit:asset.credit};
        }
      }
      return asset;
    }
    const params=new URLSearchParams({
      q:description,title:page.title,topic,
    });
    const res=await fetch("/api/ebooks/images/search?"+params.toString(),{cache:"no-store"});
    const data=await responseJson<{
      image?:{url:string;credit:string}|null;
      candidates?:Array<{url:string;credit:string}>;
      notice?:string;
    }>(res);
    const candidates=data.candidates?.length?data.candidates:(data.image?[data.image]:[]);
    if(!candidates.length)throw new Error(data.notice||"Não foram encontradas fotos livres.");
    for(const candidate of candidates){
      if(!candidate.url||usedPhotos?.has(candidate.url))continue;
      try{
        const embedded=await embedInternetPhoto(candidate.url);
        // A photo may have been used by another worker during the download.
        if(usedPhotos?.has(candidate.url))continue;
        usedPhotos?.add(candidate.url);
        return {url:embedded,credit:candidate.credit};
      }catch{
        // Bad photo URLs must not abort the entire ebook. Try next candidate.
      }
    }
    throw new Error("As fotos encontradas não puderam ser baixadas. Tente novamente.");
  }
  async function populateImages(created:EbookProject){
    if(created.imageMode==="none"||imagesBusy)return;
    setImagesBusy(true);
    setError("");
    setImageProgress(created.imageMode==="web"?"Procurando fotos reais com licença aberta...":"Gerando ilustrações com IA...");
    const budget=created.imageMode==="ai"
      ?Math.min(8,Math.max(3,Math.ceil(created.pages.length*.44))):Math.min(12,created.pages.length);
    const indices=created.pages.map((p,i)=>({p,i}))
      .filter(item=>!item.p.imageUrl && isPhotoPage(item.p.kind))
      .slice(0,budget);
    if(!indices.length){
      setImagesBusy(false);
      setImageProgress("Todas as páginas visuais já possuem imagem.");
      return;
    }
    let completed=0,added=0,position=0;
    const usedPhotos=new Set<string>();
    const failures:string[]=[];
    const worker=async()=>{
      while(position<indices.length){
        const current=indices[position++];
        if(!current)break;
        try{
          const result=await imageRequest(current.p,created.imageMode,created.title,usedPhotos);
          if(result){
            added++;
            setBook(previous=>previous?.id===created.id?{
              ...previous,
              pages:previous.pages.map((p,i)=>i===current.i&&!p.imageUrl
                ?{...p,imageUrl:result.url,imageCredit:result.credit}:p),
              updatedAt:new Date().toISOString(),
            }:previous);
          }else{failures.push(current.p.title);}
        }catch(err){
          failures.push(current.p.title);
          console.warn("[Ebook photos] Image unavailable",{
            page:current.i+1,reason:err instanceof Error?err.message:"unknown",
          });
        }
        completed++;
        setImageProgress(String(completed)+" de "+indices.length+" páginas verificadas · "+added+" fotos incluídas");
      }
    };
    try{
      await Promise.all([worker(),worker()]);
      if(!failures.length){
        setImageProgress(added+" foto(s) adicionada(s) ao ebook. Salvamento automático ativado.");
      }else if(added){
        setImageProgress(added+" de "+indices.length+" fotos incluídas. "+
          failures.length+" páginas sem foto licenciada; toque em Fotos para tentar novamente.");
      }else{
        setImageProgress("As fotos não puderam ser incluídas nesta tentativa. "+
          "O ebook segue com infográficos úteis, sem espaços visuais vazios. "+
          "Use o editor para enviar sua própria foto ou gerar com IA.");
      }
    }finally{setImagesBusy(false);}
  }

  async function transcribeAudio(file: File) {
    if (file.size > 3.5 * 1024 * 1024) throw new Error("O áudio deve ter até 3,5 MB. Para gravações longas, envie em partes.");
    setAttachmentBusy(true);
    setAudioNote("Transcrevendo áudio...");
    try {
      const body = new FormData();
      body.append("file", file, file.name);
      const res = await fetch("/api/ebooks/transcribe", { method: "POST", body, cache: "no-store" });
      const result = await responseJson<{text:string}>(res);
      setPrompt(previous => previous.trim() ? previous + "\n\n" + result.text : result.text);
      setAudioNote("Áudio transcrito e incluído no briefing.");
      setError("");
    } catch (err) {
      setAudioNote("");
      setError(errorMessage(err));
    } finally { setAttachmentBusy(false); }
  }
  async function addReferenceFiles(files: FileList | null, kind: "image" | "video") {
    if (!files?.length) return;
    setAttachmentMenu(false);
    setAttachmentBusy(true);
    setError("");
    try {
      // Total visual references: four attachments, with two video frames each.
      const pending = Array.from(files).slice(0, Math.max(0, 4 - references.length));
      if (!pending.length) throw new Error("Você pode usar até 4 anexos visuais por ebook.");
      for (const file of pending) {
        const frames = kind === "image" ? [await imageReference(file)] : await videoReferences(file);
        setReferences(previous => [...previous, {
          id: crypto.randomUUID(), name: file.name, kind, frames,
        }].slice(0, 4));
      }
    } catch (err) { setError(errorMessage(err)); }
    finally { setAttachmentBusy(false); }
  }
  async function selectAudio(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setAttachmentMenu(false);
    await transcribeAudio(file);
  }
  async function toggleRecording() {
    if (recorder.current?.state === "recording") {
      setAttachmentBusy(true);
      recorder.current.stop();
      setRecording(false);
      return;
    }
    if (attachmentBusy) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Seu navegador não permite gravação. Use + > Áudio para enviar um arquivo.");
      return;
    }
    setAttachmentMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream.current = stream;
      const format = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]
        .find(mime => MediaRecorder.isTypeSupported(mime));
      const media = new MediaRecorder(stream, format ? {mimeType:format} : undefined);
      const chunks: BlobPart[] = [];
      media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      media.onstop = () => {
        stream.getTracks().forEach(track=>track.stop());
        recordingStream.current = null;
        recorder.current = null;
        setRecording(false);
        if (!chunks.length) { setError("O microfone não capturou nenhum áudio."); return; }
        const type = media.mimeType || "audio/webm";
        const ext = type.startsWith("audio/mp4") ? "m4a" : "webm";
        const recordingFile = new File(chunks, "gravacao." + ext, {type});
        void transcribeAudio(recordingFile);
      };
      media.start();
      recorder.current=media;
      setRecording(true);
      setAudioNote("Gravando... toque no microfone para terminar.");
      setError("");
    } catch {
      recordingStream.current?.getTracks().forEach(track=>track.stop());
      recordingStream.current=null;
      setRecording(false);
      setError("Acesso ao microfone negado ou indisponível. Você pode anexar um áudio pelo botão +.");
    }
  }

  async function generate(ev:FormEvent<HTMLFormElement>){
    ev.preventDefault();if(generating||attachmentBusy||recording)return;
    if(prompt.trim().length<15&&!references.length){setError("Descreva o tema ou anexe uma imagem ou vídeo.");return;}
    setGenerating(true);setError("");setNotice("");
    try{
      const result=await responseJson<{ebook:EbookProject}>(await fetch("/api/ebooks/generate",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt,pageCount,author,theme,tone,imageMode:mode,
          references:references.flatMap(item=>item.frames.map((imageUrl,index)=>({
            kind:item.kind,name:item.name,frame:index+1,imageUrl,
          }))),
        }),cache:"no-store"
      }));
      const created=normalizeEbook(result.ebook);
      // Uploaded still images become book images as well as vision references.
      const originals=references.filter(item=>item.kind==="image");
      if(originals.length){
        let image=0;
        for(const page of created.pages){
          if(image>=originals.length)break;
          if(page.kind==="cover"||page.kind==="feature"||page.kind==="chapter"){
            page.imageUrl=originals[image].frames[0];
            page.imageCredit="Imagem enviada pelo autor: "+originals[image].name;
            image++;
          }
        }
      }
      setBook(created);setActive(0);setEditorOpen(false);setSavedStatus("Salvando...");
      setGenerating(false);
      void populateImages(created);
    }catch(err){setGenerating(false);setError(errorMessage(err));}
  }
  function improvePageComposition(){
    if(!book)return;
    const plan=planEbookPages(book.prompt||book.title,book.pages.length,book.imageMode);
    const pages=book.pages.map((page,index)=>({
      ...page,kind:plan[index]?.kind||page.kind,
    }));
    updateBook({pages});
    setNotice("Layouts variados aplicados sem apagar textos, fotos ou edições. Revise as páginas e exporte novamente.");
    setActive(0);
  }
  async function fillBookWithAiPhotos(){
    if(!book||imagesBusy)return;
    const missing=book.pages.filter(page=>isPhotoPage(page.kind)&&!page.imageUrl).length;
    if(!missing)return;
    const budget=Math.min(missing,Math.min(8,Math.max(3,Math.ceil(book.pages.length*.44))));
    if(!window.confirm(
      "A PageNova vai gerar até "+budget+" fotografias originais com IA. "+
      "Cada imagem consome uma chamada paga da API. Deseja continuar?"
    ))return;
    const updated={...book,imageMode:"ai" as EbookImageMode};
    updateBook({imageMode:"ai"});
    await populateImages(updated);
  }
  async function changeImage(source:EbookImageMode){
    if(!book||imageIndex!==null)return;
    const index=active;
    const page=book.pages[index];
    if(!page)return;
    if(source==="none"){updatePage({imageUrl:"",imageCredit:""});return;}
    setImageIndex(index);setError("");
    try{
      const found=await imageRequest(page,source);
      if(!found)throw new Error("Não encontrei uma imagem disponível. Tente outra descrição ou envie a sua própria foto.");
      updatePage({imageUrl:found.url,imageCredit:found.credit});
    }catch(err){setError(errorMessage(err));}
    finally{setImageIndex(null);}
  }
  async function uploadImage(event:React.ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value="";if(!file)return;
    try{const imageUrl=await imageFromFile(file);updatePage({imageUrl,imageCredit:"Imagem enviada pelo autor"});}
    catch(err){setError(errorMessage(err));}
  }
  async function revisePage(ev:FormEvent<HTMLFormElement>){
    ev.preventDefault();if(!book||!revision.trim()||revising)return;
    setRevising(true);setError("");
    try{
      const page=book.pages[active];
      const result=await responseJson<{page:Partial<EbookPage>}>(await fetch("/api/ebooks/revise",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({page,bookTitle:book.title,instruction:revision}),cache:"no-store"
      }));
      updatePage({...result.page,id:page.id,imageUrl:page.imageUrl,imageCredit:page.imageCredit});
      setRevision("");setNotice("Página revisada com IA. A imagem foi mantida.");
    }catch(err){setError(errorMessage(err));}
    finally{setRevising(false);}
  }
  function movePage(direction:-1|1){
    if(!book)return;
    const target=active+direction;
    if(target<0||target>=book.pages.length)return;
    const pages=[...book.pages];const temp=pages[active];pages[active]=pages[target];pages[target]=temp;
    updateBook({pages});setActive(target);
  }
  function deletePage(){
    if(!book||book.pages.length<=2)return;
    if(!window.confirm("Excluir esta página do ebook?"))return;
    updateBook({pages:book.pages.filter((_,i)=>i!==active)});
    setActive(i=>Math.max(0,Math.min(i,book.pages.length-2)));
  }
  function addPage(){
    if(!book||book.pages.length>=24)return;
    const pages=[...book.pages];pages.splice(active+1,0,makeEmptyPage(active+2));
    updateBook({pages});setActive(active+1);
  }
  function openPrint(){
    if(!book)return;
    const popup=window.open("about:blank","_blank");
    if(!popup){setError("O navegador bloqueou a nova aba. Permita pop-ups para imprimir.");return;}
    popup.document.open();popup.document.write(renderEbookHtml(book));popup.document.close();
    void popup.document.fonts.ready.then(()=>window.setTimeout(()=>popup.print(),400));
    setNotice("Na janela de impressão, escolha Salvar como PDF.");
  }
  function downloadHtml(){
    if(!book)return;
    const file=new Blob([renderEbookHtml(book)],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(file);
    const link=document.createElement("a");link.href=url;link.download=slug(book.title)+".html";
    link.click();window.setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  async function downloadPdf(){
    if(!book||exporting)return;
    if(imagesBusy){
      setError("Aguarde o carregamento das imagens antes de exportar o PDF.");
      return;
    }
    const pendingVisuals=book.imageMode==="none"?0:book.pages.filter(
      page=>isPhotoPage(page.kind)&&!page.imageUrl,
    ).length;
    if(pendingVisuals>0&&!window.confirm(
      pendingVisuals+" página(s) ainda não têm foto. Elas serão exportadas com os "+
      "componentes visuais editoriais, sem placeholders vazios. Deseja continuar?"
    ))return;
    setExporting(true);setError("");
    try{
      const response=await fetch("/api/ebooks/pdf",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ebook:book}),
        cache:"no-store",
      });
      if(!response.ok){
        const data=await response.json().catch(()=>({})) as {error?:string};
        throw new Error(data.error||"O PDF não pôde ser exportado. Use Imprimir / Salvar como PDF.");
      }
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;link.download=slug(book.title)+".pdf";link.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),15000);
      setNotice("Seu PDF está pronto para baixar.");
    }catch(err){setError(errorMessage(err));}
    finally{setExporting(false);}
  }
  function beginPageGesture(x:number,y:number){
    gestureStart.current={x,y};
  }
  function finishPageGesture(x:number,y:number){
    const start=gestureStart.current;
    gestureStart.current=null;
    if(!start||!book||editorOpen)return;
    const dx=x-start.x,dy=y-start.y;
    if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.25)return;
    setActive(current=>Math.max(0,Math.min(book.pages.length-1,current+(dx<0?1:-1))));
  }
  const current=book?.pages[active];
  const photosMissing=Boolean(book && book.imageMode!=="none" && book.pages.some(p=>
    isPhotoPage(p.kind)&&!p.imageUrl));
  return <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#090d12] pb-16 text-white">
    {!book&&<AppHeader title="Gerar Ebooks" description="Seu estúdio editorial com inteligência artificial." align="center"/>}
    {!book?<div className="mx-auto max-w-[1240px] px-4 py-9 sm:px-7 sm:py-12">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[.06] px-4 py-2 text-xs font-semibold uppercase tracking-[.15em] text-emerald-300">
          <BookOpen className="h-4 w-4"/> PAGENOVA · EBOOK STUDIO
        </div>
        <h1 className="mt-7 text-[38px] font-bold leading-[1.08] tracking-tight sm:text-6xl">
          De uma ideia a um <span className="bg-gradient-to-r from-emerald-300 to-teal-500 bg-clip-text text-transparent">ebook completo.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">
          Escreva o tema. A IA transforma sua ideia em capítulos, imagens e páginas profissionais — tudo editável, pronto para exportar.
        </p>
      </div>
      <div className="mt-11 grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <form onSubmit={generate} className="rounded-[28px] border border-white/10 bg-[#101720] p-5 shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:p-7">
          <div className="flex items-center gap-2 text-sm font-bold"><WandSparkles className="h-5 w-5 text-emerald-300"/> O que vamos criar?</div>
          <div className="mt-5 overflow-visible rounded-2xl border border-white/15 bg-[#080e16] focus-within:border-emerald-400/60">
            <label htmlFor="ebook-prompt" className="sr-only">Descreva seu ebook</label>
            <textarea id="ebook-prompt" rows={8} value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder="Ex.: Crie um ebook sobre como montar um negócio online do zero para iniciantes. Quero um guia prático, com exemplos, etapas, erros comuns, estratégias e um plano de ação..."
              className="min-h-[205px] w-full resize-y rounded-t-2xl bg-transparent px-4 pt-4 pb-3 text-base leading-7 text-white outline-none placeholder:text-white/30"/>
            {references.length>0&&<div aria-label="Anexos visuais" className="flex flex-wrap gap-2 px-3 pb-3">
              {references.map(item=><div key={item.id} className="flex max-w-full items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[.06] p-1.5 pr-2 text-xs text-emerald-100">
                <img src={item.frames[0]} alt="" className="h-10 w-11 rounded object-cover"/>
                <span className="max-w-[125px] truncate">{item.kind==="video"?"Vídeo: ":"Imagem: "}{item.name}</span>
                <button type="button" aria-label={"Remover "+item.name} onClick={()=>setReferences(prev=>prev.filter(x=>x.id!==item.id))} className="rounded-md p-1 hover:bg-white/10"><X className="h-4 w-4"/></button>
              </div>)}
            </div>}
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button type="button" aria-label="Adicionar imagens, vídeos ou áudios" aria-expanded={attachmentMenu}
                    onClick={()=>setAttachmentMenu(value=>!value)} disabled={generating||attachmentBusy||recording}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-40">
                    {attachmentBusy?<LoaderCircle className="h-5 w-5 animate-spin"/>:<Plus className="h-6 w-6"/>}
                  </button>
                  {attachmentMenu&&<div className="absolute bottom-full left-0 z-30 mb-2 w-56 rounded-xl border border-white/15 bg-[#202936] p-2 shadow-2xl">
                    <button type="button" onClick={()=>mediaImageInput.current?.click()} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm hover:bg-white/10"><ImagePlus className="h-4 w-4 text-emerald-300"/> Enviar imagem</button>
                    <button type="button" onClick={()=>mediaVideoInput.current?.click()} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm hover:bg-white/10"><Video className="h-4 w-4 text-emerald-300"/> Enviar vídeo</button>
                    <button type="button" onClick={()=>mediaAudioInput.current?.click()} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm hover:bg-white/10"><AudioLines className="h-4 w-4 text-emerald-300"/> Enviar áudio</button>
                  </div>}
                </div>
                <button type="button" onClick={()=>void toggleRecording()}
                  disabled={generating||attachmentBusy}
                  aria-label={recording?"Parar gravação de áudio":"Gravar briefing por voz"}
                  aria-pressed={recording}
                  className={"flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:opacity-40 "+(recording?"border-red-400 bg-red-500/20 text-red-300 animate-pulse":"border-white/15 bg-white/[.04] text-white/70 hover:border-emerald-400/50 hover:text-emerald-200")}>
                  {recording?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}
                </button>
                <span className="text-xs text-white/35">{recording?"Gravando...":"Imagens · vídeos · voz"}</span>
              </div>
              <span className="text-[11px] text-white/30">{references.length}/4 anexos visuais</span>
            </div>
            <input ref={mediaImageInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
              onChange={e=>{void addReferenceFiles(e.target.files,"image");e.target.value="";}}/>
            <input ref={mediaVideoInput} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
              onChange={e=>{void addReferenceFiles(e.target.files,"video");e.target.value="";}}/>
            <input ref={mediaAudioInput} type="file" accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.flac" className="hidden"
              onChange={e=>{void selectAudio(e.target.files);e.target.value="";}}/>
          </div>
          {audioNote&&<p role="status" className="mt-2 text-xs text-emerald-300">{audioNote}</p>}
          <p className="mt-2 text-xs leading-5 text-white/35">
            Sem limite de caracteres no briefing. A IA analisa imagens e quadros de vídeo; áudios e gravações são transcritos em texto.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-white/60">Nome do autor ou marca<input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Ex.: Sua marca" className={field+" mt-2"}/></label>
            <label className="text-xs font-semibold text-white/60">Tom de escrita<select value={tone} onChange={e=>setTone(e.target.value)} className={field+" mt-2"}>
              <option>Didático e envolvente</option><option>Profissional e estratégico</option><option>Inspirador e acolhedor</option><option>Simples e objetivo</option>
            </select></label>
          </div>
          <div className="mt-7"><span className="text-sm font-semibold">Quantidade de páginas</span>
            <div className="mt-3 flex flex-wrap gap-2">{PAGE_COUNTS.map(n=><button key={n} type="button" onClick={()=>setPageCount(n)} aria-pressed={pageCount===n}
              className={"rounded-xl border px-5 py-3 text-sm font-semibold transition "+(pageCount===n?"border-emerald-400 bg-emerald-400/10 text-emerald-200":"border-white/10 bg-white/[.025] text-white/60 hover:border-white/30")}>{n}</button>)}</div>
          </div>
          <div className="mt-7"><span className="text-sm font-semibold">Estilo editorial</span>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{(Object.keys(ebookThemes) as EbookTheme[]).map(id=>{
              const item=ebookThemes[id];return <button type="button" key={id} onClick={()=>setTheme(id)} aria-pressed={theme===id}
                className={"rounded-xl border p-2 text-left transition "+(theme===id?"border-emerald-400":"border-white/10 hover:border-white/30")}>
                <span className="flex h-16 flex-col justify-center gap-1.5 rounded-lg px-3" style={{background:item.paper}}>
                  <span className="h-2 w-2/3 rounded-sm" style={{background:item.ink}}></span>
                  <span className="h-1 w-1/2 rounded-sm" style={{background:item.accent}}></span>
                  <span className="h-1 w-4/5 rounded-sm opacity-30" style={{background:item.ink}}></span>
                </span>
                <span className="mt-2 block text-xs font-semibold">{item.name}</span>
              </button>;
            })}</div>
          </div>
          <div className="mt-7"><span className="text-sm font-semibold">Imagens e ilustrações</span>
            <div className="mt-3 grid gap-2">{IMG_MODES.map(item=><button type="button" key={item.value} onClick={()=>setMode(item.value)}
              className={"flex items-center justify-between rounded-xl border p-3 text-left transition "+(mode===item.value?"border-emerald-400/70 bg-emerald-400/[.07]":"border-white/10 bg-white/[.02] hover:border-white/25")}>
              <span><strong className="block text-sm">{item.label}</strong><small className="mt-1 block text-xs text-white/45">{item.description}</small></span>
              <span className={"ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border "+(mode===item.value?"border-emerald-400 bg-emerald-400 text-black":"border-white/30")}>{mode===item.value&&<Check className="h-3 w-3"/>}</span>
            </button>)}</div>
          </div>
          {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={generating||attachmentBusy||recording||(prompt.trim().length<15&&!references.length)}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-4 text-base font-bold text-[#06120d] transition hover:bg-emerald-300 disabled:opacity-40">
            {generating?<><LoaderCircle className="h-5 w-5 animate-spin"/> Escrevendo e diagramando o ebook...</>:<><Sparkles className="h-5 w-5"/> Gerar meu ebook <ArrowRight className="h-5 w-5"/></>}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-white/45">
            A IA planeja e diagrama cada página. Imagens com IA são chamadas pagas adicionais (até 8 por ebook).
            Você pode optar por fotos gratuitas ou somente infográficos.
          </p>
        </form>
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#111923] p-6 sm:p-7">
            <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-emerald-300"/><h2 className="text-lg font-bold">Seu ebook, seu estilo</h2></div>
            <div className="mt-5 flex h-64 flex-col justify-between overflow-hidden rounded-2xl border border-[#d6c6ad] bg-[#f7f2e9] p-6 text-[#292922]">
              <p className="text-[10px] font-bold tracking-[.22em] text-[#b37a54]">EBOOK · EDIÇÃO DIGITAL</p>
              <div><p className="font-serif text-5xl leading-none">Ideias que viram <span className="italic text-[#b37a54]">conhecimento.</span></p>
                <p className="mt-4 text-xs leading-5 text-[#6b675f]">Conteúdo bem escrito, imagens e design em harmonia.</p></div>
              <div className="h-0.5 w-16 bg-[#b37a54]"></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/50">Planejamento editorial automático, 14 layouts, páginas com fotos, comparativos, checklists, processos e PDF A4.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#101720] p-5">
            <h2 className="text-sm font-bold">Precisa de uma ideia? Comece por aqui.</h2>
            <div className="mt-3 grid gap-2">{IDEAS.map(idea=><button type="button" key={idea.title}
              onClick={()=>{setPrompt(idea.prompt);document.getElementById("ebook-prompt")?.focus();}}
              className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-3 text-left text-sm text-white/70 hover:border-emerald-400/25 hover:text-white">
              <span className="text-xl text-emerald-300">{idea.icon}</span><span className="flex-1">{idea.title}</span><ArrowRight className="h-4 w-4"/></button>)}</div>
          </div>
        </div>
      </div>
      {(saved.length>0||cloudSaved.length>0)&&<section className="mt-11">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Seus ebooks</h2><span className="text-xs text-white/40">Rascunhos no dispositivo e na sua conta</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{saved.map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121923] p-4">
          <button type="button" onClick={()=>openDraft(item)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm">{item.title}</strong><span className="mt-1 block text-xs text-white/40">{item.pages.length} páginas · {ebookThemes[item.theme]?.name||"Editorial"}</span></button>
          <button type="button" aria-label={"Excluir "+item.title} onClick={()=>void removeDraft(item)} className="rounded-lg p-2 text-white/45 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-4 w-4"/></button>
        </div>)}
        {cloudSaved.filter(item=>!saved.some(local=>local.id===item.id)).map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-[#121923] p-4">
          <button type="button" onClick={()=>void openCloudDraft(item)} className="min-w-0 flex-1 text-left">
            <strong className="block truncate text-sm">{item.title}</strong>
            <span className="mt-1 block text-xs text-white/40">{item.pageCount} páginas · salvo na sua conta</span>
          </button>
          <button type="button" aria-label={"Excluir "+item.title} onClick={()=>void removeDraft(item)} className="rounded-lg p-2 text-white/45 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-4 w-4"/></button>
        </div>)}</div>
      </section>}
      {notice&&<p role="status" className="mt-4 text-center text-sm text-emerald-300">{notice}</p>}
    </div>:<div className="mx-auto w-full min-w-0 max-w-[1350px] px-2 py-3 sm:px-5 sm:py-5">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#101720] px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={()=>{setBook(null);setActive(0);setEditorOpen(false);void listEbooks().then(setSaved);}}
            className="shrink-0 rounded-lg p-2 text-white/75 hover:bg-white/10" aria-label="Voltar para meus ebooks">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <div className="min-w-0">
            <h2 className="max-w-[270px] truncate text-sm font-semibold sm:max-w-[460px]">{book.title}</h2>
            <p className="truncate text-[11px] text-white/45">{book.pages.length} páginas · {savedStatus}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={improvePageComposition}
            title="Reorganizar os layouts de todas as páginas sem apagar o conteúdo"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/15 px-2.5 py-2 text-xs font-semibold text-white/80 hover:border-emerald-400/35 hover:bg-emerald-400/[.06]">
            <Palette className="h-4 w-4"/><span className="hidden sm:inline">Variar layouts</span>
          </button>
          {photosMissing&&<button type="button" onClick={()=>{if(book)void populateImages(book);}}
            disabled={imagesBusy} title="Preencher com imagens as páginas ilustradas que ainda não possuem foto"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-emerald-400/25 px-2.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-50">
            {imagesBusy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<ImagePlus className="h-4 w-4"/>}
            <span className="hidden min-[385px]:inline">Imagens</span>
          </button>}
          <button type="button" onClick={()=>setEditorOpen(value=>!value)}
            aria-expanded={editorOpen} aria-controls="ebook-page-editor"
            className={"inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold "+
              (editorOpen?"border-emerald-400/40 bg-emerald-400/15 text-emerald-200":"border-white/15 text-white/85 hover:bg-white/10")}>
            <PenLine className="h-4 w-4"/>{editorOpen?"Concluir":"Editar"}
          </button>
          <button type="button" onClick={()=>void downloadPdf()} disabled={exporting||imagesBusy}
            title={imagesBusy?"Aguarde a inclusão das imagens antes de exportar":"Exportar PDF A4"}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-[#071610] disabled:opacity-50">
            {exporting?<LoaderCircle className="h-4 w-4 animate-spin"/>:<FileDown className="h-4 w-4"/>}
            <span className="hidden min-[380px]:inline">{exporting?"Exportando...":"PDF"}</span>
          </button>
        </div>
      </div>
      {(notice||error||imagesBusy||imageProgress)&&<div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#101720] px-4 py-3 text-sm">
        {imagesBusy&&<LoaderCircle className="h-4 w-4 animate-spin text-emerald-300"/>}
        {imagesBusy||imageProgress?<span className="text-white/60">{imageProgress}</span>:null}
        {notice&&<span className="text-emerald-200">{notice}</span>}
        {error&&<span role="alert" className="text-red-300">{error}</span>}
      </div>}
      {photosMissing&&!imagesBusy&&book.imageMode!=="ai"&&<div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[.045] px-4 py-3">
        <p className="text-xs leading-5 text-white/70">
          Este ebook ainda tem páginas sem foto. Os layouts usam infográficos no lugar dos espaços vazios.
        </p>
        <button type="button" onClick={()=>void fillBookWithAiPhotos()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-[#08291c] hover:bg-emerald-300">
          <ImagePlus className="h-4 w-4"/> Completar fotos com IA
        </button>
      </div>}
      <div className={editorOpen?"grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_355px]":"mx-auto w-full max-w-[950px]"}>
        <section ref={previewArea} aria-label="Leitor de ebook" className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#141b24] px-1 py-3 sm:px-4 sm:py-5">
          <div className="relative mx-auto overflow-hidden shadow-[0_20px_55px_rgba(0,0,0,.35)]"
            style={{width:794*scale,height:1123*scale,maxWidth:"100%",background:ebookThemes[book.theme].paper}}>
            <iframe title={"Página "+(active+1)+" do ebook"} srcDoc={renderEbookHtml(book,active)}
              sandbox="allow-same-origin" tabIndex={-1} aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 block"
              style={{width:794,height:1123,border:0,background:ebookThemes[book.theme].paper,
                transform:"scale("+scale+")",transformOrigin:"top left"}}/>
            <div tabIndex={0} role="region"
              aria-label={"Página "+(active+1)+" de "+book.pages.length+". Deslize lateralmente ou use as setas do teclado para mudar de página."}
              className="absolute inset-0 z-10 touch-pan-y cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              onTouchStart={event=>{const t=event.touches[0];if(t)beginPageGesture(t.clientX,t.clientY);}}
              onTouchEnd={event=>{const t=event.changedTouches[0];if(t)finishPageGesture(t.clientX,t.clientY);}}
              onTouchCancel={()=>{gestureStart.current=null;}}
              onPointerDown={event=>{if(event.pointerType==="mouse")beginPageGesture(event.clientX,event.clientY);}}
              onPointerUp={event=>{if(event.pointerType==="mouse")finishPageGesture(event.clientX,event.clientY);}}
              onKeyDown={event=>{
                if(event.key==="ArrowRight"){event.preventDefault();setActive(v=>Math.min(book.pages.length-1,v+1));}
                if(event.key==="ArrowLeft"){event.preventDefault();setActive(v=>Math.max(0,v-1));}
              }}/>
          </div>
          <span role="status" aria-live="polite"
            className="pointer-events-none absolute right-2 top-3 z-20 rounded-md bg-black/65 px-2 py-1 text-[11px] font-medium text-white/85 sm:right-4 sm:top-5">
            {active+1} / {book.pages.length}
          </span>
        </section>
        {editorOpen&&<aside id="ebook-page-editor" role="dialog" aria-modal={false} aria-label="Editar página do ebook"
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain border border-white/10 bg-[#111923] p-4 pt-5 shadow-2xl lg:static lg:z-auto lg:max-h-[calc(100vh-160px)] lg:rounded-2xl lg:shadow-none">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2"><PenLine className="h-4 w-4 text-emerald-300"/><h3 className="text-sm font-bold">Editar página {active+1}</h3></div>
            <button type="button" onClick={()=>setEditorOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/85 hover:bg-white/10">
              <Check className="h-4 w-4"/> Concluir
            </button>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-white/60">Título do ebook<input className={field+" mt-2"} value={book.title} onChange={e=>updateBook({title:e.target.value})}/></label>
            <label className="block text-xs font-semibold text-white/60">Subtítulo<input className={field+" mt-2"} value={book.subtitle} onChange={e=>updateBook({subtitle:e.target.value})}/></label>
            <label className="block text-xs font-semibold text-white/60">Autor<input className={field+" mt-2"} value={book.author} onChange={e=>updateBook({author:e.target.value})}/></label>
            <label className="block text-xs font-semibold text-white/60">Visual<select value={book.theme} onChange={e=>updateBook({theme:e.target.value as EbookTheme})} className={field+" mt-2"}>
              {(Object.keys(ebookThemes) as EbookTheme[]).map(id=><option key={id} value={id}>{ebookThemes[id].name}</option>)}</select></label>
            <div className="border-t border-white/10 pt-5">
              <div className="mb-4 flex items-center justify-between"><h4 className="text-sm font-bold">Página {active+1}</h4><div className="flex gap-1">
                <button onClick={()=>movePage(-1)} disabled={active===0} className="rounded-lg p-2 text-white/60 hover:bg-white/10 disabled:opacity-30" aria-label="Mover página para cima"><MoveUp className="h-4 w-4"/></button>
                <button onClick={()=>movePage(1)} disabled={active===book.pages.length-1} className="rounded-lg p-2 text-white/60 hover:bg-white/10 disabled:opacity-30" aria-label="Mover página para baixo"><MoveDown className="h-4 w-4"/></button>
                <button onClick={deletePage} disabled={book.pages.length<=2} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10 disabled:opacity-30" aria-label="Excluir página"><Trash2 className="h-4 w-4"/></button>
              </div></div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-white/60">Composição<select value={current?.kind||"chapter"} onChange={e=>updatePage({kind:e.target.value as EbookPageKind})} className={field+" mt-2"}>
                  {PAGE_KINDS.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="block text-xs font-semibold text-white/60">Marcador da página<input className={field+" mt-2"} value={current?.eyebrow||""} onChange={e=>updatePage({eyebrow:e.target.value})}/></label>
                <label className="block text-xs font-semibold text-white/60">Título<input className={field+" mt-2"} value={current?.title||""} onChange={e=>updatePage({title:e.target.value})}/></label>
                <label className="block text-xs font-semibold text-white/60">Texto de destaque<textarea rows={3} className={field+" mt-2 resize-y"} value={current?.lead||""} onChange={e=>updatePage({lead:e.target.value})}/></label>
                <label className="block text-xs font-semibold text-white/60">Conteúdo<textarea rows={9} className={field+" mt-2 resize-y"} value={current?.body||""} onChange={e=>updatePage({body:e.target.value})}/></label>
                <label className="block text-xs font-semibold text-white/60">Tópicos (um por linha)<textarea rows={4} className={field+" mt-2 resize-y"} value={current?.bullets.join("\n")||""} onChange={e=>updatePage({bullets:e.target.value.split("\n")})}/></label>
              </div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <h4 className="flex items-center gap-2 text-sm font-bold"><ImageIcon className="h-4 w-4 text-emerald-300"/> Imagem da página</h4>
              <label className="mt-4 block text-xs font-semibold text-white/60">Descrição da imagem<textarea rows={3} className={field+" mt-2 resize-y"} value={current?.imagePrompt||""} onChange={e=>updatePage({imagePrompt:e.target.value})}/></label>
              {current?.imageUrl&&<div className="mt-3 overflow-hidden rounded-xl border border-white/10"><img src={current.imageUrl} alt={current.title} className="h-32 w-full object-cover"/><p className="px-2 py-2 text-[10px] text-white/50">{current.imageCredit}</p></div>}
              <input ref={uploadInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>void uploadImage(e)}/>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={()=>uploadInput.current?.click()} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-2.5 text-xs font-semibold hover:bg-white/5"><Upload className="h-4 w-4"/> Enviar foto</button>
                <button disabled={imageIndex!==null} onClick={()=>void changeImage("web")} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-2.5 text-xs font-semibold hover:bg-white/5 disabled:opacity-40"><ImagePlus className="h-4 w-4"/> Fotos livres</button>
                <button disabled={imageIndex!==null} onClick={()=>void changeImage("ai")} className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/15 disabled:opacity-40">
                  {imageIndex!==null?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>} Gerar imagem com IA
                </button>
                {current?.imageUrl&&<button onClick={()=>changeImage("none")} className="col-span-2 text-xs text-white/45 hover:text-white">Remover imagem</button>}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-white/40">Fotos da Wikimedia Commons incluem créditos. Imagens criadas por IA consomem chamadas da API.</p>
            </div>
            <form onSubmit={revisePage} className="rounded-xl border border-emerald-400/25 bg-emerald-400/[.05] p-3">
              <label className="text-xs font-bold text-emerald-200">✨ Converse com a IA sobre esta página</label>
              <textarea rows={3} value={revision} onChange={e=>setRevision(e.target.value)}
                placeholder="Ex.: Torne a explicação mais profunda, com exemplos práticos e linguagem simples."
                className={field+" mt-3 resize-y"}/>
              <button type="submit" disabled={revising||!revision.trim()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-3 text-xs font-bold text-[#0b1e15] disabled:opacity-40">
                {revising?<LoaderCircle className="h-4 w-4 animate-spin"/>:<WandSparkles className="h-4 w-4"/>}{revising?"Reescrevendo...":"Aplicar alteração com IA"}</button>
            </form>
            <button onClick={addPage} disabled={book.pages.length>=24} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 px-4 py-3 text-xs font-semibold text-white/70 hover:border-emerald-400/50 disabled:opacity-30"><Plus className="h-4 w-4"/> Adicionar página</button>
          </div>
        </aside>}
      </div>
      <p className="mt-4 text-center text-xs text-emerald-200/70">{layoutQuality(book.pages).families} composições editoriais · {book.pages.filter(p=>Boolean(p.imageUrl)).length} imagens inseridas · PDF A4</p>
      <p className="mt-3 text-center text-xs leading-5 text-white/40">Conteúdo assistido por IA: revise informações, direitos de imagem e alegações antes de distribuir ou comercializar o ebook.</p>
    </div>}
  </main>;
}
