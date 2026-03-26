import { Brain, Clock, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Topic Engine",
    description: "Finds the intersection of all players' strengths to ensure competitive, fair challenges.",
  },
  {
    icon: Clock,
    title: "Real-Time Sync",
    description: "WebSocket-powered live updates. See who's coding, who submitted, and who won — instantly.",
  },
  {
    icon: BarChart3,
    title: "ELO Rankings",
    description: "Competitive rating system tracks your progress and matches you with worthy opponents.",
  },
  {
    icon: Shield,
    title: "Anti-Cheat",
    description: "Submission verification ensures only genuine LeetCode accepted solutions count.",
  },
];

const FeatureGrid = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Built for <span className="text-primary text-glow">Competitive</span> Coders
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
