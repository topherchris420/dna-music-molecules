import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReactNode } from "react";

interface BottomSheetProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  organismName: string;
  children?: ReactNode;
}

export const BottomSheet = ({ isPlaying, onPlay, onStop, organismName, children }: BottomSheetProps) => {
  return (
    <>
      {/* Mobile: Sticky bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-40 md:hidden">
        <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Now playing</div>
            <div className="text-sm font-medium truncate">{organismName}</div>
          </div>
          
          <Button
            onClick={onStop}
            variant="outline"
            size="icon"
            className="h-12 w-12"
            aria-label="Stop"
            disabled={!isPlaying}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            onClick={isPlaying ? onStop : onPlay}
            size="icon"
            className="h-12 w-12"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          {children && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Controls
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Advanced Controls</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 pb-24">
                  {children}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Desktop: Always visible controls (handled by parent) */}
    </>
  );
};
