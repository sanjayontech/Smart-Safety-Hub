import { useEffect, useRef } from "react";

type Point = { x: number; y: number; intensity: number };

function seedPoints(count: number, seed = 1): Point[] {
  // simple deterministic pseudo-random
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    x: rand(),
    y: rand(),
    intensity: 0.3 + rand() * 0.7,
  }));
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function applyGradient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  // gradient stops: green -> yellow -> orange -> red
  const stops: [number, [number, number, number]][] = [
    [0.0, [0, 0, 0]],
    [0.15, [16, 185, 129]],
    [0.4, [234, 179, 8]],
    [0.65, [249, 115, 22]],
    [0.9, [239, 68, 68]],
    [1.0, [220, 38, 38]],
  ];
  const sample = (t: number): [number, number, number] => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [t0, c0] = stops[i - 1];
        const [t1, c1] = stops[i];
        const k = (t - t0) / (t1 - t0);
        return [
          c0[0] + (c1[0] - c0[0]) * k,
          c0[1] + (c1[1] - c0[1]) * k,
          c0[2] + (c1[2] - c0[2]) * k,
        ];
      }
    }
    return stops[stops.length - 1][1];
  };
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    if (a === 0) continue;
    const [r, g, b] = sample(a);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = Math.min(255, a * 255 * 1.4);
  }
  ctx.putImageData(img, 0, 0);
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // fake road arcs
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.3);
  ctx.bezierCurveTo(w * 0.3, h * 0.1, w * 0.6, h * 0.5, w, h * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.1, 0);
  ctx.bezierCurveTo(w * 0.4, h * 0.4, w * 0.55, h * 0.6, w * 0.7, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, h * 0.8);
  ctx.lineTo(w, h * 0.75);
  ctx.stroke();
  ctx.restore();
}

export function Heatmap({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>(seedPoints(60, 42));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;
    const render = () => {
      t += 0.01;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      drawGrid(ctx, w, h);

      // heat layer in offscreen for gradient mapping
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d")!;
      for (const p of pointsRef.current) {
        const px = p.x * w + Math.sin(t + p.x * 10) * 6;
        const py = p.y * h + Math.cos(t + p.y * 10) * 6;
        const r = 60 + p.intensity * 80;
        radial(octx, px, py, r, p.intensity * 0.7);
      }
      applyGradient(octx, w, h);
      ctx.drawImage(off, 0, 0);

      // critical pulses
      ctx.save();
      const top = [...pointsRef.current].sort((a, b) => b.intensity - a.intensity).slice(0, 3);
      for (const p of top) {
        const px = p.x * w;
        const py = p.y * h;
        const pulse = (Math.sin(t * 4) + 1) * 0.5;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 8 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border bg-card ${className ?? ""}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.6)_100%)]" />
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Live GIS feed · sector-04
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md bg-background/70 px-3 py-2 text-xs backdrop-blur">
        <span className="font-medium text-muted-foreground">Risk:</span>
        <span className="flex items-center gap-1"><i className="h-2 w-3 rounded-sm" style={{ background: "rgb(16,185,129)" }} /> Low</span>
        <span className="flex items-center gap-1"><i className="h-2 w-3 rounded-sm" style={{ background: "rgb(234,179,8)" }} /> Mod</span>
        <span className="flex items-center gap-1"><i className="h-2 w-3 rounded-sm" style={{ background: "rgb(249,115,22)" }} /> High</span>
        <span className="flex items-center gap-1"><i className="h-2 w-3 rounded-sm" style={{ background: "rgb(239,68,68)" }} /> Critical</span>
      </div>
    </div>
  );
}