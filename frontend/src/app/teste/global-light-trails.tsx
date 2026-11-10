"use client";

import { useEffect, useState } from "react";

type Occlusion = { x: number; y: number; width: number; height: number };
type TrailGeometry = {
  width: number;
  height: number;
  leftPath: string;
  rightPath: string;
  occlusions: Occlusion[];
};

const SECTION_SELECTOR = "main, #plataforma, #galeria, #edicao-ia, #ecossistema, #publicos, #planos";
const CARD_SELECTOR = ".pn-gallery3d-card, .pn5-card, .pn6-card, .pn4-card, .pn4-menu-button";
const PROTECTED_SELECTOR = "h1,h2,h3,h4,h5,h6,p,a,button,input,textarea,select,[role='button'],[role='link']";

/**
 * One continuous curve per side of the complete landing page.
 * Curves are positioned relative to the document, not the viewport, so scrolling
 * cannot restart a line at a section boundary.
 *
 * Foreground text and controls are punched out of the SVG mask. The glow therefore
 * disappears naturally *behind* content instead of covering words or buttons.
 */
function measureTrails(root: HTMLElement): TrailGeometry | null {
  const rootBox = root.getBoundingClientRect();
  const width = root.clientWidth;
  const height = Math.max(root.scrollHeight, root.offsetHeight);
  if (!width || !height) return null;

  const isMobile = width < 768;
  const sectionElements = Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  const bounds = sectionElements
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { start: rect.top - rootBox.top, end: rect.bottom - rootBox.top };
    })
    .filter((rect) => rect.end > 0 && rect.start < height)
    .sort((a, b) => a.start - b.start);

  // Build lanes around the REAL card edges, never through the card faces.
  // The former percentage-based zigzag often put the glowing path beneath cards,
  // leaving only isolated vertical streaks visible in the narrow mobile gutters.
  const cardElements = Array.from(root.querySelectorAll<HTMLElement>(CARD_SELECTOR));
  const cardRects = cardElements
    .map(element => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left - rootBox.left,
        right: rect.right - rootBox.left,
        top: rect.top - rootBox.top,
        bottom: rect.bottom - rootBox.top,
      };
    })
    .filter(rect => rect.right > 0 && rect.left < width && rect.bottom > 0 && rect.top < height);

  // Sample along the entire document, including card entrances and exits.
  // Consistent sampling keeps the Bézier paths continuous across sections.
  const anchorSet = new Set<number>([0, height]);
  const spacing = isMobile ? 150 : 230;
  for (let y = 0; y < height; y += spacing) anchorSet.add(Math.round(y));
  for (const section of bounds) {
    for (const y of [section.start - 32, section.start + 32, section.end - 32, section.end + 32]) {
      if (y > 0 && y < height) anchorSet.add(Math.round(y));
    }
  }
  for (const card of cardRects) {
    for (const y of [card.top - 35, card.top + 16, card.bottom - 16, card.bottom + 35]) {
      if (y > 0 && y < height) anchorSet.add(Math.round(y));
    }
  }
  const ys = [...anchorSet].sort((a, b) => a - b)
    .filter((y, index, arr) => index === 0 || y - arr[index - 1] > 18);

  function laneAt(y: number, side: "left" | "right") {
    const matching = cardRects.filter(card => y >= card.top - 22 && y <= card.bottom + 22);
    // Cards can occur in columns. The outermost edge is what the light should trace.
    const relevant = matching.filter(card =>
      side === "left" ? card.left < width * 0.42 : card.right > width * 0.58
    );
    // When there's no card nearby, softly drift inward to create a visible
    // wave in the blank margin between sections instead of a straight rule.
    const phase = y / (isMobile ? 200 : 295);
    const freeInset = width * (isMobile ? 0.065 : 0.09)
      + Math.sin(phase + (side === "left" ? 0 : 1.6)) * width * (isMobile ? 0.026 : 0.03);
    const outerMargin = isMobile ? 7 : 13;
    const edgeOffset = isMobile ? 11 : 17;
    const innerMargin = isMobile ? Math.max(9, width * 0.075) : Math.max(20, width * 0.16);
    let xInset: number;
    if (relevant.length) {
      const edge = side === "left"
        ? Math.min(...relevant.map(card => card.left))
        : width - Math.max(...relevant.map(card => card.right));
      xInset = Math.min(edge - edgeOffset, innerMargin);
      // Make the stroke run slightly around the card border rather than under it.
      xInset += Math.sin(phase * 1.4 + (side === "left" ? 0 : 1.2)) * (isMobile ? 2 : 5);
    } else {
      xInset = freeInset;
    }
    xInset = Math.max(outerMargin, Math.min(innerMargin, xInset));
    return side === "left" ? xInset : width - xInset;
  }

  const makeCurve = (side: "left" | "right") => {
    const coords = ys.map(y => ({ x: laneAt(y, side), y }));
    let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1];
      const b = coords[i];
      const dy = b.y - a.y;
      // Vertical tangents produce elegant, connected S-shaped light rails.
      path += ` C ${a.x.toFixed(1)} ${(a.y + dy * .46).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - dy * .46).toFixed(1)} ${b.x.toFixed(1)} ${b.y}`;
    }
    return path;
  };

  // A mask excludes headings, paragraphs and clickable elements, with breathing room.
  // Larger clickable cards are deliberately occluders: the line goes behind them.
  const occlusions: Occlusion[] = [];
  const padding = isMobile ? 12 : 16;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(PROTECTED_SELECTOR))) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const x = rect.left - rootBox.left;
    const y = rect.top - rootBox.top;
    // Only outer-edge content can touch the light. Skip centered copy entirely.
    if (x > width * 0.19 && x + rect.width < width * 0.81) continue;
    if (y > height || y + rect.height < 0) continue;
    occlusions.push({
      x: Math.max(0, x - padding),
      y: Math.max(0, y - padding),
      width: Math.min(width, rect.width + padding * 2),
      height: rect.height + padding * 2,
    });
  }

  return {
    width,
    height,
    leftPath: makeCurve("left"),
    rightPath: makeCurve("right"),
    occlusions,
  };
}

export function GlobalLightTrails() {
  const [geometry, setGeometry] = useState<TrailGeometry | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".pn-test-root");
    if (!root) return;

    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (!disposed) setGeometry(measureTrails(root));
    };
    const schedule = () => {
      if (!frame && !disposed) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    for (const el of Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR))) {
      observer.observe(el);
    }
    window.addEventListener("resize", schedule, { passive: true });
    root.addEventListener("load", schedule, true);
    if (document.fonts) void document.fonts.ready.then(schedule);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      root.removeEventListener("load", schedule, true);
    };
  }, []);

  if (!geometry) return null;

  const { width, height, leftPath, rightPath, occlusions } = geometry;
  return (
    <div className="pn-global-light-trails" aria-hidden="true">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="presentation"
      >
        <defs>
          <mask id="pn-energy-content-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            <rect width={width} height={height} fill="white" />
            {occlusions.map((rect, index) => (
              <rect key={index} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="10" fill="black" />
            ))}
          </mask>
          <filter id="pn-energy-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>
        <g mask="url(#pn-energy-content-mask)">
          {[leftPath, rightPath].map((path, index) => (
            <g key={index} className={index === 0 ? "pn-energy-left" : "pn-energy-right"}>
              <path className="pn-energy-guide" d={path} />
              <path className="pn-energy-pulse pn-energy-aura" d={path} />
              <path className="pn-energy-pulse pn-energy-core" d={path} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
