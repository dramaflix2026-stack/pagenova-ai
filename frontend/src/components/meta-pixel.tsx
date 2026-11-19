"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const LEGACY_PIXEL_ID = "1051066844418593";
const PUBLIC_LANDING_PIXEL_ID = "2101736870240618";
const PUBLIC_LANDING_ROUTES = new Set(["/", "/en", "/es", "/cadastro", "/login", "/montar-pacote", "/planos-atuais"]);

/**
 * The existing pixel continues to track the legacy app. When the new
 * marketing homepage is deliberately enabled, only that homepage and its
 * EN/ES routes use the dedicated landing pixel. Use trackSingle so a SPA
 * navigation never records a PageView in both Meta datasets.
 */
export function MetaPixel({ newLandingEnabled = false }: { newLandingEnabled?: boolean }) {
  void newLandingEnabled; // Kept for compatibility with the existing layout.\n  const pathname = usePathname() ?? "/";
  // Public acquisition and authentication routes belong to the same Meta dataset.\n  // Do not switch pixels after a CTA takes the visitor to signup or login.\n  const isNewMarketingPage = PUBLIC_LANDING_ROUTES.has(pathname);
  const pixelId = isNewMarketingPage ? PUBLIC_LANDING_PIXEL_ID : LEGACY_PIXEL_ID;
  const [scriptReady, setScriptReady] = useState(false);
  const initialized = useRef(new Set<string>());
  const lastTrackedPage = useRef("");
  const oldViewContentSent = useRef(false);

  useEffect(() => {
    if (!scriptReady || typeof window.fbq !== "function") return;

    if (!initialized.current.has(pixelId)) {
      window.fbq("init", pixelId);
      initialized.current.add(pixelId);
    }

    const pageKey = pixelId + ":" + pathname;
    if (lastTrackedPage.current !== pageKey) {
      window.fbq("trackSingle", pixelId, "PageView");
      lastTrackedPage.current = pageKey;
    }

    if (pixelId !== LEGACY_PIXEL_ID || oldViewContentSent.current) return;
    const timer = window.setTimeout(() => {
      if (oldViewContentSent.current) return;
      window.fbq?.("trackSingle", LEGACY_PIXEL_ID, "ViewContent", {
        content_name: "PageNova AI",
        content_category: "SaaS",
        value: 97,
        currency: "BRL",
      });
      oldViewContentSent.current = true;
    }, 500);
    return () => window.clearTimeout(timer);
  }, [scriptReady, pixelId, pathname]);

  return (
    <>
      <Script id="pagenova-meta-pixel-bootstrap" strategy="afterInteractive" onReady={() => setScriptReady(true)}>
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}
          (window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
