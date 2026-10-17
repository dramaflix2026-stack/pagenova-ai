import {existsSync,readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const base=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
function must(path,patterns=[]){
 const full=resolve(base,path);
 if(!existsSync(full))throw new Error("Missing critical module: "+path);
 const data=readFileSync(full,"utf8");
 for(const [rule,note] of patterns){
  if(!rule.test(data))throw new Error("Platform quality gate: "+path+" — "+note);
 }
 return data;
}
const webhook=must("frontend/src/app/api/webhooks/kiwify/route.ts",[
 [/isSupportedPageNovaProduct/,"product allowlist required"],
 [/signatureIsHex/,"authenticated signed sales required"],
 [/KIWIFY_WEBHOOK_TOKEN_MONTHLY/,"separate webhook token support required"],
 [/order_already_revoked/,"refund and chargeback replay guard required"],
 [/pagenova_credits_activate/,"purchase-to-credit reconciliation required"],
 [/subscription_renewed/,"renewal handling required"]
]);
must("frontend/src/lib/credits/server.ts",[
 [/reserveCredit/,"site quota reservation required"],[/settleJobCredit/,"failed job credit refund required"]
]);
must("frontend/src/app/api/crm/[...path]/route.ts",[
 [/reserveCredit/,"CRM credit gate required"],[/settleJobCredit/,"CRM job settlement required"]
]);
must("frontend/src/app/api/cloner/analyze/route.ts",[
 [/authorizedForms/,"Cloner must verify entitlement"],[/validateRemote/,"Cloner SSRF protection required"],
 [/MAX_HTML_BYTES/,"HTML fetch budget required"],[/createFaithfulVisual/,"Cloner must preserve source HTML rather than rebuilding generic blocks"]
]);
must("frontend/src/server/services/browser-cloner.ts",[
 [/settleDynamicPage/,"Visual clone must wait for JS content and lazy-loaded assets"],
 [/routeWebSocket/,"Headless browser must block untrusted WebSocket egress"],
 [/serviceWorkers:"block"/,"Source service workers must not persist in PageNova"]
]);
must("frontend/src/app/api/cloner/analyze/route.ts",[
 [/fetchPageWithBrowser/,"Cloner must attempt hydrated browser before static HTML"],
 [/static-html-fallback-v3/,"Cloner must report downgraded static fidelity"]
]);
must("frontend/src/server/services/faithful-cloner.ts",[
 [/visualBodyHtml/,"Cloned source layout must remain editable"],
 [/absolutizeCss/,"Imported CSS must be safely rebased"],
 [/data-cfemail/,"Cloudflare public email recovery required"]
]);
must("frontend/src/app/api/cloner/media/route.ts",[
 [/verifyClonerMedia/,"Public images must require signed URLs"],
 [/pinnedAddress/,"Media proxy must pin public network addresses"]
]);
must("frontend/src/app/app/cloner/page.tsx",[
 [/fetch\(\s*"\/api\/cloner\/analyze"/,"Cloner must call same-origin route"],
 [/savePageNovaProject/,"Editor handoff requires persistent project storage"],
 [/listPageNovaProjects/,"Previously cloned projects must appear in the Cloner"],
 [/deletePageNovaProject/,"Saved clones must be removable"],
 [/Abrir e editar/,"Saved clone reopen action missing"]
]);
must("modules/stavo-crm/src/client/components/site-ai/editor/SiteEditor.tsx",[
 [/pagenova-site-wordmark/,"CRM editor must expose text-only logo editing"],
 [/uploadBrandLogo/,"CRM editor must allow logo image upload"],
 [/logo:null,wordmark:/,"CRM text-only logo must clear the old image"]
]);
must("modules/stavo-crm/src/site-kit/renderer/frigolog-crm-adapter.ts",[
 [/brandWordmark/,"CRM canonical site template must render the entered brand"]
]);
must("frontend/src/app/app/builder/page.tsx",[
 [/Escrever logo/,"Standalone site generator must offer direct logo text entry"],
 [/navigation:\{\.\.\.data.config.navigation,logo:null,wordmark:/,"Standalone text logo must replace the old image"]
]);
must("frontend/src/app/app/quizzes/page.tsx",[
 [/setTab\("preview"\)/,"Quiz must show generated and reopened projects in preview-first mode"],
 [/Gerar e visualizar/,"Quiz start must have one compact generate-and-preview action"],
 [/\["preview","Prévia",Eye\]/,"Quiz navigation must prioritize preview"],
 [/\["questions","Perguntas",FileQuestion\]/,"Quiz questions must be optional"],
 [/\["settings","Ajustes",WandSparkles\]/,"Quiz appearance and leads must be in settings"],
 [/Imagens, emojis e lógica de resultados \(opcional\)/,"Advanced question controls must be collapsed"],
 [/Salvar rascunho/,"Quiz save must remain accessible"],
 [/Participações e leads/,"Quiz leads must remain accessible"],
 [/onClick=\{\(\)=>void publish\(\)\}/,"Quiz publishing must remain accessible"],
]);
must("frontend/src/lib/studio/local-engine.ts",[
 [/forms:false,\s*quizzes:false,\s*ebooks:false,\s*apps:false,\s*systems:false/,"local modules cannot silently use paid APIs"]
]);
must("frontend/src/app/api/forms/generate/route.ts",[[/paidApiCalls:0/,"Local forms must not call paid AI"]]);
must("frontend/src/app/api/quizzes/generate/route.ts",[[/paidApiCalls:0/,"Local quizzes must not call paid AI"]]);
must("frontend/src/app/api/development/generate/route.ts",[[/paidApiCalls:0/,"App and system starters must not call paid AI"]]);
const appStudio=must("frontend/src/components/development-module-overview.tsx",[
 [/if\(isApp\)return <main/,"Apps need their own simplified, mobile-first view"],
 [/Qual aplicativo você quer criar\?/,"Apps should lead with the creation prompt"],
 [/Ver código e arquivos/,"Raw source code should be optional"],
 [/Sobre este projeto/,"Long project details should be collapsed"],
 [/Como testar e publicar/,"Publishing guidance should be collapsed"],
 [/Exportar ZIP/,"Source export must stay available"],
 [/onClick=\{download\}/,"Source export action must remain connected"],
 [/onSubmit=\{generate\}/,"Generating the app must still use the existing endpoint"],
 [/Histórico da ideia/,"Conversation history should be optional"]
]);
const appStart=appStudio.indexOf("if(isApp)return <main");
const appEnd=appStudio.indexOf("return <main className=",appStart+20);
const appSurface=appStudio.slice(appStart,appEnd);
if(appSurface.indexOf('aria-label="Descrever aplicativo"')>appSurface.indexOf('aria-label="Resultado do aplicativo"'))
 throw new Error("App chat/briefing must appear before the generated project, even on reopen.");
must("frontend/src/app/api/ebooks/generate/route.ts",[[/buildCookbook/,"Cookbook planning missing"],[/paidApiCalls:0/,"Ebook paid AI usage must be disabled"]]);
must("frontend/src/app/api/ebooks/pdf/route.ts",[[/normalizeEbook/,"PDF input validation missing"],[/renderEbookHtml/,"PDF renderer missing"]]);
must("frontend/src/app/api/forms/[id]/publish/route.ts",[[/publishOwnedForm/,"Form publishing missing"]]);
must("frontend/src/app/api/quizzes/[id]/publish/route.ts",[[/publishOwnedQuiz/,"Quiz publishing missing"]]);
must("frontend/src/app/api/landing/route.ts",[[/renderLandingHtml/,"Landing page publishing missing"],
  [/upsert:Boolean\(prior\)/,"New published landing slugs must not overwrite unknown owners"]]);
must("frontend/src/app/app/landing/page.tsx",[
 [/id="landing-preview"/,"Preview section anchor required"],
 [/id="landing-editor-controls"/,"Editable controls anchor required"],
 [/order-1 min-w-0/,"Preview must come first on mobile"],
 [/order-2 overflow-hidden/,"Editor controls must follow preview on mobile"],
 [/group mt-3 rounded-xl/,"Offer metadata must be collapsible"],
 [/aria-pressed=\{viewport===/,"Viewport toggles must report selection"],
]);
must("frontend/src/components/pagenova-support-chat.tsx",[
 [/landingPreview=path\.startsWith/,"Landing-aware floating assistant placement missing"],
 [/bottom-\[116px\]/,"Assistant must not cover the sticky landing CTA"]
]);
const aiChat=must("frontend/src/app/api/support/chat/route.ts",[
 [/authorizedChat/,"PageNova IA must require account authentication"],
 [/pagenova_support_chat_reserve/,"Free chat must enforce rate and cost limits"],
 [/pagenova_ai_reserve_deep/,"Premium reasoning must use separate daily cost guard"],
 [/gpt-5-mini/,"PageNova IA must upgrade from 4.1-only support chat"],
 [/pagenova_ai_threads/,"PageNova IA must persist conversations"],
 [/recentChatNotes/,"PageNova IA must restore explicitly saved memory"],
 [/new ReadableStream/,"AI responses must stream progressively"],
 [/Não tem ferramentas|NÃO tem ferramentas|NÃO tem ferramentas/i,"Chat must not be authorized to change projects"]
]);
if(/tools:\s*\[|tool_choice|function_call|writeProject|saveProject/.test(aiChat))
 throw new Error("PageNova conversational assistant must not receive project editing tools.");
must("frontend/src/app/api/support/history/route.ts",[
 [/authorizedChat/,"History must be authenticated"],
 [/\.eq\("owner_id",userId\)/,"Every chat history query must isolate tenants"],
 [/export async function DELETE/,"Users must be able to erase their conversations"]
]);
must("frontend/src/lib/support/chat-server.ts",[
 [/explicitMemoryRequest/,"Long-term memory must be opt-in"],
 [/validThreadId/,"Conversation identifiers must be validated"]
]);
must("frontend/src/components/pagenova-support-chat.tsx",[
 [/Pensar melhor/,"Users need an optional deeper reasoning mode"],
 [/Histórico de conversas/,"The interface must expose past conversations"],
 [/Nova conversa/,"The user must be able to start a new thread"],
 [/deleteAll/,"The user must be able to delete conversation and memory data"]
]);
must("supabase/migrations/20261016_pagenova_ai_conversation_history.sql",[
 [/enable row level security/,"Private history tables require RLS"],
 [/references auth.users\(id\) on delete cascade/,"Conversation data must have a verified owner"]
]);
must("frontend/src/app/api/landing/leads/route.ts",[
  [/b\.consent!==true/,"Landing leads must require informed consent"],
  [/pagenova_landing_lead_reserve/,"Landing public submissions require atomic budget"]
]);
must("frontend/src/lib/development/zip.ts",[
  [/segments\.some/,"ZIP export must reject path traversal"],
  [/seen\.has\(path\)/,"ZIP export must reject duplicate filenames"]
]);
must("modules/stavo-crm/src/server/modules/google/router.ts",[
 [/googleRateLimit/,"Google Places rate limit required"],[/google\/history/,"No-API history required"]
]);
must("modules/stavo-crm/src/server/modules/site-ai/router.ts",[
 [/generationLimiter/,"AI generation rate limit required"],[/assertBudgetAvailable/,"AI cost budget required"]
]);
must("frontend/src/app/api/builder/published-overlay/route.ts",[
 [/authorizedForms/,"Public overlay writes require a paid subscriber"],
 [/crmRead/,"Published overlay must verify ownership via CRM"],
 [/publication\.status === "ACTIVE"/,"Only the current active publication may be overwritten"]
]);
must("modules/stavo-crm/src/server/modules/site-ai/router.ts",[
 [/project\.workspaceId !== req\.session!\.workspaceId/,"CRM project tenant isolation required"],
 [/siteAiRouter\.use\('\/site-jobs\/:jobId'/,"CRM job tenant isolation required"]
]);
must("frontend/src/lib/pagenova-project-store.ts",[
 [/pendingProjectWrites/,"Local editor saves must be serialized"]
]);
must("frontend/src/lib/credits/server.ts",[
 [/PAGENOVA_CREDITS_ENFORCE === "1"/,"Credits require explicit rollout after historical usage reconciliation"]
]);
must("frontend/src/lib/trial/server.ts",[
 [/email_confirmed_at/,"Trials must require verified email"],
 [/pagenova_trial_access/,"One-time trial activation RPC required"],
 [/pagenova_trial_reserve/,"Atomic trial quota required"],
 [/pagenova_trial_settle/,"Free trial credit refund required"]
]);
must("frontend/src/app/api/crm/[...path]/route.ts",[
 [/reserveTrialCredit/,"Trial provider costs must be metered"],
 [/settleTrialJob/,"Failed trial generation must be refunded"],
 [/expensiveExtra/,"Unmetered paid CRM actions must be blocked in trial"]
]);
must("frontend/src/app/api/builder/analyze-attachments/route.ts",[
 [/access\.kind!=="paid"/,"Extra OpenAI vision unavailable on free trial"]
]);
must("frontend/src/app/api/[...path]/route.ts",[
 [/access\.kind!=="paid"/,"Legacy paid OpenAI endpoints must require paid access"]
]);
must("frontend/src/components/sidebar.tsx",[
 [/href="\/app"/,"Centered mobile symbol must still open the PageNova home"],
 [/w-\[40px\] overflow-hidden/,"Centered mobile header must show only the existing P symbol"],
 [/\/brand\/pagenova-logo\.png/,"Header must reuse the original PageNova brand asset"]
]);
must("frontend/src/components/mobile-app-back-guard.tsx",[
 [/window\.history\.replaceState/,"Android Back needs a safe initial history entry"],
 [/window\.history\.pushState/,"Android Back needs a same-URL history buffer"],
 [/window\.addEventListener\("popstate"/,"Android Back must be handled when a deep page opens directly"],
 [/router\.replace\("\/app"\)/,"Direct deep link must return to PageNova start rather than exit"],
 [/path==="\/app\/builder"/,"Natural Back from the PageNova home should not be trapped"]
]);
must("frontend/src/app/app/layout.tsx",[
 [/MobileAppBackGuard/,"The mobile back protection must be installed across the authenticated app"]
]);
must("frontend/src/app/app/layout.tsx",[
 [/getPageNovaAccess\(admin,user,true\)/,"Dashboard must start one verified trial"],
 [/trial-expired/,"Expired trial must be blocked from dashboard"]
]);
if(!webhook.includes('unsupported_product'))throw new Error("Test orders can create entitlement.");
console.log("PageNova static regression gate PASS: Kiwify, entitlements, credits, builder, cloner, studio, PDF, publishing and Google.");
