var HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

function jsonOk(data, status) {
  return new Response(JSON.stringify({ ok: true, data: data }), { status: status || 200, headers: HEADERS });
}

function jsonErr(error, status) {
  return new Response(JSON.stringify({ ok: false, error: error }), { status: status || 400, headers: HEADERS });
}

function sbHeaders(env) {
  return {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json'
  };
}

// SWEEP-FIX 2026-06-26: this route proxies the billable Anthropic key. Cap calls per
// IP/hour to blunt a cost-DoS / free-LLM-relay (graceful no-op if RATE_LIMIT_KV is
// unbound, matching submit-quote / capture-partial).
async function enforceRateLimit(request, env) {
  var kv = env && env.RATE_LIMIT_KV;
  if (!kv) return true;
  var ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  var hour = Math.floor(Date.now() / 3600000);
  var key = 'rl:crmai:' + ip + ':' + hour;
  var current = parseInt(await kv.get(key) || '0', 10);
  if (current >= 60) return false;
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return true;
}

export async function onRequestPost(context) {
  var env = context.env;

  try {
    if (!(await enforceRateLimit(context.request, env))) {
      return jsonErr('Rate limit reached — try again shortly.', 429);
    }
  } catch (e) { /* KV hiccup — fail open so legit CRM use isn't blocked */ }

  var body;
  try { body = await context.request.json(); }
  catch (e) { return jsonErr('Invalid request', 400); }

  // SWEEP-FIX 2026-06-26: cap input length. This route proxies the Anthropic key, so
  // an uncapped message (or lead_context below) is a cost-DoS / free-LLM-relay vector —
  // every other endpoint caps its inputs; this one didn't.
  var message = (body.message || '').trim().slice(0, 8000);
  if (!message) {
    return jsonErr('Message is required', 400);
  }

  var leadContext = body.lead_context || null;
  var pageContext = body.page_context || 'general';

  // Fetch summary data for context
  var leadsData = '';
  try {
    var leadsRes = await fetch(
      env.SUPABASE_URL + '/rest/v1/leads?select=id,first_name,last_name,company,service,status,pipeline_stage,created_at,estimated_value,last_contacted_at&order=created_at.desc&limit=100',
      { headers: sbHeaders(env) }
    );

    if (leadsRes.ok) {
      var leads = await leadsRes.json();
      var total = leads.length;
      var byStage = {};
      var uncontacted = 0;
      var totalValue = 0;

      leads.forEach(function(l) {
        var stage = l.pipeline_stage || 'new';
        byStage[stage] = (byStage[stage] || 0) + 1;
        if (!l.last_contacted_at) uncontacted++;
        totalValue += parseFloat(l.estimated_value) || 0;
      });

      leadsData = '\n\nCRM DATA SUMMARY:\n' +
        'Total leads: ' + total + '\n' +
        'By stage: ' + JSON.stringify(byStage) + '\n' +
        'Uncontacted: ' + uncontacted + '\n' +
        'Pipeline value: $' + totalValue.toFixed(2) + '\n';

      if (leadContext) {
        leadsData += '\nCURRENT LEAD BEING VIEWED:\n' + JSON.stringify(leadContext, null, 2).slice(0, 4000) + '\n';
      }
    }
  } catch (e) {
    // Non-critical — continue without data
  }

  // Build system prompt
  var systemPrompt = 'You are the AI assistant for Ecco Facilities CRM — a commercial cleaning company based in NYC. ' +
    'You help the sales team manage leads, prioritize follow-ups, draft emails, and analyze pipeline data. ' +
    'Be concise, actionable, and friendly. Use bullet points for lists. ' +
    'When suggesting emails, write the full email text ready to copy. ' +
    'When analyzing data, give specific numbers and percentages. ' +
    'The company offers two services: Janitorial (ongoing office cleaning) and Day Porter (daytime facility maintenance). ' +
    'Pipeline stages: New Lead → Contacted → Site Visit → Proposal Sent → Negotiation → Won → Lost. ' +
    'Always respond in the same language the user writes in (Spanish or English).' +
    leadsData;

  // Call Claude API
  try {
    var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!aiRes.ok) {
      var errText = await aiRes.text();
      return jsonErr('AI service unavailable', 502);
    }

    var aiData = await aiRes.json();
    var response = (aiData.content && aiData.content[0] && aiData.content[0].text) || 'No response generated.';

    return jsonOk({ response: response });

  } catch (err) {
    return jsonErr('AI service error', 500);
  }
}
