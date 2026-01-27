import { useEffect, useRef } from "react";

interface QuantumOverlayProps {
  frequencies: number[];
  isPlaying: boolean;
  colors: string[];
}

// DNA frequency range: 370-622 Hz
const MIN_FREQ = 370;
const MAX_FREQ = 622;

// Parse HSL color from CSS variable format
const parseHslColor = (color: string): { h: number; s: number; l: number } | null => {
  // Handle "hsl(var(--dna-adenine))" format - extract default values
  const hslMatch = color.match(/hsl\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/);
  if (hslMatch) {
    return {
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3]),
    };
  }
  
  // Direct HSL values
  const directMatch = color.match(/(\d+),?\s*(\d+)%?,?\s*(\d+)%?/);
  if (directMatch) {
    return {
      h: parseInt(directMatch[1]),
      s: parseInt(directMatch[2]),
      l: parseInt(directMatch[3]),
    };
  }
  
  return null;
};

// Fallback colors for DNA bases
const FALLBACK_COLORS = [
  { h: 140, s: 80, l: 55 }, // Adenine - green
  { h: 280, s: 75, l: 60 }, // Thymine - purple
  { h: 45, s: 90, l: 55 },  // Cytosine - amber
  { h: 200, s: 85, l: 55 }, // Guanine - cyan
];

export const QuantumOverlay = ({ frequencies, isPlaying, colors }: QuantumOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

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

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with fade effect for trailing
      ctx.fillStyle = "rgba(15, 20, 30, 0.1)";
      ctx.fillRect(0, 0, width, height);

      if (isPlaying && frequencies.length > 0) {
        phaseRef.current += 0.015;

        // Draw interference mandala patterns for each frequency
        frequencies.slice(0, 8).forEach((freq, index) => {
          // Normalize frequency within DNA range (370-622 Hz)
          const normalizedFreq = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
          const radius = 60 + normalizedFreq * 80 + index * 25;
          const petals = 6 + Math.floor(normalizedFreq * 6);
          
          // Get color for this frequency
          const parsed = colors[index % colors.length] 
            ? parseHslColor(colors[index % colors.length])
            : null;
          const hsl = parsed || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

          // Draw quantum interference petals
          for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2 + phaseRef.current * (1 + index * 0.1);
            const petalRadius = radius * (0.6 + 0.4 * Math.sin(phaseRef.current * 2 + i * 0.5));
            
            ctx.beginPath();
            for (let t = 0; t <= Math.PI * 2; t += 0.05) {
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
            
            // Gradient opacity based on layer
            const opacity = 0.4 - index * 0.05;
            ctx.strokeStyle = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Draw pulsing interference rings
          const ringCount = 4;
          for (let r = 0; r < ringCount; r++) {
            const ringRadius = 30 + r * 35 + Math.sin(phaseRef.current * 2 + r) * 8;
            const opacity = 0.2 * (1 - r / ringCount);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });

        // Draw central quantum core with pulse
        const coreSize = 6 + Math.sin(phaseRef.current * 3) * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connecting energy lines between frequencies
        if (frequencies.length > 1) {
          frequencies.slice(0, 4).forEach((freq, i) => {
            const nextIndex = (i + 1) % Math.min(frequencies.length, 4);
            const angle1 = (i / 4) * Math.PI * 2 + phaseRef.current;
            const angle2 = (nextIndex / 4) * Math.PI * 2 + phaseRef.current;
            const r = 50 + Math.sin(phaseRef.current + i) * 10;
            
            ctx.beginPath();
            ctx.moveTo(centerX + r * Math.cos(angle1), centerY + r * Math.sin(angle1));
            ctx.lineTo(centerX + r * Math.cos(angle2), centerY + r * Math.sin(angle2));
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }
      } else {
        // Static idle state - subtle ambient glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(100, 150, 200, 0.5)";
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
  }, [frequencies, isPlaying, colors]);

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border bg-card/10">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(180deg, #0a0f18 0%, #121825 100%)" }}
      />
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
        Quantum Harmonic Interference
      </div>
    </div>
  );
};