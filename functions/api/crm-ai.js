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

export async function onRequestPost(context) {
  var env = context.env;

  var body;
  try { body = await context.request.json(); }
  catch (e) { return jsonErr('Invalid request', 400); }

  var message = (body.message || '').trim();
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
        leadsData += '\nCURRENT LEAD BEING VIEWED:\n' + JSON.stringify(leadContext, null, 2) + '\n';
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
        model: 'claude-sonnet-4-6-20250527',
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
