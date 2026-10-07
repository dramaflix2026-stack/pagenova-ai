/**
 * CSS derivado dos design tokens.
 *
 * Gerado, nunca escrito pela IA. O modelo escolhe valores de token dentro de
 * faixas validadas pelo schema, e o CSS sai daqui. E o que garante que nenhuma
 * geracao consiga produzir um seletor arbitrario ou uma regra que quebre o
 * layout na tela do cliente.
 *
 * A folha e unica e serve a todas as variantes. Alternativa seria emitir so o
 * CSS das variantes usadas, mas o ganho seria de poucos kilobytes e o custo
 * seria uma pagina que muda de aparencia conforme a ordem das secoes.
 */
import type { DesignTokens } from '@site-kit/schemas/site-schema';
import { fontStack } from '@site-kit/themes/fonts';

export function renderStyles(theme: DesignTokens): string {
  const { colors, typography, spacing, radii } = theme;

  const shadow =
    theme.elevation === 'NONE'
      ? 'none'
      : theme.elevation === 'SOFT'
        ? '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)'
        : '0 2px 4px rgba(0,0,0,.06), 0 16px 40px rgba(0,0,0,.10)';

  const densityScale = theme.density === 'AIRY' ? 1.15 : theme.density === 'COMPACT' ? 0.82 : 1;

  const imageRadius =
    theme.imageTreatment === 'ROUNDED'
      ? 'var(--radius-lg)'
      : theme.imageTreatment === 'FRAMED'
        ? 'var(--radius-sm)'
        : '0';

  const primaryFill =
    theme.buttonStyle === 'GRADIENT'
      ? `linear-gradient(120deg,${colors.primary},${colors.accent})`
      : 'var(--primary)';

  return `
:root{
--bg:${colors.background};--surface:${colors.surface};--text:${colors.text};
--muted:${colors.muted};--primary:${colors.primary};--primary-fg:${colors.primaryForeground};
--accent:${colors.accent};--accent-fg:${colors.accentForeground};--border:${colors.border};
--radius-sm:${radii.sm}px;--radius-md:${radii.md}px;--radius-lg:${radii.lg}px;--radius-pill:${radii.pill}px;
--container:${spacing.containerMaxWidthPx}px;
--section-pad:${(spacing.sectionPaddingRem * densityScale).toFixed(2)}rem;
--gap:${(spacing.gapRem * densityScale).toFixed(2)}rem;
--border-w:${theme.borderWidth}px;--shadow:${shadow};--pad-scale:1;
--font-heading:${fontStack(typography.headingFont)};
--font-body:${fontStack(typography.bodyFont)};
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-body);
font-size:${typography.bodyRem}rem;line-height:${typography.lineHeightBody};
-webkit-font-smoothing:antialiased;overflow-x:hidden}
h1,h2,h3{font-family:var(--font-heading);font-weight:${typography.headingWeight};
line-height:${typography.lineHeightTight};margin:0 0 .5em;letter-spacing:-.01em}
h1{font-size:clamp(${typography.headingMinRem}rem,5vw,${typography.headingMaxRem}rem)}
h2{font-size:clamp(${(typography.headingMinRem * 0.8).toFixed(2)}rem,3.6vw,${(typography.headingMaxRem * 0.68).toFixed(2)}rem)}
h3{font-size:clamp(1.05rem,2vw,1.35rem)}
p{margin:0 0 1em;max-width:68ch}
ul,ol{margin:0 0 1em}
img,svg,video{max-width:100%;height:auto;display:block}
a{color:inherit}
iframe{border:0;width:100%}

:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:2px}
.skip{position:absolute;left:-9999px;top:0;background:var(--primary);color:var(--primary-fg);
padding:.75rem 1.25rem;z-index:100;border-radius:0 0 var(--radius-sm) 0}
.skip:focus{left:0}

.container{width:100%;max-width:var(--container);margin:0 auto;padding:0 1.25rem}
.section{padding:calc(var(--section-pad) * var(--pad-scale)) 0}
.section--surface{background:var(--surface)}
.section--accent-soft{background:color-mix(in srgb,var(--accent) 8%,var(--bg))}
.section--primary{background:${primaryFill};color:var(--primary-fg)}
.section--primary h1,.section--primary h2,.section--primary h3{color:var(--primary-fg)}
.section--primary .lead,.section--primary .muted{color:color-mix(in srgb,var(--primary-fg) 82%,transparent)}
.section--primary .btn-secondary{color:var(--primary-fg);border-color:color-mix(in srgb,var(--primary-fg) 45%,transparent)}

.heading{margin-bottom:2.25rem;max-width:60ch}
.heading--centered{margin-left:auto;margin-right:auto;text-align:center}
.heading--centered .lead{margin-left:auto;margin-right:auto}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:.75rem;
font-weight:600;color:var(--muted);margin:0 0 1rem}
.lead{font-size:1.12em;color:var(--muted);max-width:60ch}
.muted{color:var(--muted)}
.small{font-size:.85rem}
.prose{max-width:66ch}
.prose--centered{margin:0 auto;text-align:center}
.prose-columns{columns:2;column-gap:3rem;max-width:none}
.prose-columns p{max-width:none;break-inside:avoid}
@media(max-width:760px){.prose-columns{columns:1}}
.statement{font-size:1.2em;max-width:62ch;margin:0 auto;text-align:center}
.rule{display:block;width:56px;height:3px;background:var(--primary);margin:0 0 1.75rem;border-radius:2px}
.icon{width:28px;height:28px;color:var(--primary);margin-bottom:.85rem}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;
min-height:48px;padding:.85rem 1.6rem;border-radius:var(--radius-pill);
font-weight:600;font-size:1rem;text-decoration:none;cursor:pointer;border:0;
transition:transform .18s ease,box-shadow .18s ease,background-color .18s ease}
.btn .icon{width:18px;height:18px;margin:0;color:currentColor}
.btn-primary{background:${primaryFill};color:var(--primary-fg);box-shadow:var(--shadow)}
.btn-secondary{background:transparent;color:var(--text);border:var(--border-w) solid var(--border)}
.btn-ghost{background:transparent;color:var(--primary);padding-left:.5rem;padding-right:.5rem}
.btn:hover{transform:translateY(-2px)}
.btn:active{transform:translateY(0) scale(.985)}
.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.75rem}
.heading--centered+.actions,.hero-centered .actions{justify-content:center}

.grid{display:grid;gap:var(--gap)}
.grid-2{grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.grid-3{grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))}
.card{background:var(--surface);border:var(--border-w) solid var(--border);
border-radius:var(--radius-md);padding:1.75rem;box-shadow:var(--shadow)}
.card--quiet{box-shadow:none;background:color-mix(in srgb,var(--surface) 60%,var(--bg))}
.card--wide{max-width:none;padding:2.5rem}
.card--lead{grid-column:span 2}
@media(max-width:760px){.card--lead{grid-column:auto}}
.card h3{margin-top:0}
.card p:last-child{margin-bottom:0}
.media{width:100%;border-radius:${imageRadius};object-fit:cover;
${theme.imageTreatment === 'SOFT_SHADOW' ? 'box-shadow:var(--shadow);' : ''}}


/* ---- PageNova Sites AI V2: acabamento premium --------------------------- */
body{background:
radial-gradient(circle at 8% 0%,color-mix(in srgb,var(--primary) 5%,transparent),transparent 28rem),
var(--bg)}
.section{position:relative}
.section>.container{position:relative}
.section:nth-of-type(even):not(.section--primary):not(.hero){
background:linear-gradient(180deg,color-mix(in srgb,var(--surface) 54%,var(--bg)),var(--bg))}
.heading{margin-bottom:clamp(1.75rem,4vw,3rem)}
.heading h2{max-width:18ch}
.heading--centered h2{margin-left:auto;margin-right:auto}
.eyebrow{display:inline-flex;align-items:center;gap:.55rem;font-weight:700}
.eyebrow::before{content:'';width:1.7rem;height:2px;background:var(--primary);border-radius:2px}
.lead{line-height:1.65}
.card,.contrast-card,.rail__item,.stats--grid li,.quote,.hero-highlight-box{
transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
.card:hover,.contrast-card:hover,.rail__item:hover,.stats--grid li:hover,.quote:hover{
transform:translateY(-3px);border-color:color-mix(in srgb,var(--primary) 28%,var(--border));
box-shadow:0 18px 50px rgba(0,0,0,.09)}
.card,.contrast-card,.rail__item{overflow:hidden}
.card .icon,.icon-block .icon,.contrast-card .icon{
padding:.48rem;width:2.65rem;height:2.65rem;border-radius:12px;
background:color-mix(in srgb,var(--primary) 10%,transparent)}
.btn-primary{position:relative;overflow:hidden}
.btn-primary::after{content:'';position:absolute;inset:0;
background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.16) 48%,transparent 75%);
transform:translateX(-130%);transition:transform .65s ease}
.btn-primary:hover::after{transform:translateX(130%)}
.hero{padding-top:clamp(4rem,8vw,7rem);padding-bottom:clamp(4rem,8vw,7rem)}
.hero h1{max-width:14ch;letter-spacing:-.035em}
.hero-centered h1{margin-left:auto;margin-right:auto}
.hero .lead{font-size:clamp(1.05rem,2vw,1.28rem)}
.hero-media{position:relative}
.hero-media:empty,.hero-wide-media:empty,.alt-row__media:empty{display:none}
.hero-media::before{content:'';position:absolute;inset:-1rem 1rem 1rem -1rem;
border-radius:var(--radius-lg);background:color-mix(in srgb,var(--primary) 10%,transparent);z-index:-1}
.hero-media img{box-shadow:0 24px 70px rgba(0,0,0,.14)}
.highlights li{display:inline-flex;align-items:center;gap:.45rem}
.highlights li::before{content:'✓';color:var(--primary);font-weight:800}
.detail-row{border-radius:var(--radius-md);padding:1.4rem;border:1px solid transparent}
.detail-row:hover{background:var(--surface);border-color:var(--border)}
.steps li::before,.step-num{box-shadow:0 0 0 6px color-mix(in srgb,var(--primary) 8%,transparent)}
.faq-item{transition:background-color .2s ease}
.faq-item:hover{background:color-mix(in srgb,var(--surface) 62%,transparent)}
.cta-card,.offer-card{box-shadow:0 22px 70px rgba(0,0,0,.09)}

@media(max-width:760px){
:root{--pad-scale:.72}
.container{padding-left:1.1rem;padding-right:1.1rem}
.section{padding-top:clamp(3rem,12vw,4.5rem);padding-bottom:clamp(3rem,12vw,4.5rem)}
.hero{padding-top:3.75rem;padding-bottom:3.75rem}
.hero h1{font-size:clamp(2.25rem,10.5vw,3.35rem);line-height:1.02}
h2{font-size:clamp(1.85rem,8vw,2.6rem);line-height:1.08}
.lead{font-size:1.05rem}
.actions{display:grid;grid-template-columns:1fr;width:100%}
.actions .btn{width:100%}
.card,.contrast-card,.rail__item{padding:1.35rem;border-radius:max(var(--radius-md),16px)}
.grid{gap:1rem}
.hero-media::before{inset:-.6rem .6rem .6rem -.6rem}
.hero-wide-media{margin-top:2rem}
.hero-wide-media img,.hero-media img{max-height:30rem;object-fit:cover}
.heading{margin-bottom:1.65rem}
.heading--centered{text-align:left;margin-left:0;margin-right:0}
.heading--centered .lead{margin-left:0;margin-right:0}
.icon-grid .icon-block{text-align:left;padding:1.15rem;border:1px solid var(--border);
border-radius:var(--radius-md);background:var(--surface)}
.icon-grid .icon{margin-left:0;margin-right:0}
.stats{justify-content:flex-start;text-align:left}
.cta-inline{align-items:stretch}
.cta-inline .actions{margin-top:.5rem}
}

/* ---- Cabecalho ---------------------------------------------------------- */
.site-header{background:color-mix(in srgb,var(--bg) 88%,transparent);
backdrop-filter:blur(10px);border-bottom:var(--border-w) solid var(--border);z-index:50}
.site-header--sticky{position:sticky;top:0}
.site-header .container{display:flex;align-items:center;justify-content:space-between;
gap:1rem;min-height:68px}
.brand{font-family:var(--font-heading);font-weight:700;font-size:1.15rem;text-decoration:none}
.brand-logo{max-height:40px;width:auto;border-radius:0}
.nav{display:flex;gap:1.5rem;align-items:center}
.nav a{text-decoration:none;font-size:.95rem;color:var(--muted);transition:color .18s ease}
.nav a:hover{color:var(--text)}
.nav .btn{color:var(--primary-fg)}
.nav-toggle{display:none;background:transparent;border:0;padding:.5rem;
min-width:48px;min-height:48px;color:var(--text);font-size:1.5rem;cursor:pointer}
.site-header--centered .container{display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
.site-header--centered .brand--center{grid-column:2;text-align:center}
.site-header--centered .nav--split{grid-column:1;justify-content:flex-start}
.site-header--centered .header-tail{grid-column:3;display:flex;justify-content:flex-end}
.site-header--minimal .nav--bare{gap:0}
.site-header--stacked .topbar{background:var(--surface);border-bottom:var(--border-w) solid var(--border);
font-size:.85rem;padding:.4rem 0}
.site-header--stacked .topbar .container{min-height:0;justify-content:flex-end}
.site-header--stacked .topbar a{display:inline-flex;align-items:center;gap:.4rem;text-decoration:none;color:var(--muted)}
.site-header--stacked .topbar .icon{width:15px;height:15px;margin:0}
.site-header--overlay{background:transparent;border-bottom-color:transparent;position:absolute;
left:0;right:0;top:0}
.site-header--overlay.is-condensed{position:fixed;background:color-mix(in srgb,var(--bg) 92%,transparent);
border-bottom-color:var(--border)}

/* ---- Hero --------------------------------------------------------------- */
.hero{padding:calc(var(--section-pad) * 1.25) 0}
.hero-split{display:grid;gap:calc(var(--gap) * 1.5);align-items:center;grid-template-columns:1fr}
@media(min-width:900px){.hero-split{grid-template-columns:1.05fr .95fr}}
.hero-split--reverse .hero-media{order:-1}
.hero-centered{text-align:center;max-width:820px;margin:0 auto}
.hero-centered p{margin-left:auto;margin-right:auto}
.hero-media img{aspect-ratio:4/5;width:100%}
.hero-wide-media{margin-top:3rem}
.hero-wide-media img{aspect-ratio:16/7;width:100%}
.hero-card{background:var(--surface);border-radius:var(--radius-lg);padding:2.5rem;
box-shadow:var(--shadow);border:var(--border-w) solid var(--border)}
.hero--overlay{position:relative;padding:0;isolation:isolate}
.hero-overlay-media{position:relative;min-height:min(78vh,640px)}
.hero-overlay-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0}
.hero-overlay-scrim{position:absolute;inset:0;
background:linear-gradient(to right,rgba(0,0,0,.68),rgba(0,0,0,.15))}
.hero-overlay-body{position:absolute;inset:auto 0 0 0;padding-bottom:4rem;color:#fff;max-width:var(--container)}
.hero-overlay-body h1,.hero-overlay-body .eyebrow,.hero-overlay-body .lead{color:#fff}
.hero-minimal{max-width:52ch}
.hero-highlight-box{background:var(--surface);border-radius:var(--radius-lg);
padding:2rem;border:var(--border-w) solid var(--border)}
.highlight-stack{list-style:none;padding:0;margin:0;display:grid;gap:1.1rem}
.highlight-stack li{padding-bottom:1.1rem;border-bottom:1px solid var(--border);font-weight:600}
.highlight-stack li:last-child{border-bottom:0;padding-bottom:0}
.highlights{display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:2rem;
list-style:none;padding:0;color:var(--muted);font-size:.9rem}
.hero-banner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1.5rem}
.hero-banner .actions{margin-top:0}
.hero--banner{padding:calc(var(--section-pad) * .7) 0}

/* ---- Listas e cartoes --------------------------------------------------- */
.detail-list{display:grid;gap:2rem}
.detail-row{display:grid;grid-template-columns:auto 1fr;gap:1.25rem;align-items:start;
padding-bottom:2rem;border-bottom:1px solid var(--border)}
.detail-row:last-child{border-bottom:0;padding-bottom:0}
.detail-row__mark .icon{margin:0}
.detail-row .dot{display:block;width:10px;height:10px;border-radius:50%;background:var(--primary);margin-top:.55rem}
.alt-row{display:grid;gap:var(--gap);align-items:center;grid-template-columns:1fr;margin-bottom:3.5rem}
@media(min-width:860px){.alt-row{grid-template-columns:1fr 1fr}
.alt-row--flip .alt-row__media{order:2}}
.alt-row__media img{aspect-ratio:4/3;width:100%}
.numbered-grid{list-style:none;padding:0;display:grid;gap:var(--gap);counter-reset:n;
grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.numbered-grid li{counter-increment:n;padding-top:2.5rem;position:relative;border-top:2px solid var(--border)}
.numbered-grid li::before{content:counter(n,decimal-leading-zero);position:absolute;top:.75rem;left:0;
font-family:var(--font-heading);font-size:.9rem;color:var(--primary);font-weight:700}
.rail{display:flex;gap:var(--gap);overflow-x:auto;padding-bottom:1rem;
scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.rail__item{flex:0 0 min(300px,78%);scroll-snap-align:start;background:var(--surface);
border:var(--border-w) solid var(--border);border-radius:var(--radius-md);padding:1.6rem}
.rail__item--media{padding:0;border:0;background:none;flex-basis:min(360px,82%)}
.icon-grid .icon-block{text-align:center}
.icon-grid .icon{margin-left:auto;margin-right:auto}
.checklist{list-style:none;padding:0;display:grid;gap:1.1rem;
grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.checklist--tight{grid-template-columns:1fr;gap:.75rem}
.checklist li{display:grid;grid-template-columns:auto 1fr;gap:.85rem;align-items:start}
.checklist .icon{width:20px;height:20px;margin:.15rem 0 0}
.checklist strong{display:block}
.checklist span{color:var(--muted);font-size:.95rem}
.contrast-grid{display:grid;gap:var(--gap);grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.contrast-card{padding:1.9rem;border-radius:var(--radius-md);
border:var(--border-w) solid var(--border);background:var(--surface)}
.contrast-card:first-child{border-left:3px solid var(--primary)}
.divided__row{padding:1.9rem 0;border-bottom:1px solid var(--border)}
.divided__row:last-child{border-bottom:0}
.feature-lead{display:grid;gap:var(--gap);grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))}
.pain-list{list-style:none;padding:0;max-width:62ch;margin:0 auto;display:grid;gap:1.25rem}
.pain-list li{padding-left:1.5rem;border-left:2px solid var(--primary)}
.pain-list strong{display:block;margin-bottom:.2rem}
.pain-list span{color:var(--muted);font-size:.95rem}
.persona-list{display:grid;gap:2rem}
.persona{display:grid;grid-template-columns:auto 1fr;gap:1.5rem;align-items:center}
.persona__img{width:96px;height:96px;border-radius:50%;object-fit:cover}

/* ---- Processo ----------------------------------------------------------- */
.steps{list-style:none;padding:0;margin:0;counter-reset:step}
.steps li{counter-increment:step;position:relative;padding:0 0 2rem 3.75rem}
.steps li::before{content:counter(step);position:absolute;left:0;top:-.15rem;
width:2.5rem;height:2.5rem;border-radius:var(--radius-pill);background:var(--primary);
color:var(--primary-fg);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem}
.steps li:not(:last-child)::after{content:'';position:absolute;left:1.25rem;top:2.6rem;
bottom:.25rem;width:1px;background:var(--border)}
.steps h3{margin-bottom:.35rem}
.steps--compact li{padding-left:3rem;padding-bottom:1.4rem}
.steps--compact li::before{width:2rem;height:2rem;font-size:.85rem}
.steps--compact li:not(:last-child)::after{left:1rem;top:2.1rem}
.timeline{list-style:none;padding:0;display:grid;gap:var(--gap);
grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));counter-reset:tl}
.timeline li{position:relative;padding-top:2.25rem;border-top:2px solid var(--border)}
.timeline__dot{position:absolute;top:-7px;left:0;width:12px;height:12px;border-radius:50%;
background:var(--primary)}
.step-cards{list-style:none;padding:0}
.step-num{display:inline-flex;align-items:center;justify-content:center;width:2.25rem;height:2.25rem;
border-radius:var(--radius-pill);background:color-mix(in srgb,var(--primary) 12%,transparent);
color:var(--primary);font-weight:700;margin-bottom:1rem}

/* ---- Numeros ------------------------------------------------------------ */
.stats{display:flex;flex-wrap:wrap;gap:2.5rem;justify-content:center;list-style:none;padding:0;text-align:center}
.stats .value{font-family:var(--font-heading);font-size:2.25rem;font-weight:700;display:block;line-height:1.1}
.stats .label{color:var(--muted);font-size:.9rem}
.stats--grid{display:grid;text-align:center}
.stats--grid li{background:var(--surface);border:var(--border-w) solid var(--border);
border-radius:var(--radius-md);padding:2rem 1.25rem}
.stats--inline .stats li:not(:last-child){border-right:1px solid var(--border);padding-right:2.5rem}
@media(max-width:640px){.stats--inline .stats li:not(:last-child){border-right:0;padding-right:0}}

/* ---- Galeria ------------------------------------------------------------ */
.gallery-grid img{aspect-ratio:4/3;width:100%}
.mosaic{display:grid;gap:var(--gap);grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.mosaic__item{margin:0}
.mosaic__item img{aspect-ratio:1;width:100%}
.mosaic__item--lead{grid-column:span 2;grid-row:span 2}
.mosaic__item--lead img{aspect-ratio:1}
@media(max-width:700px){.mosaic__item--lead{grid-column:auto;grid-row:auto}}
.offset-grid{display:grid;gap:var(--gap);grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))}
.offset-grid__item{margin:0}
.offset-grid__item img{aspect-ratio:3/4;width:100%}
@media(min-width:860px){.offset-grid__item.is-shifted{transform:translateY(3rem)}}

/* ---- Autoridade --------------------------------------------------------- */
.authority-centered{text-align:center;max-width:720px;margin:0 auto}
.authority-centered .prose{margin:0 auto}
.avatar{width:180px;margin:0 auto 2rem}
.avatar img{aspect-ratio:1;border-radius:50%;object-fit:cover}
.avatar--sm{width:110px;margin:0}
.person{font-size:.98rem}
.credentials{list-style:none;padding:0;display:grid;gap:.7rem;margin-top:1.5rem}
.credentials li{display:grid;grid-template-columns:auto 1fr;gap:.6rem;align-items:center;
color:var(--muted);font-size:.92rem}
.credentials .icon{width:18px;height:18px;margin:0}
.credential-strip{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center;margin-top:2rem}
.badge{display:inline-flex;align-items:center;gap:.45rem;padding:.55rem 1rem;
border-radius:var(--radius-pill);background:var(--surface);
border:var(--border-w) solid var(--border);font-size:.87rem;color:var(--muted)}
.badge .icon{width:16px;height:16px;margin:0}
.profile-card{display:grid;grid-template-columns:auto 1fr;gap:2rem;align-items:center}
@media(max-width:640px){.profile-card{grid-template-columns:1fr}}

/* ---- Depoimentos -------------------------------------------------------- */
.quote{background:var(--surface);border-left:3px solid var(--primary);
border-radius:var(--radius-md);padding:1.75rem}
.quote blockquote{margin:0 0 1rem;font-size:1.05rem;line-height:1.6}
.quote figcaption{color:var(--muted);font-size:.9rem}
.quote--feature{max-width:760px;margin:0 auto;text-align:center;border-left:0;
border-top:3px solid var(--primary)}
.quote--feature blockquote{font-size:1.35rem;font-family:var(--font-heading);line-height:1.45}
.quote--card{border-left:0;border:var(--border-w) solid var(--border)}

/* ---- FAQ ---------------------------------------------------------------- */
.faq-item{border-bottom:var(--border-w) solid var(--border)}
.faq-item summary{cursor:pointer;padding:1.35rem 0;font-weight:600;list-style:none;
display:flex;justify-content:space-between;gap:1rem;align-items:center;min-height:48px}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary::after{content:'+';font-size:1.5rem;color:var(--primary);
transition:transform .2s ease;line-height:1}
.faq-item[open] summary::after{transform:rotate(45deg)}
.faq-item .answer{padding:0 0 1.35rem;color:var(--muted)}
.faq-item .answer p{max-width:70ch}
.faq--columns{columns:2;column-gap:3rem}
.faq--columns .faq-item{break-inside:avoid}
@media(max-width:820px){.faq--columns{columns:1}}
.faq-open dt{font-weight:600;margin-top:1.75rem}
.faq-open dd{margin:.5rem 0 0;color:var(--muted)}

/* ---- Oferta ------------------------------------------------------------- */
.offer-card{max-width:640px;margin:0 auto}
.offer-card--price{text-align:center;display:flex;flex-direction:column;justify-content:center}
.price{font-family:var(--font-heading);font-size:2.4rem;font-weight:700;margin:.5rem 0 .25rem}
.price-note{margin-top:0}

/* ---- CTA ---------------------------------------------------------------- */
.cta-inline{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1.5rem}
.cta-inline .actions{margin-top:0}
.cta-card{max-width:760px;margin:0 auto;text-align:center}
.cta-card .actions{justify-content:center}
.cta-quiet{text-align:center;max-width:56ch;margin:0 auto}
.cta-quiet .actions{justify-content:center}
.sticky-bar{display:none}
@media(max-width:768px){
.sticky-bar{display:block;position:fixed;left:0;right:0;bottom:0;z-index:60;
padding:.75rem 1rem calc(.75rem + env(safe-area-inset-bottom));
background:color-mix(in srgb,var(--bg) 94%,transparent);
border-top:var(--border-w) solid var(--border);backdrop-filter:blur(8px)}
.sticky-bar .btn{width:100%}
/* Espaco reservado: a barra nunca cobre o ultimo paragrafo da pagina. */
body:has(.sticky-bar){padding-bottom:5.5rem}
}

/* ---- Contato ------------------------------------------------------------ */
.contact-grid{display:grid;gap:var(--gap);grid-template-columns:1fr}
@media(min-width:800px){.contact-grid{grid-template-columns:1fr 1fr}}
.address{font-size:1.05rem}
.hours{list-style:none;padding:0;margin:1rem 0;color:var(--muted)}
.hours li{padding:.35rem 0}
.channel-list{display:grid;gap:.75rem;max-width:420px}
.map-frame{border-radius:var(--radius-md);overflow:hidden;min-height:320px;
border:var(--border-w) solid var(--border)}
.map-frame iframe{height:100%;min-height:320px}

/* ---- Formulario --------------------------------------------------------- */
.form-card{max-width:560px;margin:0 auto}
.form-card--inline{max-width:720px}
.form-field{margin-bottom:1.1rem}
.form-field label{display:block;font-weight:600;margin-bottom:.4rem;font-size:.92rem}
.form-field input,.form-field textarea,.form-field select{width:100%;padding:.85rem 1rem;
border:var(--border-w) solid var(--border);border-radius:var(--radius-sm);font:inherit;
background:var(--bg);color:var(--text);min-height:48px}
.form-field textarea{min-height:130px;resize:vertical}
.form-error{color:var(--primary);font-size:.85rem;margin-top:.35rem;display:none}
.form-field[data-invalid='true'] .form-error{display:block}
.form-field[data-invalid='true'] input,.form-field[data-invalid='true'] textarea,
.form-field[data-invalid='true'] select{border-color:var(--primary)}
.wa-form .btn{width:100%}
.form-note{font-size:.85rem;margin:1rem 0 0;text-align:center}

/* ---- Rodape ------------------------------------------------------------- */
.site-footer{padding:3.5rem 0;border-top:var(--border-w) solid var(--border);
color:var(--muted);font-size:.92rem}
.site-footer--centered,.site-footer--legal,.site-footer--contrast{text-align:center}
.site-footer--contrast{border-top:0}
.site-footer .links{display:flex;gap:1.25rem;justify-content:center;flex-wrap:wrap;
margin:1.25rem 0;list-style:none;padding:0}
.site-footer a{text-decoration:none}
.site-footer a:hover{text-decoration:underline}
.footer-name{color:var(--text);margin-bottom:.35rem}
.footer-grid{display:grid;gap:var(--gap);text-align:left;
grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
.footer-title{font-size:.85rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
.footer-links{list-style:none;padding:0;display:grid;gap:.6rem}
.footer-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem}
.footer-bar .links{margin:0}

/* ---- Celular ------------------------------------------------------------ */
@media(max-width:768px){
.nav{position:fixed;inset:68px 0 auto 0;flex-direction:column;align-items:stretch;
background:var(--bg);border-bottom:var(--border-w) solid var(--border);
padding:1rem 1.25rem 1.5rem;gap:0;display:none}
.nav[data-open='true']{display:flex}
.nav a{padding:.9rem 0;border-bottom:1px solid var(--border);font-size:1rem}
.nav .btn{margin-top:1rem;border-bottom:0}
.nav-toggle{display:block}
.site-header--centered .container{grid-template-columns:auto 1fr auto}
.stats{gap:1.5rem}
.hero-overlay-body{position:static;padding:2.5rem 0;color:var(--text)}
.hero-overlay-body h1,.hero-overlay-body .eyebrow,.hero-overlay-body .lead{color:inherit}
.hero-overlay-media{min-height:auto}
.hero-overlay-media img{position:static;height:auto;aspect-ratio:4/3}
.hero-overlay-scrim{display:none}
}

/* ---- Movimento ----------------------------------------------------------
   O conteudo NASCE visivel. Toda regra de entrada vive atras da classe js,
   que so o runtime adiciona -- se o JavaScript falhar, nada fica escondido.
   Os presets abaixo correspondem um a um aos ids de site-motion.ts. */
[data-animate]{will-change:transform,opacity}
.js [data-animate]{opacity:0;transform:translateY(18px)}
.js [data-animate].is-visible{opacity:1;transform:none;
transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}

/* none: nunca esconde. */
.js [data-animate="none"]{opacity:1;transform:none;transition:none}

/* fade-in: sem deslocamento. */
.js [data-animate="fade-in"]{transform:none}

/* stagger-cards: os filhos entram em cascata; o atraso vem do runtime. */
.js [data-animate-stagger].is-visible>*,
.js [data-animate="stagger-cards"].is-visible>*{
animation:rise .6s cubic-bezier(.22,.61,.36,1) backwards}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* text-lines-reveal: titulo e apoio sobem por tras de uma mascara. */
.js [data-animate="text-lines-reveal"]{opacity:1;transform:none}
.js [data-animate="text-lines-reveal"] h1,
.js [data-animate="text-lines-reveal"] h2,
.js [data-animate="text-lines-reveal"] .lead{clip-path:inset(0 0 110% 0);
transform:translateY(.35em);opacity:0}
.js [data-animate="text-lines-reveal"].is-visible h1,
.js [data-animate="text-lines-reveal"].is-visible h2,
.js [data-animate="text-lines-reveal"].is-visible .lead{
clip-path:inset(0 0 -10% 0);transform:none;opacity:1;
transition:clip-path .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1),opacity .5s ease}
.js [data-animate="text-lines-reveal"].is-visible .lead{transition-delay:.12s}

/* image-mask-reveal: a mascara desliza revelando a foto. */
.js [data-animate="image-mask-reveal"]{opacity:1;transform:none}
.js [data-animate="image-mask-reveal"] img{clip-path:inset(0 100% 0 0)}
.js [data-animate="image-mask-reveal"].is-visible img{clip-path:inset(0 0 0 0);
transition:clip-path .9s cubic-bezier(.16,1,.3,1)}

/* parallax-subtle: o transform vem do runtime; aqui so o preparo. */
.js [data-animate="parallax-subtle"]{opacity:1;transform:none;overflow:hidden}
.js [data-animate="parallax-subtle"] img{will-change:transform}

/* counter-on-view: o numero e trocado pelo runtime, sem salto de layout. */
.js [data-animate="counter-on-view"] [data-count]{font-variant-numeric:tabular-nums}

/* section-background-shift: o runtime move --shift de 0 a 1. */
.js [data-animate="section-background-shift"]{opacity:1;transform:none;
background-image:linear-gradient(180deg,
color-mix(in srgb,var(--accent) calc(var(--shift,0) * 10%),transparent),transparent)}

/* cta-gradient-flow: gradiente que anda devagar, sem piscar. */
.js [data-animate="cta-gradient-flow"]{opacity:1;transform:none}
.js [data-animate="cta-gradient-flow"] .btn-primary{
background-size:220% 100%;animation:gradient-flow 6s linear infinite}
@keyframes gradient-flow{0%{background-position:0% 50%}100%{background-position:200% 50%}}

/* header-condense-on-scroll: a classe vem do runtime. */
.site-header{transition:background-color .25s ease,box-shadow .25s ease,padding .25s ease}
.site-header.is-condensed{box-shadow:var(--shadow)}
.site-header.is-condensed .container{min-height:56px}

/* progress-indicator: barra fina no topo, escalada pelo runtime. */
.progress-bar{position:fixed;top:0;left:0;right:0;height:3px;z-index:70;
background:var(--primary);transform:scaleX(0);transform-origin:0 50%}

/* Reduced-motion desliga TODOS os presets, inclusive os que usam clip-path e
   os que rodam sozinhos. Menos movimento nao e movimento mais rapido. */
@media(prefers-reduced-motion:reduce){
html{scroll-behavior:auto}
.js [data-animate],.js [data-animate].is-visible{opacity:1;transform:none;transition:none}
.js [data-animate] h1,.js [data-animate] h2,.js [data-animate] .lead,
.js [data-animate] img{clip-path:none!important;opacity:1!important;transform:none!important;
transition:none!important}
.js [data-animate-stagger].is-visible>*,
.js [data-animate="stagger-cards"].is-visible>*{animation:none}
.js [data-animate="cta-gradient-flow"] .btn-primary{animation:none;background-size:100% 100%}
.progress-bar{display:none}
.btn:hover{transform:none}
.offset-grid__item.is-shifted{transform:none}
*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}
}

@media print{
.site-header,.nav-toggle,.sticky-bar,.skip{display:none}
.section{padding:1.5rem 0}
}
`.trim();
}
