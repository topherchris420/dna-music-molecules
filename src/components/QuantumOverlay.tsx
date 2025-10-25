import { useEffect, useRef } from "react";

interface QuantumOverlayProps {
  frequencies: number[];
  isPlaying: boolean;
  colors: string[];
}

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

      // Clear with fade effect
      ctx.fillStyle = "rgba(20, 25, 30, 0.08)";
      ctx.fillRect(0, 0, width, height);

      if (isPlaying && frequencies.length > 0) {
        phaseRef.current += 0.01;

        // Draw interference mandala patterns
        frequencies.forEach((freq, index) => {
          const normalizedFreq = (freq - 500) / 100; // Normalize around 500Hz
          const radius = 80 + index * 30;
          const petals = 8 + Math.floor(normalizedFreq);
          
          const color = colors[index] || "hsl(180, 100%, 50%)";
          const rgb = color.match(/\d+/g);
          
          if (rgb) {
            const hue = parseInt(rgb[0]);
            const sat = parseInt(rgb[1]);
            const light = parseInt(rgb[2]);

            // Draw quantum interference petals
            for (let i = 0; i < petals; i++) {
              const angle = (i / petals) * Math.PI * 2 + phaseRef.current;
              const petalRadius = radius * (0.7 + 0.3 * Math.sin(phaseRef.current * 2 + i));
              
              ctx.beginPath();
              for (let t = 0; t < Math.PI * 2; t += 0.1) {
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
              ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.3)`;
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Add glow
              ctx.shadowBlur = 15;
              ctx.shadowColor = color;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }

            // Draw central interference rings
            for (let r = 20; r < 150; r += 20) {
              const opacity = 0.15 * (1 - r / 150);
              ctx.beginPath();
              ctx.arc(
                centerX,
                centerY,
                r + Math.sin(phaseRef.current * 3) * 5,
                0,
                Math.PI * 2
              );
              ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${opacity})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });

        // Draw central quantum node
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
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
  }, [frequencies, isPlaying, colors]);

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-card/10">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
        Quantum Harmonic Interference
      </div>
    </div>
  );
};
