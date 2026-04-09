/* crm-detail.js — Lead detail page logic v1.1 — tags support */
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
      /* Fetch lead, notes, activities, stages, tasks, and tags in parallel */
      var results = await Promise.all([
        CRM.fetch('/crm-leads?id=' + leadId),
        CRM.fetch('/crm-notes?lead_id=' + leadId),
        CRM.fetch('/crm-activities?lead_id=' + leadId),
        CRM.fetch('/crm-leads?stages=true'),
        CRM.fetch('/crm-tasks?lead_id=' + leadId),
        CRM.fetch('/crm-tags?lead_id=' + leadId),
        CRM.fetch('/crm-tags')
      ]);

      var leadRes = results[0];
      var notesRes = results[1];
      var activitiesRes = results[2];
      var stagesRes = results[3];
      var tasksRes = results[4];
      var tagsRes = results[5];
      var allTagsRes = results[6];

      if (!leadRes || !leadRes.ok || !leadRes.data || !leadRes.data.lead) {
        CRM.showError(detailEl, { message: 'Lead not found', onRetry: loadLead });
        return;
      }

      lead = leadRes.data.lead;
      var notes = (notesRes && notesRes.ok) ? notesRes.data.notes : [];
      var activities = (activitiesRes && activitiesRes.ok) ? activitiesRes.data.activities : [];
      stages = (stagesRes && stagesRes.ok && stagesRes.data.stages) ? stagesRes.data.stages : [];
      var tasks = (tasksRes && tasksRes.ok && tasksRes.data.tasks) ? tasksRes.data.tasks : [];
      var tags = (tagsRes && tagsRes.ok && tagsRes.data.tags) ? tagsRes.data.tags : [];
      var allTags = (allTagsRes && allTagsRes.ok && allTagsRes.data.tags) ? allTagsRes.data.tags : [];

      /* Update breadcrumb */
      var name = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim() || lead.email;
      breadcrumbName.textContent = name;
      document.title = name + ' \u2014 CRM \u2014 Ecco Facilities';

      renderDetail(lead, notes, activities, tasks, tags, allTags);

    } catch (err) {
      CRM.showError(detailEl, { message: 'Failed to load lead details', onRetry: loadLead });
    }
  }

  function renderDetail(lead, notes, activities, tasks, tags, allTags) {
    var name = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim() || '\u2014';
    var phone = lead.phone || (lead.form_data && lead.form_data.phone) || '';
    var email = lead.email || '';
    var company = lead.company || '';

    detailEl.innerHTML =
      '<div class="crm-detail-layout">' +
        '<div class="crm-detail-left">' +
          renderContactCard(lead, name, email, phone, company, tags) +
          renderFormDataCard(lead) +
          renderTimelineCard(activities) +
        '</div>' +
        '<div class="crm-detail-right">' +
          renderPipelineCard(lead) +
          renderTasksCard(tasks) +
          renderNotesCard(notes) +
        '</div>' +
      '</div>';

    bindEvents(allTags || []);
  }

  function buildMailto(template, lead, email, company, svcLabel) {
    var name = lead.first_name || 'there';
    var ref = lead.ref_number ? ' (Ref: ' + lead.ref_number + ')' : '';
    var companyText = company ? company + ' ' : '';
    var subjects = {
      intro: 'Ecco Facilities \u2014 ' + svcLabel + ' Services for ' + (company || 'Your Business'),
      followup: 'Following Up \u2014 ' + svcLabel + ' Services' + ref,
      proposal: 'Your ' + svcLabel + ' Proposal from Ecco Facilities' + ref,
      thankyou: 'Thank You \u2014 Ecco Facilities'
    };
    var bodies = {
      intro: 'Hi ' + name + ',\n\nThank you for reaching out to Ecco Facilities! I\'d love to learn more about your ' + svcLabel.toLowerCase() + ' needs at ' + companyText + 'and show you how we can help.\n\nWould you have 15 minutes for a quick call this week? I can walk you through our services and provide a customized quote.\n\nBest regards,\nEcco Facilities Team\neccofacilities.com',
      followup: 'Hi ' + name + ',\n\nI wanted to follow up on your recent inquiry about our ' + svcLabel.toLowerCase() + ' services' + ref + '. Have you had a chance to review our options?\n\nI\'m happy to answer any questions or schedule a site visit at your convenience. We\'re currently offering complimentary assessments for new clients.\n\nLooking forward to hearing from you!\n\nBest,\nEcco Facilities Team',
      proposal: 'Hi ' + name + ',\n\nI\'m pleased to send you our ' + svcLabel.toLowerCase() + ' proposal for ' + companyText + ref + '. Please find the details below.\n\nOur proposal includes:\n- Customized cleaning schedule\n- Eco-certified products (safe for people, pets, and planet)\n- Dedicated team assignment\n- Quality assurance inspections\n\nI\'d love to walk you through the details. Would you be available for a brief call?\n\nBest regards,\nEcco Facilities Team',
      thankyou: 'Hi ' + name + ',\n\nThank you for choosing Ecco Facilities for your ' + svcLabel.toLowerCase() + ' needs! We\'re excited to partner with ' + companyText + 'and committed to exceeding your expectations.\n\nYour dedicated team will begin on the agreed start date. If you have any questions, don\'t hesitate to reach out.\n\nWelcome to the Ecco family!\n\nWarm regards,\nEcco Facilities Team'
    };
    return 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subjects[template] || '') + '&body=' + encodeURIComponent(bodies[template] || '');
  }

  function generateProposal() {
    var name = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim() || 'Client';
    var svcLabel = lead.service === 'dayporter' ? 'Day Porter' : 'Janitorial';
    var company = lead.company || '';
    var ref = lead.ref_number || '';
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var value = lead.estimated_value ? '$' + parseFloat(lead.estimated_value).toLocaleString() : 'To be determined';

    var fd = lead.form_data || {};
    var address = fd.address || '';
    var spaceType = fd.space_type || '';
    var spaceSize = fd.space_size || fd.exact_sqft || '';
    var cleaningDays = fd.cleaning_days || fd.coverage_days || '';

    var html = '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8">' +
      '<title>Proposal \u2014 ' + CRM.escapeHtml(company || name) + '</title>' +
      '<style>' +
        'body { font-family: "DM Sans", Arial, sans-serif; color: #1A1E2C; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }' +
        '.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0B1D38; padding-bottom: 1.5rem; margin-bottom: 2rem; }' +
        '.logo { font-size: 1.5rem; font-weight: 700; color: #0B1D38; }' +
        '.logo small { display: block; font-size: .7rem; font-weight: 400; color: #6B7A8D; letter-spacing: .1em; text-transform: uppercase; }' +
        '.meta { text-align: right; font-size: .85rem; color: #6B7A8D; }' +
        'h1 { font-size: 1.8rem; color: #0B1D38; margin: 0 0 .5rem; }' +
        'h2 { font-size: 1.1rem; color: #0B1D38; border-bottom: 1px solid #DFE4EC; padding-bottom: .5rem; margin-top: 2rem; }' +
        '.client-info { background: #FAFBFC; border: 1px solid #EDF0F5; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0; }' +
        '.client-info table { width: 100%; border-collapse: collapse; }' +
        '.client-info td { padding: .35rem .5rem; font-size: .9rem; }' +
        '.client-info td:first-child { font-weight: 600; color: #6B7A8D; width: 140px; }' +
        '.services { margin: 1.5rem 0; }' +
        '.service-item { display: flex; justify-content: space-between; padding: .6rem 0; border-bottom: 1px solid #EDF0F5; }' +
        '.service-item:last-child { border-bottom: none; font-weight: 700; font-size: 1.1rem; border-top: 2px solid #0B1D38; padding-top: .8rem; margin-top: .5rem; }' +
        '.features { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin: 1rem 0; }' +
        '.feature { padding: .5rem .75rem; background: #FAFBFC; border-radius: 6px; font-size: .85rem; }' +
        '.feature::before { content: "\\2713 "; color: #2D7A32; font-weight: 700; }' +
        '.footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #DFE4EC; text-align: center; font-size: .82rem; color: #6B7A8D; }' +
        '.cta { background: #0B1D38; color: white; padding: 1rem 2rem; border-radius: 8px; text-align: center; margin: 2rem 0; font-size: 1rem; }' +
        '.cta a { color: white; }' +
        '@media print { body { padding: 1rem; } }' +
      '</style>' +
      '</head><body>' +
      '<div class="header">' +
        '<div class="logo">Ecco Facilities<small>Cleaning the Future. Today.</small></div>' +
        '<div class="meta">Proposal ' + CRM.escapeHtml(ref) + '<br>' + date + '</div>' +
      '</div>' +
      '<h1>' + CRM.escapeHtml(svcLabel) + ' Services Proposal</h1>' +
      '<p>Prepared for ' + CRM.escapeHtml(name) + (company ? ' at ' + CRM.escapeHtml(company) : '') + '</p>' +
      '<div class="client-info"><table>' +
        (company ? '<tr><td>Company</td><td>' + CRM.escapeHtml(company) + '</td></tr>' : '') +
        (address ? '<tr><td>Location</td><td>' + CRM.escapeHtml(address) + '</td></tr>' : '') +
        (spaceType ? '<tr><td>Space Type</td><td>' + CRM.escapeHtml(spaceType) + '</td></tr>' : '') +
        (spaceSize ? '<tr><td>Space Size</td><td>' + CRM.escapeHtml(spaceSize) + '</td></tr>' : '') +
        (cleaningDays ? '<tr><td>Schedule</td><td>' + CRM.escapeHtml(cleaningDays) + '</td></tr>' : '') +
        '<tr><td>Service</td><td>' + CRM.escapeHtml(svcLabel) + '</td></tr>' +
      '</table></div>' +
      '<h2>What\'s Included</h2>' +
      '<div class="features">' +
        '<div class="feature">100% Eco-Certified Products</div>' +
        '<div class="feature">Dedicated Cleaning Team</div>' +
        '<div class="feature">Quality Assurance Inspections</div>' +
        '<div class="feature">Flexible Scheduling</div>' +
        '<div class="feature">24/7 Emergency Support</div>' +
        '<div class="feature">Monthly Performance Reports</div>' +
        '<div class="feature">Trained & Background-Checked Staff</div>' +
        '<div class="feature">Green Seal Certified</div>' +
      '</div>' +
      '<h2>Investment</h2>' +
      '<div class="services">' +
        '<div class="service-item"><span>' + CRM.escapeHtml(svcLabel) + ' Services</span><span>' + value + '/month</span></div>' +
        '<div class="service-item"><span>Setup & Equipment</span><span>Included</span></div>' +
        '<div class="service-item"><span>Quality Inspections</span><span>Included</span></div>' +
        '<div class="service-item"><span>Estimated Monthly Total</span><span>' + value + '</span></div>' +
      '</div>' +
      '<div class="cta">Ready to get started? Call us at <a href="tel:2125550100">(212) 555-0100</a> or email <a href="mailto:info@eccofacilities.com">info@eccofacilities.com</a></div>' +
      '<h2>Why Ecco Facilities?</h2>' +
      '<p>With 12+ years serving NYC businesses and 200+ satisfied clients, Ecco Facilities delivers premium cleaning services with a commitment to sustainability. Our eco-certified products are safe for your people, your pets, and the planet.</p>' +
      '<div class="footer">' +
        '<strong>Ecco Facilities LLC</strong><br>' +
        'eccofacilities.com &bull; info@eccofacilities.com &bull; (212) 555-0100<br>' +
        'This proposal is valid for 30 days from the date above.' +
      '</div>' +
      '</body></html>';

    var win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(function() { win.print(); }, 500);
  }

  function renderContactCard(lead, name, email, phone, company, tags) {
    var firstName = lead.first_name || '';
    var lastName = lead.last_name || '';
    var nameHtml = '<span class="crm-editable" data-field="first_name">' + CRM.escapeHtml(firstName || '\u2014') + '</span> ' +
      '<span class="crm-editable" data-field="last_name">' + CRM.escapeHtml(lastName || '\u2014') + '</span>';
    var emailHtml = '<span class="crm-editable" data-field="email">' + CRM.escapeHtml(email || '\u2014') + '</span>';
    var phoneHtml = '<span class="crm-editable" data-field="phone">' + CRM.escapeHtml(phone || '\u2014') + '</span>';
    var companyHtml = '<span class="crm-editable" data-field="company">' + CRM.escapeHtml(company || '\u2014') + '</span>';

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

    var actions = '';
    if (phone) actions += '<button class="crm-action-btn" data-action="call" data-phone="' + CRM.escapeHtml(phone) + '">\uD83D\uDCDE Call</button>';
    if (email) {
      actions += '<div class="crm-email-dropdown">' +
        '<button class="crm-action-btn" id="emailTemplateBtn">\u2709\uFE0F Email \u25BE</button>' +
        '<div class="crm-email-menu" id="emailMenu">' +
          '<a href="' + buildMailto('intro', lead, email, company, svcLabel) + '" class="crm-email-option" data-action="email" data-template="intro">Introduction</a>' +
          '<a href="' + buildMailto('followup', lead, email, company, svcLabel) + '" class="crm-email-option" data-action="email" data-template="followup">Follow-up</a>' +
          '<a href="' + buildMailto('proposal', lead, email, company, svcLabel) + '" class="crm-email-option" data-action="email" data-template="proposal">Proposal Sent</a>' +
          '<a href="' + buildMailto('thankyou', lead, email, company, svcLabel) + '" class="crm-email-option" data-action="email" data-template="thankyou">Thank You</a>' +
        '</div>' +
      '</div>';
    }
    actions += '<button class="crm-action-btn" id="generateProposal">\uD83D\uDCC4 Proposal</button>';

    return '<div class="crm-card">' +
      '<div class="crm-card-header">' +
        '<h2 class="crm-card-title">Contact Information</h2>' +
        '<div>' + CRM.serviceBadge(lead.service) + ' ' + CRM.statusBadge(lead.status) + '</div>' +
      '</div>' +
      '<div class="crm-contact-grid">' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Name</div>' +
          '<div class="crm-contact-value">' + nameHtml + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Email</div>' +
          '<div class="crm-contact-value">' + emailHtml + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Phone</div>' +
          '<div class="crm-contact-value">' + phoneHtml + '</div>' +
        '</div>' +
        '<div class="crm-contact-item">' +
          '<div class="crm-contact-label">Company</div>' +
          '<div class="crm-contact-value">' + companyHtml + '</div>' +
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
      renderTagsSection(tags || []) +
    '</div>';
  }

  function renderTagsSection(tags) {
    var pills = '';
    if (tags && tags.length > 0) {
      tags.forEach(function(t) {
        var tagName = typeof t === 'string' ? t : t.tag;
        pills += '<span class="crm-tag" data-tag="' + CRM.escapeHtml(tagName) + '">' +
          CRM.escapeHtml(tagName) +
          ' <button class="crm-tag-remove" data-tag="' + CRM.escapeHtml(tagName) + '" aria-label="Remove tag">&times;</button>' +
        '</span>';
      });
    }

    return '<div class="crm-tags-section">' +
      '<div class="crm-tags-list" id="tagsList">' + pills + '</div>' +
      '<div class="crm-tags-add">' +
        '<input type="text" id="tagInput" class="crm-input crm-tag-input" placeholder="Add tag..." maxlength="30" list="tagSuggestions">' +
        '<datalist id="tagSuggestions"></datalist>' +
        '<button id="addTagBtn" class="crm-btn-sm">Add</button>' +
      '</div>' +
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

  function renderTasksCard(tasks) {
    var tasksList = '';
    if (!tasks || tasks.length === 0) {
      tasksList = '<div class="crm-empty"><div class="crm-empty-subtitle">No tasks yet.</div></div>';
    } else {
      tasks.forEach(function(t) {
        var isOverdue = !t.completed && t.due_date && new Date(t.due_date) < new Date();
        var dueText = t.due_date ? CRM.formatDate(t.due_date) : 'No date';
        var cls = t.completed ? 'crm-task-done' : (isOverdue ? 'crm-task-overdue' : '');
        tasksList += '<div class="crm-task ' + cls + '" data-task-id="' + t.id + '">' +
          '<label class="crm-task-check"><input type="checkbox" ' + (t.completed ? 'checked' : '') + ' data-task-id="' + t.id + '"></label>' +
          '<div class="crm-task-content">' +
            '<div class="crm-task-title">' + CRM.escapeHtml(t.title) + '</div>' +
            '<div class="crm-task-due">' + dueText + '</div>' +
          '</div>' +
          '<button class="crm-btn-icon crm-task-delete" data-task-id="' + t.id + '" aria-label="Delete task">&times;</button>' +
        '</div>';
      });
    }

    return '<div class="crm-card">' +
      '<div class="crm-card-header"><h2 class="crm-card-title">Tasks</h2></div>' +
      '<div class="crm-task-form">' +
        '<input type="text" id="taskTitle" class="crm-input" placeholder="Add a task...">' +
        '<input type="datetime-local" id="taskDue" class="crm-input crm-task-date-input">' +
        '<button id="addTaskBtn" class="crm-btn-sm">Add</button>' +
      '</div>' +
      '<div id="tasksList">' + tasksList + '</div>' +
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

  function bindEvents(allTags) {
    /* Communication action buttons */
    var actionBtns = detailEl.querySelectorAll('[data-action]');
    actionBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var action = btn.dataset.action;
        if (action === 'call') {
          window.location.href = 'tel:' + btn.dataset.phone;
          logCommunication('call', 'Call initiated to ' + btn.dataset.phone);
        } else if (action === 'email') {
          var tpl = btn.dataset.template || 'general';
          logCommunication('email', 'Email (' + tpl + ') sent to ' + (lead.email || ''));
        }
      });
    });

    /* Email template dropdown toggle */
    var emailBtn = detailEl.querySelector('#emailTemplateBtn');
    var emailMenu = detailEl.querySelector('#emailMenu');
    if (emailBtn && emailMenu) {
      emailBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        emailMenu.classList.toggle('open');
      });

      document.addEventListener('click', function(e) {
        if (emailMenu.classList.contains('open') && !emailBtn.contains(e.target) && !emailMenu.contains(e.target)) {
          emailMenu.classList.remove('open');
        }
      });
    }

    /* Proposal PDF generator */
    var proposalBtn = detailEl.querySelector('#generateProposal');
    if (proposalBtn) {
      proposalBtn.addEventListener('click', generateProposal);
    }

    /* Inline editing */
    detailEl.querySelectorAll('.crm-editable').forEach(function(el) {
      el.addEventListener('click', function() {
        if (el.classList.contains('crm-editing')) return;
        var field = el.dataset.field;
        var currentValue = el.textContent.trim();
        if (currentValue === '\u2014') currentValue = '';

        el.classList.add('crm-editing');
        var input = document.createElement('input');
        input.type = field === 'email' ? 'email' : (field === 'phone' ? 'tel' : 'text');
        input.className = 'crm-input crm-inline-input';
        input.value = currentValue;
        el.textContent = '';
        el.appendChild(input);
        input.focus();
        input.select();

        var save = async function() {
          var newValue = input.value.trim();
          el.classList.remove('crm-editing');
          el.textContent = newValue || '\u2014';

          if (newValue !== currentValue) {
            var update = { id: parseInt(leadId) };
            update[field] = newValue;
            await saveField(update);
            /* Update breadcrumb if name changed */
            if (field === 'first_name' || field === 'last_name') {
              lead[field] = newValue;
              var fullName = ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim();
              if (breadcrumbName) breadcrumbName.textContent = fullName || lead.email;
            }
          }
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
          if (e.key === 'Escape') { el.classList.remove('crm-editing'); el.textContent = currentValue || '\u2014'; }
        });
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

    /* Add task */
    var taskTitleInput = document.getElementById('taskTitle');
    var taskDueInput = document.getElementById('taskDue');
    var addTaskBtn = document.getElementById('addTaskBtn');
    var tasksListEl = document.getElementById('tasksList');

    if (addTaskBtn && taskTitleInput) {
      addTaskBtn.addEventListener('click', async function() {
        var title = taskTitleInput.value.trim();
        if (!title) return;

        this.disabled = true;
        this.textContent = 'Saving\u2026';

        try {
          var taskBody = { lead_id: parseInt(leadId), title: title };
          if (taskDueInput && taskDueInput.value) {
            taskBody.due_date = new Date(taskDueInput.value).toISOString();
          }

          var result = await CRM.fetch('/crm-tasks', {
            method: 'POST',
            body: taskBody
          });

          if (result && result.ok) {
            var t = result.data.task;
            var dueText = t.due_date ? CRM.formatDate(t.due_date) : 'No date';
            var taskHtml = '<div class="crm-task" data-task-id="' + t.id + '">' +
              '<label class="crm-task-check"><input type="checkbox" data-task-id="' + t.id + '"></label>' +
              '<div class="crm-task-content">' +
                '<div class="crm-task-title">' + CRM.escapeHtml(t.title) + '</div>' +
                '<div class="crm-task-due">' + dueText + '</div>' +
              '</div>' +
              '<button class="crm-btn-icon crm-task-delete" data-task-id="' + t.id + '" aria-label="Delete task">&times;</button>' +
            '</div>';

            /* Remove empty state if present */
            var emptyEl = tasksListEl.querySelector('.crm-empty');
            if (emptyEl) emptyEl.remove();

            tasksListEl.insertAdjacentHTML('afterbegin', taskHtml);
            taskTitleInput.value = '';
            if (taskDueInput) taskDueInput.value = '';

            /* Rebind task events for new elements */
            bindTaskItemEvents();

            /* Reload activities to show task_created */
            reloadActivities();
          }
        } finally {
          this.disabled = false;
          this.textContent = 'Add';
        }
      });
    }

    /* Bind task item events (checkboxes + delete) */
    bindTaskItemEvents();

    /* Tag autocomplete suggestions */
    var tagSuggestions = document.getElementById('tagSuggestions');
    if (tagSuggestions && allTags && allTags.length > 0) {
      var opts = '';
      allTags.forEach(function(t) { opts += '<option value="' + CRM.escapeHtml(t) + '">'; });
      tagSuggestions.innerHTML = opts;
    }

    /* Add tag */
    var tagInput = document.getElementById('tagInput');
    var addTagBtn = document.getElementById('addTagBtn');

    if (addTagBtn && tagInput) {
      var doAddTag = async function() {
        var tag = tagInput.value.trim().toLowerCase();
        if (!tag) return;

        addTagBtn.disabled = true;
        try {
          var result = await CRM.fetch('/crm-tags', {
            method: 'POST',
            body: { lead_id: parseInt(leadId, 10), tag: tag }
          });

          if (result && result.ok) {
            var tagsList = document.getElementById('tagsList');
            if (tagsList) {
              var pill = '<span class="crm-tag" data-tag="' + CRM.escapeHtml(tag) + '">' +
                CRM.escapeHtml(tag) +
                ' <button class="crm-tag-remove" data-tag="' + CRM.escapeHtml(tag) + '" aria-label="Remove tag">&times;</button>' +
              '</span>';
              tagsList.insertAdjacentHTML('beforeend', pill);
              bindTagRemoveButtons();
            }
            tagInput.value = '';
          }
        } finally {
          addTagBtn.disabled = false;
        }
      };

      addTagBtn.addEventListener('click', doAddTag);
      tagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); doAddTag(); }
      });
    }

    /* Bind remove buttons on existing tags */
    bindTagRemoveButtons();
  }

  function bindTagRemoveButtons() {
    var tagsList = document.getElementById('tagsList');
    if (!tagsList) return;

    tagsList.querySelectorAll('.crm-tag-remove').forEach(function(btn) {
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', async function() {
        var tag = this.dataset.tag;
        var pill = this.closest('.crm-tag');
        if (pill) pill.style.opacity = '0.4';

        try {
          var result = await CRM.fetch('/crm-tags?lead_id=' + leadId + '&tag=' + encodeURIComponent(tag), {
            method: 'DELETE'
          });
          if (result && result.ok && pill) {
            pill.remove();
          } else if (pill) {
            pill.style.opacity = '1';
          }
        } catch (e) {
          if (pill) pill.style.opacity = '1';
        }
      });
    });
  }

  function bindTaskItemEvents() {
    var tasksListEl = document.getElementById('tasksList');
    if (!tasksListEl) return;

    /* Task checkbox toggle */
    tasksListEl.querySelectorAll('.crm-task-check input[type="checkbox"]').forEach(function(cb) {
      /* Remove old listeners by cloning */
      var newCb = cb.cloneNode(true);
      cb.parentNode.replaceChild(newCb, cb);

      newCb.addEventListener('change', async function() {
        var taskId = parseInt(this.dataset.taskId, 10);
        var completed = this.checked;
        var taskEl = this.closest('.crm-task');

        if (completed) {
          taskEl.classList.add('crm-task-done');
          taskEl.classList.remove('crm-task-overdue');
        } else {
          taskEl.classList.remove('crm-task-done');
        }

        await CRM.fetch('/crm-tasks', {
          method: 'PATCH',
          body: { id: taskId, completed: completed }
        });
      });
    });

    /* Task delete buttons */
    tasksListEl.querySelectorAll('.crm-task-delete').forEach(function(btn) {
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', async function() {
        var taskId = parseInt(this.dataset.taskId, 10);
        var taskEl = this.closest('.crm-task');

        taskEl.style.opacity = '0.4';

        var result = await CRM.fetch('/crm-tasks?id=' + taskId, { method: 'DELETE' });
        if (result && result.ok) {
          taskEl.remove();
          /* Show empty state if no tasks left */
          var remaining = document.querySelectorAll('#tasksList .crm-task');
          if (remaining.length === 0) {
            document.getElementById('tasksList').innerHTML = '<div class="crm-empty"><div class="crm-empty-subtitle">No tasks yet.</div></div>';
          }
        } else {
          taskEl.style.opacity = '1';
        }
      });
    });
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
