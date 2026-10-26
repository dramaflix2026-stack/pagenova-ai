import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {normalizedSocialLink,whatsappDigits,socialLinksFromInstruction,applySocialInstruction,
  whatsappEffectFromInstruction,floatingVisibilityFromInstruction} from "../src/lib/site-social-links.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
test("link all four networks from one natural-language chat command",()=>{
  const result=socialLinksFromInstruction("Ligue o Instagram https://www.instagram.com/meu.estudio/ Facebook https://facebook.com/meu.estudio YouTube https://www.youtube.com/@canal WhatsApp https://wa.me/5511999998888");
  assert.equal(result.instagram,"https://www.instagram.com/meu.estudio/");
  assert.equal(result.facebook,"https://facebook.com/meu.estudio");
  assert.equal(result.youtube,"https://www.youtube.com/@canal");
  assert.equal(result.whatsapp,"https://wa.me/5511999998888");
});
test("accept handle and Brazilian DDD phone with country prefix added",()=>{
  assert.equal(normalizedSocialLink("instagram","@studio.arq"),"https://www.instagram.com/studio.arq/");
  assert.equal(normalizedSocialLink("youtube","@canal_arq"),"https://www.youtube.com/@canal_arq");
  assert.equal(whatsappDigits("(11) 99999-8888"),"5511999998888");
  assert.equal(normalizedSocialLink("whatsapp","(11) 99999-8888"),"https://wa.me/5511999998888");
  assert.equal(normalizedSocialLink("whatsapp","5511999998888"),"https://wa.me/5511999998888");
});
test("preserve WhatsApp message from wa.me and accept WhatsApp API send links",()=>{
  assert.equal(normalizedSocialLink("whatsapp","https://api.whatsapp.com/send?phone=5511999998888"),"https://wa.me/5511999998888");
  assert.equal(normalizedSocialLink("whatsapp","https://wa.me/5511999998888?text=Ol%C3%A1"),"https://wa.me/5511999998888?text=Ol%C3%A1");
});
test("reject wrong domains, scripts and unset profiles",()=>{
  assert.equal(normalizedSocialLink("instagram","https://fakeinstagram.com/studio"),null);
  assert.equal(normalizedSocialLink("facebook","https://facebook.com.evil.com/account"),null);
  assert.equal(normalizedSocialLink("youtube","javascript:alert(1)"),null);
  assert.equal(normalizedSocialLink("whatsapp","https://evil.test/send?phone=5511999998888"),null);
  assert.equal(normalizedSocialLink("whatsapp",""),null);
  assert.equal(socialLinksFromInstruction("Link da rede: https://evil.test/falso").instagram,undefined);
});
test("configures pulse and blink without hiding WhatsApp or changing social URLs",()=>{
  const site={blocks:[],footer:{whatsapp:"https://wa.me/5511999998888",instagram:"https://www.instagram.com/studio/"}};
  const blink=applySocialInstruction(site,"Faça o ícone do WhatsApp no inferior direito ficar piscando");
  assert.equal(blink.site.footer.whatsappEffect,"blink");
  assert.equal(blink.site.footer.whatsapp,"https://wa.me/5511999998888");
  assert.equal(blink.site.footer.instagram,site.footer.instagram);
  assert.equal(blink.site.footer.showFloatingWhatsapp,undefined);
  const pulse=applySocialInstruction(blink.site,"Faça o botão flutuante do WhatsApp pulsar suavemente");
  assert.equal(pulse.site.footer.whatsappEffect,"pulse");
  const off=applySocialInstruction(pulse.site,"Remova somente o efeito de pulsação do ícone do WhatsApp");
  assert.equal(off.site.footer.whatsappEffect,"none");
  assert.equal(off.site.footer.whatsapp,"https://wa.me/5511999998888");
  assert.notEqual(off.site.footer.showFloatingWhatsapp,false);
});
test("toggle visibility independently from animation",()=>{
  const site={footer:{whatsapp:"5511999998888",whatsappEffect:"pulse"}};
  const hidden=applySocialInstruction(site,"Oculte o botão flutuante do WhatsApp");
  assert.equal(hidden.site.footer.showFloatingWhatsapp,false);
  assert.equal(hidden.site.footer.whatsappEffect,"pulse");
  const shown=applySocialInstruction(hidden.site,"Ative o botão flutuante do WhatsApp");
  assert.equal(shown.site.footer.showFloatingWhatsapp,true);
  assert.equal(shown.site.footer.whatsappEffect,"pulse");
});
test("does not accidentally animate WhatsApp from other site changes",()=>{
  assert.equal(whatsappEffectFromInstruction("Altere o texto da seção WhatsApp"),null);
  assert.equal(whatsappEffectFromInstruction("Coloque animação nos cards, mas preserve o botão do WhatsApp"),null);
  assert.equal(floatingVisibilityFromInstruction("Desative o efeito do ícone do WhatsApp"),null);
});
test("unlink only the specified profile without affecting others",()=>{
  const site={footer:{instagram:"https://www.instagram.com/ok/",facebook:"https://facebook.com/ok"}};
  const result=applySocialInstruction(site,"Remova o Instagram do rodapé.");
  assert.equal(result.site.footer.instagram,"");
  assert.equal(result.site.footer.facebook,site.footer.facebook);
});
test("preview and production are wired to shared URLs and effect on all templates",()=>{
  const socialComponent=read("src/components/site-whatsapp-button.tsx");
  const institutional=read("src/components/builder-v2-site.tsx");
  const restaurant=read("src/components/builder-v2-restaurant-templates.tsx");
  const realEstate=read("src/components/builder-v2-real-estate.tsx");
  const preview=read("src/app/app/builder-v2/page.tsx");
  const published=read("src/app/site/[slug]/page.tsx");
  assert.match(socialComponent,/href=\{link\} target="_blank" rel="noopener noreferrer"/);
  assert.match(socialComponent,/prefers-reduced-motion:reduce/);
  assert.match(institutional,/effect=\{site.footer\?\.whatsappEffect\}/);
  assert.match(restaurant,/effect=\{site.footer\?\.whatsappEffect\}/);
  assert.match(realEstate,/effect=\{footer\?\.whatsappEffect\}/);
  assert.match(preview,/footer=\{site.footer\} preview/);
  assert.match(published,/footer=\{payload.site.footer\}/);
  assert.match(institutional,/normalizedSocialLink/);
  assert.match(restaurant,/normalizedSocialLink/);
});
