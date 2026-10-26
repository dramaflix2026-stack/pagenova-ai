import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {normalizeCustomerDomain} from "../src/lib/pagenova-custom-domains.ts";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>readFileSync(path.join(root,file),"utf8");

test("Accept legitimate apex and subdomains but reject URLs and dangerous hostnames",()=>{
 for(const domain of ["exemplo.com.br","www.exemplo.com.br","meusite.com","loja-minhaempresa.org","foo.bar.co.uk"])
  assert.equal(normalizeCustomerDomain(domain),domain);
 for(const invalid of ["","www.","localhost","http://foo.com","https://foo.com.br","foo.com/bar",
  "foo.com:8080","*.foo.com","foo.com?x=1","foo_.com","my.site.vercel.app",
  "pagenovaai.com.br","studio.pagenovaai.com.br","127.0.0.1","-.com","foo..com"])
  assert.equal(normalizeCustomerDomain(invalid),null,invalid);
 assert.equal(normalizeCustomerDomain("  WEBSITE.COM.BR. "),"website.com.br");
});
test("Only verified published sites are eligible, never untrusted IndexedDB projects",()=>{
 const api=read("src/app/api/domains/route.ts");
 const page=read("src/app/app/dominios/page.tsx");
 assert.match(api,/from\("pagenova_site_publications"\)/);
 assert.match(api,/\.eq\("owner_id",userId\)\.eq\("project_id",projectId\)/);
 assert.match(api,/from\("pagenova_custom_domains"\)/);
 assert.match(api,/existing.owner_id!==userId\|\|existing.project_id!==projectId/);
 assert.match(page,/Buscar site pelo nome/);
 assert.match(page,/max-h-56/);
 assert.doesNotMatch(page,/listPageNovaProjects/);
 assert.match(page,/siteTitle\(site\)/);
 assert.match(page,/Em preparação|em preparação|Integração em preparação/);
});
test("Older local publications can be indexed only if the server confirms they belong to the caller",()=>{
 const legacy=read("src/app/api/domains/import/route.ts");
 assert.match(legacy,/site.ownerId!==userId\|\|site.projectId!==id/);
 assert.match(legacy,/storage\.from\(BUCKET\)\.download\(slug\+"\.json"\)/);
 assert.match(legacy,/pagenova_site_publications/);
 const page=read("src/app/app/dominios/page.tsx");
 assert.match(page,/\/api\/domains\/import/);
 assert.match(page,/publishedUrl/);
});
test("Publishing persists a user-scoped index and keeps custom domain linked when site is republished",()=>{
 const publication=read("src/app/api/builder-v2/publish/route.ts");
 assert.match(publication,/pagenova_site_publications/);
 assert.match(publication,/onConflict:"owner_id,project_id"/);
 assert.match(publication,/pagenova_custom_domains/);
 assert.match(publication,/\.eq\("owner_id",userId\)\.eq\("project_id",site.id\)/);
});
test("Incoming custom host resolves only active ownership-bound domain mapping",()=>{
 const proxy=read("src/proxy.ts");
 assert.match(proxy,/pagenova_custom_domains/);
 assert.match(proxy,/\.eq\("domain",host\)\.eq\("state","active"\)/);
 assert.match(proxy,/NextResponse\.rewrite\(destination\)/);
 assert.match(proxy,/!host\.endsWith\("\.vercel\.app"\)/);
});
test("Customer DNS instructions are provider returned, not generic hardcoded A records",()=>{
 const source=read("src/lib/pagenova-custom-domains.ts");
 assert.match(source,/recommendedCNAME/);
 assert.match(source,/recommendedIPv4/);
 assert.doesNotMatch(source,/76\.76\.21\.21/);
 assert.doesNotMatch(source,/cname\.vercel-dns\.com/);
 assert.match(source,/PAGENOVA_VERCEL_TOKEN/);
 const api=read("src/app/api/domains/route.ts");
 assert.match(api,/if\(!vercelDomainAvailable\(\)\)return/);
 assert.match(api,/registerVercelDomain/);
 assert.match(api,/checkVercelDomain/);
});
