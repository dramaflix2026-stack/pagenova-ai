"use client";

import {useEffect,useRef,type ReactNode} from "react";
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
  return <div ref={root} className="pn-global-scroll-root">{children}</div>;
}
