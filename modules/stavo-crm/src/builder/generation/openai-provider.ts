import { zodToJsonSchema } from 'zod-to-json-schema';
import { getEnv } from '@server/config/env';
import { buildSitePlanSystemPrompt, buildSitePlanUserMessage, SITE_PLAN_PROMPT_VERSION } from '@builder/generation/prompts/site-plan-v1';
import { sitePlanSchema } from '@builder/generation/plan-schema';
import { estimateCostUsd, PRICING_VERSION } from '@builder/generation/pricing';
import { ProviderError, type CopyPatchResult, type GenerateSitePlanInput, type OutreachInput, type OutreachResult, type PatchSectionInput, type ReviseCopyInput, type SectionPatchResult, type SiteIntelligenceProvider, type SitePlanResult, type UsageInfo } from '@builder/generation/provider';

function normalizeOpenAiPlan(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeOpenAiPlan);
  if (!value || typeof value !== 'object') return value;

  const input = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(input)) out[key] = normalizeOpenAiPlan(child);

  for (const key of ['photographyTreatment','customGoal','secondaryCta','headerCtaLabel','primaryCtaMessage','anchor','style','body','icon','subheadline','cta','personRole','tagline']) {
    if (out[key] === null) delete out[key];
  }

  if (out.options === null) out.options = [];
  return out;
}

function strictifyOpenAiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strictifyOpenAiSchema);
  if (!value || typeof value !== 'object') return value;

  const node = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(node)) out[key] = strictifyOpenAiSchema(child);

  if (out.type === 'object' && out.properties && typeof out.properties === 'object' && !Array.isArray(out.properties)) {
    out.required = Object.keys(out.properties as Record<string, unknown>);
    out.additionalProperties = false;
  }
  return out;
}

const PLAN_SCHEMA = strictifyOpenAiSchema(
  zodToJsonSchema(sitePlanSchema, { target: 'openAi', $refStrategy: 'none' }),
);
type OpenAiResponse = { id?: string; output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; usage?: { input_tokens?: number; output_tokens?: number }; error?: { message?: string } };
const outputText = (r: OpenAiResponse) => r.output_text ?? (r.output ?? []).flatMap(i => i.content ?? []).filter(p => p.type === 'output_text').map(p => p.text ?? '').join('');
function mapStatus(status:number,message:string){if(status===401||status===403)return new ProviderError('AUTH','Credencial da OpenAI invalida ou sem permissao.',false);if(status===429&&/quota|credit|billing/i.test(message))return new ProviderError('QUOTA','Credito ou cota da OpenAI insuficiente.',false);if(status===429)return new ProviderError('RATE_LIMITED','Limite de requisicoes da OpenAI atingido.',true);if(status===404&&/model/i.test(message))return new ProviderError('MODEL_UNAVAILABLE',message,false);if(status>=500)return new ProviderError('SERVER_ERROR','A OpenAI reportou um erro temporario.',true);return new ProviderError('UNKNOWN',message||'Falha na OpenAI.',false);}

export class OpenAiSiteIntelligenceProvider implements SiteIntelligenceProvider {
 readonly name='openai' as const;
 private async response(input:unknown,schema?:unknown):Promise<{data:OpenAiResponse;usage:UsageInfo}>{
  const env=getEnv(), apiKey=env.OPENAI_API_KEY?.trim(); if(!apiKey)throw new ProviderError('AUTH','OPENAI_API_KEY nao esta configurada.',false);
  const model=env.OPENAI_SITE_MODEL, startedAt=Date.now(), controller=new AbortController(), timer=setTimeout(()=>controller.abort(),env.OPENAI_SITE_TIMEOUT_MS);
  try{
   const body:Record<string,unknown>={model,input,store:false}; if(schema)body.text={format:{type:'json_schema',name:'site_plan',strict:true,schema}};
   const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
   const data=await response.json() as OpenAiResponse; if(!response.ok)throw mapStatus(response.status,data.error?.message??`HTTP ${response.status}`);
   const inputTokens=data.usage?.input_tokens??0,outputTokens=data.usage?.output_tokens??0;
   return {data,usage:{model,providerRequestId:data.id,inputTokens,cacheCreationTokens:0,cacheReadTokens:0,outputTokens,latencyMs:Date.now()-startedAt,costEstimatedUsd:estimateCostUsd(model,{inputTokens,outputTokens}),pricingVersion:PRICING_VERSION,promptVersion:SITE_PLAN_PROMPT_VERSION,attempts:1}};
  }catch(error){if(error instanceof ProviderError)throw error;if(error instanceof Error&&error.name==='AbortError')throw new ProviderError('TIMEOUT','A chamada a OpenAI excedeu o tempo limite.',true);throw new ProviderError('UNKNOWN',error instanceof Error?error.message:'Falha desconhecida na OpenAI.',true);}finally{clearTimeout(timer);}
 }
 async generateSitePlan(input:GenerateSitePlanInput):Promise<SitePlanResult>{
  const {data,usage}=await this.response(
    [{role:'developer',content:buildSitePlanSystemPrompt(input.style.motionLevel)},{role:'user',content:buildSitePlanUserMessage(input)}],
    PLAN_SCHEMA,
  );
  const raw=outputText(data);
  if(!raw)throw new ProviderError('INVALID_JSON','A OpenAI nao devolveu o plano do site.',true,usage);

  let parsed:unknown;
  try{
    parsed=normalizeOpenAiPlan(JSON.parse(raw));
  }catch{
    throw new ProviderError('INVALID_JSON','A OpenAI devolveu JSON invalido.',true,usage);
  }

  const validated=sitePlanSchema.safeParse(parsed);
  if(!validated.success){
    const issues=validated.error.issues.slice(0,8).map(issue=>{
      const path=issue.path.length?issue.path.join('.'):'raiz';
      return `${path}: ${issue.message}`;
    });
    throw new ProviderError(
      'SCHEMA_INVALID',
      `A OpenAI devolveu um plano fora do formato esperado: ${issues.join(' | ')}`,
      true,
      usage,
    );
  }

  return {plan:validated.data,usage,adjustments:[],promptVersion:SITE_PLAN_PROMPT_VERSION};
 }
 async patchSection(input:PatchSectionInput):Promise<SectionPatchResult>{const {data,usage}=await this.response(`Edite somente esta secao JSON conforme a instrucao. Responda apenas JSON.\nInstrucao: ${input.instruction}\nSecao: ${JSON.stringify(input.currentSection)}`);try{return {section:JSON.parse(outputText(data)),usage};}catch{throw new ProviderError('INVALID_JSON','A OpenAI devolveu uma secao invalida.',true,usage);}}
 async reviseCopy(input:ReviseCopyInput):Promise<CopyPatchResult>{const {data,usage}=await this.response(`Reescreva o texto em pt-BR conforme a instrucao, maximo ${input.maxLength} caracteres. Responda somente o texto.\nInstrucao: ${input.instruction}\nTexto: ${input.text}`);return {text:outputText(data).trim().slice(0,input.maxLength),usage};}
 async generateOutreachMessage(input:OutreachInput):Promise<OutreachResult>{const {data,usage}=await this.response(`Crie uma mensagem curta de prospeccao em pt-BR para ${input.businessName}${input.niche?`, nicho ${input.niche}`:''}. Inclua este link: ${input.siteUrl}. Responda somente a mensagem.`);return {message:outputText(data).trim(),usage};}
}
