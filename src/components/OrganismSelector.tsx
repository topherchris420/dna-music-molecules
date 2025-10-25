import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Organism {
  name: string;
  sequence: string;
  description: string;
  icon: string;
}

const ORGANISMS: Organism[] = [
  {
    name: "Human",
    sequence: "ATCGATCGATCGATCG",
    description: "Homo sapiens — complex, adaptive, conscious",
    icon: "👤",
  },
  {
    name: "Coral",
    sequence: "GCTAGCTAGCTAGCTA",
    description: "Ancient reef builder — symbiotic, regenerative",
    icon: "🪸",
  },
  {
    name: "Tardigrade",
    sequence: "CGCGATATCGCGATAT",
    description: "Water bear — indestructible, extremophile",
    icon: "🐻",
  },
  {
    name: "Mycelium",
    sequence: "TATACGCGATATATAT",
    description: "Fungal network — communicative, earth-binding",
    icon: "🍄",
  },
  {
    name: "E. coli",
    sequence: "ATATATCGCGATATAT",
    description: "Bacterial pioneer — rapid, essential",
    icon: "🦠",
  },
  {
    name: "Redwood",
    sequence: "CGATATCGATATCGAT",
    description: "Ancient tree — towering, enduring",
    icon: "🌲",
  },
];

interface OrganismSelectorProps {
  onSelect: (sequence: string, name: string) => void;
  currentSequence: string;
}

export const OrganismSelector = ({ onSelect, currentSequence }: OrganismSelectorProps) => {
  return (
    <Card className="p-6 bg-card/20 border-border space-y-4">
      <div>
        <Label className="text-base font-medium">Inter-Species Comparison</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Explore how different organisms' genetic symphonies differ in rhythm and tone
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ORGANISMS.map((organism) => (
          <Button
            key={organism.name}
            onClick={() => onSelect(organism.sequence, organism.name)}
            variant={currentSequence === organism.sequence ? "default" : "outline"}
            className={`h-auto flex-col items-start p-4 ${
              currentSequence === organism.sequence
                ? "bg-primary text-white"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="text-2xl mb-2">{organism.icon}</div>
            <div className="text-sm font-medium text-left">{organism.name}</div>
            <div className="text-xs opacity-70 text-left mt-1">
              {organism.description}
            </div>
            <div className="text-[10px] font-mono mt-2 opacity-50 break-all">
              {organism.sequence.slice(0, 12)}...
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};
