import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Piano } from "lucide-react";

interface HarmonyExplorerProps {
  currentKey: string;
  onKeyChange: (key: string) => void;
}

const KEYS = [
  { name: "F♯", value: "f-sharp", multiplier: 1.0, description: "Original DNA frequency mapping" },
  { name: "A", value: "a", multiplier: 1.122, description: "Concert pitch reference" },
  { name: "C", value: "c", multiplier: 0.944, description: "Natural harmonic foundation" },
];

export const HarmonyExplorer = ({ currentKey, onKeyChange }: HarmonyExplorerProps) => {
  return (
    <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Piano className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Harmony Explorer</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4">
        Shift between musical keys to hear how molecular tonality changes
      </p>
      
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <Button
            key={key.value}
            variant={currentKey === key.value ? "default" : "outline"}
            size="sm"
            onClick={() => onKeyChange(key.value)}
            className={`flex flex-col h-auto py-3 ${
              currentKey === key.value 
                ? "bg-primary text-primary-foreground" 
                : "border-border hover:bg-muted"
            }`}
          >
            <span className="text-lg font-serif">{key.name}</span>
            <span className="text-[10px] opacity-70 mt-1 font-normal">
              {key.multiplier === 1.0 ? "Original" : `×${key.multiplier}`}
            </span>
          </Button>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          {KEYS.find(k => k.value === currentKey)?.description}
        </p>
      </div>
    </Card>
  );
};

export const getKeyMultiplier = (key: string): number => {
  return KEYS.find(k => k.value === key)?.multiplier || 1.0;
};