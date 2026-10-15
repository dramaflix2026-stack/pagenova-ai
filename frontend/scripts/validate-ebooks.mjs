import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>readFileSync(resolve(root,p),"utf8");
const library=read("src/lib/ebooks/recipe-library.ts");
const match=library.match(/export const RECIPE_CATALOG:ReadonlyArray<Recipe> = (\[[\s\S]*?\]);/);
if(!match)throw new Error("Recipe catalog missing or malformed.");
const recipes=JSON.parse(match[1]);
if(recipes.length!==50)throw new Error("Expected exactly 50 curated recipes, found "+recipes.length);
const names=new Set();
const groups=new Map();
for(const [i,recipe] of recipes.entries()){
  if(!recipe.title||names.has(recipe.title.toLowerCase()))throw new Error("Duplicate or blank recipe "+i);
  names.add(recipe.title.toLowerCase());
  if(!Array.isArray(recipe.ingredients)||recipe.ingredients.length<3)
    throw new Error("Not enough measured ingredients in "+recipe.title);
  if(!Array.isArray(recipe.steps)||recipe.steps.length<3)
    throw new Error("Not enough preparation steps in "+recipe.title);
  if(recipe.steps.some(s=>s.length<25)||recipe.ingredients.some(s=>s.length<4))
    throw new Error("Short/incomplete cooking directions in "+recipe.title);
  if(!Number.isFinite(recipe.minutes)||recipe.minutes<1||!Number.isInteger(recipe.servings)||recipe.servings<1)
    throw new Error("Missing time or portions in "+recipe.title);
  groups.set(recipe.category,(groups.get(recipe.category)||0)+1);
}
if(groups.size!==5)throw new Error("Expected five meal categories.");
const schema=read("src/lib/ebooks/schema.ts");
if(!schema.includes('> 80')||!schema.includes('"recipe"'))
  throw new Error("Ebook schema must support long cookbooks and recipe pages.");
const renderer=read("src/lib/ebooks/render.ts");
if(!renderer.includes('case "recipe"')||!renderer.includes('recipe-method')||!renderer.includes('recipe-ingredients'))
  throw new Error("Recipe A4 layout missing.");
const generate=read("src/app/api/ebooks/generate/route.ts");
if(!generate.includes("detectEbookIntent")||!generate.includes("buildCookbook"))
  throw new Error("Recipe intent not wired to API.");
const studio=read("src/app/app/ebooks/page.tsx");
if(!studio.includes('page.kind==="recipe"')||!studio.includes("deliveredItems"))
  throw new Error("Ebook Studio missing recipe-aware behavior.");
process.stdout.write("Ebook quality gate PASS: 50 unique complete recipes, five groups, recipe renderer, route and Studio.\n");