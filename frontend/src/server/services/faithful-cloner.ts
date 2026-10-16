import * as cheerio from "cheerio";

/** Preserve the actual DOM and CSS of a public landing page, without executing
 * source JS, forms, trackers or embedding their iframes. Editable in the
 * PageNova iframe and renderable by the locked-down public /c/[slug] route. */
const trim=(s:string,max=400)=>s.replace(/\s+/g," ").trim().slice(0,max);
export function safeResourceUrl(value:string,base:string):string{
 const raw=value.trim();
 if(!raw||/^(?:javascript|vbscript|file|blob):/i.test(raw))return "";
 if(raw.startsWith("#"))return raw;
 if(/^mailto:[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/i.test(raw))return raw;
 if(/^tel:\+?[0-9().\s-]{4,32}$/i.test(raw))return raw;
 if(/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(raw)&&raw.length<=180000)return raw;
 if(raw.startsWith("data:"))return "";
 try{const u=new URL(raw,base);return u.protocol==="https:"||u.protocol==="http:"?u.href:""}catch{return "";}
}
export function absolutizeCss(css:string,base:string):string{
 // CSS is untrusted input; prohibit remote imports/executable legacy features.
 return css.replace(/@import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/gi,"")
  .replace(/@-moz-document[^{]*\{[^}]*\}/gi,"")
  .replace(/(?:expression\s*\(|-moz-binding\s*:|behavior\s*:)[^;}]+[;}]/gi,"")
  .replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,(_all,a,b,c)=>{
    const u=safeResourceUrl(String(a||b||c||"").trim(),base);
    return u?'url("'+u.replace(/"/g,"%22")+'")':'url("")';
  });
}
export function stylesheetLinks(html:string,base:string):string[]{
 const $=cheerio.load(html);const links:string[]=[];
 $("head link").each((_i,node)=>{
  const e=$(node),rel=(e.attr("rel")||"").toLowerCase(),as=(e.attr("as")||"").toLowerCase();
  const href=e.attr("href")||e.attr("data-href")||"";
  if(!/\bstylesheet\b/.test(rel)&&!(/\bpreload\b/.test(rel)&&as==="style"))return;
  const u=safeResourceUrl(href,base);
  if(u&&u.startsWith("https:")&&!links.includes(u))links.push(u);
 });
 return links.slice(0,24);
}
function decodeCfEmail(value:string):string{
 if(!/^[0-9a-f]{8,512}$/i.test(value)||value.length%2)return "";
 const key=parseInt(value.slice(0,2),16),chars:number[]=[];
 for(let i=2;i<value.length;i+=2)chars.push(parseInt(value.slice(i,i+2),16)^key);
 const email=Buffer.from(chars).toString("utf8");
 return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email)?email:"";
}
function srcsetAbsolute(srcset:string,base:string,mediaProxy?:(url:string)=>string):string{
 // srcset defines desktop/mobile art direction and HD variants. Every URL is
 // rebased and signed individually instead of discarding the entire set.
 // Deliberately exclude data URI srcsets (commas have a different grammar).
 return srcset.split(",").map(entry=>{
  const parts=entry.trim().split(/\s+/).filter(Boolean);
  const candidate=parts.shift()||"";
  const src=safeResourceUrl(candidate,base);
  if(!src||!/^https:\/\//i.test(src))return "";
  const descriptor=parts.length===1&&/^(?:\d+w|(?:\d+(?:\.\d+)?)x)$/.test(parts[0])?parts[0]:"";
  return (mediaProxy?mediaProxy(src):src)+(descriptor?" "+descriptor:"");
 }).filter(Boolean).join(", ");
}
export function createFaithfulVisual(
 html:string,base:string,inlineCss:string[]=[],mediaProxy?:(url:string)=>string,
 desktopImages:{id:string;src:string}[]=[]
){
 const desktopVariants=new Map(desktopImages.map(image=>[image.id,image.src]));
 // SVG and vector assets remain direct HTTPS rather than being routed
 // through the raster-only proxy, where they would always return HTTP 502.
 const proxyImage=(src:string)=>{
  if(!mediaProxy||!/^https:\/\//i.test(src))return src;
  try{if(/\.svg$/i.test(new URL(src).pathname))return src;}catch{return src;}
  return mediaProxy(src);
 };
 const proxyCss=(css:string)=>!mediaProxy?css:css.replace(
   /url\(\s*(["']?)(https:\/\/[^)"']+)\1\s*\)/gi,(_whole,_q,url:string)=>{
    let path="";
    try{path=new URL(url).pathname;}catch{return 'url("'+url+'")';}
    return /\.(?:jpe?g|png|webp|gif|avif)$/i.test(path)?
      'url("'+proxyImage(url)+'")':'url("'+url+'")';
   }
 );
 const $=cheerio.load(html);
 // An HTML document copied from the public web must not carry executable code
 // or client-side network/cookie/analytics behavior into an authenticated app.
 $("script,noscript,iframe,object,embed,portal,template,canvas").remove();
 $("meta[http-equiv],base,link[rel=preconnect],link[rel=dns-prefetch]").remove();
 $("link").remove(); // CSS is inlined; fonts/images can be resolved by absolute URLs.
 $("svg foreignObject,svg script,svg animate,svg animateTransform,svg set,svg use").remove();
 $("style").each((_i,node)=>{$(node).html(proxyCss(absolutizeCss($(node).html()||"",base)));});
 // WordPress/Elementor lazy blocks are often initially invisible until the
 // original JS runs. Static snapshot must not keep those JS-only hidden states.
 // Force reveal animations into their final static state. Imported pages
 // deliberately cannot run source JS, which normally adds the reveal class;
 // otherwise large Elementor sections render as apparently empty whitespace.
 $("[data-aos],[data-sr-id],.elementor-invisible,.wow,.aos-init,.elementor-widget[data-settings*='animation'],[data-animate]").each((_i,node)=>{
  const element=$(node);
  element.removeAttr("data-aos").removeAttr("data-sr-id").removeAttr("data-animate");
  element.removeClass("elementor-invisible wow aos-init");
  const style=element.attr("style")||"";
  if(style){
    element.attr("style",style
      .replace(/(?:^|;)\s*(?:opacity\s*:\s*0(?:\.0+)?|visibility\s*:\s*hidden|transform\s*:\s*(?:translate3d?\([^;]+|matrix(?:3d)?\([^;]+))\s*(?:!important)?\s*(?=;|$)/gi,"")
      .replace(/^;+|;+$/g,""));
  }
 });
 $("*").each((_i,node)=>{
  if(!("attribs" in node))return;
  const el=$(node);
  const attributes={...(node.attribs||{})};
  for(const [k,v] of Object.entries(attributes)){
   if(/^on/i.test(k)||["srcdoc","integrity","nonce","data-cfasync"].includes(k.toLowerCase())){
    el.removeAttr(k);continue;
   }
   if(["src","poster","href","action","xlink:href"].includes(k.toLowerCase())){
    if(k.toLowerCase()==="href"&&v.startsWith("#"))continue;
    const url=safeResourceUrl(v,base);
    if(url)el.attr(k,url);else el.removeAttr(k);
   }else if(["srcset","data-srcset"].includes(k.toLowerCase())){
    const value=srcsetAbsolute(v,base,proxyImage);
    if(value)el.attr(k,value);else el.removeAttr(k);
   }else if(k==="style"){
    el.attr(k,proxyCss(absolutizeCss(v,base)));
   }
  }
 });
 // Decode Cloudflare email-obfuscation markers; removing their JS otherwise
 // leaves literal "[email protected]" instead of the author's public address.
 $(".__cf_email__[data-cfemail]").each((_i,node)=>{
  const el=$(node),email=decodeCfEmail(el.attr("data-cfemail")||"");
  if(email)el.text(email);
  el.removeAttr("data-cfemail").removeClass("__cf_email__");
 });
 $('a[href*="/cdn-cgi/l/email-protection#"]').each((_i,node)=>{
  const el=$(node),href=el.attr("href")||"",hash=href.split("#")[1]||"";
  const email=decodeCfEmail(hash);
  if(email){el.attr("href","mailto:"+email);if(!trim(el.text()))el.text(email);}
  else el.removeAttr("href");
 });
 // Remove active third-party forms, but retain visual wrapper and fields:
 // users can edit the appearance; no visitor data is sent to the source site.
 $("form").each((_i,node)=>{$(node).replaceWith('<div class="pn-cloned-form">'+$(node).html()+'</div>');});
 $("input,textarea,select,button").each((_i,node)=>{
  const el=$(node);el.removeAttr("formaction").removeAttr("formmethod")
   .removeAttr("autofocus").attr("tabindex","-1").attr("aria-disabled","true");
 });
 $("a[href]").each((_i,node)=>{
  const el=$(node),href=el.attr("href")||"";
  if(href.startsWith("https:")||href.startsWith("http:"))el.attr("rel","noopener noreferrer").attr("target","_blank");
 });
 // Recover image URLs from common WP lazy-load plugins and picture sources.
 let recoveredImages=0,detectedImages=0;
 $("img").each((_i,node)=>{
  const el=$(node),attrs=node.attribs||{};
  const possible=[
    attrs["data-src"],attrs["data-original"],attrs["data-lazy-src"],
    attrs["data-echo"],attrs["data-litespeed-src"],attrs["data-flickity-lazyload"],
    attrs["data-rocket-src"],attrs["data-actualsrc"],attrs["data-image"],
    attrs.src,attrs.srcset?.split(",")[0]?.trim().split(/\s+/)[0],
  ];
  const isPlaceholder=(v:string)=>!v||v.startsWith("data:")||
    /(?:blank\.gif|spacer\.gif|placeholder|lazyload)/i.test(v);
  const current=attrs.src||"";
  let recovered=possible.map(v=>safeResourceUrl(v||"",base))
    .find(v=>v&&!isPlaceholder(v));
  if(!recovered&&current&&current.startsWith("data:image/"))recovered=current;
  if(recovered){
   if(recovered!==el.attr("src"))recoveredImages++;
   el.attr("src",proxyImage(recovered));
   detectedImages++;
  }else el.removeAttr("src");
  const srcset=el.attr("data-srcset")||el.attr("srcset")||"";
  if(srcset){
   const safe=srcsetAbsolute(srcset,base,proxyImage);
   if(safe)el.attr("srcset",safe);else el.removeAttr("srcset");
  }
  const index=el.attr("data-pagenova-capture-img")||"";
  const desktopSrc=safeResourceUrl(desktopVariants.get(index)||"",base);
  el.removeAttr("data-pagenova-capture-img");
  // Only synthesize a desktop <source> when JS actually chose a different
  // asset, and native srcset/picture did not already solve art direction.
  if(desktopSrc&&desktopSrc!==recovered&&desktopSrc.startsWith("https:")&&
      !el.attr("srcset")&&!el.parent().is("picture")){
    el.wrap('<picture data-pagenova-responsive-image="1"></picture>');
    el.before('<source media="(min-width: 768px)" srcset="'+
      proxyImage(desktopSrc).replace(/&/g,"&amp;").replace(/"/g,"&quot;")+'">');
  }
  el.removeAttr("loading").removeAttr("decoding");
  el.removeClass("lazyload lazyloaded ls-is-cached");
 });
 $("picture source").each((_i,node)=>{
  const el=$(node),src=el.attr("data-srcset")||el.attr("srcset")||"";
  const safe=srcsetAbsolute(src,base,proxyImage);
  if(safe)el.attr("srcset",safe);else el.removeAttr("srcset");
  el.removeAttr("src").removeAttr("data-srcset");
 });
 // Original videos/third-party embeds are intentionally not imported;
 // sources outside <picture> must not fetch media or execute anything.
 $("source").not("picture source").remove();
 $("[data-bg],[data-background],[data-bg-image],[data-background-image]").each((_i,node)=>{
  const el=$(node),value=el.attr("data-bg")||el.attr("data-background")||
    el.attr("data-bg-image")||el.attr("data-background-image")||"";
  const url=safeResourceUrl(value,base);
  if(url)el.attr("style",(el.attr("style")||"")+";background-image:url('"+proxyImage(url).replace(/'/g,"%27")+"')");
 });
 const css=proxyCss(inlineCss.join("\n")).slice(0,500000);
 if(css)$("head").append('<style data-pagenova-cloned-css="true">'+css.replace(/<\/style/gi,"<\\/style")+"</style>");
 $("head").append('<style data-pagenova-clone-safety="true">'+
  'html{scroll-behavior:auto!important}body{min-height:100vh}'+
  '.elementor-invisible,.wow,.aos-init,[data-aos],[data-sr-id]{opacity:1!important;visibility:visible!important;transform:none!important;animation:none!important}'+
  '.elementor-widget.elementor-invisible,.elementor-element.elementor-invisible{display:revert-layer!important;opacity:1!important;visibility:visible!important}'+
  '.pn-cloned-form input,.pn-cloned-form button,.pn-cloned-form textarea,.pn-cloned-form select{pointer-events:none!important}'+
  '.pn-cloned-form{pointer-events:none!important}'+
  // WordPress/Elementor sections with forced fullscreen height become giant
  // blank gaps on mobile after scripts/embeds are safely removed. Preserve
  // desktop structure and responsive breakpoints while bounding only mobile.
  '@media (max-width:767px){html,body{max-width:100%;overflow-x:clip!important}'+
  'img,video,picture,svg{max-width:100%!important}'+
  '.elementor-section,.elementor-section-height-min-height,.e-con,.e-con-inner{min-height:0!important}'+
  '.elementor-section,.e-con{height:auto!important}'+
  '.elementor-column,.elementor-widget-wrap,.e-con-inner{min-width:0!important}'+
  '.elementor-container,.e-con-inner{max-width:100%!important}'+
  // Applies to non-Elementor sites as well: JS-driven hero/video/gallery
  // scaffolding must not reserve full-screen heights after being sanitized.
  'main section,main article,body>section,body>main>div{min-height:0!important;height:auto!important}'+
  '[class~="min-h-screen"],[class~="h-screen"],[class*="min-h-["],[class*="h-["]{min-height:0!important;height:auto!important}'+
  'main section,main article{max-width:100%!important;opacity:1!important;visibility:visible!important}'+
  ':is(main,section,article) img{height:auto;max-width:100%!important}'+
  // Keep genuinely functional native details; for JS-only accordions show
  // the answer text instead of leaving a large blank accordion container.
  '.faq [hidden],.faq-item [hidden],.accordion [hidden],[class*="faq-"] [hidden],[class*="accordion-"] [hidden]{display:block!important;visibility:visible!important}'+
  'main iframe,main canvas{display:none!important}'+
  '}'+
  '</style>');
 if(!$("head meta[name=viewport]").length)$("head").prepend('<meta name="viewport" content="width=device-width,initial-scale=1">');
 const headHtml=$("head").html()||"",bodyHtml=$("body").html()||"";
 return {visualHeadHtml:headHtml,visualBodyHtml:bodyHtml,
  visualHtml:"<!doctype html>"+$.html(),
  detectedImages,recoveredImages,cssBytes:css.length};
}
