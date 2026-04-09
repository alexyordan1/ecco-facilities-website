/* crm-core.js — Shared CRM module v1.0 */
const CRM = {
  API_BASE: '/api',
  STORAGE: {
    token: 'crm_access_token',
    refresh: 'crm_refresh_token',
    user: 'crm_user',
    expires: 'crm_token_expires'
  },

  /* ---- Auth helpers ---- */
  getToken() { return localStorage.getItem(this.STORAGE.token); },
  getUser() { try { return JSON.parse(localStorage.getItem(this.STORAGE.user)); } catch { return null; } },

  setSession(data) {
    localStorage.setItem(this.STORAGE.token, data.access_token);
    localStorage.setItem(this.STORAGE.refresh, data.refresh_token);
    localStorage.setItem(this.STORAGE.user, JSON.stringify(data.user));
    localStorage.setItem(this.STORAGE.expires, Date.now() + (data.expires_in * 1000));
  },

  clearSession() {
    Object.values(this.STORAGE).forEach(function(k) { localStorage.removeItem(k); });
  },

  isLoggedIn() { return !!this.getToken(); },

  /* ---- Fetch wrapper with auto-refresh ---- */
  _refreshing: null,

  async fetch(path, options) {
    options = options || {};
    var token = this.getToken();
    if (!token) { this.clearSession(); window.location.href = '/crm/login.html'; return; }

    var headers = Object.assign({ 'Authorization': 'Bearer ' + token }, options.headers || {});
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    var res = await fetch(this.API_BASE + path, Object.assign({}, options, { headers: headers }));

    /* If 401, try refreshing token once */
    if (res.status === 401) {
      var refreshed = await this._tryRefresh();
      if (refreshed) {
        headers['Authorization'] = 'Bearer ' + this.getToken();
        res = await fetch(this.API_BASE + path, Object.assign({}, options, { headers: headers }));
      } else {
        this.clearSession();
        window.location.href = '/crm/login.html';
        return;
      }
    }

    return res.json();
  },

  async _tryRefresh() {
    if (this._refreshing) return this._refreshing;

    var refreshToken = localStorage.getItem(this.STORAGE.refresh);
    if (!refreshToken) return false;

    var self = this;
    this._refreshing = (async function() {
      try {
        var res = await fetch(self.API_BASE + '/crm-auth', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (!res.ok) return false;
        var data = await res.json();
        if (data.ok) { self.setSession(data.data); return true; }
        return false;
      } catch { return false; }
      finally { self._refreshing = null; }
    })();

    return this._refreshing;
  },

  /* ---- Auth guard ---- */
  async requireAuth() {
    if (!this.isLoggedIn()) { window.location.href = '/crm/login.html'; return false; }

    /* Check if token is about to expire (within 5 min) */
    var expires = parseInt(localStorage.getItem(this.STORAGE.expires) || '0');
    if (Date.now() > expires - 300000) {
      var refreshed = await this._tryRefresh();
      if (!refreshed) { this.clearSession(); window.location.href = '/crm/login.html'; return false; }
    }

    return true;
  },

  /* ---- Shell renderer (top navbar) ---- */
  renderShell(activePage) {
    var user = this.getUser();
    var email = user ? this.escapeHtml(user.email) : '';
    var initials = email ? email.charAt(0).toUpperCase() : '?';

    var pages = [
      { id: 'leads', label: 'Leads', href: '/crm/leads.html' },
      { id: 'pipeline', label: 'Pipeline', href: '/crm/pipeline.html' },
      { id: 'dashboard', label: 'Dashboard', href: '/crm/index.html' },
      { id: 'reports', label: 'Reports', href: '/crm/reports.html' }
    ];

    var navLinks = pages.map(function(p) {
      var cls = p.id === activePage ? ' active' : '';
      return '<a href="' + p.href + '" class="crm-navbar-link' + cls + '">' + p.label + '</a>';
    }).join('');

    var settingsActive = activePage === 'settings' ? ' active' : '';

    var shell = document.getElementById('app');
    if (!shell) return;

    var main = shell.querySelector('.crm-main');
    if (!main) return;

    /* Create top navbar */
    var nav = document.createElement('nav');
    nav.className = 'crm-navbar';
    nav.innerHTML =
      '<div class="crm-navbar-inner">' +
        '<a href="/crm/index.html" class="crm-navbar-logo">' +
          '<img src="/images/logo-horizontal.png" alt="Ecco Facilities" onerror="this.outerHTML=\'<span class=\\\'crm-navbar-brand\\\'>Ecco CRM</span>\'">' +
        '</a>' +
        '<div class="crm-navbar-links" id="navLinks">' + navLinks + '</div>' +
        '<div class="crm-navbar-actions">' +
          '<a href="/crm/settings.html" class="crm-navbar-icon' + settingsActive + '" aria-label="Settings">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
          '</a>' +
          '<div class="crm-navbar-user" id="navUser">' +
            '<button class="crm-navbar-user-btn" id="userBtn">' + initials + '</button>' +
            '<div class="crm-navbar-dropdown" id="userDropdown">' +
              '<div class="crm-navbar-dropdown-email">' + email + '</div>' +
              '<a href="/crm/settings.html">Settings</a>' +
              '<button id="navLogoutBtn">Sign Out</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="crm-navbar-toggle" id="navToggle" aria-label="Toggle menu">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>';

    shell.insertBefore(nav, main);

    /* Bind logout */
    var self = this;
    var logoutBtn = nav.querySelector('#navLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', function() { self.logout(); });

    /* User dropdown toggle */
    var userBtn = nav.querySelector('#userBtn');
    var dropdown = nav.querySelector('#userDropdown');
    if (userBtn && dropdown) {
      userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', function() {
        dropdown.classList.remove('open');
      });
    }

    /* Mobile hamburger toggle */
    var toggle = nav.querySelector('#navToggle');
    var links = nav.querySelector('#navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', function() {
        links.classList.toggle('open');
        toggle.classList.toggle('open');
      });
    }
  },

  logout() {
    this.clearSession();
    window.location.href = '/crm/login.html';
  },

  /* ---- URL state helpers ---- */
  getParams() { return Object.fromEntries(new URLSearchParams(window.location.search)); },

  setParams(params) {
    var search = new URLSearchParams();
    Object.entries(params).forEach(function(entry) {
      if (entry[1] !== '' && entry[1] !== null && entry[1] !== undefined) search.set(entry[0], entry[1]);
    });
    var newUrl = window.location.pathname + (search.toString() ? '?' + search : '');
    history.replaceState(null, '', newUrl);
  },

  /* ---- UI helpers ---- */
  showLoading(el) {
    el.innerHTML = '<div class="crm-loading"><div class="crm-spinner"></div></div>';
  },

  showEmpty(el, opts) {
    opts = opts || {};
    el.innerHTML = '<div class="crm-empty">' +
      '<div class="crm-empty-icon">' + (opts.icon || '') + '</div>' +
      '<div class="crm-empty-title">' + this.escapeHtml(opts.title || 'No data') + '</div>' +
      '<div class="crm-empty-subtitle">' + this.escapeHtml(opts.subtitle || '') + '</div>' +
    '</div>';
  },

  showError(el, opts) {
    opts = opts || {};
    el.innerHTML = '<div class="crm-error">' +
      '<div class="crm-error-message">' + this.escapeHtml(opts.message || 'Something went wrong') + '</div>' +
      '<button class="crm-btn-sm crm-btn-secondary" id="retryBtn">Try Again</button>' +
    '</div>';
    if (opts.onRetry) {
      var btn = el.querySelector('#retryBtn');
      if (btn) btn.addEventListener('click', opts.onRetry);
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  formatDate(iso) {
    if (!iso) return '\u2014';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  },

  formatDateTime(iso) {
    if (!iso) return '\u2014';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  },

  formatRelative(iso) {
    if (!iso) return '\u2014';
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    return this.formatDate(iso);
  },

  debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  },

  /* ---- Polling ---- */
  _pollInterval: null,

  startPolling(callback, seconds) {
    this.stopPolling();
    this._pollInterval = setInterval(function() {
      if (!document.hidden) callback();
    }, (seconds || 45) * 1000);
  },

  stopPolling() {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
  },

  /* ---- Badge helpers ---- */
  serviceBadge(service) {
    var cls = service === 'dayporter' ? 'crm-badge-dayporter' : 'crm-badge-janitorial';
    var label = service === 'dayporter' ? 'Day Porter' : 'Janitorial';
    return '<span class="crm-badge ' + cls + '">' + label + '</span>';
  },

  statusBadge(status) {
    var cls = status === 'completed' ? 'crm-badge-completed' : 'crm-badge-partial';
    var label = status === 'completed' ? 'Completed' : 'Partial';
    return '<span class="crm-badge ' + cls + '">' + label + '</span>';
  },

  stageBadge(stage) {
    var slugMap = {
      'new': 'crm-badge-new', 'contacted': 'crm-badge-contacted',
      'site-visit': 'crm-badge-site-visit', 'proposal': 'crm-badge-proposal',
      'negotiation': 'crm-badge-negotiation', 'won': 'crm-badge-won', 'lost': 'crm-badge-lost'
    };
    var nameMap = {
      'new': 'New Lead', 'contacted': 'Contacted', 'site-visit': 'Site Visit',
      'proposal': 'Proposal Sent', 'negotiation': 'Negotiation', 'won': 'Won', 'lost': 'Lost'
    };
    var cls = slugMap[stage] || 'crm-badge-new';
    var label = nameMap[stage] || stage || 'New Lead';
    return '<span class="crm-badge ' + cls + '">' + CRM.escapeHtml(label) + '</span>';
  },

  urgencyBadge(urgency) {
    if (!urgency) return '';
    var lower = urgency.toLowerCase();
    var cls = 'crm-badge-flexible';
    if (lower.indexOf('asap') !== -1 || lower.indexOf('immediate') !== -1) cls = 'crm-badge-asap';
    else if (lower.indexOf('1-2') !== -1 || lower.indexOf('week') !== -1 || lower.indexOf('soon') !== -1) cls = 'crm-badge-soon';
    return '<span class="crm-badge ' + cls + '">' + CRM.escapeHtml(urgency) + '</span>';
  },

  /* Format a form_data key into a readable label */
  formatLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  },

  /* ---- Alert helpers ---- */
  getLeadAlerts(lead) {
    var alerts = [];
    var now = Date.now();
    var created = new Date(lead.created_at).getTime();
    var stage = lead.pipeline_stage || 'new';

    /* Skip closed stages */
    if (stage === 'won' || stage === 'lost') return alerts;

    /* Uncontacted > 24h */
    if (!lead.last_contacted_at && (now - created) > 86400000) {
      alerts.push({ type: 'uncontacted', label: 'No contact', cls: 'crm-alert-warn' });
    }

    /* Stale > 7 days in same stage */
    var daysOld = Math.floor((now - created) / 86400000);
    if (daysOld >= 7) {
      alerts.push({ type: 'stale', label: daysOld + 'd stale', cls: 'crm-alert-danger' });
    }

    return alerts;
  },

  alertBadges(lead) {
    var alerts = this.getLeadAlerts(lead);
    return alerts.map(function(a) {
      return '<span class="crm-badge ' + a.cls + '">' + a.label + '</span>';
    }).join(' ');
  },

  daysInStage(lead) {
    var created = new Date(lead.created_at).getTime();
    var days = Math.floor((Date.now() - created) / 86400000);
    if (days === 0) return 'today';
    return days + 'd';
  }
};
