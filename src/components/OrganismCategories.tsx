import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { OrganismCard } from "./OrganismCard";
import { getOrganismCategory } from "@/utils/dnaAnalysis";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Organism {
  name: string;
  sequence: string;
  description: string;
  icon: string;
}

interface OrganismCategoriesProps {
  organisms: Organism[];
  onSelect: (sequence: string, name: string) => void;
  currentSequence: string;
  isPlaying: boolean;
}

export const OrganismCategories = ({
  organisms,
  onSelect,
  currentSequence,
  isPlaying
}: OrganismCategoriesProps) => {
  const [favorites, setFavorites] = useLocalStorage<string[]>('dna-favorites', []);

  const categorizedOrganisms = useMemo(() => {
    const categories: Record<string, Organism[]> = {};
    organisms.forEach(organism => {
      const category = getOrganismCategory(organism.name);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(organism);
    });
    return categories;
  }, [organisms]);

  const allCategories = Object.keys(categorizedOrganisms);

  const toggleFavorite = (name: string) => {
    setFavorites(prev => 
      prev.includes(name) 
        ? prev.filter(f => f !== name)
        : [...prev, name]
    );
  };

  const favoriteOrganisms = organisms.filter(o => favorites.includes(o.name));

  return (
    <Card className="p-4 sm:p-6 bg-card/20 border-border space-y-3 sm:space-y-4">
      <div>
        <Label className="text-sm sm:text-base font-medium">Inter-Species Comparison</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Explore how different organisms' genetic symphonies differ in rhythm and tone
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          {favoriteOrganisms.length > 0 && (
            <TabsTrigger value="favorites" className="text-xs sm:text-sm">
              Favorites ({favoriteOrganisms.length})
            </TabsTrigger>
          )}
          {allCategories.map(category => (
            <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {/* Mobile: Carousel */}
          <div className="block sm:hidden">
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {organisms.map((organism) => (
                  <CarouselItem key={organism.name} className="pl-2 basis-[85%]">
                    <OrganismCard
                      organism={organism}
                      isSelected={currentSequence === organism.sequence}
                      isPlaying={isPlaying}
                      isFavorite={favorites.includes(organism.name)}
                      onSelect={() => onSelect(organism.sequence, organism.name)}
                      onToggleFavorite={() => toggleFavorite(organism.name)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-2" />
              <CarouselNext className="-right-2" />
            </Carousel>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-3">
            {organisms.map((organism) => (
              <OrganismCard
                key={organism.name}
                organism={organism}
                isSelected={currentSequence === organism.sequence}
                isPlaying={isPlaying}
                isFavorite={favorites.includes(organism.name)}
                onSelect={() => onSelect(organism.sequence, organism.name)}
                onToggleFavorite={() => toggleFavorite(organism.name)}
              />
            ))}
          </div>
        </TabsContent>

        {favoriteOrganisms.length > 0 && (
          <TabsContent value="favorites" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {favoriteOrganisms.map((organism) => (
                <OrganismCard
                  key={organism.name}
                  organism={organism}
                  isSelected={currentSequence === organism.sequence}
                  isPlaying={isPlaying}
                  isFavorite={true}
                  onSelect={() => onSelect(organism.sequence, organism.name)}
                  onToggleFavorite={() => toggleFavorite(organism.name)}
                />
              ))}
            </div>
          </TabsContent>
        )}

        {allCategories.map(category => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categorizedOrganisms[category].map((organism) => (
                <OrganismCard
                  key={organism.name}
                  organism={organism}
                  isSelected={currentSequence === organism.sequence}
                  isPlaying={isPlaying}
                  isFavorite={favorites.includes(organism.name)}
                  onSelect={() => onSelect(organism.sequence, organism.name)}
                  onToggleFavorite={() => toggleFavorite(organism.name)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};
