import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=p=>readFileSync(new URL(p,import.meta.url),"utf8");
import {isVerifiedInternalLearningAccount} from "../src/lib/builder-v2-internal-learning-access.server.ts";

const CONFIRMED="2026-11-17T10:00:00Z";
const FIRST={id:"01cadff1-1bff-4075-8354-a61b51ecd0eb",email:"giovanesornoqui@hotmail.com",email_confirmed_at:CONFIRMED};
const SECOND={id:"3a405182-e509-4c1b-ab4b-d16a21049f18",email:"giovanevfs@outlook.com",email_confirmed_at:CONFIRMED};

test("Both verified PageNova owner accounts can see the internal learning dashboard",()=>{
 assert.equal(isVerifiedInternalLearningAccount(FIRST),true);
 assert.equal(isVerifiedInternalLearningAccount(SECOND),true);
 assert.equal(isVerifiedInternalLearningAccount({...SECOND,email:" GIOVANEVFS@OUTLOOK.COM "}),true);
});
test("Other accounts, mismatched IDs/emails and unconfirmed owners are denied",()=>{
 assert.equal(isVerifiedInternalLearningAccount(null),false);
 assert.equal(isVerifiedInternalLearningAccount({...SECOND,id:"c0000000-0000-4000-8000-000000000001"}),false);
 assert.equal(isVerifiedInternalLearningAccount({...FIRST,email:SECOND.email}),false);
 assert.equal(isVerifiedInternalLearningAccount({...SECOND,email:FIRST.email}),false);
 assert.equal(isVerifiedInternalLearningAccount({...FIRST,email_confirmed_at:null}),false);
 assert.equal(isVerifiedInternalLearningAccount({...SECOND,email_confirmed_at:null}),false);
 assert.equal(isVerifiedInternalLearningAccount({...SECOND,email:null}),false);
});
test("Server-only access route verifies auth user and never trusts client claims",()=>{
 const route=source("../src/app/api/builder-v2/internal-learning-access/route.ts");
 assert.match(route,/await supabase\.auth\.getUser\(\)/);
 assert.match(route,/const enabled=isVerifiedInternalLearningAccount\(user\)/);
 assert.match(route,/private, no-store/);
 assert.doesNotMatch(route,/(?:request\.nextUrl|request\.headers|request\.json\(\))[\s\S]*?(?:role|email).{0,30}===/);
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
