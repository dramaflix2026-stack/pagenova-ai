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
must("frontend/src/app/api/forms/generate/route.ts",[/paidApiCalls:0/,"Local forms must not call paid AI"]]);
must("frontend/src/app/api/quizzes/generate/route.ts",[/paidApiCalls:0/,"Local quizzes must not call paid AI"]]);
must("frontend/src/app/api/development/generate/route.ts",[/paidApiCalls:0/,"App and system starters must not call paid AI"]]);
must("frontend/src/app/api/ebooks/generate/route.ts",[/buildCookbook/,"Cookbook planning missing"],[/paidApiCalls:0/,"Ebook paid AI usage must be disabled"]]);
must("frontend/src/app/api/ebooks/pdf/route.ts",[/normalizeEbook/,"PDF input validation missing"],[/renderEbookHtml/,"PDF renderer missing"]]);
must("frontend/src/app/api/forms/[id]/publish/route.ts",[/publishOwnedForm/,"Form publishing missing"]]);
must("frontend/src/app/api/quizzes/[id]/publish/route.ts",[/publishOwnedQuiz/,"Quiz publishing missing"]]);
must("frontend/src/app/api/landing/route.ts",[/renderLandingHtml/,"Landing page publishing missing"]]);
must("modules/stavo-crm/src/server/modules/google/router.ts",[
 [/googleRateLimit/,"Google Places rate limit required"],[/google\/history/,"No-API history required"]
]);
must("modules/stavo-crm/src/server/modules/site-ai/router.ts",[
 [/generationLimiter/,"AI generation rate limit required"],[/assertBudgetAvailable/,"AI cost budget required"]
]);
if(!webhook.includes('unsupported_product'))throw new Error("Test orders can create entitlement.");
console.log("PageNova static regression gate PASS: Kiwify, entitlements, credits, builder, cloner, studio, PDF, publishing and Google.");
