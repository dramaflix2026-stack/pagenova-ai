/**
 * The CRM worker reports each real stage in /site-jobs/:id/events.
 * This is a stage milestone, NOT an elapsed-time estimate.
 * Never advance merely because a timer fired.
 */
export const REAL_GENERATION_STAGES = [
  { id:"VALIDATING_BRIEFING", percent:10, label:"Preparando seu briefing" },
  { id:"PLANNING", percent:20, label:"Planejando o visual e a estrutura" },
  { id:"GENERATING_CONTENT", percent:30, label:"Criando os textos e as seções" },
  { id:"VALIDATING_SCHEMA", percent:40, label:"Validando a estrutura" },
  { id:"PREPARING_ASSETS", percent:50, label:"Organizando as imagens" },
  { id:"RENDERING", percent:60, label:"Montando a página" },
  { id:"APPLYING_MOTION", percent:70, label:"Preparando os detalhes visuais" },
  { id:"QUALITY_CHECK", percent:80, label:"Conferindo o site no celular e desktop" },
  { id:"SAVING_VERSION", percent:90, label:"Salvando a primeira versão" },
  { id:"COMPLETED", percent:100, label:"Seu site está pronto!" },
] as const;
export type RealGenerationStage=(typeof REAL_GENERATION_STAGES)[number]["id"];
export type GenerationProgress = {percent:number;label:string;stage:RealGenerationStage|null;jobId:string|null};
export const INITIAL_GENERATION_PROGRESS:GenerationProgress={
  percent:0,label:"Preparando seu projeto...",stage:null,jobId:null,
};
export function milestoneFor(stage:string|null|undefined) {
  return REAL_GENERATION_STAGES.find(s=>s.id===stage)??null;
}
