import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Play } from "lucide-react";
import { calculateComplexity, generateWaveform } from "@/utils/dnaAnalysis";
import { memo } from "react";

interface Organism {
  name: string;
  sequence: string;
  description: string;
  icon: string;
}

interface OrganismCardProps {
  organism: Organism;
  isSelected: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onPreview?: () => void;
}

export const OrganismCard = memo(({ 
  organism, 
  isSelected, 
  isPlaying,
  isFavorite,
  onSelect, 
  onToggleFavorite,
  onPreview 
}: OrganismCardProps) => {
  const complexity = calculateComplexity(organism.sequence);
  const waveform = generateWaveform(organism.sequence.slice(0, 16));

  return (
    <Button
      onClick={onSelect}
      variant={isSelected ? "default" : "outline"}
      className={`h-auto flex-col items-start p-3.5 sm:p-4 min-h-[130px] sm:min-h-[140px] touch-manipulation active:scale-95 transition-all relative group ${
        isSelected
          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
          : "bg-card hover:bg-accent"
      }`}
      aria-pressed={isSelected}
      aria-label={`Select ${organism.name} DNA sequence`}
    >
      {/* Playing indicator */}
      {isSelected && isPlaying && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" 
             aria-label="Currently playing" />
      )}

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart 
          className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
        />
      </button>

      <div className="flex items-start justify-between w-full mb-2">
        <div className="text-3xl sm:text-4xl">{organism.icon}</div>
        <Badge variant="secondary" className="text-[10px]">
          {complexity}% complex
        </Badge>
      </div>

      <div className="text-sm sm:text-base font-semibold text-left w-full mb-1">
        {organism.name}
      </div>

      <div className="text-xs opacity-70 text-left w-full line-clamp-2 mb-2">
        {organism.description}
      </div>

      {/* Mini waveform visualization */}
      <div className="flex items-center gap-0.5 w-full h-6 mb-1">
        {waveform.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-all ${
              isSelected ? 'bg-primary-foreground/50' : 'bg-primary/30'
            }`}
            style={{ height: `${height * 100}%` }}
          />
        ))}
      </div>

      <div className="text-[9px] sm:text-[10px] font-mono opacity-50 break-all w-full">
        {organism.sequence.slice(0, 12)}...
      </div>

      {/* Preview button on hover (desktop) */}
      {onPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Preview sound"
        >
          <Play className="w-3 h-3" />
        </button>
      )}
    </Button>
  );
});

OrganismCard.displayName = "OrganismCard";
