import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Radio, Waves, Zap } from "lucide-react";
import type { EntrainmentMode } from "./WetwareSimulator";

interface FrequencyModulatorProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  entrainmentMode: EntrainmentMode;
  onEntrainmentChange: (mode: EntrainmentMode) => void;
  baseFrequency: number;
  onFrequencyChange: (freq: number) => void;
  resonanceIntensity: number;
  onResonanceChange: (intensity: number) => void;
  modulationDepth: number;
  onModulationChange: (depth: number) => void;
}

export const FrequencyModulator = ({
  isActive,
  onToggle,
  entrainmentMode,
  onEntrainmentChange,
  baseFrequency,
  onFrequencyChange,
  resonanceIntensity,
  onResonanceChange,
  modulationDepth,
  onModulationChange,
}: FrequencyModulatorProps) => {
  const entrainmentModes: { mode: EntrainmentMode; label: string; icon: any; description: string }[] = [
    {
      mode: "focus",
      label: "Focus",
      icon: Zap,
      description: "High beta waves (25-45 Hz) for concentration"
    },
    {
      mode: "relaxation",
      label: "Relaxation",
      icon: Waves,
      description: "Alpha waves (8-13 Hz) for calm states"
    },
    {
      mode: "coherence",
      label: "Coherence",
      icon: Radio,
      description: "Theta-gamma coupling (4-8 Hz + 40 Hz) for integration"
    },
  ];

  return (
    <Card className="p-6 bg-card/50 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif text-[hsl(var(--wetware-neural))]">
            Frequency Modulation Layer
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time resonant modulation with cymatic visualization
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => onToggle(!isActive)}
          className={
            isActive
              ? "bg-[hsl(var(--wetware-neural))] hover:bg-[hsl(var(--wetware-neural))]/90"
              : ""
          }
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </Button>
      </div>

      {/* Entrainment Mode Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Entrainment Mode</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {entrainmentModes.map(({ mode, label, icon: Icon, description }) => (
            <button
              key={mode}
              onClick={() => onEntrainmentChange(mode)}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  entrainmentMode === mode
                    ? `border-[hsl(var(--wetware-${mode}))] bg-[hsl(var(--wetware-${mode}))]/10`
                    : "border-border hover:border-[hsl(var(--wetware-silver))]/50"
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${
                  entrainmentMode === mode 
                    ? `text-[hsl(var(--wetware-${mode}))]`
                    : "text-muted-foreground"
                }`} />
                <span className="font-medium text-sm">{label}</span>
                {entrainmentMode === mode && (
                  <Badge 
                    variant="outline" 
                    className="ml-auto text-xs"
                    style={{ borderColor: `hsl(var(--wetware-${mode}))` }}
                  >
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency Controls */}
      <div className="space-y-6">
        {/* Base Frequency */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Base Frequency</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {baseFrequency} Hz
            </span>
          </div>
          <Slider
            value={[baseFrequency]}
            onValueChange={(value) => onFrequencyChange(value[0])}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Primary oscillation frequency for wetware modulation
          </p>
        </div>

        {/* Resonance Intensity */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Resonance Intensity</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {(resonanceIntensity * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[resonanceIntensity * 100]}
            onValueChange={(value) => onResonanceChange(value[0] / 100)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Amplitude of resonant field effects
          </p>
        </div>

        {/* Modulation Depth */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Modulation Depth</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {(modulationDepth * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[modulationDepth * 100]}
            onValueChange={(value) => onModulationChange(value[0] / 100)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Depth of frequency modulation and harmonic blending
          </p>
        </div>
      </div>
    </Card>
  );
};
