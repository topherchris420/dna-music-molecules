import { motion } from "framer-motion";

const LETTERS = ["R", "A", "I", "N"];

const LETTER_PATHS: Record<string, string> = {
  R: "M6 4 L6 20 M6 4 L14 4 Q18 4 18 9 Q18 14 14 14 L6 14 M12 14 L18 20",
  A: "M12 4 L4 20 M12 4 L20 20 M6.5 14.5 L17.5 14.5",
  I: "M8 4 L16 4 M12 4 L12 20 M8 20 L16 20",
  N: "M5 20 L5 4 L19 20 L19 4",
};

export const RainMonogram = () => {
  return (
    <motion.div
      className="flex flex-col items-start gap-3 mb-6"
      initial="hidden"
      animate="visible"
    >
      {/* Animated SVG monogram */}
      <div className="relative flex items-center gap-1">
        {LETTERS.map((letter, i) => (
          <div key={letter} className="relative flex items-center">
            <motion.svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="overflow-visible"
            >
              {/* Glow layer */}
              <motion.path
                d={LETTER_PATHS[letter]}
                stroke="hsl(var(--primary))"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "blur(4px)", opacity: 0.3 }}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  delay: i * 0.22,
                  duration: 1.2,
                  ease: "easeInOut" as const,
                }}
              />
              {/* Main stroke */}
              <motion.path
                d={LETTER_PATHS[letter]}
                stroke="hsl(var(--primary))"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: {
                    delay: i * 0.22,
                    duration: 1.2,
                    ease: "easeInOut" as const,
                  },
                  opacity: { delay: i * 0.22, duration: 0.01 },
                }}
              />
            </motion.svg>

            {/* Dot separator between letters */}
            {i < LETTERS.length - 1 && (
              <motion.span
                className="w-[3px] h-[3px] rounded-full bg-primary mx-0.5 opacity-70 inline-block"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 1.1 + i * 0.08,
                  type: "spring" as const,
                  stiffness: 300,
                }}
              />
            )}
          </div>
        ))}

        {/* Ambient pulse glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
          }}
          animate={{
            opacity: [0.15, 0.35, 0.15],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
      </div>

      {/* "LAB" wordmark fades in after letters draw */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5, ease: "easeOut" as const }}
      >
        <div className="h-px w-6 bg-primary/40" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-primary/70 font-mono">
          Lab
        </span>
      </motion.div>
    </motion.div>
  );
};
