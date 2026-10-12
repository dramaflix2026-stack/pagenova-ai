"use client";
import { useMemo, useState } from "react";
import { Settings2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import UniversalFrigologTemplate from "@/components/templates/UniversalFrigologTemplate";
import { frigologReferenceData, type UniversalSiteData } from "@/lib/frigolog-template-data";
import "../frigolog/frigolog.css";
import "@/components/templates/universal-frigolog.css";

const presets = {
  frigolog: { name: "FRIGOLOG", tagline: "LOGÍSTICA FRIGORÍFICA · SÃO PAULO", title: frigologReferenceData.hero.title, heading: frigologReferenceData.services.heading, primary: "#315b82" },
  clinica: { name: "CLÍNICA VIVA", tagline: "CUIDADO E BEM-ESTAR", title: "Um novo jeito de cuidar do seu sorriso.", heading: "Atendimento completo para você e sua família.", primary: "#188f85" },
  imobiliaria: { name: "NOVA CASA", tagline: "IMÓVEIS E EXPERIÊNCIAS", title: "O imóvel ideal para a próxima fase da sua vida.", heading: "Soluções imobiliárias para cada momento.", primary: "#795eaa" },
  restaurante: { name: "CASA SABOR", tagline: "GASTRONOMIA E EXPERIÊNCIAS", title: "Momentos especiais começam à mesa.", heading: "Uma experiência gastronômica para recordar.", primary: "#a14d36" },
} as const;
type PresetKey = keyof typeof presets;

export default function UniversalTemplatePreview() {
  const [preset, setPreset] = useState<PresetKey>("frigolog");
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [heroPhoto, setHeroPhoto] = useState("");
  const [teamPhoto, setTeamPhoto] = useState("");
  const [operationPhoto, setOperationPhoto] = useState("");
  const data: UniversalSiteData = useMemo(() => {
    const p = presets[preset];
    const isReference = preset === "frigolog";
    return {
      ...frigologReferenceData,
      brand: { ...frigologReferenceData.brand, name: name.trim() || p.name, tagline: p.tagline },
      palette: { ...frigologReferenceData.palette, primary: primary || p.primary },
      hero: { ...frigologReferenceData.hero, image: { ...frigologReferenceData.hero.image, src: heroPhoto || frigologReferenceData.hero.image.src }, title: p.title, eyebrow: p.tagline,
        description: isReference ? frigologReferenceData.hero.description : "Conte a história da sua empresa, apresente seus diferenciais e transforme visitantes em clientes.",
        ctaLabel: isReference ? "Solicitar cotação" : "Entre em contato" },
      services: { ...frigologReferenceData.services, heading: p.heading,
        items: isReference ? frigologReferenceData.services.items : [
          { title: "Atendimento personalizado", description: "Soluções adaptadas às necessidades de cada cliente." },
          { title: "Equipe especializada", description: "Profissionais dedicados à qualidade em cada detalhe." },
          { title: "Experiência completa", description: "Uma jornada simples e acolhedora do início ao fim." },
          { title: "Suporte e confiança", description: "Transparência, compromisso e atenção em cada etapa." },
        ] as UniversalSiteData["services"]["items"] },
      highlights: isReference ? frigologReferenceData.highlights : [
        { title: "Qualidade", description: "Excelência em cada detalhe" },
        { title: "Experiência", description: "Atendimento personalizado" },
        { title: "Confiança", description: "Relacionamentos duradouros" },
        { title: "Perto de você", description: "Fale com nossa equipe" },
      ],
      about: isReference ? { ...frigologReferenceData.about, image: { ...frigologReferenceData.about.image, src: teamPhoto || frigologReferenceData.about.image.src } } : {
        ...frigologReferenceData.about, image: { ...frigologReferenceData.about.image, src: teamPhoto || frigologReferenceData.about.image.src }, eyebrow: "QUEM SOMOS",
        heading: "Conheça nossa história.",
        paragraphs: ["Nossa empresa acredita que cada cliente merece uma experiência especial. Combinamos atendimento próximo, profissionalismo e dedicação.", "Trabalhamos para entregar resultados consistentes e construir relações de confiança."],
        benefits: ["Atendimento próximo e humanizado", "Profissionais preparados", "Compromisso com a sua satisfação"],
        ctaLabel: "Conheça nossa equipe",
      },
      coverage: isReference ? { ...frigologReferenceData.coverage, image: { ...frigologReferenceData.coverage.image, src: operationPhoto || frigologReferenceData.coverage.image.src } } : { ...frigologReferenceData.coverage, image: { ...frigologReferenceData.coverage.image, src: operationPhoto || frigologReferenceData.coverage.image.src }, eyebrow: "NOSSA ESTRUTURA", heading: "Preparados para atender você.", description: "Conheça nossa estrutura e descubra como podemos ajudar." },
      contact: isReference ? frigologReferenceData.contact : { ...frigologReferenceData.contact, eyebrow: "VAMOS CONVERSAR?", heading: "Seu próximo passo começa aqui.", description: "Fale com nossa equipe e descubra a solução ideal.", ctaLabel: "Entre em contato" },
      footer: { copyright: "© 2026 " + (name.trim() || p.name) + ". Todos os direitos reservados." }
    };
  }, [preset, name, primary, heroPhoto, teamPhoto, operationPhoto]);

  return <div>
    <div className="sticky top-0 z-[60] border-b border-slate-200 bg-white text-slate-800 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2"><Settings2 size={18} className="shrink-0 text-blue-700"/><strong className="truncate text-sm">PageNova · Prévia universal</strong></div>
        <button type="button" onClick={() => setPanelOpen(v => !v)} aria-expanded={panelOpen} aria-controls="universal-controls" className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
          Personalizar {panelOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
      </div>
      {panelOpen && <div id="universal-controls" className="mx-auto grid max-w-6xl gap-3 border-t border-slate-200 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">Nicho
          <select aria-label="Selecionar nicho" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={preset} onChange={e => {setPreset(e.target.value as PresetKey);setName("");setPrimary("");setHeroPhoto("");setTeamPhoto("");setOperationPhoto("");}}>
            <option value="frigolog">FRIGOLOG original</option><option value="clinica">Clínica</option><option value="imobiliaria">Imobiliária</option><option value="restaurante">Restaurante</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Nome da empresa
          <input aria-label="Nome da empresa" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Nome da empresa" value={name} onChange={e=>setName(e.target.value)} maxLength={48}/>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Cor principal
          <input aria-label="Cor principal" type="color" className="h-10 w-full cursor-pointer rounded-lg border border-slate-300" value={primary || presets[preset].primary} onChange={e=>setPrimary(e.target.value)}/>
        </label>
        {([
          ["Imagem da primeira dobra", heroPhoto, setHeroPhoto],
          ["Imagem da equipe", teamPhoto, setTeamPhoto],
          ["Imagem da operação", operationPhoto, setOperationPhoto],
        ] as const).map(([label,value,setValue]) => <label key={label} className="flex flex-col gap-1 text-xs font-semibold">{label}
          <input aria-label={label} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" type="url" placeholder="https://exemplo.com/foto.jpg" value={value} onChange={e=>setValue(e.target.value)}/>
        </label>)}
        <div className="flex flex-col justify-end gap-2">
          <button type="button" onClick={() => {setPreset("frigolog");setName("");setPrimary("");setHeroPhoto("");setTeamPhoto("");setOperationPhoto("");}} className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold"><RotateCcw size={15}/> Restaurar exemplo</button>
        </div>
        <p className="text-xs text-amber-800 sm:col-span-2 lg:col-span-3">Prévia de personalização manual: fotos podem ser substituídas por URLs públicas. A geração automática por IA ainda não está conectada.</p>
      </div>}
    </div>
    <UniversalFrigologTemplate data={data}/>
  </div>;
}
