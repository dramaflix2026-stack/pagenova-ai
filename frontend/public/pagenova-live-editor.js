(function () {
  const cfg = window.__PAGENOVA_LIVE_EDITOR__ || {};
  const KEY = cfg.key || "home";
  const savedEdits = Array.isArray(cfg.edits) ? cfg.edits : [];

  const textSel = "h1,h2,h3,h4,h5,h6,p,li,blockquote,small,strong,a,button,[data-pn-free-text=true]";
  const cardSel = "article,[class*='card'],[class*='Card'],.service-card,.servico-card,.feature-card,.benefit-card,.step-card,.process-card,.metodo-card,.solution-card";
  const sectionSel = "section,.section,[class*='section'],[class*='Section']";
  const numberSel = ".step-number,.process-number,.card-number,.badge,.tag,.pill,[class*='number'],[class*='Number'],[class*='badge'],[class*='Badge'],[class*='tag'],[class*='Tag'],[class*='pill'],[class*='Pill']";
  const socialSel = ".social-links,[class*='social-links'],[class*='socialLinks']";
  const editSel = textSel + "," + numberSel + "," + cardSel + "," + sectionSel + "," + socialSel + ",[data-pn-divider=true],[data-pn-ghost=true]";

  let selected = null;
  let hovered = null;
  let pending = null;
  let resizing = null;

  function px(v) { return Math.round(v) + "px"; }
  function uid() { return "pn-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function closest(t, s) { try { return t && t.closest ? t.closest(s) : null; } catch (_) { return null; } }
  function clearSelection() { const s = window.getSelection && window.getSelection(); if (s) s.removeAllRanges(); }

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

  function find(selector) {
    try { return document.querySelector(selector); } catch (_) { return null; }
  }

  function hex(color) {
    const m = String(color || "").match(/\d+/g);
    if (!m || m.length < 3) return "#111111";
    return "#" + m.slice(0, 3).map(n => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0")).join("");
  }

  function makeUi() {
    if (document.getElementById("pn-edit-bar")) return;

    const bar = document.createElement("div");
    bar.id = "pn-edit-bar";
    bar.innerHTML =
      '<button data-act="text">+ Texto</button>' +
      '<button data-act="line">+ Linha</button>' +
      '<button data-act="card">Card</button>' +
      '<button data-act="section">Seção</button>' +
      '<button data-act="logo-left">Logo esquerda</button>' +
      '<button data-act="logo-center">Logo centro</button>' +
      '<button data-act="logo-right">Logo direita</button>' +
      '<select data-field="font"><option value="">Fonte</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Montserrat">Montserrat</option><option value="Inter">Inter</option></select>' +
      '<input data-field="size" type="number" min="8" max="120" placeholder="Tam.">' +
      '<input data-field="color" type="color" value="#111111">';
    document.body.appendChild(bar);

    const box = document.createElement("div");
    box.id = "pn-edit-box";
    box.innerHTML = '<i data-h="nw"></i><i data-h="n"></i><i data-h="ne"></i><i data-h="e"></i><i data-h="se"></i><i data-h="s"></i><i data-h="sw"></i><i data-h="w"></i>';
    document.body.appendChild(box);

    const gx = document.createElement("div");
    gx.id = "pn-align-x";
    const gy = document.createElement("div");
    gy.id = "pn-align-y";
    document.body.append(gx, gy);

    bar.addEventListener("input", function (e) {
      if (!selected) return;
      const field = e.target.dataset.field;
      if (field === "font") selected.style.setProperty("font-family", e.target.value, "important");
      if (field === "size") selected.style.setProperty("font-size", e.target.value + "px", "important");
      if (field === "color") selected.style.setProperty("color", e.target.value, "important");
      syncBox();
      save();
    });

    bar.addEventListener("click", function (e) {
      const act = e.target.dataset.act;
      if (!act) return;
      e.preventDefault();

      if (act === "text") addText();
      if (act === "line") addLine();
      if (act === "card") select(closest(selected, cardSel) || closest(selected, socialSel) || selected);
      if (act === "section") selectSection();
      if (act.indexOf("logo-") === 0) setLogo(act.replace("logo-", ""));
    });

    box.addEventListener("pointerdown", function (e) {
      const h = e.target.dataset.h;
      if (!h || !selected) return;
      e.preventDefault();
      e.stopPropagation();
      clearSelection();

      const r = selected.getBoundingClientRect();
      resizing = {
        h,
        x: e.clientX,
        y: e.clientY,
        left: r.left + scrollX,
        top: r.top + scrollY,
        width: r.width,
        height: r.height,
        section: selected.dataset.pnSection === "true"
      };
      selected.setPointerCapture && selected.setPointerCapture(e.pointerId);
    }, true);
  }

  function syncBox() {
    const box = document.getElementById("pn-edit-box");
    if (!box) return;
    if (!selected) {
      box.dataset.open = "false";
      return;
    }

    const r = selected.getBoundingClientRect();
    box.dataset.open = "true";
    box.style.left = px(r.left - 5);
    box.style.top = px(r.top - 5);
    box.style.width = px(r.width + 10);
    box.style.height = px(r.height + 10);
  }

  function select(el) {
    makeUi();
    if (!el) return;
    selected = el;
    document.querySelectorAll("[data-pn-selected=true]").forEach(x => x.removeAttribute("data-pn-selected"));
    selected.dataset.pnSelected = "true";

    const cs = getComputedStyle(selected);
    const bar = document.getElementById("pn-edit-bar");
    bar.querySelector('[data-field="font"]').value = cs.fontFamily.split(",")[0].replaceAll('"', "");
    bar.querySelector('[data-field="size"]').value = parseInt(cs.fontSize, 10) || "";
    bar.querySelector('[data-field="color"]').value = hex(cs.color);

    syncBox();
  }

  function ensureGhost(el) {
    if (!el || el.dataset.pnGhost === "true" || el.dataset.pnFreeText === "true" || el.dataset.pnDivider === "true") return el;
    if (el.matches(sectionSel)) {
      el.dataset.pnSection = "true";
      return el;
    }

    const r = el.getBoundingClientRect();
    const source = path(el);

    el.dataset.pnSourceHidden = "true";
    el.style.setProperty("visibility", "hidden", "important");

    const ghost = el.cloneNode(true);
    ghost.dataset.pnGhost = "true";
    ghost.dataset.pnSource = source;
    ghost.dataset.pnId = uid();
    ghost.removeAttribute("id");
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
    const isSection = selected.dataset.pnSection === "true";
    const edit = {
      selector: selected.dataset.pnSource || path(selected),
      ghostId: selected.dataset.pnGhost === "true" ? selected.dataset.pnId : "",
      text: selected.matches(textSel) ? selected.textContent.trim() : "",
      font: selected.style.fontFamily || "",
      size: parseFloat(selected.style.fontSize) || 0,
      color: selected.style.color || "",
      left: Math.round(r.left + scrollX),
      top: Math.round(r.top + scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
      movable: !isSection,
      kind: selected.dataset.pnDivider === "true" ? "divider" : (isSection ? "section" : (selected.matches(cardSel) || selected.matches(socialSel) ? "card" : "text"))
    };

    parent.postMessage({ type: "pagenova-live-edit", key: KEY, edit }, "*");
  }

  function applyEdit(edit) {
    const source = find(edit.selector);
    let el = edit.ghostId ? find('[data-pn-id="' + edit.ghostId + '"]') : source;
    if (!el && source && edit.movable) {
      el = ensureGhost(source);
      if (edit.ghostId) el.dataset.pnId = edit.ghostId;
    }
    if (!el) return;

    if (edit.kind === "section") el.dataset.pnSection = "true";
    if (edit.text && el.matches(textSel)) el.textContent = edit.text;
    if (edit.font) el.style.setProperty("font-family", edit.font, "important");
    if (edit.size) el.style.setProperty("font-size", edit.size + "px", "important");
    if (edit.color) el.style.setProperty("color", edit.color, "important");

    if (edit.movable) {
      el.style.setProperty("position", "absolute", "important");
      el.style.setProperty("left", edit.left + "px", "important");
      el.style.setProperty("top", edit.top + "px", "important");
      el.style.setProperty("width", edit.width + "px", "important");
      el.style.setProperty("height", edit.height + "px", "important");
      el.style.setProperty("z-index", "120", "important");
    } else if (edit.kind === "section" && edit.height) {
      el.style.setProperty("min-height", Math.max(40, edit.height) + "px", "important");
      el.style.setProperty("height", Math.max(40, edit.height) + "px", "important");
    }
  }

  function addText() {
    const el = document.createElement("div");
    el.dataset.pnFreeText = "true";
    el.dataset.pnId = uid();
    el.textContent = "Novo texto";
    el.contentEditable = "true";
    el.style.cssText = "position:absolute;left:120px;top:" + (scrollY + 140) + "px;width:260px;min-height:44px;z-index:130;font:600 24px Arial;color:#111;background:transparent;";
    document.body.appendChild(el);
    select(el);
    save();
  }

  function addLine() {
    const el = document.createElement("div");
    el.dataset.pnDivider = "true";
    el.dataset.pnId = uid();
    el.className = "pn-live-divider";
    el.style.cssText = "position:absolute;left:120px;top:" + (scrollY + 180) + "px;width:280px;height:2px;z-index:110;background:rgba(20,20,20,.35);";
    document.body.appendChild(el);
    select(el);
    save();
  }

  function selectSection() {
    if (!selected) return;
    const s = closest(selected, sectionSel);
    if (!s) return;
    s.dataset.pnSection = "true";
    select(s);
  }

  function setLogo(pos) {
    const header = document.querySelector("header");
    if (!header) return;

    let brand = header.querySelector(".brand,.logo,a,h1,h2");
    if (brand) brand.classList.add("pn-brand-logo");

    header.dataset.pnHeaderLayout = pos;

    let btn = header.querySelector(".pn-menu-toggle");
    if (pos === "center") {
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pn-menu-toggle";
        btn.innerHTML = "<span></span><span></span><span></span>";
        header.insertBefore(btn, header.firstChild);
      }
    } else if (btn) {
      btn.remove();
    }

    parent.postMessage({ type: "pagenova-live-edit", key: KEY, edit: { selector: path(header), text: "", font: "", size: 0, color: "", headerLayout: pos } }, "*");
  }

  function candidate(target) {
    if (closest(target, "svg,path,circle,rect,line,polyline,polygon,use,img,picture,source")) {
      target = closest(target, "a,button,li,article,[class*='card'],[class*='Card']") || target.parentElement;
    }

    const social = closest(target, socialSel);
    if (social) {
      const socialItem = closest(target, "a,button,li");
      if (socialItem && social.contains(socialItem)) return socialItem;
      return social;
    }

    const number = closest(target, numberSel);
    if (number) return number;

    const directText = closest(target, textSel);
    if (directText) return directText;

    const card = closest(target, cardSel);
    if (card) return card;

    return closest(target, editSel);
  }
  function guidesFor(el, left, top) {
    const gx = document.getElementById("pn-align-x");
    const gy = document.getElementById("pn-align-y");
    if (!gx || !gy) return { left, top };

    gx.dataset.open = "false";
    gy.dataset.open = "false";

    const r = el.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const pointsX = [left, left + w / 2, left + w];
    const pointsY = [top, top + h / 2, top + h];

    let bestX = null;
    let bestY = null;

    document.querySelectorAll(editSel).forEach(other => {
      if (other === el || other.dataset.pnSourceHidden === "true") return;
      const o = other.getBoundingClientRect();
      const ox = [o.left + scrollX, o.left + scrollX + o.width / 2, o.left + scrollX + o.width];
      const oy = [o.top + scrollY, o.top + scrollY + o.height / 2, o.top + scrollY + o.height];

      pointsX.forEach((p, i) => ox.forEach(q => {
        if (Math.abs(p - q) <= 7) bestX = { delta: q - p, at: q, i };
      }));

      pointsY.forEach((p, i) => oy.forEach(q => {
        if (Math.abs(p - q) <= 7) bestY = { delta: q - p, at: q, i };
      }));
    });

    if (bestX) {
      left += bestX.delta;
      gy.style.left = px(bestX.at - scrollX);
      gy.dataset.open = "true";
    }

    if (bestY) {
      top += bestY.delta;
      gx.style.top = px(bestY.at - scrollY);
      gx.dataset.open = "true";
    }

    return { left, top };
  }

  function hideGuides() {
    const gx = document.getElementById("pn-align-x");
    const gy = document.getElementById("pn-align-y");
    if (gx) gx.dataset.open = "false";
    if (gy) gy.dataset.open = "false";
  }

  document.addEventListener("mouseover", function (e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box")) return;
    const el = candidate(e.target);
    if (!el) return;
    if (hovered && hovered !== el) hovered.removeAttribute("data-pn-hover");
    hovered = el;
    hovered.dataset.pnHover = "true";
  }, true);

  document.addEventListener("mouseout", function (e) {
    if (!hovered || (e.relatedTarget && hovered.contains(e.relatedTarget))) return;
    hovered.removeAttribute("data-pn-hover");
    hovered = null;
  }, true);

  document.addEventListener("click", function (e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box")) return;
    const el = candidate(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    select(el);
  }, true);

  document.addEventListener("pointerdown", function (e) {
    if (closest(e.target, "#pn-edit-bar,#pn-edit-box") || closest(e.target, "input,textarea,select")) return;
    const el = candidate(e.target);
    if (!el) return;

    clearSelection();
    select(el);

    pending = { el, x: e.clientX, y: e.clientY, started: false };
  }, true);

  document.addEventListener("pointermove", function (e) {
    if (resizing && selected) {
      clearSelection();
      const dx = e.clientX - resizing.x;
      const dy = e.clientY - resizing.y;

      if (resizing.section) {
        selected.style.setProperty("height", Math.max(40, resizing.height + dy) + "px", "important");
        selected.style.setProperty("min-height", Math.max(40, resizing.height + dy) + "px", "important");
      } else {
        let left = resizing.left;
        let top = resizing.top;
        let width = resizing.width;
        let height = resizing.height;

        if (resizing.h.includes("e")) width += dx;
        if (resizing.h.includes("s")) height += dy;
        if (resizing.h.includes("w")) { left += dx; width -= dx; }
        if (resizing.h.includes("n")) { top += dy; height -= dy; }

        selected.style.setProperty("left", px(left), "important");
        selected.style.setProperty("top", px(top), "important");
        selected.style.setProperty("width", px(Math.max(24, width)), "important");
        selected.style.setProperty("height", px(Math.max(12, height)), "important");
      }

      syncBox();
      return;
    }

    if (!pending) return;

    const moved = Math.abs(e.clientX - pending.x) + Math.abs(e.clientY - pending.y);
    if (moved < 5 && !pending.started) return;

    e.preventDefault();
    e.stopPropagation();
    clearSelection();

    if (!pending.started) {
      selected = ensureGhost(pending.el);
      select(selected);
      const r = selected.getBoundingClientRect();
      pending.left = r.left + scrollX;
      pending.top = r.top + scrollY;
      pending.started = true;
      document.body.classList.add("pn-is-dragging");
    }

    let left = pending.left + e.clientX - pending.x;
    let top = pending.top + e.clientY - pending.y;
    const snap = guidesFor(selected, left, top);

    selected.style.setProperty("left", px(snap.left), "important");
    selected.style.setProperty("top", px(snap.top), "important");
    selected.dataset.pnDragging = "true";
    syncBox();
  }, true);

  document.addEventListener("pointerup", function () {
    if (resizing || (pending && pending.started)) save();
    if (selected) selected.removeAttribute("data-pn-dragging");
    resizing = null;
    pending = null;
    document.body.classList.remove("pn-is-dragging");
    hideGuides();
  }, true);

  window.addEventListener("scroll", syncBox, true);
  window.addEventListener("resize", syncBox);

  makeUi();
  savedEdits.forEach(applyEdit);
})();
