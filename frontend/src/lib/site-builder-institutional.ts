import type { SitePage, SitePageKey, SiteProject } from "@/lib/site-builder";
import { renderExampleTestimonials } from "@/lib/site-builder-testimonials";

const esc = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] ?? character);

function photo(value: string | undefined, label: string, style: string): string {
  if (value && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 8000000) {
    return `<img src="${value}" alt="${esc(label)}" />`;
  }
  return `<div class="image-space ${style}" role="img" aria-label="Espaço para ${esc(label)}"><span>✦</span><small>FOTO DO PROJETO</small></div>`;
}

export function renderInstitutionalPage(project: SiteProject, page: SitePage, pageKey: SitePageKey): string {
  const info = project.institutional;
  const name = esc(project.name);
  const nav = ([
    ["home", "Início"], ["sobre", "Sobre"], ["servicos", "Serviços"], ["contato", "Contato"],
  ] as const).filter(([key]) => project.pages[key]);
  const links = nav.map(([key, label]) => `<a href="#${key}" data-page="${key}" ${key === pageKey ? 'aria-current="page"' : ""}>${label}</a>`).join("");
  const cta = project.pages.contato ? `<a class="btn" href="#contato" data-page="contato">${esc(page.cta || "Fale conosco")} <span aria-hidden="true">↗</span></a>` : "";
  const secondary = project.pages.servicos && pageKey !== "servicos" ? `<a class="text-link" href="#servicos" data-page="servicos">Conheça nossos serviços <span aria-hidden="true">↗</span></a>` : "";
  const laundry = /lavanderia|lavagem de roupas|passadoria|roupas e peças/i.test(`${project.name} ${project.brief}`);
  const heroImage = laundry ? '<img src="/pagenova-lavanderia-banner-1.png" alt="Roupas limpas dobradas em uma lavanderia" />' : photo(info?.portrait, `imagem principal de ${project.name}`, "hero-art");
  const businessImage = photo(info?.businessPhoto, `ambiente de ${project.name}`, "business-art");
  const workImage = laundry ? '<img src="/pagenova-lavanderia-banner-2.png" alt="Passadoria de roupas em uma lavanderia" />' : photo(info?.workPhoto || info?.businessPhoto, `trabalho de ${project.name}`, "work-art");
  const sensitive = /psicolog|terap|saúde|saude|cl[ií]nic|m[eé]dic|advog|nutri[cç]/i.test(`${project.name} ${project.brief}`);
  const personal = /portf[oó]lio|designer|consultor|profissional aut[oô]nom|fot[oó]graf|advogad|terapeut|arquiteto|desenvolvedor/i.test(project.brief);
  const theme = project.previewTheme || "original";
  const visual = project.visualDirection || {
    heroLayout: "overlay",
    heroAlignment: "left",
    heroContentWidth: "medium",
    imageFocus: "center",
    density: "balanced",
    cardStyle: "elevated",
  };

  const visualClasses = [
    `pn-hero-${visual.heroLayout}`,
    `pn-align-${visual.heroAlignment}`,
    `pn-width-${visual.heroContentWidth}`,
    `pn-focus-${visual.imageFocus}`,
    `pn-density-${visual.density}`,
    `pn-cards-${visual.cardStyle}`,
  ].join(" ");
  const cards = page.sections.slice(0, 6).map(({ title, body }, index) => `<article class="feature" id="feature-${index + 1}">
    <span class="number">${String(index + 1).padStart(2, "0")}</span><h3>${esc(title)}</h3><p>${esc(body)}</p>
    </article>`).join("");
  const sectionTitle = pageKey === "sobre" ? "O que nos move" : pageKey === "servicos" ? "O que entregamos" : "Uma atuação feita para você";
  const storyTitle = pageKey === "sobre" ? "Nossa forma de trabalhar" : project.pages.sobre?.heading || "Nossa forma de trabalhar";
  const storyText = pageKey === "sobre" ? (info?.process || page.introduction) : (project.pages.sobre?.introduction || info?.process || "");
  const secondTitle = info?.process ? (sensitive ? "Como funciona o primeiro contato" : "Conheça nosso jeito de trabalhar") : (sensitive ? "Converse sobre o atendimento" : "Vamos falar sobre seu projeto");
  const secondLead = info?.process || (sensitive ? "Tire suas dúvidas sobre a proposta de atendimento e entenda os próximos passos antes de decidir." : "Conte o que você precisa e descubra como podemos ajudar.");
  const proof = info?.proof ? `<p class="fact">${esc(info.proof)}</p>` : "";
  const audience = info?.audience ? `<p class="audience">Para ${esc(info.audience)}</p>` : "";
  const legal = /advog|jur[ií]d|escrit[oó]rio de advocacia|direito/i.test(`${project.name} ${project.brief}`);
  const offerList = (info?.offer || "")
    .split(/[;,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
  const detailItems = page.sections.slice(0, 4).map(({ title, body }, index) =>
    `<article class="pn-area-row"><span class="pn-area-index">${String(index + 1).padStart(2, "0")}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div><span class="pn-area-arrow" aria-hidden="true">↗</span></article>`
  ).join("");
  const processText = info?.process?.trim() || "";
  const aboutText = project.pages.sobre?.introduction || page.introduction;
  const faqItems = [
    {
      question: legal ? "Quais áreas são atendidas?" : "Quais serviços são oferecidos?",
      answer: offerList.length
        ? `As opções informadas são: ${offerList.join(", ")}. Entre em contato para explicar sua necessidade.`
        : "Entre em contato para confirmar os serviços disponíveis para sua necessidade.",
    },
    {
      question: "Como funciona o primeiro contato?",
      answer: processText || "Envie uma mensagem com o que você procura. A equipe poderá explicar os próximos passos diretamente.",
    },
    {
      question: legal ? "O atendimento garante algum resultado?" : "Como posso saber se o serviço atende ao meu caso?",
      answer: legal
        ? "Cada situação exige análise individual. A apresentação do site não constitui promessa de resultado."
        : "Descreva sua necessidade no formulário para receber orientações sobre as opções disponíveis.",
    },
  ];
  const faq = faqItems.map(({ question, answer }) =>
    `<details class="pn-faq-item"><summary>${esc(question)}<span aria-hidden="true">+</span></summary><p>${esc(answer)}</p></details>`
  ).join("");  const contactEmail = project.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.contactEmail) ? project.contactEmail : "";
  const phoneDigits = (project.contactWhatsApp || "").replace(/\D/g, "");
  const whatsAppUrl = phoneDigits.length >= 10 && phoneDigits.length <= 13
    ? `https://wa.me/${phoneDigits.length <= 11 ? "55" : ""}${phoneDigits}` : "";
  function socialUrl(value: string | undefined, service: "instagram" | "facebook"): string {
    const raw = (value || "").trim().replace(/^@/, "");
    if (!raw) return "";
    const candidate = /^https?:\/\//i.test(raw) ? raw : raw.startsWith("www.") ? `https://${raw}` :
      `https://${service}.com/${raw.replace(new RegExp(`^${service}\\.com/`, "i"), "")}`;
    try {
      const parsed = new URL(candidate);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (parsed.protocol !== "https:" || host !== `${service}.com`) return "";
      return parsed.href;
    } catch { return ""; }
  }
  const instagramUrl = socialUrl(project.contactInstagram, "instagram");
  const facebookUrl = socialUrl(project.contactFacebook, "facebook");
  const socialLinks = [
    project.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.contactEmail)
      ? `<a href="mailto:${esc(project.contactEmail)}" aria-label="Enviar e-mail"><span class="social-icon" aria-hidden="true">✉</span><span>E-mail</span></a>` : "",
    whatsAppUrl
      ? `<a href="${esc(whatsAppUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp"><span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.49 0 .13 5.36.13 11.94c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.58 0 11.93-5.36 11.93-11.94a11.86 11.86 0 0 0-3.49-8.42ZM12.08 21.82h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.73.98.99-3.63-.24-.37a9.88 9.88 0 0 1-1.52-5.27C2.18 6.47 6.62 2.03 12.08 2.03a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 7.01c0 5.45-4.44 9.88-9.88 9.88Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.62.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/></svg></span><span>WhatsApp</span></a>` : "",
    instagramUrl
      ? `<a href="${esc(instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram"><span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/></svg></span><span>Instagram</span></a>` : "",
    facebookUrl
      ? `<a href="${esc(facebookUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir Facebook"><span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg></span><span>Facebook</span></a>` : "",
  ].filter(Boolean).join("");
  const contactEmailJson =JSON.stringify(contactEmail).replace(/</g, "\\u003c");
  const contactSubjectJson = JSON.stringify(`Contato pelo site — ${project.name}`).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name} — ${esc(page.heading)}</title><style>
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f8f4;color:#17362f;font-family:"Poppins",sans-serif}a{color:inherit;text-decoration:none}button{font:inherit}
  .shell{width:min(1240px,100% - 56px);margin:auto}.topline{height:5px;background:#62bd76}header{background:#fff;border-bottom:1px solid #e7eae5}.header-inner{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:28px}.brand{font-size:clamp(20px,2vw,27px);font-weight:800;letter-spacing:-.065em;max-width:260px;overflow-wrap:anywhere}nav{display:flex;gap:32px;align-items:center;font-size:13px;font-weight:700}nav a{padding:12px 0}nav a:hover,nav a[aria-current]{color:#247a57}nav a[aria-current]{box-shadow:inset 0 -2px #64bf78}
  .hero{position:relative;min-height:min(700px,80vh);display:flex;align-items:center;color:white;background:#133b31;isolation:isolate;overflow:hidden}.hero-media{position:absolute;inset:0;z-index:-2}.hero-media img{width:100%;height:100%;object-fit:cover;display:block}.hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0b302bfa 0%,#123c35e8 35%,#123c3570 69%,#123c3530 100%)}.hero-inner{padding-top:108px;padding-bottom:116px}.hero-content{max-width:740px}.eyebrow{display:block;text-transform:uppercase;letter-spacing:.19em;font-size:11px;font-weight:800;color:#8bd99b}.eyebrow:before{content:"";display:inline-block;width:28px;height:2px;background:currentColor;vertical-align:middle;margin-right:12px}h1,h2,h3{margin:0;letter-spacing:-.045em}h1{font-size:clamp(46px,6.2vw,89px);line-height:1.04;margin:26px 0;max-width:900px;font-weight:750}h2{font-size:clamp(34px,4.4vw,57px);line-height:1.11}h3{font-size:clamp(23px,2.2vw,30px);line-height:1.18}.hero-lead{max-width:590px;font-size:clamp(17px,1.5vw,20px);line-height:1.65;color:#e2ede7}.audience{color:#c4dfca;font-size:14px;margin:15px 0}.actions{display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin-top:33px}.btn{display:inline-flex;align-items:center;justify-content:space-between;gap:40px;background:#71c982;color:#103b2c;padding:17px 22px;font-size:13px;font-weight:800;min-height:53px;border-radius:4px}.btn:hover{background:#91dda0}.text-link{font-size:13px;font-weight:800;color:#fff;border-bottom:1px solid #9bc7ad;padding:12px 0}.text-link span{padding-left:18px}
  .image-space{width:100%;height:100%;position:relative;overflow:hidden;background:radial-gradient(circle at 70% 34%,#82b99566 0 12%,transparent 35%),linear-gradient(130deg,#2b6457,#173f35 52%,#102f2a);display:flex;align-items:flex-end;padding:28px;color:#d4ebdc}.image-space:before{content:"";position:absolute;inset:12% 12% -25% 35%;border:1px solid #ffffff28;border-radius:48% 48% 0 0;box-shadow:0 0 0 48px #ffffff06,0 0 0 115px #ffffff04}.image-space>span{position:absolute;top:14%;right:16%;font:clamp(100px,20vw,270px) "Poppins",sans-serif;opacity:.12}.image-space small{position:relative;font-size:10px;letter-spacing:.18em;font-weight:700}.hero-art{background:radial-gradient(circle at 77% 44%,#9bc89a70,transparent 28%),linear-gradient(135deg,#235d50,#12372f 60%,#0d2d29)}
  .personal.hero{background:#f4f0eb;color:#1e241f;min-height:670px}.personal .hero-media{inset:72px max(5%,calc((100% - 1240px)/2)) 72px auto;width:36%;z-index:-1;border-radius:16px;overflow:hidden}.personal .hero-media:after{display:none}.personal .hero-inner{padding-top:125px;padding-bottom:125px}.personal .hero-content{max-width:60%;padding-right:36px}.personal .hero-lead{color:#5a645d}.personal .eyebrow{color:#ad4c2f}.personal .btn{background:#ba502e;color:white}.personal .text-link{color:#17362f;border-color:#a6b3a9}.personal h1{font-family: "Poppins", sans-serif;font-weight:700;font-size:clamp(48px,6vw,83px)}
  .intro-strip{background:#fff;border-bottom:1px solid #e2e9e1}.intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:90px;align-items:center;padding:46px 0}.intro-grid strong{font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#298054}.intro-grid p{margin:0;font-size:clamp(18px,2vw,26px);line-height:1.48;letter-spacing:-.02em;color:#415a4d}
  .section{padding:110px 0}.section-head{display:flex;justify-content:space-between;align-items:end;gap:35px;margin-bottom:45px}.section-head h2{max-width:660px;margin-top:18px}.section-head p{max-width:330px;color:#627469;line-height:1.7;font-size:15px;margin:0}.kicker{display:block;color:#268154;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.features{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#dce6dc;border:1px solid #dce6dc}.feature{min-height:265px;padding:33px;position:relative;background:#fff;display:flex;flex-direction:column;align-items:flex-start}.number{font-size:12px;color:#278354;font-weight:800;letter-spacing:.12em}.feature h3{margin:37px 0 13px}.feature p{margin:0;color:#63756a;font-size:14px;line-height:1.7;max-width:35ch}.feature-arrow{margin-top:auto;padding-top:22px;color:#278354;font-size:20px}
  .editorial{background:#eaf0e9}.editorial-grid{display:grid;grid-template-columns:1fr 1fr;min-height:560px}.editorial-image{min-height:560px;overflow:hidden}.editorial-image img,.wide-image img,.gallery-image img{width:100%;height:100%;object-fit:cover;display:block}.business-art{background:linear-gradient(145deg,#75aa87,#2b6553 62%,#194739)}.editorial-copy{display:flex;flex-direction:column;justify-content:center;padding:70px clamp(30px,6vw,100px)}.editorial-copy h2{margin:18px 0 25px}.editorial-copy p{color:#52675a;line-height:1.8;font-size:17px;max-width:52ch}.fact{border-left:3px solid #55b46c;padding-left:18px;font-weight:700}.editorial-copy .text-link{color:#236a49;border-color:#75a986;align-self:flex-start;margin-top:12px}
  .gallery-head{max-width:700px;margin-bottom:40px}.gallery-head h2{margin:18px 0}.gallery-head p{color:#65766a;line-height:1.7}.gallery{display:grid;grid-template-columns:1.3fr .7fr;gap:22px}.gallery-image{height:390px;overflow:hidden}.gallery-image:last-child{height:320px;align-self:end}.work-art{background:linear-gradient(135deg,#a9c7ad,#548a70 58%,#275a47)}.wide-image{height:350px;overflow:hidden}.wide-image .image-space{background:linear-gradient(110deg,#1d4d41,#317764 55%,#89b996)}
  .closing{background:#163e33;color:#fff;padding:94px 0}.closing-inner{display:flex;justify-content:space-between;align-items:center;gap:40px}.closing h2{max-width:690px;margin-top:18px}.closing p{color:#d0e3d7;line-height:1.7;max-width:550px}footer{background:#0b2923;color:#bdd3c5;padding:55px 0 25px}.footer-grid{display:flex;justify-content:space-between;gap:35px;padding-bottom:60px}.footer-grid .brand{color:#fff}.footer-grid nav{flex-wrap:wrap}.footer-bottom{border-top:1px solid #ffffff25;padding-top:20px;font-size:12px;color:#a3bcae}
  @media(max-width:900px){.features{grid-template-columns:repeat(2,1fr)}.section-head{align-items:start;flex-direction:column}.editorial-grid{grid-template-columns:1fr}.editorial-image{min-height:360px;height:360px}.editorial-copy{padding:65px 6%}.hero{min-height:580px}.hero-media:after{background:linear-gradient(90deg,#0b302bf5,#0d342d9c)}}
  @media(max-width:650px){.personal.hero{display:block;min-height:0}.personal .hero-media{position:relative;inset:auto;width:100%;height:390px;border-radius:0}.personal .hero-content{max-width:none;padding:0}.personal .hero-inner{padding-top:62px;padding-bottom:60px}.shell{width:min(100% - 36px,1240px)}.header-inner{min-height:unset;padding:19px 0;display:block}.brand{display:block;margin-bottom:15px}nav{gap:16px;flex-wrap:wrap;font-size:12px}.hero{min-height:620px;align-items:flex-end}.hero-inner{padding-top:85px;padding-bottom:68px}.hero-media:after{background:linear-gradient(0deg,#0a2c27 4%,#123e34bd 62%,#153f3599 100%)}h1{font-size:clamp(44px,11vw,67px)}.intro-grid{grid-template-columns:1fr;gap:18px;padding:35px 0}.section{padding:75px 0}.features{grid-template-columns:1fr}.feature{min-height:215px;padding:26px}.feature h3{margin-top:23px}.gallery{grid-template-columns:1fr}.gallery-image,.gallery-image:last-child{height:290px}.editorial-image{height:300px;min-height:300px}.closing-inner,.footer-grid{align-items:start;flex-direction:column}.closing{padding:70px 0}.footer-grid{padding-bottom:35px}.footer-grid nav{gap:14px}}

  /* Ajuste editorial do institucional */
  .brand{font-size:clamp(16px,1.5vw,19px);letter-spacing:-.02em;max-width:360px;line-height:1.25}
  .hero h1{font-size:clamp(36px,4.3vw,62px);line-height:1.12;max-width:720px}
  .personal h1{font-size:clamp(38px,4.5vw,64px)}
  .section h2,.editorial h2,.closing h2{font-size:clamp(29px,3.6vw,46px)}
  .features{gap:20px;background:transparent;border:0}
  .feature{min-height:0;padding:27px 28px 31px;background:#fff;border:1px solid #dce6dc;border-top:3px solid #4aaa70;border-radius:8px}
  .feature h3{font-size:clamp(20px,1.9vw,25px);margin:18px 0 10px}
  .feature p{max-width:40ch;line-height:1.65}
  @media(max-width:650px){.hero h1,.personal h1{font-size:clamp(36px,9vw,48px)}.features{gap:14px}.feature{padding:25px}}

  /* Faixa de atuação, grade adaptativa e rodapé neutro */
  .intro-strip{background:#f8f7f3;border-bottom:1px solid #e6e8e1}
  .intro-grid{grid-template-columns:minmax(230px,.75fr) minmax(0,2fr);gap:34px;padding:36px 0}
  .intro-label span{font-size:10px;font-weight:800;letter-spacing:.18em;color:#438e5f}
  .intro-label h2{font-size:clamp(23px,2.4vw,34px);margin:8px 0 0;letter-spacing:-.035em}
  .intro-highlights{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
  .intro-pill{display:inline-flex;align-items:center;gap:10px;background:white;border:1px solid #d9e4d9;border-radius:100px;padding:11px 14px;color:#344d3c;font-size:12px;font-weight:700;line-height:1.25}
  .intro-pill b{font-size:10px;color:#32885b}
  [data-pn-ready="true"] .intro-strip.pn-reveal .intro-pill{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease}
  [data-pn-ready="true"] .intro-strip.pn-visible .intro-pill{opacity:1;transform:none}
  .intro-pill:nth-child(2){transition-delay:90ms!important}.intro-pill:nth-child(3){transition-delay:180ms!important}.intro-pill:nth-child(4){transition-delay:270ms!important}
  .features.features-four{grid-template-columns:repeat(4,minmax(0,1fr))}
  .features-four .feature{padding:24px;min-width:0}
  .features-four .feature h3{font-size:clamp(18px,1.65vw,23px)}
  footer{background:#f1f1ed;color:#293b32;padding:45px 0 24px}
  footer .footer-grid{padding-bottom:32px}
  footer .footer-grid .brand{color:#213d30}
  footer .footer-grid p{max-width:56ch;color:#67746b;line-height:1.6}
  footer nav a[aria-current]{box-shadow:none;color:#247a57}
  footer .footer-bottom{border-color:#d7ded5;color:#69786f}
  @media(max-width:1080px){.features.features-four{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:700px){.intro-grid{grid-template-columns:1fr;gap:20px;padding:30px 0}.intro-pill{font-size:11px}}
  @media(max-width:650px){.features.features-four{grid-template-columns:1fr}.features-four .feature{padding:25px}}
  @media(prefers-reduced-motion:reduce){[data-pn-ready="true"] .intro-strip .intro-pill{opacity:1!important;transform:none!important;transition:none!important}}
  .intro-grid{display:block;padding:48px 0 52px}.intro-label{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:24px}.intro-label h2{font-size:clamp(25px,2.8vw,38px)}.intro-highlights{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:stretch}.intro-pill{min-height:86px;border-radius:10px;padding:18px;justify-content:flex-start;gap:13px;align-items:center;box-shadow:0 7px 25px #1c3c2710;transition:transform .3s,box-shadow .3s}.intro-pill span:nth-child(2){flex:1}.intro-pill:hover{transform:translateY(-4px);box-shadow:0 15px 34px #1c3c2720}.intro-pill span:last-child{color:#32885b;font-size:18px}.feature{scroll-margin-top:30px}
  .testimonials{background:#f1f0eb;padding:95px 0}.testimonials-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}.testimonials h2{margin:18px 0 22px;max-width:12ch}.testimonials p{line-height:1.7;color:#58675e;max-width:48ch}.testimonial-card{background:#fff;border:1px solid #e2e2dc;padding:37px;border-radius:14px;box-shadow:0 20px 60px #1c3c2712}.testimonial-card .quote-mark{font:64px "Poppins",sans-serif;color:#3d9668;line-height:.8}.testimonial-card p{font-size:20px;line-height:1.5;color:#30453a;margin:19px 0 30px}.testimonial-card .text-link{color:#247a57;border-color:#98bd9d}.testimonials .kicker{color:#4d9a6c}
  @media(max-width:980px){.intro-highlights{grid-template-columns:repeat(2,minmax(0,1fr))}.testimonials-grid{gap:35px}}
  @media(max-width:650px){.intro-grid{padding:40px 0}.intro-label{display:block}.intro-highlights{grid-template-columns:1fr 1fr}.intro-pill{min-height:100px;align-items:start;flex-direction:column;gap:8px;padding:16px}.intro-pill span:last-child{display:none}.testimonials{padding:68px 0}.testimonials-grid{grid-template-columns:1fr}.testimonial-card{padding:27px}.testimonial-card p{font-size:17px}}
  .intro-strip{background:#f7f8f4;border:0}.intro-grid{display:flex;align-items:center;justify-content:space-between;gap:35px;padding:75px 0 12px}.intro-label{display:block;margin:0}.intro-label span{display:block}.intro-label h2{max-width:18ch;font-size:clamp(31px,3.6vw,48px);margin-top:15px}.intro-highlights{display:none}.intro-summary{max-width:380px;margin:0;color:#647469;line-height:1.7;font-size:16px}
  .contact-section{background:#fafaf7;padding:100px 0;border-top:1px solid #e1e7dd}.contact-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start;gap:clamp(40px,7vw,110px)}.contact-copy{padding-top:25px}.contact-copy h2{margin:18px 0 24px;max-width:12ch}.contact-copy p{font-size:18px;line-height:1.7;color:#5c7063;max-width:46ch}.contact-email{border-top:1px solid #d9e2d9;margin-top:35px;padding-top:25px;overflow-wrap:anywhere;color:#247a57;font-weight:700}.contact-form{background:#fff;border:1px solid #dfe7df;box-shadow:0 18px 50px #173c2615;padding:38px;border-radius:14px}.contact-form h3{font-size:28px;margin-bottom:24px}.contact-fields{display:grid;grid-template-columns:1fr 1fr;gap:17px}.contact-fields label{font-size:13px;font-weight:700;color:#30483a}.contact-fields .full{grid-column:1/-1}.contact-fields input,.contact-fields textarea{display:block;margin-top:9px;width:100%;border:1px solid #d9e2d8;background:#f8f9f5;border-radius:7px;padding:15px;font:inherit;color:#233a2d;outline:none}.contact-fields textarea{min-height:145px;resize:vertical}.contact-fields input:focus,.contact-fields textarea:focus{border-color:#39865d;box-shadow:0 0 0 3px #39865d22}.contact-form button{width:100%;margin-top:20px;border:0;border-radius:7px;padding:17px;color:white;background:#267b51;font-weight:800;cursor:pointer}.contact-form button:hover{background:#195e3c}.contact-status{font-size:12px;color:#68786b;line-height:1.5}
  @media(max-width:760px){.intro-grid{padding:55px 0 10px;display:block}.intro-summary{margin-top:15px}.contact-section{padding:68px 0}.contact-grid{grid-template-columns:1fr;gap:35px}.contact-copy{padding:0}.contact-form{padding:27px}}
  @media(max-width:520px){.contact-fields{grid-template-columns:1fr}.contact-fields .full{grid-column:auto}.contact-copy h2{font-size:36px}}
  .services-section{padding-top:85px;padding-bottom:95px}.services-section .section-head{margin-bottom:32px}.services-section .section-head h2{max-width:720px}.services-section .section-head p{max-width:370px}
  .features.features-four{perspective:1200px;gap:18px}.features-four .feature{min-height:270px;border:1px solid #d9e6dc;border-top:3px solid #57ac76;border-radius:15px;padding:29px;box-shadow:0 3px 1px #e4ece2,0 16px 27px #193a2515,0 28px 45px #193a250b;transform:translateZ(0);transform-style:preserve-3d;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,border-color .35s ease;will-change:transform}.features-four .feature:hover{transform:translateY(-10px) rotateX(3deg) rotateY(-2deg);box-shadow:0 5px 1px #d9e8d8,0 24px 34px #193a2524,0 40px 70px #193a2514;border-color:#9bc8a4}.features-four .feature h3{font-size:clamp(19px,1.7vw,23px);margin:20px 0 12px}.features-four .feature p{font-size:14px;line-height:1.62}.features-four .number{display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:10px;background:#edf6ee;color:#218252;box-shadow:inset 0 1px #fff,0 3px 8px #1d503012}
  .testimonials{padding:66px 0}.testimonials-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:45px}.testimonials h2{font-size:clamp(28px,3vw,39px);max-width:24ch;margin:10px 0 12px}.testimonials p{font-size:14px;line-height:1.6}.testimonial-card{padding:25px 30px;box-shadow:0 12px 30px #1c3c270d}.testimonial-card .quote-mark{font-size:38px}.testimonial-card p{font-size:16px;margin:8px 0 18px}
  @media(max-width:1080px){.features.features-four{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:650px){.services-section{padding-top:65px;padding-bottom:65px}.features.features-four{grid-template-columns:1fr}.features-four .feature{min-height:0}.testimonials{padding:55px 0}.testimonials-grid{grid-template-columns:1fr;gap:20px}}
  @media(prefers-reduced-motion:reduce){.features-four .feature{transition:none;will-change:auto}.features-four .feature:hover{transform:none}}
  .hero:not(.personal) .hero-content{position:relative;z-index:2}.hero:not(.personal):before{content:"";position:absolute;right:5%;top:12%;width:clamp(130px,17vw,260px);aspect-ratio:1;border:1px solid #ffffff48;border-radius:28%;transform:rotate(24deg);box-shadow:0 0 0 20px #ffffff0c,0 0 0 50px #ffffff08,15px 25px 55px #041c1855;animation:hero-float 8s ease-in-out infinite;z-index:-1}.hero-media img{transform:scale(1.035);animation:hero-image 11s ease-in-out infinite alternate}.editorial-image{perspective:900px}.editorial-image img{transition:transform .8s ease}.editorial:hover .editorial-image img{transform:scale(1.045)}.features-four .feature:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,#ffffffa3 0%,transparent 38%);pointer-events:none}.features-four .feature>*{position:relative;transform:translateZ(12px)}
  @keyframes hero-float{50%{transform:translateY(-19px) rotate(30deg)}}@keyframes hero-image{to{transform:scale(1.09)}}
  .examples{overflow:hidden;padding:75px 0 85px}.example-heading{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:30px}.example-heading h2{font-size:clamp(28px,3vw,42px);max-width:25ch;margin:9px 0}.example-heading p{max-width:590px;font-size:13px}.example-toggle{flex:none;border:1px solid #b9cdbd;border-radius:8px;background:#fff;color:#24573a;padding:12px 15px;cursor:pointer;font:700 12px "Poppins",sans-serif}.example-window{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}.example-track{display:flex;width:max-content;animation:reviews-scroll 190s linear infinite}.example-window:hover .example-track,.example-window:focus-within .example-track,.examples.is-paused .example-track{animation-play-state:paused}.example-group{display:flex;gap:17px;padding-right:17px}.example-review{width:330px;min-height:235px;flex:none;background:#fff;border:1px solid #d9e2d8;border-radius:16px;padding:22px;display:flex;flex-direction:column;box-shadow:0 12px 28px #243f2612}.example-tag{display:inline-block;align-self:flex-start;color:#42785a;background:#edf5ee;border-radius:50px;padding:5px 9px;font-size:10px;font-weight:700;letter-spacing:.03em}.example-review p{font-size:15px;line-height:1.55;margin:16px 0 20px;color:#293e31;flex:1}.example-person{display:flex;align-items:center;gap:11px;border-top:1px solid #e8ede7;padding-top:14px}.example-person img{border-radius:50%;width:42px;height:42px}.example-person strong,.example-person small{display:block}.example-person strong{font-size:13px}.example-person small{font-size:11px;color:#758579;margin-top:3px}
  @keyframes reviews-scroll{to{transform:translateX(-50%)}}@media(max-width:650px){.hero:not(.personal):before{width:100px;right:5%;top:6%}.examples{padding:55px 0}.example-heading{align-items:start;flex-direction:column}.example-review{width:280px}.example-track{animation-duration:240s}}@media(prefers-reduced-motion:reduce){.hero:not(.personal):before,.hero-media img,.example-track{animation:none}.editorial-image img{transition:none}.editorial:hover .editorial-image img{transform:none}.example-window{overflow-x:auto;mask-image:none}}
  .example-avatar{display:block;flex:none;width:44px;height:44px;border-radius:50%;background-image:url('/pagenova-testimonial-portraits.png');background-size:500% 500%;background-repeat:no-repeat;border:2px solid #fff;box-shadow:0 2px 10px #12291828}
  .second-banner{position:relative;isolation:isolate;min-height:430px;display:flex;align-items:center;overflow:hidden;background:#15352e;color:white}.second-banner-media{position:absolute;inset:0;z-index:-2}.second-banner-media img,.second-banner-media .image-space{width:100%;height:100%;object-fit:cover}.second-banner:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#09251fec 0%,#12392fc9 48%,#173b325e 100%)}.second-banner-inner{position:relative;padding:82px 0}.second-banner-copy{max-width:610px;position:relative;z-index:2}.second-banner h2{font:400 clamp(36px,4vw,60px)/1.1 "Poppins",sans-serif;letter-spacing:-.045em;margin:18px 0}.second-banner p{font-size:17px;line-height:1.7;color:#e2ece6;max-width:50ch}.second-banner .btn{display:inline-flex;margin-top:17px}.second-orbit{position:absolute;right:7%;top:50%;width:200px;height:200px;border:1px solid #ffffff8a;border-radius:28%;transform:translateY(-50%) rotate(28deg);box-shadow:0 0 0 19px #ffffff18,0 0 0 48px #ffffff0b,25px 35px 65px #061a1680;animation:second-float 8s ease-in-out infinite;pointer-events:none}.second-orbit:after{content:"";position:absolute;inset:38px;border-radius:50%;background:#ffffff24;box-shadow:inset 12px 12px 25px #ffffff49,15px 18px 25px #00181050;backdrop-filter:blur(6px)}@keyframes second-float{50%{transform:translateY(calc(-50% - 18px)) rotate(36deg)}}@media(max-width:750px){.second-banner{min-height:430px}.second-banner:before{background:linear-gradient(90deg,#09251ff0,#12392fd8)}.second-orbit{right:-65px;top:90px;width:130px;height:130px;opacity:.55}.second-banner-inner{padding:70px 0}.second-banner-copy{max-width:100%}}@media(prefers-reduced-motion:reduce){.second-orbit{animation:none}}
  .trust-section{padding:78px 0;background:#f2f3ef}.trust-section h2{max-width:700px;margin:12px 0 32px;font-size:clamp(31px,3.5vw,48px)}.trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.trust-grid article{padding:26px;background:#fff;border:1px solid #dfe6dc;border-radius:14px;box-shadow:0 16px 28px #123d2210;transition:transform .35s,box-shadow .35s}.trust-grid article:hover{transform:translateY(-7px);box-shadow:0 25px 36px #123d2222}.trust-grid article span{font-size:12px;color:#258354;font-weight:800}.trust-grid h3{font-size:23px;margin:18px 0 12px}.trust-grid p{font-size:14px;line-height:1.7;color:#607368}.second-banner{min-height:310px}.second-banner-inner{padding:55px 0}.second-banner h2{font-size:clamp(31px,3.5vw,48px);max-width:18ch}.second-orbit{width:155px;height:155px}.second-orbit:after{inset:30px}@media(max-width:750px){.trust-grid{grid-template-columns:1fr}.trust-section{padding:60px 0}.second-banner{min-height:320px}.second-banner-inner{padding:55px 0}.second-orbit{right:-55px;opacity:.3}}@media(prefers-reduced-motion:reduce){.trust-grid article{transition:none}.trust-grid article:hover{transform:none}}
  .hero-carousel{position:relative;background:#133b31}.hero-carousel .hero{min-height:min(700px,80vh)}.hero-carousel .hero[hidden]{display:none!important}.hero-carousel .hero-slide-two{background:#15352e}.hero-slide-two .hero-media:after{background:linear-gradient(90deg,#09251ff2 0%,#12392fde 55%,#173b3270 100%)}.hero-slide-two h2{font:400 clamp(38px,4.5vw,64px)/1.12 "Poppins",sans-serif;letter-spacing:-.045em;margin:23px 0;max-width:680px}.hero-slide-two .hero-lead{max-width:52ch}.hero-slide-two .second-orbit{z-index:-1}.hero-controls{position:absolute;left:max(28px,calc((100% - 1240px)/2));bottom:28px;z-index:5;display:flex;align-items:center;gap:12px}.hero-controls button{width:42px;height:42px;border-radius:50%;border:1px solid #ffffff85;background:#123b32a8;color:#fff;cursor:pointer}.hero-controls button:hover,.hero-controls button:focus-visible{background:#2b7855;outline:2px solid #92db9c;outline-offset:2px}.hero-controls .hero-dot{width:12px;height:12px;padding:0;border-radius:50%;background:#ffffff75}.hero-controls .hero-dot[aria-current="true"]{background:#88d596;box-shadow:0 0 0 4px #88d59644}.hero-controls .hero-slide-status{color:#fff;font-size:12px;font-weight:700;margin-left:8px}@media(max-width:650px){.hero-carousel .hero{min-height:620px}.hero-carousel .personal.hero{min-height:0}.hero-controls{left:18px;bottom:14px}.hero-carousel .hero-inner{padding-bottom:100px}.hero-slide-two .hero-lead{font-size:16px}.hero-slide-two h2{font-size:clamp(35px,9vw,48px)}.hero-slide-two .second-orbit{right:-70px;top:110px;width:130px;height:130px;opacity:.28}}
  /* Direção de arte: composições reais por tema, com imagem, grade e tipografia próprias. */
  body{--surface:#f7f8f4;--ink:#183b32;--muted:#596f62;--line:#dce4da;--accent:#287950;background:var(--surface);color:var(--ink)}
  .hero-carousel .hero:not(.personal){min-height:640px}
  .hero:not(.personal) .hero-inner{min-height:640px;display:flex;align-items:center;padding-top:82px;padding-bottom:110px}
  .hero:not(.personal) .hero-media:after{background:linear-gradient(90deg,#092d27f5 0%,#10372fe9 42%,#163c328c 73%,#143b3259)}
  .hero .hero-lead{max-width:49ch}.hero h1{max-width:16ch;font-size:clamp(42px,5vw,72px);letter-spacing:-.055em}
  .services-section{padding-top:100px}.services-section .section-head{align-items:start}
  .services-section .section-head h2{font-size:clamp(34px,4vw,55px)}
  .features,.features.features-four{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
  .feature,.features-four .feature{padding:35px;min-height:250px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 18px 48px #102c2212}
  .feature h3,.features-four .feature h3{font-size:clamp(22px,2.1vw,30px);margin:28px 0 14px;max-width:18ch}
  .feature p,.features-four .feature p{font-size:15px;max-width:49ch;color:var(--muted)}
  .editorial-copy h2{max-width:16ch}.contact-section{background:var(--surface)}
  .example-review{box-shadow:0 14px 38px #172a1b12}.examples{background:#eef1eb}
  body.theme-claro{--surface:#fafaf7;--ink:#243b35;--muted:#60726b;--line:#dce4db;--accent:#267653}
  .theme-claro .hero:not(.personal) .hero-media{position:absolute;inset:0 0 0 52%}
  .theme-claro .hero:not(.personal){color:var(--ink);background:#f4f6f0}
  .theme-claro .hero:not(.personal) .hero-media:after{background:linear-gradient(90deg,#f4f6f0 0%,#f4f6f000 35%)}
  .theme-claro .hero:not(.personal) .hero-content{max-width:50%}
  .theme-claro .hero:not(.personal) .hero-lead{color:#4f665b}
  .theme-claro .hero:not(.personal) .eyebrow,.theme-claro .hero:not(.personal) .text-link{color:#267653}
  .theme-claro .hero-slide-two{background:#1a4538!important;color:#fff!important}
  .theme-claro .hero-slide-two .hero-content{max-width:700px!important}
  .theme-claro .hero-slide-two .hero-lead,.theme-claro .hero-slide-two .eyebrow{color:#e7f4e9!important}
  body.theme-escuro{--surface:#101b18;--ink:#eef3ec;--muted:#c5d6c8;--line:#3a5545;--accent:#a4d0a8}
  .theme-escuro header,.theme-escuro .services-section,.theme-escuro .intro-strip,.theme-escuro .contact-section{background:#101b18;color:#eef3ec}
  .theme-escuro header a,.theme-escuro .section-head p,.theme-escuro .intro-summary,.theme-escuro .contact-copy p{color:#c5d6c8}
  .theme-escuro .feature,.theme-escuro .example-review,.theme-escuro .contact-form{background:#203329;color:#f3f5ef;border-color:#3a5545}
  .theme-escuro .feature p,.theme-escuro .example-review p,.theme-escuro .contact-fields label{color:#d7e5d9}
  .theme-escuro .editorial,.theme-escuro .examples{background:#182921;color:#eef3ec}
  .theme-escuro .editorial p,.theme-escuro .example-heading p{color:#c5d6c8}
  .theme-escuro footer{background:#0c1512}
  body.theme-areia{--surface:#f7f1e8;--ink:#372d27;--muted:#6a584a;--line:#dbcbb8;--accent:#a76343}
  .theme-areia .hero:not(.personal){background:#4b3329}
  .theme-areia .hero:not(.personal) .hero-media:after{background:linear-gradient(90deg,#38251ded 0%,#50392cc7 50%,#4d392556)}
  .theme-areia .hero .btn{background:#e8c2a1;color:#372d27}
  .theme-areia .kicker,.theme-areia .feature .number{color:#a76343}
  .theme-areia .feature,.theme-areia .contact-form,.theme-areia .example-review{background:#fffbf5;border-color:#dbcbb8}
  .theme-areia .editorial,.theme-areia .examples{background:#ede3d5}
  .theme-areia footer{background:#e6dbcc;color:#372d27}
  @media(max-width:900px){.features,.features.features-four{grid-template-columns:repeat(2,minmax(0,1fr))}.theme-claro .hero:not(.personal) .hero-content{max-width:65%}}
  @media(max-width:650px){.hero-carousel .hero:not(.personal),.hero:not(.personal) .hero-inner{min-height:620px}.hero:not(.personal) .hero-inner{padding-top:80px;padding-bottom:100px}.hero h1{font-size:clamp(36px,9vw,50px)}.features,.features.features-four{grid-template-columns:1fr}.feature,.features-four .feature{min-height:0;padding:27px}.theme-claro .hero:not(.personal) .hero-media{inset:0}.theme-claro .hero:not(.personal){color:#fff}.theme-claro .hero:not(.personal) .hero-media:after{background:linear-gradient(0deg,#183c34ed,#1d453dbb)}.theme-claro .hero:not(.personal) .hero-content{max-width:100%}.theme-claro .hero:not(.personal) .hero-lead,.theme-claro .hero:not(.personal) .eyebrow,.theme-claro .hero:not(.personal) .text-link{color:#f3fbf4}}
  /* PAGENOVA_EXPANDED_INSTITUTIONAL_V1 */
  .pn-expanded{background:#f7f8f4;color:#183b32}
  .pn-expanded .shell{width:min(1240px,100% - 56px)}
  .pn-eyebrow{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#288255}
  .pn-intro-section{padding:115px 0 105px;border-top:1px solid #e3e9df}
  .pn-intro-grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(45px,7vw,110px);align-items:start}
  .pn-intro-copy{position:sticky;top:35px}
  .pn-intro-copy h2{font-size:clamp(39px,4.7vw,66px);line-height:1.08;max-width:12ch;margin:20px 0 25px;letter-spacing:-.055em}
  .pn-intro-copy p{font-size:17px;line-height:1.75;color:#5a7063;max-width:43ch}
  .pn-intro-copy .pn-small-line{display:block;width:75px;height:2px;background:#4caa70;margin-top:35px}
  .pn-area-list{border-top:1px solid #cbd8ce}
  .pn-area-row{display:grid;grid-template-columns:42px minmax(0,1fr) 24px;gap:18px;padding:28px 4px;border-bottom:1px solid #cbd8ce;transition:padding .25s ease,background .25s ease}
  .pn-area-row:hover{padding-left:16px;background:#edf3ed}
  .pn-area-index,.pn-area-arrow{color:#218054;font-weight:800;font-size:13px}
  .pn-area-row h3{font-size:clamp(23px,2.1vw,32px);margin:0 0 12px;line-height:1.2}
  .pn-area-row p{font-size:15px;line-height:1.65;color:#5c7064;margin:0;max-width:57ch}
  .pn-method{background:#143a30;color:#f5f8f2;padding:110px 0;position:relative;overflow:hidden}
  .pn-method:before{content:"";position:absolute;width:500px;height:500px;border:1px solid #ffffff19;border-radius:50%;right:-130px;top:-160px;box-shadow:0 0 0 85px #ffffff06,0 0 0 175px #ffffff04;pointer-events:none}
  .pn-method-head{display:flex;justify-content:space-between;align-items:end;gap:40px;margin-bottom:48px;position:relative}
  .pn-method-head h2{font-size:clamp(39px,4.6vw,65px);line-height:1.08;max-width:13ch;margin:15px 0 0}
  .pn-method-head p{color:#c4dacf;font-size:17px;line-height:1.7;max-width:42ch}
  .pn-method .pn-eyebrow{color:#9ed6ad}
  .pn-method-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;position:relative}
  .pn-method-step{min-height:265px;border:1px solid #ffffff2a;background:#ffffff0c;border-radius:15px;padding:30px;display:flex;flex-direction:column}
  .pn-method-step b{color:#a3ddb2;font-size:12px;letter-spacing:.12em}
  .pn-method-step h3{font-size:clamp(23px,2vw,30px);margin:auto 0 14px}
  .pn-method-step p{font-size:14px;line-height:1.7;color:#d2e3d8;margin:0}
  .pn-faq{padding:110px 0;background:#f2f4ef}
  .pn-faq-grid{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:clamp(35px,7vw,105px)}
  .pn-faq h2{font-size:clamp(38px,4.2vw,58px);line-height:1.1;margin:18px 0 20px;max-width:13ch}
  .pn-faq-lead{font-size:16px;line-height:1.7;color:#61746a;max-width:38ch}
  .pn-faq-list{border-top:1px solid #c9d5ca}
  .pn-faq-item{border-bottom:1px solid #c9d5ca;padding:22px 0}
  .pn-faq-item summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:20px;font-size:18px;font-weight:750}
  .pn-faq-item summary::-webkit-details-marker{display:none}
  .pn-faq-item summary span{color:#2f8757;font-size:24px;font-weight:400}
  .pn-faq-item[open] summary span{transform:rotate(45deg)}
  .pn-faq-item p{line-height:1.7;color:#5b7063;margin:15px 30px 0 0;font-size:15px}
  .pn-closing{padding:95px 0;background:#e8eee7}
  .pn-closing-inner{display:flex;justify-content:space-between;align-items:center;gap:45px}
  .pn-closing h2{font-size:clamp(37px,4.4vw,61px);line-height:1.09;max-width:14ch;margin:15px 0 0}
  .pn-closing p{font-size:16px;line-height:1.7;color:#586e60;max-width:42ch}
  .pn-closing a{display:inline-flex;align-items:center;justify-content:center;min-height:53px;padding:15px 25px;background:#227c50;color:#fff;border-radius:7px;font-size:14px;font-weight:800;white-space:nowrap}
  body.pn-legal{font-family:"Poppins",sans-serif;background:#f6f3ed;color:#292b28}
  .pn-legal .hero h1,.pn-legal .pn-expanded h2,.pn-legal .pn-expanded h3{font-family: "Poppins", sans-serif;font-weight:400;letter-spacing:-.04em}
  .pn-legal .hero:not(.personal){background:#252d2b}
  .pn-legal .hero:not(.personal) .hero-media:after{background:linear-gradient(90deg,#202827f5 0%,#252d2beb 48%,#252d2b6b)}
  .pn-legal .hero .btn,.pn-legal .pn-closing a{background:#aa8662;color:#fff}
  .pn-legal .pn-expanded,.pn-legal .pn-faq{background:#f6f3ed;color:#292b28}
  .pn-legal .pn-eyebrow,.pn-legal .pn-area-index,.pn-legal .pn-area-arrow{color:#9d7654}
  .pn-legal .pn-area-row:hover{background:#eee8de}
  .pn-legal .pn-method{background:#252d2b}
  .pn-legal .pn-method-step b,.pn-legal .pn-method .pn-eyebrow{color:#d3b18d}
  .pn-legal .pn-closing{background:#eae3d8}
  @media(max-width:900px){
    .pn-intro-grid,.pn-faq-grid{grid-template-columns:1fr;gap:38px}
    .pn-intro-copy{position:static}
    .pn-method-grid{grid-template-columns:1fr}
    .pn-method-step{min-height:190px}
    .pn-method-head{align-items:start;flex-direction:column}
  }
  @media(max-width:650px){
    .pn-expanded .shell{width:min(100% - 36px,1240px)}
    .pn-intro-section,.pn-faq{padding:75px 0}
    .pn-method{padding:78px 0}
    .pn-closing{padding:72px 0}
    .pn-closing-inner{align-items:start;flex-direction:column}
    .pn-area-row{grid-template-columns:30px minmax(0,1fr) 16px;gap:10px}
    .pn-area-row h3{font-size:23px}
    .pn-method-step{padding:25px}
  }
  @media(prefers-reduced-motion:reduce){
    .pn-area-row{transition:none}
  }  .pn-laundry .hero-carousel{background:#182a28}
  .pn-laundry .hero:not(.personal){min-height:min(760px,85vh);background:#182a28}
  .pn-laundry .hero:not(.personal) .hero-media:after{background:linear-gradient(90deg,#101f20f5 0%,#142825d6 34%,#172b2870 69%,#172b281c 100%)}
  .pn-laundry .hero-content{max-width:690px}
  .pn-laundry .hero h1,.pn-laundry .hero-slide-two h2{font-family: "Poppins", sans-serif;font-weight:500;letter-spacing:-.045em}
  .pn-laundry .hero .eyebrow{color:#c8d4bc}
  .pn-laundry .hero .btn{background:#f0e3c8;color:#223631;border-radius:6px}
  .pn-laundry .hero .btn:hover{background:#fff2d8}
  .pn-laundry .hero-slide-two .hero-media:after{background:linear-gradient(90deg,#101f20f0,#172a27bb 49%,#172a2733)}
  footer .social-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:25px}
  footer .social-links a{display:inline-flex;align-items:center;gap:9px;padding:8px 12px;border:1px solid #ffffff35;border-radius:999px;color:inherit;font-size:12px;text-decoration:none}
  footer .social-links a:hover{border-color:#ffffffa0;background:#ffffff13}
  footer .social-icon{display:inline-grid;place-items:center;width:23px;height:23px;border-radius:50%;border:1px solid currentColor;font-size:16px;line-height:1}
  footer .social-facebook{font-family: "Poppins", sans-serif;font-weight:900}
  @media(max-width:650px){.pn-laundry .hero:not(.personal){min-height:650px}.pn-laundry .hero:not(.personal) .hero-media:after{background:linear-gradient(0deg,#102321f5 0%,#142a26b0 65%,#142a2670 100%)}footer .social-links{gap:8px}}  /* A headline já está impressa nos banners da lavanderia. */
  .pn-laundry .hero .eyebrow,
  .pn-laundry .hero h1,
  .pn-laundry .hero-slide-two h2,
  .pn-laundry .hero .hero-lead,
  .pn-laundry .hero .audience {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0,0,0,0) !important;
    white-space: nowrap !important;
  }
  .pn-laundry .hero:not(.personal) .hero-media:after {
    display: none;
  }
  .pn-laundry .hero .hero-inner {
    display: flex;
    align-items: flex-end;
  }
  .pn-laundry .hero .hero-content {
    max-width: none;
    width: 100%;
  }
  .pn-laundry .hero .actions {
    margin-top: 0;
    margin-bottom: 10px;
  }
  .pn-laundry .hero .btn {
    box-shadow: 0 14px 35px #071b1970;
  }
  @media(max-width:650px) {
    .pn-laundry .hero:not(.personal) {
      min-height: 0;
    }
    .pn-laundry .hero:not(.personal) .hero-media {
      position: relative;
      inset: auto;
      z-index: auto;
      width: 100%;
      aspect-ratio: 16 / 9;
    }
    .pn-laundry .hero:not(.personal) .hero-media img {
      object-fit: contain;
      background: #102b28;
    }
    .pn-laundry .hero:not(.personal) .hero-inner {
      min-height: 0;
      padding-top: 16px;
      padding-bottom: 78px;
    }
    .pn-laundry .hero .actions {
      margin: 0;
    }
  }  footer .social-icon {
    width: 26px;
    height: 26px;
    padding: 4px;
    border: 0;
  }
  footer .social-icon svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  footer .social-links a:hover .social-icon {
    transform: scale(1.1);
  }  /* O primeiro banner já contém a headline na própria imagem. */
  .pn-laundry .hero-carousel > .hero:first-child .actions {
    display: none !important;
  }

  /* Método com contraste suave e leitura mais leve. */
  .pn-method,
  .pn-legal .pn-method,
  .pn-laundry .pn-method {
    background: #f4f2ed !important;
    color: #20342e !important;
  }
  .pn-method::before,
  .pn-method::after,
  .pn-method .shell::before,
  .pn-method .shell::after {
    opacity: .08 !important;
  }
  .pn-method .pn-eyebrow,
  .pn-method-step b {
    color: #7a806e !important;
  }
  .pn-method-head h2,
  .pn-method-step h3 {
    color: #20342e !important;
  }
  .pn-method-head > p,
  .pn-method-step p {
    color: #58665d !important;
  }
  .pn-method-grid {
    gap: 16px;
  }
  .pn-method-step {
    background: #fffdfa !important;
    border: 1px solid #dedfd6 !important;
    border-radius: 15px;
    box-shadow: 0 14px 35px #273d2810;
  }
  .pn-method-step:hover {
    transform: translateY(-4px);
    box-shadow: 0 22px 45px #273d281a;
  }

  /* Rodapé organizado em marca, canais e navegação. */
  footer {
    background: #eeefea !important;
    color: #263b32 !important;
    padding: 74px 0 26px !important;
  }
  footer .footer-grid {
    display: grid !important;
    grid-template-columns: minmax(0,1.3fr) minmax(220px,1fr) minmax(160px,.55fr);
    align-items: start !important;
    gap: 55px !important;
    padding-bottom: 68px !important;
  }
  footer .pn-footer-kicker {
    display: block;
    margin-bottom: 18px;
    color: #657a69;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  footer .pn-footer-brand .brand {
    display: block;
    color: #20382d !important;
    font-size: clamp(23px,2.4vw,34px);
    letter-spacing: -.045em;
  }
  footer .pn-footer-brand p {
    max-width: 37ch;
    color: #66756a !important;
    line-height: 1.7;
  }
  footer .pn-footer-contact > strong,
  footer .footer-grid nav > strong {
    display: block;
    margin-bottom: 21px;
    color: #263b32;
    font-size: 13px;
  }
  footer .pn-footer-contact > p {
    color: #66756a;
    font-size: 13px;
    line-height: 1.6;
  }
  footer .social-links {
    display: grid !important;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 9px !important;
    margin: 0 !important;
  }
  footer .social-links a {
    justify-content: flex-start;
    border: 1px solid #d3dcd2 !important;
    border-radius: 9px !important;
    padding: 10px 12px !important;
    color: #2d493a !important;
    background: #ffffffa8;
    font-size: 12px;
    transition: transform .2s,box-shadow .2s,border-color .2s;
  }
  footer .social-links a:hover {
    transform: translateY(-2px);
    border-color: #9bb5a1 !important;
    box-shadow: 0 8px 20px #263b3215;
  }
  footer .footer-grid nav {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px !important;
    font-size: 13px;
  }
  footer .footer-grid nav > strong {
    margin-bottom: 8px;
  }
  footer .footer-grid nav a {
    color: #596c60;
  }
  footer .footer-grid nav a:hover {
    color: #187450;
  }
  footer .footer-bottom {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    border-top: 1px solid #d5ded3 !important;
    padding-top: 23px;
    color: #77847a !important;
  }
  @media(max-width:900px) {
    footer .footer-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 40px;
    }
  }
  @media(max-width:600px) {
    footer { padding-top: 55px !important; }
    footer .footer-grid {
      grid-template-columns: 1fr;
      gap: 34px;
      padding-bottom: 48px !important;
    }
    footer .social-links {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }
  }
  /* PAGENOVAI_HEADER_TEXT_LOGO_CARDS_START */
  header.pn-site-header .header-inner{
    display:flex!important;
    align-items:center!important;
    gap:24px!important;
  }

  header.pn-site-header .brand,
  footer .brand{
    display:inline-block!important;
    width:auto!important;
    max-width:min(360px,70vw)!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
    border-radius:0!important;
    background:transparent!important;
    box-shadow:none!important;
    color:inherit!important;
    font-size:clamp(15px,1.45vw,22px)!important;
    font-weight:900!important;
    line-height:1.05!important;
    letter-spacing:.045em!important;
    text-transform:uppercase!important;
    text-wrap:balance!important;
  }

  header.pn-site-header .brand::before,
  header.pn-site-header .brand::after,
  footer .brand::before,
  footer .brand::after{
    content:none!important;
    display:none!important;
  }

  header.pn-header-left .header-inner{justify-content:space-between!important}
  header.pn-header-left .pn-menu-toggle{display:none!important}

  header.pn-header-right .header-inner{
    justify-content:space-between!important;
    flex-direction:row-reverse!important;
  }
  header.pn-header-right .pn-menu-toggle{display:none!important}

  header.pn-header-center .header-inner{
    justify-content:center!important;
    position:relative!important;
  }
  header.pn-header-center .brand{text-align:center!important}
  header.pn-header-center .pn-menu-toggle{
    position:absolute!important;
    right:0!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    min-height:40px!important;
    padding:0 14px!important;
    border:1px solid #d8ddd6!important;
    border-radius:999px!important;
    background:#fff!important;
    color:#20251f!important;
    font:800 12px/1 system-ui,sans-serif!important;
    letter-spacing:.08em!important;
    text-transform:uppercase!important;
    cursor:pointer!important;
  }
  header.pn-header-center nav{
    position:absolute!important;
    top:calc(100% + 10px)!important;
    right:0!important;
    z-index:20!important;
    display:none!important;
    min-width:220px!important;
    padding:12px!important;
    border:1px solid #e3e5df!important;
    border-radius:14px!important;
    background:#fff!important;
    box-shadow:0 18px 42px rgba(20,25,22,.16)!important;
  }
  header.pn-header-center.is-menu-open nav{
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    gap:4px!important;
  }
  header.pn-header-center nav a{
    padding:10px 12px!important;
    border-radius:10px!important;
  }
  header.pn-header-center nav a:hover{
    background:#f3f4ef!important;
    color:#20251f!important;
  }

  .features{
    align-items:stretch!important;
  }
  .feature{
    position:relative!important;
    min-height:220px!important;
    padding:30px!important;
    border:1px solid rgba(31,41,55,.12)!important;
    border-radius:20px!important;
    background:linear-gradient(145deg,#ffffff 0%,#f6f4ee 100%)!important;
    box-shadow:0 18px 36px rgba(31,41,55,.10), inset 0 1px 0 rgba(255,255,255,.9)!important;
    transform:perspective(900px) translateZ(0)!important;
    transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease!important;
  }
  .feature:hover{
    transform:perspective(900px) translateY(-5px) rotateX(1deg)!important;
    border-color:rgba(31,41,55,.20)!important;
    box-shadow:0 26px 54px rgba(31,41,55,.16), inset 0 1px 0 rgba(255,255,255,.95)!important;
  }
  .feature > span:first-child,
  .feature .feature-number,
  .feature .number{
    display:inline-grid!important;
    place-items:center!important;
    width:42px!important;
    height:42px!important;
    margin:0 0 22px!important;
    border-radius:12px!important;
    background:#20251f!important;
    color:#fff!important;
    font-weight:900!important;
    line-height:1!important;
    box-shadow:0 10px 20px rgba(31,41,55,.18)!important;
  }
  .feature h3{
    margin:0 0 12px!important;
    line-height:1.15!important;
  }
  .feature p{
    margin:0!important;
    max-width:58ch!important;
    line-height:1.65!important;
  }

  footer{
    background:#f3f1ea!important;
    color:#20251f!important;
    padding:54px 0 24px!important;
  }
  footer .footer-grid{
    display:grid!important;
    grid-template-columns:minmax(240px,1.25fr) minmax(220px,.9fr) minmax(220px,.85fr)!important;
    align-items:start!important;
    gap:34px!important;
    padding-bottom:34px!important;
  }
  footer .pn-footer-kicker{
    display:block!important;
    margin-bottom:12px!important;
    color:#6d746c!important;
    font-size:12px!important;
    font-weight:800!important;
    letter-spacing:.14em!important;
    text-transform:uppercase!important;
  }
  footer .pn-footer-brand p,
  footer .pn-footer-contact p{
    margin-top:14px!important;
    max-width:52ch!important;
    color:#646b63!important;
    line-height:1.65!important;
  }
  footer .pn-footer-contact > strong,
  footer .footer-grid nav > strong{
    display:block!important;
    margin-bottom:14px!important;
    color:#20251f!important;
    font-size:13px!important;
    font-weight:900!important;
    letter-spacing:.08em!important;
    text-transform:uppercase!important;
  }
  footer .footer-grid nav{
    display:flex!important;
    flex-direction:column!important;
    align-items:flex-start!important;
    gap:8px!important;
  }
  footer a{
    color:#40483f!important;
  }
  footer a:hover{
    color:#111!important;
  }
  footer .footer-bottom{
    display:flex!important;
    justify-content:space-between!important;
    gap:16px!important;
    flex-wrap:wrap!important;
    border-top:1px solid #d8d5cc!important;
    padding-top:20px!important;
    color:#6d746c!important;
  }

  @media(max-width:650px){
    header.pn-site-header .header-inner{
      min-height:64px!important;
      padding:14px 0!important;
      flex-direction:row!important;
    }
    header.pn-header-center .pn-menu-toggle{
      position:static!important;
      margin-left:auto!important;
    }
    header.pn-header-center nav{
      right:0!important;
      left:auto!important;
    }
    footer .footer-grid{
      grid-template-columns:1fr!important;
      gap:28px!important;
    }
    .feature{
      min-height:auto!important;
      padding:24px!important;
      border-radius:18px!important;
    }
  }
  /* PAGENOVAI_HEADER_TEXT_LOGO_CARDS_END */

/* PAGENOVA_VISUAL_DIRECTION_V1 */

/* IMAGE FOCUS */
.pn-focus-left .hero-media img{
  object-position:left center!important;
}
.pn-focus-center .hero-media img{
  object-position:center center!important;
}
.pn-focus-right .hero-media img{
  object-position:right center!important;
}

/* CONTENT WIDTH */
.pn-width-narrow .hero:not(.personal) .hero-content{
  max-width:520px!important;
}
.pn-width-medium .hero:not(.personal) .hero-content{
  max-width:680px!important;
}
.pn-width-wide .hero:not(.personal) .hero-content{
  max-width:850px!important;
}

/* ALIGNMENT */
.pn-align-center .hero:not(.personal) .hero-content{
  text-align:center;
  margin-left:auto;
  margin-right:auto;
}
.pn-align-center .hero:not(.personal) .hero-lead{
  margin-left:auto;
  margin-right:auto;
}
.pn-align-center .hero:not(.personal) .hero-actions{
  justify-content:center;
}

/* OVERLAY */
.pn-hero-overlay .hero:not(.personal) .hero-media{
  position:absolute!important;
  inset:0!important;
}
.pn-hero-overlay .hero:not(.personal) .hero-content{
  position:relative;
  z-index:2;
}

/* SPLIT RIGHT:
   content left / image right */
.pn-hero-split-right .hero:not(.personal){
  background:var(--surface)!important;
  color:var(--ink)!important;
}
.pn-hero-split-right .hero:not(.personal) .hero-media{
  position:absolute!important;
  inset:0 0 0 52%!important;
}
.pn-hero-split-right .hero:not(.personal) .hero-media:after{
  background:linear-gradient(
    90deg,
    var(--surface) 0%,
    var(--surface) 4%,
    transparent 42%
  )!important;
}
.pn-hero-split-right .hero:not(.personal) .hero-content{
  width:46%;
  margin-left:0;
  margin-right:auto;
}
.pn-hero-split-right .hero:not(.personal) .hero-lead{
  color:var(--muted)!important;
}
.pn-hero-split-right .hero:not(.personal) .eyebrow{
  color:var(--accent)!important;
}

/* SPLIT LEFT:
   image left / content right */
.pn-hero-split-left .hero:not(.personal){
  background:var(--surface)!important;
  color:var(--ink)!important;
}
.pn-hero-split-left .hero:not(.personal) .hero-media{
  position:absolute!important;
  inset:0 52% 0 0!important;
}
.pn-hero-split-left .hero:not(.personal) .hero-media:after{
  background:linear-gradient(
    270deg,
    var(--surface) 0%,
    var(--surface) 4%,
    transparent 42%
  )!important;
}
.pn-hero-split-left .hero:not(.personal) .hero-content{
  width:46%;
  margin-left:auto;
  margin-right:0;
}
.pn-hero-split-left .hero:not(.personal) .hero-lead{
  color:var(--muted)!important;
}
.pn-hero-split-left .hero:not(.personal) .eyebrow{
  color:var(--accent)!important;
}

/* CENTERED */
.pn-hero-centered .hero:not(.personal) .hero-media{
  position:absolute!important;
  inset:0!important;
}
.pn-hero-centered .hero:not(.personal) .hero-content{
  max-width:850px!important;
  margin-left:auto!important;
  margin-right:auto!important;
  text-align:center!important;
}
.pn-hero-centered .hero:not(.personal) .hero-lead{
  margin-left:auto!important;
  margin-right:auto!important;
}
.pn-hero-centered .hero:not(.personal) .hero-actions{
  justify-content:center!important;
}

/* DENSITY */
.pn-density-compact .hero:not(.personal) .hero-inner{
  min-height:540px!important;
  padding-top:65px!important;
  padding-bottom:75px!important;
}

.pn-density-balanced .hero:not(.personal) .hero-inner{
  min-height:640px!important;
}

.pn-density-spacious .hero:not(.personal) .hero-inner{
  min-height:760px!important;
  padding-top:110px!important;
  padding-bottom:140px!important;
}

/* CARD STYLE */
.pn-cards-flat .feature,
.pn-cards-flat .features-four .feature{
  box-shadow:none!important;
  border-color:transparent!important;
}

.pn-cards-bordered .feature,
.pn-cards-bordered .features-four .feature{
  box-shadow:none!important;
  border:1px solid var(--line)!important;
}

.pn-cards-elevated .feature,
.pn-cards-elevated .features-four .feature{
  box-shadow:0 18px 48px #102c2218!important;
}

/* MOBILE */
@media(max-width:650px){
  .pn-hero-split-left .hero:not(.personal) .hero-media,
  .pn-hero-split-right .hero:not(.personal) .hero-media{
    inset:0!important;
  }

  .pn-hero-split-left .hero:not(.personal) .hero-media:after,
  .pn-hero-split-right .hero:not(.personal) .hero-media:after{
    background:linear-gradient(
      0deg,
      #183c34ed,
      #1d453dbb
    )!important;
  }

  .pn-hero-split-left .hero:not(.personal),
  .pn-hero-split-right .hero:not(.personal){
    color:#fff!important;
  }

  .pn-hero-split-left .hero:not(.personal) .hero-content,
  .pn-hero-split-right .hero:not(.personal) .hero-content{
    width:100%!important;
    max-width:100%!important;
    margin-left:0!important;
    margin-right:0!important;
  }

  .pn-hero-split-left .hero:not(.personal) .hero-lead,
  .pn-hero-split-right .hero:not(.personal) .hero-lead{
    color:#f3fbf4!important;
  }

  .pn-density-spacious .hero:not(.personal) .hero-inner{
    min-height:650px!important;
    padding-top:90px!important;
    padding-bottom:110px!important;
  }
}

/* U5.5D split refinement */
.hero.pn-hero-split-left,
.hero.pn-hero-split-right {
  position: relative;
  min-height: 640px;
  overflow: hidden;
}

.hero.pn-hero-split-left .hero-inner,
.hero.pn-hero-split-right .hero-inner {
  position: relative;
  z-index: 2;
  min-height: 640px;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
}

.hero.pn-hero-split-left .hero-media,
.hero.pn-hero-split-right .hero-media {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
  min-height: 640px;
  overflow: hidden;
  opacity: 1;
  border-radius: 0;
}

.hero.pn-hero-split-left .hero-media img,
.hero.pn-hero-split-right .hero-media img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 640px;
  object-fit: cover;
}

.hero.pn-hero-split-left .hero-content,
.hero.pn-hero-split-right .hero-content,
.hero.pn-hero-split-left .hero-copy,
.hero.pn-hero-split-right .hero-copy {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: none;
}

.hero.pn-hero-split-left .hero-content,
.hero.pn-hero-split-right .hero-content {
  min-height: 640px;
  padding: clamp(64px, 7vw, 112px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero.pn-hero-split-left .hero-inner {
  grid-template-areas: "media content";
}

.hero.pn-hero-split-left .hero-media {
  grid-area: media;
}

.hero.pn-hero-split-left .hero-content {
  grid-area: content;
}

.hero.pn-hero-split-right .hero-inner {
  grid-template-areas: "content media";
}

.hero.pn-hero-split-right .hero-media {
  grid-area: media;
}

.hero.pn-hero-split-right .hero-content {
  grid-area: content;
}

.hero.pn-hero-split-left::before,
.hero.pn-hero-split-right::before,
.hero.pn-hero-split-left::after,
.hero.pn-hero-split-right::after {
  pointer-events: none;
}

.hero.pn-focus-left .hero-media img {
  object-position: left center;
}

.hero.pn-focus-center .hero-media img {
  object-position: center center;
}

.hero.pn-focus-right .hero-media img {
  object-position: right center;
}

.hero.pn-density-compact .hero-content {
  padding-top: 48px;
  padding-bottom: 48px;
}

.hero.pn-density-balanced .hero-content {
  padding-top: 72px;
  padding-bottom: 72px;
}

.hero.pn-density-spacious .hero-content {
  padding-top: 112px;
  padding-bottom: 112px;
}

.hero.pn-width-narrow .hero-copy {
  max-width: 460px;
}

.hero.pn-width-medium .hero-copy {
  max-width: 600px;
}

.hero.pn-width-wide .hero-copy {
  max-width: 760px;
}

@media (max-width: 820px) {
  .hero.pn-hero-split-left .hero-inner,
  .hero.pn-hero-split-right .hero-inner {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .hero.pn-hero-split-left .hero-media,
  .hero.pn-hero-split-right .hero-media {
    order: 1;
    min-height: 360px;
    height: 46vh;
    max-height: 520px;
  }

  .hero.pn-hero-split-left .hero-media img,
  .hero.pn-hero-split-right .hero-media img {
    min-height: 360px;
  }

  .hero.pn-hero-split-left .hero-content,
  .hero.pn-hero-split-right .hero-content {
    order: 2;
    min-height: 0;
    padding: 48px 28px 56px;
  }
}
</style></head><body class="theme-${theme} ${legal ? "pn-legal" : ""} ${visualClasses} ${laundry ? "pn-laundry" : ""}"><div class="topline"></div><header class="pn-site-header pn-header-left"><div class="shell header-inner"><strong class="brand">${name}</strong><button class="pn-menu-toggle" type="button" aria-controls="pn-header-menu" aria-expanded="false">Menu</button><nav id="pn-header-menu" aria-label="Navegação principal">${links}</nav></div></header>
  <main><div class="hero-carousel" id="hero-carousel"><section class="hero ${personal ? "personal" : ""}" data-hero-slide><div class="hero-media">${heroImage}</div><div class="shell hero-inner"><div class="hero-content"><span class="eyebrow">${laundry ? "Lavanderia · cuidado com suas roupas" : esc(page.eyebrow || name)}</span><h1>${laundry ? "Suas roupas bem cuidadas, do início ao fim." : esc(page.heading)}</h1><p class="hero-lead">${laundry ? esc(info?.offer || page.introduction) : esc(page.introduction)}</p>${audience}<div class="actions">${cta}${secondary}</div></div></div></section>${pageKey === "home" ? `<section class="hero hero-slide-two" data-hero-slide hidden><div class="hero-media">${workImage}</div><div class="shell hero-inner"><div class="hero-content"><span class="eyebrow">${laundry ? "O cuidado acontece em cada etapa" : sensitive ? "Atendimento" : "Como trabalhamos"}</span><h2>${laundry ? "Lavagem, passadoria e acabamento com atenção aos detalhes." : esc(secondTitle)}</h2><p class="hero-lead">${laundry ? esc(info?.process || "Conte quais peças precisam de cuidado e converse com a equipe sobre os serviços disponíveis.") : esc(secondLead)}</p><div class="actions"><a class="btn" href="#entre-em-contato">${sensitive ? "Tirar dúvidas" : "Vamos conversar"} <span aria-hidden="true">↗</span></a></div></div><div class="second-orbit" aria-hidden="true"></div></div></section><div class="hero-controls" aria-label="Slides do banner"><button type="button" data-hero-prev aria-label="Slide anterior">←</button><button type="button" class="hero-dot" data-hero-index="0" aria-label="Mostrar slide 1" aria-current="true"></button><button type="button" class="hero-dot" data-hero-index="1" aria-label="Mostrar slide 2" aria-current="false"></button><button type="button" data-hero-next aria-label="Próximo slide">→</button><span class="hero-slide-status" aria-live="polite">1 / 2</span></div>` : ""}</div>
  <section class="shell section services-section"><div class="section-head"><div><span class="kicker">${pageKey === "home" ? "O que oferecemos" : esc(page.eyebrow || "Nossa atuação")}</span><h2>${pageKey === "home" ? "Soluções para o que você precisa" : sectionTitle}</h2></div><p>${pageKey === "home" ? esc(info?.offer || "") : esc(page.introduction)}</p></div><div class="features ${page.sections.length === 4 ? "features-four" : ""}">${cards}</div></section>
  <section class="editorial"><div class="editorial-grid"><div class="editorial-image">${businessImage}</div><div class="editorial-copy"><span class="kicker">Sobre ${name}</span><h2>${esc(storyTitle)}</h2>${storyText ? `<p>${esc(storyText)}</p>` : ""}${proof}${project.pages.sobre && pageKey !== "sobre" ? '<a class="text-link" href="#sobre" data-page="sobre">Saiba mais sobre nós <span aria-hidden="true">↗</span></a>' : ""}</div></div></section>
  ${pageKey === "home" ? `<section class="pn-expanded pn-intro-section"><div class="shell pn-intro-grid"><div class="pn-intro-copy"><span class="pn-eyebrow">${legal ? "Áreas de atuação" : "O que fazemos"}</span><h2>${legal ? "Atuação para cada situação." : "O serviço certo, explicado com clareza."}</h2><p>${esc(aboutText)}</p><span class="pn-small-line" aria-hidden="true"></span></div><div class="pn-area-list">${detailItems}</div></div></section>
  <section class="pn-expanded pn-method"><div class="shell"><div class="pn-method-head"><div><span class="pn-eyebrow">${legal ? "Nosso método" : "Como funciona"}</span><h2>Do primeiro contato ao próximo passo.</h2></div><p>${esc(processText || "Uma conversa inicial ajuda a entender sua necessidade e definir o melhor caminho para continuar.")}</p></div><div class="pn-method-grid"><article class="pn-method-step"><b>01 / CONTATO</b><h3>Conte sua necessidade</h3><p>Envie uma mensagem com o contexto e o que você procura.</p></article><article class="pn-method-step"><b>02 / ANÁLISE</b><h3>Converse com a equipe</h3><p>Receba orientações sobre a atuação e esclareça suas dúvidas iniciais.</p></article><article class="pn-method-step"><b>03 / PRÓXIMO PASSO</b><h3>Decida como seguir</h3><p>As condições e a possibilidade de atendimento são confirmadas diretamente com a equipe.</p></article></div></div></section>
  <section class="pn-expanded pn-faq"><div class="shell pn-faq-grid"><div><span class="pn-eyebrow">Perguntas frequentes</span><h2>Respostas antes de começar.</h2><p class="pn-faq-lead">Informações para você entender a proposta e iniciar uma conversa com mais clareza.</p></div><div class="pn-faq-list">${faq}</div></div></section>
  ` : ""}  ${pageKey === "home" ? (sensitive ? `<section class="trust-section"><div class="shell"><span class="kicker">Antes de começar</span><h2>Um primeiro passo com clareza.</h2><div class="trust-grid"><article><span>01</span><h3>Conheça a proposta</h3><p>Veja as informações sobre a atuação e os serviços apresentados.</p></article><article><span>02</span><h3>Esclareça suas dúvidas</h3><p>Use o contato para perguntar sobre o atendimento e os próximos passos.</p></article><article><span>03</span><h3>Converse diretamente</h3><p>Decida com tranquilidade se esta proposta faz sentido para você.</p></article></div></div></section>` : "") + renderExampleTestimonials() : ""}
  <section class="contact-section" id="entre-em-contato"><div class="shell contact-grid"><div class="contact-copy"><span class="kicker">Contato</span><h2>Vamos conversar?</h2><p>${esc(project.pages.contato?.introduction || "Conte um pouco sobre o que você procura. Vamos conversar sobre o próximo passo.")}</p><div class="contact-email">${contactEmail ? `<a href="mailto:${esc(contactEmail)}">✉ &nbsp; ${esc(contactEmail)}</a>` : "Informe o e-mail de contato no projeto para habilitar o formulário."}</div></div><form class="contact-form" id="institutional-contact"><h3>Envie sua mensagem</h3><div class="contact-fields"><label>Nome<input name="nome" autocomplete="name" required maxlength="100" placeholder="Seu nome"></label><label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="150" placeholder="voce@email.com"></label><label class="full">Mensagem<textarea name="mensagem" required maxlength="2000" placeholder="Como podemos ajudar?"></textarea></label></div><button type="submit">Abrir e-mail para enviar ↗</button><p class="contact-status" id="institutional-contact-status">${contactEmail ? "Seu aplicativo de e-mail abrirá. Revise a mensagem e confirme o envio." : "Configure um e-mail de contato no projeto para receber mensagens."}</p></form></div></section></main>
  <footer><div class="shell"><div class="footer-grid"><div class="pn-footer-brand"><span class="pn-footer-kicker">Fale com a gente</span><strong class="brand">${name}</strong><p>${esc(info?.role || "Conheça nossos serviços e converse com a equipe.")}</p></div><div class="pn-footer-contact"><strong>Canais de atendimento</strong>${socialLinks ? `<div class="social-links">${socialLinks}</div>` : `<p>Os canais de contato aparecerão aqui quando forem cadastrados.</p>`}</div><nav aria-label="Navegação do rodapé"><strong>Explore</strong>${links}</nav></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${name}</span><span>Feito para apresentar o que você faz com clareza.</span></div></div></footer>
  <script>const heroCarousel=document.getElementById("hero-carousel");if(heroCarousel){const slides=Array.from(heroCarousel.querySelectorAll("[data-hero-slide]"));const dots=Array.from(heroCarousel.querySelectorAll("[data-hero-index]"));let active=0;let timer;const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");function showSlide(index){active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==active});dots.forEach((dot,i)=>dot.setAttribute("aria-current",String(i===active)));const status=heroCarousel.querySelector(".hero-slide-status");if(status)status.textContent=(active+1)+" / "+slides.length}function stop(){if(timer)clearInterval(timer);timer=undefined}function start(){stop();if(slides.length>1&&!reduced.matches&&!document.hidden)timer=setInterval(()=>showSlide(active+1),7000)}heroCarousel.querySelector("[data-hero-prev]")?.addEventListener("click",()=>{showSlide(active-1);start()});heroCarousel.querySelector("[data-hero-next]")?.addEventListener("click",()=>{showSlide(active+1);start()});dots.forEach((dot,i)=>dot.addEventListener("click",()=>{showSlide(i);start()}));heroCarousel.addEventListener("mouseenter",stop);heroCarousel.addEventListener("mouseleave",start);heroCarousel.addEventListener("focusin",stop);heroCarousel.addEventListener("focusout",event=>{if(!heroCarousel.contains(event.relatedTarget))start()});document.addEventListener("visibilitychange",start);reduced.addEventListener?.("change",start);start()}const pnHeader=document.querySelector(".pn-site-header");const pnMenuToggle=document.querySelector(".pn-menu-toggle");const pnMenu=document.getElementById("pn-header-menu");if(pnHeader&&pnMenuToggle&&pnMenu){pnMenuToggle.addEventListener("click",function(){const open=pnHeader.classList.toggle("is-menu-open");pnMenuToggle.setAttribute("aria-expanded",String(open))});document.addEventListener("click",function(event){if(!pnHeader.contains(event.target)){pnHeader.classList.remove("is-menu-open");pnMenuToggle.setAttribute("aria-expanded","false")}})}const contactRecipient=${contactEmailJson};const contactSubject=${contactSubjectJson};document.getElementById("institutional-contact").addEventListener("submit",function(event){event.preventDefault();const status=document.getElementById("institutional-contact-status");if(!contactRecipient){status.textContent="Informe um e-mail de contato no projeto antes de receber mensagens.";return}const fields=new FormData(this);const message=["Nome: "+fields.get("nome"),"E-mail: "+fields.get("email"),"",String(fields.get("mensagem")||"")].join("\\n");window.location.href="mailto:"+contactRecipient+"?subject="+encodeURIComponent(contactSubject)+"&body="+encodeURIComponent(message);status.textContent="Revise e confirme o envio no seu aplicativo de e-mail."});document.addEventListener("click",function(event){const toggle=event.target.closest(".example-toggle");if(toggle){const section=toggle.closest(".examples");const paused=section.classList.toggle("is-paused");toggle.setAttribute("aria-pressed",String(paused));toggle.textContent=paused?"Retomar animação":"Pausar animação";return}const link=event.target.closest("[data-page]");if(link){event.preventDefault();parent.postMessage({type:"pagenova-site-preview-page",key:link.dataset.page},"*")}})</script></body></html>`;
}
