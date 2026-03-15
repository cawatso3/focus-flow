import { motion } from 'framer-motion';
import { ArrowRight, Layers, ParkingCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PIPELINE_STAGES, STAGE_CONFIG } from '@/lib/types';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};

const features = [
  {
    icon: Layers,
    title: 'Focus mode',
    description: 'One project. One stage. No distractions.',
  },
  {
    icon: ParkingCircle,
    title: 'Never lose context',
    description: 'Park mid-task, resume exactly where you left off.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered scoring',
    description: 'Your ideas ranked by your constraints.',
    badge: 'Coming soon',
  },
];

export default function LandingPage() {
  return (
    <motion.div className="min-h-screen bg-background" {...pageTransition}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-lg font-semibold tracking-tight text-foreground">NicheCommand</span>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight" style={{ textWrap: 'balance' }}>
          Stop researching in circles.
          <br />
          Start shipping.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          NicheCommand is a focused research pipeline for indie builders. Capture problems. Validate markets. Ship products. One stage at a time.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#pipeline">
            <Button variant="outline" size="lg">See How It Works</Button>
          </a>
        </div>
      </section>

      {/* Pipeline visual */}
      <section id="pipeline" className="max-w-4xl mx-auto px-6 py-16">
        <div className="card-surface p-8">
          <div className="flex items-center justify-between gap-2">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full ${STAGE_CONFIG[stage].bgClass} flex items-center justify-center`}>
                    <span className="text-sm font-semibold text-primary-foreground">{i + 1}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{STAGE_CONFIG[stage].label}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 -mt-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card-surface p-6">
              <feature.icon className="h-8 w-8 text-foreground mb-4" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-foreground mb-1">
                {feature.title}
                {feature.badge && (
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {feature.badge}
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-muted-foreground">Built for builders who ship.</p>
      </footer>
    </motion.div>
  );
}
