import { useRef, useEffect } from "react";

interface LightBeamProps {
  signalFn: (t: number) => number;
  isActive: boolean;
  distance: number;
  noise: number;
  className?: string;
}

export const LightBeam = ({
  signalFn,
  isActive,
  distance,
  noise,
  className,
}: LightBeamProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const signalFnRef = useRef(signalFn);

  useEffect(() => {
    signalFnRef.current = signalFn;
  }, [signalFn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const handleResize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const now = performance.now() / 1000;
      const midY = height / 2;

      // Clear
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Dim baseline beam
        const grad = ctx.createLinearGradient(0, midY - 2, 0, midY + 2);
        grad.addColorStop(0, "rgba(200, 170, 50, 0)");
        grad.addColorStop(0.5, "rgba(200, 170, 50, 0.08)");
        grad.addColorStop(1, "rgba(200, 170, 50, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, midY - 12, width, 24);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Attenuation factor based on distance
      const attenuation = 1 / (1 + distance * 0.015);

      // Draw main beam glow (wide)
      const currentVal = Math.max(0, Math.min(1, signalFnRef.current(now)));
      const glowIntensity = currentVal * attenuation;

      const wideGrad = ctx.createLinearGradient(0, midY - 30, 0, midY + 30);
      wideGrad.addColorStop(0, `rgba(255, 200, 50, 0)`);
      wideGrad.addColorStop(0.3, `rgba(255, 200, 50, ${glowIntensity * 0.05})`);
      wideGrad.addColorStop(0.5, `rgba(255, 210, 60, ${glowIntensity * 0.15})`);
      wideGrad.addColorStop(0.7, `rgba(255, 200, 50, ${glowIntensity * 0.05})`);
      wideGrad.addColorStop(1, `rgba(255, 200, 50, 0)`);
      ctx.fillStyle = wideGrad;
      ctx.fillRect(0, midY - 30, width, 60);

      // Core beam (narrow, brighter)
      const coreGrad = ctx.createLinearGradient(0, midY - 4, 0, midY + 4);
      coreGrad.addColorStop(0, `rgba(255, 240, 150, 0)`);
      coreGrad.addColorStop(0.5, `rgba(255, 240, 150, ${glowIntensity * 0.6})`);
      coreGrad.addColorStop(1, `rgba(255, 240, 150, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, midY - 4, width, 8);

      // Photon particles traveling from left to right
      const particleCount = 30;
      const speed = 200; // px/s
      for (let i = 0; i < particleCount; i++) {
        const phase = (i / particleCount) * width;
        const x = (phase + now * speed) % width;
        const sampleT = now - (width - x) / (speed * 10);
        const pIntensity = Math.max(0, signalFnRef.current(sampleT)) * attenuation;

        // Particle with modulated brightness
        const alpha = pIntensity * 0.7;
        const radius = 1.5 + pIntensity * 1.5;

        ctx.shadowColor = `rgba(255, 220, 80, ${alpha})`;
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(255, 240, 160, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, midY + Math.sin(x * 0.03 + i) * 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Noise / scatter particles
      if (noise > 0.01) {
        const scatterCount = Math.floor(noise * 40);
        for (let i = 0; i < scatterCount; i++) {
          const x = Math.abs(Math.sin(now * 17.3 + i * 7.1)) * width;
          const y = midY + Math.sin(now * 23.7 + i * 11.3) * 20;
          const a = noise * 0.3 * Math.abs(Math.sin(now * 5 + i));
          ctx.fillStyle = `rgba(255, 100, 100, ${a})`;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Distance markers
      ctx.fillStyle = "rgba(150, 170, 210, 0.25)";
      ctx.font = "9px monospace";
      ctx.fillText(`${distance}m`, width / 2 - 10, height - 4);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, distance, noise]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-lg ${className || ""}`}
      style={{ height: "80px" }}
    />
  );
};
