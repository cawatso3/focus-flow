import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getConstraintProfile, upsertConstraintProfile } from '@/lib/store';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

const TECH_OPTIONS = ['React', 'Vue', 'Next.js', 'Python', 'Node.js', 'TypeScript', 'Tailwind', 'Supabase', 'Firebase', 'PostgreSQL', 'MongoDB', 'Stripe'];
const TOOL_OPTIONS = ['Lovable', 'Windsurf', 'Cursor', 'Bolt', 'v0', 'Replit', 'GitHub Copilot', 'Claude', 'ChatGPT'];
const REVENUE_OPTIONS = ['SaaS subscriptions', 'Client services', 'Marketplace/platform', 'One-time sales', 'Open source + premium', 'Advertising/affiliate'];

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

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const cp = getConstraintProfile();

  const [displayName, setDisplayName] = useState(user?.profile?.display_name || '');
  const [techStack, setTechStack] = useState<string[]>(cp?.tech_stack || []);
  const [builderTools, setBuilderTools] = useState<string[]>(cp?.builder_tools || []);
  const [timeBudget, setTimeBudget] = useState(cp?.time_budget_hours_per_week || 15);
  const [riskTolerance, setRiskTolerance] = useState(cp?.risk_tolerance || 'medium');
  const [revenueModels, setRevenueModels] = useState<string[]>(cp?.target_revenue_model || []);

  const saveProfile = () => {
    updateProfile({ display_name: displayName });
    toast.success('Profile saved!');
  };

  const saveBuilderProfile = () => {
    upsertConstraintProfile({
      tech_stack: techStack,
      builder_tools: builderTools,
      time_budget_hours_per_week: timeBudget,
      risk_tolerance: riskTolerance as 'low' | 'medium' | 'high',
      target_revenue_model: revenueModels,
    });
    toast.success('Builder profile saved!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="builder">Builder Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="card-surface p-6 space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 max-w-sm" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value="user@example.com" readOnly className="mt-1 max-w-sm bg-muted" />
            </div>
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <div className="card-surface p-6 space-y-6">
            <div>
              <Label className="text-label mb-3 block">Tech Stack</Label>
              <MultiSelect options={TECH_OPTIONS} selected={techStack} onChange={setTechStack} />
            </div>
            <div>
              <Label className="text-label mb-3 block">Builder Tools</Label>
              <MultiSelect options={TOOL_OPTIONS} selected={builderTools} onChange={setBuilderTools} />
            </div>
            <div>
              <Label className="text-label mb-3 block">Time Budget: {timeBudget} hrs/week</Label>
              <Slider value={[timeBudget]} onValueChange={([v]) => setTimeBudget(v)} min={5} max={40} step={1} />
            </div>
            <div>
              <Label className="text-label mb-3 block">Risk Tolerance</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRiskTolerance(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      riskTolerance === r ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-label mb-3 block">Revenue Model Preference</Label>
              <MultiSelect options={REVENUE_OPTIONS} selected={revenueModels} onChange={setRevenueModels} />
            </div>
            <Button onClick={saveBuilderProfile}>Save Builder Profile</Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
