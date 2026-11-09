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

const SECTION_SELECTOR = "main, #galeria, #edicao-ia, #ecossistema, #publicos, #planos";
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

  // Measure real section boundaries; don't use a 900px repeating viewport SVG.
  const anchors: number[] = [-20, 0];
  for (const section of bounds) {
    const from = Math.max(0, section.start);
    const to = Math.min(height, section.end);
    anchors.push(from);
    if (to - from > 230) {
      anchors.push(from + (to - from) * 0.36, from + (to - from) * 0.70);
    }
    anchors.push(to);
  }
  anchors.push(height, height + 20);
  const ys = Array.from(new Set(anchors.map((value) => Math.round(value))))
    .sort((a, b) => a - b)
    .filter((value, index, arr) => index === 0 || value - arr[index - 1] >= 25);

  // Stay in the outside gutters; never snake through the central copy.
  // Left and right are separate, coherent strands all the way down the page.
  const leftFractions = isMobile
    ? [0.042, 0.068, 0.052, 0.080, 0.045, 0.072]
    : [0.035, 0.095, 0.061, 0.105, 0.045, 0.087];
  const rightFractions = isMobile
    ? [0.037, 0.064, 0.047, 0.073, 0.050, 0.081]
    : [0.041, 0.083, 0.053, 0.100, 0.064, 0.091];

  const makeCurve = (side: "left" | "right") => {
    const fractions = side === "left" ? leftFractions : rightFractions;
    const getX = (index: number) => {
      const inset = width * fractions[index % fractions.length];
      return side === "left" ? inset : width - inset;
    };
    let path = `M ${getX(0).toFixed(1)} ${ys[0]}`;
    for (let i = 1; i < ys.length; i++) {
      const fromY = ys[i - 1];
      const toY = ys[i];
      const rise = toY - fromY;
      const startX = getX(i - 1);
      const endX = getX(i);
      // Soft Bézier bends travel between section boundaries without sharp corners.
      path += ` C ${(startX + (endX - startX) * 0.08).toFixed(1)} ${(fromY + rise * 0.34).toFixed(1)} ${(endX - (endX - startX) * 0.08).toFixed(1)} ${(toY - rise * 0.34).toFixed(1)} ${endX.toFixed(1)} ${toY}`;
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
              <path className="pn-energy-pulse pn-energy-aura" d={path} pathLength="1000" />
              <path className="pn-energy-pulse pn-energy-core" d={path} pathLength="1000" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
