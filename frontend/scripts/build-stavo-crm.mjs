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
if (process.env.VERCEL_ENV === "preview") {
  console.log("[PageNova] Inspecting FRIGOLOG canonical integration tests...");
  const result = spawnSync("npm", ["run", "test", "--", "tests/unit/frigolog-canonical-render.test.ts"], {
    cwd: crm, env: process.env, encoding: "utf8", shell: process.platform === "win32",
    timeout: 100000, maxBuffer: 10 * 1024 * 1024,
  });
  const output = String(result.stdout ?? "") + "\n" + String(result.stderr ?? "");
  const clean = output.replace(/\u001b\[[0-9;]*m/g, "");
  const findings = clean.split("\n")
    .filter((line) => /FAIL|PASS|test|Error|Assertion|expected|received|vitest|canonical|run|exception|failed|undefined|\u00d7|\u2713/i.test(line))
    .slice(-60).map((line) => line.slice(0, 350));
  const report = { stage: "FRIGOLOG canonical SSR", status: result.status === 0 ? "PASS" : "FAIL",
    exitCode: result.status, findings };
  const { writeFileSync } = await import("node:fs");
  writeFileSync(resolve(frontend, "public/__pn_frigolog_validation_preview.json"), JSON.stringify(report, null, 2));
  console.log("[PageNova] FRIGOLOG:", report.status, "exit", report.exitCode);
  // Preview build stays accessible for diagnosis; production never embeds the report.
}

console.log("[PageNova] Building current CRM client source...");
run("npm", ["run", "build:client"], crm);

if (!existsSync(resolve(output, "index.html"))) {
  throw new Error("CRM client build did not produce index.html.");
}

console.log("[PageNova] Replacing stale embedded CRM bundle...");
rmSync(target, { recursive: true, force: true });
cpSync(output, target, { recursive: true });
console.log("[PageNova] Embedded CRM bundle is current.");
