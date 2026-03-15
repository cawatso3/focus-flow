import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { upsertConstraintProfile } from '@/lib/store';
import { toast } from 'sonner';
import { Check, ChevronRight } from 'lucide-react';

const TECH_OPTIONS = ['React', 'Vue', 'Next.js', 'Python', 'Node.js', 'TypeScript', 'Tailwind', 'Supabase', 'Firebase', 'PostgreSQL', 'MongoDB', 'Stripe'];
const TOOL_OPTIONS = ['Lovable', 'Windsurf', 'Cursor', 'Bolt', 'v0', 'Replit', 'GitHub Copilot', 'Claude', 'ChatGPT'];
const REVENUE_OPTIONS = ['SaaS subscriptions', 'Client services', 'Marketplace/platform', 'One-time sales', 'Open source + premium', 'Advertising/affiliate'];

const RISK_OPTIONS = [
  { value: 'low' as const, label: 'Low Risk', desc: 'I need proven demand before I build. Minimal financial risk.' },
  { value: 'medium' as const, label: 'Medium Risk', desc: "I'll build an MVP to test demand. Some risk is fine." },
  { value: 'high' as const, label: 'High Risk', desc: "I'll bet on emerging tech and move fast. High risk, high reward." },
];

function MultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {active && <Check className="inline h-3 w-3 mr-1" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [builderTools, setBuilderTools] = useState<string[]>([]);
  const [existingAssets, setExistingAssets] = useState<string[]>([]);
  const [assetInput, setAssetInput] = useState('');
  const [timeBudget, setTimeBudget] = useState(15);
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [revenueModels, setRevenueModels] = useState<string[]>([]);
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const addAsset = () => {
    if (assetInput.trim() && !existingAssets.includes(assetInput.trim())) {
      setExistingAssets([...existingAssets, assetInput.trim()]);
      setAssetInput('');
    }
  };

  const handleComplete = () => {
    upsertConstraintProfile({
      tech_stack: techStack,
      builder_tools: builderTools,
      existing_assets: existingAssets,
      time_budget_hours_per_week: timeBudget,
      risk_tolerance: riskTolerance,
      target_revenue_model: revenueModels,
    });
    updateProfile({ onboarded: true });
    toast.success('Builder profile saved!');
    navigate('/app/focus');
  };

  const steps = [
    { title: 'What do you build with?', subtitle: 'Select your tech stack and tools' },
    { title: 'What do you already have?', subtitle: 'Assets you can leverage' },
    { title: 'How do you decide?', subtitle: 'Your risk and revenue preferences' },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-lg font-semibold tracking-tight text-foreground">NicheCommand</span>
          <p className="mt-1 text-sm text-muted-foreground">Set up your builder profile</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                i < step ? 'bg-foreground text-background' : i === step ? 'bg-foreground text-background ring-2 ring-offset-2 ring-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-foreground' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="card-surface p-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-1">{steps[step].title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{steps[step].subtitle}</p>

            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-label mb-3 block">Tech Stack</Label>
                  <MultiSelect options={TECH_OPTIONS} selected={techStack} onChange={setTechStack} />
                </div>
                <div>
                  <Label className="text-label mb-3 block">Builder Tools</Label>
                  <MultiSelect options={TOOL_OPTIONS} selected={builderTools} onChange={setBuilderTools} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-label mb-3 block">Existing Assets</Label>
                  <p className="text-xs text-muted-foreground mb-3">API keys, existing apps, client lists, domain expertise, audience, etc.</p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={assetInput}
                      onChange={e => setAssetInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAsset())}
                      placeholder="e.g., 500 email subscribers"
                    />
                    <Button type="button" variant="outline" onClick={addAsset}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {existingAssets.map(asset => (
                      <span key={asset} className="px-3 py-1 rounded-lg text-sm bg-muted text-foreground flex items-center gap-1">
                        {asset}
                        <button onClick={() => setExistingAssets(existingAssets.filter(a => a !== asset))} className="text-muted-foreground hover:text-foreground ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-label mb-3 block">Time Budget: {timeBudget} hrs/week</Label>
                  <Slider
                    value={[timeBudget]}
                    onValueChange={([v]) => setTimeBudget(v)}
                    min={5}
                    max={40}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 hrs</span>
                    <span>40 hrs</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-label mb-3 block">Risk Tolerance</Label>
                  <div className="space-y-2">
                    {RISK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRiskTolerance(opt.value)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                          riskTolerance === opt.value ? 'bg-foreground text-background' : 'bg-muted text-foreground hover:bg-accent'
                        }`}
                      >
                        <span className="font-medium text-sm">{opt.label}</span>
                        <p className={`text-xs mt-1 ${riskTolerance === opt.value ? 'opacity-80' : 'text-muted-foreground'}`}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-label mb-3 block">Revenue Model Preference</Label>
                  <MultiSelect options={REVENUE_OPTIONS} selected={revenueModels} onChange={setRevenueModels} />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                Back
              </Button>
              {step < 2 ? (
                <Button onClick={() => setStep(step + 1)} className="gap-1">
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="gap-1">
                  Complete Setup <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
