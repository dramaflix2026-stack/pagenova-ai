import type { SiteProject, SitePageKey } from "@/lib/site-builder";

export type LiveEdit = {
  selector: string;
  text: string;
  font: string;
  size: number;
  color: string;
  align?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  movable?: boolean;
  headerLayout?: "left" | "center" | "right";
};

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

  const editorCss = `
    #pn-edit-bar{position:fixed;z-index:2147483647;display:none;gap:7px;align-items:center;flex-wrap:wrap;max-width:min(720px,calc(100vw - 16px));padding:8px;border:1px solid #d7d7d2;border-radius:14px;background:#fff;color:#171a16;box-shadow:0 18px 48px #0002;font:12px Arial,sans-serif}
    #pn-edit-bar button,#pn-edit-bar select,#pn-edit-bar input{height:32px;border:1px solid #ddded8;border-radius:9px;background:#fff;color:#171a16;font:700 12px Arial,sans-serif}
    #pn-edit-bar button{padding:0 10px;cursor:pointer}
    #pn-edit-bar button:hover{background:#f2f2ee}
    #pn-edit-bar input[type=number]{width:62px;padding:0 8px}
    #pn-edit-bar input[type=color]{width:38px;padding:2px}
    #pn-edit-bar select{padding:0 8px}
    #pn-resize-handle{position:absolute;z-index:2147483646;display:none;width:14px;height:14px;border:2px solid #fff;border-radius:4px;background:#facc15;box-shadow:0 4px 14px #0004;cursor:nwse-resize}
    [data-pn-selected=true]{box-shadow:0 0 0 1.5px rgba(250,204,21,.95)!important;border-radius:6px!important}
    [data-pn-editable-hover=true]{box-shadow:0 0 0 1px rgba(250,204,21,.65)!important;border-radius:6px!important;cursor:grab!important}
    [data-pn-free-text=true],[data-pn-ghost=true]{position:absolute!important;z-index:120!important;min-width:40px!important;min-height:18px!important;box-sizing:border-box!important;overflow:hidden!important;scrollbar-width:none!important;-ms-overflow-style:none!important}
    [data-pn-free-text=true]::-webkit-scrollbar,[data-pn-ghost=true]::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
    .pn-site-header .header-inner{display:flex!important;align-items:center!important;gap:24px!important}
    .pn-site-header.pn-header-left .header-inner{justify-content:space-between!important}
    .pn-site-header.pn-header-right .header-inner{justify-content:space-between!important;flex-direction:row-reverse!important}
    .pn-site-header.pn-header-center .header-inner{justify-content:center!important;position:relative!important}
    .pn-site-header .brand{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important;font-size:clamp(15px,1.45vw,22px)!important;font-weight:900!important;letter-spacing:.045em!important;text-transform:uppercase!important}
    .pn-site-header .brand:before,.pn-site-header .brand:after{display:none!important;content:none!important}
    .pn-menu-toggle{display:none}
    .pn-header-center .pn-menu-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;position:absolute!important;right:0!important;width:42px!important;height:38px!important;padding:0!important;gap:4px!important;flex-direction:column!important;border:1px solid #d8ddd6!important;border-radius:999px!important;background:#fff!important;color:#20251f!important;cursor:pointer!important}
    .pn-menu-toggle span{display:block!important;width:18px!important;height:2px!important;border-radius:99px!important;background:currentColor!important}
    .pn-header-center nav{position:absolute!important;top:calc(100% + 10px)!important;right:0!important;z-index:50!important;display:none!important;min-width:220px!important;padding:12px!important;border:1px solid #e3e5df!important;border-radius:14px!important;background:#fff!important;box-shadow:0 18px 42px rgba(20,25,22,.16)!important}
    .pn-header-center.is-menu-open nav{display:flex!important;flex-direction:column!important;gap:4px!important}
    .pn-header-center nav a{padding:10px 12px!important;border-radius:10px!important}
  `;

  const css = '<style id="pn-theme">' + (site.presetId === "institucional" ? "" : palette[theme]) + editorCss + '</style>';

  const script = `<script id="pn-live-editor">(function(){
    const state=${payload};

    function path(el){
      const parts=[];
      while(el&&el!==document.body){
        let n=1,p=el.previousElementSibling;
        while(p){if(p.tagName===el.tagName)n++;p=p.previousElementSibling}
        parts.unshift(el.tagName.toLowerCase()+':nth-of-type('+n+')');
        el=el.parentElement;
      }
      return 'body > '+parts.join(' > ');
    }

    function ensureHeader(header){
      header.classList.add('pn-site-header');
      const inner=header.querySelector('.header-inner')||header;
      const nav=header.querySelector('nav');
      if(nav&&!nav.id)nav.id='pn-header-menu';

      let btn=header.querySelector('.pn-menu-toggle');
      if(!btn){
        btn=document.createElement('button');
        btn.type='button';
        btn.className='pn-menu-toggle';
        btn.innerHTML='<span></span><span></span><span></span>';
        btn.setAttribute('aria-expanded','false');
        if(nav)btn.setAttribute('aria-controls',nav.id||'pn-header-menu');
        inner.insertBefore(btn,nav||null);
      }

      btn.onclick=function(event){
        event.preventDefault();
        event.stopPropagation();
        const open=header.classList.toggle('is-menu-open');
        btn.setAttribute('aria-expanded',String(open));
      };
    }

    function applyHeader(header,layout){
      if(!header)return;
      ensureHeader(header);
      header.classList.remove('pn-header-left','pn-header-center','pn-header-right','is-menu-open');
      header.classList.add('pn-header-'+(layout||'left'));
    }

    function apply(el,edit){
      if(edit.headerLayout){applyHeader(el,edit.headerLayout);return}
      if(edit.text!==undefined&&el.textContent!==edit.text)el.textContent=edit.text;
      if(edit.font)el.style.setProperty('font-family',edit.font,'important');
      if(edit.size)el.style.setProperty('font-size',edit.size+'px','important');
      if(edit.color)el.style.setProperty('color',edit.color,'important');
      if(edit.align)el.style.setProperty('text-align',edit.align,'important');

      if(edit.movable){
        el.setAttribute('data-pn-free-text','true');
        el.style.setProperty('position','absolute','important');
        el.style.setProperty('z-index','120','important');
        el.style.setProperty('overflow','hidden','important');
      }

      if(Number.isFinite(edit.x))el.style.setProperty('left',edit.x+'px','important');
      if(Number.isFinite(edit.y))el.style.setProperty('top',edit.y+'px','important');
      if(Number.isFinite(edit.width))el.style.setProperty('width',edit.width+'px','important');
      if(Number.isFinite(edit.height))el.style.setProperty('height',edit.height+'px','important');
    }

    state.edits.forEach(function(edit){
      try{
        const el=document.querySelector(edit.selector);
        if(el)apply(el,edit);
      }catch(_){}
    });

    if(!state.enabled)return;

    document.querySelectorAll('header').forEach(function(header){ensureHeader(header)});

    const bar=document.createElement('div');
    bar.id='pn-edit-bar';
    bar.innerHTML='<button type="button" data-act="add">+ Texto</button><button type="button" data-act="left">Logo Esq.</button><button type="button" data-act="center">Logo Meio</button><button type="button" data-act="right">Logo Dir.</button><select aria-label="Fonte"><option value="">Fonte</option><option value="Arial, sans-serif">Arial</option><option value="Inter, system-ui, sans-serif">Inter</option><option value="Georgia, serif">Georgia</option><option value="Poppins, Arial, sans-serif">Poppins</option><option value="Montserrat, Arial, sans-serif">Montserrat</option></select><input aria-label="Tamanho" type="number" min="10" max="140"><input aria-label="Cor" type="color"><button type="button" data-act="done">OK</button>';
    document.body.appendChild(bar);

    const resizeHandle=document.createElement('div');
    resizeHandle.id='pn-resize-handle';
    document.body.appendChild(resizeHandle);

    const font=bar.querySelector('select');
    const size=bar.querySelector('input[type=number]');
    const color=bar.querySelector('input[type=color]');

    const editableSelector='h1,h2,h3,h4,h5,h6,p,li,blockquote,small,strong,a,span,.brand,[data-pn-free-text],[data-pn-ghost]';

    let selected=null;
    let sourceOriginal=null;
    let hoveredEditable=null;
    let drag=null;
    let resizing=null;
    let pending=0;

    function rgbToHex(value){
      const rgb=String(value||'').match(/\\d+/g);
      return rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(function(x){return Number(x).toString(16).padStart(2,'0')}).join(''):'#202020';
    }

    function showResizeHandle(){
      if(!selected){resizeHandle.style.display='none';return}
      const box=selected.getBoundingClientRect();
      resizeHandle.style.display='block';
      resizeHandle.style.left=(scrollX+box.right-7)+'px';
      resizeHandle.style.top=(scrollY+box.bottom-7)+'px';
    }

    function hideTools(){
      bar.style.display='none';
      resizeHandle.style.display='none';
    }

    function showBar(){
      if(!selected)return;
      const box=selected.getBoundingClientRect();
      bar.style.display='flex';
      bar.style.left=Math.max(8,Math.min(box.left,innerWidth-bar.offsetWidth-8))+'px';
      bar.style.top=Math.max(8,box.top-46)+'px';
      showResizeHandle();
    }

    function select(el){
      if(selected&&selected!==el)selected.removeAttribute('data-pn-selected');
      selected=el;
      selected.setAttribute('data-pn-selected','true');

      const s=getComputedStyle(selected);
      font.value='';
      size.value=Math.round(parseFloat(s.fontSize))||16;
      color.value=rgbToHex(s.color);

      showBar();
    }

    function save(){
      if(!selected)return;

      const box=selected.getBoundingClientRect();
      const selector=selected.getAttribute('data-pn-source-selector')||path(selected);

      const edit={
        selector:selector,
        text:selected.matches('header,nav,.header-inner')?'':selected.textContent.trim(),
        font:font.value||'',
        size:Number(size.value)||0,
        color:color.value||'',
        align:getComputedStyle(selected).textAlign,
        movable:selected.hasAttribute('data-pn-free-text')||selected.hasAttribute('data-pn-ghost'),
        x:Math.round(scrollX+box.left),
        y:Math.round(scrollY+box.top),
        width:Math.round(box.width),
        height:Math.round(box.height)
      };

      apply(selected,edit);
      parent.postMessage({type:'pagenova-live-edit',key:${JSON.stringify(key)},edit:edit},'*');
    }

    function createGhostFromOriginal(el){
      const oldId=el.getAttribute('data-pn-ghost-id');
      if(oldId){
        const old=document.getElementById(oldId);
        if(old)return old;
      }

      const box=el.getBoundingClientRect();
      const style=getComputedStyle(el);
      const ghost=document.createElement('div');
      const id='pn-ghost-'+Math.random().toString(36).slice(2);

      ghost.id=id;
      ghost.textContent=el.textContent.trim();
      ghost.setAttribute('data-pn-ghost','true');
      ghost.setAttribute('data-pn-free-text','true');
      ghost.setAttribute('data-pn-source-selector',path(el));

      ghost.style.cssText=[
        'position:absolute',
        'left:'+(scrollX+box.left)+'px',
        'top:'+(scrollY+box.top)+'px',
        'width:'+Math.max(40,box.width)+'px',
        'height:'+Math.max(18,box.height)+'px',
        'z-index:120',
        'padding:0',
        'margin:0',
        'background:transparent',
        'box-sizing:border-box',
        'overflow:hidden',
        'cursor:grab',
        'font-family:'+style.fontFamily,
        'font-size:'+style.fontSize,
        'font-weight:'+style.fontWeight,
        'line-height:'+style.lineHeight,
        'letter-spacing:'+style.letterSpacing,
        'color:'+style.color,
        'text-align:'+style.textAlign
      ].join(';');

      document.body.appendChild(ghost);
      el.setAttribute('data-pn-ghost-id',id);
      el.setAttribute('data-pn-original-hidden','true');
      el.style.setProperty('visibility','hidden','important');
      return ghost;
    }

    function addText(){
      const el=document.createElement('div');
      el.textContent='Novo texto';
      el.setAttribute('data-pn-free-text','true');
      el.style.cssText='position:absolute;left:80px;top:140px;width:320px;height:54px;z-index:120;padding:0;margin:0;overflow:hidden;box-sizing:border-box;background:transparent;color:#202020;font:800 28px/1.2 Arial,sans-serif;text-align:left;cursor:grab';
      document.body.appendChild(el);
      sourceOriginal=null;
      select(el);
      save();
    }

    function setHeader(layout){
      const header=document.querySelector('header');
      if(!header)return;
      applyHeader(header,layout);
      parent.postMessage({type:'pagenova-live-edit',key:${JSON.stringify(key)},edit:{selector:path(header),text:'',font:'',size:0,color:'',headerLayout:layout}},'*');
      hideTools();
    }

    bar.addEventListener('click',function(event){
      event.preventDefault();
      event.stopPropagation();
      const action=event.target.closest('[data-act]')?.getAttribute('data-act');

      if(action==='add')addText();
      if(action==='left')setHeader('left');
      if(action==='center')setHeader('center');
      if(action==='right')setHeader('right');
      if(action==='done'){
        save();
        hideTools();
        if(selected)selected.removeAttribute('data-pn-selected');
        selected=null;
      }
    });

    font.addEventListener('change',save);
    size.addEventListener('change',save);
    color.addEventListener('change',save);

    document.addEventListener('mouseover',function(event){
      if(bar.contains(event.target)||resizeHandle.contains(event.target))return;
      const el=event.target.closest(editableSelector);
      if(!el||el.closest('script,style,#pn-edit-bar,nav'))return;
      if(hoveredEditable&&hoveredEditable!==el)hoveredEditable.removeAttribute('data-pn-editable-hover');
      hoveredEditable=el;
      hoveredEditable.setAttribute('data-pn-editable-hover','true');
    },true);

    document.addEventListener('mouseout',function(event){
      if(!hoveredEditable)return;
      if(event.relatedTarget&&hoveredEditable.contains(event.relatedTarget))return;
      hoveredEditable.removeAttribute('data-pn-editable-hover');
      hoveredEditable=null;
    },true);

    document.addEventListener('click',function(event){
      if(bar.contains(event.target)||resizeHandle.contains(event.target))return;
      let el=event.target.closest(editableSelector);
      if(!el||el.closest('script,style,#pn-edit-bar,nav'))return;

      event.preventDefault();
      event.stopPropagation();

      if(!el.hasAttribute('data-pn-free-text')&&!el.hasAttribute('data-pn-ghost')){
        sourceOriginal=el;
        el=createGhostFromOriginal(el);
      }else{
        sourceOriginal=null;
      }

      select(el);
    },true);

    document.addEventListener('dblclick',function(event){
      if(bar.contains(event.target)||resizeHandle.contains(event.target))return;
      let el=event.target.closest(editableSelector);
      if(!el||el.closest('script,style,#pn-edit-bar,nav'))return;

      event.preventDefault();
      event.stopPropagation();

      if(!el.hasAttribute('data-pn-free-text')&&!el.hasAttribute('data-pn-ghost')){
        sourceOriginal=el;
        el=createGhostFromOriginal(el);
      }

      select(el);
      el.setAttribute('contenteditable','plaintext-only');
      el.focus();
    },true);

    document.addEventListener('input',function(event){
      if(event.target!==selected)return;
      clearTimeout(pending);
      pending=setTimeout(function(){save();showResizeHandle()},250);
    });

    document.addEventListener('pointerdown',function(event){
      if(bar.contains(event.target))return;

      if(resizeHandle.contains(event.target)){
        if(!selected)return;
        const box=selected.getBoundingClientRect();
        resizing={el:selected,startX:event.clientX,startY:event.clientY,width:box.width,height:box.height};
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      let el=event.target.closest(editableSelector);
      if(!el||el.closest('script,style,#pn-edit-bar,nav')||event.target.closest('[contenteditable=true],input,textarea,select,button'))return;

      event.preventDefault();
      event.stopPropagation();

      if(!el.hasAttribute('data-pn-free-text')&&!el.hasAttribute('data-pn-ghost')){
        sourceOriginal=el;
        el=createGhostFromOriginal(el);
      }else{
        sourceOriginal=null;
      }

      el.style.setProperty('cursor','grabbing','important');
      select(el);

      const box=el.getBoundingClientRect();
      const x=parseFloat(el.style.left)||box.left+scrollX;
      const y=parseFloat(el.style.top)||box.top+scrollY;

      drag={el:el,startX:event.clientX,startY:event.clientY,x:x,y:y,moved:false};
    },true);

    document.addEventListener('pointermove',function(event){
      if(resizing){
        const nextW=Math.max(40,resizing.width+event.clientX-resizing.startX);
        const nextH=Math.max(18,resizing.height+event.clientY-resizing.startY);
        resizing.el.style.setProperty('width',nextW+'px','important');
        resizing.el.style.setProperty('height',nextH+'px','important');
        showResizeHandle();
        return;
      }

      if(!drag)return;

      const nextX=drag.x+event.clientX-drag.startX;
      const nextY=drag.y+event.clientY-drag.startY;

      drag.el.style.setProperty('left',nextX+'px','important');
      drag.el.style.setProperty('top',nextY+'px','important');

      drag.moved=true;
      hideTools();
    },true);

    document.addEventListener('pointerup',function(){
      if(resizing){
        save();
        resizing=null;
        hideTools();
        return;
      }

      if(drag){
        drag.el.style.setProperty('cursor','grab','important');
        drag.el.style.setProperty('overflow','hidden','important');
        save();
        hideTools();
      }

      drag=null;
    },true);

    addEventListener('scroll',function(){hideTools()},true);
    addEventListener('resize',function(){hideTools()});
  })();</script>`;

  return html.replace("</head>", css + "</head>").replace("</body>", script + "</body>");
}
