import type { SitePage, SiteProject } from "@/lib/site-builder";
import { getSitePreset } from "@/lib/site-builder-presets";

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function renderContactPreview(project: SiteProject, page: SitePage): string {
  const name = esc(project.name);
  const niche = esc(getSitePreset(project.presetId || "institucional").title);
  const email = project.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.contactEmail)
    ? project.contactEmail : "";
  const emailJson = JSON.stringify(email).replace(/</g, "\\u003c");
  const nav = [
    ["home", "Início"], ["sobre", "Sobre"],
    ["servicos", project.presetId === "imobiliaria" ? "Imóveis" : "Serviços"],
    ["contato", "Contato"],
  ].filter(([key]) => project.pages[key as keyof SiteProject["pages"]])
    .map(([key, label]) => `<a href="#${key}" data-page="${key}" ${key === "contato" ? 'aria-current="page"' : ""}>${label}</a>`)
    .join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contato — ${name}</title>
<style>
*{box-sizing:border-box}body{margin:0;color:#18302a;background:#f7f8f5;font-family:Arial,Helvetica,sans-serif}
a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit}
header{background:white;padding:23px max(5%,calc((100% - 1180px)/2));display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:1px solid #e4e9e3}
header strong{font-size:22px;letter-spacing:-.05em}nav{display:flex;gap:25px;flex-wrap:wrap;font-size:14px}
nav a[aria-current]{color:#087f63;font-weight:800}
main{max-width:1180px;margin:auto;padding:85px 28px 100px}
.kicker{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#087f63}
h1{font:400 clamp(44px,5vw,70px)/1.08 Georgia,serif;letter-spacing:-.045em;max-width:830px;margin:20px 0}
.intro{font-size:18px;line-height:1.7;color:#5d7168;max-width:700px;margin-bottom:55px}
.layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,.7fr);gap:28px;align-items:start}
form,.aside{background:white;border:1px solid #e3eae3;border-radius:20px;padding:34px;box-shadow:0 20px 55px #123c3510}
form h2,.aside h2{font:400 29px Georgia,serif;margin:0 0 9px}
.hint{color:#66776d;line-height:1.6;font-size:14px;margin:0 0 28px}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:18px}
label{display:block;font-size:13px;font-weight:700;color:#31463c}
label.full{grid-column:1/-1}
input,select,textarea{display:block;width:100%;margin-top:9px;padding:15px 16px;border:1px solid #d7e1d8;border-radius:10px;background:#fbfcfa;color:#18302a;outline:none}
input:focus,select:focus,textarea:focus{border-color:#087f63;box-shadow:0 0 0 3px #087f6320}
textarea{min-height:125px;resize:vertical}
button[type=submit]{border:0;border-radius:10px;background:#087f63;color:white;padding:17px 25px;font-weight:800;cursor:pointer;margin-top:23px}
button[type=submit]:hover{background:#08684f}
.aside{background:#123c35;color:white}.aside .kicker{color:#9bd8be}.aside h2{margin:18px 0}
.aside p{line-height:1.8;color:#d3e5db}.aside a{display:block;word-break:break-word;color:#a8e2c4;margin-top:26px}
.notice{font-size:12px;color:#76877d;line-height:1.5;margin-top:16px}
footer{background:#123c35;color:#d3e5db;padding:32px 6%;font-size:13px}
@media(max-width:760px){header{flex-direction:column;align-items:flex-start}main{padding:60px 20px}.layout{grid-template-columns:1fr}.fields{grid-template-columns:1fr}label.full{grid-column:auto}form,.aside{padding:25px}}
</style></head><body>
<header><strong>${name}</strong><nav>${nav}</nav></header>
<main><span class="kicker">${niche} · Contato</span>
<h1>${esc(page.heading)}</h1>
<p class="intro">${esc(page.introduction)}</p>
<div class="layout">
<form id="contact">
<h2>Vamos conversar?</h2>
<p class="hint">Conte o que você procura. Os dados serão preparados para envio ao e-mail da empresa.</p>
<div class="fields">
<label>Seu nome<input name="nome" autocomplete="name" required maxlength="100"></label>
<label>Seu e-mail<input name="email" type="email" autocomplete="email" required maxlength="150"></label>
<label>Telefone<input name="telefone" type="tel" autocomplete="tel" maxlength="30"></label>
<label>Assunto<select name="assunto" required><option value="">Selecione</option>
${project.presetId === "imobiliaria" ? '<option>Comprar imóvel</option><option>Alugar imóvel</option><option>Anunciar imóvel</option>' : '<option>Conhecer os serviços</option><option>Solicitar orçamento</option>'}
<option>Outro assunto</option></select></label>
<label class="full">Sua mensagem<textarea name="mensagem" required maxlength="2000" placeholder="Descreva sua necessidade"></textarea></label>
</div><button type="submit">Preparar mensagem →</button>
<p class="notice" id="status">${email ? "Ao clicar, seu aplicativo de e-mail será aberto para você confirmar o envio." : "Configure o e-mail de contato no projeto para habilitar o envio."}</p>
</form>
<aside class="aside"><span class="kicker">Atendimento</span><h2>O próximo passo começa aqui.</h2>
<p>Descreva sua necessidade para que a equipe possa entender o pedido e orientar você.</p>
${email ? `<a href="mailto:${esc(email)}">${esc(email)} ↗</a>` : "<p>E-mail da empresa ainda não informado.</p>"}
</aside></div></main>
<footer>${name} · Site criado com PageNova AI</footer>
<script>
const recipient=${emailJson};
document.getElementById("contact").addEventListener("submit",function(event){
  event.preventDefault();
  const status=document.getElementById("status");
  if(!recipient){status.textContent="O responsável precisa informar um e-mail de contato antes de receber mensagens.";return}
  const fields=new FormData(this);
  const subject="Contato pelo site: "+String(fields.get("assunto")||"");
  const message=[
    "Nome: "+fields.get("nome"),
    "E-mail: "+fields.get("email"),
    "Telefone: "+(fields.get("telefone")||"Não informado"),
    "Assunto: "+fields.get("assunto"),
    "",
    String(fields.get("mensagem")||"")
  ].join("\\n");
  window.location.href="mailto:"+recipient+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(message);
  status.textContent="Confira e confirme o envio no seu aplicativo de e-mail.";
});
document.addEventListener("click",function(event){
  const link=event.target.closest("[data-page]");
  if(link){event.preventDefault();parent.postMessage({type:"pagenova-site-preview-page",key:link.dataset.page},"*")}
});
</script></body></html>`;
}