export type SitePageKey = "home" | "sobre" | "servicos" | "contato";

export const SITE_PAGES: { key: SitePageKey; label: string }[] = [
  { key: "home", label: "Início" },
  { key: "sobre", label: "Sobre" },
  { key: "servicos", label: "Serviços" },
  { key: "contato", label: "Contato" },
];

export type SitePage = {
  key: SitePageKey;
  eyebrow: string;
  heading: string;
  introduction: string;
  sections: { title: string; body: string }[];
  cta: string;
};

export type SiteProject = {
  kind: "institutional-site";
  id: string;
  name: string;
  brief: string;
  style: string;
  pages: Partial<Record<SitePageKey, SitePage>>;
  createdAt: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function renderSitePreview(project: SiteProject, pageKey: SitePageKey): string {
  const page = project.pages[pageKey];
  if (!page) return "";

  const palette = project.style === "vibrante"
    ? { background: "#10122b", foreground: "#f8f8ff", accent: "#a78bfa", surface: "#1c1e3b" }
    : project.style === "elegante"
      ? { background: "#f5f1eb", foreground: "#252019", accent: "#8e624d", surface: "#ffffff" }
      : { background: "#f6f8f7", foreground: "#172723", accent: "#087f63", surface: "#ffffff" };

  const nav = SITE_PAGES.filter(({ key }) => project.pages[key]).map(({ key, label }) =>
    `<a href="#${key}" data-page="${key}" ${key === pageKey ? 'aria-current="page"' : ""}>${label}</a>`,
  ).join("");
  const sections = page.sections.map((section) =>
    `<article class="card"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p></article>`,
  ).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)} — ${escapeHtml(page.heading)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:${palette.background};color:${palette.foreground};font-family:Arial,Helvetica,sans-serif}a{color:inherit;text-decoration:none}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px max(6%,calc((100% - 1160px)/2));border-bottom:1px solid currentColor}header strong{font-size:20px;letter-spacing:-.04em}nav{display:flex;gap:24px;font-size:14px;flex-wrap:wrap}nav a[aria-current]{color:${palette.accent};font-weight:700}.hero{padding:100px max(6%,calc((100% - 1160px)/2)) 85px}.eyebrow{color:${palette.accent};font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:12px}h1{font-size:clamp(42px,6vw,78px);line-height:1.05;letter-spacing:-.055em;max-width:900px;margin:22px 0}p{line-height:1.7}.hero p{font-size:19px;max-width:680px;opacity:.75}.button{display:inline-block;margin-top:20px;padding:15px 24px;border-radius:10px;background:${palette.accent};color:#fff;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px;padding:0 max(6%,calc((100% - 1160px)/2)) 90px}.card{padding:30px;border-radius:18px;background:${palette.surface};box-shadow:0 12px 35px #0000000a}.card h2{font-size:21px;margin:0 0 14px}.card p{margin:0;opacity:.75}footer{padding:30px 6%;border-top:1px solid currentColor;opacity:.65;font-size:13px}@media(max-width:650px){header{align-items:flex-start;flex-direction:column}.hero{padding-top:65px}}
  </style></head><body><header><strong>${escapeHtml(project.name)}</strong><nav>${nav}</nav></header><main><section class="hero"><div class="eyebrow">${escapeHtml(page.eyebrow)}</div><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.introduction)}</p>${project.pages.contato && pageKey !== "contato" ? `<a class="button" href="#contato" data-page="contato">${escapeHtml(page.cta)}</a>` : ""}</section><section class="grid">${sections}</section></main><footer>${escapeHtml(project.name)} · Site em criação no PageNova AI</footer><script>document.addEventListener('click',function(event){var link=event.target.closest('[data-page]');if(link){event.preventDefault();parent.postMessage({type:'pagenova-site-preview-page',key:link.getAttribute('data-page')},'*')}})</script></body></html>`;
}
