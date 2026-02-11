import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, FlaskConical, Music } from "lucide-react";
import { toast } from "sonner";
import { DNAVisualizer } from "./DNAVisualizer";
import { FrequencyInfo } from "./FrequencyInfo";
import { EvolutionaryMode, EvolutionMutation } from "./EvolutionaryMode";
import { QuantumOverlay } from "./QuantumOverlay";
import { BiofeedbackInput } from "./BiofeedbackInput";
import { OrganismCategories } from "./OrganismCategories";
import { CymaticScene } from "./CymaticScene";
import { BottomSheet } from "./BottomSheet";
import { HarmonyExplorer, getKeyMultiplier } from "./HarmonyExplorer";
import { ScientificMode } from "./ScientificMode";
import { AdaptiveCompositionMode } from "./AdaptiveCompositionMode";

// DNA base frequencies mapped to F# scale with distinct tonal separation
// Based on Susan Alexjander's work, adjusted for clear melodic distinction
const BASE_DNA_FREQUENCIES = {
  A: 370.0, // Adenine - F#
  T: 466.2, // Thymine - A#
  C: 554.4, // Cytosine - C#
  G: 622.3, // Guanine - D#
};

const DNA_COLORS = {
  A: "hsl(var(--dna-adenine))",
  T: "hsl(var(--dna-thymine))",
  C: "hsl(var(--dna-cytosine))",
  G: "hsl(var(--dna-guanine))",
};

export const DNASynthesizer = () => {
  const [sequence, setSequence] = useState("ACGTACGT");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showScientificMode, setShowScientificMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("visualizer");
  const [organismName, setOrganismName] = useState("Custom");
  const [currentKey, setCurrentKey] = useState("f-sharp");
  
  // Advanced features state
  const [evolutionEnabled, setEvolutionEnabled] = useState(false);
  const [biofeedbackEnabled, setBiofeedbackEnabled] = useState(false);
  const [currentMutation, setCurrentMutation] = useState<EvolutionMutation>({
    frequencyDetune: 0,
    tempoVariation: 1,
    harmonicBlend: 0,
  });
  const [biofeedbackModulation, setBiofeedbackModulation] = useState(0);
  
  // Calculate frequencies based on current key
  const keyMultiplier = getKeyMultiplier(currentKey);
  const DNA_FREQUENCIES = {
    A: BASE_DNA_FREQUENCIES.A * keyMultiplier,
    T: BASE_DNA_FREQUENCIES.T * keyMultiplier,
    C: BASE_DNA_FREQUENCIES.C * keyMultiplier,
    G: BASE_DNA_FREQUENCIES.G * keyMultiplier,
  };
  
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    // Crumar GDS (General Development System, ~1980) — signal chain
    // 32 sine/triangle digital oscillators, 128-band fixed filter bank,
    // 16-stage envelopes. Pioneered by Hal Alles at Bell Labs.
    // Iconic on Wendy Carlos' TRON soundtrack.

    const reverb = new Tone.Reverb({ decay: 4.5, wet: 0.3 }).toDestination();
    // Subtle chorus emulates the GDS's slight inter-partial detuning
    const chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 2.8, depth: 0.15, wet: 0.15 }).connect(reverb);
    // EQ3 simulates the GDS's 128-band fixed filter bank — bright top-end presence
    const eq = new Tone.EQ3({ low: -2, mid: 0, high: 4 }).connect(chorus);
    const delay = new Tone.FeedbackDelay("8n.", 0.15).connect(eq);

    // FM synthesis approximating GDS additive partials:
    // The GDS used sine + triangle waves with independent frequency envelopes
    // per partial, creating characteristic bell/crystalline timbres
    synthRef.current = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.56,          // bell-tone ratio — inharmonic partials like tubular bells
      modulationIndex: 8,         // refined spectral richness without harshness
      oscillator: { type: "sine" },
      modulation: { type: "triangle" },  // authentic to GDS's sine/triangle oscillators
      envelope: {
        attack: 0.002,            // near-instant attack — GDS's digital precision
        decay: 1.0,               // gradual decay reveals spectral evolution
        sustain: 0.08,            // low sustain — tones bloom then thin (GDS signature)
        release: 2.8,             // long crystalline tail
      },
      modulationEnvelope: {
        attack: 0.005,
        decay: 0.35,              // fast mod decay → harmonics brighten then mellow
        sustain: 0.04,            // minimal sustained modulation — pure tone emerges
        release: 1.8,             // modulation fades independently of carrier
      },
    }).connect(delay);

    synthRef.current.volume.value = -6;

    return () => {
      sequenceRef.current?.dispose();
      synthRef.current?.dispose();
      reverb.dispose();
      chorus.dispose();
      eq.dispose();
      delay.dispose();
    };
  }, []);

  const playSequence = useCallback(async () => {
    if (!synthRef.current) return;

    await Tone.start();
    
    const validBases = sequence.toUpperCase().split("").filter(base => 
      ["A", "T", "C", "G"].includes(base)
    );

    if (validBases.length === 0) {
      toast.error("Please enter a valid DNA sequence (A, T, C, G)");
      return;
    }

    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    let index = 0;
    sequenceRef.current = new Tone.Sequence(
      (time, base) => {
        // Apply evolutionary mutations
        let freq = DNA_FREQUENCIES[base as keyof typeof DNA_FREQUENCIES];
        freq += currentMutation.frequencyDetune * 0.1; // Detune in Hz
        
        // Apply biofeedback modulation to volume
        if (synthRef.current) {
          const volume = -10 + biofeedbackModulation * 10; // -10dB to 0dB
          synthRef.current.volume.value = volume;
        }
        
        // Apply harmonic blending
        if (currentMutation.harmonicBlend > 0.3 && synthRef.current) {
          // Play harmonics
          const harmonic = freq * 2;
          synthRef.current.triggerAttackRelease(
            [freq, harmonic],
            "4n",
            time,
            0.5 + currentMutation.harmonicBlend * 0.3
          );
        } else {
          synthRef.current?.triggerAttackRelease(freq, "4n", time);
        }
        
        Tone.Draw.schedule(() => {
          setCurrentIndex(index);
          index = (index + 1) % validBases.length;
        }, time);
      },
      validBases,
      `${4 / currentMutation.tempoVariation}n` // Apply tempo variation
    );

    sequenceRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
    toast.success(evolutionEnabled 
      ? "Listening to DNA evolving in real-time..." 
      : "Listening to the song of DNA..."
    );
  }, [sequence, currentMutation, biofeedbackModulation, evolutionEnabled, keyMultiplier]);

  const stopSequence = () => {
    Tone.Transport.stop();
    sequenceRef.current?.stop();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const handleSequenceChange = (value: string) => {
    const filtered = value.toUpperCase().replace(/[^ATCG]/g, "");
    setSequence(filtered);
    setOrganismName("Custom");
  };

  const handleOrganismSelect = (seq: string, name: string) => {
    setSequence(seq);
    setOrganismName(name);
    if (isPlaying) {
      stopSequence();
    }
    toast.success(`Loaded ${name} DNA sequence`);
  };

  const handleMutation = useCallback((mutation: EvolutionMutation) => {
    setCurrentMutation(mutation);
    if (isPlaying) {
      // Restart sequence with new mutations
      stopSequence();
      setTimeout(() => playSequence(), 100);
    }
  }, [isPlaying]);

  const handleBiofeedback = useCallback((modulation: number) => {
    setBiofeedbackModulation(modulation);
  }, []);

  // Get current frequencies for visualizations
  const currentFrequencies = sequence
    .toUpperCase()
    .split("")
    .filter(base => ["A", "T", "C", "G"].includes(base))
    .map(base => DNA_FREQUENCIES[base as keyof typeof DNA_FREQUENCIES]);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-5 pt-3 sm:pt-10">
          <p className="text-[10px] sm:text-sm text-muted-foreground tracking-wider uppercase">
            Molecular Music Synthesizer
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-tight">
            <span className="font-normal text-foreground">R.A.I.N. Lab</span>
            <br />
            <span className="italic text-foreground">DNA is F♯</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            Experience evolution, quantum harmonics, and cymatic geometry in real time.
          </p>
          {organismName !== "Custom" && (
            <p className="text-xs text-primary font-medium">
              ♪ {organismName}
            </p>
          )}
        </div>

        {/* Main Card */}
        <Card className="p-3 sm:p-5 md:p-8 bg-card/40 backdrop-blur-sm border-border/50">
          <div className="space-y-4 sm:space-y-5">
            {/* Sequence Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                DNA Sequence
              </label>
              <Input
                value={sequence}
                onChange={(e) => handleSequenceChange(e.target.value)}
                placeholder="Enter DNA sequence (A, T, C, G)"
                className="text-lg font-mono tracking-wider bg-input border-border focus:border-primary transition-colors"
                maxLength={32}
              />
              <p className="text-xs text-muted-foreground">
                Enter up to 32 bases (A, T, C, G)
              </p>
            </div>

            {/* Controls - Desktop only */}
            <div className="hidden md:flex gap-4 items-center justify-center">
              <Button
                onClick={isPlaying ? stopSequence : playSequence}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Play
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setShowScientificMode(!showScientificMode)}
                variant="outline"
                size="lg"
                className="border-border hover:bg-muted rounded-full px-8"
              >
                <FlaskConical className="mr-2 h-5 w-5" />
                {showScientificMode ? "Hide" : "Show"} Research
              </Button>
            </div>

            {/* Harmony Explorer */}
            <div className="flex justify-center">
              <HarmonyExplorer 
                currentKey={currentKey}
                onKeyChange={(key) => {
                  setCurrentKey(key);
                  if (isPlaying) {
                    stopSequence();
                    setTimeout(() => playSequence(), 100);
                  }
                  toast.success(`Shifted to ${key === "f-sharp" ? "F♯" : key.toUpperCase()} key`);
                }}
              />
            </div>

            {/* Advanced Visualizations */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30">
                <TabsTrigger value="visualizer" className="gap-1">
                  <Music className="w-3 h-3 hidden sm:inline" />
                  DNA Sequencer
                </TabsTrigger>
                <TabsTrigger value="quantum">Quantum Field</TabsTrigger>
                <TabsTrigger value="cymatic">Cymatic 3D</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visualizer" className="mt-4">
                <DNAVisualizer
                  sequence={sequence}
                  currentIndex={currentIndex}
                  isPlaying={isPlaying}
                  colors={DNA_COLORS}
                />
              </TabsContent>
              
              <TabsContent value="quantum" className="mt-4">
                <QuantumOverlay
                  frequencies={currentFrequencies}
                  isPlaying={isPlaying}
                  colors={Object.values(DNA_COLORS)}
                />
              </TabsContent>
              
              <TabsContent value="cymatic" className="mt-4">
                <CymaticScene
                  frequencies={currentFrequencies}
                  isPlaying={isPlaying}
                  biofeedback={biofeedbackModulation}
                />
              </TabsContent>
            </Tabs>

            {/* Scientific Mode - Research View */}
            {showScientificMode && (
              <ScientificMode 
                frequencies={BASE_DNA_FREQUENCIES} 
                currentKey={currentKey}
                keyMultiplier={keyMultiplier}
              />
            )}
          </div>
        </Card>

        {/* Adaptive Composition Mode */}
        <AdaptiveCompositionMode
          onSequenceGenerated={handleOrganismSelect}
          isPlaying={isPlaying}
        />

        {/* Advanced Features - Desktop view */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 sm:gap-6">
          <EvolutionaryMode
            enabled={evolutionEnabled}
            onToggle={setEvolutionEnabled}
            onMutation={handleMutation}
          />
          
          <BiofeedbackInput
            enabled={biofeedbackEnabled}
            onToggle={setBiofeedbackEnabled}
            onBiofeedback={handleBiofeedback}
          />
        </div>

        {/* Organism Selector with Categories */}
        <OrganismCategories
          organisms={[
            { name: "Human", sequence: "ATCGATCGATCGATCG", description: "Homo sapiens — complex, adaptive, conscious", icon: "👨🏿" },
            { name: "Coral", sequence: "GCTAGCTAGCTAGCTA", description: "Ancient reef builder — symbiotic, regenerative", icon: "🪸" },
            { name: "Tardigrade", sequence: "CGCGATATCGCGATAT", description: "Water bear — indestructible, extremophile", icon: "🐻" },
            { name: "Mycelium", sequence: "TATACGCGATATATAT", description: "Fungal network — communicative, earth-binding", icon: "🍄" },
            { name: "E. coli", sequence: "ATATATCGCGATATAT", description: "Bacterial pioneer — rapid, essential", icon: "🦠" },
            { name: "Redwood", sequence: "CGATATCGATATCGAT", description: "Ancient tree — towering, enduring", icon: "🌲" },
          ]}
          onSelect={handleOrganismSelect}
          currentSequence={sequence}
          isPlaying={isPlaying}
        />

        {/* Educational Footer */}
        <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-2 px-4">
          <p>
            Based on the work of composer Susan Alexjander and biologist David Deamer
          </p>
          <p>
            Mapping infrared vibrational frequencies of DNA bases to musical pitches
          </p>
          <p className="text-xs opacity-70 mt-4">
            <a 
              href="https://vers3dynamics.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              built by Vers3Dynamics
            </a>
          </p>
        </div>
      </div>

      {/* Mobile Bottom Sheet Controls */}
      <BottomSheet
        isPlaying={isPlaying}
        onPlay={playSequence}
        onStop={stopSequence}
        organismName={organismName}
      >
        <div className="space-y-4">
          <EvolutionaryMode
            enabled={evolutionEnabled}
            onToggle={setEvolutionEnabled}
            onMutation={handleMutation}
          />
          
          <BiofeedbackInput
            enabled={biofeedbackEnabled}
            onToggle={setBiofeedbackEnabled}
            onBiofeedback={handleBiofeedback}
          />

          <Button
            onClick={() => setShowScientificMode(!showScientificMode)}
            variant="outline"
            className="w-full"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {showScientificMode ? "Hide" : "Show"} Research
          </Button>
          
          <HarmonyExplorer 
            currentKey={currentKey}
            onKeyChange={(key) => {
              setCurrentKey(key);
              toast.success(`Shifted to ${key === "f-sharp" ? "F♯" : key.toUpperCase()} key`);
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
};
