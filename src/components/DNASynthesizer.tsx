import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Info } from "lucide-react";
import { toast } from "sonner";
import { DNAVisualizer } from "./DNAVisualizer";
import { FrequencyInfo } from "./FrequencyInfo";
import { EvolutionaryMode, EvolutionMutation } from "./EvolutionaryMode";
import { QuantumOverlay } from "./QuantumOverlay";
import { BiofeedbackInput } from "./BiofeedbackInput";
import { OrganismSelector } from "./OrganismSelector";
import { CymaticScene } from "./CymaticScene";

// Real DNA base frequencies from IR spectroscopy, scaled to audible range
// Based on Susan Alexjander's work mapping DNA vibrations to F# scale
const DNA_FREQUENCIES = {
  A: 545.6, // Adenine - C#
  T: 543.4, // Thymine - C#
  C: 537.8, // Cytosine - C
  G: 550.0, // Guanine - C#
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
  const [showInfo, setShowInfo] = useState(false);
  const [selectedTab, setSelectedTab] = useState("visualizer");
  const [organismName, setOrganismName] = useState("Custom");
  
  // Advanced features state
  const [evolutionEnabled, setEvolutionEnabled] = useState(false);
  const [biofeedbackEnabled, setBiofeedbackEnabled] = useState(false);
  const [currentMutation, setCurrentMutation] = useState<EvolutionMutation>({
    frequencyDetune: 0,
    tempoVariation: 1,
    harmonicBlend: 0,
  });
  const [biofeedbackModulation, setBiofeedbackModulation] = useState(0);
  
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    // Initialize synth with reverb and delay for ethereal sound
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();
    const delay = new Tone.FeedbackDelay("8n", 0.3).connect(reverb);
    
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2,
      },
    }).connect(delay);

    return () => {
      sequenceRef.current?.dispose();
      synthRef.current?.dispose();
      reverb.dispose();
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
  }, [sequence, currentMutation, biofeedbackModulation, evolutionEnabled]);

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-6 pt-12">
          <p className="text-sm text-muted-foreground tracking-wider uppercase">
            Molecular Music Synthesizer
          </p>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif leading-tight">
            <span className="font-normal text-foreground">Don't just hear</span>
            <br />
            <span className="italic text-foreground">DNA is F♯</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience evolution, quantum harmonics, and cymatic geometry in real time.
            <br />
            Everything is included: synthesis, biofeedback, visualization, and education.
          </p>
          <p className="text-sm text-muted-foreground">
            {organismName !== "Custom" && (
              <span className="text-primary font-medium">{organismName} • </span>
            )}
            Listen to the song your molecules have been humming since life began.
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 bg-card/40 backdrop-blur-sm border-border/50">
          <div className="space-y-6">
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

            {/* Controls */}
            <div className="flex gap-4 items-center justify-center">
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
                onClick={() => setShowInfo(!showInfo)}
                variant="outline"
                size="lg"
                className="border-border hover:bg-muted rounded-full px-8"
              >
                <Info className="mr-2 h-5 w-5" />
                {showInfo ? "Hide" : "Show"} Info
              </Button>
            </div>

            {/* Advanced Visualizations */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30">
                <TabsTrigger value="visualizer">DNA Sequencer</TabsTrigger>
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

            {/* Frequency Info */}
            {showInfo && (
              <FrequencyInfo frequencies={DNA_FREQUENCIES} colors={DNA_COLORS} />
            )}
          </div>
        </Card>

        {/* Advanced Features */}
        <div className="grid md:grid-cols-2 gap-6">
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

        {/* Organism Selector */}
        <OrganismSelector
          onSelect={handleOrganismSelect}
          currentSequence={sequence}
        />

        {/* Educational Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Based on the work of composer Susan Alexjander and biologist David Deamer
          </p>
          <p>
            Mapping infrared vibrational frequencies of DNA bases to musical pitches
          </p>
        </div>
      </div>
    </div>
  );
};
