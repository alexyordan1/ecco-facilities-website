export async function onRequestGet(context) {
  var env = context.env;
  var headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  var sbHeaders = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json'
  };

  try {
    var res = await fetch(env.SUPABASE_URL + '/rest/v1/leads?select=id,service,status,pipeline_stage,created_at,completed_at,estimated_value,form_data&order=created_at.desc&limit=500', {
      headers: sbHeaders
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Failed to fetch leads' }), { status: 500, headers });
    }

    var leads = await res.json();
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    var leadsToday = 0, leadsWeek = 0, leadsMonth = 0, leadsPrevMonth = 0;
    var wonCount = 0, lostCount = 0, totalCompleted = 0;
    var pipelineValue = 0;
    var openLeads = 0;

    var byService = { janitorial: 0, dayporter: 0 };
    var byStage = {};
    var bySource = {};
    var dailyLeads = {};
    var monthlyLeads = { current: 0, previous: 0 };
    var uncontacted24h = 0;
    var stale7d = 0;

    leads.forEach(function(lead) {
      var created = new Date(lead.created_at);

      if (created >= todayStart) leadsToday++;
      if (created >= weekStart) leadsWeek++;
      if (created >= monthStart) { leadsMonth++; monthlyLeads.current++; }
      if (created >= prevMonthStart && created <= prevMonthEnd) { leadsPrevMonth++; monthlyLeads.previous++; }

      if (lead.service === 'dayporter') byService.dayporter++;
      else byService.janitorial++;

      var stage = lead.pipeline_stage || 'new';
      byStage[stage] = (byStage[stage] || 0) + 1;

      if (stage === 'won') { wonCount++; totalCompleted++; }
      else if (stage === 'lost') { lostCount++; totalCompleted++; }
      else {
        openLeads++;
        var ageMs = now - created;
        if (!lead.last_contacted_at && ageMs > 86400000) uncontacted24h++;
        if (ageMs > 7 * 86400000) stale7d++;
      }

      if (stage !== 'won' && stage !== 'lost' && lead.estimated_value) {
        pipelineValue += parseFloat(lead.estimated_value) || 0;
      }

      var source = 'Unknown';
      if (lead.form_data) {
        source = lead.form_data.how_heard || lead.form_data.referral || 'Unknown';
      }
      source = source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
      bySource[source] = (bySource[source] || 0) + 1;

      var daysAgo = Math.floor((now - created) / 86400000);
      if (daysAgo < 30) {
        var dateKey = created.toISOString().split('T')[0];
        dailyLeads[dateKey] = (dailyLeads[dateKey] || 0) + 1;
      }
    });

    var dailyChart = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      var key = d.toISOString().split('T')[0];
      dailyChart.push({
        date: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dailyLeads[key] || 0
      });
    }

    var conversionRate = leads.length > 0 ? (wonCount / leads.length * 100) : 0;

    var funnelOrder = ['new', 'contacted', 'site-visit', 'proposal', 'negotiation', 'won', 'lost'];
    var funnelNames = {
      'new': 'New Lead', 'contacted': 'Contacted', 'site-visit': 'Site Visit',
      'proposal': 'Proposal Sent', 'negotiation': 'Negotiation', 'won': 'Won', 'lost': 'Lost'
    };
    var funnel = funnelOrder.map(function(slug) {
      return { slug: slug, name: funnelNames[slug], count: byStage[slug] || 0 };
    });

    var sourceEntries = Object.entries(bySource).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 6);
    var sourceChart = sourceEntries.map(function(entry) { return { source: entry[0], count: entry[1] }; });

    return new Response(JSON.stringify({
      ok: true,
      data: {
        kpis: {
          total: leads.length,
          today: leadsToday,
          week: leadsWeek,
          month: leadsMonth,
          prev_month: leadsPrevMonth,
          conversion_rate: Math.round(conversionRate * 10) / 10,
          pipeline_value: Math.round(pipelineValue * 100) / 100,
          open_leads: openLeads,
          won: wonCount,
          lost: lostCount,
          uncontacted_24h: uncontacted24h,
          stale_7d: stale7d
        },
        charts: {
          daily: dailyChart,
          by_service: byService,
          funnel: funnel,
          by_source: sourceChart,
          monthly_comparison: monthlyLeads
        }
      }
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500, headers });
  }
}
