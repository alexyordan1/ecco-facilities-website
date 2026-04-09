/* crm-detail.js — Lead detail page logic v1.0 */
(function() {
  var detailEl = document.getElementById('leadDetail');
  var breadcrumbName = document.getElementById('breadcrumbName');
  var leadId = null;
  var lead = null;
  var stages = [];

  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('leads');

    var params = CRM.getParams();
    leadId = params.id;

    if (!leadId) {
      window.location.href = '/crm/leads.html';
      return;
    }

    CRM.showLoading(detailEl);
    await loadLead();
  }

  async function loadLead() {
    try {
      /* Fetch lead, notes, activities, and stages in parallel */
      var results = await Promise.all([
        CRM.fetch('/crm-leads?id=' + leadId),
        CRM.fetch('/crm-notes?lead_id=' + leadId),
        CRM.fetch('/crm-activities?lead_id=' + leadId),
        CRM.fetch('/crm-leads?stages=true')
      ]);

      var leadRes = results[0];
      var notesRes = results[1];
      var activitiesRes = results[2];
      var stagesRes = results[3];

      if (!leadRes || !leadRes.ok || !leadRes.data || !leadRes.data.lead) {
        CRM.showError(detailEl, { message: 'Lead not found', onRetry: loadLead });
        return;
      }

      lead = leadRes.data.lead;
      var notes = (notesRes && notesRes.ok) ? notesRes.data.notes : [];
      var activities = (activitiesRes && activitiesRes.ok) ? activitiesRes.data.activities : [];
      stages = (stagesRes && stagesRes.ok && stagesRes.data.stages) ? stagesRes.data.stages : [];

      /* Update breadcrumb */
      var name = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim() || lead.email;
      breadcrumbName.textContent = name;
      document.title = name + ' \u2014 CRM \u2014 Ecco Facilities';

      renderDetail(lead, notes, activities);

    } catch (err) {
      CRM.showError(detailEl, { message: 'Failed to load lead details', onRetry: loadLead });
    }
  }

  function renderDetail(lead, notes, activities) {
    var name = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim() || '\u2014';
    var phone = lead.phone || (lead.form_data && lead.form_data.phone) || '';
    var email = lead.email || '';
    var company = lead.company || '';

    detailEl.innerHTML =
      '<div class="crm-detail-layout">' +
        '<div class="crm-detail-left">' +
          renderContactCard(lead, name, email, phone, company) +
          renderFormDataCard(lead) +
          renderTimelineCard(activities) +
        '</div>' +
        '<div class="crm-detail-right">' +
          renderPipelineCard(lead) +
          renderNotesCard(notes) +
        '</div>' +
      '</div>';

    bindEvents();
  }

  function renderContactCard(lead, name, email, phone, company) {
    var phoneLink = phone ? '<a href="tel:' + CRM.escapeHtml(phone) + '">' + CRM.escapeHtml(phone) + '</a>' : '\u2014';
    var emailLink = email ? '<a href="mailto:' + CRM.escapeHtml(email) + '">' + CRM.escapeHtml(email) + '</a>' : '\u2014';

    var completedRow = '';
    if (lead.completed_at) {
      completedRow = '<div class="crm-contact-item">' +
        '<div class="crm-contact-label">Completed</div>' +
        '<div class="crm-contact-value">' + CRM.formatDateTime(lead.completed_at) + '</div>' +
      '</div>';
    }

    var lastContactedRow = '';
    if (lead.last_contacted_at) {
      lastContactedRow = '<div class="crm-contact-item">' +
        '<div class="crm-contact-label">Last Contacted</div>' +
        '<div class="crm-contact-value">' + CRM.formatRelative(lead.last_contacted_at) + '</div>' +
      '</div>';
    }

    var svcLabel = lead.service === 'dayporter' ? 'Day Porter' : 'Janitorial';
    var emailSubject = encodeURIComponent('Ecco Facilities — ' + svcLabel + ' Services Follow-up');
    var emailBody = encodeURIComponent('Hi ' + (lead.first_name || 'there') + ',\n\nThank you for your interest in our ' + svcLabel.toLowerCase() + ' services. I wanted to follow up on your recent inquiry' + (lead.ref_number ? ' (Ref: ' + lead.ref_number + ')' : '') + '.\n\nI\'d love to discuss how we can help ' + (company ? company + ' ' : '') + 'with your cleaning needs. Would you have time for a quick call this week?\n\nBest regards,\nEcco Facilities Team\n(212) 555-0100\neccofacilities.com');

    var actions = '';
    if (phone) actions += '<button class="crm-action-btn" data-action="call" data-phone="' + CRM.escapeHtml(phone) + '">\uD83D\uDCDE Call</button>';
    if (email) actions += '<a href="mailto:' + CRM.escapeHtml(email) + '?subject=' + emailSubject + '&body=' + emailBody + '" class="crm-action-btn" data-action="email">\u2709\uFE0F Email</a>';

    return '<div class="crm-card">' +
      '<div class="crm-card-header">' +
        '<h2 class="crm-card-title">Contact Information</h2>' +
        '<div>' + CRM.serviceBadge(lead.service) + ' ' + CRM.statusBadge(lead.status) + '</div>' +
      '</div>' +
      '<div class="crm-contact-grid">' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Name</div>' +
          '<div class="crm-contact-value">' + CRM.escapeHtml(name) + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Email</div>' +
          '<div class="crm-contact-value">' + emailLink + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Phone</div>' +
          '<div class="crm-contact-value">' + phoneLink + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Company</div>' +
          '<div class="crm-contact-value">' + CRM.escapeHtml(company || '\u2014') + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Reference</div>' +
          '<div class="crm-contact-value"><strong>' + CRM.escapeHtml(lead.ref_number || '\u2014') + '</strong></div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Created</div>' +
          '<div class="crm-contact-value">' + CRM.formatDateTime(lead.created_at) + '</div>' +
        '</div>' +
        completedRow +
        lastContactedRow +
      '</div>' +
      '<div class="crm-contact-actions">' + actions + '</div>' +
    '</div>';
  }

  function renderFormDataCard(lead) {
    var fd = lead.form_data;
    if (!fd || Object.keys(fd).length === 0) return '';

    /* Skip keys that are already shown in contact card */
    var skipKeys = ['first_name', 'last_name', 'email', 'phone', 'form_type'];

    var rows = '';
    var keys = Object.keys(fd);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = fd[key];
      if (skipKeys.indexOf(key) !== -1) continue;
      if (value === null || value === undefined || value === '') continue;
      var label = CRM.formatLabel(key);
      var display = Array.isArray(value) ? value.join(', ') : String(value);
      rows += '<tr><td>' + CRM.escapeHtml(label) + '</td><td>' + CRM.escapeHtml(display) + '</td></tr>';
    }

    if (!rows) return '';

    return '<div class="crm-card">' +
      '<div class="crm-card-header"><h2 class="crm-card-title">Form Details</h2></div>' +
      '<table class="crm-formdata-table"><tbody>' + rows + '</tbody></table>' +
    '</div>';
  }

  function renderTimelineCard(activities) {
    if (!activities || activities.length === 0) {
      return '<div class="crm-card">' +
        '<div class="crm-card-header"><h2 class="crm-card-title">Activity</h2></div>' +
        '<div class="crm-empty"><div class="crm-empty-subtitle">No activity recorded yet.</div></div>' +
      '</div>';
    }

    var items = activities.map(function(a) {
      var dotClass = 'crm-timeline-dot-' + (a.type || 'created');
      return '<div class="crm-timeline-item">' +
        '<div class="crm-timeline-dot ' + dotClass + '"></div>' +
        '<div class="crm-timeline-desc">' + CRM.escapeHtml(a.description) + '</div>' +
        '<div class="crm-timeline-time">' + CRM.formatRelative(a.created_at) + '</div>' +
      '</div>';
    }).join('');

    return '<div class="crm-card">' +
      '<div class="crm-card-header"><h2 class="crm-card-title">Activity</h2></div>' +
      '<div class="crm-timeline">' + items + '</div>' +
    '</div>';
  }

  function renderPipelineCard(lead) {
    var stageOptions = stages.map(function(s) {
      var sel = s.slug === lead.pipeline_stage ? ' selected' : '';
      return '<option value="' + CRM.escapeHtml(s.slug) + '"' + sel + '>' + CRM.escapeHtml(s.name) + '</option>';
    }).join('');

    var lostDisplay = lead.pipeline_stage === 'lost' ? 'block' : 'none';
    var contactedLabel = lead.last_contacted_at
      ? '\u2713 Contacted ' + CRM.formatRelative(lead.last_contacted_at)
      : 'Mark as Contacted';

    return '<div class="crm-card">' +
      '<div class="crm-card-header"><h2 class="crm-card-title">Pipeline</h2></div>' +
      '<div class="crm-stage-current">' +
        '<span>Current:</span> ' + CRM.stageBadge(lead.pipeline_stage) +
        ' <span class="crm-stage-days">' + CRM.daysInStage(lead) + ' in stage</span>' +
        ' ' + CRM.alertBadges(lead) +
      '</div>' +
      '<select id="stageSelect" class="crm-input crm-stage-select">' + stageOptions + '</select>' +
      '<div id="lostReasonWrap" class="crm-form-group crm-lost-reason-wrap" data-visible="' + lostDisplay + '">' +
        '<label class="crm-label">Lost Reason</label>' +
        '<textarea id="lostReason" class="crm-input" placeholder="Why was this lead lost?" rows="2">' + CRM.escapeHtml(lead.lost_reason || '') + '</textarea>' +
      '</div>' +
      '<div class="crm-form-group crm-value-wrap">' +
        '<label class="crm-label">Estimated Value ($)</label>' +
        '<input type="number" id="estimatedValue" class="crm-input" placeholder="0.00" value="' + (lead.estimated_value || '') + '" step="0.01" min="0">' +
      '</div>' +
      '<button id="markContacted" class="crm-btn-sm crm-btn-secondary crm-contacted-btn">' + contactedLabel + '</button>' +
    '</div>';
  }

  function renderNotesCard(notes) {
    var notesList;
    if (notes.length === 0) {
      notesList = '<div class="crm-empty"><div class="crm-empty-subtitle">No notes yet. Add the first note.</div></div>';
    } else {
      notesList = notes.map(function(n) {
        return '<div class="crm-note">' +
          '<div class="crm-note-text">' + CRM.escapeHtml(n.note) + '</div>' +
          '<div class="crm-note-meta">' + CRM.escapeHtml(n.created_by || 'admin') + ' \u00B7 ' + CRM.formatRelative(n.created_at) + '</div>' +
        '</div>';
      }).join('');
    }

    return '<div class="crm-card">' +
      '<div class="crm-card-header"><h2 class="crm-card-title">Notes</h2></div>' +
      '<div class="crm-note-form">' +
        '<textarea id="noteInput" class="crm-input" placeholder="Add a note..." rows="3"></textarea>' +
        '<button id="addNoteBtn" class="crm-btn-sm crm-add-note-btn">Add Note</button>' +
      '</div>' +
      '<div id="notesList">' + notesList + '</div>' +
    '</div>';
  }

  function bindEvents() {
    /* Communication action buttons */
    var actionBtns = detailEl.querySelectorAll('[data-action]');
    actionBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var action = btn.dataset.action;
        if (action === 'call') {
          /* Open tel: link then log */
          window.location.href = 'tel:' + btn.dataset.phone;
          logCommunication('call', 'Call initiated to ' + btn.dataset.phone);
        } else if (action === 'email') {
          /* mailto link opens naturally via <a>, just log */
          logCommunication('email', 'Email sent to ' + (lead.email || ''));
        }
      });
    });

    /* Stage change */
    var stageSelect = document.getElementById('stageSelect');
    var lostWrap = document.getElementById('lostReasonWrap');

    if (stageSelect) {
      function toggleLostReason() {
        if (lostWrap) {
          var show = stageSelect.value === 'lost';
          lostWrap.setAttribute('data-visible', show ? 'block' : 'none');
          lostWrap.classList.toggle('crm-lost-visible', show);
        }
      }

      stageSelect.addEventListener('change', async function() {
        toggleLostReason();

        var update = { id: leadId, pipeline_stage: this.value };

        /* Save stage change immediately — lost_reason can be added later on blur */
        await saveField(update);
      });

      toggleLostReason();
    }

    /* Save lost reason */
    var lostReason = document.getElementById('lostReason');
    if (lostReason) {
      lostReason.addEventListener('blur', async function() {
        if (stageSelect.value === 'lost' && this.value.trim()) {
          await saveField({ id: leadId, pipeline_stage: 'lost', lost_reason: this.value.trim() });
        }
      });
    }

    /* Estimated value */
    var valueInput = document.getElementById('estimatedValue');
    if (valueInput) {
      valueInput.addEventListener('blur', async function() {
        var val = parseFloat(this.value);
        if (!isNaN(val) && val !== (lead.estimated_value || 0)) {
          await saveField({ id: leadId, estimated_value: val });
        }
      });
    }

    /* Mark as contacted */
    var contactedBtn = document.getElementById('markContacted');
    if (contactedBtn) {
      contactedBtn.addEventListener('click', async function() {
        this.disabled = true;
        await saveField({ id: leadId, last_contacted_at: new Date().toISOString() });
        this.textContent = '\u2713 Contacted just now';
      });
    }

    /* Add note */
    var noteInput = document.getElementById('noteInput');
    var addNoteBtn = document.getElementById('addNoteBtn');
    var notesListEl = document.getElementById('notesList');

    if (addNoteBtn && noteInput) {
      addNoteBtn.addEventListener('click', async function() {
        var text = noteInput.value.trim();
        if (!text) return;

        this.disabled = true;
        this.textContent = 'Saving\u2026';

        try {
          var result = await CRM.fetch('/crm-notes', {
            method: 'POST',
            body: { lead_id: parseInt(leadId), note: text }
          });

          if (result && result.ok) {
            var n = result.data.note;
            var noteHtml = '<div class="crm-note">' +
              '<div class="crm-note-text">' + CRM.escapeHtml(n.note) + '</div>' +
              '<div class="crm-note-meta">' + CRM.escapeHtml(n.created_by || 'admin') + ' \u00B7 just now</div>' +
            '</div>';

            /* Remove empty state if present */
            var emptyEl = notesListEl.querySelector('.crm-empty');
            if (emptyEl) emptyEl.remove();

            notesListEl.insertAdjacentHTML('afterbegin', noteHtml);
            noteInput.value = '';

            /* Reload activities to show note_added */
            reloadActivities();
          }
        } finally {
          this.disabled = false;
          this.textContent = 'Add Note';
        }
      });
    }
  }

  async function saveField(update) {
    try {
      var result = await CRM.fetch('/crm-leads', {
        method: 'PATCH',
        body: update
      });

      if (result && result.ok) {
        /* Update local lead data */
        Object.assign(lead, update);

        /* Update stage badge if changed */
        if (update.pipeline_stage) {
          var stageCurrentEl = detailEl.querySelector('.crm-stage-current');
          if (stageCurrentEl) {
            stageCurrentEl.innerHTML = '<span>Current:</span> ' + CRM.stageBadge(update.pipeline_stage);
          }
        }

        /* Reload activities */
        reloadActivities();
      }
    } catch (err) {
      /* Silently fail — the UI already updated optimistically */
    }
  }

  async function logCommunication(type, description) {
    try {
      await CRM.fetch('/crm-notes', {
        method: 'POST',
        body: { lead_id: parseInt(leadId), note: '[' + type.toUpperCase() + '] ' + description }
      });
      /* Also update last_contacted_at */
      await saveField({ id: leadId, last_contacted_at: new Date().toISOString() });
      reloadActivities();
    } catch (err) { /* silent */ }
  }

  async function reloadActivities() {
    try {
      var result = await CRM.fetch('/crm-activities?lead_id=' + leadId);
      if (result && result.ok) {
        var timelineEl = detailEl.querySelector('.crm-timeline');
        var timelineCard = timelineEl ? timelineEl.closest('.crm-card') : null;
        if (!timelineCard) {
          /* Try finding via card title */
          var cards = detailEl.querySelectorAll('.crm-card');
          for (var i = 0; i < cards.length; i++) {
            var title = cards[i].querySelector('.crm-card-title');
            if (title && title.textContent === 'Activity') { timelineCard = cards[i]; break; }
          }
        }
        if (timelineCard) {
          var activities = (result.data && result.data.activities) || [];
          var temp = document.createElement('div');
          temp.innerHTML = renderTimelineCard(activities);
          timelineCard.parentNode.replaceChild(temp.firstElementChild, timelineCard);
        }
      }
    } catch (err) {
      /* Silent */
    }
  }

  init();
})();
