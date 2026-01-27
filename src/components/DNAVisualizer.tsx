import { useEffect, useRef } from "react";

interface DNAVisualizerProps {
  sequence: string;
  currentIndex: number;
  isPlaying: boolean;
  colors: Record<string, string>;
}

// DNA base colors matching CSS variables
const BASE_COLORS: Record<string, { h: number; s: number; l: number }> = {
  A: { h: 180, s: 100, l: 50 }, // Adenine - cyan (matches --dna-adenine)
  T: { h: 30, s: 100, l: 55 },  // Thymine - orange (matches --dna-thymine)
  C: { h: 320, s: 90, l: 60 },  // Cytosine - magenta (matches --dna-cytosine)
  G: { h: 120, s: 80, l: 50 },  // Guanine - green (matches --dna-guanine)
};

export const DNAVisualizer = ({
  sequence,
  currentIndex,
  isPlaying,
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
  const wavePhaseRef = useRef(0);

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
      // Clear with gradient fade
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(10, 15, 25, 0.15)");
      gradient.addColorStop(1, "rgba(15, 20, 35, 0.15)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Animate wave phase
      if (isPlaying) {
        wavePhaseRef.current += 0.03;
      }

      // Draw background waveform visualization
      const validBases = sequence.toUpperCase().split("").filter(b => BASE_COLORS[b]);
      if (validBases.length > 0) {
        // Draw subtle wave pattern
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const progress = x / width;
          const baseIndex = Math.floor(progress * validBases.length);
          const base = validBases[baseIndex];
          const color = BASE_COLORS[base];
          
          if (color) {
            const waveY = height / 2 + 
              Math.sin(x * 0.02 + wavePhaseRef.current) * 20 +
              Math.sin(x * 0.05 + wavePhaseRef.current * 1.5) * 10;
            
            if (x === 0) {
              ctx.moveTo(x, waveY);
            } else {
              ctx.lineTo(x, waveY);
            }
          }
        }
        ctx.strokeStyle = "rgba(100, 150, 200, 0.1)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Add particles when playing
      if (isPlaying && currentIndex >= 0) {
        const base = sequence[currentIndex % sequence.length]?.toUpperCase();
        if (base && BASE_COLORS[base]) {
          for (let i = 0; i < 4; i++) {
            particles.push({
              x: width / 2 + (Math.random() - 0.5) * 100,
              y: height / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6 - 2,
              base,
              alpha: 1,
              size: 3 + Math.random() * 4,
            });
          }
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.06;
        particle.alpha *= 0.96;
        particle.vx *= 0.99;

        if (particle.alpha < 0.01 || particles.length > 200) {
          particles.splice(i, 1);
          continue;
        }

        const color = BASE_COLORS[particle.base];
        if (color) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * particle.alpha, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${particle.alpha * 0.8})`;
          ctx.fill();

          // Glow
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw DNA base sequence
      if (validBases.length === 0) {
        // Draw placeholder text
        ctx.fillStyle = "rgba(100, 120, 150, 0.5)";
        ctx.font = "14px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Enter a DNA sequence (A, T, C, G)", width / 2, height / 2);
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const maxSpacing = 55;
      const minSpacing = 28;
      const spacing = Math.max(minSpacing, Math.min(maxSpacing, (width - 100) / validBases.length));
      const totalWidth = spacing * (validBases.length - 1);
      const startX = (width - totalWidth) / 2;

      // Draw connecting lines first
      validBases.forEach((base, index) => {
        if (index < validBases.length - 1) {
          const x = startX + index * spacing;
          const nextX = startX + (index + 1) * spacing;
          const y = height / 2;
          const color = BASE_COLORS[base];
          const nextColor = BASE_COLORS[validBases[index + 1]];
          
          if (color && nextColor) {
            const gradient = ctx.createLinearGradient(x, y, nextX, y);
            gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.3)`);
            gradient.addColorStop(1, `hsla(${nextColor.h}, ${nextColor.s}%, ${nextColor.l}%, 0.3)`);
            
            ctx.beginPath();
            ctx.moveTo(x + 15, y);
            ctx.lineTo(nextX - 15, y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });

      // Draw bases
      validBases.forEach((base, index) => {
        const x = startX + index * spacing;
        const y = height / 2;
        const isActive = index === currentIndex % validBases.length;
        const pulseScale = isActive ? 1 + Math.sin(wavePhaseRef.current * 3) * 0.15 : 1;
        const scale = (isActive ? 1.5 : 1) * pulseScale;
        const baseRadius = 14;

        const color = BASE_COLORS[base];
        if (!color) return;

        // Draw outer glow for active base
        if (isActive) {
          ctx.beginPath();
          ctx.arc(x, y, baseRadius * scale + 8, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.2)`;
          ctx.fill();
        }

        // Draw base circle
        ctx.beginPath();
        ctx.arc(x, y, baseRadius * scale, 0, Math.PI * 2);
        
        if (isActive) {
          // Create gradient for active base
          const grad = ctx.createRadialGradient(x, y, 0, x, y, baseRadius * scale);
          grad.addColorStop(0, `hsl(${color.h}, ${color.s}%, ${color.l + 15}%)`);
          grad.addColorStop(1, `hsl(${color.h}, ${color.s}%, ${color.l}%)`);
          ctx.fillStyle = grad;
          ctx.shadowBlur = 25;
          ctx.shadowColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
        } else {
          ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.5)`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw base letter
        ctx.fillStyle = isActive ? "#ffffff" : "rgba(255, 255, 255, 0.8)";
        ctx.font = `bold ${15 * scale}px 'SF Mono', 'Monaco', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(base, x, y + 1);
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
  }, [sequence, currentIndex, isPlaying]);

  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden border border-border/50 bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(180deg, #0a0f18 0%, #0f1520 100%)" }}
      />
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-muted-foreground bg-background/70 px-2 py-1 rounded backdrop-blur-sm">
          DNA Frequency Sequencer
        </span>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-4">
        {Object.entries(BASE_COLORS).map(([base, color]) => (
          <div key={base} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }}
            />
            <span className="text-[10px] text-muted-foreground font-mono">{base}</span>
          </div>
        ))}
      </div>
    </div>
  );
};