import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrequencyModulator } from "./FrequencyModulator";
import { ResonanceField } from "./ResonanceField";
import { WetwareCymaticScene } from "./WetwareCymaticScene";
import { Badge } from "@/components/ui/badge";
import { Activity, Waves, Zap } from "lucide-react";

export type EntrainmentMode = "focus" | "relaxation" | "coherence";

export const WetwareSimulator = () => {
  const [isActive, setIsActive] = useState(false);
  const [entrainmentMode, setEntrainmentMode] = useState<EntrainmentMode>("coherence");
  const [baseFrequency, setBaseFrequency] = useState(40); // Hz
  const [resonanceIntensity, setResonanceIntensity] = useState(0.5);
  const [modulationDepth, setModulationDepth] = useState(0.3);
  const [bioelectricActivity, setBioelectricActivity] = useState(0);

  // Simulate bioelectric feedback
  useEffect(() => {
    if (!isActive) {
      setBioelectricActivity(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate dynamic bioelectric response based on entrainment mode
      const modeMultiplier = {
        focus: 0.8,
        relaxation: 0.4,
        coherence: 0.6
      }[entrainmentMode];

      const activity = 
        Math.sin(Date.now() / 1000) * 0.3 + 
        Math.random() * 0.2 * modeMultiplier +
        resonanceIntensity * 0.5;
      
      setBioelectricActivity(Math.max(0, Math.min(1, activity)));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, entrainmentMode, resonanceIntensity]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge variant="outline" className="border-[hsl(var(--wetware-neural))] text-[hsl(var(--wetware-neural))]">
              Vers3Dynamics
            </Badge>
            <Badge variant="outline" className="border-[hsl(var(--wetware-bioelectric))] text-[hsl(var(--wetware-bioelectric))]">
              Wetware Computing
            </Badge>
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Bioelectrical Intelligence Simulator
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif leading-tight">
            <span className="font-normal text-foreground">Wetware Computer</span>
            <br />
            <span className="italic text-[hsl(var(--wetware-resonance))]">Resonant Intelligence</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Experience computation through biological vibration, rhythm, and bioelectric patterns.
            Model living systems computing via Dynamic Resonance Rooting principles.
          </p>
        </div>

        {/* Main Simulator */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="frequency" className="gap-2">
              <Waves className="w-4 h-4" />
              Frequency Layer
            </TabsTrigger>
            <TabsTrigger value="bioelectric" className="gap-2">
              <Zap className="w-4 h-4" />
              Bioelectric Field
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card/50 border-[hsl(var(--wetware-neural))]/30">
                <h3 className="text-xl font-serif mb-4 text-[hsl(var(--wetware-neural))]">
                  System Status
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">State:</span>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Idle"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entrainment Mode:</span>
                    <Badge 
                      className="capitalize"
                      style={{
                        backgroundColor: `hsl(var(--wetware-${entrainmentMode}))`
                      }}
                    >
                      {entrainmentMode}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base Frequency:</span>
                    <span className="font-mono">{baseFrequency} Hz</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bioelectric Activity:</span>
                    <span className="font-mono">{(bioelectricActivity * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 border-[hsl(var(--wetware-bioelectric))]/30">
                <h3 className="text-xl font-serif mb-4 text-[hsl(var(--wetware-bioelectric))]">
                  About Wetware Computing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This simulator models computation through biological processes: spiking neural networks,
                  reaction-diffusion chemistry, and bioelectric pattern dynamics. It demonstrates how living
                  systems compute through vibration, rhythm, and wetware architectures using Dynamic Resonance
                  Rooting principles.
                </p>
              </Card>
            </div>

            {/* 3D Cymatic Visualization */}
            <WetwareCymaticScene
              frequencies={[baseFrequency, baseFrequency * 1.5, baseFrequency * 2]}
              isPlaying={isActive}
              resonanceIntensity={resonanceIntensity}
              entrainmentMode={entrainmentMode}
            />
          </TabsContent>

          {/* Frequency Layer Tab */}
          <TabsContent value="frequency" className="space-y-6">
            <FrequencyModulator
              isActive={isActive}
              onToggle={setIsActive}
              entrainmentMode={entrainmentMode}
              onEntrainmentChange={setEntrainmentMode}
              baseFrequency={baseFrequency}
              onFrequencyChange={setBaseFrequency}
              resonanceIntensity={resonanceIntensity}
              onResonanceChange={setResonanceIntensity}
              modulationDepth={modulationDepth}
              onModulationChange={setModulationDepth}
            />

            {/* 2D Resonance Field Visualization */}
            <ResonanceField
              isActive={isActive}
              baseFrequency={baseFrequency}
              resonanceIntensity={resonanceIntensity}
              modulationDepth={modulationDepth}
              entrainmentMode={entrainmentMode}
            />

            {/* 3D Cymatic Visualization */}
            <WetwareCymaticScene
              frequencies={[baseFrequency, baseFrequency * 1.5, baseFrequency * 2]}
              isPlaying={isActive}
              resonanceIntensity={resonanceIntensity}
              entrainmentMode={entrainmentMode}
            />
          </TabsContent>

          {/* Bioelectric Field Tab */}
          <TabsContent value="bioelectric" className="space-y-6">
            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-serif mb-4 text-[hsl(var(--wetware-bioelectric))]">
                Bioelectric Field Dynamics
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Real-time bioelectric pattern visualization showing voltage dynamics and field interactions.
                Coming soon: voltage maps, spike rasters, and interactive neural ensembles.
              </p>
              <div className="h-64 bg-background/50 rounded-lg border border-border flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Zap className="w-12 h-12 mx-auto text-[hsl(var(--wetware-bioelectric))]/50" />
                  <p className="text-sm text-muted-foreground">Bioelectric visualization coming soon</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Attribution */}
        <div className="text-center py-8 text-xs text-muted-foreground">
          Built by <span className="text-[hsl(var(--wetware-resonance))]">Vers3Dynamics</span>
          {" · "}
          Wetware Computing Research Initiative
        </div>
      </div>
    </div>
  );
};
