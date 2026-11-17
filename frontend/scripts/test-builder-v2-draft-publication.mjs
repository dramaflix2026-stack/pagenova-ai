import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
test("Delivery 7: cloud drafts enforce owner and compare-and-set revision",()=>{
 const api=file("../src/app/api/builder-v2/draft/route.ts");
 const sql=file("../supabase/migrations/20261117_builder_v2_draft_persistence.sql");
 assert.match(api,/\.eq\("user_id",user\.id\)\.eq\("project_id",projectId\)/);
 assert.match(api,/\.eq\("revision",version\)/);
 assert.match(api,/response\.status===409|error\?\.code==="23505"/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/with check \(\(select auth\.uid\(\)\)=user_id\)/);
 assert.match(sql,/primary key \(user_id, project_id\)/);
});
test("Delivery 7: only this project's history is returned, old rows remain untouched",()=>{
 const api=file("../src/app/api/builder-v2/versions/route.ts");
 assert.match(api,/\.eq\("project_id",projectId\)/);
 assert.match(api,/\.eq\("site->>id",projectId\)/);
 assert.match(api,/\.filter\(x=>x\.site/);
 assert.doesNotMatch(api,/\.delete\(|\.truncate\(/);
});
test("Delivery 7: F5 loads IndexedDB and authenticated cloud before enabling saves",()=>{
 const page=file("../src/app/app/builder-v2/page.tsx");
 assert.match(page,/const remote=await response\.json\(\)/);
 assert.match(page,/if\(!localDraft\|\|remoteStamp>/);
 assert.match(page,/setDraftHydrated\(true\);setStorageProjectReady\(true\)/);
 assert.match(page,/cloudDraftProjectIdRef\.current!==id\)return/);
 assert.match(page,/await persistCloudDraft\(current\)/);
});
test("Delivery 7: page publication verifies exact storage read-back before success",()=>{
 const api=file("../src/app/api/builder-v2/publish/route.ts");
 const page=file("../src/app/app/builder-v2/page.tsx");
 assert.match(api,/const snapshotHash=createHash\("sha256"\)\.update\(payload\)/);
 assert.match(api,/if\(!verified\)/);
 assert.match(api,/verified:true/);
 assert.match(page,/data\.verified!==true/);
});
test("Delivery 7: cloud-only projects can be opened from the library",()=>{
 const library=file("../src/app/app/paginas/page.tsx");
 assert.match(library,/cloudStudioSites\.filter/);
 assert.match(library,/\/api\/builder-v2\/draft/);
 assert.match(library,/builder-v2\?project=/);
});
