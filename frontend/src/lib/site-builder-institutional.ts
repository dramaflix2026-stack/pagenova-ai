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
  const heroImage = photo(info?.portrait, `imagem principal de ${project.name}`, "hero-art");
  const businessImage = photo(info?.businessPhoto, `ambiente de ${project.name}`, "business-art");
  const workImage = photo(info?.workPhoto || info?.businessPhoto, `trabalho de ${project.name}`, "work-art");
  const personal = /portf[oó]lio|designer|consultor|profissional aut[oô]nom|fot[oó]graf|advogad|terapeut|arquiteto|desenvolvedor/i.test(project.brief);

  const cards = page.sections.slice(0, 6).map(({ title, body }, index) => `<article class="feature" id="feature-${index + 1}">
    <span class="number">${String(index + 1).padStart(2, "0")}</span><h3>${esc(title)}</h3><p>${esc(body)}</p>
    </article>`).join("");
  const sectionTitle = pageKey === "sobre" ? "O que nos move" : pageKey === "servicos" ? "O que entregamos" : "Uma atuação feita para você";
  const storyTitle = info?.role || (pageKey === "sobre" ? "Conheça nossa história e nosso jeito de trabalhar." : "Um atendimento com atenção a cada detalhe.");
  const storyText = info?.process || info?.offer || page.introduction;
  const proof = info?.proof ? `<p class="fact">${esc(info.proof)}</p>` : "";
  const audience = info?.audience ? `<p class="audience">Para ${esc(info.audience)}</p>` : "";
  const contactEmail = project.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.contactEmail) ? project.contactEmail : "";
  const contactEmailJson = JSON.stringify(contactEmail).replace(/</g, "\\u003c");
  const contactSubjectJson = JSON.stringify(`Contato pelo site — ${project.name}`).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${name} — ${esc(page.heading)}</title><style>
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f8f4;color:#17362f;font-family:Arial,Helvetica,sans-serif}a{color:inherit;text-decoration:none}button{font:inherit}
  .shell{width:min(1240px,100% - 56px);margin:auto}.topline{height:5px;background:#62bd76}header{background:#fff;border-bottom:1px solid #e7eae5}.header-inner{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:28px}.brand{font-size:clamp(20px,2vw,27px);font-weight:800;letter-spacing:-.065em;max-width:260px;overflow-wrap:anywhere}nav{display:flex;gap:32px;align-items:center;font-size:13px;font-weight:700}nav a{padding:12px 0}nav a:hover,nav a[aria-current]{color:#247a57}nav a[aria-current]{box-shadow:inset 0 -2px #64bf78}
  .hero{position:relative;min-height:min(700px,80vh);display:flex;align-items:center;color:white;background:#133b31;isolation:isolate;overflow:hidden}.hero-media{position:absolute;inset:0;z-index:-2}.hero-media img{width:100%;height:100%;object-fit:cover;display:block}.hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0b302bfa 0%,#123c35e8 35%,#123c3570 69%,#123c3530 100%)}.hero-inner{padding-top:108px;padding-bottom:116px}.hero-content{max-width:740px}.eyebrow{display:block;text-transform:uppercase;letter-spacing:.19em;font-size:11px;font-weight:800;color:#8bd99b}.eyebrow:before{content:"";display:inline-block;width:28px;height:2px;background:currentColor;vertical-align:middle;margin-right:12px}h1,h2,h3{margin:0;letter-spacing:-.045em}h1{font-size:clamp(46px,6.2vw,89px);line-height:1.04;margin:26px 0;max-width:900px;font-weight:750}h2{font-size:clamp(34px,4.4vw,57px);line-height:1.11}h3{font-size:clamp(23px,2.2vw,30px);line-height:1.18}.hero-lead{max-width:590px;font-size:clamp(17px,1.5vw,20px);line-height:1.65;color:#e2ede7}.audience{color:#c4dfca;font-size:14px;margin:15px 0}.actions{display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin-top:33px}.btn{display:inline-flex;align-items:center;justify-content:space-between;gap:40px;background:#71c982;color:#103b2c;padding:17px 22px;font-size:13px;font-weight:800;min-height:53px;border-radius:4px}.btn:hover{background:#91dda0}.text-link{font-size:13px;font-weight:800;color:#fff;border-bottom:1px solid #9bc7ad;padding:12px 0}.text-link span{padding-left:18px}
  .image-space{width:100%;height:100%;position:relative;overflow:hidden;background:radial-gradient(circle at 70% 34%,#82b99566 0 12%,transparent 35%),linear-gradient(130deg,#2b6457,#173f35 52%,#102f2a);display:flex;align-items:flex-end;padding:28px;color:#d4ebdc}.image-space:before{content:"";position:absolute;inset:12% 12% -25% 35%;border:1px solid #ffffff28;border-radius:48% 48% 0 0;box-shadow:0 0 0 48px #ffffff06,0 0 0 115px #ffffff04}.image-space>span{position:absolute;top:14%;right:16%;font:clamp(100px,20vw,270px) Georgia,serif;opacity:.12}.image-space small{position:relative;font-size:10px;letter-spacing:.18em;font-weight:700}.hero-art{background:radial-gradient(circle at 77% 44%,#9bc89a70,transparent 28%),linear-gradient(135deg,#235d50,#12372f 60%,#0d2d29)}
  .personal.hero{background:#f4f0eb;color:#1e241f;min-height:670px}.personal .hero-media{inset:72px max(5%,calc((100% - 1240px)/2)) 72px auto;width:36%;z-index:-1;border-radius:16px;overflow:hidden}.personal .hero-media:after{display:none}.personal .hero-inner{padding-top:125px;padding-bottom:125px}.personal .hero-content{max-width:60%;padding-right:36px}.personal .hero-lead{color:#5a645d}.personal .eyebrow{color:#ad4c2f}.personal .btn{background:#ba502e;color:white}.personal .text-link{color:#17362f;border-color:#a6b3a9}.personal h1{font-family:Georgia,serif;font-weight:700;font-size:clamp(48px,6vw,83px)}
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
  @media(max-width:650px){.hero h1,.personal h1{font-size:clamp(36px,9vw,48px)}.features{gap:14px}.feature{padding:25px}}  /* Faixa de atuação, grade adaptativa e rodapé neutro */
  .intro-strip{background:#f8f7f3;border-bottom:1px solid #e6e8e1}
  .intro-grid{grid-template-columns:minmax(230px,.75fr) minmax(0,2fr);gap:34px;padding:36px 0}
  .intro-label span{font-size:10px;font-weight:800;letter-spacing:.18em;color:#438e5f}
  .intro-label h2{font-size:clamp(23px,2.4vw,34px);margin:8px 0 0;letter-spacing:-.035em}
  .intro-highlights{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
  .intro-pill{display:inline-flex;align-items:center;gap:10px;background:white;border:1px solid #d9e4d9;border-radius:100px;padding:11px 14px;color:#344d3c;font-size:12px;font-weight:700;line-height:1.25}
  .intro-pill b{font-size:10px;color:#32885b}
  [data-pn-ready="true"] .intro-strip.pn-reveal .intro-pill{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease}
  [data-pn-ready="true"] .intro-strip.pn-visible .intro-pill{opacity:1;transform:none}
  .intro-pill:nth-child(2){transition-delay:90ms!important}
  .intro-pill:nth-child(3){transition-delay:180ms!important}
  .intro-pill:nth-child(4){transition-delay:270ms!important}
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
  @media(prefers-reduced-motion:reduce){[data-pn-ready="true"] .intro-strip .intro-pill{opacity:1!important;transform:none!important;transition:none!important}}  .intro-grid{display:block;padding:48px 0 52px}
  .intro-label{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:24px}
  .intro-label h2{font-size:clamp(25px,2.8vw,38px)}
  .intro-highlights{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:stretch}
  .intro-pill{min-height:86px;border-radius:10px;padding:18px;justify-content:flex-start;gap:13px;align-items:center;box-shadow:0 7px 25px #1c3c2710;transition:transform .3s,box-shadow .3s}
  .intro-pill span:nth-child(2){flex:1}
  .intro-pill:hover{transform:translateY(-4px);box-shadow:0 15px 34px #1c3c2720}
  .intro-pill span:last-child{color:#32885b;font-size:18px}
  .feature{scroll-margin-top:30px}
  .testimonials{background:#f1f0eb;padding:95px 0}
  .testimonials-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .testimonials h2{margin:18px 0 22px;max-width:12ch}
  .testimonials p{line-height:1.7;color:#58675e;max-width:48ch}
  .testimonial-card{background:#fff;border:1px solid #e2e2dc;padding:37px;border-radius:14px;box-shadow:0 20px 60px #1c3c2712}
  .testimonial-card .quote-mark{font:64px Georgia,serif;color:#3d9668;line-height:.8}
  .testimonial-card p{font-size:20px;line-height:1.5;color:#30453a;margin:19px 0 30px}
  .testimonial-card .text-link{color:#247a57;border-color:#98bd9d}
  .testimonials .kicker{color:#4d9a6c}
  @media(max-width:980px){.intro-highlights{grid-template-columns:repeat(2,minmax(0,1fr))}.testimonials-grid{gap:35px}}
  @media(max-width:650px){.intro-grid{padding:40px 0}.intro-label{display:block}.intro-highlights{grid-template-columns:1fr 1fr}.intro-pill{min-height:100px;align-items:start;flex-direction:column;gap:8px;padding:16px}.intro-pill span:last-child{display:none}.testimonials{padding:68px 0}.testimonials-grid{grid-template-columns:1fr}.testimonial-card{padding:27px}.testimonial-card p{font-size:17px}}
  .intro-strip{background:#f7f8f4;border:0}
  .intro-grid{display:flex;align-items:center;justify-content:space-between;gap:35px;padding:75px 0 12px}
  .intro-label{display:block;margin:0}
  .intro-label span{display:block}
  .intro-label h2{max-width:18ch;font-size:clamp(31px,3.6vw,48px);margin-top:15px}
  .intro-highlights{display:none}
  .intro-summary{max-width:380px;margin:0;color:#647469;line-height:1.7;font-size:16px}
  .contact-section{background:#fafaf7;padding:100px 0;border-top:1px solid #e1e7dd}
  .contact-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start;gap:clamp(40px,7vw,110px)}
  .contact-copy{padding-top:25px}
  .contact-copy h2{margin:18px 0 24px;max-width:12ch}
  .contact-copy p{font-size:18px;line-height:1.7;color:#5c7063;max-width:46ch}
  .contact-email{border-top:1px solid #d9e2d9;margin-top:35px;padding-top:25px;overflow-wrap:anywhere;color:#247a57;font-weight:700}
  .contact-form{background:#fff;border:1px solid #dfe7df;box-shadow:0 18px 50px #173c2615;padding:38px;border-radius:14px}
  .contact-form h3{font-size:28px;margin-bottom:24px}
  .contact-fields{display:grid;grid-template-columns:1fr 1fr;gap:17px}
  .contact-fields label{font-size:13px;font-weight:700;color:#30483a}
  .contact-fields .full{grid-column:1/-1}
  .contact-fields input,.contact-fields textarea{display:block;margin-top:9px;width:100%;border:1px solid #d9e2d8;background:#f8f9f5;border-radius:7px;padding:15px;font:inherit;color:#233a2d;outline:none}
  .contact-fields textarea{min-height:145px;resize:vertical}
  .contact-fields input:focus,.contact-fields textarea:focus{border-color:#39865d;box-shadow:0 0 0 3px #39865d22}
  .contact-form button{width:100%;margin-top:20px;border:0;border-radius:7px;padding:17px;color:white;background:#267b51;font-weight:800;cursor:pointer}
  .contact-form button:hover{background:#195e3c}
  .contact-status{font-size:12px;color:#68786b;line-height:1.5}
  @media(max-width:760px){.intro-grid{padding:55px 0 10px;display:block}.intro-summary{margin-top:15px}.contact-section{padding:68px 0}.contact-grid{grid-template-columns:1fr;gap:35px}.contact-copy{padding:0}.contact-form{padding:27px}}
  @media(max-width:520px){.contact-fields{grid-template-columns:1fr}.contact-fields .full{grid-column:auto}.contact-copy h2{font-size:36px}}
  .services-section{padding-top:85px;padding-bottom:95px}
  .services-section .section-head{margin-bottom:32px}
  .services-section .section-head h2{max-width:720px}
  .services-section .section-head p{max-width:370px}
  .features.features-four{perspective:1200px;gap:18px}
  .features-four .feature{min-height:270px;border:1px solid #d9e6dc;border-top:3px solid #57ac76;border-radius:15px;padding:29px;box-shadow:0 3px 1px #e4ece2,0 16px 27px #193a2515,0 28px 45px #193a250b;transform:translateZ(0);transform-style:preserve-3d;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,border-color .35s ease;will-change:transform}
  .features-four .feature:hover{transform:translateY(-10px) rotateX(3deg) rotateY(-2deg);box-shadow:0 5px 1px #d9e8d8,0 24px 34px #193a2524,0 40px 70px #193a2514;border-color:#9bc8a4}
  .features-four .feature h3{font-size:clamp(19px,1.7vw,23px);margin:20px 0 12px}
  .features-four .feature p{font-size:14px;line-height:1.62}
  .features-four .number{display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:10px;background:#edf6ee;color:#218252;box-shadow:inset 0 1px #fff,0 3px 8px #1d503012}
  .testimonials{padding:66px 0}
  .testimonials-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:45px}
  .testimonials h2{font-size:clamp(28px,3vw,39px);max-width:24ch;margin:10px 0 12px}
  .testimonials p{font-size:14px;line-height:1.6}
  .testimonial-card{padding:25px 30px;box-shadow:0 12px 30px #1c3c270d}
  .testimonial-card .quote-mark{font-size:38px}
  .testimonial-card p{font-size:16px;margin:8px 0 18px}
  @media(max-width:1080px){.features.features-four{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:650px){.services-section{padding-top:65px;padding-bottom:65px}.features.features-four{grid-template-columns:1fr}.features-four .feature{min-height:0}.testimonials{padding:55px 0}.testimonials-grid{grid-template-columns:1fr;gap:20px}}
  @media(prefers-reduced-motion:reduce){.features-four .feature{transition:none;will-change:auto}.features-four .feature:hover{transform:none}}
  .hero:not(.personal) .hero-content{position:relative;z-index:2}
  .hero:not(.personal):before{content:"";position:absolute;right:5%;top:12%;width:clamp(130px,17vw,260px);aspect-ratio:1;border:1px solid #ffffff48;border-radius:28%;transform:rotate(24deg);box-shadow:0 0 0 20px #ffffff0c,0 0 0 50px #ffffff08,15px 25px 55px #041c1855;animation:hero-float 8s ease-in-out infinite;z-index:-1}
  .hero-media img{transform:scale(1.035);animation:hero-image 11s ease-in-out infinite alternate}
  .editorial-image{perspective:900px}
  .editorial-image img{transition:transform .8s ease}
  .editorial:hover .editorial-image img{transform:scale(1.045)}
  .features-four .feature:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,#ffffffa3 0%,transparent 38%);pointer-events:none}
  .features-four .feature>*{position:relative;transform:translateZ(12px)}
  @keyframes hero-float{50%{transform:translateY(-19px) rotate(30deg)}}
  @keyframes hero-image{to{transform:scale(1.09)}}
  .examples{overflow:hidden;padding:75px 0 85px}
  .example-heading{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:30px}
  .example-heading h2{font-size:clamp(28px,3vw,42px);max-width:25ch;margin:9px 0}
  .example-heading p{max-width:590px;font-size:13px}
  .example-toggle{flex:none;border:1px solid #b9cdbd;border-radius:8px;background:#fff;color:#24573a;padding:12px 15px;cursor:pointer;font:700 12px Arial,sans-serif}
  .example-window{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}
  .example-track{display:flex;width:max-content;animation:reviews-scroll 190s linear infinite}
  .example-window:hover .example-track,.example-window:focus-within .example-track,.examples.is-paused .example-track{animation-play-state:paused}
  .example-group{display:flex;gap:17px;padding-right:17px}
  .example-review{width:330px;min-height:235px;flex:none;background:#fff;border:1px solid #d9e2d8;border-radius:16px;padding:22px;display:flex;flex-direction:column;box-shadow:0 12px 28px #243f2612}
  .example-tag{display:inline-block;align-self:flex-start;color:#42785a;background:#edf5ee;border-radius:50px;padding:5px 9px;font-size:10px;font-weight:700;letter-spacing:.03em}
  .example-review p{font-size:15px;line-height:1.55;margin:16px 0 20px;color:#293e31;flex:1}
  .example-person{display:flex;align-items:center;gap:11px;border-top:1px solid #e8ede7;padding-top:14px}
  .example-person img{border-radius:50%;width:42px;height:42px}
  .example-person strong,.example-person small{display:block}
  .example-person strong{font-size:13px}
  .example-person small{font-size:11px;color:#758579;margin-top:3px}
  @keyframes reviews-scroll{to{transform:translateX(-50%)}}
  @media(max-width:650px){.hero:not(.personal):before{width:100px;right:5%;top:6%}.examples{padding:55px 0}.example-heading{align-items:start;flex-direction:column}.example-review{width:280px}.example-track{animation-duration:240s}}
  @media(prefers-reduced-motion:reduce){.hero:not(.personal):before,.hero-media img,.example-track{animation:none}.editorial-image img{transition:none}.editorial:hover .editorial-image img{transform:none}.example-window{overflow-x:auto;mask-image:none}}
  .example-avatar{display:block;flex:none;width:44px;height:44px;border-radius:50%;background-image:url('/pagenova-testimonial-portraits.png');background-size:500% 500%;background-repeat:no-repeat;border:2px solid #fff;box-shadow:0 2px 10px #12291828}
  .second-banner{position:relative;isolation:isolate;min-height:430px;display:flex;align-items:center;overflow:hidden;background:#15352e;color:white}.second-banner-media{position:absolute;inset:0;z-index:-2}.second-banner-media img,.second-banner-media .image-space{width:100%;height:100%;object-fit:cover}.second-banner:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#09251fec 0%,#12392fc9 48%,#173b325e 100%)}.second-banner-inner{position:relative;padding:82px 0}.second-banner-copy{max-width:610px;position:relative;z-index:2}.second-banner h2{font:400 clamp(36px,4vw,60px)/1.1 Georgia,serif;letter-spacing:-.045em;margin:18px 0}.second-banner p{font-size:17px;line-height:1.7;color:#e2ece6;max-width:50ch}.second-banner .btn{display:inline-flex;margin-top:17px}.second-orbit{position:absolute;right:7%;top:50%;width:200px;height:200px;border:1px solid #ffffff8a;border-radius:28%;transform:translateY(-50%) rotate(28deg);box-shadow:0 0 0 19px #ffffff18,0 0 0 48px #ffffff0b,25px 35px 65px #061a1680;animation:second-float 8s ease-in-out infinite;pointer-events:none}.second-orbit:after{content:"";position:absolute;inset:38px;border-radius:50%;background:#ffffff24;box-shadow:inset 12px 12px 25px #ffffff49,15px 18px 25px #00181050;backdrop-filter:blur(6px)}@keyframes second-float{50%{transform:translateY(calc(-50% - 18px)) rotate(36deg)}}@media(max-width:750px){.second-banner{min-height:430px}.second-banner:before{background:linear-gradient(90deg,#09251ff0,#12392fd8)}.second-orbit{right:-65px;top:90px;width:130px;height:130px;opacity:.55}.second-banner-inner{padding:70px 0}.second-banner-copy{max-width:100%}}@media(prefers-reduced-motion:reduce){.second-orbit{animation:none}}
  </style></head><body><div class="topline"></div><header><div class="shell header-inner"><strong class="brand">${name}</strong><nav aria-label="Navegação principal">${links}</nav></div></header>
  <main><section class="hero ${personal ? "personal" : ""}"><div class="hero-media">${heroImage}</div><div class="shell hero-inner"><div class="hero-content"><span class="eyebrow">${esc(page.eyebrow || name)}</span><h1>${esc(page.heading)}</h1><p class="hero-lead">${esc(page.introduction)}</p>${audience}<div class="actions">${cta}${secondary}</div></div></div></section>
  <section class="shell section services-section"><div class="section-head"><div><span class="kicker">${pageKey === "home" ? "Nossa atuação" : esc(page.eyebrow || "Nossa atuação")}</span><h2>${pageKey === "home" ? "Como podemos ajudar" : sectionTitle}</h2></div><p>${pageKey === "home" ? "Um cuidado pensado para cada etapa da sua jornada." : esc(page.introduction)}</p></div><div class="features ${page.sections.length === 4 ? "features-four" : ""}">${cards}</div></section>
  <section class="editorial"><div class="editorial-grid"><div class="editorial-image">${businessImage}</div><div class="editorial-copy"><span class="kicker">Sobre ${name}</span><h2>${esc(storyTitle)}</h2><p>${esc(storyText)}</p>${proof}${project.pages.sobre && pageKey !== "sobre" ? '<a class="text-link" href="#sobre" data-page="sobre">Saiba mais sobre nós <span aria-hidden="true">↗</span></a>' : ""}</div></div></section>
  ${pageKey === "home" ? `<section class="second-banner"><div class="second-banner-media">${workImage}</div><div class="shell second-banner-inner"><div class="second-banner-copy"><span class="eyebrow">O próximo passo</span><h2>${esc(page.sections[2]?.title || "Um espaço para sua próxima conquista.")}</h2><p>${esc(page.sections[2]?.body || "Conte o que você precisa e vamos construir o caminho juntos.")}</p><a class="btn" href="#entre-em-contato">Vamos conversar <span aria-hidden="true">↗</span></a></div><div class="second-orbit" aria-hidden="true"></div></div></section>` : ""}
  ${pageKey === "home" ? renderExampleTestimonials() : ""}
  <section class="contact-section" id="entre-em-contato"><div class="shell contact-grid"><div class="contact-copy"><span class="kicker">Contato</span><h2>Vamos conversar?</h2><p>${esc(project.pages.contato?.introduction || "Conte um pouco sobre o que você procura. Vamos conversar sobre o próximo passo.")}</p><div class="contact-email">${contactEmail ? `<a href="mailto:${esc(contactEmail)}">✉ &nbsp; ${esc(contactEmail)}</a>` : "Informe o e-mail de contato no projeto para habilitar o formulário."}</div></div><form class="contact-form" id="institutional-contact"><h3>Envie sua mensagem</h3><div class="contact-fields"><label>Nome<input name="nome" autocomplete="name" required maxlength="100" placeholder="Seu nome"></label><label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="150" placeholder="voce@email.com"></label><label class="full">Mensagem<textarea name="mensagem" required maxlength="2000" placeholder="Como podemos ajudar?"></textarea></label></div><button type="submit">Preparar mensagem ↗</button><p class="contact-status" id="institutional-contact-status">${contactEmail ? "Seu aplicativo de e-mail será aberto para você confirmar o envio." : "Configure um e-mail de contato no projeto para receber mensagens."}</p></form></div></section></main>
  <footer><div class="shell"><div class="footer-grid"><div><strong class="brand">${name}</strong><p>${esc(page.introduction)}</p></div><nav aria-label="Navegação do rodapé">${links}</nav></div><div class="footer-bottom">${name}</div></div></footer>
  <script>const contactRecipient=${contactEmailJson};const contactSubject=${contactSubjectJson};document.getElementById("institutional-contact").addEventListener("submit",function(event){event.preventDefault();const status=document.getElementById("institutional-contact-status");if(!contactRecipient){status.textContent="Informe um e-mail de contato no projeto antes de receber mensagens.";return}const fields=new FormData(this);const message=["Nome: "+fields.get("nome"),"E-mail: "+fields.get("email"),"",String(fields.get("mensagem")||"")].join("\\n");window.location.href="mailto:"+contactRecipient+"?subject="+encodeURIComponent(contactSubject)+"&body="+encodeURIComponent(message);status.textContent="Confira e confirme o envio no seu aplicativo de e-mail."});document.addEventListener("click",function(event){const toggle=event.target.closest(".example-toggle");if(toggle){const section=toggle.closest(".examples");const paused=section.classList.toggle("is-paused");toggle.setAttribute("aria-pressed",String(paused));toggle.textContent=paused?"Retomar animação":"Pausar animação";return}const link=event.target.closest("[data-page]");if(link){event.preventDefault();parent.postMessage({type:"pagenova-site-preview-page",key:link.dataset.page},"*")}})</script></body></html>`;
}
