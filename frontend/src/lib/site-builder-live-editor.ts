export type PreviewTheme = "original" | "claro" | "escuro" | "areia";

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
  kind?: "text" | "divider" | "card";
};

export type LiveEditorState = {
  edits?: LiveEdit[];
};

function injectBeforeBody(html: string, payload: string) {
  if (html.includes("</body>")) return html.replace("</body>", `${payload}</body>`);
  return `${html}${payload}`;
}

export function renderEditablePreview(
  html: string,
  siteOrKey: string | { theme?: PreviewTheme; liveEdits?: LiveEdit[] | Record<string, LiveEdit[]>; edits?: LiveEdit[] | Record<string, LiveEdit[]> },
  pageKeyOrState?: string | LiveEditorState,
  enabled = true
) {
  if (!enabled) return html;

  const key =
    typeof siteOrKey === "string"
      ? siteOrKey
      : typeof pageKeyOrState === "string"
        ? pageKeyOrState
        : "home";

  const state: LiveEditorState =
    typeof siteOrKey === "string"
      ? ((pageKeyOrState as LiveEditorState) ?? {})
      : (() => {
          const rawEdits = siteOrKey.liveEdits ?? siteOrKey.edits ?? [];
          return { edits: Array.isArray(rawEdits) ? rawEdits : rawEdits[key] ?? [] };
        })();

  const safeKey = JSON.stringify(key);
  const safeState = JSON.stringify({ edits: state.edits ?? [] }).replace(/</g, "\\u003c");

  const css = `
<style id="pn-live-editor-style">
  #pn-edit-bar{
    position:fixed!important;
    left:50%!important;
    bottom:18px!important;
    transform:translateX(-50%)!important;
    z-index:2147483000!important;
    display:none!important;
    align-items:center!important;
    gap:8px!important;
    padding:10px!important;
    border:1px solid rgba(20,20,20,.12)!important;
    border-radius:14px!important;
    background:rgba(255,255,255,.96)!important;
    box-shadow:0 16px 45px rgba(0,0,0,.16)!important;
    font-family:Arial,sans-serif!important;
    color:#151515!important;
    backdrop-filter:blur(12px)!important;
  }

  #pn-edit-bar[data-open=true]{display:flex!important}
  #pn-edit-bar button,
  #pn-edit-bar select,
  #pn-edit-bar input{
    height:34px!important;
    border:1px solid rgba(0,0,0,.14)!important;
    border-radius:9px!important;
    background:#fff!important;
    color:#151515!important;
    font:600 12px Arial,sans-serif!important;
    padding:0 10px!important;
  }

  #pn-edit-bar input[type=color]{width:40px!important;padding:2px!important}
  #pn-edit-bar input[type=number]{width:64px!important}
  #pn-edit-bar button{cursor:pointer!important}
  #pn-edit-bar button:hover{background:#f4f4f1!important}

  #pn-edit-box{
    position:fixed!important;
    display:none!important;
    z-index:2147482999!important;
    pointer-events:none!important;
    border:1.5px solid rgba(246,178,0,.95)!important;
    border-radius:8px!important;
    box-shadow:0 0 0 3px rgba(246,178,0,.12)!important;
  }

  #pn-edit-box[data-open=true]{display:block!important}

  .pn-resize-handle{
    position:absolute!important;
    width:10px!important;
    height:10px!important;
    border-radius:999px!important;
    background:#f6b200!important;
    border:2px solid #fff!important;
    box-shadow:0 2px 8px rgba(0,0,0,.18)!important;
    pointer-events:auto!important;
  }

  .pn-resize-handle[data-dir=nw]{left:-7px!important;top:-7px!important;cursor:nwse-resize!important}
  .pn-resize-handle[data-dir=n]{left:50%!important;top:-7px!important;transform:translateX(-50%)!important;cursor:ns-resize!important}
  .pn-resize-handle[data-dir=ne]{right:-7px!important;top:-7px!important;cursor:nesw-resize!important}
  .pn-resize-handle[data-dir=e]{right:-7px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important}
  .pn-resize-handle[data-dir=se]{right:-7px!important;bottom:-7px!important;cursor:nwse-resize!important}
  .pn-resize-handle[data-dir=s]{left:50%!important;bottom:-7px!important;transform:translateX(-50%)!important;cursor:ns-resize!important}
  .pn-resize-handle[data-dir=sw]{left:-7px!important;bottom:-7px!important;cursor:nesw-resize!important}
  .pn-resize-handle[data-dir=w]{left:-7px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important}

  [data-pn-editable-hover=true]{
    outline:1px dashed rgba(246,178,0,.72)!important;
    outline-offset:4px!important;
    cursor:grab!important;
  }

  [data-pn-movable=true],
  [data-pn-free-text=true],
  [data-pn-divider=true]{
    cursor:grab!important;
    box-sizing:border-box!important;
  }

  [data-pn-dragging=true]{cursor:grabbing!important}

  .pn-live-divider{
    display:block!important;
    width:260px!important;
    height:2px!important;
    min-height:2px!important;
    background:rgba(30,45,38,.35)!important;
    border:0!important;
    border-radius:999px!important;
    margin:24px auto!important;
  }

  .pn-menu-toggle{
    width:42px!important;
    height:38px!important;
    padding:0!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    flex-direction:column!important;
    gap:4px!important;
  }

  .pn-menu-toggle span{
    display:block!important;
    width:18px!important;
    height:2px!important;
    border-radius:99px!important;
    background:currentColor!important;
  }

  header[data-pn-header-layout=center]{
    display:grid!important;
    grid-template-columns:42px 1fr 42px!important;
    align-items:center!important;
  }

  header[data-pn-header-layout=center] .pn-brand-logo{
    grid-column:2!important;
    justify-self:center!important;
    text-align:center!important;
  }

  header[data-pn-header-layout=center] nav{
    display:none!important;
  }

  header[data-pn-header-layout=right]{
    display:flex!important;
    flex-direction:row-reverse!important;
    justify-content:space-between!important;
    align-items:center!important;
  }
</style>`;

  const script = `
<script>
(function(){
  const KEY=${safeKey};
  const STATE=${safeState};
  const edits=Array.isArray(STATE.edits)?STATE.edits:[];
  const textSelector='h1,h2,h3,h4,h5,h6,p,li,blockquote,small,strong,a,span,button,[data-pn-free-text=true]';
  const cardSelector='';
  const sectionSelector='section,.section,[class*="section"],[class*="Section"]';
  const socialSelector='.social-links,[class*="social-links"],[class*="socialLinks"]';
  const editableSelector=textSelector+','+cardSelector+','+sectionSelector+','+socialSelector+',[data-pn-divider=true]';

  let selected=null;
  let hovered=null;
  let document.body.classList.remove('pn-is-dragging');
      hideGuides();
      pendingDrag=null;
  let activeResize=null;

  function cssPath(el){
    if(!el || !el.tagName) return '';
    if(el.dataset && el.dataset.pnId) return '[data-pn-id="'+el.dataset.pnId+'"]';
    const parts=[];
    while(el && el.nodeType===1 && el !== document.body){
      let part=el.tagName.toLowerCase();
      if(el.id){part+='#'+el.id;parts.unshift(part);break}
      let index=1;
      let sib=el;
      while((sib=sib.previousElementSibling)){
        if(sib.tagName===el.tagName) index++;
      }
      part+=':nth-of-type('+index+')';
      parts.unshift(part);
      el=el.parentElement;
    }
    return parts.join('>');
  }

  function bySelector(selector){
    try{return document.querySelector(selector)}catch(e){return null}
  }

  function number(value,fallback){
    const n=parseFloat(value);
    return Number.isFinite(n)?n:fallback;
  }

  function px(value){return Math.round(value)+'px'}

  function makeId(){
    return 'pn-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  }

  function ensureBar(){
    let bar=document.getElementById('pn-edit-bar');
    if(bar) return bar;

    bar=document.createElement('div');
    bar.id='pn-edit-bar';
    bar.innerHTML =
      '<button type="button" data-act="text">+ Texto</button>'+
      '<button type="button" data-act="line">+ Linha</button>'+
      '<button type="button" data-act="card">Card</button>'+
      '<button type="button" data-act="section">Seção</button>'+
      '<button type="button" data-act="left">Logo Esq.</button>'+
      '<button type="button" data-act="center">Logo Meio</button>'+
      '<button type="button" data-act="right">Logo Dir.</button>'+
      '<select data-field="font">'+
        '<option value="">Fonte</option>'+
        '<option value="Arial, sans-serif">Arial</option>'+
        '<option value="Inter, Arial, sans-serif">Inter</option>'+
        '<option value="Georgia, serif">Georgia</option>'+
        '<option value="Montserrat, Arial, sans-serif">Montserrat</option>'+
        '<option value="Poppins, Arial, sans-serif">Poppins</option>'+
      '</select>'+
      '<input data-field="size" type="number" min="8" max="160" step="1" title="Tamanho">'+
      '<input data-field="color" type="color" title="Cor">'+
      '<button type="button" data-act="ok">OK</button>';

    document.body.appendChild(bar);

    bar.addEventListener('input',function(event){
      if(!selected) return;
      const field=event.target && event.target.dataset ? event.target.dataset.field : '';
      if(field==='font' && event.target.value) selected.style.setProperty('font-family',event.target.value,'important');
      if(field==='size' && event.target.value) selected.style.setProperty('font-size',event.target.value+'px','important');
      if(field==='color' && event.target.value) selected.style.setProperty('color',event.target.value,'important');
      save(selected);
      updateTools();
    });

    bar.addEventListener('click',function(event){
      const action=event.target && event.target.dataset ? event.target.dataset.act : '';
      if(!action) return;

      if(action==='text') return addText();
      if(action==='line') return addDivider();
      if(action==='card') return selectCardFromCurrent();
      if(action==='section') return selectSectionFromCurrent();
      if(action==='left' || action==='center' || action==='right') return setHeaderLayout(action);
      if(action==='ok') return clearSelection();
    });

    return bar;
  }

  function ensureBox(){
    let box=document.getElementById('pn-edit-box');
    if(box) return box;

    box=document.createElement('div');
    box.id='pn-edit-box';

    ['nw','n','ne','e','se','s','sw','w'].forEach(function(dir){
      const handle=document.createElement('span');
      handle.className='pn-resize-handle';
      handle.dataset.dir=dir;
      box.appendChild(handle);
    });

    document.body.appendChild(box);

    box.addEventListener('pointerdown',function(event){
      const handle=event.target.closest('.pn-resize-handle');
      if(!handle || !selected) return;

      event.preventDefault();
      event.stopPropagation();

      if(isSection(selected)){
        selected.dataset.pnSection='true';
      }else{
        selected=ensureMovable(selected);
      }
      const rect=selected.getBoundingClientRect();

      activeResize={
        el:selected,
        dir:handle.dataset.dir,
        startX:event.clientX,
        startY:event.clientY,
        left:rect.left+scrollX,
        top:rect.top+scrollY,
        width:rect.width,
        height:rect.height
      };

      selected.setPointerCapture && selected.setPointerCapture(event.pointerId);
    },true);

    return box;
  }

  const bar=ensureBar();
  const box=ensureBox();

  function updateTools(){
    if(!selected){
      bar.dataset.open='false';
      box.dataset.open='false';
      return;
    }

    const rect=selected.getBoundingClientRect();
    if(rect.width < 1 || rect.height < 1){
      box.dataset.open='false';
      return;
    }

    box.dataset.open='true';
    box.style.left=px(rect.left);
    box.style.top=px(rect.top);
    box.style.width=px(rect.width);
    box.style.height=px(rect.height);

    bar.dataset.open='true';

    const font=bar.querySelector('[data-field=font]');
    const size=bar.querySelector('[data-field=size]');
    const color=bar.querySelector('[data-field=color]');
    const st=getComputedStyle(selected);

    if(font) font.value='';
    if(size) size.value=Math.round(number(st.fontSize,16));
    if(color) color.value=rgbToHex(st.color);
  }

  function rgbToHex(value){
    const m=String(value).match(/\\d+/g);
    if(!m || m.length<3) return '#111111';
    return '#'+m.slice(0,3).map(function(n){
      return Math.max(0,Math.min(255,parseInt(n,10))).toString(16).padStart(2,'0');
    }).join('');
  }

  function clearHover(){
    if(hovered) hovered.removeAttribute('data-pn-editable-hover');
    hovered=null;
  }

  function clearNativeSelection(){
    const sel=window.getSelection&&window.getSelection();
    if(sel) sel.removeAllRanges();
  }

  function ensureGuides(){
    let gx=document.getElementById('pn-align-x');
    let gy=document.getElementById('pn-align-y');

    if(!gx){
      gx=document.createElement('div');
      gx.id='pn-align-x';
      document.body.appendChild(gx);
    }

    if(!gy){
      gy=document.createElement('div');
      gy.id='pn-align-y';
      document.body.appendChild(gy);
    }

    return {x:gx,y:gy};
  }

  function hideGuides(){
    const guides=ensureGuides();
    guides.x.dataset.open='false';
    guides.y.dataset.open='false';
  }

  function isSection(el){
    return !!(el && el.matches && el.matches(sectionSelector));
  }

  function isSocial(el){
    return !!(el && el.matches && el.matches(socialSelector));
  }

  function snapPosition(el,left,top){
    try{
      const rect=el.getBoundingClientRect();
      const width=rect.width;
      const height=rect.height;
      const threshold=7;
      const guides=ensureGuides();
      let bestX=null;
      let bestY=null;

      const currentX=[left,left+width/2,left+width];
      const currentY=[top,top+height/2,top+height];

      document.querySelectorAll(editableSelector).forEach(function(other){
        if(!other || other===el || other.closest('#pn-edit-bar,#pn-edit-box') || other.offsetParent===null) return;

        const r=other.getBoundingClientRect();
        const ox=[r.left+scrollX,r.left+scrollX+r.width/2,r.left+scrollX+r.width];
        const oy=[r.top+scrollY,r.top+scrollY+r.height/2,r.top+scrollY+r.height];

        currentX.forEach(function(cx){
          ox.forEach(function(target){
            const diff=target-cx;
            if(Math.abs(diff)<=threshold && (!bestX || Math.abs(diff)<Math.abs(bestX.diff))){
              bestX={diff:diff,guide:target};
            }
          });
        });

        currentY.forEach(function(cy){
          oy.forEach(function(target){
            const diff=target-cy;
            if(Math.abs(diff)<=threshold && (!bestY || Math.abs(diff)<Math.abs(bestY.diff))){
              bestY={diff:diff,guide:target};
            }
          });
        });
      });

      if(bestX){
        left+=bestX.diff;
        guides.y.style.left=px(bestX.guide-scrollX);
        guides.y.dataset.open='true';
      }else{
        guides.y.dataset.open='false';
      }

      if(bestY){
        top+=bestY.diff;
        guides.x.style.top=px(bestY.guide-scrollY);
        guides.x.dataset.open='true';
      }else{
        guides.x.dataset.open='false';
      }

      return {left:left,top:top};
    }catch(error){
      return {left:left,top:top};
    }
  }

  function selectSectionFromCurrent(){
    const base=selected || hovered;
    const section=base && base.closest ? base.closest(sectionSelector) : null;
    if(!section) return;
    section.dataset.pnSection='true';
    select(section);
  }
  function clearSelection(){
    if(selected) selected.removeAttribute('data-pn-selected');
    selected=null;
    updateTools();
  }

  function select(el){
    if(!el || el.closest('#pn-edit-bar,#pn-edit-box,script,style')) return;
    if(selected && selected!==el) selected.removeAttribute('data-pn-selected');
    selected=el;
    selected.setAttribute('data-pn-selected','true');
    updateTools();
  }

  function nearestCard(el){
    return el ? el.closest(cardSelector) : null;
  }

  function selectCardFromCurrent(){
    const card=nearestCard(selected || hovered);
    if(card) select(card);
  }

  function ensureMovable(el){
    if(!el) return el;
    if(el.dataset.pnDivider==='true' || el.dataset.pnFreeText==='true' || el.dataset.pnGhost==='true') return el;

    const rect=el.getBoundingClientRect();
    const ghost=el.cloneNode(true);
    const id=makeId();

    ghost.dataset.pnId=id;
    ghost.dataset.pnGhost='true';
    ghost.dataset.pnSourceSelector=cssPath(el);
    ghost.dataset.pnMovable='true';

    ghost.style.setProperty('position','absolute','important');
    ghost.style.setProperty('left',px(rect.left+scrollX),'important');
    ghost.style.setProperty('top',px(rect.top+scrollY),'important');
    ghost.style.setProperty('width',px(rect.width),'important');
    ghost.style.setProperty('min-height',px(Math.max(24,rect.height)),'important');
    ghost.style.setProperty('height',px(rect.height),'important');
    ghost.style.setProperty('z-index','999','important');
    ghost.style.setProperty('box-sizing','border-box','important');
    ghost.style.setProperty('overflow','visible','important');
    ghost.style.setProperty('resize','none','important');
    ghost.style.setProperty('margin','0','important');

    el.style.setProperty('visibility','hidden','important');
    el.dataset.pnHiddenSource='true';

    document.body.appendChild(ghost);
    select(ghost);
    return ghost;
  }

  function save(el){
    if(!el) return;

    const rect=el.getBoundingClientRect();
    const st=getComputedStyle(el);
    const isDivider=el.dataset.pnDivider==='true';
    const section=isSection(el);
    const source=el.dataset.pnSourceSelector || cssPath(el);

    const edit={
      selector: source,
      text: isDivider ? '' : (el.textContent || '').trim(),
      font: st.fontFamily || '',
      size: Math.round(number(st.fontSize,0)),
      color: st.color || '',
      x: Math.round(rect.left+scrollX),
      y: Math.round(rect.top+scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      movable: !section && (el.dataset.pnMovable==='true' || el.dataset.pnFreeText==='true' || el.dataset.pnGhost==='true' || isDivider),
      kind: isDivider ? 'divider' : (section ? 'section' : (isSocial(el) ? 'social' : (el.matches(cardSelector) ? 'card' : 'text')))
    };

    parent.postMessage({type:'pagenova-live-edit',key:KEY,edit:edit},'*');
  }

  function addText(){
    const el=document.createElement('div');
    el.dataset.pnId=makeId();
    el.dataset.pnFreeText='true';
    el.dataset.pnMovable='true';
    el.contentEditable='true';
    el.textContent='Novo texto';

    el.style.setProperty('position','absolute','important');
    el.style.setProperty('left',px(scrollX+innerWidth/2-120),'important');
    el.style.setProperty('top',px(scrollY+innerHeight/2-30),'important');
    el.style.setProperty('width','240px','important');
    el.style.setProperty('min-height','42px','important');
    el.style.setProperty('font-size','22px','important');
    el.style.setProperty('font-weight','700','important');
    el.style.setProperty('color','#183028','important');
    el.style.setProperty('z-index','999','important');
    el.style.setProperty('box-sizing','border-box','important');
    el.style.setProperty('overflow','visible','important');

    document.body.appendChild(el);
    select(el);
    save(el);
  }

  function addDivider(){
    const el=document.createElement('div');
    el.dataset.pnId=makeId();
    el.dataset.pnDivider='true';
    el.dataset.pnMovable='true';
    el.className='pn-live-divider';

    el.style.setProperty('position','absolute','important');
    el.style.setProperty('left',px(scrollX+innerWidth/2-130),'important');
    el.style.setProperty('top',px(scrollY+innerHeight/2),'important');
    el.style.setProperty('width','260px','important');
    el.style.setProperty('height','2px','important');
    el.style.setProperty('z-index','999','important');

    document.body.appendChild(el);
    select(el);
    save(el);
  }

  function setHeaderLayout(layout){
    const header=document.querySelector('header');
    if(!header) return;

    header.dataset.pnHeaderLayout=layout;

    const brand=header.querySelector('.brand,[class*=brand],[class*=logo],[class*=Logo],a,h1,h2,strong,span');
    if(brand) brand.classList.add('pn-brand-logo');

    let toggle=header.querySelector('.pn-menu-toggle');
    if(layout==='center' && !toggle){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='pn-menu-toggle';
      toggle.innerHTML='<span></span><span></span><span></span>';
      header.insertBefore(toggle,header.firstChild);
    }

    parent.postMessage({
      type:'pagenova-live-edit',
      key:KEY,
      edit:{selector:cssPath(header),text:'',font:'',size:0,color:'',headerLayout:layout}
    },'*');
  }

  function applyHeader(edit){
    const header=bySelector(edit.selector) || document.querySelector('header');
    if(!header || !edit.headerLayout) return;
    header.dataset.pnHeaderLayout=edit.headerLayout;

    const brand=header.querySelector('.brand,[class*=brand],[class*=logo],[class*=Logo],a,h1,h2,strong,span');
    if(brand) brand.classList.add('pn-brand-logo');

    if(edit.headerLayout==='center' && !header.querySelector('.pn-menu-toggle')){
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='pn-menu-toggle';
      btn.innerHTML='<span></span><span></span><span></span>';
      header.insertBefore(btn,header.firstChild);
    }
  }

  function createFromEdit(edit){
    let el=null;

    if(edit.kind==='divider'){
      el=document.createElement('div');
      el.dataset.pnDivider='true';
      el.className='pn-live-divider';
    }else{
      el=document.createElement('div');
      el.dataset.pnFreeText='true';
      el.textContent=edit.text || 'Novo texto';
    }

    const id=(String(edit.selector).match(/data-pn-id="([^"]+)"/)||[])[1] || makeId();
    el.dataset.pnId=id;
    el.dataset.pnMovable='true';
    document.body.appendChild(el);
    return el;
  }

  function applyEdit(edit){
    if(edit.headerLayout) return applyHeader(edit);

    let el=bySelector(edit.selector);

    if(!el && String(edit.selector).includes('data-pn-id=')){
      el=createFromEdit(edit);
    }

    if(!el) return;

    if(edit.movable && !el.dataset.pnFreeText && !el.dataset.pnDivider && !el.dataset.pnGhost){
      const ghost=ensureMovable(el);
      ghost.dataset.pnSourceSelector=edit.selector;
      el=ghost;
    }

    if(edit.text && edit.kind!=='divider') el.textContent=edit.text;
    if(edit.font) el.style.setProperty('font-family',edit.font,'important');
    if(edit.size) el.style.setProperty('font-size',edit.size+'px','important');
    if(edit.color) el.style.setProperty('color',edit.color,'important');

    if(edit.kind==='section'){
      el.dataset.pnSection='true';
      if(Number.isFinite(edit.height)) el.style.setProperty('min-height',Math.max(40,edit.height)+'px','important');
      if(Number.isFinite(edit.height)) el.style.setProperty('height',Math.max(40,edit.height)+'px','important');
    }

    if(edit.movable){
      el.dataset.pnMovable='true';
      el.style.setProperty('position','absolute','important');
      if(Number.isFinite(edit.x)) el.style.setProperty('left',edit.x+'px','important');
      if(Number.isFinite(edit.y)) el.style.setProperty('top',edit.y+'px','important');
      if(Number.isFinite(edit.width)) el.style.setProperty('width',Math.max(16,edit.width)+'px','important');
      if(Number.isFinite(edit.height)) el.style.setProperty('height',Math.max(2,edit.height)+'px','important');
      el.style.setProperty('z-index','999','important');
      el.style.setProperty('box-sizing','border-box','important');
      el.style.setProperty('overflow','visible','important');
      el.style.setProperty('resize','none','important');
      el.style.setProperty('margin','0','important');
    }
  }

  edits.forEach(applyEdit);

  document.addEventListener('mouseover',function(event){
    if(event.target.closest('#pn-edit-bar,#pn-edit-box,script,style')) return;
    const social=event.target.closest(socialSelector);
      const el=social || event.target.closest(editableSelector);
    if(!el || el.closest('nav')) return;
    if(hovered && hovered!==el) hovered.removeAttribute('data-pn-editable-hover');
    hovered=el;
    hovered.setAttribute('data-pn-editable-hover','true');
  },true);

  document.addEventListener('mouseout',function(event){
    if(!hovered) return;
    if(event.relatedTarget && hovered.contains(event.relatedTarget)) return;
    clearHover();
  },true);

  document.addEventListener('click',function(event){
    if(event.target.closest('#pn-edit-bar,#pn-edit-box')) return;

    const social=event.target.closest(socialSelector);
    const text=event.target.closest(textSelector);
    const divider=event.target.closest('[data-pn-divider=true]');
    const card=event.target.closest(cardSelector);
    const el=social || divider || text || card;

    if(!el || el.closest('script,style')) return;

    event.preventDefault();
    event.stopPropagation();
    select(el);
  },true);

  document.addEventListener('pointerdown',function(event){
    if(event.target.closest('#pn-edit-bar,#pn-edit-box,input,textarea,select')) return;

    const social=event.target.closest(socialSelector);
      const el=social || event.target.closest(editableSelector);
    if(!el || el.closest('script,style,nav')) return;

    event.preventDefault();
      clearNativeSelection();
      pendingDrag={
      el:el,
      startX:event.clientX,
      startY:event.clientY,
      active:false
    };
  },true);

  document.addEventListener('pointermove',function(event){
    if(activeResize){
      event.preventDefault();

      const r=activeResize;
      const dx=event.clientX-r.startX;
      const dy=event.clientY-r.startY;
      let left=r.left;
      let top=r.top;
      let width=r.width;
      let height=r.height;

      if(r.dir.includes('e')) width=r.width+dx;
      if(r.dir.includes('s')) height=r.height+dy;
      if(r.dir.includes('w')){width=r.width-dx;left=r.left+dx}
      if(r.dir.includes('n')){height=r.height-dy;top=r.top+dy}

      width=Math.max(24,width);
      height=Math.max(r.el.dataset.pnDivider==='true'?2:18,height);

      r.el.style.setProperty('left',px(left),'important');
      r.el.style.setProperty('top',px(top),'important');
      r.el.style.setProperty('width',px(width),'important');
      r.el.style.setProperty('height',px(height),'important');
      r.el.style.setProperty('min-height',px(height),'important');
      updateTools();
      return;
    }

    if(!pendingDrag) return;

    const moved=Math.abs(event.clientX-pendingDrag.startX)+Math.abs(event.clientY-pendingDrag.startY);
    if(moved < 4) return;

    event.preventDefault();
    event.stopPropagation();

    if(!pendingDrag.active){
      pendingDrag.el=ensureMovable(pendingDrag.el);
      const rect=pendingDrag.el.getBoundingClientRect();
      pendingDrag.left=rect.left+scrollX;
      pendingDrag.top=rect.top+scrollY;
      pendingDrag.active=true;
      document.body.classList.add('pn-is-dragging');
      clearNativeSelection();
      pendingDrag.el.dataset.pnDragging='true';
    }

    const snapped=snapPosition(pendingDrag.el,pendingDrag.left+event.clientX-pendingDrag.startX,pendingDrag.top+event.clientY-pendingDrag.startY);
    pendingDrag.el.style.setProperty('left',px(snapped.left),'important');
    pendingDrag.el.style.setProperty('top',px(snapped.top),'important');
    updateTools();
  },true);

  document.addEventListener('pointerup',function(){
    if(activeResize){
      save(activeResize.el);
      activeResize=null;
      hideGuides();
    }

    if(pendingDrag){
      if(pendingDrag.active){
        pendingDrag.el.removeAttribute('data-pn-dragging');
        document.body.classList.remove('pn-is-dragging');
        hideGuides();
        clearNativeSelection();
        save(pendingDrag.el);
      }
      document.body.classList.remove('pn-is-dragging');
      hideGuides();
      pendingDrag=null;
    }

    updateTools();
  },true);

  document.addEventListener('input',function(event){
    const el=event.target.closest('[contenteditable=true],[data-pn-free-text=true]');
    if(el) save(el);
  },true);

  window.addEventListener('scroll',updateTools,{passive:true});
  window.addEventListener('resize',updateTools);
})();
</script>`;

  return injectBeforeBody(html, css + script);
}
