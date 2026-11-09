"use client";
import "./live-hero-showcase.css";

type Lang = "pt" | "en" | "es";

/**
 * The artwork is deliberately a real pre-composed image of the approved design.
 * Don't rebuild the mock site cards in DOM: this guarantees the approved appearance
 * and prevents missing external image URLs, blank cards and visual regressions.
 */
export function LiveHeroShowcase({ mobile = false }: { lang: Lang; mobile?: boolean }) {
  return (
    <div className={mobile ? "pn9-image-scene pn9-mobile" : "pn9-image-scene pn9-desktop"} aria-hidden="true">
      <div className="pn9-glow pn9-glow-left" />
      <div className="pn9-glow pn9-glow-right" />
      <div className="pn9-half pn9-left">
        <img src="/landing-hero/approved-side-panels.webp" alt="" decoding="async" draggable={false}/>
      </div>
      <div className="pn9-half pn9-right">
        <img src="/landing-hero/approved-side-panels.webp" alt="" decoding="async" draggable={false}/>
      </div>
      <div className="pn9-text-shield"/>
    </div>
  );
}
