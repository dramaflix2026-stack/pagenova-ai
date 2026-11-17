import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isVerifiedInternalLearningAccount} from "../src/lib/builder-v2-internal-learning-access.server.ts";

const source=relative=>readFileSync(new URL(relative,import.meta.url),"utf8");
const confirmed="2026-11-17T14:00:00Z";
const first={id:"01cadff1-1bff-4075-8354-a61b51ecd0eb",email:"giovanesornoqui@hotmail.com",email_confirmed_at:confirmed};
const second={id:"3a405182-e509-4c1b-ab4b-d16a21049f18",email:"giovanevfs@outlook.com",email_confirmed_at:confirmed};

test("Owner platform entitlement bypass is restricted to two verified ID/email identities",()=>{
 assert.ok(isVerifiedInternalLearningAccount(first));
 assert.ok(isVerifiedInternalLearningAccount(second));
 assert.equal(isVerifiedInternalLearningAccount({...first,email:second.email}),false);
 assert.equal(isVerifiedInternalLearningAccount({...first,id:second.id}),false);
 assert.equal(isVerifiedInternalLearningAccount({...first,email_confirmed_at:null}),false);
 assert.equal(isVerifiedInternalLearningAccount({...first,id:"00000000-0000-4000-8000-000000000000"}),false);
});
test("Authenticated owner access is separate from commercial entitlements and client claims",()=>{
 const layout=source("../src/app/app/layout.tsx");
 assert.match(layout,/auth\.getUser\(\)/);
 assert.match(layout,/isVerifiedInternalLearningAccount\(user\)/);
 assert.match(layout,/if\(verifiedOwner\)\s*\{\s*access=\{kind:"owner"\}/);
 assert.match(layout,/else\s*\{\s*try\s*\{\s*access=await getPageNovaAccess\(admin,user,true\)/);
 assert.match(layout,/if\(access\.kind==="none"\)/);
 assert.match(layout,/<Sidebar accessKind=\{access\.kind\}/);
 assert.doesNotMatch(layout,/supabase\.auth\.getSession\(\)/);
});
test("Owner display never misrepresents a paid purchase or exposes fake credits",()=>{
 const sidebar=source("../src/components/sidebar.tsx");
 assert.match(sidebar,/accessKind==="owner"\?"Acesso administrativo"/);
 assert.match(sidebar,/accessKind!=="owner"&&<AccessCredits/);
 const trial=source("../src/lib/trial/server.ts");
 assert.match(trial,/\.eq\("status","active"\)/);
 assert.match(trial,/\.rpc\("pagenova_trial_access"/);
 assert.doesNotMatch(trial,/verifiedOwner|isVerifiedInternalLearningAccount/);
});
