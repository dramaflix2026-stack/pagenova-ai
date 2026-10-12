"use client";
import { useMemo, useState } from "react";
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
  const data: UniversalSiteData = useMemo(() => {
    const p = presets[preset];
    const isReference = preset === "frigolog";
    return {
      ...frigologReferenceData,
      brand: { ...frigologReferenceData.brand, name: name.trim() || p.name, tagline: p.tagline },
      palette: { ...frigologReferenceData.palette, primary: primary || p.primary },
      hero: { ...frigologReferenceData.hero, title: p.title, eyebrow: p.tagline,
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
      about: isReference ? frigologReferenceData.about : {
        ...frigologReferenceData.about, eyebrow: "QUEM SOMOS",
        heading: "Conheça nossa história.",
        paragraphs: ["Nossa empresa acredita que cada cliente merece uma experiência especial. Combinamos atendimento próximo, profissionalismo e dedicação.", "Trabalhamos para entregar resultados consistentes e construir relações de confiança."],
        benefits: ["Atendimento próximo e humanizado", "Profissionais preparados", "Compromisso com a sua satisfação"],
        ctaLabel: "Conheça nossa equipe",
      },
      coverage: isReference ? frigologReferenceData.coverage : { ...frigologReferenceData.coverage, eyebrow: "NOSSA ESTRUTURA", heading: "Preparados para atender você.", description: "Conheça nossa estrutura e descubra como podemos ajudar." },
      contact: isReference ? frigologReferenceData.contact : { ...frigologReferenceData.contact, eyebrow: "VAMOS CONVERSAR?", heading: "Seu próximo passo começa aqui.", description: "Fale com nossa equipe e descubra a solução ideal.", ctaLabel: "Entre em contato" },
      footer: { copyright: "© 2026 " + (name.trim() || p.name) + ". Todos os direitos reservados." }
    };
  }, [preset, name, primary]);

  return <div>
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-3 border-b bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
      <strong>PageNova · Prévia universal</strong>
      <label className="flex items-center gap-2">Nicho
        <select aria-label="Selecionar nicho" className="rounded border px-2 py-2" value={preset} onChange={e => {setPreset(e.target.value as PresetKey);setName("");setPrimary("");}}>
          <option value="frigolog">FRIGOLOG original</option><option value="clinica">Clínica</option><option value="imobiliaria">Imobiliária</option><option value="restaurante">Restaurante</option>
        </select>
      </label>
      <input aria-label="Nome da empresa" className="w-44 rounded border px-3 py-2" placeholder="Nome da empresa" value={name} onChange={e=>setName(e.target.value)} maxLength={48}/>
      <label className="flex items-center gap-2">Cor <input aria-label="Cor principal" type="color" value={primary || presets[preset].primary} onChange={e=>setPrimary(e.target.value)}/></label>
      <span className="text-xs text-amber-800">Demonstração: imagens ainda são as do FRIGOLOG. IA não conectada.</span>
    </div>
    <UniversalFrigologTemplate data={data}/>
  </div>;
}
