import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrequencyModulator } from "./FrequencyModulator";
import { ResonanceField } from "./ResonanceField";
import { WetwareCymaticScene } from "./WetwareCymaticScene";
import { PhotophoneSimulator } from "./photophone/PhotophoneSimulator";
import { Badge } from "@/components/ui/badge";
import { Activity, Waves, Zap, Sun } from "lucide-react";

export type EntrainmentMode = "focus" | "relaxation" | "coherence";

export const WetwareSimulator = () => {
  const [isActive, setIsActive] = useState(false);
  const [entrainmentMode, setEntrainmentMode] = useState<EntrainmentMode>("coherence");
  const [baseFrequency, setBaseFrequency] = useState(40);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card/30 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
            <Badge variant="outline" className="border-[hsl(var(--wetware-neural))] text-[hsl(var(--wetware-neural))] text-[10px] sm:text-xs">
              Vers3Dynamics
            </Badge>
            <Badge variant="outline" className="border-[hsl(var(--wetware-bioelectric))] text-[hsl(var(--wetware-bioelectric))] text-[10px] sm:text-xs">
              Wetware Computing
            </Badge>
          </div>
          <p className="text-[10px] sm:text-sm uppercase tracking-widest text-muted-foreground">
            Bioelectrical Intelligence Simulator
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-tight">
            <span className="font-normal text-foreground">Wetware Computer</span>
            <br />
            <span className="italic text-[hsl(var(--wetware-resonance))]">Resonant Intelligence</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-sm md:text-base px-4 leading-relaxed">
            Experience computation through biological vibration, rhythm, and bioelectric patterns.
          </p>
        </div>

        {/* Main Simulator */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 bg-card/50 h-10 sm:h-12">
              <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="frequency" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
                <Waves className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Frequency
              </TabsTrigger>
              <TabsTrigger value="bioelectric" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Bioelectric
              </TabsTrigger>
              <TabsTrigger value="photophone" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Photophone
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6 bg-card/50 border-[hsl(var(--wetware-neural))]/30">
                <h3 className="text-lg sm:text-xl font-serif mb-3 sm:mb-4 text-[hsl(var(--wetware-neural))]">
                  System Status
                </h3>
                <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">State:</span>
                    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                      {isActive ? "Active" : "Idle"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entrainment:</span>
                    <Badge 
                      className="capitalize text-xs"
                      style={{
                        backgroundColor: `hsl(var(--wetware-${entrainmentMode}))`
                      }}
                    >
                      {entrainmentMode}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-mono text-xs">{baseFrequency} Hz</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Activity:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[hsl(var(--wetware-bioelectric))] transition-all duration-200"
                          style={{ width: `${bioelectricActivity * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{(bioelectricActivity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6 bg-card/50 border-[hsl(var(--wetware-bioelectric))]/30">
                <h3 className="text-lg sm:text-xl font-serif mb-3 sm:mb-4 text-[hsl(var(--wetware-bioelectric))]">
                  About Wetware Computing
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  This simulator models computation through biological processes: spiking neural networks,
                  reaction-diffusion chemistry, and bioelectric pattern dynamics. It demonstrates how living
                  systems compute through vibration, rhythm, and wetware architectures using Dynamic Resonance
                  Rooting principles.
                </p>
              </Card>
            </div>

            <WetwareCymaticScene
              frequencies={[baseFrequency, baseFrequency * 1.5, baseFrequency * 2]}
              isPlaying={isActive}
              resonanceIntensity={resonanceIntensity}
              entrainmentMode={entrainmentMode}
            />
          </TabsContent>

          {/* Frequency Layer Tab */}
          <TabsContent value="frequency" className="space-y-4 sm:space-y-6">
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

            <ResonanceField
              isActive={isActive}
              baseFrequency={baseFrequency}
              resonanceIntensity={resonanceIntensity}
              modulationDepth={modulationDepth}
              entrainmentMode={entrainmentMode}
            />

            <WetwareCymaticScene
              frequencies={[baseFrequency, baseFrequency * 1.5, baseFrequency * 2]}
              isPlaying={isActive}
              resonanceIntensity={resonanceIntensity}
              entrainmentMode={entrainmentMode}
            />
          </TabsContent>

          {/* Bioelectric Field Tab */}
          <TabsContent value="bioelectric" className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 bg-card/50">
              <h3 className="text-lg sm:text-xl font-serif mb-3 sm:mb-4 text-[hsl(var(--wetware-bioelectric))]">
                Bioelectric Field Dynamics
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Real-time bioelectric pattern visualization showing voltage dynamics and field interactions.
              </p>
              <div className="h-48 sm:h-64 bg-background/50 rounded-lg border border-border flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Zap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-[hsl(var(--wetware-bioelectric))]/50" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Photophone Lab Tab */}
          <TabsContent value="photophone" className="space-y-4 sm:space-y-6">
            <PhotophoneSimulator />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-6 sm:py-8 text-[10px] sm:text-xs text-muted-foreground">
          Built by <span className="text-[hsl(var(--wetware-resonance))]">Vers3Dynamics</span>
          {" · "}
          Wetware Computing Research Initiative
        </div>
      </div>
    </div>
  );
};
