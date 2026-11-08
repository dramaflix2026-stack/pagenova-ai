"use client";

import {useEffect,useRef,type ReactNode,type CSSProperties} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {attachUniversalScrollReveal} from "@/lib/universal-site-scroll-reveal";
import "./builder-v2-universal-scroll-reveal.css";

/**
 * Render-only boundary for all Builder V2 site variants, including TP families
 * and 3D pages that return before the classic renderer's motion hook.
 * display:contents prevents any extra box affecting approved layouts.
 */
export function UniversalSiteScrollMotion({site,children}:{site:BuilderV2SiteData;children:ReactNode}) {
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>attachUniversalScrollReveal(root.current,site.motion),[site,site.motion,site.briefingLayoutVariant,site.cinematic?.mode]);
  // The existing display:contents boundary is reused for explicit palette
  // edits across TP1-TP10. No wrapper, layout, media or animation is replaced.
  const activePalette=site.designPaletteApplied===true&&
    /^#[0-9a-f]{6}$/i.test(site.background||"")&&
    /^#[0-9a-f]{6}$/i.test(site.design?.accent||"")&&
    /^#[0-9a-f]{6}$/i.test(site.design?.surface||"");
  const paletteStyle=activePalette?({
    "--pn-custom-bg":site.background,
    "--pn-custom-accent":site.design!.accent!,
    "--pn-custom-surface":site.design!.surface!,
  } as CSSProperties):undefined;
  return <div ref={root} className="pn-global-scroll-root"
    data-pn-palette-custom={activePalette?"true":undefined}
    style={paletteStyle}>{children}</div>;
}
