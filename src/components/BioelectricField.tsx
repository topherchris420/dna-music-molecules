import { useEffect, useRef, useCallback } from "react";
import type { EntrainmentMode } from "./WetwareSimulator";

interface BioelectricFieldProps {
  isActive: boolean;
  baseFrequency: number;
  resonanceIntensity: number;
  modulationDepth: number;
  entrainmentMode: EntrainmentMode;
  bioelectricActivity: number;
}

const MODE_COLORS: Record<EntrainmentMode, { h: number; s: number; l: number }> = {
  focus: { h: 200, s: 85, l: 60 },
  relaxation: { h: 260, s: 75, l: 65 },
  coherence: { h: 280, s: 70, l: 70 },
};

export const BioelectricField = ({
  isActive,
  baseFrequency,
  resonanceIntensity,
  modulationDepth,
  entrainmentMode,
  bioelectricActivity,
}: BioelectricFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number; charge: number }[]>([]);
  // Store stable canvas logical dimensions to avoid getBoundingClientRect on every frame
  const dimsRef = useRef({ w: 0, h: 0 });

  const initNodes = useCallback((w: number, h: number) => {
    const nodes = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        charge: Math.random() * 2 - 1,
      });
    }
    nodesRef.current = nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const applyResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimsRef.current = { w, h };
      if (nodesRef.current.length === 0) initNodes(w, h);
    };

    // Debounce resize to prevent thrashing on mobile browser chrome bouncing
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyResize, 150);
    };

    applyResize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { w, h } = dimsRef.current;
      if (w === 0 || h === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const { h: hue, s: sat, l: light } = MODE_COLORS[entrainmentMode];

      // Fade trail
      ctx.fillStyle = "rgba(10, 12, 20, 0.12)";
      ctx.fillRect(0, 0, w, h);

      if (!isActive) {
        // Dim grid when inactive
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.05)`;
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < w; x += step) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.016;
      const t = timeRef.current;
      const freq = baseFrequency / 40;
      const nodes = nodesRef.current;

      // Update nodes
      for (const node of nodes) {
        node.charge = Math.sin(t * freq + node.x * 0.01) * resonanceIntensity +
          Math.cos(t * 2 + node.y * 0.02) * modulationDepth;

        node.vx += (Math.sin(t + node.y * 0.01) * 0.1) * modulationDepth;
        node.vy += (Math.cos(t + node.x * 0.01) * 0.1) * modulationDepth;
        node.vx *= 0.98;
        node.vy *= 0.98;
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) { node.x = 0; node.vx *= -1; }
        if (node.x > w) { node.x = w; node.vx *= -1; }
        if (node.y < 0) { node.y = 0; node.vy *= -1; }
        if (node.y > h) { node.y = h; node.vy *= -1; }
      }

      // Draw voltage field (background gradient patches)
      const gridSize = 20;
      for (let gx = 0; gx < w; gx += gridSize) {
        for (let gy = 0; gy < h; gy += gridSize) {
          let voltage = 0;
          for (const node of nodes) {
            const dx = gx - node.x;
            const dy = gy - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            voltage += node.charge / (dist * 0.05);
          }
          voltage = Math.tanh(voltage * 0.002) * bioelectricActivity;
          const alpha = Math.abs(voltage) * 0.15;
          if (alpha > 0.01) {
            const cellHue = voltage > 0 ? hue : (hue + 60) % 360;
            ctx.fillStyle = `hsla(${cellHue}, ${sat}%, ${light}%, ${alpha})`;
            ctx.fillRect(gx, gy, gridSize, gridSize);
          }
        }
      }

      // Draw field connections
      const connectionDist = 120;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * resonanceIntensity * 0.4;
            const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            const hue1 = nodes[i].charge > 0 ? hue : (hue + 40) % 360;
            const hue2 = nodes[j].charge > 0 ? hue : (hue + 40) % 360;
            gradient.addColorStop(0, `hsla(${hue1}, ${sat}%, ${light}%, ${alpha})`);
            gradient.addColorStop(1, `hsla(${hue2}, ${sat}%, ${light}%, ${alpha})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const absCharge = Math.abs(node.charge);
        const size = 2 + absCharge * 4;
        const nodeHue = node.charge > 0 ? hue : (hue + 60) % 360;
        const alpha = 0.4 + absCharge * 0.6;

        // Glow
        ctx.shadowBlur = 12 + absCharge * 8;
        ctx.shadowColor = `hsla(${nodeHue}, ${sat}%, ${light}%, ${alpha * 0.8})`;

        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${nodeHue}, ${sat}%, ${Math.min(90, light + 20)}%, ${alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Voltage ring
        if (absCharge > 0.5) {
          const ringRadius = size + 4 + Math.sin(t * 4) * 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${nodeHue}, ${sat}%, ${light}%, ${(absCharge - 0.5) * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Membrane potential wave along bottom
      ctx.beginPath();
      const waveY = h - 30;
      for (let x = 0; x < w; x++) {
        const val = Math.sin(x * 0.02 * freq + t * 3) * 10 * bioelectricActivity +
          Math.sin(x * 0.05 + t * 5) * 5 * modulationDepth;
        const y = waveY + val;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.3 + bioelectricActivity * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, 0.5)`;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
    };
  }, [isActive, baseFrequency, resonanceIntensity, modulationDepth, entrainmentMode, bioelectricActivity, initNodes]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border bg-card/10" style={{ height: "320px" }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ background: "rgba(10, 12, 20, 0.97)" }} />
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
        Bioelectric Field Dynamics
      </div>
      {isActive && (
        <div className="absolute bottom-3 right-3 text-xs font-mono text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
          V<sub>m</sub> {(bioelectricActivity * 100).toFixed(0)}mV · {baseFrequency} Hz
        </div>
      )}
    </div>
  );
};
