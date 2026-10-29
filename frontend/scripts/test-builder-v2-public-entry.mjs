import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>readFileSync(path.join(root,p),"utf8");

test("Official PageNova Studio sidebar entry opens the same Builder 2.0 as CRM",()=>{
  const sidebar=read("src/components/sidebar.tsx");
  const crm=read("../modules/stavo-crm/src/client/pages/SiteProjectPage.tsx");
  assert.match(sidebar,/\{ href: "\/app\/builder-v2", label: "Gerar site com IA"/);
  assert.match(crm,/\/app\/builder-v2\?crmProject=/);
  assert.doesNotMatch(sidebar,/\{ href: "\/app\/builder", label: "Gerar site com IA"/);
});
test("Accounts open the new Início dashboard, with site generation shortcuts preserved",()=>{
  const page=read("src/app/app/page.tsx");
  assert.match(page,/Bem-vindo à/);
  assert.match(page,/getPageNovaAccess\(admin,user,true\)/);
  assert.match(page,/access\.kind==="trial"\?"\/app\/crm\?view=sites-ia":"\/app\/builder-v2"/);
  assert.doesNotMatch(page,/redirect\("\/app\/builder-v2"\)/);
});
test("Legacy generator deep links stay accessible while new generation route redirects",()=>{
  const proxy=read("src/proxy.ts");
  assert.match(proxy,/pathname === "\/app\/builder"/);
  assert.match(proxy,/searchParams\.get\("project"\)/);
  assert.match(proxy,/destination|url\.pathname = "\/app\/builder-v2"/);
  assert.match(proxy,/getUser\(\)/);
  assert.match(proxy,/response\.cookies\.getAll/);
});
test("Standard Studio route opens chat instead of experimental category selector",()=>{
  const builder=read("src/app/app/builder-v2/page.tsx");
  assert.match(builder,/useState\(false\);/);
  assert.match(builder,/setCategoryScreen\(true\)/);
  assert.doesNotMatch(builder,/Ambiente experimental/);
  for(const id of ["institutional-complete","minimalist-sophisticated","prompt-adaptive"])assert.ok(builder.includes(id),id);
});

test("studio initial generation shares CRM wallet, trial quota and provider guard",()=>{
 const route=read("src/app/api/builder-v2/chat/route.ts");
 const wallet=read("src/lib/builder-v2-generation-credits.ts");
 assert.match(route,/reserveBuilderV2Generation\(user,key\)/);
 assert.match(route,/if \(isFresh\)/);
 assert.match(route,/await charge\.finish\(true\)/);
 assert.match(route,/await charge\.finish\(false\)/);
 assert.match(wallet,/reserveTrialCredit\(admin,user\.id,"site_generation"/);
 assert.match(wallet,/reserveCredit\(admin,account,"site_generation"/);
 assert.match(wallet,/reservePaidAiBudget\(admin,user\.id,"crm_site_generation"\)/);
 const editor=read("src/app/app/builder-v2/page.tsx");
 assert.match(editor,/SiteGenerationCreditsNotice credits=\{siteCredits\}/);
 assert.match(editor,/siteCredits\.refresh\(\)/);
});
