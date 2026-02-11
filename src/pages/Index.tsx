import { useState } from "react";
import { DNASynthesizer } from "@/components/DNASynthesizer";
import { WetwareSimulator } from "@/components/WetwareSimulator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dna, Brain } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dna");

  return (
    <div className="min-h-screen">
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
