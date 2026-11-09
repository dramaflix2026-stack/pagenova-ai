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
      <svg className="pn9-sharp-defs" width="0" height="0" focusable="false" aria-hidden="true">
        <defs>
          <filter id={mobile ? "pn9-unsharp-mobile" : "pn9-unsharp-desktop"} x="-1%" y="-1%" width="102%" height="102%" colorInterpolationFilters="sRGB">
            <feConvolveMatrix order="3" kernelMatrix="0 -0.13 0 -0.13 1.52 -0.13 0 -0.13 0" divisor="1" bias="0" edgeMode="duplicate" preserveAlpha="true"/>
          </filter>
        </defs>
      </svg>
      <div className="pn9-glow pn9-glow-left" />
      <div className="pn9-glow pn9-glow-right" />
      <div className="pn9-half pn9-left">
        <img src="/landing-hero/hero-left-hd.webp" alt="" decoding="async" draggable={false} fetchPriority="high"/>
        {/* The background mockup in the original illustration was intentionally defocused.
             Replace that specific background card with a real vector image, so its edges
             and labels remain crisp at every desktop pixel density. */}
        {!mobile && <img className="pn9-crisp-rear-card" src="/landing-hero/crisp-rear-card.svg" alt="" draggable={false} decoding="async" />}
      </div>
      <div className="pn9-half pn9-right">
        <img src="/landing-hero/hero-right-hd.webp" alt="" decoding="async" draggable={false} fetchPriority="high"/>
      </div>
      <div className="pn9-text-shield"/>
    </div>
  );
}
