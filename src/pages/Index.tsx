import { useState } from "react";
import { DNASynthesizer } from "@/components/DNASynthesizer";
import { WetwareSimulator } from "@/components/WetwareSimulator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dna, Brain } from "lucide-react";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dna");

  return (
    <div className="min-h-screen">
      {/* Hero Section with Spline 3D + Spotlight */}
      <Card className="w-full border-0 rounded-none bg-background/50 relative overflow-hidden min-h-[500px] md:min-h-[600px]">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="hsl(var(--primary) / 0.3)" />
        <div className="flex flex-col md:flex-row h-full min-h-[500px] md:min-h-[600px]">
          {/* Left content */}
          <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
              R.A.I.N. Lab
            </h1>
            <p className="mt-4 text-muted-foreground max-w-lg text-base md:text-lg">
              Transform genetic sequences into immersive soundscapes. Explore the music hidden within DNA through synthesis, cymatics, and wetware computing.
            </p>
          </div>

          {/* Right content - Spline 3D */}
          <div className="flex-1 relative min-h-[300px] md:min-h-full">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 border-b border-border/50 shadow-sm shadow-background/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <TabsList className="grid w-full max-w-sm sm:max-w-md mx-auto grid-cols-2 my-3 sm:my-4 h-11 sm:h-12 bg-muted/40">
              <TabsTrigger value="dna" className="gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:shadow-md transition-all">
                <Dna className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">DNA</span> Synthesizer
              </TabsTrigger>
              <TabsTrigger value="wetware" className="gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:shadow-md transition-all">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Wetware</span> Computer
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dna" className="mt-0 animate-in fade-in-0 duration-300">
          <DNASynthesizer />
        </TabsContent>

        <TabsContent value="wetware" className="mt-0 animate-in fade-in-0 duration-300">
          <WetwareSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
