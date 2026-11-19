import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const content = (path) => readFileSync(resolve(root, path), "utf8");
const landing = content("src/app/teste/landing-revamp.tsx");
const signup = content("src/app/cadastro/page.tsx");
const login = content("src/app/login/page.tsx");
const packages = content("src/app/teste/montar-pacote/page.tsx");

test("official homepage stays legacy until the explicit v2 feature flag", () => {
  assert.ok(existsSync(resolve(root, "src/app/teste/page.tsx")));
  assert.ok(existsSync(resolve(root, "src/app/teste/layout.tsx")));
  const home = content("src/app/page.tsx");
  assert.match(home, /PageNovaLandingMotion/);
  assert.ok(home.includes('process.env.PAGENOVA_PUBLIC_LP === "v2"'));
  assert.ok(home.includes('<LandingShell><LandingRevamp official initialLanguage="pt"'));
  for (const locale of ["en", "es"]) {
    const page = content("src/app/" + locale + "/page.tsx");
    assert.ok(page.includes('process.env.PAGENOVA_PUBLIC_LP === "v2"'));
    assert.ok(page.includes('initialLanguage="' + locale + '"'));
    assert.ok(page.includes('LocalizedMarketing lang="' + locale + '"'));
  }
});

test("existing login and signup routes remain available without free-trial signup claims", () => {
  assert.ok((landing.match(/\/cadastro\?trial=1/g) ?? []).length >= 4);
  assert.doesNotMatch(landing, /href="\/cadastro"/);
  assert.match(landing, /href="\/login"/);
  assert.match(signup, /Crie sua conta PageNova AI/);
  assert.doesNotMatch(signup, /teste gr[aá]tis de 5 dias/i);
  assert.match(signup, /\/auth\/callback\?next=\/login/);
  const callback = content("src/app/auth/callback/route.ts");
  assert.ok(callback.includes('value === "/login"'));
  assert.match(signup, /createClient/);
  assert.match(login, /createClient/);
});

test("approved PT/EN/ES gallery and guarantee assets exist", () => {
  const files = [
    "public/gallery-styles/institucional-desktop.webp",
    "public/gallery-styles/cinematografico-desktop.webp",
    "public/gallery-styles/3d-imersivo-desktop.webp",
    "public/gallery-styles/en/Banner Institucional com Laptop Arquitetônico Neon.png",
    "public/gallery-styles/en/Banner Cinematizado da Aurora.png",
    "public/gallery-styles/en/Anúncio Futurista de Experiência 3D.png",
    "public/gallery-styles/es/banner institucional espanhol.png",
    "public/gallery-styles/es/banner cinematografico espanhol.png",
    "public/gallery-styles/es/banner 3d imersivo espanhol.png",
    "public/images/en/garantia-7-dias-en-pt-layout.svg",
    "public/images/en/garantia-7-dias-en-mobile.png",
  ];
  for (const path of files) assert.ok(existsSync(resolve(root, path)), "Missing approved asset: " + path);
});

test("preview and official landing routes use their own navigation and package paths", () => {
  assert.ok(landing.includes('const homePath=official?'));
  assert.ok(landing.includes('const packagePath=official?"/montar-pacote":"/teste/montar-pacote"'));
  assert.ok(landing.includes('href={packagePath+"?plan="'));
  assert.ok(landing.includes('window.location.assign(value==="pt"?"/"'));
  const shell = content("src/app/teste/landing-shell.tsx");
  assert.match(shell, /Poppins\(/);
  assert.ok(shell.includes("mobile-polish.css"));
  const officialPackage = content("src/app/montar-pacote/page.tsx");
  assert.ok(officialPackage.includes('process.env.PAGENOVA_PUBLIC_LP !== "v2"'));
  assert.ok(officialPackage.includes('redirect("/teste/montar-pacote")'));
});

test("new package checkout paths are gated; legacy plans remain accessible", () => {
  const urls = packages.match(/https:\/\/pay\.kiwify\.com\.br\/[A-Za-z0-9]+/g) ?? [];
  assert.ok(urls.length >= 13, "All original package links remain for approved preview");
  assert.ok(packages.includes("checkoutDisabled"));
  assert.ok(packages.includes("pagenova-landing-teste-production.up.railway.app"));
  assert.ok(packages.includes("cadastro?trial=1"));
  const previousPlans = content("src/app/planos-atuais/page.tsx");
  assert.ok(previousPlans.includes("https://pay.kiwify.com.br/a13pNpS"));
  const webhook = content("src/app/api/webhooks/kiwify/route.ts");
  assert.ok(webhook.includes("isSupportedPageNovaProduct"));
});

test("Meta Pixel PageView is routed to only one dataset", () => {
  const pixel = content("src/components/meta-pixel.tsx");
  assert.ok(pixel.includes("2101736870240618"));
  assert.ok(pixel.includes("1051066844418593"));
  assert.ok(pixel.includes('"trackSingle", pixelId, "PageView"'));
  assert.ok(pixel.includes("PUBLIC_LANDING_ROUTES"));
  assert.doesNotMatch(pixel, /fbq\(['"]track['"]/);
  const layout = content("src/app/layout.tsx");
  assert.ok(layout.includes('newLandingEnabled={process.env.PAGENOVA_PUBLIC_LP === "v2"}'));
});

// These static gates do not claim that purchases, trial expirations or Meta Events Manager callbacks
// were tested against live providers. Those require safe end-to-end validation before cutover.
