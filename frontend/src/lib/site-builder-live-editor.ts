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
  kind?: "text" | "image" | "card" | "divider" | "section";
  ghostId?: string;
  headerLayout?: "left" | "center" | "right";
  textAlign?: "left" | "center" | "right";
  fontWeight?: number;
  cardStyle?: "flat" | "bordered" | "elevated";
};

export type LiveEditorState = { edits?: LiveEdit[] };

type SiteLike = {
  theme?: PreviewTheme;
  liveEdits?: LiveEdit[] | Partial<Record<string, LiveEdit[]>>;
  edits?: LiveEdit[] | Partial<Record<string, LiveEdit[]>>;
  institutional?: { portrait?: string; businessPhoto?: string; workPhoto?: string };
};

function resolveState(siteOrKey: string | SiteLike, pageKeyOrState?: string | LiveEditorState): { key: string; edits: LiveEdit[] } {
  if (typeof siteOrKey === "string") {
    return { key: siteOrKey, edits: typeof pageKeyOrState === "object" ? pageKeyOrState.edits ?? [] : [] };
  }
  const key = typeof pageKeyOrState === "string" ? pageKeyOrState : "home";
  const rawEdits = siteOrKey.liveEdits ?? siteOrKey.edits ?? [];
  return { key, edits: Array.isArray(rawEdits) ? rawEdits : rawEdits[key] ?? [] };
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
  const images = typeof siteOrKey === "string" ? undefined : siteOrKey.institutional;
  const safeConfig = JSON.stringify({ key, edits, images }).replace(/</g, "\\u003c");

  const css = `
<style>
  /* Contextual editor: the page stays visually clean until an element is selected. */
  #pn-edit-bar{
    position:fixed!important;
    z-index:2147483000!important;
    display:none!important;
    align-items:center!important;
    gap:6px!important;
    max-width:min(560px,calc(100vw - 16px))!important;
    min-height:46px!important;
    padding:6px!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    border:1px solid rgba(15,23,42,.12)!important;
    border-radius:13px!important;
    background:rgba(255,255,255,.98)!important;
    box-shadow:0 12px 32px rgba(15,23,42,.18)!important;
    backdrop-filter:blur(16px)!important;
    -webkit-backdrop-filter:blur(16px)!important;
    font-family:Inter,Poppins,Arial,sans-serif!important;
    white-space:nowrap!important;
  }
  #pn-edit-bar[data-open=true]{display:flex!important}
  #pn-edit-bar button,#pn-edit-bar select,#pn-edit-bar input{
    flex:0 0 auto!important;
    height:34px!important;
    border:1px solid rgba(15,23,42,.12)!important;
    border-radius:9px!important;
    background:#fff!important;
    color:#111827!important;
    font:600 12px Inter,Poppins,Arial,sans-serif!important;
  }
  #pn-edit-bar button{min-width:34px!important;padding:0 9px!important}
  #pn-edit-bar select{width:112px!important;padding:0 8px!important}
  #pn-edit-bar input[type=number]{width:58px!important;padding:0 8px!important}
  #pn-edit-bar input[type=color]{width:36px!important;padding:3px!important}
  #pn-edit-bar button:hover,#pn-edit-bar button:focus-visible{background:#f3f4f6!important}

  #pn-edit-box{
    position:fixed!important;
    z-index:2147482999!important;
    pointer-events:none!important;
    display:none!important;
    border:1.5px solid rgba(16,185,129,.95)!important;
    border-radius:3px!important;
    box-shadow:0 0 0 1px rgba(255,255,255,.45)!important;
  }
  #pn-edit-box[data-open=true]{display:block!important}
  #pn-edit-box i{
    position:absolute!important;
    width:9px!important;height:9px!important;
    border-radius:50%!important;
    background:#10b981!important;
    border:1.5px solid #fff!important;
    box-shadow:0 1px 5px rgba(0,0,0,.18)!important;
    pointer-events:auto!important;
    touch-action:none!important;
  }
  #pn-edit-box [data-h=nw]{left:-5px!important;top:-5px!important;cursor:nwse-resize!important}
  #pn-edit-box [data-h=n]{left:50%!important;top:-5px!important;transform:translateX(-50%)!important;cursor:ns-resize!important}
  #pn-edit-box [data-h=ne]{right:-5px!important;top:-5px!important;cursor:nesw-resize!important}
  #pn-edit-box [data-h=e]{right:-5px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important}
  #pn-edit-box [data-h=se]{right:-5px!important;bottom:-5px!important;cursor:nwse-resize!important}
  #pn-edit-box [data-h=s]{left:50%!important;bottom:-5px!important;transform:translateX(-50%)!important;cursor:ns-resize!important}
  #pn-edit-box [data-h=sw]{left:-5px!important;bottom:-5px!important;cursor:nesw-resize!important}
  #pn-edit-box [data-h=w]{left:-5px!important;top:50%!important;transform:translateY(-50%)!important;cursor:ew-resize!important}

  [data-pn-selected=true]{outline:1px solid rgba(16,185,129,.32)!important;outline-offset:2px!important}
  [data-pn-free-text=true],[data-pn-divider=true],[data-pn-ghost=true]{box-sizing:border-box!important}
  [data-pn-dragging=true]{cursor:grabbing!important}
  body.pn-is-dragging,body.pn-is-dragging *{user-select:none!important;-webkit-user-select:none!important;cursor:grabbing!important}

  #pn-align-x,#pn-align-y{
    position:fixed!important;
    z-index:2147482998!important;
    display:none!important;
    pointer-events:none!important;
    background:#10b981!important;
    opacity:.75!important;
  }
  #pn-align-x{left:0!important;right:0!important;height:1px!important}
  #pn-align-y{top:0!important;bottom:0!important;width:1px!important}
  #pn-align-x[data-open=true],#pn-align-y[data-open=true]{display:block!important}

  [contenteditable=true][data-pn-selected=true]{
    cursor:text!important;
    outline:1.5px solid rgba(16,185,129,.75)!important;
  }

  @media(max-width:640px){
    #pn-edit-bar{max-width:calc(100vw - 12px)!important;border-radius:12px!important}
    #pn-edit-box [data-h=n],#pn-edit-box [data-h=e],#pn-edit-box [data-h=s],#pn-edit-box [data-h=w]{display:none!important}
    #pn-edit-box i{width:11px!important;height:11px!important}
  }
</style>`;

  const script = `
<script>window.__PAGENOVA_LIVE_EDITOR__=${safeConfig};</script>
<script src="/pagenova-live-editor.js"></script>`;

  return injectBeforeBody(html, css + script);
}
