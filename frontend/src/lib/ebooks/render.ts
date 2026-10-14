import { ebookThemes, type EbookProject, type EbookPage } from "./schema";

const escape = (value: string): string => value
  .replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const paragraphs = (value: string) => value.split(/\n{2,}/)
  .filter(Boolean).map(block => '<p>'+escape(block.trim()).replace(/\n/g,"<br>")+'</p>').join("");
const validImage = (url: string) => /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(url)
  || /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url);
const safeImage = (page: EbookPage) => validImage(page.imageUrl)
  ? '<figure class="image-card"><img src="'+escape(page.imageUrl)+'" alt="'+escape(page.imagePrompt||page.title)+'">'+
    (page.imageCredit?'<figcaption>'+escape(page.imageCredit)+'</figcaption>':'')+'</figure>'
  : '<div class="illustration" aria-hidden="true"><span class="circle"></span><span class="line-one"></span><span class="line-two"></span><span class="diamond"></span></div>';
const bullets = (page: EbookPage) => page.bullets.length
  ? '<ul class="points">'+page.bullets.map(item=>'<li>'+escape(item)+'</li>').join("")+'</ul>' : "";
const footer = (project: EbookProject, page: EbookPage, index: number, count: number) =>
  '<footer class="page-footer"><span>'+escape(project.author||"PageNova AI")+'</span>'+
  '<span>'+escape(page.eyebrow||project.title)+'</span><strong>'+String(index+1).padStart(2,"0")+' / '+String(count).padStart(2,"0")+'</strong></footer>';
function renderPage(project: EbookProject, page: EbookPage, index: number):string {
  const count=project.pages.length;
  const visual=safeImage(page);
  const eyebrow=escape(page.eyebrow||"EBOOK");
  const title=escape(page.title);
  const lead=escape(page.lead);
  const body=paragraphs(page.body);
  const number=String(index+1).padStart(2,"0");
  let content="";
  if(page.kind==="cover") {
    content='<div class="cover-heading"><div class="small-label"><span class="mark"></span>EBOOK / EDIÇÃO DIGITAL</div>'+
      '<p class="cover-eyebrow">'+eyebrow+'</p><h1>'+title+'</h1>'+
      '<p class="cover-subtitle">'+escape(project.subtitle||page.lead)+'</p></div>'+
      '<div class="cover-visual">'+visual+'</div>'+
      '<div class="cover-bottom"><span>GUIA PRÁTICO · '+escape(project.audience||"LEITURA ESSENCIAL")+'</span><span>'+escape(project.author)+'</span></div>';
  } else if(page.kind==="back"){
    content='<div class="closing"><span class="small-label">CONCLUSÃO · '+number+'</span>'+
      '<h2>'+title+'</h2><div class="accent-line"></div>'+
      '<p class="closing-lead">'+lead+'</p><div class="closing-copy">'+body+'</div>'+
      bullets(page)+'<p class="closing-sign">'+escape(project.author)+'</p></div>';
  } else if(page.kind==="quote") {
    content='<div class="chapter-top"><span class="small-label">'+eyebrow+'</span><span class="page-big-number">'+number+'</span></div>'+
      '<div class="quote-layout"><span class="giant-quote">“</span><h2>'+title+'</h2>'+
      '<div class="accent-line"></div><p class="quote-lead">'+lead+'</p></div>'+
      '<div class="quote-explainer">'+body+bullets(page)+'</div>';
  } else if(page.kind==="feature") {
    content='<div class="chapter-top"><span class="small-label">'+eyebrow+'</span><span class="page-big-number">'+number+'</span></div>'+
      '<div class="feature-page"><div class="feature-copy"><h2>'+title+'</h2><p class="lead">'+lead+'</p>'+
      '<div class="article">'+body+'</div>'+bullets(page)+'</div><div class="feature-visual">'+visual+'</div></div>';
  } else {
    content='<div class="chapter-top"><span class="small-label">'+eyebrow+'</span><span class="page-big-number">'+number+'</span></div>'+
      '<div class="chapter-main"><h2>'+title+'</h2><p class="lead">'+lead+'</p>'+
      (page.imageUrl?'<div class="chapter-photo">'+visual+'</div>':'')+
      '<div class="article">'+body+'</div>'+bullets(page)+'</div>';
  }
  return '<section class="sheet kind-'+escape(page.kind)+'" style="--paper:'+ebookThemes[project.theme].paper+
    ';--ink:'+ebookThemes[project.theme].ink+';--accent:'+ebookThemes[project.theme].accent+
    ';--soft:'+ebookThemes[project.theme].soft+'">'+content+
    (page.kind!=="cover"?footer(project,page,index,count):"")+'</section>';
}

const STYLES=[
'@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap");',
'@page{size:A4;margin:0}*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}',
'body{font-family:"DM Sans",Arial,sans-serif;background:#171C24;color:#242424}',
'.sheet{position:relative;width:210mm;height:297mm;margin:0 auto;overflow:hidden;background:var(--paper);color:var(--ink);padding:21mm 21mm 19mm;display:flex;flex-direction:column;break-after:page;page-break-after:always}',
'.sheet:last-child{break-after:auto;page-break-after:auto}',
'.sheet h1,.sheet h2,.sheet h3{font-family:"DM Serif Display",Georgia,serif;font-weight:400;letter-spacing:-.028em;margin:0}.sheet p{margin:0}',
'.small-label{display:inline-flex;align-items:center;gap:11px;font-size:10px;font-weight:700;letter-spacing:.17em;text-transform:uppercase;line-height:1.6}',
'.mark{display:block;width:18px;height:18px;background:var(--accent);border-radius:50% 50% 4px 50%}',
'.cover-heading{min-height:44%;padding-top:12mm}.cover-eyebrow{margin-top:26mm!important;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}',
'.cover-heading h1{font-size:61px;line-height:1.03;margin-top:10mm;max-width:100%;overflow-wrap:break-word}',
'.cover-subtitle{font-size:16px;line-height:1.6;max-width:77%;margin-top:9mm!important;opacity:.75}',
'.cover-visual{height:36%;margin:10mm -21mm 0;overflow:hidden}.cover-visual .image-card,.cover-visual .illustration{height:100%;border:0;border-radius:0}',
'.cover-bottom{margin:auto 0 0;padding-top:13mm;display:flex;justify-content:space-between;gap:20px;font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase}',
'.chapter-top{display:flex;justify-content:space-between;align-items:start;border-top:2px solid var(--accent);padding-top:7mm}',
'.page-big-number{font:50px/1 "DM Serif Display",Georgia,serif;color:var(--accent);opacity:.48}',
'.chapter-main{padding-top:20mm}.chapter-main h2,.feature-copy h2{font-size:45px;line-height:1.09;overflow-wrap:break-word}',
'.lead{font-size:18px;line-height:1.55;opacity:.79;margin-top:9mm!important;max-width:95%}',
'.article{font-size:13.1px;line-height:1.85;margin-top:11mm;overflow-wrap:break-word;max-height:98mm;overflow:hidden}',
'.article p+p{margin-top:4mm}.points{list-style:none;padding:0;margin:10mm 0 0;display:grid;gap:3.5mm;font-size:13px;line-height:1.5}',
'.points li{border-left:3px solid var(--accent);padding:2mm 0 2mm 5mm;background:linear-gradient(90deg,var(--soft),transparent)}',
'.image-card{overflow:hidden;margin:0;background:var(--soft);border-radius:4px;position:relative}',
'.image-card img{display:block;width:100%;height:100%;object-fit:cover}.image-card figcaption{position:absolute;right:9px;bottom:6px;font-size:7px;color:white;text-shadow:0 1px 3px #222;background:#1118;padding:2px 5px;border-radius:3px}',
'.illustration{height:100%;background:var(--soft);position:relative;overflow:hidden}',
'.illustration .circle{position:absolute;border:2px solid var(--accent);width:80%;aspect-ratio:1;border-radius:50%;right:-8%;top:-22%;opacity:.65}',
'.illustration .line-one,.illustration .line-two{position:absolute;background:var(--accent);transform:rotate(-32deg);height:1px;width:120%;left:-10%;top:62%;opacity:.5}',
'.illustration .line-two{top:69%}.illustration .diamond{position:absolute;width:34%;aspect-ratio:1;background:var(--accent);opacity:.3;transform:rotate(45deg);left:9%;top:23%}',
'.chapter-photo{height:55mm;margin:10mm 0 0}.chapter-photo .image-card{height:100%}.chapter-photo .illustration{height:100%}.chapter-photo+.article{margin-top:7mm;max-height:60mm}',
'.feature-page{display:grid;grid-template-columns:1.1fr .9fr;gap:10mm;flex:1;align-items:start;padding-top:19mm}',
'.feature-copy .article{max-height:148mm}.feature-copy h2{font-size:39px}.feature-copy .points{font-size:12px}',
'.feature-visual{height:174mm}.feature-visual .image-card,.feature-visual .illustration{height:100%}',
'.quote-layout{padding-top:36mm}.giant-quote{font:140px/1 Georgia,serif;color:var(--accent)}.quote-layout h2{font-size:56px;line-height:1.11}',
'.accent-line{height:3px;width:35mm;background:var(--accent);margin-top:13mm}.quote-lead{font-size:19px;line-height:1.6;margin-top:13mm!important;opacity:.8}',
'.quote-explainer{margin-top:16mm;font-size:14px;line-height:1.85}',
'.closing{margin:auto 0}.closing h2{font-size:62px;line-height:1.08;margin-top:20mm}.closing-lead{font-size:20px;line-height:1.6;margin-top:12mm!important}',
'.closing-copy{font-size:14px;line-height:1.85;margin-top:12mm}.closing-sign{font-size:13px;margin-top:24mm!important;font-weight:700}',
'.page-footer{position:absolute;bottom:14mm;left:21mm;right:21mm;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid currentColor;padding-top:5mm;font-size:9px;opacity:.62}',
'.page-footer strong{font-size:10px;white-space:nowrap}',
'@media screen{body{padding:24px}.sheet{box-shadow:0 25px 70px rgba(0,0,0,.25);margin-bottom:22px}}',
'@media print{body{background:none;padding:0}.sheet{box-shadow:none!important;margin:0!important}}'
].join("\n");

export function renderEbookHtml(project: EbookProject, onlyPage?: number): string {
  const selected = typeof onlyPage==="number"
    ? project.pages.map((page,index)=>({page,index})).filter(item=>item.index===onlyPage)
    : project.pages.map((page,index)=>({page,index}));
  const pages=selected.map(item=>renderPage(project,item.page,item.index)).join("\n");
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="color-scheme" content="light"><title>'+escape(project.title)+'</title><style>'+STYLES+'</style>'+ 
    (typeof onlyPage==='number' ? '<style>@media screen{body{padding:0!important}.sheet{box-shadow:none!important;margin:0!important}}</style>' : '')+'</head>'+
    '<body>'+pages+'</body></html>';
}
