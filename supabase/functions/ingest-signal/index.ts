import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  return Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
}

async function getUserFromApiKey(supabase: ReturnType<typeof createClient>, apiKey: string) {
  const keyHash = await hashKey(apiKey);
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single();
  if (error || !data) return null;
  // Update last_used_at
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash);
  return data.user_id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const userId = await getUserFromApiKey(supabase, apiKey);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const results = [];

    for (const item of items) {
      let projectId = item.project_id || null;

      // If no project_id, use focused project
      if (!projectId) {
        const { data: focused } = await supabase.from('projects').select('id').eq('user_id', userId).eq('is_focused', true).eq('status', 'active').maybeSingle();
        projectId = focused?.id || null;
      }

      // If project_id provided, verify ownership
      if (projectId) {
        const { data: proj } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', userId).maybeSingle();
        if (!proj) projectId = null;
      }

      const { data: signal, error } = await supabase.from('signals').insert({
        user_id: userId,
        project_id: projectId,
        title: item.title,
        body: item.body || null,
        source: item.source || 'mcp',
        source_url: item.source_url || null,
        tags: item.tags || [],
        source_metadata: item.metadata || {},
      }).select('id, title, project_id, status').single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: userId,
        project_id: projectId,
        activity_type: 'signal_captured',
        title: `Signal captured: ${item.title}`,
        tool_used: item.tool_used || null,
      });

      results.push(signal);
    }

    const response = Array.isArray(body) ? results : results[0];
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
