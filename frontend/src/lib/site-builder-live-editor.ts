import type { SiteProject, SitePageKey } from "@/lib/site-builder";

export type LiveEdit = { selector: string; text: string; font: string; size: number; color: string };
export type PreviewTheme = "original" | "claro" | "escuro" | "areia";

export function renderEditablePreview(html: string, site: SiteProject, key: SitePageKey, enabled = true): string {
  const edits = site.liveEdits?.[key] || [];
  const theme = site.previewTheme || "original";
  const payload = JSON.stringify({ edits, enabled }).replace(/</g, "\\u003c");
  const palette: Record<PreviewTheme, string> = {
    original: "",
    claro: "body{background:#f7f9f6!important;color:#183c32!important}.hero:not(.personal){background:#164136!important}header,.services-section,.intro-strip{background:#f7f9f6!important;color:#183c32!important}.editorial,.testimonials{background:#e8f0e9!important;color:#183c32!important}.feature,.testimonial-card,.intro-pill{background:#fff!important;color:#183c32!important}footer{background:#e7ede7!important;color:#183c32!important}.section p,.editorial p,.testimonials p{color:#435c51!important}",
    escuro: "body{background:#101b18!important;color:#edf5ee!important}header,.services-section,.intro-strip,.editorial,.testimonials,.closing{background:#14251f!important;color:#edf5ee!important}.feature,.testimonial-card,.intro-pill{background:#20372d!important;color:#edf5ee!important;border-color:#41644d!important}.section p,.editorial p,.testimonials p,.feature p,.testimonial-card p,.intro-grid p{color:#d1e1d4!important}header a,footer a,.intro-label h2{color:#edf5ee!important}footer{background:#101b18!important;color:#d1e1d4!important}.kicker,.testimonial-card .quote-mark{color:#a0d6a6!important}",
    areia: "body{background:#f6f0e7!important;color:#342d28!important}header,.services-section,.intro-strip{background:#f6f0e7!important;color:#342d28!important}.editorial,.testimonials{background:#eee4d5!important;color:#342d28!important}.feature,.testimonial-card,.intro-pill{background:#fffaf2!important;color:#342d28!important;border-color:#d7c7ad!important}.section p,.editorial p,.testimonials p{color:#594a3b!important}footer{background:#e8dece!important;color:#342d28!important}",
  };
  const css = '<style id="pn-theme">' + palette[theme] + '</style>';
  const script = `<script id="pn-live-editor">(function(){
    const state=${payload};
    function apply(el,edit){
      if(edit.text !== undefined && el.textContent !== edit.text) el.textContent=edit.text;
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
    bar.style.cssText='position:fixed;z-index:2147483647;display:none;gap:8px;align-items:center;flex-wrap:wrap;padding:9px 11px;border:1px solid #ffffff26;border-radius:12px;background:#182921;color:#fff;box-shadow:0 16px 38px #0005;font:13px Arial,sans-serif';
    bar.innerHTML='<select aria-label="Fonte" style="padding:7px;border:0;border-radius:6px;background:#34483d;color:white"><option value="">Fonte atual</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="system-ui, sans-serif">Moderna</option></select><input aria-label="Tamanho do texto em pixels" type="number" min="10" max="120" style="width:58px;padding:7px;border:0;border-radius:6px"><input aria-label="Cor do texto" type="color" style="width:34px;height:32px;border:0;background:transparent"><button type="button" aria-label="Concluir edição" style="border:0;background:#8ad49b;padding:8px 11px;border-radius:6px;font-weight:bold">Concluir</button>';
    document.body.appendChild(bar);
    const font=bar.querySelector('select'),size=bar.querySelector('input[type=number]'),color=bar.querySelector('input[type=color]');
    let selected=null, pending=0;
    function save(){
      if(!selected)return;
      const edit={selector:path(selected),text:selected.textContent.trim(),font:font.value,size:Number(size.value)||0,color:color.value};
      apply(selected,edit);
      parent.postMessage({type:'pagenova-live-edit',key:${JSON.stringify(key)},edit:edit},'*')
    }
    document.addEventListener('dblclick',function(event){
      if(bar.contains(event.target))return;
      const el=event.target.closest('h1,h2,h3,h4,p,li,blockquote,small,strong,button,a,span');
      if(!el||bar.contains(el)||el.closest('script,style,nav,[contenteditable]'))return;
      event.preventDefault();
      if(selected&&selected!==el){save();selected.removeAttribute('contenteditable');selected.style.removeProperty('outline')}
      selected=el;el.setAttribute('contenteditable','plaintext-only');
      el.style.setProperty('outline','2px solid #59bf80','important');
      el.style.setProperty('outline-offset','4px','important');
      font.value='';size.value=Math.round(parseFloat(getComputedStyle(el).fontSize))||16;
      const rgb=getComputedStyle(el).color.match(/\\d+/g);
      color.value=rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'#202020';
      bar.style.display='flex';
      const box=el.getBoundingClientRect();
      bar.style.left=Math.max(8,Math.min(box.left,innerWidth-290))+'px';
      bar.style.top=Math.max(8,box.top-58)+'px';
      el.focus()
    },true);
    font.addEventListener('change',save);size.addEventListener('change',save);color.addEventListener('change',save);
    document.addEventListener('input',function(event){
      if(event.target!==selected)return;
      clearTimeout(pending);pending=setTimeout(save,350)
    });
    document.addEventListener('pointerdown',function(event){
      if(selected&&!selected.contains(event.target)&&!bar.contains(event.target))finish()
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&selected){finish()}});
    function finish(){if(!selected)return;save();selected.removeAttribute('contenteditable');selected.style.removeProperty('outline');selected=null;bar.style.display='none'}
    bar.querySelector('button').onclick=finish;
  })();</script>`;
  return html.replace("</head>", css + "</head>").replace("</body>", script + "</body>");
}
