import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, "..");
const crm = resolve(frontend, "..", "modules", "stavo-crm");
const output = resolve(crm, "dist", "client");
const target = resolve(frontend, "public", "stavo-crm");

if (!existsSync(resolve(crm, "package-lock.json"))) {
  throw new Error("CRM package-lock.json not found. Cannot build embedded CRM.");
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(command + " " + args.join(" ") + " failed with exit code " + result.status);
  }
}

console.log("[PageNova] Installing CRM build dependencies...");
run("npm", ["ci", "--no-audit", "--no-fund"], crm);

// Compila o backend compartilhado para garantir que o renderer tambem funciona
// no servidor que publica os sites, nao apenas na previa React.
console.log("[PageNova] Validating CRM backend publishing renderer...");
run("npm", ["run", "build:server"], crm);

// A canonical template must pass its actual React SSR tests before being
// merged to main. Only preview builds run this additional diagnostic gate.
// Execute the actual React SSR and the canonical adapter. This gate does not
// depend on the CI Vitest worker (unavailable in the Vercel build sandbox).
console.log("[PageNova] Smoke-testing exact FRIGOLOG React/CSS from CRM...");
run(process.execPath, ["--import", "tsx", "scripts/smoke-frigolog-master.ts"], crm);

console.log("[PageNova] Building current CRM client source...");
run("npm", ["run", "build:client"], crm);

if (!existsSync(resolve(output, "index.html"))) {
  throw new Error("CRM client build did not produce index.html.");
}

console.log("[PageNova] Replacing stale embedded CRM bundle...");
rmSync(target, { recursive: true, force: true });
cpSync(output, target, { recursive: true });
console.log("[PageNova] Embedded CRM bundle is current.");
