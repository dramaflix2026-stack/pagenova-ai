import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const page=readFileSync(path.join(root,"src/app/app/builder-v2/page.tsx"),"utf8");
test("CRM-only niche conditional is a real JSX conditional, never leaked text",()=>{
 assert.doesNotMatch(page,/\n\s*!crmProjectId&&<button/);
 assert.match(page,/\{!crmProjectId&&<button type="button" aria-expanded=\{nicheMenuOpen\}/);
 assert.match(page,/<\/button>\}\s*<button type="submit"/);
});
test("official Studio opening presents a premium brand intro and clean chat",()=>{
 assert.match(page,/pn-studio-hero/);
 assert.match(page,/Sua ideia merece um/);
 assert.match(page,/site extraordinário/);
 assert.match(page,/PageNova Studio/);
 assert.match(page,/aria-live="polite" className=\{site.blocks.length\|\|messages.length>1/);
 assert.match(page,/role="status">\{cloudStatus\}/);
 assert.match(page,/pn-chat-composer/);
});
test("before generation show real interactive starter preview, not giant empty iframe",()=>{
 assert.match(page,/function BuilderV2EmptyPreview/);
 assert.match(page,/site.blocks.length>0\?<BuilderV2PreviewFrame/);
 assert.match(page,/<BuilderV2EmptyPreview device=\{previewDevice\} onStart=/);
 assert.match(page,/nenhum site gerado ainda/);
 assert.match(page,/composerRef\.current\?\.focus\(\)/);
});
test("after generation all four original templates and real responsive previews stay intact",()=>{
 assert.match(page,/site.blocks.length>0\?<BuilderV2PreviewFrame device=\{previewDevice\}>/);
 assert.match(page,/BuilderV2Site site=\{site\}/);
 for(const template of ["institutional-complete","minimalist-sophisticated","modern-impactful","image-text-alternating"])assert.ok(page.includes(template));
 assert.match(page,/aria-label="Visualizar desktop ou mobile"/);
 assert.match(page,/setPreviewExpanded/);
 assert.match(page,/SiteGenerationCreditsNotice/);
});
