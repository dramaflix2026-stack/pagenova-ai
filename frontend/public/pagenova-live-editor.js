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
      if (field === "size" && e.target.value) selected.style.setProperty("font-size", e.target.value + "px", "important");
      if (field === "color") selected.style.setProperty("color", e.target.value, "important");
      syncUi(); save();
    });

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
      size.value = parseInt(cs.fontSize, 10) || 16;
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

  function ensureMovable(el) {
    if (!el || el.dataset.pnGhost === "true" || el.dataset.pnFreeText === "true" || el.dataset.pnDivider === "true") return el;
    if (el.matches(sectionSel) || isResponsiveStructure(el)) return el;
    const r = el.getBoundingClientRect();
    const source = path(el);
    el.dataset.pnSourceHidden = "true";
    el.style.setProperty("visibility", "hidden", "important");
    const ghost = el.cloneNode(true);
    ghost.dataset.pnGhost = "true";
    ghost.dataset.pnSource = source;
    ghost.dataset.pnId = uid();
    ghost.removeAttribute("id");
    ghost.removeAttribute("data-pn-selected");
    ghost.style.setProperty("visibility", "visible", "important");
    ghost.style.setProperty("position", "absolute", "important");
    ghost.style.setProperty("left", px(r.left + scrollX), "important");
    ghost.style.setProperty("top", px(r.top + scrollY), "important");
    ghost.style.setProperty("width", px(r.width), "important");
    ghost.style.setProperty("height", px(r.height), "important");
    ghost.style.setProperty("z-index", "120", "important");
    ghost.style.setProperty("box-sizing", "border-box", "important");
    document.body.appendChild(ghost);
    return ghost;
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
      ghostId: selected.dataset.pnGhost === "true" ? selected.dataset.pnId : "",
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
    let el = edit.ghostId ? find('[data-pn-id="' + edit.ghostId + '"]') : source;
    if (!el && source && edit.movable) {
      el = ensureMovable(source);
      if (edit.ghostId) el.dataset.pnId = edit.ghostId;
    }
    if (!el) return;
    if (edit.text && el.matches(textSel)) el.textContent = edit.text;
    if (edit.font && el.matches(textSel)) el.style.setProperty("font-family", edit.font, "important");
    if (edit.size && el.matches(textSel)) el.style.setProperty("font-size", edit.size + "px", "important");
    if (edit.color && el.matches(textSel)) el.style.setProperty("color", edit.color, "important");
    if (edit.textAlign && el.matches(textSel)) el.style.setProperty("text-align", edit.textAlign, "important");
    if (edit.fontWeight && el.matches(textSel)) el.style.setProperty("font-weight", String(edit.fontWeight), "important");
    // Geometry is only restored when the user actually dragged an element.
    // Plain text edits also store their measured rectangle, but applying that
    // rectangle as absolute positioning destroys responsive grids on reload.
    const hasMovedGeometry =
      edit.kind !== "text" &&
      edit.movable &&
      !!edit.ghostId &&
      edit.left != null &&
      edit.top != null &&
      !isResponsiveStructure(source || el);
    if (hasMovedGeometry) {
      el.style.setProperty("position", "absolute", "important");
      el.style.setProperty("left", edit.left + "px", "important");
      el.style.setProperty("top", edit.top + "px", "important");
      if (edit.width) el.style.setProperty("width", edit.width + "px", "important");
      if (edit.height) el.style.setProperty("height", edit.height + "px", "important");
      el.style.setProperty("z-index", "120", "important");
    } else if (edit.kind === "text" && edit.width) {
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("width", edit.width + "px", "important");
    } else if (edit.kind === "section" && edit.height) {
      el.style.setProperty("min-height", Math.max(40, edit.height) + "px", "important");
    }
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

  function imagePlaceholder(target) {
    const direct = closest(target, "[data-pn-image-placeholder],.pn-image-placeholder,.image-placeholder,[data-pn-upload-kind]");
    if (direct) return direct;
    let node = target;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      if (node.id === "pn-edit-bar" || node.id === "pn-edit-box") return null;
      const text = (node.textContent || "").replace(/\\s+/g, " ").trim();
      if (/Foto\\s+(?:principal|do\\s+neg[oó]cio)/i.test(text) && text.length < 240) return node;
    }
    return null;
  }

  document.addEventListener("click", function(e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box")) return;
    const placeholder = imagePlaceholder(e.target);
    if (placeholder) {
      e.preventDefault(); e.stopPropagation();
      const label = placeholder.innerText || "";
      const kind = placeholder.dataset.pnUploadKind || (/neg[oó]cio/i.test(label) ? "work" : "hero");
      parent.postMessage({ type: "pagenova-image-upload-request", kind: kind }, "*");
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
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box") || closest(e.target, "input,textarea,select")) return;
    const el = candidate(e.target);
    if (!el) return;
    const wasSelected = selected === el;
    if (!wasSelected) select(el);
    if (!wasSelected || el.matches(sectionSel) || el.isContentEditable || isResponsiveStructure(el)) return;
    pending = { el: el, pointerId:e.pointerId, x:e.clientX, y:e.clientY, started:false };
    // Do not capture on the source: ensureMovable hides it and creates a ghost.
    // Pointer capture on a hidden source can cancel the gesture on Android.
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
        selected.style.setProperty("left",px(left),"important");
        selected.style.setProperty("top",px(top),"important");
        selected.style.setProperty("width",px(Math.max(32,width)),"important");
        selected.style.setProperty("height",px(Math.max(18,height)),"important");
      }
      syncUi(); return;
    }
    if (!pending || pending.pointerId !== e.pointerId) return;
    const moved=Math.abs(e.clientX-pending.x)+Math.abs(e.clientY-pending.y);
    if(moved<8&&!pending.started) return;
    e.preventDefault(); e.stopPropagation(); clearNativeSelection();
    if(!pending.started) {
      selected=ensureMovable(pending.el); select(selected);
      const r=selected.getBoundingClientRect();
      pending.left=r.left+scrollX; pending.top=r.top+scrollY; pending.started=true;
      document.body.classList.add("pn-is-dragging"); closeToolbar();
    }
    const left = pending.left + e.clientX - pending.x;
    const top = pending.top + e.clientY - pending.y;
    selected.style.setProperty("transform", "translate3d(" + px(left - pending.left) + "," + px(top - pending.top) + ",0)", "important");
    pending.finalLeft = left;
    pending.finalTop = top;
    selected.dataset.pnDragging="true";
    if (!pending.frame) pending.frame = requestAnimationFrame(function() { if (pending) pending.frame = 0; syncUi(); });
  }, true);

  document.addEventListener("pointerup", function() {
    if (pending && pending.started && selected) {
      selected.style.removeProperty("transform");
      selected.style.setProperty("left", px(pending.finalLeft ?? pending.left), "important");
      selected.style.setProperty("top", px(pending.finalTop ?? pending.top), "important");
    }
    if(resizing||(pending&&pending.started)) save();
    if(selected) selected.removeAttribute("data-pn-dragging");
    resizing=null; pending=null; document.body.classList.remove("pn-is-dragging"); hideGuides(); syncUi();
  }, true);

  window.addEventListener("scroll", syncUi, true);
  window.addEventListener("resize", syncUi);

  function updateUploadedImages(images) {
    if (!images) return;
    const mappings = [
      { kind: "hero", name: "Foto principal", src: images.portrait },
      { kind: "work", name: "Foto do negócio", src: images.businessPhoto || images.workPhoto }
    ];
    mappings.forEach(function(item) {
      if (!item.src || !item.src.startsWith("data:image/")) return;
      const nodes = Array.from(document.querySelectorAll("div,button,span"));
      nodes.forEach(function(node) {
        const ownText = Array.from(node.childNodes).filter(function(child) {
          return child.nodeType === Node.TEXT_NODE;
        }).map(function(child) { return child.textContent; }).join("").trim();
        const label = ownText || (node.children.length === 0 ? node.textContent.trim() : "");
        if (label !== item.name && !(item.kind === "work" && /Foto\s+do\s+neg[oó]cio/i.test(label))) return;
        const holder = imagePlaceholder(node) || node.parentElement;
        if (!holder) return;
        holder.dataset.pnUploadKind = item.kind;
        let picture = holder.querySelector('img[data-pn-uploaded="' + item.kind + '"]');
        if (!picture) {
          picture = document.createElement("img");
          picture.dataset.pnUploaded = item.kind;
          picture.alt = item.name;
          picture.style.cssText = "display:block;width:100%;min-height:220px;max-height:520px;object-fit:cover;border-radius:inherit";
          holder.replaceChildren(picture);
        }
        picture.src = item.src;
      });
      // Replacing the first placeholder removes its caption. Keep the target
      // identifiable on subsequent uploads through its stable data attribute.
      document.querySelectorAll('img[data-pn-uploaded="' + item.kind + '"]').forEach(function(img) {
        img.src = item.src;
      });
    });
  }
  window.addEventListener("message", function(event) {
    if (event.data?.type === "pagenova-user-images") updateUploadedImages(event.data.images);
  });
  makeUi();
  savedEdits.forEach(applyEdit);
  updateUploadedImages(cfg.images);
})();