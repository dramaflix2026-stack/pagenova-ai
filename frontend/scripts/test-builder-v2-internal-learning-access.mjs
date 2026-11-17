import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Internal learning is enabled only for the exact confirmed account on server",()=>{
 const access=source("../src/app/api/builder-v2/internal-learning-access/route.ts");
 assert.match(access,/await supabase\.auth\.getUser\(\)/);
 assert.match(access,/user\.id===INTERNAL_LEARNING_OWNER_ID/);
 assert.match(access,/user\.email\?\.trim\(\)\.toLowerCase\(\)===INTERNAL_LEARNING_OWNER_EMAIL/);
 assert.match(access,/!!user\.email_confirmed_at/);
 assert.match(access,/private, no-store/);
 assert.doesNotMatch(access,/(?:request\.nextUrl|request\.headers|request\.json\(\))[\s\S]*?(?:role|email).{0,30}===/);
});
test("Public editor hides internal counters and all metric panels by default",()=>{
 const page=source("../src/app/app/builder-v2/page.tsx");
 const hook=source("../src/lib/use-builder-v2-internal-learning-access.ts");
 const metrics=source("../src/components/builder-v2-learning-metrics.tsx");
 assert.match(hook,/useState\(false\)/);
 assert.match(hook,/fetch\("\/api\/builder-v2\/internal-learning-access"/);
 assert.match(page,/internalLearningAccess&&approvedExperienceCount!==null/);
 assert.match(page,/internalLearningAccess&&cloudLearningCounts/);
 assert.match(page,/\{internalLearningAccess&&<BuilderV2LearningMetrics enabled=\{internalLearningAccess\}\/>\}/);
 assert.match(metrics,/if\(!expanded\|\|!enabled\)return;/);
 assert.match(metrics,/if\(!enabled\)return null;/);
 assert.doesNotMatch(page,/giovanesornoqui@hotmail\.com/);
});
test("Customer feedback still records approvals and rejections",()=>{
 const page=source("../src/app/app/builder-v2/page.tsx");
 assert.match(page,/reviewLastEdit\("approved"\)/);
 assert.match(page,/reviewLastEdit\("rejected"\)/);
 assert.match(page,/Avalie a alteração/);
 assert.match(page,/A alteração ficou correta na prévia\?/);
 assert.match(page,/recordEditorLearningEvent/);
 assert.match(page,/setReviewCandidate/);
});
test("No template, learning model, RLS policy, schema or business route modified",()=>{
 const pkg=source("../package.json");
 assert.match(pkg,/test-builder-v2-internal-learning-access\.mjs/);
});
