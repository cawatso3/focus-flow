import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile, useConstraintProfile, useUpsertConstraintProfile, useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/use-queries';
import { toast } from 'sonner';
import { Check, Copy, Key, Trash2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

function ApiKeysTab() {
  const { data: apiKeys = [], isLoading } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const result = await createApiKey.mutateAsync(newKeyName.trim());
      setCreatedKey(result.rawKey);
      setNewKeyName('');
      toast.success('API key created!');
    } catch {
      toast.error('Failed to create API key');
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'YOUR_PROJECT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
          <p className="text-xs text-muted-foreground mt-1">Used by external tools (MCP server, n8n, scripts) to push signals and activity.</p>
        </div>
        <Button size="sm" onClick={() => { setCreateOpen(true); setCreatedKey(null); }} className="gap-1">
          <Key className="h-3.5 w-3.5" /> Create API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : apiKeys.length === 0 ? (
        <div className="card-surface p-6 text-center text-sm text-muted-foreground">
          No API keys yet. Create one to connect external tools.
        </div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map(key => (
            <div key={key.id} className="card-surface p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{key.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono">{key.key_prefix}...</span>
                  <span>Created {new Date(key.created_at!).toLocaleDateString()}</span>
                  {key.last_used_at && <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => { revokeApiKey.mutate(key.id); toast.success('API key revoked'); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Example curl */}
      <div className="p-3 rounded-lg bg-muted">
        <p className="text-xs text-muted-foreground mb-2">Example usage:</p>
        <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${window.location.origin.replace('preview--', '').replace('.lovable.app', '.supabase.co')}/functions/v1/ingest-signal \\
  -H "Authorization: Bearer nc_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Test signal", "source": "manual"}'`}
        </pre>
      </div>

      {/* Create key dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createdKey ? 'API Key Created' : 'Create API Key'}</DialogTitle>
            {createdKey && <DialogDescription>Copy this key now — it won't be shown again.</DialogDescription>}
          </DialogHeader>
          {createdKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-stage-decide shrink-0" />
                <p className="text-xs text-muted-foreground">This key won't be shown again. Store it securely.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">{createdKey}</div>
              <Button onClick={handleCopy} className="w-full gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder='e.g., "Windsurf MCP", "n8n workflows"' className="mt-1" />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newKeyName.trim() || createApiKey.isPending}>
                  {createApiKey.isPending ? 'Creating...' : 'Create Key'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: cp, isLoading: cpLoading } = useConstraintProfile();
  const updateProfile = useUpdateProfile();
  const upsertConstraintProfile = useUpsertConstraintProfile();

  const [displayName, setDisplayName] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [builderTools, setBuilderTools] = useState<string[]>([]);
  const [timeBudget, setTimeBudget] = useState(15);
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [revenueModels, setRevenueModels] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize state from fetched data
  if (!initialized && profile && !profileLoading) {
    setDisplayName(profile.display_name || '');
    if (cp) {
      setTechStack(cp.tech_stack || []);
      setBuilderTools(cp.builder_tools || []);
      setTimeBudget(cp.time_budget_hours_per_week || 15);
      setRiskTolerance(cp.risk_tolerance || 'medium');
      setRevenueModels(cp.target_revenue_model || []);
    }
    setInitialized(true);
  }

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName });
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    }
  };

  const saveBuilderProfile = async () => {
    try {
      await upsertConstraintProfile.mutateAsync({
        tech_stack: techStack,
        builder_tools: builderTools,
        time_budget_hours_per_week: timeBudget,
        risk_tolerance: riskTolerance as 'low' | 'medium' | 'high',
        target_revenue_model: revenueModels,
      });
      toast.success('Builder profile saved!');
    } catch {
      toast.error('Failed to save builder profile');
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="builder">Builder Profile</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="card-surface p-6 space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 max-w-sm" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} readOnly className="mt-1 max-w-sm bg-muted" />
            </div>
            <Button onClick={saveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save'}
            </Button>
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
            <Button onClick={saveBuilderProfile} disabled={upsertConstraintProfile.isPending}>
              {upsertConstraintProfile.isPending ? 'Saving...' : 'Save Builder Profile'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <div className="card-surface p-6">
            <ApiKeysTab />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
