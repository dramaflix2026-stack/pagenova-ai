import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(name)=>readFileSync(path.join(cwd,name),"utf8");

test("The authenticated /app entry opens the Início dashboard, not Studio or CRM redirects",()=>{
 const home=read("src/app/app/page.tsx");
 assert.match(home,/getPageNovaAccess\(admin,user,true\)/);
 assert.match(home,/if\(access.kind==="none"\)redirect/);
 assert.doesNotMatch(home,/redirect\("\/app\/builder-v2"\)/);
 assert.doesNotMatch(home,/redirect\("\/app\/crm\?view=sites-ia"\)/);
 assert.match(home,/Bem-vindo à/);
 assert.match(home,/PageNova AI/);
 assert.match(home,/O que vamos criar hoje/);
 assert.match(home,/site a partir de um lead/i);
 assert.match(home,/Como usar/);
});

test("Navigation first shows Início with update archive and guide, not the old Studio 'Como usar'",()=>{
 const nav=read("src/components/sidebar.tsx");
 assert.match(nav,/const homeItems: MenuItem\[\] = \[/);
 assert.match(nav,/href:"\/app",label:"Visão geral"/);
 assert.match(nav,/href:"\/app\/atualizacoes",label:"Atualizações"/);
 assert.match(nav,/href:"\/app\/como-usar",label:"Como Usar a Plataforma"/);
 const studioGroup=nav.slice(nav.indexOf("const studioItems"),nav.indexOf("const developmentItems"));
 assert.ok(!studioGroup.includes('href: "/app/como-usar"'));
 assert.ok(!studioGroup.includes('href: "/app/dominios"'));
 assert.ok(!studioGroup.includes('href: "/app/chat-ai"'));
 assert.equal((nav.match(/NavigationGroup title="Início"/g)||[]).length,2);
 assert.match(nav,/if\(href==="\/app"\)return pathname==="\/app"/);
});

test("Home product updates and archive share one factual, dated source",()=>{
 const home=read("src/app/app/page.tsx");
 const archive=read("src/app/app/atualizacoes/page.tsx");
 const updates=read("src/lib/pagenova-updates.ts");
 assert.match(home,/pagenovaUpdates\.slice\(0,2\)/);
 assert.match(archive,/pagenovaUpdates\.map/);
 assert.match(updates,/2026-10-26-builder/);
 assert.match(updates,/2026-10-26-crm/);
 assert.match(updates,/2026-10-26-images/);
 assert.match(archive,/time dateTime=\{entry\.date\}/);
 assert.match(home,/href="\/app\/atualizacoes"/);
});

test("Existing interactive tutorials are preserved and video cards never pretend to play unavailable videos",()=>{
 const guide=read("src/app/app/como-usar/page.tsx");
 assert.match(guide,/title="Como Usar a Plataforma"/);
 assert.match(guide,/Central de aprendizado/);
 assert.match(guide,/Criar site pelo Studio/);
 assert.match(guide,/Gerar site a partir de um lead/);
 assert.match(guide,/Vídeos da plataforma/);
 assert.match(guide,/Vídeo em preparação/);
 assert.match(guide,/function PracticalDemo/);
 assert.match(guide,/function ClonerDemo/);
 assert.match(guide,/function GeneratorDemo/);
 assert.match(guide,/href=\{mode === "cloner" \? "\/app\/cloner" : "\/app\/landing"\}/);
});

test("Trial visitors can see Home but site-generation entry still follows the CRM trial flow",()=>{
 const home=read("src/app/app/page.tsx");
 assert.match(home,/access.kind==="trial"\?"\/app\/crm\?view=sites-ia":"\/app\/builder-v2"/);
 const navigation=read("src/components/sidebar.tsx");
 assert.match(navigation,/accessKind==="trial"\?studioItems\.map/);
});

test("Premium mobile Home is compact and prioritizes creation and resuming work",()=>{
 const home=read("src/app/app/page.tsx");
 const resume=read("src/components/continue-pagenova-project.tsx");
 assert.match(home,/sm:mt-7 sm:flex sm:flex-wrap/);
 assert.match(home,/grid grid-cols-2 gap-2/);
 assert.match(home,/sm:rounded-\[26px\] sm:px-9 sm:py-10/);
 assert.match(home,/<ContinuePageNovaProject\/>/);
 assert.match(home,/min-h-\[166px\]/);
 assert.match(home,/grid gap-3 lg:grid-cols-2/);
 assert.match(home,/href="\/app\/atualizacoes"/);
 assert.match(resume,/aria-label="Continuar meu projeto"/);
 assert.match(resume,/resolvePageNovaContinueHref\(window.localStorage\)/);
});

test("Domain management and PageNova Chat AI are inside Início for mobile and desktop",()=>{
 const nav=read("src/components/sidebar.tsx");
 const homeGroup=nav.slice(nav.indexOf("const homeItems"),nav.indexOf("const studioItems"));
 assert.match(homeGroup,/href:"\/app\/dominios",label:"Domínio profissional"/);
 assert.match(homeGroup,/href:"\/app\/chat-ai",label:"PageNova Chat AI"/);
 assert.equal((nav.match(/NavigationGroup title="Início"/g)||[]).length,2);
 assert.doesNotMatch(nav,/NavigationGroup title="Inteligência Artificial"/);
 assert.doesNotMatch(nav,/const intelligenceItems/);
 const home=read("src/app/app/page.tsx");
 assert.match(home,/href:"\/app\/dominios",icon:Globe/);
 assert.match(home,/href:"\/app\/chat-ai",icon:MessageCircle/);
 assert.match(home,/href="\/app\/como-usar"/);
});
