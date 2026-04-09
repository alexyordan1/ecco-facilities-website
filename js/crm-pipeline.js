(function() {
  var STAGES = [
    { slug: 'new', name: 'New Lead', color: '#3b82f6', closed: false },
    { slug: 'contacted', name: 'Contacted', color: '#8b5cf6', closed: false },
    { slug: 'site-visit', name: 'Site Visit', color: '#f59e0b', closed: false },
    { slug: 'proposal', name: 'Proposal Sent', color: '#06b6d4', closed: false },
    { slug: 'negotiation', name: 'Negotiation', color: '#f97316', closed: false },
    { slug: 'won', name: 'Won', color: '#22c55e', closed: true },
    { slug: 'lost', name: 'Lost', color: '#ef4444', closed: true }
  ];

  var boardEl = document.getElementById('kanbanBoard');
  var summaryEl = document.getElementById('kanbanSummary');
  var filterService = document.getElementById('filterService');
  var allLeads = [];
  var serviceFilter = '';
  var sortableInstances = [];

  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('pipeline');

    if (filterService) {
      filterService.addEventListener('change', function() {
        serviceFilter = this.value;
        renderBoard();
      });
    }

    await loadLeads();
    CRM.startPolling(loadLeads, 30);
  }

  async function loadLeads() {
    try {
      // Fetch all leads (no pagination for kanban — we need all)
      var result = await CRM.fetch('/crm-leads?per_page=500&sort=created_at&order=asc');

      if (!result || !result.ok) {
        CRM.showError(boardEl, { message: result ? result.error : 'Failed to load pipeline', onRetry: loadLeads });
        return;
      }

      allLeads = result.data.leads || [];
      renderBoard();

    } catch (err) {
      CRM.showError(boardEl, { message: 'Failed to load pipeline', onRetry: loadLeads });
    }
  }

  function getFilteredLeads() {
    if (!serviceFilter) return allLeads;
    return allLeads.filter(function(l) { return l.service === serviceFilter; });
  }

  function renderBoard() {
    var leads = getFilteredLeads();

    // Group leads by stage
    var grouped = {};
    STAGES.forEach(function(s) { grouped[s.slug] = []; });

    leads.forEach(function(lead) {
      var stage = lead.pipeline_stage || 'new';
      if (!grouped[stage]) grouped[stage] = grouped['new'];
      grouped[stage].push(lead);
    });

    // Destroy existing sortable instances
    sortableInstances.forEach(function(s) { s.destroy(); });
    sortableInstances = [];

    // Build columns
    var html = '';
    var totalOpen = 0;

    STAGES.forEach(function(stage) {
      var stageLeads = grouped[stage.slug] || [];
      var count = stageLeads.length;
      if (!stage.closed) totalOpen += count;

      var cardsHtml = '';
      if (count === 0) {
        cardsHtml = '<div class="crm-kanban-empty">No leads</div>';
      } else {
        stageLeads.forEach(function(lead) {
          cardsHtml += renderCard(lead);
        });
      }

      html += '<div class="crm-kanban-col' + (stage.closed ? ' is-closed' : '') + '" data-stage="' + stage.slug + '">'
        + '<div class="crm-kanban-header">'
        + '  <div class="crm-kanban-title">'
        + '    <span class="crm-kanban-dot" style="background:' + stage.color + '"></span>'
        + '    ' + CRM.escapeHtml(stage.name)
        + '  </div>'
        + '  <span class="crm-kanban-count">' + count + '</span>'
        + '</div>'
        + '<div class="crm-kanban-cards" data-stage="' + stage.slug + '">'
        + cardsHtml
        + '</div>'
        + '</div>';
    });

    boardEl.innerHTML = html;

    // Update summary
    if (summaryEl) {
      summaryEl.textContent = totalOpen + ' open lead' + (totalOpen !== 1 ? 's' : '') + ' in pipeline';
    }

    // Initialize SortableJS on each column
    var cardContainers = boardEl.querySelectorAll('.crm-kanban-cards');
    cardContainers.forEach(function(container) {
      var instance = new Sortable(container, {
        group: 'pipeline',
        animation: 200,
        easing: 'cubic-bezier(.4,0,.2,1)',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        delay: 50,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        onEnd: handleDrop
      });
      sortableInstances.push(instance);
    });

    // Click handlers on cards to open detail
    boardEl.querySelectorAll('.crm-kanban-card').forEach(function(card) {
      card.addEventListener('dblclick', function() {
        window.location.href = '/crm/lead.html?id=' + this.dataset.id;
      });
    });
  }

  function renderCard(lead) {
    var name = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim() || lead.email || '—';
    var company = lead.company || '';
    var urgency = lead.form_data ? (lead.form_data.urgency || lead.form_data.urg || '') : '';
    var daysInStage = getDaysInStage(lead);
    var urgencyClass = getUrgencyClass(urgency);

    return '<div class="crm-kanban-card" data-id="' + lead.id + '">'
      + (urgencyClass ? '<div class="crm-kanban-card-urgency-bar ' + urgencyClass + '"></div>' : '')
      + '<div class="crm-kanban-card-name">' + CRM.escapeHtml(name) + '</div>'
      + '<div class="crm-kanban-card-company">' + CRM.escapeHtml(company) + '</div>'
      + '<div class="crm-kanban-card-meta">'
      + CRM.serviceBadge(lead.service)
      + (urgency ? ' ' + CRM.urgencyBadge(urgency) : '')
      + '<span class="crm-kanban-card-days">' + daysInStage + '</span>'
      + '</div>'
      + '</div>';
  }

  function getDaysInStage(lead) {
    // Use created_at as a proxy (we don't track stage change timestamp yet)
    var created = new Date(lead.created_at);
    var now = new Date();
    var days = Math.floor((now - created) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1d';
    return days + 'd';
  }

  function getUrgencyClass(urgency) {
    if (!urgency) return '';
    var lower = urgency.toLowerCase();
    if (lower.indexOf('asap') !== -1 || lower.indexOf('immediate') !== -1) return 'urgency-asap';
    if (lower.indexOf('1-2') !== -1 || lower.indexOf('week') !== -1 || lower.indexOf('soon') !== -1) return 'urgency-soon';
    return 'urgency-flexible';
  }

  async function handleDrop(evt) {
    var cardEl = evt.item;
    var leadId = parseInt(cardEl.dataset.id);
    var newStage = evt.to.dataset.stage;
    var oldStage = evt.from.dataset.stage;

    // Same column — no action
    if (newStage === oldStage) return;

    // Optimistic: update local data
    var lead = allLeads.find(function(l) { return l.id === leadId; });
    if (lead) lead.pipeline_stage = newStage;

    // Update counts
    updateCounts();

    // Save to server
    try {
      var result = await CRM.fetch('/crm-leads', {
        method: 'PATCH',
        body: { id: leadId, pipeline_stage: newStage }
      });

      if (!result || !result.ok) {
        // Revert on failure
        if (lead) lead.pipeline_stage = oldStage;
        renderBoard();
      }
    } catch (err) {
      // Revert on error
      if (lead) lead.pipeline_stage = oldStage;
      renderBoard();
    }
  }

  function updateCounts() {
    var leads = getFilteredLeads();
    var counts = {};
    STAGES.forEach(function(s) { counts[s.slug] = 0; });

    leads.forEach(function(lead) {
      var stage = lead.pipeline_stage || 'new';
      if (counts[stage] !== undefined) counts[stage]++;
    });

    var totalOpen = 0;
    boardEl.querySelectorAll('.crm-kanban-col').forEach(function(col) {
      var stage = col.dataset.stage;
      var countEl = col.querySelector('.crm-kanban-count');
      if (countEl) countEl.textContent = counts[stage] || 0;
      var stageInfo = STAGES.find(function(s) { return s.slug === stage; });
      if (stageInfo && !stageInfo.closed) totalOpen += (counts[stage] || 0);
    });

    if (summaryEl) {
      summaryEl.textContent = totalOpen + ' open lead' + (totalOpen !== 1 ? 's' : '') + ' in pipeline';
    }
  }

  init();
})();
