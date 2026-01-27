import { useEffect, useRef } from "react";

interface QuantumOverlayProps {
  frequencies: number[];
  isPlaying: boolean;
  colors: string[];
}

// DNA base colors matching CSS variables
const BASE_COLORS = [
  { h: 180, s: 100, l: 50 }, // Adenine - cyan
  { h: 30, s: 100, l: 55 },  // Thymine - orange
  { h: 320, s: 90, l: 60 },  // Cytosine - magenta
  { h: 120, s: 80, l: 50 },  // Guanine - green
];

// DNA frequency range: 370-622 Hz
const MIN_FREQ = 370;
const MAX_FREQ = 622;

export const QuantumOverlay = ({ frequencies, isPlaying }: QuantumOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with fade effect for trailing
      ctx.fillStyle = "rgba(8, 12, 20, 0.08)";
      ctx.fillRect(0, 0, width, height);

      if (isPlaying && frequencies.length > 0) {
        phaseRef.current += 0.012;

        // Draw quantum interference mandala for each frequency
        frequencies.slice(0, 8).forEach((freq, index) => {
          const normalizedFreq = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
          const radius = 50 + normalizedFreq * 70 + index * 20;
          const petals = 5 + Math.floor(normalizedFreq * 7);
          
          const hsl = BASE_COLORS[index % BASE_COLORS.length];

          // Draw interference petals
          for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2 + phaseRef.current * (0.8 + index * 0.1);
            const petalRadius = radius * (0.5 + 0.5 * Math.sin(phaseRef.current * 1.5 + i * 0.4));
            
            ctx.beginPath();
            for (let t = 0; t <= Math.PI * 2; t += 0.04) {
              const r = petalRadius * Math.abs(Math.cos((petals / 2) * t));
              const x = centerX + r * Math.cos(angle + t);
              const y = centerY + r * Math.sin(angle + t);
              
              if (t === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            
            ctx.closePath();
            
            const opacity = 0.35 - index * 0.04;
            ctx.strokeStyle = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.shadowBlur = 18;
            ctx.shadowColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Draw pulsing rings
          for (let r = 0; r < 4; r++) {
            const ringRadius = 25 + r * 30 + Math.sin(phaseRef.current * 2.5 + r * 0.7) * 6;
            const opacity = 0.15 * (1 - r / 4);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

        // Draw energy connections
        if (frequencies.length > 1) {
          const nodes = Math.min(frequencies.length, 4);
          for (let i = 0; i < nodes; i++) {
            const angle1 = (i / nodes) * Math.PI * 2 + phaseRef.current * 0.5;
            const r = 45 + Math.sin(phaseRef.current + i * 1.5) * 8;
            const x1 = centerX + r * Math.cos(angle1);
            const y1 = centerY + r * Math.sin(angle1);
            
            const nextIndex = (i + 1) % nodes;
            const angle2 = (nextIndex / nodes) * Math.PI * 2 + phaseRef.current * 0.5;
            const x2 = centerX + r * Math.cos(angle2);
            const y2 = centerY + r * Math.sin(angle2);
            
            const hsl = BASE_COLORS[i % BASE_COLORS.length];
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.2)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw node points
            ctx.beginPath();
            ctx.arc(x1, y1, 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.6)`;
            ctx.fill();
          }
        }

        // Draw central quantum core
        const coreSize = 5 + Math.sin(phaseRef.current * 2.5) * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Idle state
        const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 160, 220, ${pulse * 0.5})`;
        ctx.fill();
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
  }, [frequencies, isPlaying]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-border/50 bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(180deg, #060a10 0%, #0a1018 100%)" }}
      />
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary/70" style={{ animation: "pulse 2s infinite" }} />
        <span className="text-xs text-muted-foreground bg-background/70 px-2 py-1 rounded backdrop-blur-sm">
          Quantum Harmonic Interference
        </span>
      </div>
    </div>
  );
};