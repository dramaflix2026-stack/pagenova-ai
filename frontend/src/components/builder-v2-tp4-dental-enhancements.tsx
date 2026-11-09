"use client";
import {useEffect,useRef,useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {TP4_DENTAL_TEAM_IMAGES} from "@/lib/tp4-dental-photo-catalog";
import "./builder-v2-tp4-dental-enhancements.css";

const demoProfiles=[
 {name:"Mariana Oliveira",avatar:"https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",text:"Gostei de ter informações claras sobre a avaliação odontológica e entender melhor as etapas do atendimento."},
 {name:"Rafael Martins",avatar:"https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",text:"A apresentação dos cuidados preventivos facilitou bastante a compreensão das opções de saúde bucal."},
 {name:"Camila Rodrigues",avatar:"https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",text:"É importante encontrar informações sobre limpeza dental e prevenção antes de solicitar uma consulta."},
 {name:"Lucas Ferreira",avatar:"https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",text:"O passo a passo apresentado tornou mais simples entender como entrar em contato para uma avaliação."},
 {name:"Beatriz Almeida",avatar:"https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",text:"A organização das especialidades odontológicas e das dúvidas frequentes transmite clareza."},
];
const dentistDisclaimer="FOTOS E RELATOS ILUSTRATIVOS • Exemplos fictícios para edição. Não representam pacientes nem avaliações reais.";
function meaningfulReviews(site:BuilderV2SiteData){
 return site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avaliac|relato/i.test(b.section||"")).map(b=>{
  const parts=(b.text||"").split(/\s*\|\s*/);
  const name=parts[0]?.trim()||"";
  const text=parts.length>=3?parts.slice(2).join(" | ").trim():"";
  const avatar=site.blocks.find(img=>img.type==="image"&&img.section===b.section&&img.forCardId===b.id&&img.userUploaded)?.src;
  return {name,text,avatar};
 }).filter(r=>r.name.length>2&&r.text.length>16);
}
export function DentalTestimonials({site,publishedMode=false}:{site:BuilderV2SiteData;publishedMode?:boolean}){
 const verified=meaningfulReviews(site);
 const examples=!publishedMode&&verified.length===0;
 const rows=examples?demoProfiles:verified;
 if(!rows.length)return <div className="pn-dental-pending"><h3>Avaliações de pacientes</h3><p>Esta seção receberá depoimentos reais e autorizados quando forem cadastrados. Nenhuma avaliação foi inventada.</p></div>;
 return <div className="pn-dental-social-proof">
  {examples&&<p className="pn-dental-demo-banner">{dentistDisclaimer}</p>}
  <div className="pn-dental-testimonial-grid">{rows.slice(0,5).map((r,i)=><article key={i} className="pn-dental-review">
   <div className="pn-dental-review-top">
    {r.avatar?<img src={r.avatar} alt={examples?"Retrato de banco de imagens, não representa paciente":"Retrato fornecido pelo cliente"} loading="lazy"/>:<span aria-hidden="true" className="pn-dental-review-initials">{r.name.split(" ").slice(0,2).map(p=>p[0]).join("")}</span>}
    <div><strong>{r.name}</strong><small>{examples?"Perfil demonstrativo fictício":"Depoimento fornecido pela clínica"}</small></div>
   </div>
   <p>“{r.text}”</p>
  </article>)}</div>
 </div>;
}
export function DentalTeamGallery(){
 return <div className="pn-dental-team-photo-grid">{TP4_DENTAL_TEAM_IMAGES.map((src,i)=><figure key={src}><img src={src+"?auto=compress&cs=tinysrgb&w=750"} alt={"Profissional de odontologia, foto editorial ilustrativa "+(i+1)} loading="lazy"/><figcaption>Foto editorial ilustrativa {String(i+1).padStart(2,"0")}</figcaption></figure>)}</div>;
}
function AnimatedNumber({target,suffix=""}:{target:number;suffix?:string}){
 const [value,setValue]=useState(0);
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  if(typeof window==="undefined")return;
  let frame=0,started=false;
  const animate=()=>{
   if(started)return;started=true;
   if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setValue(target);return;}
   const start=performance.now(),duration=1350;
   const tick=(now:number)=>{const progress=Math.min(1,(now-start)/duration);setValue(Math.round(target*(1-Math.pow(1-progress,3))));if(progress<1)frame=requestAnimationFrame(tick);};
   frame=requestAnimationFrame(tick);
  };
  if(typeof IntersectionObserver==="undefined"){animate();return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){animate();observer.disconnect();}},{threshold:.2});
  observer.observe(el);
  return ()=>{observer.disconnect();if(frame)cancelAnimationFrame(frame);};
 },[target]);
 return <span ref={ref} className="pn-dental-animated-num" aria-label={String(target)+suffix}>{value.toLocaleString("pt-BR")}{suffix}</span>;
}
export function DentalMetrics({site,model,publishedMode=false}:{site:BuilderV2SiteData;model:"02"|"03";publishedMode?:boolean}){
 // These are PREVIEW-ONLY example figures. Site generation must never pretend
 // that a dentist has treated 1,250 people or achieved a 98% approval score.
 // The published version shows the correct business KPIs as unfilled slots
 // until the clinic supplies verified numbers.
 const examples=[
  {target:1250,suffix:"+",label:"Atendimentos realizados"},
  {target:8,suffix:"+",label:"Anos de experiência"},
  {target:4,suffix:"",label:"Profissionais na equipe"},
  {target:98,suffix:"%",label:"Satisfação dos pacientes"}
 ];
 return <div className="pn-dental-kpis" data-dental-kpis={publishedMode?"pending":"preview-examples"}>
  <p className="pn-dental-kpis-note">{publishedMode?"Indicadores odontológicos: preencha com dados reais e verificáveis da clínica.":"SIMULAÇÃO PARA PERSONALIZAÇÃO — Os números abaixo são apenas exemplos fictícios de indicadores odontológicos; não representam atendimentos, pacientes ou resultados reais da clínica."}</p>
  <div className="pn-dental-kpi-grid">{examples.map(item=><div className="pn-dental-kpi" key={item.label}>
   {publishedMode?<strong className="pn-dental-kpi-empty" aria-label="Indicador pendente de dado verificado">—</strong>:<AnimatedNumber target={item.target} suffix={item.suffix}/>}
   <span className="pn-dental-kpi-label">{item.label}</span>
   <small className="pn-dental-kpi-status">{publishedMode?"Aguardando dado real":"Valor ilustrativo"}</small>
  </div>)}</div>
 </div>;
}
export function DentalLocation({site}:{site:BuilderV2SiteData}){
 const address=site.footer?.address?.trim()||"Rua Exemplo, 100 — Centro, São Paulo/SP";
 const demonstration=!site.footer?.address?.trim();
 const phone=(site.footer?.whatsapp||site.restaurant?.whatsapp||"").replace(/\D/g,"");
 const hasWhatsapp=phone.length>=10&&phone.length<=15;
 const mapLocation=demonstration?"Centro, São Paulo, SP, Brasil":address;
 return <div className="pn-dental-location">
  <iframe title={"Mapa "+(demonstration?"demonstrativo":"de localização")} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://www.google.com/maps?q="+encodeURIComponent(mapLocation)+"&output=embed"} allowFullScreen/>
  <div className="pn-dental-location-bottom"><div><strong>{demonstration?"Localização demonstrativa":"Nossa localização"}</strong><address>{address}{demonstration?" • ENDEREÇO FICTÍCIO / EDITÁVEL":""}</address></div>
  {hasWhatsapp?<a className="pn-dental-whatsapp" href={"https://wa.me/"+phone} rel="noreferrer noopener" target="_blank">Falar no WhatsApp ↗</a>:<span className="pn-dental-whatsapp pn-dental-whatsapp--inactive" role="status">WhatsApp — configurar número</span>}</div>
 </div>;
}
export function DentalPremiumFooter({site,variant}:{site:BuilderV2SiteData;variant:"01"|"02"|"03"}){
 const brand=site.header?.brand||site.title||"Clínica odontológica";
 const nav=variant==="01"?[["Início","#dental-home"],["Serviços","#dental-services"],["Galeria","#dental-gallery"],["Contato","#dental-contact"]]:variant==="02"?[["Início","#tp4-home"],["Sobre","#tp4-about"],["Especialidades","#tp4-services"],["Contato","#tp4-contact"]]:[["Início","#m3-top"],["Sobre","#m3-about"],["Especialidades","#m3-services"],["Contato","#m3-contact"]];
 const phone=(site.footer?.whatsapp||"").replace(/\D/g,""),email=site.footer?.email?.trim()||"";
 return <footer className={"pn-dental-footer pn-dental-footer-"+variant}><div className="pn-dental-footer-inner">
  <div className="pn-dental-footer-head"><span className="pn-dental-footer-label">ODONTOLOGIA · CUIDADO · CONFIANÇA</span><a href={nav[0][1]} className="pn-dental-footer-up">Voltar ao topo ↑</a></div>
  <div className="pn-dental-footer-main"><div className="pn-dental-footer-intro"><h2>{brand}</h2><p>Cada sorriso merece cuidado, informação clara e atenção em cada etapa.</p></div><div className="pn-dental-footer-links">
  <div><h3>Explore</h3><nav aria-label="Links do rodapé">{nav.map(([name,href])=><a href={href} key={href}>{name}</a>)}</nav></div>
  <div><h3>Contato</h3>{email?<a href={"mailto:"+email}>{email}</a>:<p>E-mail não configurado</p>}{phone.length>=10?<a href={"https://wa.me/"+phone} target="_blank" rel="noreferrer">Conversar no WhatsApp ↗</a>:<p>WhatsApp a configurar</p>}<p>{site.footer?.address||"Endereço demonstrativo — informe sua localização"}</p></div></div></div>
  <div className="pn-dental-footer-bottom"><span>© {new Date().getFullYear()} {brand} · Todos os direitos reservados.</span><span>Conteúdo institucional · dados editáveis</span></div>
 </div></footer>;
}
