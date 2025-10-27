import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dna } from "lucide-react";

interface EvolutionaryModeProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onMutation: (mutation: EvolutionMutation) => void;
}

export interface EvolutionMutation {
  frequencyDetune: number; // -100 to +100 cents
  tempoVariation: number; // 0.8 to 1.2 multiplier
  harmonicBlend: number; // 0 to 1
}

export const EvolutionaryMode = ({ enabled, onToggle, onMutation }: EvolutionaryModeProps) => {
  const [mutationRate, setMutationRate] = useState(30);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Generate mutations based on rate
      const intensity = mutationRate / 100;
      const mutation: EvolutionMutation = {
        frequencyDetune: (Math.random() - 0.5) * 200 * intensity,
        tempoVariation: 1 + (Math.random() - 0.5) * 0.4 * intensity,
        harmonicBlend: Math.random() * intensity,
      };

      onMutation(mutation);
      setGeneration(g => g + 1);
    }, 3000); // Mutate every 3 seconds

    return () => clearInterval(interval);
  }, [enabled, mutationRate, onMutation]);

  return (
    <Card className="p-4 sm:p-6 bg-card/20 border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Dna className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <Label className="text-sm sm:text-base font-medium">Evolutionary Mode</Label>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Music evolves as life does — parameters mutate with each cycle
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <div className="space-y-4 pt-4 mt-4 border-t border-border">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Mutation Rate</Label>
              <span className="text-muted-foreground">{mutationRate}%</span>
            </div>
            <Slider
              value={[mutationRate]}
              onValueChange={([value]) => setMutationRate(value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span>Generation:</span>
              <span className="font-mono text-primary">{generation}</span>
            </div>
            <div className="text-[10px] opacity-70 mt-2">
              Each generation introduces subtle variations in frequency, tempo, and harmonics
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
