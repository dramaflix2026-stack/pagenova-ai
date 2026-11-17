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

test("new landing is isolated from the existing public homepage", () => {
  assert.ok(existsSync(resolve(root, "src/app/teste/page.tsx")));
  assert.ok(existsSync(resolve(root, "src/app/teste/layout.tsx")));
  assert.match(content("src/app/page.tsx"), /PageNovaLandingMotion/);
});

test("new landing keeps the existing login and five-day free-trial entry", () => {
  const signupLinks = landing.match(/\/cadastro\?trial=1/g) ?? [];
  assert.ok(signupLinks.length >= 4, "All four sign-up CTAs must preserve the trial query");
  assert.doesNotMatch(landing, /href="\/cadastro"/);
  assert.match(landing, /href="\/login"/);
  assert.match(signup, /teste gr[aá]tis de 5 dias/i);
  assert.match(signup, /createClient/);
  assert.match(login, /createClient/);
});

test("approved PT/EN/ES gallery and guarantee assets exist", () => {
  for (const path of [
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
  ]) assert.ok(existsSync(resolve(root, path)), `Missing approved asset: ${path}`);
});

test("package builder has checkout destinations without creating a new payment backend", () => {
  assert.match(landing, /\/teste\/montar-pacote\?plan=/);
  const checkoutUrls = packages.match(/https:\/\/pay\.kiwify\.com\.br\/[A-Za-z0-9]+/g) ?? [];
  assert.ok(checkoutUrls.length >= 13, "Expected the 13 configured Kiwify checkout links");
  assert.match(packages, /Nenhuma compra [ée] feita nesta p[aá]gina/);
});

// Live Kiwify checkout and webhook validation require sandbox/test-account checks.
// This test intentionally does NOT claim that a checkout or subscription was completed.
