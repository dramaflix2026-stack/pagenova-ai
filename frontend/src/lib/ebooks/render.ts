import { ebookThemes, type EbookProject, type EbookPage } from "./schema";

/**
 * PageNova Editorial Engine 2.0
 * Same HTML is used by the preview iframe and Chromium A4 PDF export.
 * No dummy illustration or empty visual placeholder is ever rendered.
 */
const esc=(s:string):string=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const para=(value:string):string=>value.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean)
  .map(s=>"<p>"+esc(s).replace(/\n/g,"<br>")+"</p>").join("");
const validImage=(url:string)=>/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(url)
  ||/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url);
const items=(page:EbookPage)=>page.bullets.filter(Boolean).slice(0,6);
const splitPoint=(text:string):[string,string]=>{
  const i=text.indexOf(":");return i>2&&i<55
    ?[text.slice(0,i).trim(),text.slice(i+1).trim()]
    :[text.trim(),""]};
const photo=(page:EbookPage,cls=""):string=>!validImage(page.imageUrl)?"":'<figure class="photo '+cls+'">'+
  '<img src="'+esc(page.imageUrl)+'" alt="'+esc(page.imagePrompt||page.title)+'">'+
  (page.imageCredit?'<figcaption>'+esc(page.imageCredit)+'</figcaption>':"")+"</figure>";
const top=(page:EbookPage,index:number)=>'<div class="page-top"><span class="eyebrow">'+
  esc(page.eyebrow||"EDIÇÃO ESPECIAL")+'</span><span class="folio">'+String(index+1).padStart(2,"0")+"</span></div>";
const title=(page:EbookPage)=>'<h2>'+esc(page.title)+'</h2><p class="lead">'+esc(page.lead)+'</p>';
const list=(page:EbookPage,cls="point-list")=>items(page).length?
  '<ul class="'+cls+'">'+items(page).map(s=>"<li>"+esc(s)+"</li>").join("")+"</ul>":"";
const makeCards=(page:EbookPage,max=5,cls="fact-cards"):string=>{
  const facts=items(page).slice(0,max);
  if(!facts.length)return '<div class="editorial-note"><span>EM FOCO</span><p>'+esc(page.lead||page.title)+'</p></div>';
  return '<div class="'+cls+'">'+facts.map((s,i)=>{
    const [label,detail]=splitPoint(s);
    return '<div class="fact"><span class="fact-no">'+String(i+1).padStart(2,"0")+
      '</span><div><strong>'+esc(label)+'</strong>'+(detail?'<p>'+esc(detail)+'</p>':"")+"</div></div>";
  }).join("")+"</div>";
};
const footer=(book:EbookProject,page:EbookPage,index:number):string=>
  '<footer class="page-footer"><span>'+esc(book.author||"PageNova AI")+'</span>'+
  '<span class="footer-topic">'+esc(page.eyebrow||book.title)+'</span>'+
  '<strong>'+String(index+1).padStart(2,"0")+" / "+String(book.pages.length).padStart(2,"0")+'</strong></footer>';
function renderPage(book:EbookProject,page:EbookPage,index:number):string{
  const img=photo(page);
  const n=String(index+1).padStart(2,"0");
  const body=para(page.body),head=title(page),intro=top(page,index);

  let section="";
  switch(page.kind){
    case "cover":
      section='<div class="cover-glow"></div><div class="cover-meta"><span class="mark"></span>'+
        '<span>EBOOK · GUIA AUTORAL</span><span class="edition">PAGENOVA EDITORIAL</span></div>'+
        '<div class="cover-title"><span class="cover-kicker">'+esc(page.eyebrow||"CONHECIMENTO NA PRÁTICA")+'</span>'+
        '<h1>'+esc(page.title)+'</h1><p>'+esc(book.subtitle||page.lead)+'</p></div>'+
        (img?'<div class="cover-media">'+img+'</div>':
          '<div class="cover-graphic"><div class="cover-graphic-rule"></div><span>UM GUIA PARA</span>'+
          '<strong>'+esc(book.audience||"APRENDER, PLANEJAR E APLICAR")+'</strong>'+
          '<span class="cover-graphic-caption">'+esc(page.lead||book.subtitle)+'</span></div>')+
        '<div class="cover-bottom"><span>'+esc(book.author)+'</span><span>EDIÇÃO DIGITAL · '+String(book.pages.length)+' PÁGINAS</span></div>';
      break;
    case "back":
      section='<div class="back-pattern"></div><div class="back-copy"><span class="eyebrow">PRÓXIMOS PASSOS · '+n+'</span>'+
        '<h2>'+esc(page.title)+'</h2><div class="big-rule"></div><p class="lead">'+esc(page.lead)+'</p>'+
        '<div class="article">'+body+'</div>'+makeCards(page,3,'back-tasks')+
        '<div class="back-sign">'+esc(book.author)+'</div></div>';
      break;
    case "recipe": {
      const method=page.body.split(/\n+/).map(line=>line.trim()).filter(Boolean)
        .map(line=>line.replace(/^\d+[.)]\s*/, ""));
      section=intro+'<div class="recipe-heading"><span class="recipe-tag">RECEITA TESTÁVEL · INGREDIENTES E PREPARO</span>'+
        '<h2>'+esc(page.title)+'</h2><p class="recipe-meta">'+esc(page.lead)+'</p></div>'+
        (img?'<div class="recipe-photo">'+img+'</div>':"")+
        '<div class="recipe-columns"><section class="recipe-ingredients">'+
        '<h3>Ingredientes</h3><ul>'+page.bullets.filter(Boolean).map(item=>'<li>'+esc(item)+'</li>').join("")+
        '</ul></section><section class="recipe-method"><h3>Modo de preparo</h3><ol>'+
        method.map(step=>'<li>'+esc(step)+'</li>').join("")+'</ol></section></div>'+
        '<div class="recipe-advice">Dica: organize os ingredientes antes de começar. Os tempos são aproximados.</div>';
      break;
    }
    case "chapter":
      section=intro+'<div class="chapter-title">'+head+'</div><div class="chapter-body">'+
        '<div class="article">'+body+'</div>'+
        '<aside class="chapter-note"><span class="small-label">PONTOS ESSENCIAIS</span>'+
        (img?'<div class="chapter-image">'+img+'</div>':makeCards(page,3,'compact-cards'))+'</aside></div>';
      break;
    case "feature":
      section=intro+'<div class="feature-layout '+(!img?"no-photo":"")+'">'+
        '<div class="feature-words">'+head+'<div class="article">'+body+'</div>'+list(page)+'</div>'+
        (img?'<div class="feature-photo">'+img+'</div>':
          '<div class="feature-substitute"><span class="small-label">APLICAÇÃO PRÁTICA</span>'+
          '<div class="feature-substitute-title">'+esc(page.eyebrow||"IDEIAS EM AÇÃO")+'</div>'+
          makeCards(page,4,'compact-cards')+'</div>')+'</div>';
      break;
    case "checklist":
      section=intro+'<div class="check-heading">'+head+'</div>'+
        '<div class="check-layout"><div class="check-items">'+(items(page).length?
        items(page).map((text,i)=>'<div class="check-item"><span class="check-box">✓</span>'+
          '<div><span class="micro-label">VERIFICAÇÃO '+String(i+1).padStart(2,"0")+'</span><strong>'+esc(text)+'</strong></div></div>').join("")
          :makeCards(page,4))+'</div><aside class="check-side"><span class="micro-label">NA PRÁTICA</span>'+
          '<div class="article">'+body+'</div></aside></div>';
      break;
    case "steps":
      section=intro+'<div class="steps-heading">'+head+'</div>'+
        '<div class="steps-content"><div class="step-track">'+(items(page).length?items(page).map((s,i)=>{
          const [label,detail]=splitPoint(s);
          return '<div class="step-item"><span class="step-index">'+(i+1)+'</span><div><strong>'+
            esc(label)+'</strong>'+(detail?'<p>'+esc(detail)+'</p>':"")+'</div></div>';
        }).join(""):makeCards(page,4))+'</div><div class="steps-explainer"><span class="small-label">ORIENTAÇÃO</span>'+
        '<div class="article">'+body+'</div></div></div>';
      break;
    case "comparison":
      section=intro+'<div class="compare-heading">'+head+'</div>'+
        '<div class="compare-body"><span class="small-label">ANÁLISE COMPARATIVA</span>'+
        '<div class="compare-grid">'+(items(page).length?items(page).map((s,i)=>{
          const [label,detail]=splitPoint(s);
          return '<div class="compare-card"><span class="compare-index">'+String(i+1).padStart(2,"0")+'</span>'+
            '<h3>'+esc(label)+'</h3>'+(detail?'<p>'+esc(detail)+'</p>':"")+'</div>';
        }).join(""):makeCards(page,4))+'</div></div>'+
        '<div class="compare-note"><strong>COMO ESCOLHER</strong><div class="article">'+body+'</div></div>';
      break;
    case "timeline":
      section=intro+'<div class="timeline-heading">'+head+'</div>'+
        '<div class="timeline-grid"><div class="timeline-track">'+(items(page).length?items(page).map((s,i)=>{
          const [label,detail]=splitPoint(s);
          return '<div class="timeline-item"><span class="timeline-index">'+String(i+1).padStart(2,"0")+'</span>'+
            '<div><h3>'+esc(label)+'</h3>'+(detail?'<p>'+esc(detail)+'</p>':"")+'</div></div>';
        }).join(""):makeCards(page,4))+'</div><aside class="timeline-explainer"><span class="small-label">EXECUÇÃO</span>'+
        '<div class="article">'+body+'</div></aside></div>';
      break;
    case "caseStudy":
      section=intro+'<div class="case-heading">'+head+'</div>'+
        '<div class="case-grid"><div class="case-main"><span class="small-label">EXEMPLO APLICADO</span>'+
        '<div class="article">'+body+'</div></div><aside class="case-side">'+
        (img?'<div class="case-photo">'+img+'</div>':
          '<div class="case-learning"><span class="small-label">LIÇÕES DO CASO</span>'+makeCards(page,4,'compact-cards')+'</div>')+
        '</aside></div>'+ (img?list(page):"");
      break;
    case "gallery":
      section=intro+'<div class="gallery-heading">'+head+'</div>'+
        (img?'<div class="gallery-photo">'+img+'</div>':"")+
        '<div class="gallery-list"><span class="small-label">REFERÊNCIAS E APLICAÇÕES</span>'+
        (items(page).length?'<div class="gallery-cards">'+items(page).slice(0,4).map((s,i)=>{
          const [label,detail]=splitPoint(s);
          return '<div class="gallery-card"><span class="gallery-index">'+String(i+1).padStart(2,"0")+
            '</span><h3>'+esc(label)+'</h3>'+(detail?'<p>'+esc(detail)+'</p>':"")+'</div>';
        }).join("")+"</div>":makeCards(page,4))+'</div><div class="gallery-comment">'+body+'</div>';
      break;
    case "infographic":
      section=intro+'<div class="infographic-heading">'+head+'</div>'+
        '<div class="infographic-visual"><span class="small-label">MAPA VISUAL</span>'+
        '<div class="info-grid">'+(items(page).length?items(page).map((s,i)=>{
          const [label,detail]=splitPoint(s);
          return '<div class="info-tile"><span class="info-index">'+String(i+1).padStart(2,"0")+
            '</span><strong>'+esc(label)+'</strong>'+(detail?'<p>'+esc(detail)+'</p>':"")+'</div>';
        }).join(""):makeCards(page,4))+'</div></div>'+
        '<div class="info-context"><div class="article">'+body+'</div></div>';
      break;
    case "summary":
      section=intro+'<div class="summary-heading">'+head+'</div>'+
        '<div class="summary-points">'+(items(page).length?items(page).map((s,i)=>{
          const [label,detail]=splitPoint(s);
          return '<div class="summary-card"><span>0'+(i+1)+'</span><strong>'+esc(label)+
            '</strong>'+(detail?'<p>'+esc(detail)+'</p>':"")+'</div>';
        }).join(""):makeCards(page,4))+'</div><div class="summary-article article">'+body+'</div>';
      break;
    case "quote":
    case "insight":
      section=intro+'<div class="insight-layout"><span class="giant-quote">“</span>'+
        '<span class="small-label">'+(page.kind==="insight"?"VISÃO PROFISSIONAL":"IDEIA CENTRAL")+'</span>'+
        '<h2>'+esc(page.title)+'</h2><div class="big-rule"></div><p class="lead">'+esc(page.lead)+'</p></div>'+
        '<div class="insight-bottom"><div class="article">'+body+'</div>'+makeCards(page,3,'compact-cards')+'</div>';
      break;
    default:
      section=intro+'<div class="chapter-title">'+head+'</div><div class="article">'+body+'</div>'+list(page);
  }
  const theme=ebookThemes[book.theme]||ebookThemes.editorial;
  const style='--paper:'+theme.paper+';--ink:'+theme.ink+';--accent:'+theme.accent+';--soft:'+theme.soft+';';
  return '<section class="sheet kind-'+esc(page.kind)+'" style="'+style+'">'+section+
    (page.kind!=="cover"?footer(book,page,index):"")+'</section>';
}

const CSS=[
'@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap");',
'@page{size:A4;margin:0}*,*::before,*::after{box-sizing:border-box}',
'html,body{margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}',
'body{font-family:"DM Sans",Arial,sans-serif;background:#1b2328}',
'.sheet{width:210mm;height:297mm;position:relative;overflow:hidden;display:flex;flex-direction:column;background:var(--paper);color:var(--ink);padding:19mm 21mm 23mm;break-after:page;page-break-after:always}',
'.sheet:last-child{break-after:auto;page-break-after:auto}',
'.sheet h1,.sheet h2,.sheet h3{font-family:"DM Serif Display",Georgia,serif;font-weight:400;letter-spacing:-.027em;margin:0;overflow-wrap:break-word}',
'.sheet h2{font-size:44px;line-height:1.11}.sheet h3{font-size:19px;line-height:1.25}',
'.sheet p{margin:0;overflow-wrap:break-word}',
'.page-top{display:flex;align-items:flex-start;justify-content:space-between;border-top:2px solid var(--accent);padding-top:7mm;min-height:21mm}',
'.eyebrow,.small-label,.micro-label{font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;line-height:1.6}',
'.eyebrow{max-width:76%;}.folio{font:47px/1 "DM Serif Display",Georgia,serif;color:var(--accent);opacity:.45}',
'.lead{font-size:17px;line-height:1.6;margin-top:7mm!important;opacity:.8;max-width:95%}',
'.article{font-size:12.8px;line-height:1.72;overflow-wrap:break-word}',
'.article p+p{margin-top:4mm}.article p:empty{display:none}',
'.point-list{list-style:none;padding:0;margin:7mm 0 0;display:grid;gap:2.5mm;font-size:12px;line-height:1.55}',
'.point-list li{padding:2mm 0 2mm 4mm;border-left:3px solid var(--accent);background:linear-gradient(90deg,var(--soft),transparent)}',
'.page-footer{position:absolute;left:21mm;right:21mm;bottom:13mm;display:flex;justify-content:space-between;gap:7mm;border-top:1px solid currentColor;padding-top:4mm;font-size:9px;opacity:.6}',
'.page-footer strong{white-space:nowrap}.footer-topic{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46%}',
'.photo{margin:0;position:relative;overflow:hidden;background:var(--soft);height:100%}.photo img{width:100%;height:100%;object-fit:cover;display:block}',
'.photo figcaption{position:absolute;right:8px;bottom:6px;color:#fff;background:#0009;padding:3px 6px;font-size:8px;max-width:95%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.big-rule{height:3px;background:var(--accent);width:32mm;margin:8mm 0}',
'.fact-cards,.compact-cards{display:grid;gap:3mm}.fact,.compact-cards .fact{display:flex;gap:4mm;align-items:flex-start;padding:4mm 3.5mm;background:var(--soft);border-left:3px solid var(--accent)}',
'.fact-no{font:18px/1.3 "DM Serif Display",Georgia,serif;color:var(--accent)}.fact strong{font-size:12px;line-height:1.35;display:block}.fact p{font-size:10px;line-height:1.4;opacity:.8;margin-top:1mm}',
'.editorial-note{padding:7mm;background:var(--soft);border-left:4px solid var(--accent)}.editorial-note span{font-size:10px;font-weight:800;letter-spacing:.16em}.editorial-note p{font-size:17px;line-height:1.5;margin-top:4mm}',
'.cover-glow{position:absolute;width:100mm;height:100mm;right:-35mm;top:-30mm;border:22mm solid var(--soft);border-radius:50%;opacity:.5}',
'.cover-meta{position:relative;display:flex;align-items:center;gap:3mm;font-size:11px;font-weight:800;letter-spacing:.14em;padding-top:5mm}',
'.mark{width:11mm;height:11mm;display:inline-block;flex-shrink:0;background:var(--accent);border-radius:50% 50% 3px 50%}',
'.edition{margin-left:auto;opacity:.5;font-size:8px}',
'.cover-title{position:relative;margin-top:24mm}.cover-kicker{display:block;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}',
'.cover-title h1{font-size:64px;line-height:1.04;margin-top:9mm;max-width:96%}.cover-title p{font-size:20px;line-height:1.55;margin-top:10mm;max-width:88%;opacity:.75}',
'.cover-media{height:95mm;margin:13mm -21mm 0}.cover-media .photo{border-radius:0}',
'.cover-graphic{height:95mm;margin:13mm -21mm 0;padding:17mm 21mm;display:flex;flex-direction:column;background:var(--soft);overflow:hidden;position:relative}',
'.cover-graphic:after{content:"";position:absolute;right:-15mm;bottom:-40mm;width:100mm;height:100mm;border:1.5mm solid var(--accent);border-radius:50%;opacity:.4}',
'.cover-graphic-rule{width:18mm;height:2mm;background:var(--accent);margin-bottom:14mm}',
'.cover-graphic>span{font-size:11px;font-weight:700;letter-spacing:.2em}.cover-graphic strong{display:block;max-width:75%;font:35px/1.2 "DM Serif Display",Georgia,serif;margin-top:5mm}',
'.cover-graphic .cover-graphic-caption{margin-top:auto;max-width:74%;font-size:12px;font-weight:400;letter-spacing:0;line-height:1.6;opacity:.72}',
'.cover-bottom{position:absolute;bottom:17mm;left:21mm;right:21mm;display:flex;gap:5mm;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}',
'.chapter-title{margin-top:13mm;max-width:95%}.chapter-body{display:grid;grid-template-columns:1.12fr .88fr;gap:8mm;margin-top:12mm;align-items:start}',
'.chapter-body .article{font-size:13.6px;line-height:1.88}.chapter-note{background:var(--soft);border-top:3px solid var(--accent);padding:5mm}',
'.chapter-note .compact-cards{margin-top:5mm}.chapter-note .fact{background:var(--paper)}.chapter-image{height:105mm;margin-top:4mm}',
'.feature-layout{margin-top:13mm;display:grid;grid-template-columns:1fr .94fr;gap:9mm;flex:1;min-height:0}.feature-words h2{font-size:41px}',
'.feature-words .article{margin-top:11mm;font-size:12.4px;line-height:1.77}.feature-words .point-list{font-size:11.5px}',
'.feature-photo{height:195mm;overflow:hidden}.feature-substitute{background:var(--soft);border-top:3px solid var(--accent);padding:7mm 5mm;align-self:stretch}',
'.feature-substitute-title{font:30px/1.12 "DM Serif Display",Georgia,serif;margin-top:10mm;margin-bottom:12mm}',
'.feature-substitute .fact{padding:4mm 3mm;background:var(--paper)}',
'.check-heading,.steps-heading,.compare-heading,.timeline-heading,.case-heading,.gallery-heading,.infographic-heading,.summary-heading{margin-top:11mm}',
'.check-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:8mm;margin-top:12mm}',
'.check-items{display:grid;gap:3mm}.check-item{display:flex;gap:4mm;align-items:flex-start;border:1px solid var(--soft);padding:5mm 3mm;background:var(--soft)}',
'.check-box{flex:0 0 8mm;height:8mm;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:var(--paper);font-size:16px;font-weight:bold}',
'.check-item strong{display:block;font-size:13px;line-height:1.5;margin-top:1mm}.micro-label{font-size:8px;opacity:.6}',
'.check-side{border-top:2px solid var(--accent);padding-top:5mm}.check-side .article{margin-top:5mm}',
'.steps-content{display:grid;grid-template-columns:1.08fr .92fr;gap:9mm;margin-top:15mm}',
'.step-track{position:relative;display:grid;gap:5mm}.step-track:before{content:"";position:absolute;left:6mm;top:4mm;bottom:5mm;width:1px;background:var(--accent);opacity:.4}',
'.step-item{display:flex;gap:6mm;align-items:flex-start;position:relative}.step-index{flex:0 0 12mm;height:12mm;border-radius:50%;background:var(--accent);color:var(--paper);display:grid;place-items:center;font-size:14px;font-weight:800}',
'.step-item strong{font-size:16px;line-height:1.4}.step-item p{font-size:11px;line-height:1.5;margin-top:2mm;opacity:.8}',
'.steps-explainer{background:var(--soft);padding:6mm;border-top:3px solid var(--accent)}.steps-explainer .article{margin-top:5mm}',
'.compare-body{margin-top:10mm}.compare-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm;margin-top:5mm}',
'.compare-card{min-height:39mm;background:var(--soft);border-top:4px solid var(--accent);padding:6mm;display:flex;flex-direction:column}',
'.compare-index{font:27px/1 Georgia,serif;color:var(--accent);opacity:.75}.compare-card h3{font-size:19px;margin-top:4mm}.compare-card p{font-size:11px;line-height:1.65;margin-top:3mm}',
'.compare-note{margin-top:11mm;display:grid;grid-template-columns:37mm 1fr;gap:6mm;align-items:start;border-top:1px solid var(--accent);padding-top:6mm}',
'.compare-note>strong{font-size:10px;letter-spacing:.13em;color:var(--accent)}',
'.timeline-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:10mm;margin-top:11mm}.timeline-track{position:relative}',
'.timeline-track:before{content:"";position:absolute;left:6mm;top:5mm;bottom:10mm;border-left:2px dashed var(--accent);opacity:.5}',
'.timeline-item{display:flex;gap:6mm;align-items:flex-start;position:relative;margin-bottom:6mm}.timeline-index{flex:0 0 12mm;height:12mm;background:var(--accent);color:var(--paper);border-radius:3mm;display:grid;place-items:center;font-size:10px;font-weight:800}',
'.timeline-item p{margin-top:2mm;font-size:11px;line-height:1.55;opacity:.8}.timeline-item h3{font-size:18px}',
'.timeline-explainer{border-top:3px solid var(--accent);background:var(--soft);padding:6mm}.timeline-explainer .article{margin-top:5mm}',
'.case-grid{display:grid;grid-template-columns:1fr .93fr;gap:8mm;margin-top:14mm}.case-main .article{font-size:13px;line-height:1.85;margin-top:8mm}',
'.case-photo{height:150mm}.case-learning{background:var(--soft);padding:6mm;border-top:3px solid var(--accent)}.case-learning .compact-cards{margin-top:9mm}',
'.kind-caseStudy>.point-list{margin-top:10mm;grid-template-columns:1fr 1fr;gap:3mm}',
'.gallery-photo{height:72mm;margin-top:9mm}.gallery-list{margin-top:11mm}.gallery-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm;margin-top:5mm}',
'.gallery-card{min-height:32mm;padding:5mm;background:var(--soft);border-bottom:2px solid var(--accent)}.gallery-card h3{font-size:18px;margin-top:2mm}',
'.gallery-index{font-size:10px;font-weight:800;color:var(--accent)}.gallery-card p{font-size:10px;line-height:1.5;margin-top:2mm}',
'.gallery-comment{font-size:12px;line-height:1.6;margin-top:7mm}.gallery-comment p+p{margin-top:2mm}',
'.infographic-visual{margin-top:12mm;background:var(--soft);padding:7mm}.info-grid{margin-top:5mm;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3mm}',
'.info-tile{min-height:38mm;padding:5mm 4mm;background:var(--paper);border-left:3px solid var(--accent)}',
'.info-index{display:block;font:21px/1 Georgia,serif;color:var(--accent);margin-bottom:3mm}.info-tile strong{display:block;font-size:14px;line-height:1.4}.info-tile p{font-size:10px;line-height:1.5;margin-top:2mm}',
'.info-context{border-top:2px solid var(--accent);margin-top:8mm;padding-top:6mm}',
'.summary-points{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm;margin-top:12mm}',
'.summary-card{padding:7mm 5mm;background:var(--soft);min-height:42mm}.summary-card>span{display:block;font:33px/1 Georgia,serif;color:var(--accent);margin-bottom:4mm}',
'.summary-card strong{font-size:16px;line-height:1.4}.summary-card p{font-size:10px;line-height:1.4;margin-top:2mm}',
'.summary-article{margin-top:9mm;border-top:2px solid var(--accent);padding-top:5mm}',
'.insight-layout{margin-top:21mm}.giant-quote{font:132px/1 Georgia,serif;color:var(--accent);opacity:.65;display:block;height:34mm}',
'.insight-layout .small-label{color:var(--accent)}.insight-layout h2{font-size:51px;line-height:1.13;margin-top:4mm}',
'.insight-layout .lead{font-size:18px}.insight-bottom{display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:14mm}',
'.insight-bottom .article{font-size:12.6px;line-height:1.8}.insight-bottom .fact{padding:4mm;background:var(--soft)}',
'.recipe-heading{margin-top:10mm;max-width:100%}.recipe-tag{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--accent)}',
'.recipe-heading h2{margin-top:5mm;font-size:42px;line-height:1.12}.recipe-meta{font-size:14px;line-height:1.45;margin-top:5mm!important;opacity:.78}',
'.recipe-columns{display:grid;grid-template-columns:.84fr 1.16fr;gap:9mm;margin-top:14mm;align-items:start;flex:1}',
'.recipe-columns h3{font:25px/1.2 "DM Serif Display",Georgia,serif;border-bottom:2px solid var(--accent);padding-bottom:5mm;margin-bottom:5mm}',
'.recipe-ingredients{background:var(--soft);padding:7mm 6mm;border-radius:4mm}.recipe-ingredients ul{padding-left:5mm;margin:0;display:grid;gap:4mm}',
'.recipe-ingredients li{font-size:13px;line-height:1.5;padding-left:1mm}.recipe-method ol{margin:0;padding-left:7mm;display:grid;gap:6mm}',
'.recipe-method li{padding-left:2mm;font-size:13.5px;line-height:1.65}.recipe-method li::marker{color:var(--accent);font-weight:800}',
'.recipe-advice{font-size:11px;line-height:1.5;opacity:.7;border-top:1px solid var(--accent);padding-top:4mm;margin-bottom:11mm}',
'.recipe-photo{height:62mm;margin:8mm 0 0}.recipe-photo .photo{height:100%}',
'.back-pattern{position:absolute;right:-35mm;top:-35mm;width:115mm;height:115mm;border-radius:50%;border:15mm solid var(--soft);opacity:.5}',
'.back-copy{margin:auto 0;position:relative}.back-copy h2{font-size:59px;line-height:1.1;margin-top:12mm}',
'.back-copy>.article{max-width:120mm;margin-top:8mm;font-size:14px;line-height:1.8}',
'.back-tasks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3mm;margin-top:13mm}.back-tasks .fact{display:block;min-height:34mm;padding:5mm}',
'.back-tasks .fact strong{font-size:11px;margin-top:3mm}.back-sign{font-weight:800;font-size:13px;margin-top:14mm}',
'@media screen{body{padding:20px}.sheet{box-shadow:0 22px 70px #0004;margin:0 auto 18px}}',
'@media print{body{background:none;padding:0}.sheet{margin:0!important;box-shadow:none!important}}',
].join("\n");
export function renderEbookHtml(project:EbookProject,onlyPage?:number):string{
  const selected=typeof onlyPage==="number"
    ?project.pages.map((page,index)=>({page,index})).filter(p=>p.index===onlyPage)
    :project.pages.map((page,index)=>({page,index}));
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+esc(project.title)+'</title><style>'+CSS+'</style>'+
    (typeof onlyPage==="number"
      ?'<style>@media screen{body{padding:0!important}.sheet{box-shadow:none!important;margin:0!important}}</style>':"")+
    '</head><body>'+selected.map(p=>renderPage(project,p.page,p.index)).join("\n")+'</body></html>';
}
