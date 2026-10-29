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
 assert.match(page,/\(site.blocks.length>0\|\|siteCategory!=="institutional"\)\?<BuilderV2PreviewFrame/);
 assert.match(page,/<BuilderV2EmptyPreview device=\{previewDevice\} onStart=/);
 assert.match(page,/nenhum site gerado ainda/);
 assert.match(page,/composerRef\.current\?\.focus\(\)/);
});
test("after generation three supported templates and real responsive previews stay intact",()=>{
 assert.match(page,/\(site.blocks.length>0\|\|siteCategory!=="institutional"\)\?<BuilderV2PreviewFrame device=\{previewDevice\}>/);
 assert.match(page,/BuilderV2Site site=\{site\}/);
 for(const template of ["institutional-complete","minimalist-sophisticated","prompt-adaptive"])assert.ok(page.includes(template));
 assert.match(page,/aria-label="Visualizar desktop ou mobile"/);
 assert.match(page,/setPreviewExpanded/);
 assert.match(page,/SiteGenerationCreditsNotice/);
});

test("specialized restaurant and real-estate preview renderers remain visible",()=>{
 assert.match(page,/\(site.blocks.length>0\|\|siteCategory!=="institutional"\)\?<BuilderV2PreviewFrame/);
 assert.match(page,/PizzeriaTemplate/);
 assert.match(page,/RealEstateTemplate/);
});
test("the welcome page includes optional examples without submitting them automatically",()=>{
 assert.match(page,/Clínica odontológica/);
 assert.match(page,/Escritório de arquitetura/);
 assert.match(page,/setInstruction\(example\)/);
});

test("premium welcome stays slim on phones and retains desktop presentation",()=>{
  assert.match(page,/pn-studio-hero relative mb-4/);
  assert.match(page,/px-4 py-5 sm:mb-5/);
  assert.match(page,/text-\[clamp\(1\.7rem,7vw,2\.1rem\)\]/);
  assert.match(page,/sm:text-\[clamp\(1\.95rem,5\.1vw,3\.45rem\)\]/);
  assert.match(page,/mt-6 hidden flex-wrap/);
  assert.match(page,/sm:flex sm:text-xs/);
});
test("chat input starts compact and resizes with typed or dictated content",()=>{
  const css=readFileSync(path.join(root,"src/app/app/builder-v2/motion.css"),"utf8");
  assert.match(page,/rows=\{2\} className="pn-chat-input/);
  assert.match(page,/const naturalHeight=input\.scrollHeight/);
  assert.match(page,/Math\.max\(72,Math\.min\(naturalHeight,224\)\)/);
  assert.match(page,/input\.style\.overflowY=naturalHeight>224\?"auto":"hidden"/);
  assert.match(page,/},\[instruction\]\)/);
  assert.match(css,/\.pn-builder-editor \.pn-editor-chat textarea\.pn-chat-input/);
  assert.match(css,/min-height:72px/);
  assert.match(css,/max-height:224px/);
});
test("preview shortcut only appears after there is a generated site",()=>{
  assert.match(page,/\{site\.blocks\.length>0&&<button type="button" onClick=\{\(\)=>document\.getElementById\("pn-builder-site-preview"\)/);
  assert.match(page,/<BuilderV2EmptyPreview/);
});
test("history has a discreet accessible menu without a full-width bar",()=>{
  assert.match(page,/<details className="pn-editor-tools relative shrink-0">/);
  assert.match(page,/<summary aria-label="Histórico e versões" title="Histórico e versões"/);
  assert.match(page,/<History size=\{16\}\/>/);
  assert.match(page,/showVersions\?"Ocultar versões":"Ver versões"/);
  assert.match(page,/onClick=\{undo\}/);
  assert.match(page,/onClick=\{redo\}/);
  assert.match(page,/onClick=\{saveNamedVersion\}/);
  assert.match(page,/onClick=\{\(\)=>restoreVersion\(version\)\}/);
  assert.doesNotMatch(page,/pn-editor-tools mb-4 rounded-xl border/);
});
