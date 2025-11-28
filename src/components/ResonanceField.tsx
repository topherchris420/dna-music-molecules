import { useEffect, useRef } from "react";
import type { EntrainmentMode } from "./WetwareSimulator";

interface ResonanceFieldProps {
  isActive: boolean;
  baseFrequency: number;
  resonanceIntensity: number;
  modulationDepth: number;
  entrainmentMode: EntrainmentMode;
}

export const ResonanceField = ({
  isActive,
  baseFrequency,
  resonanceIntensity,
  modulationDepth,
  entrainmentMode,
}: ResonanceFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const getModeColor = (mode: EntrainmentMode): [number, number, number] => {
      switch (mode) {
        case "focus":
          return [200, 85, 60]; // hsl(200, 85%, 60%)
        case "relaxation":
          return [260, 75, 65]; // hsl(260, 75%, 65%)
        case "coherence":
          return [280, 70, 70]; // hsl(280, 70%, 70%)
      }
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with fade
      ctx.fillStyle = "rgba(15, 20, 25, 0.15)";
      ctx.fillRect(0, 0, width, height);

      if (isActive) {
        timeRef.current += 0.016; // ~60fps

        const [hue, sat, light] = getModeColor(entrainmentMode);
        const freq = baseFrequency / 50; // Scale for visual

        // Draw resonance waves
        const numWaves = 5 + Math.floor(resonanceIntensity * 5);
        for (let i = 0; i < numWaves; i++) {
          const radius = (i * 40) + (timeRef.current * 30) % (numWaves * 40);
          const opacity = (1 - radius / (numWaves * 40)) * resonanceIntensity * 0.6;
          
          if (opacity > 0.05) {
            ctx.beginPath();
            
            // Create wavy circle
            const segments = 64;
            for (let j = 0; j <= segments; j++) {
              const angle = (j / segments) * Math.PI * 2;
              const wave = Math.sin(angle * freq + timeRef.current * 2) * modulationDepth * 20;
              const r = radius + wave;
              const x = centerX + Math.cos(angle) * r;
              const y = centerY + Math.sin(angle) * r;
              
              if (j === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            
            ctx.closePath();
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, ${opacity * 0.8})`;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Draw resonance nodes
        const numNodes = 8;
        for (let i = 0; i < numNodes; i++) {
          const angle = (i / numNodes) * Math.PI * 2 + timeRef.current * 0.5;
          const dist = 100 + Math.sin(timeRef.current * 3 + i) * 30 * modulationDepth;
          const x = centerX + Math.cos(angle) * dist;
          const y = centerY + Math.sin(angle) * dist;
          const size = 3 + Math.sin(timeRef.current * 4 + i) * 2;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${resonanceIntensity * 0.8})`;
          ctx.fill();
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, ${resonanceIntensity})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Central resonance point
        ctx.beginPath();
        const pulseSize = 5 + Math.sin(timeRef.current * 5) * 3;
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, 90%, ${resonanceIntensity})`;
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, 1)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isActive, baseFrequency, resonanceIntensity, modulationDepth, entrainmentMode]);

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border bg-card/10">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
        Resonance Field Dynamics
      </div>
      {isActive && (
        <div className="absolute bottom-3 right-3 text-xs font-mono text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
          {baseFrequency} Hz
        </div>
      )}
    </div>
  );
};
