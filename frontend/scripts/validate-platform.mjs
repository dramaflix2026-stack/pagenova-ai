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
 [/MAX_HTML_BYTES/,"HTML fetch budget required"],[/visualBodyHtml/,"Cloner must return editable HTML"]
]);
must("frontend/src/app/app/cloner/page.tsx",[
 [/fetch\(\s*"\/api\/cloner\/analyze"/,"Cloner must call same-origin route"],
 [/savePageNovaProject/,"Editor handoff requires persistent project storage"]
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
