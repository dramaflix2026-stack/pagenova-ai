import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>readFileSync(path.join(root,p),"utf8");
const editor=read("src/app/app/builder-v2/page.tsx");
const shared=read("src/components/builder-v2-site.tsx");
const publish=read("src/app/api/builder-v2/publish/route.ts");
const publicPage=read("src/app/site/[slug]/page.tsx");
const publicRoute=read("src/app/p/[slug]/[[...path]]/route.ts");
test("Editor and public page render identical template and animation layer",()=>{
 assert.match(editor,/<BuilderV2Site site=\{site\}/);
 assert.match(publicPage,/<BuilderV2Site site=\{payload.site\}/);
 assert.match(shared,/attachSiteMotion\(previewRef.current,site.motion\)/);
 assert.match(shared,/data-section-id=\{group.id\}/);
 assert.match(shared,/data-block-id=\{b.id\}/);
 assert.match(shared,/publishedMode/);
});
test("Publishing requires paid authorization and same-origin POST",()=>{
 assert.match(publish,/authorizedForms\(\)/);
 assert.match(publish,/origin && origin !== request.nextUrl.origin|origin&&origin!==request.nextUrl.origin/);
 assert.match(publish,/site.blocks.length<4/);
 assert.match(publish,/!site.blocks.some\(b=>b.type==="heading"\)/);
 assert.match(publish,/upsert,cacheControl:"0"/);
});
test("Publication uses owner+project isolation and preserves stable links",()=>{
 assert.match(publish,/stored.ownerId===userId&&stored.projectId===site.id/);
 assert.match(publish,/createHash\("sha256"\)/);
 assert.match(publish,/baseSlug\+"-"\+scoped/);
 assert.match(publish,/version:2/);
 assert.match(editor,/site.id\|\|crypto.randomUUID\(\)/);
 assert.match(editor,/Atualizar publicação/);
 assert.match(editor,/Ver site publicado/);
});
test("Public route prioritizes V2 snapshots, not untrusted CRM catch-alls",()=>{
 const i=publicRoute.indexOf('if(slug.startsWith("v2-"))');
 const upstream=publicRoute.indexOf("const railway = await railwayPublishedSite");
 assert.ok(i>0&&upstream>i);
 assert.match(publicRoute,/stored.version!==2/);
 assert.match(publicRoute,/NextResponse.redirect\(new URL\("\/site\/"/);
 assert.match(publicPage,/const BUCKET="pagenova-published-sites"/);
 assert.match(publicPage,/payload.version!==2/);
});
