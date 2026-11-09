/**
 * A single fixed light system for the entire /teste landing page.
 * Not attached to any section: trails travel independently while the page scrolls.
 */
export function GlobalLightTrails() {
  return (
    <div className="pn-global-light-trails" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none" role="presentation">
        <defs>
          <linearGradient id="pn-trail-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#caff99" stopOpacity="0"/>
            <stop offset="25%" stopColor="#a7ff67" stopOpacity=".95"/>
            <stop offset="54%" stopColor="#e0ffc1"/>
            <stop offset="75%" stopColor="#6ee65d" stopOpacity=".9"/>
            <stop offset="100%" stopColor="#9cff75" stopOpacity="0"/>
          </linearGradient>
          <filter id="pn-trail-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="9"/>
          </filter>
        </defs>
        <path className="pn-light-guide" d="M -10 -100 C 260 65 80 190 215 340 S 50 640 244 830 S 106 1090 10 1170"/>
        <path className="pn-light-guide" d="M 1460 -140 C 1130 100 1360 225 1198 405 S 1385 682 1197 825 S 1360 1050 1475 1200"/>
        <path className="pn-trail-beam pn-trail-blur pn-trail-left" d="M -10 -100 C 260 65 80 190 215 340 S 50 640 244 830 S 106 1090 10 1170" pathLength="1000"/>
        <path className="pn-trail-beam pn-trail-core pn-trail-left" d="M -10 -100 C 260 65 80 190 215 340 S 50 640 244 830 S 106 1090 10 1170" pathLength="1000"/>
        <path className="pn-trail-beam pn-trail-blur pn-trail-right" d="M 1460 -140 C 1130 100 1360 225 1198 405 S 1385 682 1197 825 S 1360 1050 1475 1200" pathLength="1000"/>
        <path className="pn-trail-beam pn-trail-core pn-trail-right" d="M 1460 -140 C 1130 100 1360 225 1198 405 S 1385 682 1197 825 S 1360 1050 1475 1200" pathLength="1000"/>
      </svg>
    </div>
  );
}
