import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {builderAttachmentIntent} from "../src/lib/builder-v2-chat-attachments.ts";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const page=readFileSync(path.join(root,"src/app/app/builder-v2/page.tsx"),"utf8");
test("single clip routes clear reference and insertion instructions independently",()=>{
  assert.equal(builderAttachmentIntent("Use esta imagem como referência para o estilo, não coloque no site",true),"reference");
  assert.equal(builderAttachmentIntent("Adicione esta fotografia como segunda imagem da capa",true),"site");
  assert.equal(builderAttachmentIntent("Troque a foto do segundo card por esta",true),"site");
  assert.equal(builderAttachmentIntent("Troque somente o texto principal",true),"needs-instruction");
  assert.equal(builderAttachmentIntent("Crie um site institucional para clínica",false),"reference");
  assert.equal(builderAttachmentIntent("Crie um site e use esta foto como capa",false),"site");
});
test("editor uses one inline attachment and microphone control, no separate photo cards",()=>{
  assert.match(page,/pn-chat-composer/);
  assert.match(page,/<Paperclip size=\{19\}\/>/);
  assert.match(page,/<Mic size=\{19\}\/>/);
  assert.match(page,/attachmentRef\.current\?\.click\(\)/);
  assert.doesNotMatch(page,/📷 Fotos para usar no site/);
  assert.doesNotMatch(page,/Imagem somente como referência \(não será colocada no site\)/);
  assert.doesNotMatch(page,/pn-editor-category/);
  assert.match(page,/photoToInlineReference/);
  assert.match(page,/builderAttachmentIntent/);
});
test("site model selection belongs to preview toolbar, not above preview",()=>{
  const n=page.indexOf("pn-template-choice");
  const p=page.indexOf("pn-builder-site-preview");
  assert.ok(n>p);
  assert.match(page,/aria-label="Escolher template visual"/);
  assert.match(page,/previewDevice==="mobile"/);
  assert.match(page,/setPreviewExpanded/);
});
test("microphone creates text only and gracefully handles unavailable speech recognition",()=>{
  assert.match(page,/webkitSpeechRecognition/);
  assert.match(page,/recognition\.lang="pt-BR"/);
  assert.match(page,/setInstruction\(prev=>\[prev\.trim\(\),parts\.join\(" "\)\]/);
  assert.match(page,/use o microfone do teclado/);
});
test("reference and asset handling persist through site generation",()=>{
  assert.match(page,/referenceForChat/);
  assert.match(page,/let finishedSite=incoming/);
  assert.match(page,/finishedSite=await generateVisuals/);
  assert.match(page,/setInstitutionalFiles\(\[\]\)/);
  assert.match(page,/Atualizar publicação/);
});
