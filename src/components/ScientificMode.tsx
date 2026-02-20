import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Activity, Music2, Waves } from "lucide-react";

interface ScientificModeProps {
  frequencies: Record<string, number>;
  currentKey: string;
  keyMultiplier: number;
}

const DNA_BASE_INFO = {
  A: {
    name: "Adenine",
    note: "F♯4",
    wavelength: "1.58 μm",
    irBand: "C-N stretch",
    color: "hsl(var(--dna-adenine))"
  },
  T: {
    name: "Thymine",
    note: "A♯4",
    wavelength: "1.42 μm",
    irBand: "C=O stretch",
    color: "hsl(var(--dna-thymine))"
  },
  C: {
    name: "Cytosine",
    note: "C♯5",
    wavelength: "1.35 μm",
    irBand: "N-H bend",
    color: "hsl(var(--dna-cytosine))"
  },
  G: {
    name: "Guanine",
    note: "D♯5",
    wavelength: "1.28 μm",
    irBand: "C=N stretch",
    color: "hsl(var(--dna-guanine))"
  },
};

export const ScientificMode = ({ frequencies, currentKey, keyMultiplier }: ScientificModeProps) => {
  return (
    <Card className="p-4 sm:p-6 bg-card/40 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h3 className="text-base font-medium text-foreground">Scientific Mode</h3>
        <span className="text-xs text-muted-foreground ml-auto">Research View</span>
      </div>

      <Tabs defaultValue="frequencies" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 mb-4">
          <TabsTrigger value="frequencies" className="text-xs gap-1">
            <Music2 className="w-3 h-3" />
            Frequencies
          </TabsTrigger>
          <TabsTrigger value="spectrum" className="text-xs gap-1">
            <Waves className="w-3 h-3" />
            IR Spectrum
          </TabsTrigger>
          <TabsTrigger value="mapping" className="text-xs gap-1">
            <Activity className="w-3 h-3" />
            Note Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frequencies" className="space-y-3">
          <p className="text-xs text-muted-foreground mb-4">
            Frequency data derived from infrared spectroscopy of DNA nucleobases
          </p>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(frequencies).map(([base, freq]) => {
              const info = DNA_BASE_INFO[base as keyof typeof DNA_BASE_INFO];
              const adjustedFreq = (freq * keyMultiplier).toFixed(1);

              return (
                <div
                  key={base}
                  className="p-3 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="font-mono text-sm font-bold">{base}</span>
                    <span className="text-xs text-muted-foreground">{info.name}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base Freq:</span>
                      <span className="font-mono text-foreground">{freq.toFixed(1)} Hz</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="font-mono text-primary">{adjustedFreq} Hz</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="spectrum" className="space-y-3">
          <p className="text-xs text-muted-foreground mb-4">
            Infrared absorption bands of DNA nucleobases (scaled to audible range)
          </p>

          <div className="space-y-3">
            {Object.entries(DNA_BASE_INFO).map(([base, info]) => {
              // Memoize the random width so it doesn't flicker on re-renders
              const spectrumWidth = useMemo(() => 70 + Math.random() * 25, []);

              return (
                <div
                  key={base}
                  className="p-3 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="font-mono text-sm font-bold">{base}</span>
                      <span className="text-xs text-muted-foreground">{info.name}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{info.wavelength}</span>
                  </div>

                  {/* Simulated spectrum bar */}
                  <div className="relative h-6 bg-muted/30 rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded opacity-80"
                      style={{
                        width: `${spectrumWidth}%`,
                        background: `linear-gradient(90deg, ${info.color} 0%, transparent 100%)`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] text-foreground/70">{info.irBand}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Based on research by David Deamer & Susan Alexjander (1999)
          </p>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-3">
          <p className="text-xs text-muted-foreground mb-4">
            Musical note mapping in current key ({currentKey.toUpperCase()})
          </p>

          <div className="grid grid-cols-4 gap-2">
            {Object.entries(frequencies).map(([base, freq]) => {
              const info = DNA_BASE_INFO[base as keyof typeof DNA_BASE_INFO];
              const adjustedFreq = freq * keyMultiplier;

              // Calculate musical note from frequency
              const midiNote = 12 * Math.log2(adjustedFreq / 440) + 69;
              const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
              const noteName = noteNames[Math.round(midiNote) % 12];
              const octave = Math.floor((Math.round(midiNote) - 12) / 12);

              return (
                <div
                  key={base}
                  className="p-3 rounded-lg border border-border bg-background/50 text-center"
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: info.color }}
                  >
                    <span className="font-mono text-sm font-bold text-white">{base}</span>
                  </div>
                  <div className="text-lg font-serif text-foreground">{noteName}{octave}</div>
                  <div className="text-[10px] text-muted-foreground">{adjustedFreq.toFixed(0)} Hz</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border">
            <h4 className="text-xs font-medium text-foreground mb-2">Key Signature Info</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <div>Reference: A4 = 440 Hz</div>
              <div>Tuning: Equal temperament</div>
              <div>Key multiplier: ×{keyMultiplier.toFixed(3)}</div>
              <div>Base key: F♯ (Susan Alexjander)</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};