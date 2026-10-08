(function () {
  const cfg = window.__PAGENOVA_LIVE_EDITOR__ || {};
  const KEY = cfg.key || "home";
  const savedEdits = Array.isArray(cfg.edits) ? cfg.edits : [];

  const textSel = "h1,h2,h3,h4,h5,h6,p,li,blockquote,small,strong,a,span,button,[data-pn-free-text=true]";
  const cardSel = "article,[class*='card'],[class*='Card'],.service-card,.servico-card,.feature-card,.benefit-card,.step-card,.process-card,.metodo-card,.solution-card";
  const sectionSel = "section,.section,[class*='section'],[class*='Section']";
  const socialSel = ".social-links,[class*='social-links'],[class*='socialLinks']";
  const imageSel = "img,picture";
  const editSel = textSel + "," + cardSel + "," + sectionSel + "," + socialSel + "," + imageSel + ",[data-pn-divider=true],[data-pn-ghost=true]";

  let selected = null;
  let pending = null;
  let resizing = null;
  let toolbarOpen = false;
  let lastTap = { el: null, at: 0 };
  let textSaveTimer = null;

  function px(v) { return Math.round(v) + "px"; }
  function uid() { return "pn-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function closest(t, s) { try { return t && t.closest ? t.closest(s) : null; } catch (_) { return null; } }
  function clearNativeSelection() { const s = window.getSelection && window.getSelection(); if (s) s.removeAllRanges(); }
  function find(selector) { try { return document.querySelector(selector); } catch (_) { return null; } }

  function path(el) {
    if (!el || !el.tagName) return "";
    if (el.dataset && el.dataset.pnId) return '[data-pn-id="' + el.dataset.pnId + '"]';
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      let p = el.tagName.toLowerCase();
      if (el.id) { p += "#" + el.id; parts.unshift(p); break; }
      let i = 1, s = el;
      while ((s = s.previousElementSibling)) if (s.tagName === el.tagName) i++;
      p += ":nth-of-type(" + i + ")";
      parts.unshift(p);
      el = el.parentElement;
    }
    return parts.join(">");
  }

  function hex(color) {
    if (/^#[0-9a-f]{6}$/i.test(String(color || ""))) return String(color);
    const m = String(color || "").match(/\d+/g);
    if (!m || m.length < 3) return "#111111";
    return "#" + m.slice(0, 3).map(function(n) {
      return Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0");
    }).join("");
  }

  function candidate(target) {
    if (closest(target, "#pn-edit-bar,#pn-edit-box")) return null;
    const image = closest(target, imageSel);
    if (image) return image;
    const social = closest(target, socialSel);
    if (social) return social;
    const text = closest(target, textSel);
    if (text) return text;
    const card = closest(target, cardSel);
    if (card) return card;
    return closest(target, sectionSel + ",[data-pn-divider=true],[data-pn-ghost=true]");
  }

  function makeUi() {
    if (document.getElementById("pn-edit-bar")) return;

    const bar = document.createElement("div");
    bar.id = "pn-edit-bar";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML =
      '<button type="button" data-act="bold" title="Negrito"><b>B</b></button>' +
      '<button type="button" data-act="align-left" title="Alinhar à esquerda">≡</button>' +
      '<button type="button" data-act="align-center" title="Centralizar">≣</button>' +
      '<button type="button" data-act="align-right" title="Alinhar à direita">≡</button>' +
      '<select data-field="font" title="Fonte"><option value="Poppins">Poppins</option><option value="Inter">Inter</option><option value="Montserrat">Montserrat</option><option value="Roboto">Roboto</option><option value="Open Sans">Open Sans</option><option value="Lato">Lato</option><option value="Nunito">Nunito</option><option value="Raleway">Raleway</option><option value="DM Sans">DM Sans</option><option value="Manrope">Manrope</option><option value="Playfair Display">Playfair Display</option><option value="Merriweather">Merriweather</option><option value="Oswald">Oswald</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option></select>' +
      '<input data-field="size" type="number" min="10" max="120" inputmode="numeric" aria-label="Tamanho">' +
      '<input data-field="color" type="color" value="#111111" aria-label="Cor">' +
      '<button type="button" data-act="close" title="Fechar">×</button>';
    document.body.appendChild(bar);

    const box = document.createElement("div");
    box.id = "pn-edit-box";
    box.innerHTML = '<i data-h="nw"></i><i data-h="n"></i><i data-h="ne"></i><i data-h="e"></i><i data-h="se"></i><i data-h="s"></i><i data-h="sw"></i><i data-h="w"></i>';
    document.body.appendChild(box);

    const gx = document.createElement("div"); gx.id = "pn-align-x";
    const gy = document.createElement("div"); gy.id = "pn-align-y";
    document.body.append(gx, gy);

    bar.addEventListener("input", function(e) {
      if (!selected || !selected.matches(textSel)) return;
      const field = e.target.dataset.field;
      if (field === "font" && e.target.value) selected.style.setProperty("font-family", e.target.value, "important");
      if (field === "size") return; // Commit only when the user finishes editing the number.
      if (field === "color") selected.style.setProperty("color", e.target.value, "important");
      syncUi(); save();
    });

    const fontSizeInput = bar.querySelector('[data-field="size"]');
    function commitFontSize() {
      if (!selected || !selected.matches(textSel)) return;
      const value = Number(fontSizeInput.value);
      if (!Number.isFinite(value) || value < 10 || value > 120) return;
      selected.style.setProperty("font-size", value + "px", "important");
      save();
      syncUi();
    }
    fontSizeInput.addEventListener("change", commitFontSize);
    fontSizeInput.addEventListener("blur", commitFontSize);

    bar.addEventListener("click", function(e) {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act || !selected) return;
      e.preventDefault(); e.stopPropagation();
      if (act === "close") { closeToolbar(); return; }
      if (!selected.matches(textSel)) return;
      if (act === "bold") {
        const weight = parseInt(getComputedStyle(selected).fontWeight, 10) || 400;
        selected.style.setProperty("font-weight", weight >= 600 ? "400" : "700", "important");
      }
      if (act.indexOf("align-") === 0) selected.style.setProperty("text-align", act.replace("align-", ""), "important");
      syncUi(); save();
    });

    box.addEventListener("pointerdown", function(e) {
      const h = e.target.dataset.h;
      if (!h || !selected) return;
      e.preventDefault(); e.stopPropagation(); clearNativeSelection();
      const r = selected.getBoundingClientRect();
      resizing = { h: h, pointerId: e.pointerId, x: e.clientX, y: e.clientY, left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height, section: selected.matches(sectionSel) };
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    }, true);
  }

  function closeToolbar() {
    clearTimeout(textSaveTimer);
    toolbarOpen = false;
    const bar = document.getElementById("pn-edit-bar");
    if (bar) { bar.dataset.open = "false"; bar.setAttribute("aria-hidden", "true"); }
    if (selected && selected.isContentEditable) {
      selected.contentEditable = "false";
      save();
    }
  }

  function openToolbar(el) {
    if (!el || !el.matches(textSel)) return;
    select(el);
    toolbarOpen = true;
    el.contentEditable = "true";
    const bar = document.getElementById("pn-edit-bar");
    bar.dataset.open = "true";
    bar.setAttribute("aria-hidden", "false");
    syncUi();
    try { el.focus({ preventScroll: true }); } catch (_) {}
  }

  function syncUi() {
    const box = document.getElementById("pn-edit-box");
    const bar = document.getElementById("pn-edit-bar");
    if (!box) return;
    if (!selected || !document.documentElement.contains(selected)) {
      box.dataset.open = "false";
      if (bar) bar.dataset.open = "false";
      return;
    }
    const r = selected.getBoundingClientRect();
    box.dataset.open = "true";
    box.style.left = px(r.left - 3);
    box.style.top = px(r.top - 3);
    box.style.width = px(r.width + 6);
    box.style.height = px(r.height + 6);

    if (toolbarOpen && bar) {
      const cs = getComputedStyle(selected);
      const font = bar.querySelector('[data-field="font"]');
      const size = bar.querySelector('[data-field="size"]');
      const color = bar.querySelector('[data-field="color"]');
      const family = cs.fontFamily.split(",")[0].replaceAll('"', "").trim();
      if ([].some.call(font.options, function(o) { return o.value === family; })) font.value = family;
      if (document.activeElement !== size) size.value = parseInt(cs.fontSize, 10) || 16;
      color.value = hex(cs.color);
      const bw = Math.min(bar.offsetWidth || 360, innerWidth - 16);
      const left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2));
      const preferredTop = r.top - (bar.offsetHeight || 48) - 10;
      const top = preferredTop >= 8 ? preferredTop : Math.min(innerHeight - (bar.offsetHeight || 48) - 8, r.bottom + 10);
      bar.style.left = px(left);
      bar.style.top = px(top);
    }
  }

  function deselect() {
    closeToolbar();
    document.querySelectorAll("[data-pn-selected=true]").forEach(function(x) { x.removeAttribute("data-pn-selected"); });
    selected = null;
    syncUi();
  }

  function select(el) {
    makeUi();
    if (!el) return;
    if (selected && selected !== el && selected.isContentEditable) {
      save();
      selected.contentEditable = "false";
    }
    document.querySelectorAll("[data-pn-selected=true]").forEach(function(x) { x.removeAttribute("data-pn-selected"); });
    selected = el;
    selected.dataset.pnSelected = "true";
    if (!selected.dataset.pnSource && selected.dataset.pnGhost !== "true") selected.dataset.pnSource = path(selected);
    if (!selected.dataset.pnId) selected.dataset.pnId = uid();
    syncUi();
  }

  function isResponsiveStructure(el) {
    return !!closest(
      el,
      ".pn001-final-cta,.pn001-final-cta-card,.pn001-final-cta-copy,.pn001-final-cta-action,.pn001-footer,.pn001-footer-main,.pn001-footer-brand-column,.pn001-footer-column,.pn001-footer-bottom"
    );
  }

  // Keep the real DOM node in flow. Cloning/hiding it interrupted touch events
  // and detached image-upload targets from the live preview.
  function ensureMovable(el) { return el; }
  function baseTransform(el) {
    return el.dataset.pnBaseTransform !== undefined ? el.dataset.pnBaseTransform : (el.dataset.pnBaseTransform = getComputedStyle(el).transform === "none" ? "" : getComputedStyle(el).transform);
  }
  function moveElement(el, x, y) {
    el.dataset.pnOffsetX = String(x);
    el.dataset.pnOffsetY = String(y);
    const base = baseTransform(el);
    el.style.setProperty("transform", (base ? base + " " : "") + "translate3d(" + x + "px," + y + "px,0)", "important");
  }
  function paintUi() {
    if (paintUi.frame) return;
    paintUi.frame = requestAnimationFrame(function() { paintUi.frame = 0; syncUi(); });
  }

  function save() {
    if (!selected) return;
    const r = selected.getBoundingClientRect();
    const isSection = selected.matches(sectionSel);
    const isText = selected.matches(textSel);
    const isImage = selected.matches(imageSel) || !!selected.querySelector?.("img");
    const cs = getComputedStyle(selected);
    const edit = {
      selector: selected.dataset.pnSource || path(selected),
      ghostId: "",
      offsetX: Number(selected.dataset.pnOffsetX || 0),
      offsetY: Number(selected.dataset.pnOffsetY || 0),
      text: isText ? selected.textContent.trim() : "",
      font: isText ? cs.fontFamily.split(",")[0].replaceAll('"', "").trim() : "",
      size: isText ? Math.max(10, Math.min(120, parseFloat(cs.fontSize) || 16)) : 16,
      color: isText ? hex(cs.color) : "#111111",
      left: Math.round(r.left + scrollX),
      top: Math.round(r.top + scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
      movable: !isSection,
      kind: isImage ? "image" : (selected.dataset.pnDivider === "true" ? "divider" : (isSection ? "section" : (selected.matches(cardSel) || selected.matches(socialSel) ? "card" : "text"))),
      textAlign: isText ? (cs.textAlign === "center" || cs.textAlign === "right" ? cs.textAlign : "left") : undefined,
      fontWeight: isText ? (parseInt(cs.fontWeight, 10) || 400) : undefined
    };
    parent.postMessage({ type: "pagenova-live-edit", key: KEY, edit: edit }, "*");
  }

  function applyEdit(edit) {
    const source = find(edit.selector);
    const el = source;
    if (!el) return;
    if (edit.text && el.matches(textSel)) el.textContent = edit.text;
    if (edit.font && el.matches(textSel)) el.style.setProperty("font-family", edit.font, "important");
    if (edit.size && el.matches(textSel)) el.style.setProperty("font-size", edit.size + "px", "important");
    if (edit.color && el.matches(textSel)) el.style.setProperty("color", edit.color, "important");
    if (edit.textAlign && el.matches(textSel)) el.style.setProperty("text-align", edit.textAlign, "important");
    if (edit.fontWeight && el.matches(textSel)) el.style.setProperty("font-weight", String(edit.fontWeight), "important");
    if (Number.isFinite(edit.offsetX) && Number.isFinite(edit.offsetY) && (edit.offsetX || edit.offsetY)) {
      moveElement(el, edit.offsetX, edit.offsetY);
    } else if (edit.ghostId && edit.left != null && edit.top != null) {
      // Migrate legacy ghost edits without recreating a hidden source.
      const rect = el.getBoundingClientRect();
      moveElement(el, edit.left - rect.left - scrollX, edit.top - rect.top - scrollY);
    }
    if (edit.width && edit.width > 0 && edit.kind !== "section") {
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("width", edit.width + "px", "important");
    }
    if (edit.kind === "section" && edit.height) el.style.setProperty("min-height", Math.max(40, edit.height) + "px", "important");
    if (edit.kind !== "text" && edit.kind !== "section" && edit.height) el.style.setProperty("min-height", Math.max(18, edit.height) + "px", "important");
  }

  // Guides are visual-only. Scanning every editable node on every pointer
  // movement caused frame drops and magnetic jumps on mobile.
  function guidesFor(el, left, top) {
    return { left: left, top: top };
  }
  function hideGuides() {
    const gx=document.getElementById("pn-align-x"), gy=document.getElementById("pn-align-y");
    if(gx) gx.dataset.open="false"; if(gy) gy.dataset.open="false";
  }

  function photoKindFromText(text) {
    const normalized=String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ");
    if(normalized.includes("foto do negocio"))return "work";
    if(normalized.includes("foto principal"))return "hero";
    return "";
  }
  function imagePlaceholder(target) {
    // Only the actual photo slot may open the picker. Never climb through
    // unrelated text blocks or assign upload markers to their ancestors.
    return closest(target, "[data-pn-photo-slot],[data-pn-image-placeholder],.pn-image-placeholder,.image-placeholder");
  }
  function uploadKind(holder) {
    return holder.dataset.pnUploadKind || holder.dataset.pnPhotoSlot ||
      photoKindFromText(holder.textContent || holder.getAttribute("aria-label")) || "hero";
  }
  function imageCard(target) {
    const direct=imagePlaceholder(target);
    if(direct)return direct;
    // Before the first upload the generated HTML has no slot marker. Locate
    // the label itself, then restrict its clickable area to its small frame.
    let node=target;
    for(let depth=0;node&&depth<3;depth++,node=node.parentElement) {
      if(node.nodeType!==1||node.matches("section,article,main,body"))break;
      const label=(node.textContent||"").trim();
      if(label.length>90||!photoKindFromText(label))continue;
      let frame=node;
      for(let i=0;i<4&&frame.parentElement;i++) {
        const parent=frame.parentElement;
        if(parent.matches("section,article,main,body"))break;
        const rect=parent.getBoundingClientRect();
        if(rect.height>560||rect.width<120)break;
        frame=parent;
        const style=getComputedStyle(frame);
        if(style.borderTopStyle!=="none"||style.borderBottomStyle!=="none")break;
      }
      frame.dataset.pnPhotoSlot=photoKindFromText(label);
      frame.dataset.pnUploadKind=photoKindFromText(label);
      return frame;
    }
    return null;
  }
  // The picker must open inside the original user click. A postMessage to
  // the parent loses transient user activation on mobile Chrome.
  const photoInput=document.createElement("input");
  photoInput.type="file";
  photoInput.accept="image/png,image/jpeg,image/webp";
  photoInput.setAttribute("aria-label","Enviar foto");
  photoInput.style.cssText="position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0";
  document.body.appendChild(photoInput);
  let requestedPhotoKind="hero";
  photoInput.addEventListener("change",function() {
    const file=photoInput.files&&photoInput.files[0];
    if(!file)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5*1024*1024) {
      parent.postMessage({type:"pagenova-image-upload-error",message:"Envie PNG, JPG ou WebP de até 5 MB."},"*");
      photoInput.value="";return;
    }
    const reader=new FileReader();
    reader.onload=function() {
      if(typeof reader.result==="string")parent.postMessage({type:"pagenova-image-upload-file",kind:requestedPhotoKind,dataUrl:reader.result},"*");
      photoInput.value="";
    };
    reader.onerror=function(){parent.postMessage({type:"pagenova-image-upload-error",message:"Não foi possível ler a imagem."},"*");photoInput.value="";};
    reader.readAsDataURL(file);
  });
  function requestUpload(e) {
    if(closest(e.target,"#pn-edit-bar,#pn-edit-box")) return false;
    const holder=imageCard(e.target);
    if(!holder)return false;
    e.preventDefault();e.stopPropagation();
    requestedPhotoKind=uploadKind(holder);
    photoInput.click();
    return true;
  }

  document.addEventListener("click", function(e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box")) return;
    const card=imageCard(e.target);
    if(card) {
      const now=Date.now();
      const doubleTap=lastTap.el===card&&now-lastTap.at<450;
      lastTap={el:card,at:now};
      if(doubleTap)requestUpload(e);
      return;
    }
    const el = candidate(e.target);
    if (!el) { deselect(); return; }
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    const doubleTap = lastTap.el === el && now - lastTap.at < 420;
    lastTap = { el: el, at: now };
    select(el);
    if (doubleTap && el.matches(textSel)) openToolbar(el);
    else if (toolbarOpen && selected !== el) closeToolbar();
  }, true);

  document.addEventListener("dblclick", function(e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box")) return;
    if (imageCard(e.target)) { requestUpload(e); return; }
    const el = candidate(e.target);
    if (!el || !el.matches(textSel)) return;
    e.preventDefault(); e.stopPropagation(); openToolbar(el);
  }, true);

  document.addEventListener("input", function(e) {
    // Keep the editing session entirely inside the iframe while the user types.
    // Persisting on every keystroke makes React rebuild srcDoc and destroys
    // contentEditable/focus, which feels like the editor is kicking the user out.
    if (selected && e.target === selected && selected.isContentEditable) {
      syncUi();
      // Persist while typing without replacing the iframe or losing the caret.
      clearTimeout(textSaveTimer);
      textSaveTimer = setTimeout(function() {
        if (selected && selected.isContentEditable) save();
      }, 650);
    }
  }, true);

  document.addEventListener("keydown", function(e) {
    if (!selected || e.target !== selected || !selected.isContentEditable) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeToolbar();
      selected.blur();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      closeToolbar();
      selected.blur();
    }
  }, true);

  document.addEventListener("pointerdown", function(e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box") || closest(e.target, "input,textarea,select") || imageCard(e.target)) return;
    const el = candidate(e.target);
    if (!el) return;
    const wasSelected = selected === el;
    if (!wasSelected) select(el);
    if (!wasSelected || el.matches(sectionSel) || el.isContentEditable || isResponsiveStructure(el)) return;
    pending = { el: el, pointerId:e.pointerId, x:e.clientX, y:e.clientY, started:false };
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  }, true);

  document.addEventListener("pointermove", function(e) {
    if (resizing && selected) {
      if (resizing.pointerId !== e.pointerId) return;
      e.preventDefault(); clearNativeSelection();
      const dx=e.clientX-resizing.x, dy=e.clientY-resizing.y;
      if (selected.matches(textSel)) {
        // Text must remain in document flow; resizing its box with absolute
        // coordinates can hide the text completely on narrow mobile screens.
        selected.style.setProperty("max-width", "100%", "important");
        const delta = resizing.h.includes("w") ? -dx : resizing.h.includes("e") ? dx : 0;
        const limit = Math.max(100, Math.min(document.documentElement.clientWidth - 24, selected.parentElement?.clientWidth || innerWidth));
        selected.style.setProperty("width", Math.max(100, Math.min(resizing.width + delta, limit)) + "px", "important");
        selected.style.removeProperty("height");
        selected.style.removeProperty("overflow");
      } else if (resizing.section) {
        selected.style.setProperty("min-height", Math.max(80,resizing.height+dy)+"px","important");
      } else {
        let left=resizing.left, top=resizing.top, width=resizing.width, height=resizing.height;
        if(resizing.h.includes("e")) width+=dx;
        if(resizing.h.includes("s")) height+=dy;
        if(resizing.h.includes("w")) { left+=dx; width-=dx; }
        if(resizing.h.includes("n")) { top+=dy; height-=dy; }
        // Resizing in-flow nodes must not write absolute left/top coordinates.
        selected.style.setProperty("width",px(Math.max(32,width)),"important");
        selected.style.setProperty("min-height",px(Math.max(18,height)),"important");
      }
      paintUi(); return;
    }
    if (!pending || pending.pointerId !== e.pointerId) return;
    const moved=Math.abs(e.clientX-pending.x)+Math.abs(e.clientY-pending.y);
    if(moved<8&&!pending.started) return;
    e.preventDefault(); e.stopPropagation(); clearNativeSelection();
    if(!pending.started) {
      pending.started=true;
      pending.offsetX=Number(pending.el.dataset.pnOffsetX||0);
      pending.offsetY=Number(pending.el.dataset.pnOffsetY||0);
      document.body.classList.add("pn-is-dragging");
      closeToolbar();
    }
    moveElement(pending.el, pending.offsetX+e.clientX-pending.x, pending.offsetY+e.clientY-pending.y);
    pending.el.dataset.pnDragging="true";
    paintUi();
  }, true);

  function finishGesture(e) {
    if (e && resizing && resizing.pointerId !== e.pointerId && (!pending || pending.pointerId !== e.pointerId)) return;
    if (resizing || (pending && pending.started)) save();
    if (selected) selected.removeAttribute("data-pn-dragging");
    resizing=null; pending=null;
    document.body.classList.remove("pn-is-dragging");
    hideGuides(); paintUi();
  }
  document.addEventListener("pointerup", finishGesture, true);
  document.addEventListener("pointercancel", finishGesture, true);

  window.addEventListener("scroll", syncUi, true);
  window.addEventListener("resize", syncUi);

  function imageSlotFor(kind) {
    const existing=document.querySelector('[data-pn-photo-slot="'+kind+'"]');
    if(existing)return existing;
    const candidates=Array.from(document.querySelectorAll("div,span,p,button"))
      .filter(function(node) {
        const text=(node.textContent||"").trim();
        return text.length<80&&photoKindFromText(text)===kind;
      });
    for(const label of candidates) {
      let node=label;
      for(let i=0;i<6&&node;i++,node=node.parentElement) {
        if(node===document.body||node.matches("section,article,main"))break;
        const rect=node.getBoundingClientRect();
        if(rect.width<130||rect.height<100||rect.height>560)continue;
        const css=getComputedStyle(node);
        const framed=css.borderTopStyle!=="none"||css.borderBottomStyle!=="none"||
          css.borderLeftStyle!=="none"||css.borderRightStyle!=="none";
        if(framed)return node;
      }
    }
    return null;
  }
  function updateUploadedImages(images) {
    if(!images)return;
    [{kind:"hero",src:images.portrait},{kind:"work",src:images.businessPhoto||images.workPhoto}].forEach(function(item) {
      if(!item.src||!item.src.startsWith("data:image/"))return;
      const slot=imageSlotFor(item.kind);
      if(!slot)return;
      slot.dataset.pnPhotoSlot=item.kind;
      slot.dataset.pnUploadKind=item.kind;
      let img=slot.querySelector('img[data-pn-uploaded="'+item.kind+'"]');
      if(!img) {
        // Preserve the original placeholder and layout. Only conceal its
        // decorative contents, never replace the card or section children.
        Array.from(slot.children).forEach(function(child) {
          if(child.dataset.pnUploaded)return;
          child.style.setProperty("display","none","important");
        });
        img=document.createElement("img");
        img.dataset.pnUploaded=item.kind;
        img.alt=item.kind==="hero"?"Foto principal":"Foto do negócio";
        slot.appendChild(img);
      }
      // The uploaded photo defines the slot's height, rather than the
      // placeholder's fixed height. Keep the original width and page flow.
      slot.style.setProperty("position","relative");
      slot.style.setProperty("overflow","hidden");
      slot.style.setProperty("height","auto","important");
      slot.style.setProperty("min-height","0","important");
      slot.style.setProperty("max-height","none","important");
      slot.style.setProperty("aspect-ratio","auto","important");
      slot.style.setProperty("padding","0","important");
      img.style.cssText="display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:none!important;min-height:0!important;object-fit:contain!important;aspect-ratio:auto!important;border-radius:inherit";
      img.src=item.src;
    });
  }
  window.addEventListener("message", function(event) {
    if (event.data?.type === "pagenova-user-images") updateUploadedImages(event.data.images);
  });
  makeUi();
  savedEdits.forEach(applyEdit);
  updateUploadedImages(cfg.images);
})();