(function() {
  var kpisEl = document.getElementById('dashboardKpis');
  var chartsEl = document.getElementById('dashboardCharts');
  var charts = {};
  var dateRange = 'all';

  /* Chart.js global defaults */
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#6B7A8D';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.animation.duration = 600;
  }

  function renderGreeting() {
    var user = CRM.getUser();
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');
    var name = user ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }) : '';
    var date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    var container = document.getElementById('dashboardGreeting');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dashboardGreeting';
      container.className = 'crm-greeting';
      var content = document.querySelector('.crm-content');
      if (content) content.insertBefore(container, content.firstChild);
    }
    container.innerHTML = '<div class="crm-greeting-text">' +
      '<h1 class="crm-greeting-title">' + greeting + (name ? ', ' + CRM.escapeHtml(name) : '') + '</h1>' +
      '<p class="crm-greeting-date">' + date + '</p>' +
    '</div>' +
    '<div class="crm-quick-actions">' +
      '<a href="/crm/leads.html" class="crm-quick-btn">View Leads</a>' +
      '<a href="/crm/pipeline.html" class="crm-quick-btn">Pipeline</a>' +
      '<a href="/crm/reports.html" class="crm-quick-btn">Reports</a>' +
    '</div>';
  }

  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('dashboard');

    var dateRangeEl = document.getElementById('dateRange');
    if (dateRangeEl) {
      dateRangeEl.addEventListener('click', function(e) {
        var pill = e.target.closest('.crm-date-pill');
        if (!pill) return;
        dateRange = pill.dataset.range;
        dateRangeEl.querySelectorAll('.crm-date-pill').forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');
        loadDashboard();
      });
    }

    CRM.showLoading(kpisEl);
    chartsEl.innerHTML = '';
    await loadDashboard();
    CRM.startPolling(loadDashboard, CRM.getRefreshInterval() + 15);
  }

  function getDateParams() {
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
        return '';
    }

    var params = '';
    if (from) params += '&from=' + from.toISOString();
    if (to) params += '&to=' + to.toISOString();
    return params;
  }

  async function loadDashboard() {
    renderGreeting();
    try {
      var dateParams = getDateParams();
      var url = '/crm-stats' + (dateParams ? '?' + dateParams.substring(1) : '');
      var result = await CRM.fetch(url);
      if (!result || !result.ok) {
        CRM.showError(kpisEl, { message: result ? result.error : 'Failed to load dashboard', onRetry: loadDashboard });
        return;
      }
      renderKpis(result.data.kpis);
      renderCharts(result.data.charts, result.data.kpis);

      /* Fetch upcoming tasks */
      try {
        var tasksResult = await CRM.fetch('/crm-tasks?upcoming=true&days=7');
        if (tasksResult && tasksResult.ok && tasksResult.data.tasks.length > 0) {
          renderUpcomingTasks(tasksResult.data.tasks);
        } else {
          /* Clear existing tasks card if no tasks */
          var existing = document.getElementById('upcomingTasks');
          if (existing) existing.remove();
        }
      } catch (e) { /* silent */ }

    } catch (err) {
      CRM.showError(kpisEl, { message: 'Failed to load dashboard', onRetry: loadDashboard });
    }
  }

  function renderKpis(kpis) {
    var prevMonth = kpis.prev_month || 0;
    var curMonth = kpis.month || 0;
    var monthChange = prevMonth > 0
      ? Math.round((curMonth - prevMonth) / prevMonth * 100)
      : (curMonth > 0 ? 100 : 0);
    var changeClass = monthChange >= 0 ? 'positive' : 'negative';
    var changeSymbol = monthChange >= 0 ? '+' : '';

    var iconLeadsToday = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
    var iconWeek = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    var iconMonth = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
    var iconConversion = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
    var iconPipeline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
    var iconTotal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    var iconNeedsContact = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    var iconStale = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

    kpisEl.innerHTML = ''
      + kpiCard('Leads Today', kpis.today, '', iconLeadsToday, '#3b82f6')
      + kpiCard('This Week', kpis.week, '', iconWeek, '#8b5cf6')
      + kpiCard('This Month', kpis.month, '<span class="crm-stat-change ' + changeClass + '">' + changeSymbol + monthChange + '% vs last month</span>', iconMonth, '#06b6d4')
      + kpiCard('Conversion Rate', kpis.conversion_rate + '%', '<span class="crm-stat-change">' + kpis.won + ' won / ' + kpis.total + ' total</span>', iconConversion, '#22c55e')
      + kpiCard('Pipeline Value', '$' + formatNumber(kpis.pipeline_value), '<span class="crm-stat-change">' + kpis.open_leads + ' open leads</span>', iconPipeline, '#f59e0b')
      + kpiCard('Total Leads', kpis.total, '<span class="crm-stat-change">' + kpis.open_leads + ' open, ' + kpis.won + ' won, ' + kpis.lost + ' lost</span>', iconTotal, '#6366f1')
      + (kpis.uncontacted_24h > 0 ? kpiCard('Needs Contact', kpis.uncontacted_24h, '<span class="crm-stat-change negative">No contact in 24h+</span>', iconNeedsContact, '#ef4444') : '')
      + (kpis.stale_7d > 0 ? kpiCard('Stale Leads', kpis.stale_7d, '<span class="crm-stat-change negative">7+ days without movement</span>', iconStale, '#f97316') : '');
  }

  function kpiCard(label, value, extra, icon, color) {
    return '<div class="crm-stat-card" style="border-left-color:' + color + '">'
      + '<div class="crm-stat-icon" style="color:' + color + ';background:' + color + '15">' + icon + '</div>'
      + '<div class="crm-stat-label">' + CRM.escapeHtml(label) + '</div>'
      + '<div class="crm-stat-value">' + value + '</div>'
      + (extra || '')
      + '</div>';
  }

  function renderUpcomingTasks(tasks) {
    var container = document.getElementById('upcomingTasks');
    if (!container) {
      container = document.createElement('div');
      container.id = 'upcomingTasks';
      container.className = 'crm-card crm-upcoming-tasks';
      kpisEl.parentNode.insertBefore(container, chartsEl);
    }

    var html = '<div class="crm-card-header"><h3 class="crm-card-title">Upcoming Tasks</h3></div>';
    tasks.forEach(function(t) {
      var isOverdue = t.due_date && new Date(t.due_date) < new Date();
      var leadName = t.leads ? ((t.leads.first_name || '') + ' ' + (t.leads.last_name || '')).trim() : '';
      html += '<div class="crm-task ' + (isOverdue ? 'crm-task-overdue' : '') + '">' +
        '<div class="crm-task-content">' +
          '<div class="crm-task-title">' + CRM.escapeHtml(t.title) + '</div>' +
          '<div class="crm-task-due">' + (t.due_date ? CRM.formatDate(t.due_date) : 'No date') +
          (leadName ? ' &middot; <a href="/crm/lead.html?id=' + t.lead_id + '">' + CRM.escapeHtml(leadName) + '</a>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    });
    container.innerHTML = html;
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function renderCharts(chartData, kpis) {
    if (typeof Chart === 'undefined') { chartsEl.innerHTML = '<div class="crm-empty"><div class="crm-empty-subtitle">Charts unavailable — Chart.js failed to load.</div></div>'; return; }
    /* Destroy existing charts */
    Object.keys(charts).forEach(function(key) {
      if (charts[key]) charts[key].destroy();
    });
    charts = {};

    chartsEl.innerHTML = ''
      + '<div class="crm-chart-card crm-chart-wide"><div class="crm-card-header"><h3 class="crm-card-title">Leads Over Time</h3></div><canvas id="chartDaily"></canvas></div>'
      + '<div class="crm-chart-card"><div class="crm-card-header"><h3 class="crm-card-title">By Service</h3></div><canvas id="chartService"></canvas></div>'
      + '<div class="crm-chart-card"><div class="crm-card-header"><h3 class="crm-card-title">Pipeline Funnel</h3></div><canvas id="chartFunnel"></canvas></div>'
      + '<div class="crm-chart-card"><div class="crm-card-header"><h3 class="crm-card-title">Lead Sources</h3></div><canvas id="chartSources"></canvas></div>';

    /* 1. Daily leads line chart */
    var dailyCtx = document.getElementById('chartDaily');
    if (dailyCtx) {
      charts.daily = new Chart(dailyCtx, {
        type: 'line',
        data: {
          labels: chartData.daily.map(function(d) { return d.label; }),
          datasets: [{
            data: chartData.daily.map(function(d) { return d.count; }),
            borderColor: '#3068AD',
            backgroundColor: 'rgba(48,104,173,.12)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#3068AD',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              backgroundColor: '#1A1E2C',
              titleFont: { weight: '600' },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function(ctx) { return ctx.parsed.y + ' lead' + (ctx.parsed.y !== 1 ? 's' : ''); }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,.04)' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } }
            }
          }
        }
      });
    }

    /* 2. Service donut chart */
    var serviceCtx = document.getElementById('chartService');
    if (serviceCtx) {
      charts.service = new Chart(serviceCtx, {
        type: 'doughnut',
        data: {
          labels: ['Janitorial', 'Day Porter'],
          datasets: [{
            data: [chartData.by_service.janitorial, chartData.by_service.dayporter],
            backgroundColor: ['#3068AD', '#8B5CF6'],
            borderWidth: 0,
            borderRadius: 4,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { display: true, position: 'right', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } },
            tooltip: { backgroundColor: '#1A1E2C', padding: 10, cornerRadius: 8 }
          }
        }
      });
    }

    /* 3. Funnel horizontal bar chart */
    var funnelCtx = document.getElementById('chartFunnel');
    if (funnelCtx) {
      var funnelData = chartData.funnel;
      var funnelColors = {
        'new': '#3b82f6', 'contacted': '#8b5cf6', 'site-visit': '#f59e0b',
        'proposal': '#06b6d4', 'negotiation': '#f97316', 'won': '#22c55e', 'lost': '#ef4444'
      };

      charts.funnel = new Chart(funnelCtx, {
        type: 'bar',
        data: {
          labels: funnelData.map(function(f) { return f.name; }),
          datasets: [{
            data: funnelData.map(function(f) { return f.count; }),
            backgroundColor: funnelData.map(function(f) { return funnelColors[f.slug] || '#3068AD'; }),
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 24
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: { backgroundColor: '#1A1E2C', padding: 10, cornerRadius: 8 }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,.04)' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: '500' } }
            }
          }
        }
      });
    }

    /* 4. Sources bar chart */
    var sourcesCtx = document.getElementById('chartSources');
    if (sourcesCtx && chartData.by_source.length > 0) {
      charts.sources = new Chart(sourcesCtx, {
        type: 'bar',
        data: {
          labels: chartData.by_source.map(function(s) { return s.source; }),
          datasets: [{
            data: chartData.by_source.map(function(s) { return s.count; }),
            backgroundColor: ['#3068AD', '#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e'],
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: { backgroundColor: '#1A1E2C', padding: 10, cornerRadius: 8 }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,.04)' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } }
            }
          }
        }
      });
    }
  }

  init();
})();
