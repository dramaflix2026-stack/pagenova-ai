"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const EXISTING_PIXEL_ID = "1051066844418593";
const LANDING_PIXEL_ID = "2101736870240618";

type MetaPixelProps = { landing?: boolean };

export function MetaPixel({ landing = false }: MetaPixelProps) {
  const pixelId = landing ? LANDING_PIXEL_ID : EXISTING_PIXEL_ID;
  useEffect(() => {
    if (landing) return;
    const timer = window.setTimeout(() => {
      window.fbq?.("track", "ViewContent", {
        content_name: "PageNova AI",
        content_category: "SaaS",
        value: 97,
        currency: "BRL",
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [landing]);

  return (
    <>
      <Script id={landing ? "meta-pixel-landing" : "meta-pixel"} strategy="afterInteractive">
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

          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
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