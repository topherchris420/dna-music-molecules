import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Shuffle,
  Upload,
  Dna,
  Sparkles,
  RefreshCw,
  FileText,
  Wand2
} from "lucide-react";
import { toast } from "sonner";

interface AdaptiveCompositionModeProps {
  onSequenceGenerated: (sequence: string, name: string) => void;
  isPlaying: boolean;
}

type GenerationMode = "random" | "weighted" | "pattern" | "evolutionary";

const GENERATION_MODES = [
  { id: "random", label: "Pure Random", icon: Shuffle, description: "Equal probability for each base" },
  { id: "weighted", label: "Weighted", icon: Sparkles, description: "Customizable base frequencies" },
  { id: "pattern", label: "Pattern-Based", icon: Dna, description: "Repeating motifs with variations" },
  { id: "evolutionary", label: "Evolutionary", icon: RefreshCw, description: "Mutating sequences over time" },
] as const;

const PRESET_PATTERNS = [
  { name: "Helix Rhythm", pattern: "ATCG", repeats: 8 },
  { name: "Purine Wave", pattern: "AAGGAAGG", repeats: 4 },
  { name: "Pyrimidine Pulse", pattern: "TTCCTTCC", repeats: 4 },
  { name: "GC-Rich", pattern: "GCGCGC", repeats: 5 },
  { name: "AT-Rich", pattern: "ATATAT", repeats: 5 },
  { name: "Codon Cascade", pattern: "ATGATGATG", repeats: 3 },
];

export const AdaptiveCompositionMode = ({
  onSequenceGenerated,
  isPlaying
}: AdaptiveCompositionModeProps) => {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<GenerationMode>("random");
  const [sequenceLength, setSequenceLength] = useState(16);
  const [weights, setWeights] = useState({ A: 25, T: 25, C: 25, G: 25 });
  const [uploadedData, setUploadedData] = useState<string>("");
  const [generatedSequence, setGeneratedSequence] = useState<string>("");
  const [autoEvolve, setAutoEvolve] = useState(false);

  const generateRandomSequence = useCallback((length: number): string => {
    const bases = ["A", "T", "C", "G"];
    let sequence = "";

    if (mode === "random") {
      for (let i = 0; i < length; i++) {
        sequence += bases[Math.floor(Math.random() * 4)];
      }
    } else if (mode === "weighted") {
      const totalWeight = weights.A + weights.T + weights.C + weights.G;
      for (let i = 0; i < length; i++) {
        const rand = Math.random() * totalWeight;
        let cumulative = 0;
        for (const base of bases) {
          cumulative += weights[base as keyof typeof weights];
          if (rand <= cumulative) {
            sequence += base;
            break;
          }
        }
      }
    } else if (mode === "pattern") {
      const preset = PRESET_PATTERNS[Math.floor(Math.random() * PRESET_PATTERNS.length)];
      const basePattern = preset.pattern;
      const fullPattern = basePattern.repeat(Math.ceil(length / basePattern.length));
      // Add slight mutations
      sequence = fullPattern.slice(0, length).split("").map(base => {
        if (Math.random() < 0.1) {
          return bases[Math.floor(Math.random() * 4)];
        }
        return base;
      }).join("");
    } else if (mode === "evolutionary") {
      // Start with a seed and evolve
      const seed = generatedSequence || "ATCGATCGATCGATCG";
      sequence = seed.split("").map(base => {
        if (Math.random() < 0.15) {
          return bases[Math.floor(Math.random() * 4)];
        }
        return base;
      }).join("");
      // Ensure correct length
      while (sequence.length < length) {
        sequence += bases[Math.floor(Math.random() * 4)];
      }
      sequence = sequence.slice(0, length);
    }

    return sequence;
  }, [mode, weights, generatedSequence]);

  const handleGenerate = useCallback(() => {
    const newSequence = generateRandomSequence(sequenceLength);
    setGeneratedSequence(newSequence);
    const modeName = GENERATION_MODES.find(m => m.id === mode)?.label || "Random";
    onSequenceGenerated(newSequence, `${modeName} Composition`);
    toast.success(`Generated ${sequenceLength}-base ${modeName.toLowerCase()} sequence`);
  }, [generateRandomSequence, sequenceLength, mode, onSequenceGenerated]);

  // Auto-evolve logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Only evolve automatically if enabled, in evolutionary mode, and playing
    if (enabled && mode === "evolutionary" && autoEvolve && isPlaying) {
      // Evolve every 4 seconds to give people time to hear the motif
      interval = setInterval(() => {
        const newSequence = generateRandomSequence(sequenceLength);
        setGeneratedSequence(newSequence);
        onSequenceGenerated(newSequence, "Evolved Sequence");
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [enabled, mode, autoEvolve, isPlaying, generateRandomSequence, sequenceLength, onSequenceGenerated]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      // Parse FASTA or plain sequence
      let sequence = "";
      if (content.startsWith(">")) {
        // FASTA format
        const lines = content.split("\n");
        sequence = lines.filter(line => !line.startsWith(">")).join("");
      } else {
        sequence = content;
      }

      // Clean and validate
      const cleanedSequence = sequence
        .toUpperCase()
        .replace(/[^ATCG]/g, "")
        .slice(0, 32);

      if (cleanedSequence.length > 0) {
        setUploadedData(cleanedSequence);
        setGeneratedSequence(cleanedSequence);
        onSequenceGenerated(cleanedSequence, `Uploaded: ${file.name}`);
        toast.success(`Loaded ${cleanedSequence.length} bases from ${file.name}`);
      } else {
        toast.error("No valid DNA sequence found in file");
      }
    };
    reader.readAsText(file);
  };

  const handleTextInput = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^ATCG\n>]/g, "");
    setUploadedData(cleaned);
  };

  const applyUploadedData = () => {
    let sequence = uploadedData;
    if (sequence.startsWith(">")) {
      const lines = sequence.split("\n");
      sequence = lines.filter(line => !line.startsWith(">")).join("");
    }
    sequence = sequence.replace(/[^ATCG]/g, "").slice(0, 32);

    if (sequence.length > 0) {
      setGeneratedSequence(sequence);
      onSequenceGenerated(sequence, "Pasted Sequence");
      toast.success(`Applied ${sequence.length}-base sequence`);
    }
  };

  const handleWeightChange = (base: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [base]: value }));
  };

  if (!enabled) {
    return (
      <Card className="p-4 sm:p-6 bg-card/20 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="text-sm font-medium">Adaptive Composition Mode</Label>
              <p className="text-xs text-muted-foreground">
                Auto-generate or upload DNA sequences
              </p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-card/20 border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-medium">Adaptive Composition Mode</Label>
            <p className="text-xs text-muted-foreground">
              Auto-generate or upload DNA sequences
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Generation Mode Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Generation Mode</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GENERATION_MODES.map((m) => {
            const Icon = m.icon;
            return (
              <Button
                key={m.id}
                variant={(mode === m.id ? "default" : "outline") as any}
                size="sm"
                className="flex-col h-auto py-3 gap-1"
                onClick={() => setMode(m.id as GenerationMode)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{m.label}</span>
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {GENERATION_MODES.find(m => m.id === mode)?.description}
        </p>
      </div>

      {/* Sequence Length */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs text-muted-foreground">Sequence Length</Label>
          <span className="text-xs font-mono text-primary">{sequenceLength} bases</span>
        </div>
        <Slider
          value={[sequenceLength]}
          onValueChange={([v]) => setSequenceLength(v)}
          min={4}
          max={32}
          step={1}
          className="w-full"
        />
      </div>

      {/* Weighted Mode Controls */}
      {mode === "weighted" && (
        <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
          <Label className="text-xs text-muted-foreground">Base Weights</Label>
          {(["A", "T", "C", "G"] as const).map((base) => (
            <div key={base} className="flex items-center gap-3">
              <span className="w-6 text-xs font-mono font-bold" style={{
                color: base === "A" ? "hsl(var(--dna-adenine))" :
                  base === "T" ? "hsl(var(--dna-thymine))" :
                    base === "C" ? "hsl(var(--dna-cytosine))" :
                      "hsl(var(--dna-guanine))"
              }}>{base}</span>
              <Slider
                value={[weights[base]]}
                onValueChange={([v]) => handleWeightChange(base, v)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-xs text-right">{weights[base]}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Pattern Mode Presets */}
      {mode === "pattern" && (
        <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
          <Label className="text-xs text-muted-foreground">Pattern Presets</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_PATTERNS.map((preset) => (
              <Button
                key={preset.name}
                variant={"ghost" as any}
                size="sm"
                className="text-xs h-auto py-2"
                onClick={() => {
                  const fullPattern = preset.pattern.repeat(preset.repeats).slice(0, sequenceLength);
                  setGeneratedSequence(fullPattern);
                  onSequenceGenerated(fullPattern, preset.name);
                  toast.success(`Applied "${preset.name}" pattern`);
                }}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Evolutionary Mode Controls */}
      {mode === "evolutionary" && (
        <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Auto-Evolve</Label>
            <Switch checked={autoEvolve} onCheckedChange={setAutoEvolve} />
          </div>
          <p className="text-xs text-muted-foreground">
            {autoEvolve
              ? "Sequence will mutate continuously"
              : "Click generate to evolve manually"}
          </p>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        className="w-full gap-2"
        disabled={isPlaying && autoEvolve}
      >
        <Sparkles className="w-4 h-4" />
        Generate Sequence
      </Button>

      {/* Upload Section */}
      <div className="space-y-3 pt-3 border-t border-border/50">
        <Label className="text-xs text-muted-foreground flex items-center gap-2">
          <Upload className="w-3 h-3" />
          Upload Genetic Data
        </Label>

        <div className="flex gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept=".fasta,.fa,.txt,.dna"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant={"outline" as any} size="sm" className="w-full gap-2" asChild>
              <span>
                <FileText className="w-4 h-4" />
                Choose File
              </span>
            </Button>
          </label>
        </div>

        <Textarea
          placeholder="Or paste FASTA/sequence data here...&#10;>sequence_name&#10;ATCGATCG..."
          value={uploadedData}
          onChange={(e) => handleTextInput(e.target.value)}
          className="font-mono text-xs h-20 resize-none"
        />

        {uploadedData && (
          <Button
            variant={"secondary" as any}
            size="sm"
            className="w-full gap-2"
            onClick={applyUploadedData}
          >
            <Dna className="w-4 h-4" />
            Apply Uploaded Sequence
          </Button>
        )}
      </div>

      {/* Preview */}
      {generatedSequence && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <Label className="text-xs text-muted-foreground">Current Sequence</Label>
          <div className="font-mono text-sm tracking-wider flex flex-wrap gap-0.5">
            {generatedSequence.split("").map((base, i) => (
              <span
                key={i}
                className="px-1 rounded"
                style={{
                  color: base === "A" ? "hsl(var(--dna-adenine))" :
                    base === "T" ? "hsl(var(--dna-thymine))" :
                      base === "C" ? "hsl(var(--dna-cytosine))" :
                        "hsl(var(--dna-guanine))",
                  backgroundColor: base === "A" ? "hsla(var(--dna-adenine), 0.1)" :
                    base === "T" ? "hsla(var(--dna-thymine), 0.1)" :
                      base === "C" ? "hsla(var(--dna-cytosine), 0.1)" :
                        "hsla(var(--dna-guanine), 0.1)"
                }}
              >
                {base}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {generatedSequence.length} bases
          </p>
        </div>
      )}
    </Card>
  );
};
