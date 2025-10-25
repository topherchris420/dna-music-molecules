import { Card } from "@/components/ui/card";

interface FrequencyInfoProps {
  frequencies: Record<string, number>;
  colors: Record<string, string>;
}

export const FrequencyInfo = ({ frequencies, colors }: FrequencyInfoProps) => {
  const baseNames = {
    A: "Adenine",
    T: "Thymine",
    C: "Cytosine",
    G: "Guanine",
  };

  const musicalNotes = {
    A: "C♯5",
    T: "C♯5",
    C: "C5",
    G: "C♯5",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      {Object.entries(frequencies).map(([base, freq]) => (
        <Card
          key={base}
          className="p-4 bg-card/20 border-border hover:border-primary/30 transition-all"
          style={{
            boxShadow: `0 0 15px ${colors[base as keyof typeof colors]}20`,
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold animate-pulse-glow"
                style={{
                  backgroundColor: `${colors[base as keyof typeof colors]}20`,
                  color: colors[base as keyof typeof colors],
                  boxShadow: `0 0 20px ${colors[base as keyof typeof colors]}60`,
                }}
              >
                {base}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Note</div>
                <div className="text-sm font-mono font-bold">
                  {musicalNotes[base as keyof typeof musicalNotes]}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {baseNames[base as keyof typeof baseNames]}
              </div>
              <div className="text-lg font-mono font-bold">{freq.toFixed(1)} Hz</div>
            </div>
            <div className="text-xs text-muted-foreground">
              From IR vibrational spectrum
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
