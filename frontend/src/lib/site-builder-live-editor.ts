export type PreviewTheme = "original" | "claro" | "escuro" | "areia";

export type LiveEdit = {
  selector: string;
  text: string;
  font: string;
  size: number;
  color: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  movable?: boolean;
  kind?: "text" | "card" | "divider" | "section";
  ghostId?: string;
  headerLayout?: "left" | "center" | "right";
  textAlign?: "left" | "center" | "right";
  fontWeight?: number;
  cardStyle?: "flat" | "bordered" | "elevated";
};

export type LiveEditorState = {
  edits?: LiveEdit[];
};

type SiteLike = {
  theme?: PreviewTheme;
  liveEdits?: LiveEdit[] | Partial<Record<string, LiveEdit[]>>;
  edits?: LiveEdit[] | Partial<Record<string, LiveEdit[]>>;
};

function resolveState(siteOrKey: string | SiteLike, pageKeyOrState?: string | LiveEditorState): { key: string; edits: LiveEdit[] } {
  if (typeof siteOrKey === "string") {
    return {
      key: siteOrKey,
      edits: typeof pageKeyOrState === "object" ? pageKeyOrState.edits ?? [] : [],
    };
  }

  const key = typeof pageKeyOrState === "string" ? pageKeyOrState : "home";
  const rawEdits = siteOrKey.liveEdits ?? siteOrKey.edits ?? [];

  return {
    key,
    edits: Array.isArray(rawEdits) ? rawEdits : rawEdits[key] ?? [],
  };
}

function injectBeforeBody(html: string, injection: string) {
  if (html.includes("</body>")) return html.replace("</body>", `${injection}</body>`);
  return `${html}${injection}`;
}

export function renderEditablePreview(
  html: string,
  siteOrKey: string | SiteLike,
  pageKeyOrState?: string | LiveEditorState,
  enabled = true,
) {
  if (!enabled) return html;

  const { key, edits } = resolveState(siteOrKey, pageKeyOrState);
  const safeConfig = JSON.stringify({ key, edits }).replace(/</g, "\\u003c");

  const css = `
<style>
  #pn-edit-bar{
    position:fixed!important;
    left:50%!important;
    bottom:18px!important;
    transform:translateX(-50%)!important;
    z-index:2147483000!important;
    display:flex!important;
    align-items:center!important;
    gap:8px!important;
    flex-wrap:wrap!important;
    max-width:calc(100vw - 24px)!important;
    padding:10px!important;
    border:1px solid rgba(20,20,20,.14)!important;
    border-radius:14px!important;
    background:rgba(255,255,255,.94)!important;
    box-shadow:0 18px 50px rgba(0,0,0,.18)!important;
    backdrop-filter:blur(12px)!important;
    font-family: "Poppins", sans-serif!important;
  }

  #pn-edit-bar button,
  #pn-edit-bar select,
  #pn-edit-bar input{
    height:34px!important;
    border:1px solid rgba(20,20,20,.14)!important;
    border-radius:10px!important;
    background:#fff!important;
    color:#111!important;
    font:600 12px "Poppins",sans-serif!important;
    padding:0 10px!important;
  }

  #pn-edit-bar input[type=color]{
    width:42px!important;
    padding:2px!important;
  }

  #pn-edit-box{
    position:fixed!important;
    z-index:2147482999!important;
    pointer-events:none!important;
    border:1.5px solid #f6b200!important;
    box-shadow:0 0 0 99999px rgba(0,0,0,.02)!important;
    display:none!important;
  }

  #pn-edit-box[data-open=true]{display:block!important}

  #pn-edit-box i{
    position:absolute!important;
    width:12px!important;
    height:12px!important;
    border-radius:50%!important;
    background:#f6b200!important;
    border:2px solid #fff!important;
    box-shadow:0 2px 8px rgba(0,0,0,.22)!important;
    pointer-events:auto!important;
  }

  #pn-edit-box [data-h=nw]{left:-7px!important;top:-7px!important;cursor:nwse-resize!important}
  #pn-edit-box [data-h=n]{left:50%!important;top:-7px!important;transform:translateX(-50%)!important;cursor:ns-resize!important}
  #pn-edit-box [data-h=ne]{right:-7px!important;top:-7px!important;cursor:nesw-resize!important}
  #pn-edit-box [data-h=e]{right:-7px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important}
  #pn-edit-box [data-h=se]{right:-7px!important;bottom:-7px!important;cursor:nwse-resize!important}
  #pn-edit-box [data-h=s]{left:50%!important;bottom:-7px!important;transform:translateX(-50%)!important;cursor:ns-resize!important}
  #pn-edit-box [data-h=sw]{left:-7px!important;bottom:-7px!important;cursor:nesw-resize!important}
  #pn-edit-box [data-h=w]{left:-7px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important}

  [data-pn-hover=true]{
    outline:1.5px dashed rgba(246,178,0,.8)!important;
    outline-offset:5px!important;
    cursor:grab!important;
  }

  [data-pn-selected=true]{
    outline:2px solid rgba(246,178,0,.95)!important;
    outline-offset:5px!important;
  }

  [data-pn-free-text=true],
  [data-pn-divider=true],
  [data-pn-ghost=true]{
    cursor:grab!important;
    box-sizing:border-box!important;
  }

  [data-pn-dragging=true]{cursor:grabbing!important}

  body.pn-is-dragging,
  body.pn-is-dragging *{
    user-select:none!important;
    -webkit-user-select:none!important;
  }

  #pn-align-x,
  #pn-align-y{
    position:fixed!important;
    z-index:2147482998!important;
    display:none!important;
    pointer-events:none!important;
    background:#f6b200!important;
    box-shadow:0 0 0 1px rgba(255,255,255,.85),0 0 14px rgba(246,178,0,.35)!important;
  }

  #pn-align-x{left:0!important;right:0!important;height:1px!important}
  #pn-align-y{top:0!important;bottom:0!important;width:1px!important}
  #pn-align-x[data-open=true],
  #pn-align-y[data-open=true]{display:block!important}

  [data-pn-section=true]{
    outline:1.5px dashed rgba(246,178,0,.8)!important;
    outline-offset:-8px!important;
  }

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

  /* pn-live-editor-menu-authority */
  header.pn-header-menu-inline .pn-menu-toggle{
    display:none!important;
  }

  header.pn-header-menu-dropdown .pn-menu-toggle{
    display:inline-flex!important;
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

  header[data-pn-header-layout=center] nav{display:none!important}

  header[data-pn-header-layout=right]{
    display:flex!important;
    flex-direction:row-reverse!important;
    justify-content:space-between!important;
    align-items:center!important;
  }

  /* pn-section-flow-lock */
  section[data-pn-section=true],
  [data-pn-section=true]{
    position:relative!important;
    left:auto!important;
    top:auto!important;
    right:auto!important;
    bottom:auto!important;
    transform:none!important;
    width:auto!important;
    max-width:none!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
  }

  section[data-pn-section=true]{
    resize:vertical!important;
    min-height:220px!important;
    max-height:1200px!important;
  }
</style>`;

  const script = `
<script>window.__PAGENOVA_LIVE_EDITOR__=${safeConfig};</script>
<script src="/pagenova-live-editor.js"></script>`;

  return injectBeforeBody(html, css + script);
}
