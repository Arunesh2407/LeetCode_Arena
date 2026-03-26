import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeatureGrid from "@/components/FeatureGrid";
import LivePreview from "@/components/LivePreview";
import { Swords } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen gradient-arena">
      <HeroSection />
      <HowItWorks />
      <LivePreview />
      <FeatureGrid />

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Swords className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-foreground">LeetCode Arena</span>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Built for competitive coders. Not affiliated with LeetCode.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
