"use client";

import { useEffect, useRef } from "react";

/**
 * Animated version of the approved PageNova particle globe.
 * The original SVG remains as a no-JS/reduced-motion fallback.
 * No texture, planet or rings: only luminous green points in 3D.
 */
export function PageNovaParticleSphere({ language = "pt" }: { language?: "pt" | "en" | "es" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    // Fibonacci distribution, with a subtle deterministic offset to avoid
    // obvious latitude bands. Keep density and palette close to approved SVG.
    const count = 2400;
    const points = Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count;
      const z = 1 - 2 * t;
      const a = i * Math.PI * (3 - Math.sqrt(5));
      const radius = Math.sqrt(1 - z * z);
      const jitter = 0.997 + (Math.sin(i * 71.371) * 0.5 + 0.5) * 0.006;
      return {
        x: Math.cos(a) * radius * jitter,
        y: Math.sin(a) * radius * jitter,
        z,
        size: 0.65 + ((Math.sin(i * 18.319) + 1) * 0.5) * 0.80,
        phase: i * 2.39996,
        colorIndex: i % 11 === 0 ? 2 : i % 4 === 0 ? 1 : 0,
      };
    });

    let width = 700;
    let height = 700;
    let pixelRatio = 1;
    let frame = 0;
    let running = false;
    let visible = false;
    let disposed = false;
    let tiltX = 0;
    let tiltY = 0;
    let targetX = 0;
    let targetY = 0;
    let angle = 0;
    let lastTime = 0;
    let glow: CanvasGradient;
    const palette = ["#60df68", "#88ff70", "#c5ff91"];
    const alphaLevels = [0.43, 0.54, 0.65, 0.76];
    // Seven asynchronous emission zones with occasional stronger energy pulses.
    // Emitters are on the silhouette; avoid simultaneous continuous fireworks.
    type Spark = {
      x: number; y: number; vx: number; vy: number;
      age: number; life: number; radius: number; color: number;
    };
    type Zone = {
      x: number; y: number; dx: number; dy: number;
      nextAt: number; activeUntil: number; emitRate: number; accumulator: number;
      power: number;
    };
    const sources = [
      { x: 0, y: -0.94, dx: 0, dy: -1 },
      { x: -0.55, y: -0.78, dx: -0.50, dy: -0.86 },
      { x: 0.55, y: -0.78, dx: 0.50, dy: -0.86 },
      { x: -0.92, y: -0.25, dx: -0.93, dy: -0.36 },
      { x: 0.92, y: -0.25, dx: 0.93, dy: -0.36 },
      { x: -0.76, y: 0.52, dx: -0.82, dy: 0.56 },
      { x: 0.76, y: 0.52, dx: 0.82, dy: 0.56 },
    ];
    const zones: Zone[] = sources.map((source, i) => ({
      ...source,
      nextAt: 1700 + i * 1150 + Math.random() * 1350,
      activeUntil: 0,
      emitRate: 0,
      accumulator: 0,
      power: 1,
    }));
    const sparks: Spark[] = [];
    const maxSparks = 260;
    let elapsed = 0;
    let lastEmissionAt = -3000;
    const interval = (min: number, max: number) => min + Math.random() * (max - min);
    const activate = (zone: Zone) => {
      // Most eruptions are delicate; occasionally a stronger one appears.
      const strong = Math.random() < 0.18;
      zone.power = strong ? interval(1.45, 1.9) : interval(0.95, 1.3);
      zone.emitRate = (strong ? 0.12 : 0.072) * zone.power;
      zone.activeUntil = elapsed + (strong ? interval(760, 1100) : interval(520, 850));
      zone.accumulator = 0;
      zone.nextAt = elapsed + interval(4200, 8000);
      lastEmissionAt = elapsed;
    };

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // Avoid rendering a huge high-DPI backing canvas on laptops.
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const cx = width / 2, cy = height / 2;
      const radius = Math.min(width, height) * (230 / 700);
      glow = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius * 1.27);
      glow.addColorStop(0, "rgba(72,215,84,0.075)");
      glow.addColorStop(0.67, "rgba(38,147,61,0.048)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
    };

    const draw = (time: number) => {
      if (disposed || !visible) { running = false; return; }
      const dt = lastTime ? Math.min(48, time - lastTime) : 16.67;
      lastTime = time;
      angle += dt * 0.000095;
      elapsed += dt;
      for (const zone of zones) {
        if (elapsed >= zone.nextAt && elapsed >= zone.activeUntil) {
          // Brief spacing between activations prevents simultaneous bursts.
          if (elapsed - lastEmissionAt > 700) activate(zone);
          else zone.nextAt = elapsed + interval(650, 1400);
        }
        if (elapsed >= zone.activeUntil) continue;
        zone.accumulator += dt * zone.emitRate;
        const spawn = Math.max(0, Math.min(9, Math.floor(zone.accumulator), maxSparks - sparks.length));
        zone.accumulator -= Math.max(0, spawn);
        for (let i = 0; i < spawn; i++) {
          const lateral = (Math.random() - 0.5) * 0.00048;
          const speed = interval(0.00048, 0.00084) * zone.power;
          sparks.push({
            x: zone.x + interval(-0.025, 0.025),
            y: zone.y + interval(-0.012, 0.012),
            vx: zone.dx * speed - zone.dy * lateral,
            vy: zone.dy * speed + zone.dx * lateral - 0.00006,
            age: 0,
            life: interval(850, 1550),
            radius: interval(0.9, 2.1),
            color: Math.floor(Math.random() * 3),
          });
        }
      }
      // Time-based exponential smoothing: same response at 30/60/120 Hz.
      const smooth = 1 - Math.exp(-dt / 85);
      tiltX += (targetX - tiltX) * smooth;
      tiltY += (targetY - tiltY) * smooth;

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * (230 / 700);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.28, 0, Math.PI * 2);
      ctx.fill();

      const yaw = angle + tiltY;
      const pitch = -0.16 + tiltX;
      const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
      const cpitch = Math.cos(pitch), spitch = Math.sin(pitch);
      const dotScale = Math.min(width, height) / 700;
      // Batch draw calls: 12 path fills instead of 2,400 individual fills.
      // This avoids expensive canvas state changes per particle.
      const batches = Array.from({ length: 12 }, () => new Path2D());
      for (const p of points) {
        const xx = p.x * cyaw + p.z * syaw;
        const zz = p.z * cyaw - p.x * syaw;
        const yy = p.y * cpitch - zz * spitch;
        const depth = p.y * spitch + zz * cpitch;
        const perspective = 1 + depth * 0.035;
        const px = cx + xx * radius * perspective;
        const py = cy + yy * radius * perspective;
        const twinkle = 0.92 + 0.08 * Math.sin(time * 0.00115 + p.phase);
        const dotRadius = Math.max(0.4, p.size * dotScale * (0.94 + 0.10 * depth) * twinkle);
        const depthBand = Math.min(3, Math.max(0, Math.floor((depth + 1) * 2)));
        batches[p.colorIndex * 4 + depthBand].moveTo(px + dotRadius, py);
        batches[p.colorIndex * 4 + depthBand].arc(px, py, dotRadius, 0, Math.PI * 2);
      }
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = palette[c];
        for (let d = 0; d < 4; d++) {
          ctx.globalAlpha = alphaLevels[d];
          ctx.fill(batches[c * 4 + d]);
        }
      }
      ctx.globalAlpha = 1;

      // Small green plume with outward drift, gravity and transparent fade.
      // Sparks are drawn in one path per color/fade group for low canvas overhead.
      const sparkPaths = Array.from({ length: 9 }, () => new Path2D());
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.age += dt;
        if (spark.age >= spark.life) { sparks.splice(i, 1); continue; }
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vy += 0.00000065 * dt;
        spark.vx *= Math.exp(-dt / 1800);
        const lifeLeft = 1 - spark.age / spark.life;
        const px = cx + spark.x * radius;
        const py = cy + spark.y * radius;
        const pr = Math.max(0.35, spark.radius * dotScale * (0.7 + 0.3 * lifeLeft));
        const fade = Math.min(2, Math.floor((1 - lifeLeft) * 3));
        const path = sparkPaths[spark.color * 3 + fade];
        path.moveTo(px + pr, py);
        path.arc(px, py, pr, 0, Math.PI * 2);
      }
      for (let color = 0; color < 3; color++) {
        ctx.fillStyle = palette[color];
        for (let fade = 0; fade < 3; fade++) {
          ctx.globalAlpha = [0.88, 0.52, 0.19][fade];
          ctx.fill(sparkPaths[color * 3 + fade]);
        }
      }
      ctx.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || disposed) return;
      running = true;
      lastTime = 0;
      frame = window.requestAnimationFrame(draw);
    };
    const stop = () => {
      window.cancelAnimationFrame(frame);
      running = false;
      lastTime = 0;
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = stage.getBoundingClientRect();
      targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.38;
      targetX = ((event.clientY - rect.top) / rect.height - 0.5) * -0.28;
    };
    const onLeave = () => { targetX = 0; targetY = 0; };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible) start(); else stop();
    }, { threshold: 0.04 });
    const onVisibility = () => {
      visible = !document.hidden && observerVisible();
      if (visible) start(); else stop();
    };
    const observerVisible = () => {
      const r = stage.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const resizeObserver = new ResizeObserver(resize);

    resize();
    stage.classList.add("pnr-orb-live");
    observer.observe(stage);
    resizeObserver.observe(stage);
    stage.addEventListener("pointermove", onPointer, { passive: true });
    stage.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      stage.removeEventListener("pointermove", onPointer);
      stage.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      stage.classList.remove("pnr-orb-live");
    };
  }, []);

  const label = language === "pt"
    ? "Esfera tridimensional de partículas verdes em rotação suave"
    : language === "es"
      ? "Esfera tridimensional de partículas verdes en rotación suave"
      : "Three-dimensional sphere of green particles rotating gently";
  return (
    <div className="pnr-orb-art pnr-orb-particles" ref={stageRef} role="img" aria-label={label}>
      <canvas ref={canvasRef} className="pnr-orb-particle-canvas" aria-hidden="true" />
    </div>
  );
}
