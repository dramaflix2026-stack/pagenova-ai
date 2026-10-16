/**
 * Runtime cookbook regression without a paid API or a Supabase account.
 * Uses the frontend's existing TypeScript devDependency to load the same
 * production TS modules into Node. Distinct from regex/static source checks.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../");
const requirePackage = createRequire(resolve(root, "package.json"));
const ts = requirePackage("typescript");
const loaded = new Map();

function loadTs(path) {
  const filename = resolve(path.endsWith(".ts") ? path : path + ".ts");
  if (loaded.has(filename)) return loaded.get(filename).exports;
  const original = readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(original, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const instance = { exports: {} };
  loaded.set(filename, instance);
  const localRequire = specifier => {
    if (!specifier.startsWith(".")) throw new Error("Unexpected external dependency: " + specifier);
    return loadTs(resolve(dirname(filename), specifier));
  };
  const execute = new Function("require", "module", "exports", "crypto", transpiled);
  execute(localRequire, instance, instance.exports, webcrypto);
  return instance.exports;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dir = resolve(root, "src/lib/ebooks");
const { detectEbookIntent, buildCookbook } = loadTs(resolve(dir, "cookbook-engine"));
const { renderEbookHtml } = loadTs(resolve(dir, "render"));
const prompt = "Crie um eBook com 50 receitas saudáveis, ingredientes medidos, rendimento e modo de preparo.";
const intent = detectEbookIntent(prompt);
assert(intent.kind === "cookbook" && intent.requestedItems === 50, "Portuguese recipe intent not interpreted.");
const ebook = buildCookbook({
  prompt, count: intent.requestedItems, author: "Equipe editorial",
  theme: "editorial", imageMode: "none",
});
const recipes = ebook.pages.filter(page => page.kind === "recipe");
assert(ebook.pages.length === 54, "50-recipe book must contain 54 pages.");
assert(recipes.length === 50, "Generated book must contain 50 actual recipe sheets.");
assert(new Set(recipes.map(page => page.title.toLowerCase())).size === 50, "Recipe titles must be unique.");
for (const [index, page] of recipes.entries()) {
  assert(page.bullets.length >= 3, "Missing ingredient list on recipe " + (index + 1));
  assert(page.body.split("\n").filter(Boolean).length >= 3, "Missing cooking instructions on recipe " + (index + 1));
  assert(/Rendimento:/.test(page.lead) && /Tempo aproximado:/.test(page.lead),
    "Missing servings or duration on recipe " + (index + 1));
}
const html = renderEbookHtml(ebook);
assert((html.match(/class="sheet kind-/g) || []).length === 54, "HTML printer did not render 54 A4 sheets.");
assert((html.match(/class="sheet kind-recipe"/g) || []).length === 50, "Recipe HTML layout is incomplete.");
assert(!/src=""/.test(html), "Blank image tags should not appear.");
assert(detectEbookIntent("Crie 3 receitas para o almoço").requestedItems === 3, "Smaller recipes request failed.");
for (const bad of ["50 receitas veganas", "50 receitas sem gluten"]) {
  let rejected = false;
  try { detectEbookIntent(bad); } catch { rejected = true; }
  assert(rejected, "Catalog must reject unsupported dietary claim: " + bad);
}
console.log("Cookbook runtime PASS: real 54-page project, 50 unique recipes, render HTML, dietary safeguards.");
