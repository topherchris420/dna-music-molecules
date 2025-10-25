import { useEffect, useRef } from "react";

interface DNAVisualizerProps {
  sequence: string;
  currentIndex: number;
  isPlaying: boolean;
  colors: Record<string, string>;
}

export const DNAVisualizer = ({
  sequence,
  currentIndex,
  isPlaying,
  colors,
}: DNAVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

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

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      base: string;
      alpha: number;
    }> = [];

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = "rgba(20, 20, 40, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Add particles when playing
      if (isPlaying && currentIndex >= 0) {
        const base = sequence[currentIndex % sequence.length];
        if (["A", "T", "C", "G"].includes(base)) {
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: width / 2 + (Math.random() - 0.5) * 100,
              y: height / 2,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4 - 2,
              base,
              alpha: 1,
            });
          }
        }
      }

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.alpha *= 0.98;

        if (particle.alpha < 0.01) {
          particles.splice(index, 1);
          return;
        }

        const color = colors[particle.base as keyof typeof colors];
        const rgb = color.match(/\d+/g);
        if (rgb) {
          ctx.fillStyle = `hsla(${rgb[0]}, ${rgb[1]}%, ${rgb[2]}%, ${particle.alpha})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Glow effect
          ctx.shadowBlur = 20;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw DNA bases
      const validBases = sequence.split("").filter(b => ["A", "T", "C", "G"].includes(b));
      const spacing = Math.min(width / (validBases.length + 1), 60);
      const startX = (width - spacing * (validBases.length - 1)) / 2;

      validBases.forEach((base, index) => {
        const x = startX + index * spacing;
        const y = height / 2;
        const isActive = index === currentIndex;
        const scale = isActive ? 1.5 : 1;
        const alpha = isActive ? 1 : 0.5;

        const color = colors[base as keyof typeof colors];
        const rgb = color.match(/\d+/g);
        if (rgb) {
          ctx.fillStyle = `hsla(${rgb[0]}, ${rgb[1]}%, ${rgb[2]}%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 10 * scale, 0, Math.PI * 2);
          ctx.fill();

          if (isActive) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          ctx.fillStyle = isActive ? "#ffffff" : "rgba(255,255,255,0.7)";
          ctx.font = `${12 * scale}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(base, x, y);
        }
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
        style={{ background: "transparent" }}
      />
    </div>
  );
};
