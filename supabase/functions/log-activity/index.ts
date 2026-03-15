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
  const { data } = await supabase.from('api_keys').select('user_id').eq('key_hash', keyHash).is('revoked_at', null).single();
  if (!data) return null;
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
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const userId = await getUserFromApiKey(supabase, apiKey);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    let projectId = body.project_id || null;

    if (!projectId) {
      const { data: focused } = await supabase.from('projects').select('id').eq('user_id', userId).eq('is_focused', true).eq('status', 'active').maybeSingle();
      projectId = focused?.id || null;
    }

    const { data, error } = await supabase.from('activity_log').insert({
      user_id: userId,
      project_id: projectId,
      stage: body.stage || null,
      activity_type: body.activity_type,
      title: body.title,
      description: body.description || null,
      external_url: body.external_url || null,
      tool_used: body.tool_used || null,
      duration_minutes: body.duration_minutes || null,
      metadata: body.metadata || {},
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
