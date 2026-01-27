import { useEffect, useRef } from "react";

interface DNAVisualizerProps {
  sequence: string;
  currentIndex: number;
  isPlaying: boolean;
  colors: Record<string, string>;
}

// Map DNA bases to actual HSL colors
const BASE_COLORS: Record<string, { h: number; s: number; l: number }> = {
  A: { h: 140, s: 80, l: 55 }, // Adenine - green
  T: { h: 280, s: 75, l: 60 }, // Thymine - purple
  C: { h: 45, s: 90, l: 55 },  // Cytosine - amber
  G: { h: 200, s: 85, l: 55 }, // Guanine - cyan
};

export const DNAVisualizer = ({
  sequence,
  currentIndex,
  isPlaying,
  colors,
}: DNAVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    base: string;
    alpha: number;
    size: number;
  }>>([]);

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

    const particles = particlesRef.current;

    const animate = () => {
      // Clear with subtle fade for trailing effect
      ctx.fillStyle = "rgba(15, 20, 30, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Add particles when playing
      if (isPlaying && currentIndex >= 0) {
        const base = sequence[currentIndex % sequence.length]?.toUpperCase();
        if (base && BASE_COLORS[base]) {
          for (let i = 0; i < 5; i++) {
            particles.push({
              x: width / 2 + (Math.random() - 0.5) * 120,
              y: height / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5 - 2,
              base,
              alpha: 1,
              size: 3 + Math.random() * 3,
            });
          }
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.08; // Gravity
        particle.alpha *= 0.97;
        particle.vx *= 0.99; // Friction

        if (particle.alpha < 0.01) {
          particles.splice(i, 1);
          continue;
        }

        const color = BASE_COLORS[particle.base];
        if (color) {
          // Draw particle with glow
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${particle.alpha})`;
          ctx.fill();

          // Glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw DNA base sequence
      const validBases = sequence.toUpperCase().split("").filter(b => BASE_COLORS[b]);
      if (validBases.length === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const maxSpacing = 50;
      const minSpacing = 25;
      const spacing = Math.max(minSpacing, Math.min(maxSpacing, (width - 80) / validBases.length));
      const totalWidth = spacing * (validBases.length - 1);
      const startX = (width - totalWidth) / 2;

      validBases.forEach((base, index) => {
        const x = startX + index * spacing;
        const y = height / 2;
        const isActive = index === currentIndex % validBases.length;
        const scale = isActive ? 1.6 : 1;
        const baseRadius = 12;

        const color = BASE_COLORS[base];
        if (!color) return;

        // Draw connecting line
        if (index < validBases.length - 1) {
          ctx.beginPath();
          ctx.moveTo(x + baseRadius, y);
          ctx.lineTo(x + spacing - baseRadius, y);
          ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.2)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw base circle
        ctx.beginPath();
        ctx.arc(x, y, baseRadius * scale, 0, Math.PI * 2);
        
        if (isActive) {
          // Active base with bright glow
          ctx.fillStyle = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
          ctx.shadowBlur = 30;
          ctx.shadowColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
        } else {
          // Inactive base
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.4)`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw base letter
        ctx.fillStyle = isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
        ctx.font = `bold ${14 * scale}px 'SF Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(base, x, y);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [sequence, currentIndex, isPlaying, colors]);

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-card/20">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(180deg, #0f1520 0%, #151d2e 100%)" }}
      />
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
        DNA Sequencer
      </div>
    </div>
  );
};