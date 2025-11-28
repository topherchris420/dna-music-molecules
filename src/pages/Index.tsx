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
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 my-4">
              <TabsTrigger value="dna" className="gap-2">
                <Dna className="w-4 h-4" />
                DNA Synthesizer
              </TabsTrigger>
              <TabsTrigger value="wetware" className="gap-2">
                <Brain className="w-4 h-4" />
                Wetware Computer
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dna" className="mt-0">
          <DNASynthesizer />
        </TabsContent>

        <TabsContent value="wetware" className="mt-0">
          <WetwareSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
