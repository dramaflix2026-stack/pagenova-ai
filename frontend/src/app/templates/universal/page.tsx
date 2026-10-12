"use client";
import { useEffect, useMemo, useState } from "react";
import { Settings2, ChevronDown, ChevronUp, RotateCcw, Download, Upload, CheckCircle2 } from "lucide-react";
import UniversalFrigologTemplate from "@/components/templates/UniversalFrigologTemplate";
import { frigologReferenceData, validateUniversalSiteData, type UniversalSiteData } from "@/lib/frigolog-template-data";
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
  const [details, setDetails] = useState("");
  const [generated, setGenerated] = useState<UniversalSiteData | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [restored, setRestored] = useState(false);
  const [heroPhoto, setHeroPhoto] = useState("");
  const [teamPhoto, setTeamPhoto] = useState("");
  const [operationPhoto, setOperationPhoto] = useState("");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pagenova-universal-draft-v1");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const draft = parsed as Record<string, unknown>;
          if (draft.generated && validateUniversalSiteData(draft.generated as UniversalSiteData).length === 0) {
            setGenerated(draft.generated as UniversalSiteData);
          }
          if (typeof draft.name === "string") setName(draft.name.slice(0, 48));
          if (typeof draft.details === "string") setDetails(draft.details.slice(0, 1200));
          if (typeof draft.primary === "string" && /^#[0-9a-fA-F]{6}$/.test(draft.primary)) setPrimary(draft.primary);
          if (typeof draft.preset === "string" && Object.prototype.hasOwnProperty.call(presets, draft.preset)) setPreset(draft.preset as PresetKey);
          if (typeof draft.heroPhoto === "string") setHeroPhoto(draft.heroPhoto);
          if (typeof draft.teamPhoto === "string") setTeamPhoto(draft.teamPhoto);
          if (typeof draft.operationPhoto === "string") setOperationPhoto(draft.operationPhoto);
        }
      }
    } catch { /* Browser storage may be unavailable */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem("pagenova-universal-draft-v1", JSON.stringify({ preset, name, details, primary, generated, heroPhoto, teamPhoto, operationPhoto }));
    } catch { /* Browser storage may be unavailable */ }
  }, [restored, preset, name, details, primary, generated, heroPhoto, teamPhoto, operationPhoto]);
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

  async function generateContent() {
    setBusy(true); setErrorMessage(""); setNotice("");
    try {
      const response = await fetch("/api/templates/universal/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: preset === "frigolog" ? "logística frigorífica" : preset, company: name.trim() || presets[preset].name, details }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível gerar.");
      if (validateUniversalSiteData(payload.data).length) throw new Error("Resposta da IA incompleta.");
      setGenerated(payload.data);
      setNotice("Conteúdo gerado. Revise antes de publicar.");
      setPanelOpen(false);
    } catch (e) { setErrorMessage(e instanceof Error ? e.message : "Falha na geração."); }
    finally { setBusy(false); }
  }
  function downloadDraft() {
    const draft = generated || data;
    const payload = { format: "pagenova-universal-v1", data: draft };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pagenova-" + draft.brand.name.toLowerCase().normalize("NFD").replace(/[^\x00-\x7F]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 50) + ".json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Rascunho exportado. Este arquivo não publica o site.");
  }
  async function importDraft(file: File | undefined) {
    if (!file) return;
    setErrorMessage("");setNotice("");
    if (file.size > 50000) { setErrorMessage("Arquivo muito grande.");return; }
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.format !== "pagenova-universal-v1" || validateUniversalSiteData(parsed.data).length) throw new Error("Arquivo incompatível ou incompleto.");
      setGenerated(parsed.data as UniversalSiteData);
      setName("");setPrimary("");setHeroPhoto("");setTeamPhoto("");setOperationPhoto("");
      setNotice("Rascunho importado com sucesso.");
      setPanelOpen(false);
    } catch (e) { setErrorMessage(e instanceof Error ? e.message : "Falha na importação."); }
  }
  const displayData = generated ? { ...generated, palette: { ...generated.palette, primary: primary || generated.palette.primary }, hero: { ...generated.hero, image: { ...generated.hero.image, src: heroPhoto || generated.hero.image.src } }, about: { ...generated.about, image: { ...generated.about.image, src: teamPhoto || generated.about.image.src } }, coverage: { ...generated.coverage, image: { ...generated.coverage.image, src: operationPhoto || generated.coverage.image.src } } } : data;
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
          <select aria-label="Selecionar nicho" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={preset} onChange={e => {setPreset(e.target.value as PresetKey);setName("");setPrimary("");setHeroPhoto("");setTeamPhoto("");setOperationPhoto("");setGenerated(null);}}>
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
        <label className="flex flex-col gap-1 text-xs font-semibold sm:col-span-2 lg:col-span-3">Informações sobre o negócio
          <textarea rows={3} maxLength={1200} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Serviços, cidade, diferenciais e público-alvo" value={details} onChange={e=>setDetails(e.target.value)}/>
        </label>
        <button type="button" disabled={busy} onClick={generateContent} className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-3">{busy ? "Gerando..." : "Gerar textos com IA"}</button>
        {errorMessage && <p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-3">{errorMessage}</p>}
        <div className="flex flex-col justify-end gap-2">
          <button type="button" onClick={() => {setPreset("frigolog");setName("");setPrimary("");setHeroPhoto("");setTeamPhoto("");setOperationPhoto("");setGenerated(null);setDetails("");setNotice("Exemplo restaurado.");}} className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold"><RotateCcw size={15}/> Restaurar exemplo</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3">
          <button type="button" onClick={downloadDraft} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"><Download size={16}/> Exportar rascunho</button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"><Upload size={16}/> Importar rascunho
            <input type="file" accept="application/json,.json" className="sr-only" onChange={async e => { await importDraft(e.target.files?.[0]); e.target.value = ""; }}/>
          </label>
        </div>
        <p className="text-xs text-amber-800 sm:col-span-2 lg:col-span-3">Rascunho salvo automaticamente neste navegador. Não está salvo no CRM nem publicado. A IA requer login e API configurada.</p>
      </div>}
    </div>
    {notice && <div role="status" className="flex items-center justify-center gap-2 bg-emerald-50 px-4 py-2 text-sm text-emerald-800"><CheckCircle2 size={16}/>{notice}</div>}
    <UniversalFrigologTemplate data={displayData}/>
  </div>;
}
