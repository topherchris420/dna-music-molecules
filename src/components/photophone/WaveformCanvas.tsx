import { useRef, useEffect } from "react";

interface WaveformCanvasProps {
  signalFn: (t: number) => number;
  color: string;
  label: string;
  sublabel?: string;
  isActive: boolean;
  className?: string;
}

export const WaveformCanvas = ({
  signalFn,
  color,
  label,
  sublabel,
  isActive,
  className,
}: WaveformCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const signalFnRef = useRef(signalFn);
  const dimsRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    signalFnRef.current = signalFn;
  }, [signalFn]);

  // Handle canvas sizing with debounce to prevent mobile chrome bounce glitches
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const applyResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      dimsRef.current = { w: rect.width, h: rect.height };
    };

    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyResize, 150);
    };

    applyResize();
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

      const draw = () => {
        const { w: width, h: height } = dimsRef.current;
        if (width === 0 || height === 0) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }

      const now = performance.now() / 1000;

      // Background
      ctx.fillStyle = "rgba(8, 10, 18, 0.97)";
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = "rgba(100, 130, 180, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = "rgba(100, 130, 180, 0.2)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Waveform
      if (isActive) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const timeWindow = 0.025; // 25ms window
        for (let i = 0; i < width; i++) {
          const t = now - timeWindow + (i / width) * timeWindow;
          const val = signalFnRef.current(t);
          const y = height / 2 - val * (height * 0.38);
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Flat line when inactive
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = "rgba(180, 195, 230, 0.85)";
      ctx.font = "bold 11px monospace";
      ctx.fillText(label, 8, 16);
      if (sublabel) {
        ctx.fillStyle = "rgba(140, 155, 190, 0.5)";
        ctx.font = "9px monospace";
        ctx.fillText(sublabel, 8, 28);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, label, sublabel, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-lg border border-border/30 ${className || ""}`}
      style={{ height: "140px", background: "rgba(8, 10, 18, 0.97)" }}
    />
  );
};
