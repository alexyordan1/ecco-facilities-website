/* crm-leads.js — Leads list page logic v1.0 */
(function() {
  var state = {
    page: 1,
    per_page: 25,
    search: '',
    status: '',
    service: '',
    stage: '',
    sort: 'created_at',
    order: 'desc'
  };

  var tableEl = document.getElementById('leadsTable');
  var paginationEl = document.getElementById('pagination');
  var searchInput = document.getElementById('searchInput');
  var filterStatus = document.getElementById('filterStatus');
  var filterService = document.getElementById('filterService');
  var filterStage = document.getElementById('filterStage');
  var exportBtn = document.getElementById('exportCsv');

  /* Initialize */
  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('leads');

    /* Restore state from URL */
    var params = CRM.getParams();
    if (params.page) state.page = parseInt(params.page) || 1;
    if (params.search) state.search = params.search;
    if (params.status) state.status = params.status;
    if (params.service) state.service = params.service;
    if (params.stage) state.stage = params.stage;
    if (params.sort) state.sort = params.sort;
    if (params.order) state.order = params.order;

    /* Set input values from state */
    if (searchInput) searchInput.value = state.search;
    if (filterStatus) filterStatus.value = state.status;
    if (filterService) filterService.value = state.service;
    if (filterStage) filterStage.value = state.stage;

    /* Bind events */
    if (searchInput) searchInput.addEventListener('input', CRM.debounce(function() {
      state.search = this.value.trim();
      state.page = 1;
      loadLeads();
    }, 300));

    if (filterStatus) filterStatus.addEventListener('change', function() {
      state.status = this.value;
      state.page = 1;
      loadLeads();
    });

    if (filterService) filterService.addEventListener('change', function() {
      state.service = this.value;
      state.page = 1;
      loadLeads();
    });

    if (filterStage) filterStage.addEventListener('change', function() {
      state.stage = this.value;
      state.page = 1;
      loadLeads();
    });

    if (exportBtn) exportBtn.addEventListener('click', exportCsv);

    loadLeads();
    CRM.startPolling(loadLeads, 45);
  }

  async function loadLeads() {
    if (!tableEl) return;
    CRM.showLoading(tableEl);
    paginationEl.innerHTML = '';

    var params = new URLSearchParams();
    params.set('page', state.page);
    params.set('per_page', state.per_page);
    if (state.search) params.set('search', state.search);
    if (state.status) params.set('status', state.status);
    if (state.service) params.set('service', state.service);
    if (state.stage) params.set('stage', state.stage);
    params.set('sort', state.sort);
    params.set('order', state.order);

    try {
      var result = await CRM.fetch('/crm-leads?' + params.toString());

      if (!result || !result.ok) {
        CRM.showError(tableEl, { message: (result && result.error) || 'Failed to load leads', onRetry: loadLeads });
        return;
      }

      var leads = result.data.leads;
      var total = result.data.total;
      var page = result.data.page;
      var pages = result.data.pages;

      if (!leads || leads.length === 0) {
        var hasFilters = state.search || state.status || state.service || state.stage;
        CRM.showEmpty(tableEl, {
          icon: hasFilters ? '' : '',
          title: hasFilters ? 'No leads match your filters' : 'No leads yet',
          subtitle: hasFilters ? 'Try adjusting your search or filters.' : 'Leads will appear here when someone fills out a quote form.'
        });
        return;
      }

      renderTable(leads);
      renderPagination(page, pages, total);

      /* Sync URL */
      CRM.setParams(state);

    } catch (err) {
      CRM.showError(tableEl, { message: 'Failed to load leads', onRetry: loadLeads });
    }
  }

  function renderTable(leads) {
    var sortIcon = function(col) {
      if (state.sort !== col) return '';
      return state.order === 'asc' ? ' sorted-asc' : ' sorted-desc';
    };

    var html = '<div class="crm-table-wrap"><table class="crm-table">' +
      '<thead><tr>' +
        '<th class="sortable' + sortIcon('first_name') + '" data-sort="first_name">Name</th>' +
        '<th class="sortable' + sortIcon('company') + '" data-sort="company">Company</th>' +
        '<th>Service</th>' +
        '<th>Status</th>' +
        '<th>Stage</th>' +
        '<th>Urgency</th>' +
        '<th>Ref #</th>' +
        '<th class="sortable' + sortIcon('created_at') + '" data-sort="created_at">Date</th>' +
      '</tr></thead><tbody>';

    leads.forEach(function(lead) {
      var name = CRM.escapeHtml(((lead.first_name || '') + ' ' + (lead.last_name || '')).trim()) || '\u2014';
      var company = CRM.escapeHtml(lead.company || '\u2014');
      var urgency = (lead.form_data && (lead.form_data.urgency || lead.form_data.urg)) || '';
      var fullDate = CRM.formatDateTime(lead.created_at);

      html += '<tr data-id="' + lead.id + '" role="link" tabindex="0">' +
        '<td data-label="Name">' + name + '</td>' +
        '<td data-label="Company">' + company + '</td>' +
        '<td data-label="Service">' + CRM.serviceBadge(lead.service) + '</td>' +
        '<td data-label="Status">' + CRM.statusBadge(lead.status) + '</td>' +
        '<td data-label="Stage">' + CRM.stageBadge(lead.pipeline_stage) + '</td>' +
        '<td data-label="Urgency">' + CRM.urgencyBadge(urgency) + '</td>' +
        '<td data-label="Ref #">' + CRM.escapeHtml(lead.ref_number || '\u2014') + '</td>' +
        '<td data-label="Date" title="' + CRM.escapeHtml(fullDate) + '">' + CRM.formatRelative(lead.created_at) + '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    tableEl.innerHTML = html;

    /* Click handlers for rows */
    tableEl.querySelectorAll('tr[data-id]').forEach(function(row) {
      row.addEventListener('click', function() {
        window.location.href = '/crm/lead.html?id=' + row.dataset.id;
      });
      row.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') window.location.href = '/crm/lead.html?id=' + row.dataset.id;
      });
    });

    /* Sort handlers */
    tableEl.querySelectorAll('th.sortable').forEach(function(th) {
      th.addEventListener('click', function() {
        var col = th.dataset.sort;
        if (state.sort === col) {
          state.order = state.order === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort = col;
          state.order = col === 'first_name' ? 'asc' : 'desc';
        }
        loadLeads();
      });
    });
  }

  function renderPagination(page, pages, total) {
    if (pages <= 1) { paginationEl.innerHTML = ''; return; }

    var from = (page - 1) * state.per_page + 1;
    var to = Math.min(page * state.per_page, total);

    var btns = '';
    /* Prev button */
    btns += '<button ' + (page <= 1 ? 'disabled' : '') + ' data-page="' + (page - 1) + '">&lsaquo;</button>';

    /* Page numbers (show max 5 around current) */
    var start = Math.max(1, page - 2);
    var end = Math.min(pages, page + 2);
    if (start > 1) btns += '<button data-page="1">1</button>';
    if (start > 2) btns += '<span class="crm-pagination-ellipsis">&hellip;</span>';
    for (var i = start; i <= end; i++) {
      btns += '<button class="' + (i === page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    if (end < pages - 1) btns += '<span class="crm-pagination-ellipsis">&hellip;</span>';
    if (end < pages) btns += '<button data-page="' + pages + '">' + pages + '</button>';

    /* Next button */
    btns += '<button ' + (page >= pages ? 'disabled' : '') + ' data-page="' + (page + 1) + '">&rsaquo;</button>';

    paginationEl.innerHTML =
      '<div class="crm-pagination-info">Showing ' + from + '\u2013' + to + ' of ' + total + ' leads</div>' +
      '<div class="crm-pagination-btns">' + btns + '</div>';

    paginationEl.querySelectorAll('button[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.page = parseInt(btn.dataset.page);
        loadLeads();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  async function exportCsv() {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting\u2026';

    try {
      var params = new URLSearchParams();
      params.set('per_page', '1000');
      if (state.search) params.set('search', state.search);
      if (state.status) params.set('status', state.status);
      if (state.service) params.set('service', state.service);
      if (state.stage) params.set('stage', state.stage);
      params.set('sort', state.sort);
      params.set('order', state.order);

      var result = await CRM.fetch('/crm-leads?' + params.toString());
      if (!result || !result.ok || !result.data || !result.data.leads) return;

      var leads = result.data.leads;
      var headers = ['Name', 'Email', 'Phone', 'Company', 'Service', 'Status', 'Stage', 'Ref#', 'Urgency', 'Created'];
      var rows = leads.map(function(l) {
        return [
          ((l.first_name || '') + ' ' + (l.last_name || '')).trim(),
          l.email || '',
          l.phone || '',
          l.company || '',
          l.service || '',
          l.status || '',
          l.pipeline_stage || '',
          l.ref_number || '',
          (l.form_data && (l.form_data.urgency || l.form_data.urg)) || '',
          l.created_at ? new Date(l.created_at).toISOString().split('T')[0] : ''
        ];
      });

      var csv = [headers].concat(rows).map(function(r) {
        return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');

      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'ecco-leads-' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export CSV';
    }
  }

  init();
})();
