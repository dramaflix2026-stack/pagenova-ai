import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
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

if (process.env.VERCEL_ENV === "preview") {
  // Temporary diagnostic. The report contains only non-secret build findings
  // and is saved in the preview assets so it can be inspected without access
  // to the Vercel build-log API. Remove before merging to production.
  console.log("[PageNova] Checking universal master renderer unit tests...");
  const result = spawnSync("npm", ["run", "test", "--", "tests/unit/universal-master.test.ts"], {
    cwd: crm, encoding: "utf8", shell: process.platform === "win32",
    env: process.env, timeout: 120000,
  });
  const output = String(result.stdout ?? "") + "\n" + String(result.stderr ?? "");
  const clean = output.replace(/\u001b\[[0-9;]*m/g, "");
  const safeLines = clean.split("\n").filter((line) =>
    /FAIL|PASS|error|test file|test suite|assertion|expected|received|unhandled|vitest|universal-master|\u2713|\u00d7/i.test(line)
  ).map((line) => line.slice(0, 240)).slice(-35);
  const report = {
    stage: "universal-renderer-tests",
    status: result.status === 0 ? "PASS" : "FAIL",
    exitCode: result.status, findings: safeLines,
  };
  writeFileSync(resolve(frontend, "public", "__pagenova-preview-validation.json"), JSON.stringify(report, null, 2));
  console.log("[PageNova] Preview validation:", report.status, "exit", result.status);
  console.log("[PageNova] Compiling CRM backend...");
  run("npm", ["run", "build:server"], crm);
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
