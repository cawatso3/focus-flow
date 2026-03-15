import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub;

    const { signal_id } = await req.json();
    if (!signal_id) {
      return new Response(JSON.stringify({ error: 'signal_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch signal
    const { data: signal, error: sigError } = await supabase.from('signals').select('*').eq('id', signal_id).single();
    if (sigError || !signal) {
      return new Response(JSON.stringify({ error: 'Signal not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch constraint profile
    const { data: cp } = await supabase.from('constraint_profiles').select('*').eq('user_id', userId).maybeSingle();

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are a blunt, honest startup advisor evaluating whether a pain point is worth building a product for. You are assessing this for a specific builder with specific constraints.

Builder profile:
- Tech stack: ${cp?.tech_stack?.join(', ') || 'Not specified'}
- Tools: ${cp?.builder_tools?.join(', ') || 'Not specified'}
- Existing assets: ${cp?.existing_assets?.join(', ') || 'None listed'}
- Time: ${cp?.time_budget_hours_per_week || 20} hrs/week
- Risk tolerance: ${cp?.risk_tolerance || 'medium'}
- Revenue preference: ${cp?.target_revenue_model?.join(', ') || 'Not specified'}

Signal to assess:
Title: ${signal.title}
Body: ${signal.body || 'No body'}
Source: ${signal.source}
Tags: ${signal.tags?.join(', ') || 'None'}

Respond with ONLY valid JSON, no markdown, no backticks:
{
  "score": <1-5 number>,
  "verdict": "<one of: skip, weak, interesting, strong, must_build>",
  "reasoning": "<2-3 sentences explaining the score honestly>",
  "market_guess": "<one sentence on likely market size>",
  "competition_note": "<one sentence on likely competition>",
  "build_effort": "<one sentence on estimated build effort for THIS builder>",
  "red_flags": ["<list of concerns>"],
  "green_flags": ["<list of positive signals>"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: systemPrompt }],
      }),
    });

    const aiResponse = await response.json();
    const text = aiResponse.content?.[0]?.text;
    if (!text) throw new Error('No response from AI');

    const assessment = JSON.parse(text);

    // Update signal with service role client
    const serviceSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await serviceSupabase.from('signals').update({
      score: assessment.score,
      score_reasoning: `${assessment.verdict}: ${assessment.reasoning}`,
      ai_assessment: assessment,
      status: 'scored',
    }).eq('id', signal_id);

    return new Response(JSON.stringify(assessment), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
