/**
 * Build the FULL standalone CSS used by the original user-supplied universal
 * LP template. Previous bundling copied only custom @utility rules and
 * omitted Tailwind's generated layout, spacing, font and SVG-size classes.
 * This made even size-4 icons default to 300px-wide SVG boxes in the iframe.
 * Runs before tests, dev server, and Next.js build.
 */
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";

const root=path.resolve(import.meta.dirname,"..");
const require=createRequire(path.join(root,"package.json"));
const tailwind=require("tailwindcss");
const file=fs.readFileSync(path.join(root,"src/lib/landing/universal-template.ts"),"utf8");
const matched=file.match(/export const UNIVERSAL_TEMPLATE_HTML=("(?:\\.|[^"\\])*");/);
if(!matched)throw Error("Universal original template HTML export not found");
const html=JSON.parse(matched[1]);
const classes=new Set();
for(const match of html.matchAll(/\bclass="([^"]+)"/g)){
 for(const value of match[1].split(/\s+/))if(value)classes.add(value);
}
// Dynamic cards inserted by the renderer need their own utilities.
for(const v of [
 "flex items-start gap-3 mt-0.5 bg-success/15 text-success border border-destructive/25",
 "bg-destructive/10 text-destructive font-medium text-muted-foreground",
 "mt-7 space-y-4 relative grid size-6 place-items-center rounded-full",
 "mt-6 text-xl font-extrabold mt-2 leading-relaxed grow italic",
 "surface lift flex flex-col rounded-3xl p-8 mt-6 flex items-center gap-3",
 "border-t border-dashed pt-5 size-12 rounded-full object-cover",
 "font-bold text-sm max-w-3xl mx-auto mt-10 text-center",
 "px-5 py-10 bg-card border border-border rounded-3xl",
 "text-base leading-relaxed font-semibold text-foreground",
 "py-12 sm:py-16 md:py-24",
].join(" ").split(/\s+/))if(v)classes.add(v);

const pkgTheme=fs.readFileSync(require.resolve("tailwindcss/theme.css"),"utf8");
const css="@layer theme, utilities;\n"+
 pkgTheme+"\n"+
 // The original file defines these as CSS vars; exposing them to Tailwind
 // makes bg-card, text-primary, text-muted-foreground, etc real utilities.
 `@theme inline{
 --font-display:"Bricolage Grotesque",sans-serif;
 --font-sans:"DM Sans",sans-serif;
 --font-serif:"Instrument Serif",Georgia,serif;
 --color-background:var(--background);
 --color-foreground:var(--foreground);
 --color-card:var(--card);
 --color-border:var(--border);
 --color-primary:var(--primary);
 --color-primary-foreground:var(--primary-foreground);
 --color-primary-deep:var(--primary-deep);
 --color-muted:var(--muted);
 --color-muted-foreground:var(--muted-foreground);
 --color-destructive:var(--destructive);
 --color-success:var(--success);
 --color-accent:var(--accent);
 --color-accent-foreground:var(--accent-foreground);
 --color-ink:var(--ink);
 --color-ink-foreground:var(--ink-foreground);
}
@tailwind utilities;`;
const compiler=await tailwind.compile(css,{base:root});
const compiled=compiler.build([...classes]);
for(const selector of [".size-4", ".size-5", ".px-5", ".max-w-6xl", ".rounded-3xl", ".flex", ".grid", ".gap-4"]){
 if(!compiled.includes(selector+" {"))throw Error("Missing universal LP utility "+selector);
}
const output=path.join(root,"public/landing-universal/complete-utilities.css");
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,compiled+"\n@media(max-width:640px){svg{flex-shrink:0}}\n","utf8");
console.log("[Universal LP] "+classes.size+" classes; "+compiled.length+" CSS bytes; responsive utility stylesheet ready.");
