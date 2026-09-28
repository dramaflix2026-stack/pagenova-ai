import type { SiteProject, SitePageKey } from "@/lib/site-builder";

export type LiveEdit = { selector: string; text: string; font: string; size: number; color: string };
export type PreviewTheme = "original" | "claro" | "escuro" | "areia";

export function renderEditablePreview(html: string, site: SiteProject, key: SitePageKey, enabled = true): string {
  const edits = site.liveEdits?.[key] || [];
  const theme = site.previewTheme || "original";
  const payload = JSON.stringify({ edits, enabled }).replace(/</g, "\\u003c");
  const palette: Record<PreviewTheme, string> = {
    original: "",
    claro: "body{background:#fafbf8!important;color:#19382f!important}header,footer,.section,.editorial,.services-section{background:#f4f8f3!important;color:#19382f!important}article,.feature,.card{background:#fff!important;color:#19382f!important}",
    escuro: "body,header,footer,.section,.editorial,.services-section{background:#121d1a!important;color:#eef5ee!important}article,.feature,.card{background:#20302a!important;color:#eef5ee!important}p{color:inherit!important}",
    areia: "body,header,footer,.section,.editorial,.services-section{background:#f6f0e7!important;color:#342d28!important}article,.feature,.card{background:#fffaf1!important;color:#342d28!important}",
  };
  const css = '<style id="pn-theme">' + palette[theme] + '</style>';
  const script = `<script id="pn-live-editor">(function(){
    const state=${payload};
    function apply(el,edit){
      if(edit.text !== undefined) el.textContent=edit.text;
      if(edit.font) el.style.setProperty('font-family',edit.font,'important');
      if(edit.size) el.style.setProperty('font-size',edit.size+'px','important');
      if(edit.color) el.style.setProperty('color',edit.color,'important');
    }
    function path(el){
      const parts=[];while(el&&el!==document.body){
        let n=1,p=el.previousElementSibling;while(p){if(p.tagName===el.tagName)n++;p=p.previousElementSibling}
        parts.unshift(el.tagName.toLowerCase()+':nth-of-type('+n+')');el=el.parentElement
      }return 'body > '+parts.join(' > ')
    }
    state.edits.forEach(function(edit){try{const el=document.querySelector(edit.selector);if(el)apply(el,edit)}catch(_){}});
    if(!state.enabled)return;
    const bar=document.createElement('div');bar.id='pn-edit-bar';
    bar.style.cssText='position:fixed;z-index:2147483647;display:none;gap:5px;align-items:center;flex-wrap:wrap;max-width:min(620px,95vw);padding:8px;border-radius:12px;background:#14231e;color:white;box-shadow:0 12px 38px #0005;font:13px Arial,sans-serif';
    bar.innerHTML='<input aria-label="Editar texto" style="flex:1;min-width:160px;padding:7px;border-radius:6px;border:0"><select aria-label="Fonte" style="padding:7px"><option value="">Fonte atual</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="system-ui, sans-serif">Moderna</option></select><input aria-label="Tamanho do texto em pixels" type="number" min="10" max="120" style="width:58px;padding:7px"><input aria-label="Cor do texto" type="color"><button type="button" aria-label="Fechar" style="border:0;background:#e6eee8;padding:7px;border-radius:6px">✕</button>';
    document.body.appendChild(bar);
    const input=bar.querySelector('input'),font=bar.querySelector('select'),size=bar.querySelector('input[type=number]'),color=bar.querySelector('input[type=color]');
    let selected=null;
    function save(){
      if(!selected)return;
      const edit={selector:path(selected),text:input.value,font:font.value,size:Number(size.value)||0,color:color.value};
      apply(selected,edit);
      parent.postMessage({type:'pagenova-live-edit',key:${JSON.stringify(key)},edit:edit},'*')
    }
    document.addEventListener('dblclick',function(event){
      if(bar.contains(event.target))return;
      const el=event.target.closest('h1,h2,h3,h4,p,li,blockquote,small,strong,button,a,span');
      if(!el||bar.contains(el)||el.closest('script,style,nav,[contenteditable]'))return;
      event.preventDefault();selected=el;
      input.value=el.textContent.trim();font.value='';size.value=Math.round(parseFloat(getComputedStyle(el).fontSize))||16;
      const rgb=getComputedStyle(el).color.match(/\\d+/g);
      color.value=rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'#202020';
      bar.style.display='flex';
      const box=el.getBoundingClientRect();
      bar.style.left=Math.max(8,Math.min(box.left,innerWidth- Math.min(620,innerWidth-16)))+'px';
      bar.style.top=Math.max(8,box.top-64)+'px';
      input.focus();input.select()
    },true);
    input.addEventListener('change',save);font.addEventListener('change',save);size.addEventListener('change',save);color.addEventListener('change',save);
    input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();save();bar.style.display='none'}});
    bar.querySelector('button').onclick=function(){bar.style.display='none'};
  })();</script>`;
  return html.replace("</head>", css + "</head>").replace("</body>", script + "</body>");
}
