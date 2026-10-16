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
must("frontend/src/lib/studio/local-engine.ts",[
 [/forms:false,\s*quizzes:false,\s*ebooks:false,\s*apps:false,\s*systems:false/,"local modules cannot silently use paid APIs"]
]);
must("frontend/src/app/api/forms/generate/route.ts",[[/paidApiCalls:0/,"Local forms must not call paid AI"]]);
must("frontend/src/app/api/quizzes/generate/route.ts",[[/paidApiCalls:0/,"Local quizzes must not call paid AI"]]);
must("frontend/src/app/api/development/generate/route.ts",[[/paidApiCalls:0/,"App and system starters must not call paid AI"]]);
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
must("frontend/src/app/app/layout.tsx",[
 [/getPageNovaAccess\(admin,user,true\)/,"Dashboard must start one verified trial"],
 [/trial-expired/,"Expired trial must be blocked from dashboard"]
]);
if(!webhook.includes('unsupported_product'))throw new Error("Test orders can create entitlement.");
console.log("PageNova static regression gate PASS: Kiwify, entitlements, credits, builder, cloner, studio, PDF, publishing and Google.");
