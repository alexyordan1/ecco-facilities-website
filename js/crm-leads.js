/* crm-leads.js — Leads list page logic v1.1 — bulk actions, CSV import */
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

    /* Import CSV */
    var importBtn = document.getElementById('importCsv');
    var csvFileInput = document.getElementById('csvFileInput');
    if (importBtn && csvFileInput) {
      importBtn.addEventListener('click', function() { csvFileInput.click(); });
      csvFileInput.addEventListener('change', handleCsvFile);
    }

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

    /* Bulk action bar (inserted above table, hidden by default) */
    var bulkHtml = '<div class="crm-bulk-bar" id="bulkBar" style="display:none">' +
      '<span id="bulkCount">0 selected</span>' +
      '<select id="bulkStage" class="crm-filter-select">' +
        '<option value="">Change Stage...</option>' +
        '<option value="new">New Lead</option>' +
        '<option value="contacted">Contacted</option>' +
        '<option value="site-visit">Site Visit</option>' +
        '<option value="proposal">Proposal Sent</option>' +
        '<option value="negotiation">Negotiation</option>' +
        '<option value="won">Won</option>' +
        '<option value="lost">Lost</option>' +
      '</select>' +
      '<button id="bulkContacted" class="crm-btn-sm">Mark Contacted</button>' +
      '<button id="bulkDeselect" class="crm-btn-sm crm-btn-secondary">Deselect All</button>' +
    '</div>';

    var html = bulkHtml + '<div class="crm-table-wrap"><table class="crm-table">' +
      '<thead><tr>' +
        '<th class="crm-check-col"><input type="checkbox" id="selectAll"></th>' +
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

      var alertBadges = CRM.alertBadges(lead);
      var rowClass = CRM.getLeadAlerts(lead).some(function(a) { return a.type === 'stale'; }) ? ' crm-row-stale' : '';

      html += '<tr data-id="' + lead.id + '" role="link" tabindex="0" class="' + rowClass + '">' +
        '<td class="crm-check-col"><input type="checkbox" class="crm-row-check" data-id="' + lead.id + '"></td>' +
        '<td data-label="Name">' + name + (alertBadges ? ' ' + alertBadges : '') + '</td>' +
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

    /* Click handlers for rows (skip clicks on checkboxes) */
    tableEl.querySelectorAll('tr[data-id]').forEach(function(row) {
      row.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox' || e.target.closest('.crm-check-col')) return;
        window.location.href = '/crm/lead.html?id=' + row.dataset.id;
      });
      row.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.type !== 'checkbox') window.location.href = '/crm/lead.html?id=' + row.dataset.id;
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

    /* Bulk selection handlers */
    bindBulkActions();
  }

  /* --- Bulk Actions --- */
  function getCheckedIds() {
    var ids = [];
    tableEl.querySelectorAll('.crm-row-check:checked').forEach(function(cb) {
      ids.push(parseInt(cb.dataset.id, 10));
    });
    return ids;
  }

  function updateBulkBar() {
    var ids = getCheckedIds();
    var bar = document.getElementById('bulkBar');
    var count = document.getElementById('bulkCount');
    if (!bar) return;
    if (ids.length > 0) {
      bar.style.display = 'flex';
      count.textContent = ids.length + ' selected';
    } else {
      bar.style.display = 'none';
    }
    /* Keep selectAll in sync */
    var selectAll = document.getElementById('selectAll');
    var allBoxes = tableEl.querySelectorAll('.crm-row-check');
    if (selectAll && allBoxes.length > 0) {
      selectAll.checked = ids.length === allBoxes.length;
      selectAll.indeterminate = ids.length > 0 && ids.length < allBoxes.length;
    }
  }

  function bindBulkActions() {
    var selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', function() {
        var checked = this.checked;
        tableEl.querySelectorAll('.crm-row-check').forEach(function(cb) {
          cb.checked = checked;
        });
        updateBulkBar();
      });
    }

    tableEl.querySelectorAll('.crm-row-check').forEach(function(cb) {
      cb.addEventListener('change', updateBulkBar);
    });

    var bulkStage = document.getElementById('bulkStage');
    if (bulkStage) {
      bulkStage.addEventListener('change', async function() {
        var newStage = this.value;
        if (!newStage) return;
        var ids = getCheckedIds();
        if (ids.length === 0) return;

        bulkStage.disabled = true;
        var promises = ids.map(function(id) {
          return CRM.fetch('/crm-leads', {
            method: 'PATCH',
            body: { id: id, pipeline_stage: newStage }
          });
        });
        await Promise.all(promises);
        bulkStage.value = '';
        bulkStage.disabled = false;
        loadLeads();
      });
    }

    var bulkContacted = document.getElementById('bulkContacted');
    if (bulkContacted) {
      bulkContacted.addEventListener('click', async function() {
        var ids = getCheckedIds();
        if (ids.length === 0) return;

        this.disabled = true;
        this.textContent = 'Updating\u2026';
        var now = new Date().toISOString();
        var promises = ids.map(function(id) {
          return CRM.fetch('/crm-leads', {
            method: 'PATCH',
            body: { id: id, last_contacted_at: now }
          });
        });
        await Promise.all(promises);
        this.disabled = false;
        this.textContent = 'Mark Contacted';
        loadLeads();
      });
    }

    var bulkDeselect = document.getElementById('bulkDeselect');
    if (bulkDeselect) {
      bulkDeselect.addEventListener('click', function() {
        tableEl.querySelectorAll('.crm-row-check').forEach(function(cb) {
          cb.checked = false;
        });
        var selectAll = document.getElementById('selectAll');
        if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
        updateBulkBar();
      });
    }
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
      if (!result || !result.ok || !result.data || !result.data.leads) {
        return;
      }

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
    } catch (err) {
      /* Network or unexpected error — user sees button re-enable via finally */
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export CSV';
      }
    }
  }

  /* --- CSV Import --- */
  function parseCsv(text) {
    var lines = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
        lines.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) lines.push(current);

    return lines.map(function(line) {
      var fields = [];
      var field = '';
      var q = false;
      for (var j = 0; j < line.length; j++) {
        var c = line[j];
        if (c === '"') {
          if (q && j + 1 < line.length && line[j + 1] === '"') {
            field += '"';
            j++;
          } else {
            q = !q;
          }
        } else if (c === ',' && !q) {
          fields.push(field.trim());
          field = '';
        } else {
          field += c;
        }
      }
      fields.push(field.trim());
      return fields;
    });
  }

  function mapColumns(headers) {
    var map = {};
    var aliases = {
      'name': 'name', 'full name': 'name', 'fullname': 'name', 'contact': 'name',
      'first name': 'first_name', 'first_name': 'first_name', 'firstname': 'first_name',
      'last name': 'last_name', 'last_name': 'last_name', 'lastname': 'last_name',
      'email': 'email', 'e-mail': 'email', 'email address': 'email',
      'phone': 'phone', 'telephone': 'phone', 'phone number': 'phone', 'tel': 'phone',
      'company': 'company', 'organization': 'company', 'org': 'company', 'business': 'company',
      'service': 'service', 'service type': 'service'
    };
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toLowerCase().trim();
      if (aliases[h]) {
        map[i] = aliases[h];
      }
    }
    return map;
  }

  function handleCsvFile() {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var rows = parseCsv(e.target.result);
      if (rows.length < 2) return;

      var headers = rows[0];
      var colMap = mapColumns(headers);
      var dataRows = rows.slice(1).filter(function(r) { return r.join('').trim(); });

      if (dataRows.length === 0) return;

      var leads = dataRows.map(function(row) {
        var obj = {};
        for (var idx in colMap) {
          if (colMap.hasOwnProperty(idx)) {
            obj[colMap[idx]] = row[idx] || '';
          }
        }
        return obj;
      });

      showImportPreview(headers, dataRows, colMap, leads);
    };
    reader.readAsText(file);
    this.value = '';
  }

  function showImportPreview(headers, dataRows, colMap, leads) {
    /* Remove any existing preview */
    var existing = document.getElementById('importPreview');
    if (existing) existing.remove();

    var previewRows = dataRows.slice(0, 5);
    var thHtml = '<tr>';
    for (var i = 0; i < headers.length; i++) {
      var mapped = colMap[i] ? ' (' + colMap[i] + ')' : '';
      thHtml += '<th>' + CRM.escapeHtml(headers[i]) + mapped + '</th>';
    }
    thHtml += '</tr>';

    var tbHtml = '';
    previewRows.forEach(function(row) {
      tbHtml += '<tr>';
      for (var j = 0; j < row.length; j++) {
        tbHtml += '<td>' + CRM.escapeHtml(row[j]) + '</td>';
      }
      tbHtml += '</tr>';
    });

    var totalLabel = dataRows.length === 1 ? '1 lead' : dataRows.length + ' leads';
    var preview = document.createElement('div');
    preview.id = 'importPreview';
    preview.className = 'crm-import-preview';
    preview.innerHTML =
      '<h3>CSV Import Preview</h3>' +
      '<table><thead>' + thHtml + '</thead><tbody>' + tbHtml + '</tbody></table>' +
      (dataRows.length > 5 ? '<p style="margin-top:.5rem;font-size:.78rem;color:var(--tm)">Showing 5 of ' + dataRows.length + ' rows</p>' : '') +
      '<div class="crm-import-actions">' +
        '<button id="confirmImport" class="crm-btn-sm">Import ' + totalLabel + '</button>' +
        '<button id="cancelImport" class="crm-btn-sm crm-btn-secondary">Cancel</button>' +
      '</div>';

    tableEl.parentNode.insertBefore(preview, tableEl);

    document.getElementById('cancelImport').addEventListener('click', function() {
      preview.remove();
    });

    document.getElementById('confirmImport').addEventListener('click', async function() {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'Importing\u2026';

      try {
        var result = await CRM.fetch('/crm-import', {
          method: 'POST',
          body: { leads: leads }
        });

        if (result && result.ok) {
          preview.innerHTML = '<h3>Import complete! ' + (result.data.imported || leads.length) + ' leads imported.</h3>';
          setTimeout(function() { preview.remove(); loadLeads(); }, 1500);
        } else {
          btn.disabled = false;
          btn.textContent = 'Retry Import';
          preview.insertAdjacentHTML('beforeend', '<p style="color:var(--red);font-size:.82rem;margin-top:.5rem">' + CRM.escapeHtml((result && result.error) || 'Import failed') + '</p>');
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Retry Import';
      }
    });
  }

  init();
})();
