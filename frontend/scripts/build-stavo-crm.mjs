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

console.log("[PageNova] Building current CRM client source...");
run("npm", ["run", "build:client"], crm);

if (!existsSync(resolve(output, "index.html"))) {
  throw new Error("CRM client build did not produce index.html.");
}

console.log("[PageNova] Replacing stale embedded CRM bundle...");
rmSync(target, { recursive: true, force: true });
cpSync(output, target, { recursive: true });
console.log("[PageNova] Embedded CRM bundle is current.");
