(function() {
  var reportContent = document.getElementById('reportContent');
  var reportType = document.getElementById('reportType');
  var exportBtn = document.getElementById('exportReport');
  var printBtn = document.getElementById('printReport');
  var allLeads = [];
  var dateRange = 'all';

  var STAGE_ORDER = ['new', 'contacted', 'site-visit', 'proposal', 'negotiation', 'won', 'lost'];
  var STAGE_NAMES = {
    'new': 'New Lead', 'contacted': 'Contacted', 'site-visit': 'Site Visit',
    'proposal': 'Proposal Sent', 'negotiation': 'Negotiation', 'won': 'Won', 'lost': 'Lost'
  };

  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('reports');

    var dateRangeEl = document.getElementById('dateRange');
    if (dateRangeEl) {
      dateRangeEl.addEventListener('click', function(e) {
        var pill = e.target.closest('.crm-date-pill');
        if (!pill) return;
        dateRange = pill.dataset.range;
        dateRangeEl.querySelectorAll('.crm-date-pill').forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');
        renderReport();
      });
    }

    if (reportType) reportType.addEventListener('change', renderReport);
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);
    if (printBtn) printBtn.addEventListener('click', function() { window.print(); });

    CRM.showLoading(reportContent);
    await loadData();
  }

  async function loadData() {
    try {
      var result = await CRM.fetch('/crm-leads?per_page=500&sort=created_at&order=desc');
      if (!result || !result.ok) {
        CRM.showError(reportContent, { message: 'Failed to load data', onRetry: loadData });
        return;
      }
      allLeads = result.data.leads || [];
      renderReport();
    } catch (err) {
      CRM.showError(reportContent, { message: 'Failed to load data', onRetry: loadData });
    }
  }

  function getFilteredByDate() {
    if (dateRange === 'all') return allLeads;
    var now = new Date();
    var from = null;
    var to = null;

    switch (dateRange) {
      case '7':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case '30':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastmonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        return allLeads;
    }

    return allLeads.filter(function(l) {
      var t = new Date(l.created_at).getTime();
      if (from && t < from.getTime()) return false;
      if (to && t > to.getTime()) return false;
      return true;
    });
  }

  function renderReport() {
    var type = reportType ? reportType.value : 'overview';
    switch (type) {
      case 'sources': renderSourcesReport(); break;
      case 'services': renderServicesReport(); break;
      case 'stages': renderStagesReport(); break;
      case 'lost': renderLostReport(); break;
      default: renderOverview();
    }
  }

  /* === OVERVIEW === */
  function renderOverview() {
    var leads = getFilteredByDate();
    var total = leads.length;
    var completed = leads.filter(function(l) { return l.status === 'completed'; }).length;
    var partial = total - completed;
    var won = leads.filter(function(l) { return l.pipeline_stage === 'won'; }).length;
    var lost = leads.filter(function(l) { return l.pipeline_stage === 'lost'; }).length;
    var open = total - won - lost;
    var convRate = total > 0 ? (won / total * 100).toFixed(1) : '0';
    var totalValue = leads.reduce(function(sum, l) { return sum + (parseFloat(l.estimated_value) || 0); }, 0);

    var byMonth = {};
    leads.forEach(function(l) {
      var d = new Date(l.created_at);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    var monthRows = Object.entries(byMonth).sort(function(a, b) { return b[0].localeCompare(a[0]); })
      .map(function(e) { return '<tr><td>' + e[0] + '</td><td>' + e[1] + '</td></tr>'; }).join('');

    reportContent.innerHTML = ''
      + '<div class="crm-stats-grid">'
      + statCard('Total Leads', total)
      + statCard('Completed', completed)
      + statCard('Partial', partial)
      + statCard('Won', won)
      + statCard('Lost', lost)
      + statCard('Conversion Rate', convRate + '%')
      + '</div>'
      + reportTable('Leads by Month', ['Month', 'Leads'], monthRows);
  }

  /* === CONVERSION BY SOURCE === */
  function renderSourcesReport() {
    var leads = getFilteredByDate();
    var sources = {};
    leads.forEach(function(l) {
      var src = (l.form_data ? (l.form_data.how_heard || l.form_data.referral) : null) || 'Unknown';
      src = src.charAt(0).toUpperCase() + src.slice(1);
      if (!sources[src]) sources[src] = { total: 0, won: 0, lost: 0 };
      sources[src].total++;
      if (l.pipeline_stage === 'won') sources[src].won++;
      if (l.pipeline_stage === 'lost') sources[src].lost++;
    });

    var rows = Object.entries(sources)
      .sort(function(a, b) { return b[1].total - a[1].total; })
      .map(function(e) {
        var s = e[1];
        var rate = s.total > 0 ? (s.won / s.total * 100).toFixed(1) : '0';
        return '<tr><td>' + CRM.escapeHtml(e[0]) + '</td><td>' + s.total + '</td><td>' + s.won + '</td><td>' + s.lost + '</td><td>' + rate + '%</td></tr>';
      }).join('');

    reportContent.innerHTML = reportTable('Conversion by Lead Source', ['Source', 'Total', 'Won', 'Lost', 'Conv. Rate'], rows);
  }

  /* === CONVERSION BY SERVICE === */
  function renderServicesReport() {
    var leads = getFilteredByDate();
    var services = {};
    leads.forEach(function(l) {
      var svc = l.service === 'dayporter' ? 'Day Porter' : 'Janitorial';
      if (!services[svc]) services[svc] = { total: 0, won: 0, lost: 0, value: 0, completed: 0 };
      services[svc].total++;
      if (l.pipeline_stage === 'won') services[svc].won++;
      if (l.pipeline_stage === 'lost') services[svc].lost++;
      if (l.status === 'completed') services[svc].completed++;
      services[svc].value += parseFloat(l.estimated_value) || 0;
    });

    var rows = Object.entries(services).map(function(e) {
      var s = e[1];
      var rate = s.total > 0 ? (s.won / s.total * 100).toFixed(1) : '0';
      return '<tr><td>' + CRM.escapeHtml(e[0]) + '</td><td>' + s.total + '</td><td>' + s.completed + '</td><td>' + s.won + '</td><td>' + s.lost + '</td><td>' + rate + '%</td><td>$' + s.value.toLocaleString() + '</td></tr>';
    }).join('');

    reportContent.innerHTML = reportTable('Conversion by Service', ['Service', 'Total', 'Completed', 'Won', 'Lost', 'Conv. Rate', 'Est. Value'], rows);
  }

  /* === TIME PER STAGE === */
  function renderStagesReport() {
    var leads = getFilteredByDate();
    var stageCounts = {};
    STAGE_ORDER.forEach(function(s) { stageCounts[s] = { count: 0, value: 0 }; });

    leads.forEach(function(l) {
      var stage = l.pipeline_stage || 'new';
      if (!stageCounts[stage]) stageCounts[stage] = { count: 0, value: 0 };
      stageCounts[stage].count++;
      stageCounts[stage].value += parseFloat(l.estimated_value) || 0;
    });

    var totalLeads = leads.length;
    var rows = STAGE_ORDER.map(function(slug) {
      var s = stageCounts[slug];
      var pct = totalLeads > 0 ? (s.count / totalLeads * 100).toFixed(1) : '0';
      var barWidth = totalLeads > 0 ? Math.round(s.count / totalLeads * 100) : 0;
      return '<tr>'
        + '<td>' + CRM.escapeHtml(STAGE_NAMES[slug]) + '</td>'
        + '<td>' + s.count + '</td>'
        + '<td>' + pct + '%</td>'
        + '<td><div class="crm-report-bar"><div class="crm-report-bar-fill" data-width="' + barWidth + '"></div></div></td>'
        + '<td>$' + s.value.toLocaleString() + '</td>'
        + '</tr>';
    }).join('');

    reportContent.innerHTML = reportTable('Pipeline Stage Distribution', ['Stage', 'Leads', '% of Total', 'Distribution', 'Est. Value'], rows);

    /* Animate bars after render */
    var bars = reportContent.querySelectorAll('.crm-report-bar-fill');
    requestAnimationFrame(function() {
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.width = bars[i].getAttribute('data-width') + '%';
      }
    });
  }

  /* === LOST LEADS === */
  function renderLostReport() {
    var leads = getFilteredByDate();
    var lostLeads = leads.filter(function(l) { return l.pipeline_stage === 'lost'; });

    if (lostLeads.length === 0) {
      reportContent.innerHTML = '<div class="crm-report-empty">No lost leads found.</div>';
      return;
    }

    var reasons = {};
    lostLeads.forEach(function(l) {
      var reason = l.lost_reason || 'No reason provided';
      if (!reasons[reason]) reasons[reason] = [];
      reasons[reason].push(l);
    });

    var reasonRows = Object.entries(reasons)
      .sort(function(a, b) { return b[1].length - a[1].length; })
      .map(function(e) {
        return '<tr><td>' + CRM.escapeHtml(e[0]) + '</td><td>' + e[1].length + '</td></tr>';
      }).join('');

    var detailRows = lostLeads.map(function(l) {
      var name = ((l.first_name || '') + ' ' + (l.last_name || '')).trim() || l.email;
      return '<tr>'
        + '<td><a href="/crm/lead.html?id=' + l.id + '">' + CRM.escapeHtml(name) + '</a></td>'
        + '<td>' + CRM.escapeHtml(l.company || '\u2014') + '</td>'
        + '<td>' + (l.service === 'dayporter' ? 'Day Porter' : 'Janitorial') + '</td>'
        + '<td>' + CRM.escapeHtml(l.lost_reason || '\u2014') + '</td>'
        + '<td>' + CRM.formatDate(l.created_at) + '</td>'
        + '</tr>';
    }).join('');

    reportContent.innerHTML = ''
      + reportTable('Lost Reasons Summary', ['Reason', 'Count'], reasonRows)
      + reportTable('Lost Leads Detail', ['Name', 'Company', 'Service', 'Reason', 'Created'], detailRows);
  }

  /* === HELPERS === */
  function statCard(label, value) {
    return '<div class="crm-stat-card"><div class="crm-stat-label">' + CRM.escapeHtml(label) + '</div><div class="crm-stat-value">' + value + '</div></div>';
  }

  function reportTable(title, headers, rows) {
    if (!rows) rows = '<tr><td colspan="' + headers.length + '" class="crm-report-empty">No data</td></tr>';
    var ths = headers.map(function(h) { return '<th>' + CRM.escapeHtml(h) + '</th>'; }).join('');
    return '<div class="crm-card crm-report-card">'
      + '<div class="crm-card-header"><h3 class="crm-card-title">' + CRM.escapeHtml(title) + '</h3></div>'
      + '<div class="crm-table-wrap"><table class="crm-table"><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '</div>';
  }

  /* === CSV EXPORT === */
  function exportCsv() {
    var type = reportType ? reportType.value : 'overview';
    var csvData = [];
    var leads = getFilteredByDate();

    switch (type) {
      case 'sources':
        csvData.push(['Source', 'Total', 'Won', 'Lost', 'Conversion Rate']);
        var sources = {};
        leads.forEach(function(l) {
          var src = (l.form_data ? (l.form_data.how_heard || l.form_data.referral) : null) || 'Unknown';
          if (!sources[src]) sources[src] = { total: 0, won: 0, lost: 0 };
          sources[src].total++;
          if (l.pipeline_stage === 'won') sources[src].won++;
          if (l.pipeline_stage === 'lost') sources[src].lost++;
        });
        Object.entries(sources).forEach(function(e) {
          var s = e[1];
          csvData.push([e[0], s.total, s.won, s.lost, (s.total > 0 ? (s.won / s.total * 100).toFixed(1) : '0') + '%']);
        });
        break;

      case 'services':
        csvData.push(['Service', 'Total', 'Completed', 'Won', 'Lost', 'Conv Rate', 'Est Value']);
        var svcs = {};
        leads.forEach(function(l) {
          var svc = l.service === 'dayporter' ? 'Day Porter' : 'Janitorial';
          if (!svcs[svc]) svcs[svc] = { total: 0, won: 0, lost: 0, completed: 0, value: 0 };
          svcs[svc].total++;
          if (l.pipeline_stage === 'won') svcs[svc].won++;
          if (l.pipeline_stage === 'lost') svcs[svc].lost++;
          if (l.status === 'completed') svcs[svc].completed++;
          svcs[svc].value += parseFloat(l.estimated_value) || 0;
        });
        Object.entries(svcs).forEach(function(e) {
          var s = e[1];
          csvData.push([e[0], s.total, s.completed, s.won, s.lost, (s.total > 0 ? (s.won / s.total * 100).toFixed(1) : '0') + '%', '$' + s.value]);
        });
        break;

      case 'lost':
        csvData.push(['Name', 'Company', 'Service', 'Reason', 'Created']);
        leads.filter(function(l) { return l.pipeline_stage === 'lost'; }).forEach(function(l) {
          csvData.push([
            (l.first_name || '') + ' ' + (l.last_name || ''),
            l.company || '', l.service || '', l.lost_reason || '', l.created_at || ''
          ]);
        });
        break;

      default:
        csvData.push(['Name', 'Email', 'Company', 'Service', 'Status', 'Stage', 'Source', 'Created']);
        leads.forEach(function(l) {
          csvData.push([
            (l.first_name || '') + ' ' + (l.last_name || ''),
            l.email || '', l.company || '', l.service || '', l.status || '',
            l.pipeline_stage || '', (l.form_data ? l.form_data.how_heard : '') || '', l.created_at || ''
          ]);
        });
    }

    var csv = csvData.map(function(r) {
      return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ecco-report-' + (reportType ? reportType.value : 'overview') + '-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  init();
})();
