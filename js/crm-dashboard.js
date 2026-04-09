(function() {
  var kpisEl = document.getElementById('dashboardKpis');
  var chartsEl = document.getElementById('dashboardCharts');
  var charts = {};

  /* Chart.js global defaults */
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#6B7A8D';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.animation.duration = 600;
  }

  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('dashboard');
    CRM.showLoading(kpisEl);
    chartsEl.innerHTML = '';
    await loadDashboard();
    CRM.startPolling(loadDashboard, 60);
  }

  async function loadDashboard() {
    try {
      var result = await CRM.fetch('/crm-stats');
      if (!result || !result.ok) {
        CRM.showError(kpisEl, { message: result ? result.error : 'Failed to load dashboard', onRetry: loadDashboard });
        return;
      }
      renderKpis(result.data.kpis);
      renderCharts(result.data.charts, result.data.kpis);
    } catch (err) {
      CRM.showError(kpisEl, { message: 'Failed to load dashboard', onRetry: loadDashboard });
    }
  }

  function renderKpis(kpis) {
    var monthChange = kpis.prev_month > 0
      ? Math.round((kpis.month - kpis.prev_month) / kpis.prev_month * 100)
      : (kpis.month > 0 ? 100 : 0);
    var changeClass = monthChange >= 0 ? 'positive' : 'negative';
    var changeSymbol = monthChange >= 0 ? '+' : '';

    kpisEl.innerHTML = ''
      + kpiCard('Leads Today', kpis.today, '')
      + kpiCard('This Week', kpis.week, '')
      + kpiCard('This Month', kpis.month, '<span class="crm-stat-change ' + changeClass + '">' + changeSymbol + monthChange + '% vs last month</span>')
      + kpiCard('Conversion Rate', kpis.conversion_rate + '%', '<span class="crm-stat-change">' + kpis.won + ' won / ' + kpis.total + ' total</span>')
      + kpiCard('Pipeline Value', '$' + formatNumber(kpis.pipeline_value), '<span class="crm-stat-change">' + kpis.open_leads + ' open leads</span>')
      + kpiCard('Total Leads', kpis.total, '<span class="crm-stat-change">' + kpis.open_leads + ' open, ' + kpis.won + ' won, ' + kpis.lost + ' lost</span>')
      + (kpis.uncontacted_24h > 0 ? kpiCard('Needs Contact', kpis.uncontacted_24h, '<span class="crm-stat-change negative">No contact in 24h+</span>') : '')
      + (kpis.stale_7d > 0 ? kpiCard('Stale Leads', kpis.stale_7d, '<span class="crm-stat-change negative">7+ days without movement</span>') : '');
  }

  function kpiCard(label, value, extra) {
    return '<div class="crm-stat-card">'
      + '<div class="crm-stat-label">' + CRM.escapeHtml(label) + '</div>'
      + '<div class="crm-stat-value">' + value + '</div>'
      + (extra || '')
      + '</div>';
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function renderCharts(chartData, kpis) {
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
            backgroundColor: 'rgba(48,104,173,.08)',
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
            legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } },
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
            backgroundColor: '#3068AD',
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
