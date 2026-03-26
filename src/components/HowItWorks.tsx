import { UserCheck, Shuffle, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    title: "Link Profiles",
    description: "Connect your LeetCode username. We analyze your solved problems and topic mastery.",
    step: "01",
  },
  {
    icon: Shuffle,
    title: "Smart Matching",
    description: "Our engine finds common topics and picks an unsolved problem fair for everyone.",
    step: "02",
  },
  {
    icon: Trophy,
    title: "Battle & Win",
    description: "Race to solve it first. Real-time sync detects your accepted submission instantly.",
    step: "03",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            How the <span className="text-primary text-glow">Arena</span> Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three steps from lobby to leaderboard.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.step}
              className="glass rounded-xl p-8 group hover:border-primary/50 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 font-mono text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                {step.step}
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:box-glow transition-shadow">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
