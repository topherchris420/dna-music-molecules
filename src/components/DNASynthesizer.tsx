import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Play, Pause, Info } from "lucide-react";
import { toast } from "sonner";
import { DNAVisualizer } from "./DNAVisualizer";
import { FrequencyInfo } from "./FrequencyInfo";

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

  const playSequence = async () => {
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
        const freq = DNA_FREQUENCIES[base as keyof typeof DNA_FREQUENCIES];
        synthRef.current?.triggerAttackRelease(freq, "4n", time);
        
        Tone.Draw.schedule(() => {
          setCurrentIndex(index);
          index = (index + 1) % validBases.length;
        }, time);
      },
      validBases,
      "4n"
    );

    sequenceRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
    toast.success("Listening to the song of DNA...");
  };

  const stopSequence = () => {
    Tone.Transport.stop();
    sequenceRef.current?.stop();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const handleSequenceChange = (value: string) => {
    const filtered = value.toUpperCase().replace(/[^ATCG]/g, "");
    setSequence(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse-glow">
            DNA is F♯
          </h1>
          <p className="text-xl text-muted-foreground">
            The Molecular Music Synthesizer
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Listen to the song your molecules have been humming since life began
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 bg-card/50 backdrop-blur-xl border-primary/20">
          <div className="space-y-6">
            {/* Sequence Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/80">
                DNA Sequence
              </label>
              <Input
                value={sequence}
                onChange={(e) => handleSequenceChange(e.target.value)}
                placeholder="Enter DNA sequence (A, T, C, G)"
                className="text-lg font-mono tracking-wider bg-background/50 border-primary/30 focus:border-primary"
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
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50"
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
                className="border-primary/30 hover:bg-primary/10"
              >
                <Info className="mr-2 h-5 w-5" />
                {showInfo ? "Hide" : "Show"} Info
              </Button>
            </div>

            {/* Visualizer */}
            <DNAVisualizer
              sequence={sequence}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              colors={DNA_COLORS}
            />

            {/* Frequency Info */}
            {showInfo && (
              <FrequencyInfo frequencies={DNA_FREQUENCIES} colors={DNA_COLORS} />
            )}
          </div>
        </Card>

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
