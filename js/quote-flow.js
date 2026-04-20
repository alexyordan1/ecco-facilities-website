/* ===========================================================================
   Quote Flow v2.0 — Flow-based navigation architecture
   Named steps + per-service flow arrays
   =========================================================================== */
(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     Toast system — replaces alert() with styled notifications
     ----------------------------------------------------------------------- */
  var qfToastEl = null;
  var qfToastTimer = null;
  function qfToast(opts) {
    // opts: { title, message, type: 'success'|'error'|'warn', duration: ms, persist: bool }
    opts = opts || {};
    var type = opts.type || 'success';
    // Fix #48 — error toasts persist until user dismisses (no auto-hide)
    var persist = opts.persist !== undefined ? opts.persist : (type === 'error');
    var duration = opts.duration || 4500;
    if (!qfToastEl) {
      qfToastEl = document.createElement('div');
      qfToastEl.className = 'qf-toast';
      qfToastEl.setAttribute('role', 'alert');
      qfToastEl.setAttribute('aria-live', 'assertive');
      qfToastEl.innerHTML = '<span class="qf-toast-ico" aria-hidden="true"></span><div class="qf-toast-body"></div><button type="button" class="qf-toast-close" aria-label="Dismiss notification">\u2715</button>';
      document.body.appendChild(qfToastEl);
      qfToastEl.querySelector('.qf-toast-close').addEventListener('click', function(){
        qfToastEl.classList.remove('is-visible');
        clearTimeout(qfToastTimer);
      });
    }
    qfToastEl.classList.remove('qf-toast-error','qf-toast-warn');
    if (type === 'error') qfToastEl.classList.add('qf-toast-error');
    else if (type === 'warn') qfToastEl.classList.add('qf-toast-warn');
    var ico = qfToastEl.querySelector('.qf-toast-ico');
    ico.textContent = type === 'error' ? '!' : type === 'warn' ? '!' : '\u2713';
    var body = qfToastEl.querySelector('.qf-toast-body');
    body.innerHTML = '';
    if (opts.title) {
      var t = document.createElement('strong');
      t.textContent = opts.title;
      body.appendChild(t);
    }
    if (opts.message) {
      var m = document.createElement('span');
      m.textContent = opts.message;
      body.appendChild(m);
    }
    qfToastEl.classList.add('is-visible');
    clearTimeout(qfToastTimer);
    if (!persist) {
      qfToastTimer = setTimeout(function(){
        qfToastEl.classList.remove('is-visible');
      }, duration);
    }
  }

  /* -----------------------------------------------------------------------
     Flow definitions — per-service step sequences
     ----------------------------------------------------------------------- */
  var FLOWS = {
    janitorial: ['welcome', 'info', 'space', 'location', 'size', 'days', 'checkpoint', 'contact', 'success'],
    dayporter:  ['welcome', 'info', 'space', 'location', 'days', 'porter', 'hours', 'checkpoint', 'contact', 'success'],
    both:       ['welcome', 'info', 'space', 'location', 'size', 'days', 'porter', 'hours', 'checkpoint', 'contact', 'success'],
    unsure:     ['welcome', 'info', 'space', 'location', 'size', 'days', 'checkpoint', 'contact', 'success']
  };

  /* -----------------------------------------------------------------------
     Rail configs — station labels per service
     ----------------------------------------------------------------------- */
  // Rail station `key` must match a flow step name (used to locate current station).
  // Flow steps that don't have a station (welcome, checkpoint, success) pass through the rail.
  var RAIL_CONFIGS = {
    janitorial: [
      { key: 'welcome',  label: 'Service' },
      { key: 'info',     label: 'You' },
      { key: 'space',    label: 'Space' },
      { key: 'location', label: 'Location' },
      { key: 'size',     label: 'Size' },
      { key: 'days',     label: 'Schedule' },
      { key: 'contact',  label: 'Review' }
    ],
    dayporter: [
      { key: 'welcome',  label: 'Service' },
      { key: 'info',     label: 'You' },
      { key: 'space',    label: 'Space' },
      { key: 'location', label: 'Location' },
      { key: 'days',     label: 'Schedule' },
      { key: 'porter',   label: 'Porter' },
      { key: 'hours',    label: 'Hours' },
      { key: 'contact',  label: 'Review' }
    ],
    both: [
      { key: 'welcome',  label: 'Service' },
      { key: 'info',     label: 'You' },
      { key: 'space',    label: 'Space' },
      { key: 'location', label: 'Location' },
      { key: 'size',     label: 'Size' },
      { key: 'days',     label: 'Schedule' },
      { key: 'porter',   label: 'Porter' },
      { key: 'hours',    label: 'Hours' },
      { key: 'contact',  label: 'Review' }
    ],
    unsure: [
      { key: 'welcome',  label: 'Service' },
      { key: 'info',     label: 'You' },
      { key: 'space',    label: 'Space' },
      { key: 'location', label: 'Location' },
      { key: 'size',     label: 'Size' },
      { key: 'days',     label: 'Schedule' },
      { key: 'contact',  label: 'Review' }
    ]
  };

  /* -----------------------------------------------------------------------
     Screen elements — map name → DOM node
     ----------------------------------------------------------------------- */
  var SCREEN_NAMES = ['welcome', 'info', 'space', 'location', 'size', 'days', 'checkpoint', 'window', 'porter', 'hours', 'contact', 'success'];
  var SCREENS = {};

  SCREEN_NAMES.forEach(function (name) {
    SCREENS[name] = document.getElementById('qfScreen_' + name);
  });

  // Bail if the welcome screen is missing
  if (!SCREENS.welcome) return;

  /* -----------------------------------------------------------------------
     Shared DOM refs
     ----------------------------------------------------------------------- */
  var flowBar      = document.getElementById('qfFlowBar');
  var flowBackBtn  = document.getElementById('qfFlowBackBtn');
  var railStations = document.querySelector('.qf-rail-stations');
  var railFill     = document.getElementById('qfRailFill');
  var greetingEl   = document.getElementById('qfGreeting');
  var typingDots   = document.getElementById('qfTypingDots');
  var liveNumEl    = document.getElementById('qfLiveNum');
  var askAlinaBtn  = document.getElementById('qfAskAlinaBtn');
  var exitOverlay  = document.getElementById('qfExitOverlay');
  var exitClose    = document.getElementById('qfExitClose');
  var exitForm     = document.getElementById('qfExitForm');

  /* -----------------------------------------------------------------------
     STATE
     ----------------------------------------------------------------------- */
  var STATE = {
    service:        null,
    space:          null,
    size:           null,
    days:           [],
    porterCount:    null,
    timeStart:      null,
    timeEnd:        null,
    cleaningWindow: null,
    currentStepName: 'welcome',
    userName:       '',
    userLastName:   '',
    userEmail:      '',
    companyName:    '',
    userAddress:    '',
    userPhone:      '',
    specialInstructions: ''
  };

  /* -----------------------------------------------------------------------
     Rail progress indicator — "Step X of Y · ~N min left".
     Replaces the pricing estimate per user preference (no dollar amounts shown).
     ----------------------------------------------------------------------- */
  function qfRenderRailProgress() {
    var wrap  = document.getElementById('qfRailProgressWrap');
    var stepEl = document.getElementById('qfRailProgressStep');
    var timeEl = document.getElementById('qfRailProgressTime');
    if (!wrap || !stepEl) return;
    var flow = getFlow();
    var currentIdx = flow.indexOf(STATE.currentStepName);
    if (currentIdx < 0) return;
    // Count only user-interactive steps (skip checkpoint which auto-advances, and success).
    var totalSteps = flow.filter(function (n) { return n !== 'checkpoint' && n !== 'success'; }).length;
    var doneSteps = flow.slice(0, currentIdx + 1).filter(function (n) { return n !== 'checkpoint' && n !== 'success'; }).length;
    // Clamp to avoid "Step 0 of N" at welcome.
    var displayStep = Math.max(1, Math.min(doneSteps, totalSteps));
    stepEl.textContent = 'Step ' + displayStep + ' of ' + totalSteps;
    if (timeEl) {
      var remaining = Math.max(0, totalSteps - doneSteps);
      // ~18s/step is our empirical median; round up to the next minute, clamp to [1, 3].
      var mins = Math.max(1, Math.min(3, Math.ceil((remaining * 18) / 60)));
      if (remaining <= 0) {
        timeEl.textContent = 'Almost done';
      } else {
        timeEl.textContent = '~' + mins + ' min left';
      }
    }
    wrap.setAttribute('data-state', currentIdx >= flow.length - 2 ? 'final' : 'active');

    // D1 · sync linear fill bar (desktop) + compact pill (mobile)
    var pct = totalSteps > 1 ? Math.round(((displayStep - 1) / (totalSteps - 1)) * 100) : 0;
    var fillBar = document.getElementById('qfRailFillBar');
    if (fillBar) {
      fillBar.style.setProperty('--qf-progress', pct + '%');
      fillBar.setAttribute('aria-valuenow', String(pct));
    }
    var pillBar = document.getElementById('qfRailPillBar');
    var pillLabel = document.getElementById('qfRailPillLabel');
    if (pillBar) {
      pillBar.style.setProperty('--qf-progress', pct + '%');
      // Scale (0..1) for the transform:scaleX fill animation on mobile.
      pillBar.style.setProperty('--qf-progress-scale', (pct / 100).toFixed(3));
      pillBar.setAttribute('aria-valuenow', String(pct));
    }
    if (pillLabel) pillLabel.textContent = 'Step ' + displayStep + ' of ' + totalSteps;
  }

  /* -----------------------------------------------------------------------
     Haptic feedback (Sprint 2) — subtle tactile cues on supported mobile devices.
     Gated by: Vibration API availability, hover:none (touch-first), not reduce-motion.
     ----------------------------------------------------------------------- */
  var QF_HAPTIC = { select: [8], error: [4, 30, 4], success: [15] };
  var qfReducedMotion = (function(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(_){ return false; } })();
  var qfTouchFirst = (function(){ try { return matchMedia('(hover: none)').matches; } catch(_){ return false; } })();
  function qfHaptic(pattern) {
    if (!('vibrate' in navigator)) return;
    if (qfReducedMotion || !qfTouchFirst) return;
    try { navigator.vibrate(pattern); } catch(_) {}
  }
  // Delegated: selection cards fire a soft pulse on tap.
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var card = e.target.closest('.qf-service-card, .qf-day-card, .qf-s4-preset, .qf-preset-btn, .qf-rev-btn, .qf-info-continue, .qf-s5-continue, .qf-checkpoint-skip');
    if (card) qfHaptic(QF_HAPTIC.select);
  }, { capture: true, passive: true });

  // Persistent "chosen" mark — single-select cards get a sage check badge the
  // user can see even after scrolling back to a done step. Clears sibling
  // cards in the same group so only one shows the check at a time.
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var card = e.target.closest('.qf-service-card');
    if (!card) return;
    // Skip multi-select day cards — they use aria-pressed, not is-chosen.
    if (card.classList.contains('qf-day-card')) return;
    var parent = card.parentElement;
    if (parent) {
      parent.querySelectorAll('.qf-service-card').forEach(function (c) {
        if (c !== card) c.classList.remove('is-chosen');
      });
    }
    card.classList.add('is-chosen');
  }, { capture: true });
  // Sprint 4 — magnetic hover on service cards (desktop only).
  (function setupMagnetic() {
    if (qfReducedMotion) return;
    try { if (!matchMedia('(hover: hover)').matches) return; } catch(_) { return; }
    var active = null;
    var raf = 0;
    var pending = null;
    function update() {
      raf = 0;
      if (!active || !pending) return;
      var r = active.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var dx = (pending.x - cx) / r.width;
      var dy = (pending.y - cy) / r.height;
      var tx = Math.max(-14, Math.min(14, dx * 22));
      var ty = Math.max(-10, Math.min(10, dy * 16));
      // Preserve existing scale from card state via CSS variables
      active.style.setProperty('--qf-mag-x', tx.toFixed(2) + 'px');
      active.style.setProperty('--qf-mag-y', ty.toFixed(2) + 'px');
    }
    function onMove(e) {
      if (!active) return;
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(update);
    }
    function onEnter(e) {
      var card = e.target.closest('.qf-service-card');
      if (!card) return;
      active = card;
      card.classList.add('qf-is-magnetic');
    }
    function onLeave(e) {
      var card = e.target.closest('.qf-service-card');
      if (!card) return;
      card.classList.remove('qf-is-magnetic');
      card.style.removeProperty('--qf-mag-x');
      card.style.removeProperty('--qf-mag-y');
      if (active === card) active = null;
    }
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    document.addEventListener('mousemove', onMove, { passive: true });
  })();

  // Error vibration when any field gets marked invalid.
  try {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
        var wasInvalid = m.oldValue && m.oldValue.indexOf('qf-input-invalid') !== -1;
        var isInvalid  = m.target.classList && m.target.classList.contains('qf-input-invalid');
        if (!wasInvalid && isInvalid) { qfHaptic(QF_HAPTIC.error); return; }
      }
    }).observe(document.body || document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
  } catch (_) {}

  /* -----------------------------------------------------------------------
     Draft persistence — survive refresh + resume next session
     Keys only restore if <7 days old, to avoid stale leads
     ----------------------------------------------------------------------- */
  var DRAFT_KEY = 'ecco_quote_draft_v1';
  var DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  function saveDraft() {
    try {
      // Never save submitted / success state
      if (STATE.currentStepName === 'success') return;
      var snap = { s: STATE, t: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
    } catch (_) { /* localStorage unavailable — quota/private mode */ }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
  }
  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.s) return null;
      if (parsed.t && (Date.now() - parsed.t) > DRAFT_MAX_AGE_MS) {
        clearDraft();
        return null;
      }
      return parsed.s;
    } catch (_) { return null; }
  }

  /* -----------------------------------------------------------------------
     Alina copy — contextual messages per screen
     ----------------------------------------------------------------------- */
  var ALINA_MESSAGES = {
    janitorial: 'Perfect choice. Now let\u2019s find the right plan for your space.',
    dayporter:  'Great pick. Let\u2019s match you with the right setup.',
    both:       'Smart move \u2014 full 24/7 coverage. Let\u2019s get to know your space.',
    unsure:     'No worries, I\u2019ll help you figure it out. Let\u2019s start here.'
  };

  // Alina copy indexed by SPACE (not service) — every space shares the same
  // Janitorial/Day Porter mechanics so the space is the real source of truth
  // for what the user cares about.
  var ALINA_S3 = {
    Office:     'Most offices like yours are between 3K\u20139K sq ft. Pick the closest range.',
    Medical:    'Clinics typically range 1,500\u20135,000 sq ft. Labs and surgical centers can run bigger.',
    Retail:     'Most NYC retail spaces are under 6,000 sq ft. Pick your range.',
    Restaurant: 'Restaurants are usually 2K\u20135K sq ft. Kitchen counts toward the total.',
    Fitness:    'Gyms range widely \u2014 boutiques under 3K, full facilities 10K+. Pick the closest.',
    Other:      'Pick the closest range or enter the exact number below.'
  };

  var ALINA_S4_BY_SPACE = {
    Office:     'For offices, Monday\u2013Friday is most common. Weekends only if you need them.',
    Medical:    'Medical spaces usually match patient-facing days. Pick what fits your schedule.',
    Retail:     'Retail often needs full 7-day coverage \u2014 weekends matter most.',
    Restaurant: 'Restaurants usually need 6\u20137 days. After-hours is the key window.',
    Fitness:    'Gyms and studios often need daily coverage during open hours.',
    Other:      'Pick the days that match your schedule.'
  };

  var ALINA_PORTER_BY_SPACE = {
    Office:     'For an office like yours, 1 porter usually covers it. But you decide!',
    Medical:    'Medical spaces need tight sanitization \u2014 1 dedicated porter works for clinics, 2+ for larger facilities.',
    Retail:     'For retail, 1 porter handles front-of-house freshness. Multi-floor stores usually go with 2.',
    Restaurant: 'Restaurants often need 1\u20132 porters during service \u2014 one front, one back.',
    Fitness:    'Gyms benefit from porters on equipment and locker rooms. 1\u20132 usually works.',
    Other:      'Pick what fits your space \u2014 we\u2019ll fine-tune on the call.'
  };

  var ALINA_HOURS_BY_SPACE = {
    Office:     'Set the hours for each porter. Most offices go 8 AM to 5 PM.',
    Medical:    'Set the hours to match your patient-facing windows \u2014 usually 8 AM to 6 PM.',
    Retail:     'Set the hours to match your store hours \u2014 usually 10 AM to 9 PM.',
    Restaurant: 'Set the hours \u2014 restaurants typically need 11 AM to close.',
    Fitness:    'Set the hours \u2014 gyms usually open 5 AM to 10 PM.',
    Other:      'Set the hours that match your operation.'
  };

  var ALINA_WINDOW = {
    janitorial: 'Last scheduling detail \u2014 when works best for our team?',
    both:       'When should the janitorial team come in?'
  };


  var S4_TITLES = {
    janitorial: 'Which <em>days</em> should we clean?',
    dayporter:  'Which <em>days</em> do you need your porter?',
    both:       'Which <em>days</em> do you need coverage?',
    unsure:     'Which <em>days</em> do you need service?'
  };

  var SIZE_LABELS = {
    'under3k': 'Under 3,000 sq ft',
    '3k-6k':   '3,000\u20136,000 sq ft',
    '6k-9k':   '6,000\u20139,000 sq ft',
    '9k-12k':  '9,000\u201312,000 sq ft',
    '12k-15k': '12,000\u201315,000 sq ft',
    'notsure': 'In-person visit'
  };
  // Format a custom sq ft entry (e.g. "5000sqft" or "5000") → "5,000 sq ft"
  function formatSizeLabel(raw) {
    if (!raw) return '';
    if (SIZE_LABELS[raw]) return SIZE_LABELS[raw];
    var n = parseInt(String(raw).replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > 0) return n.toLocaleString('en-US') + ' sq ft';
    return String(raw);
  }

  var SERVICE_LABELS = {
    janitorial: 'Janitorial',
    dayporter:  'Day Porter',
    both:       'Both Services',
    unsure:     'Help me decide'
  };

  /* -----------------------------------------------------------------------
     Feature #1 + #14: Time-based greeting + random variation
     ----------------------------------------------------------------------- */
  // Always deterministic time-of-day greeting — avoids jarring random switches
  // on refresh while still feeling contextual.
  var hour = new Date().getHours();
  var timeGreeting = (hour >= 5 && hour < 12) ? 'Good morning'
                   : (hour >= 12 && hour < 18) ? 'Good afternoon'
                   : 'Good evening';

  if (greetingEl) {
    greetingEl.innerHTML = timeGreeting + ', I\u2019m <em>Alina</em> <span class="qf-wave" aria-hidden="true">\uD83D\uDC4B</span>';
  }

  /* -----------------------------------------------------------------------
     Feature #7: Typing indicator — 500ms dots then reveal
     ----------------------------------------------------------------------- */
  if (SCREENS.welcome && SCREENS.welcome.classList.contains('is-typing')) {
    setTimeout(function () {
      if (typingDots) typingDots.classList.add('is-hidden');
      SCREENS.welcome.classList.remove('is-typing');
    }, 500);
  }

  /* -----------------------------------------------------------------------
     Feature #2: Live counter — random 5-12, changes every 25-40s
     ----------------------------------------------------------------------- */
  function updateLiveCounter() {
    if (!liveNumEl) return;
    liveNumEl.textContent = String(5 + Math.floor(Math.random() * 8));
  }
  function scheduleLiveCounter() {
    var delay = 25000 + Math.random() * 15000;
    setTimeout(function () { updateLiveCounter(); scheduleLiveCounter(); }, delay);
  }
  scheduleLiveCounter();

  /* =======================================================================
     HELPERS
     ======================================================================= */

  /** Get current flow array for selected service, fallback to unsure */
  function getFlow() {
    return FLOWS[STATE.service] || FLOWS.unsure;
  }

  /** Get index of a named step in the current flow, -1 if not found */
  function getStepIndex(name) {
    var flow = getFlow();
    for (var i = 0; i < flow.length; i++) {
      if (flow[i] === name) return i;
    }
    return -1;
  }

  /** Swap Alina bubble text with fade */
  function swapAlinaText(el, newText) {
    if (!el || el.textContent === newText) return;
    el.classList.add('is-swapping');
    setTimeout(function () {
      el.textContent = newText;
      el.classList.remove('is-swapping');
    }, 220);
  }

  /** Get the Alina text element for a given screen */
  function getAlinaTextEl(screenName) {
    var screen = SCREENS[screenName];
    if (!screen) return null;
    return screen.querySelector('.qf-alina-says-text');
  }

  /* -----------------------------------------------------------------------
     Rail — dynamic rebuild + updates
     ----------------------------------------------------------------------- */

  /** Build rail HTML for the given service */
  function buildRail(service) {
    if (!railStations) return;
    var config = RAIL_CONFIGS[service] || RAIL_CONFIGS.unsure;
    var html = '';
    config.forEach(function (station, i) {
      // The first station ('welcome'/service) is already done once a service is picked
      var cls = i === 0 ? ' is-done' : (i === 1 ? ' is-current' : '');
      var val = i === 0 ? (SERVICE_LABELS[service] || 'Service') : (i === 1 ? 'Choose now' : '\u2014');
      var pendingCls = i > 0 ? ' qf-rail-value-pending' : '';
      html += '<li class="qf-rail-station' + cls + '" data-key="' + station.key + '">'
            + '<span class="qf-rail-dot" aria-hidden="true"></span>'
            + '<span class="qf-rail-label">' + station.label + '</span>'
            + '<span class="qf-rail-value' + pendingCls + '">' + val + '</span>'
            + '</li>';
    });
    railStations.innerHTML = html;
  }

  /** Update progress ring on Alina avatars — shows % of flow completed */
  function updateProgressRing(currentName) {
    var flow = getFlow();
    var currentIdx = flow.indexOf(currentName);
    if (currentIdx < 0) return;
    // Percentage: 0 on welcome, 100 on success
    var pct = flow.length > 1 ? Math.round((currentIdx / (flow.length - 1)) * 100) : 0;
    document.documentElement.style.setProperty('--qf-progress', pct + '%');
  }

  /** Animate greeting letter-by-letter (only once on load).
   *  A11y: the full greeting is set as aria-label so screen readers read
   *  "Welcome, I'm Alina" as one phrase. Each character span is hidden
   *  from assistive tech via aria-hidden. */
  function animateGreeting() {
    if (!greetingEl || greetingEl.dataset.animated === '1') return;
    // Preserve the plain-text version for screen readers before splitting
    var plain = greetingEl.textContent.replace(/\s+/g, ' ').trim();
    greetingEl.setAttribute('aria-label', plain);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    greetingEl.dataset.animated = '1';

    var delay = 0;
    var PER_CHAR = 35;

    function wrapChars(text, parent) {
      // Use Array.from to correctly split Unicode (emojis etc.)
      var chars = Array.from(text);
      chars.forEach(function (ch) {
        var span = document.createElement('span');
        span.className = 'qf-char';
        span.setAttribute('aria-hidden', 'true');
        if (ch === ' ') {
          span.innerHTML = '&nbsp;';
        } else {
          span.textContent = ch;
        }
        span.style.animationDelay = delay + 'ms';
        delay += PER_CHAR;
        parent.appendChild(span);
      });
    }

    function processNode(node, parent) {
      var kids = Array.from(node.childNodes);
      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          // Text node — wrap each char
          wrapChars(child.textContent, parent);
        } else if (child.nodeType === 1) {
          // Element — clone shallow, recurse into it
          var clone = child.cloneNode(false);
          if (clone.tagName) clone.setAttribute('aria-hidden', 'true');
          processNode(child, clone);
          parent.appendChild(clone);
        }
      });
    }

    var frag = document.createDocumentFragment();
    processNode(greetingEl, frag);
    greetingEl.innerHTML = '';
    greetingEl.appendChild(frag);
  }

  /** Update rail fill + station states for the current step.
   *  Station `key` must match a flow step name. Flow steps that aren't stations
   *  (e.g. checkpoint, success) are treated as being "after" the previous
   *  station — so past stations stay done and no station becomes `current`. */
  function updateRail() {
    if (!railStations) return;
    var flow = getFlow();
    var config = RAIL_CONFIGS[STATE.service] || RAIL_CONFIGS.unsure;
    var stations = railStations.querySelectorAll('.qf-rail-station');
    if (!stations.length) return;

    var currentStep = STATE.currentStepName;
    // Find rail index that matches current step
    var currentStationIdx = -1;
    for (var i = 0; i < config.length; i++) {
      if (config[i].key === currentStep) { currentStationIdx = i; break; }
    }

    // If current step isn't a station (checkpoint/success), count how many rail
    // stations lie before the current flow index — those are all "done".
    var lastDoneIdx = -1;
    if (currentStationIdx < 0) {
      var currentFlowIdx = flow.indexOf(currentStep);
      for (var j = 0; j < config.length; j++) {
        var stationFlowIdx = flow.indexOf(config[j].key);
        if (stationFlowIdx >= 0 && stationFlowIdx < currentFlowIdx) lastDoneIdx = j;
      }
    }

    stations.forEach(function (st, idx) {
      st.classList.remove('is-done', 'is-current');
      // AYS Ola 3 #15 — aria-current="step" announces progress position to
      // screen readers. Was missing entirely; only the visual .is-current
      // class existed. Removing stale aria-current on all, then re-adding
      // on the active station.
      st.removeAttribute('aria-current');
      if (currentStationIdx >= 0) {
        if (idx < currentStationIdx) st.classList.add('is-done');
        else if (idx === currentStationIdx) {
          st.classList.add('is-current');
          st.setAttribute('aria-current', 'step');
        }
      } else {
        // currentStep is a pass-through (checkpoint/success)
        if (idx <= lastDoneIdx) st.classList.add('is-done');
      }
    });

    // Fill percentage — use the station we've reached so far
    if (railFill) {
      var reachedIdx = currentStationIdx >= 0 ? currentStationIdx : Math.max(0, lastDoneIdx);
      var pct = config.length > 1 ? (reachedIdx / (config.length - 1)) * 100 : 0;
      // At the final 'contact' station, the rail is still "reviewing" — mark 100% only on success
      if (currentStep === 'success') pct = 100;
      railFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }

    // Refresh the rail progress indicator alongside station updates.
    qfRenderRailProgress();
  }

  /** Set the value text on a rail station by key */
  function setRailValue(key, value) {
    if (!railStations) return;
    var station = railStations.querySelector('[data-key="' + key + '"]');
    if (!station) return;
    var valEl = station.querySelector('.qf-rail-value');
    if (valEl) {
      valEl.textContent = value;
      valEl.classList.remove('qf-rail-value-pending');
    }
  }

  /* -----------------------------------------------------------------------
     syncFlowBar — show/hide flow bar (hidden on welcome)
     ----------------------------------------------------------------------- */
  // Hide site nav, show flow bar on ALL steps (including welcome)
  var siteNav = document.getElementById('nav');
  if (siteNav) siteNav.style.display = 'none';

  // Force scroll-behavior auto permanently (CSS smooth fights programmatic scroll)
  document.documentElement.style.scrollBehavior = 'auto';

  function syncFlowBar(name) {
    if (!flowBar) return;
    flowBar.hidden = false;
    // Toggle helper classes on the main so CSS can hide the rail + ask-alina
    // until the user has picked a service, plus a standalone "final" mode
    // for the contact/summary screen (no cascade).
    var root = document.querySelector('main.q-flow');
    if (root) {
      var wasFinal = root.classList.contains('is-step-final');
      root.classList.toggle('is-step-welcome', name === 'welcome');
      root.classList.toggle('is-past-welcome', name !== 'welcome');
      var isFinal = (name === 'contact' || name === 'success');
      root.classList.toggle('is-step-final', isFinal);
      // When we first enter the final mode, past screens collapse to
      // `display:none` and the page height shrinks — but scrollY is stale.
      // Snap the viewport to the top so the plan card is fully visible.
      if (isFinal && !wasFinal) {
        setTimeout(function () { window.scrollTo({ top: 0, behavior: 'auto' }); }, 0);
      }
    }
  }

  /* =======================================================================
     SCREEN NAVIGATION
     ======================================================================= */

  // Dynamic reveal navigation — screens born on demand, scroll to Alina message
  function goToScreen(name, direction) {
    var to = SCREENS[name];
    if (!to) return;
    // Sprint 3 — direction-aware transitions. Default 'fwd'.
    var dir = direction === 'back' ? 'back' : 'fwd';
    to.classList.remove('qf-screen--entering-fwd', 'qf-screen--entering-back');
    to.classList.add('qf-screen--entering-' + dir);
    // Cleanup the class after the enter animation settles so it doesn't block re-entries.
    setTimeout(function () {
      to.classList.remove('qf-screen--entering-fwd', 'qf-screen--entering-back');
    }, 800);

    // Mark ALL previous screens as done + make them `inert` so the tab order,
    // form autofill, and screen readers ignore them (Fix #10). Keyboard users
    // no longer get trapped in stale inputs, and scrolling back becomes purely
    // visual/historical.
    Object.keys(SCREENS).forEach(function (key) {
      if (SCREENS[key] && !SCREENS[key].hidden && SCREENS[key] !== to) {
        SCREENS[key].classList.remove('is-active');
        SCREENS[key].classList.add('is-done');
        SCREENS[key].setAttribute('inert', '');
        SCREENS[key].setAttribute('aria-hidden', 'true');
      }
    });

    // Reveal the screen (remove hidden, allow interaction)
    to.hidden = false;
    to.classList.remove('is-done');
    to.classList.add('is-active');
    to.removeAttribute('inert');
    to.removeAttribute('aria-hidden');
    STATE.currentStepName = name;

    // Sprint 2 — celebratory haptic pulse on success.
    if (name === 'success') qfHaptic(QF_HAPTIC.success);

    // Checkpoint: populate list + auto-advance after 2.5s (skippable)
    if (name === 'checkpoint') {
      var listEl = document.getElementById('qfCheckpointList');
      if (listEl) {
        var parts = [];
        if (STATE.space) parts.push(STATE.space);
        var sizeTxt = formatSizeLabel(STATE.size);
        if (sizeTxt && STATE.service !== 'dayporter') parts.push(sizeTxt);
        var daySummary = STATE.days.length === 7 ? 'every day' : STATE.days.length === 5 ? 'Mon\u2013Fri' : STATE.days.join(', ');
        if (daySummary) parts.push(daySummary);
        if (STATE.cleaningWindow) {
          var winMap = { before_hours: 'before hours', after_hours: 'after hours', flexible: 'flexible timing' };
          parts.push(winMap[STATE.cleaningWindow] || STATE.cleaningWindow);
        }
        if (STATE.porterCount) {
          var porterLbl = STATE.porterCount === 'notsure' ? 'porters TBD' : (STATE.porterCount + ' porter' + (STATE.porterCount !== '1' ? 's' : ''));
          parts.push(porterLbl);
        }
        if (STATE.timeStart && STATE.timeEnd) parts.push(STATE.timeStart + '\u2013' + STATE.timeEnd);
        listEl.textContent = parts.join(' \u00b7 ');
      }
      // Clear any prior handlers
      to.onclick = null;
      var skipBtn = document.getElementById('qfCheckpointSkip');
      if (skipBtn) { skipBtn.onclick = null; skipBtn.hidden = true; }
      // Pure auto-advance — user asked to keep this step hands-off. Duration scales
      // with reading length so a short recap doesn't linger and a long one doesn't rush.
      var listLen = (listEl && listEl.textContent ? listEl.textContent.length : 0);
      var duration = Math.max(2200, Math.min(4200, listLen * 45 + 1400));
      setTimeout(function () { goNext(); }, duration);
    }

    // Set contextual Alina + title when entering days screen (no pre-selection)
    if (name === 'days') {
      var alinaEl = getAlinaTextEl('days');
      if (alinaEl) alinaEl.textContent = ALINA_S4_BY_SPACE[STATE.space] || ALINA_S4_BY_SPACE.Other;
      var s4title = document.getElementById('qfS4Title');
      if (s4title) s4title.innerHTML = S4_TITLES[STATE.service] || S4_TITLES.unsure;
      setTimeout(syncDaysUI, 80);
    }

    // Size step — personalize Alina by space type when entering (covers
    // both forward navigation and scroll-back-into-view cases).
    if (name === 'size' && STATE.space) {
      var sizeAlinaEl = getAlinaTextEl('size');
      if (sizeAlinaEl) sizeAlinaEl.textContent = ALINA_S3[STATE.space] || ALINA_S3.Other;
    }

    // Hours step — personalize by space type every time it's entered.
    if (name === 'hours' && STATE.space) {
      var hoursAlinaEl = getAlinaTextEl('hours');
      if (hoursAlinaEl) hoursAlinaEl.textContent = ALINA_HOURS_BY_SPACE[STATE.space] || ALINA_HOURS_BY_SPACE.Other;
    }

    // Re-trigger stagger animations on new screen
    to.querySelectorAll('.qf-service-card, .qf-screen-inner > *, .qf-meta-chip, .qf-day-card').forEach(function (c) {
      c.style.animation = 'none';
      void c.offsetWidth;
      c.style.animation = '';
    });

    syncFlowBar(name);
    updateRail();
    updateProgressRing(name);

    // Smooth scroll so Alina message slides to the top.
    // AYS Ola 3 #11 — trim the 400ms pre-scroll delay to 120ms (lets the enter
    // animation begin but not drag) and cut the scroll duration to 320ms.
    // Perceived latency drops from ~900ms → ~440ms.
    setTimeout(function () {
      var scrollTarget = to.querySelector('.qf-alina-says') || to;
      var absTop = 0;
      var el = scrollTarget;
      while (el) { absTop += el.offsetTop; el = el.offsetParent; }
      var flowBarH = flowBar && !flowBar.hidden ? flowBar.offsetHeight : 0;
      var targetY = Math.max(0, absTop - flowBarH - 4);
      var html = document.documentElement;
      var prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      var startY = html.scrollTop;
      var diff = targetY - startY;
      if (Math.abs(diff) < 2) { html.style.scrollBehavior = prevBehavior; return; }
      var startTime = null;
      requestAnimationFrame(function step(ts) {
        if (!startTime) startTime = ts;
        var p = Math.min((ts - startTime) / 320, 1);
        var e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
        html.scrollTop = startY + diff * e;
        if (p < 1) requestAnimationFrame(step);
        // keep scrollBehavior as auto (don't restore — CSS smooth fights programmatic scroll)
      });
    }, 120);

    // Re-align the bubble after the previous screens finish their
    // is-done collapse transition. The first scroll calculation above uses
    // offsetTop values captured before the collapse settles, so the Alina
    // bubble often lands ~300-400px below the flow bar (especially on the
    // hours step where buildPorterRows also mutates the DOM mid-transition).
    // This correction pass runs once the layout has settled.
    setTimeout(function () {
      if (STATE.currentStepName !== name) return;
      var bubble = to.querySelector('.qf-alina-says');
      if (!bubble) return;
      var rect = bubble.getBoundingClientRect();
      var flowBarH = flowBar && !flowBar.hidden ? flowBar.offsetHeight : 0;
      var delta = rect.top - flowBarH - 8;
      if (Math.abs(delta) <= 2) return;
      window.scrollBy({ top: delta, behavior: 'smooth' });
    }, 620);
  }

  function goNext() {
    var flow = getFlow();
    var idx = getStepIndex(STATE.currentStepName);
    if (idx < 0 || idx >= flow.length - 1) return;
    goToScreen(flow[idx + 1], 'fwd');
    saveDraft();
  }

  function goBack() {
    var flow = getFlow();
    var idx = getStepIndex(STATE.currentStepName);
    if (idx <= 0) return;
    var prevName = flow[idx - 1];
    var prevScreen = SCREENS[prevName];
    if (prevScreen) {
      // Sprint 3 — back-direction entrance animation.
      prevScreen.classList.remove('qf-screen--entering-fwd', 'qf-screen--entering-back');
      prevScreen.classList.add('qf-screen--entering-back');
      setTimeout(function () { prevScreen.classList.remove('qf-screen--entering-back'); }, 800);
      STATE.currentStepName = prevName;
      syncFlowBar(prevName);
      updateRail();
      var scrollTarget = prevScreen.querySelector('.qf-alina-says') || prevScreen;
      var absTop = 0;
      var el = scrollTarget;
      while (el) { absTop += el.offsetTop; el = el.offsetParent; }
      var flowBarH = flowBar && !flowBar.hidden ? flowBar.offsetHeight : 0;
      var targetY = Math.max(0, absTop - flowBarH - 4);
      var html = document.documentElement;
      var prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      var startY = html.scrollTop;
      var diff = targetY - startY;
      if (Math.abs(diff) < 2) { html.style.scrollBehavior = prevBehavior; return; }
      var startTime = null;
      requestAnimationFrame(function step(ts) {
        if (!startTime) startTime = ts;
        var p = Math.min((ts - startTime) / 500, 1);
        var e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
        html.scrollTop = startY + diff * e;
        if (p < 1) requestAnimationFrame(step);
        // keep scrollBehavior as auto (don't restore — CSS smooth fights programmatic scroll)
      });
    }
  }

  /* =======================================================================
     STEP 1 — WELCOME (Service selection)
     ======================================================================= */
  var supportsHover = window.matchMedia('(hover: hover)').matches;

  if (SCREENS.welcome) {
    SCREENS.welcome.querySelectorAll('.qf-service-card').forEach(function (card) {
      // Main click — select service
      card.addEventListener('click', function () {
        STATE.service = card.getAttribute('data-service');

        // Build dynamic rail for this service
        buildRail(STATE.service);

        goNext();
      });

      // Info tooltip button removed per user request — the (i) icon's native
      // aria-label tooltip (Chrome) was appearing on hover, and the card hint
      // copy already explains what each service is.
    });
  }

  /* =======================================================================
     INFO step — Name + Email + Phone capture (with validation)
     ======================================================================= */
  // AYS Ola 3 #6 — strict email regex. MUST match functions/api/submit-quote.js
  // EMAIL_RE byte-for-byte. Rejects `..user@`, `user..x@`, `user@-domain.com`,
  // and trailing-hyphen domains. Client-first validation matches server so
  // users see errors before a round-trip.
  var EMAIL_RE = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?!-)[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;
  // Common disposable domains — nice-to-have soft block
  var DISPOSABLE_EMAIL_DOMAINS = ['mailinator.com','tempmail.com','10minutemail.com','throwaway.email','guerrillamail.com','yopmail.com','fakeinbox.com','trashmail.com'];
  function isDisposableEmail(e) {
    var m = /@([^@]+)$/.exec((e || '').toLowerCase());
    return m ? DISPOSABLE_EMAIL_DOMAINS.indexOf(m[1]) !== -1 : false;
  }
  // Phone: must have at least 10 digits once stripped of formatting; accepts (, ), -, ., +, space
  var PHONE_ALLOWED_RE = /^[\d\s\-\+\(\)\.x]{10,25}$/i;
  function normalizePhone(v) { return (v || '').replace(/[^\d]/g, ''); }
  function isValidPhone(v) {
    if (!v) return true; // optional
    if (!PHONE_ALLOWED_RE.test(v)) return false;
    var digits = normalizePhone(v);
    return digits.length >= 10 && digits.length <= 15;
  }
  function showInfoError(msg, offendingEl) {
    var errEl = document.getElementById('qfInfoErr');
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    if (offendingEl) {
      offendingEl.classList.add('qf-input-invalid');
      offendingEl.focus();
    }
  }
  function clearInfoError() {
    var errEl = document.getElementById('qfInfoErr');
    if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
    ['qfUserFirstName','qfUserEmail','qfUserPhone'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.classList.remove('qf-input-invalid');
    });
  }
  if (SCREENS.info) {
    var emailField = document.getElementById('qfUserEmail');
    if (emailField) {
      emailField.addEventListener('blur', function () {
        var val = emailField.value.trim();
        if (val && !EMAIL_RE.test(val)) {
          showInfoError('Please enter a valid email address.', emailField);
        } else {
          clearInfoError();
        }
      });
      emailField.addEventListener('input', clearInfoError);
    }
    var infoContinueBtn = document.getElementById('qfInfoContinue');
    if (infoContinueBtn) {
      infoContinueBtn.addEventListener('click', function () {
        var firstName = document.getElementById('qfUserFirstName');
        var lastName = document.getElementById('qfUserLastName');
        var email = document.getElementById('qfUserEmail');
        var phone = document.getElementById('qfUserPhone');

        clearInfoError();

        var fnVal = firstName ? firstName.value.trim() : '';
        var emVal = email ? email.value.trim() : '';

        // Validate first name
        if (!fnVal) {
          showInfoError('Please enter your first name.', firstName);
          return;
        }
        // Validate email
        if (!emVal) {
          showInfoError('Please enter your email address.', email);
          return;
        }
        if (!EMAIL_RE.test(emVal)) {
          showInfoError('Please enter a valid email address.', email);
          return;
        }
        if (isDisposableEmail(emVal)) {
          showInfoError('Please use a non-disposable email so we can deliver your proposal.', email);
          return;
        }
        // Validate phone (optional but must be a real number if provided)
        var phVal = phone ? phone.value.trim() : '';
        if (phVal && !isValidPhone(phVal)) {
          showInfoError('Please enter a valid phone number (10+ digits) or leave it blank.', phone);
          return;
        }

        // Capture values
        STATE.userName = fnVal;
        STATE.userLastName = (lastName && lastName.value.trim()) ? lastName.value.trim() : '';
        STATE.userEmail = emVal;
        STATE.userPhone = phVal;

        // Personalize Alina for next screen
        var alinaEl = getAlinaTextEl('space');
        if (alinaEl) {
          var greeting = STATE.userName ? (STATE.userName + ', ') : '';
          var msg = ALINA_MESSAGES[STATE.service] || ALINA_MESSAGES.janitorial;
          alinaEl.textContent = greeting + msg.charAt(0).toLowerCase() + msg.slice(1);
        }

        setRailValue('info', STATE.userName || 'Done');
        goNext();
      });
    }
  }

  /* =======================================================================
     LOCATION step — Company name + Address
     ======================================================================= */
  if (SCREENS.location) {
    var locationContinueBtn = document.getElementById('qfLocationContinue');
    var locAddr = document.getElementById('qfAddress');
    if (locationContinueBtn) {
      var showLocErr = function (msg, el) {
        // Inline hint under the address row — reuses info error styles
        var err = document.getElementById('qfLocationErr');
        if (!err) {
          err = document.createElement('p');
          err.id = 'qfLocationErr';
          err.className = 'qf-info-err';
          err.setAttribute('role', 'alert');
          err.setAttribute('aria-live', 'polite');
          var parent = locationContinueBtn.parentNode;
          parent.insertBefore(err, locationContinueBtn);
        }
        err.textContent = msg;
        err.hidden = false;
        if (el) { el.classList.add('qf-input-invalid'); el.focus(); }
      };
      var clearLocErr = function () {
        var err = document.getElementById('qfLocationErr');
        if (err) { err.textContent = ''; err.hidden = true; }
        var addr = document.getElementById('qfAddress');
        if (addr) addr.classList.remove('qf-input-invalid');
      };
      var locAddrField = document.getElementById('qfAddress');
      if (locAddrField) locAddrField.addEventListener('input', clearLocErr);

      locationContinueBtn.addEventListener('click', function () {
        var companyInput = document.getElementById('qfCompanyName');
        var addressInput = document.getElementById('qfAddress');
        var addr = addressInput ? addressInput.value.trim() : '';
        // Require meaningful address: at least 5 chars AND at least one digit (street number or ZIP)
        if (!addr) {
          showLocErr('Please enter your address or ZIP code so we can match you with the right local team.', addressInput);
          return;
        }
        if (addr.length < 5 || !/\d/.test(addr)) {
          showLocErr('Include a street number or a 5-digit ZIP (e.g. "10001" or "350 5th Ave").', addressInput);
          return;
        }
        clearLocErr();
        if (companyInput) STATE.companyName = companyInput.value.trim();
        STATE.userAddress = addr;
        setRailValue('location', STATE.userAddress || STATE.companyName || 'Done');
        goNext();
      });
    }
  }

  /* =======================================================================
     STEP 3 — SPACE TYPE
     ======================================================================= */
  if (SCREENS.space) {
    SCREENS.space.querySelectorAll('.qf-service-card').forEach(function (card) {
      card.addEventListener('click', function () {
        STATE.space = card.getAttribute('data-space');

        // Capture email from inline input
        var emailInput = document.getElementById('qfUserEmail');
        if (emailInput && emailInput.value.trim()) {
          STATE.userEmail = emailInput.value.trim();
        }

        setRailValue('space', STATE.space);

        // Set Alina messages for upcoming steps
        var flow = getFlow();
        var nextStep = flow[flow.indexOf('space') + 1];
        if (nextStep === 'size') {
          var alinaEl = getAlinaTextEl('size');
          var s3msg = ALINA_S3[STATE.space] || ALINA_S3.Office;
          if (alinaEl) alinaEl.textContent = s3msg;
        } else if (nextStep === 'days') {
          // Day Porter skips size — set days Alina message
          var alinaEl = getAlinaTextEl('days');
          var s4msg = ALINA_S4_BY_SPACE[STATE.space] || ALINA_S4_BY_SPACE.Other;
          if (alinaEl) alinaEl.textContent = s4msg;
          var s4title = document.getElementById('qfS4Title');
          if (s4title) s4title.innerHTML = S4_TITLES[STATE.service] || S4_TITLES.unsure;
        }
        goNext();
      });
    });
  }

  /* =======================================================================
     STEP 3 — SIZE
     ======================================================================= */
  if (SCREENS.size) {
    function proceedFromSize(sizeVal) {
      STATE.size = sizeVal;

      // Set Alina message for days step
      var alinaEl = getAlinaTextEl('days');
      var s4msg = ALINA_S4_BY_SPACE[STATE.space] || ALINA_S4_BY_SPACE.Other;
      if (alinaEl) alinaEl.textContent = s4msg;

      // Set contextual title
      var s4title = SCREENS.days ? SCREENS.days.querySelector('.qf-s4-title, [id="qfS4Title"]') : null;
      if (s4title) s4title.innerHTML = S4_TITLES[STATE.service] || S4_TITLES.unsure;

      syncDaysUI();

      setRailValue('size', formatSizeLabel(STATE.size));
      goNext();
    }

    // Range cards + Not sure card
    SCREENS.size.querySelectorAll('.qf-service-card').forEach(function (card) {
      card.addEventListener('click', function () {
        proceedFromSize(card.getAttribute('data-size'));
      });
    });

    // Exact input submit — with visible validation for range 100–1,000,000
    var sizeInput = document.getElementById('qfSizeCustom');
    var sizeSubmit = document.getElementById('qfSizeSubmit');
    var sizeErr;
    function showSizeErr(msg) {
      if (!sizeErr) {
        sizeErr = document.createElement('p');
        sizeErr.className = 'qf-info-err';
        sizeErr.setAttribute('role', 'alert');
        sizeErr.style.marginTop = '6px';
        var wrap = sizeInput.parentNode;
        if (wrap) wrap.appendChild(sizeErr);
      }
      sizeErr.textContent = msg;
      sizeErr.hidden = false;
      sizeInput.classList.add('qf-input-invalid');
      sizeInput.focus();
    }
    function clearSizeErr() {
      if (sizeErr) { sizeErr.hidden = true; sizeErr.textContent = ''; }
      sizeInput.classList.remove('qf-input-invalid');
    }
    if (sizeSubmit && sizeInput) {
      sizeSubmit.addEventListener('click', function () {
        var val = sizeInput.value.trim();
        var n = Number(val);
        if (!val || isNaN(n)) { showSizeErr('Please enter a number.'); return; }
        if (n < 100) { showSizeErr('Sizes under 100 sq ft look unusual \u2014 pick a range instead?'); return; }
        if (n > 1000000) { showSizeErr('That\u2019s bigger than most NYC campuses. Try a smaller number?'); return; }
        clearSizeErr();
        proceedFromSize(Math.round(n) + 'sqft');
        sizeInput.style.borderColor = '';
      });
      sizeInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sizeSubmit.click(); }
      });
      sizeInput.addEventListener('input', function () { sizeInput.style.borderColor = ''; clearSizeErr(); });
    }
  }

  /* =======================================================================
     STEP 4 — DAYS (Schedule)
     ======================================================================= */
  var ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  var dayBtns        = SCREENS.days ? SCREENS.days.querySelectorAll('.qf-day-card') : [];
  var presetBtns     = SCREENS.days ? SCREENS.days.querySelectorAll('.qf-s4-preset, .qf-preset-btn') : [];
  var daysCountEl    = document.getElementById('qfDaysCount');
  var daysContinueBtn = document.getElementById('qfDaysContinue');

  function syncDaysUI() {
    dayBtns.forEach(function (btn) {
      var selected = STATE.days.indexOf(btn.getAttribute('data-day')) !== -1;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });

    if (daysCountEl) {
      daysCountEl.textContent = STATE.days.length > 0
        ? STATE.days.length + ' day' + (STATE.days.length > 1 ? 's' : '') + ' selected'
        : '';
    }

    if (daysContinueBtn) daysContinueBtn.disabled = STATE.days.length === 0;

    // Preset highlight
    presetBtns.forEach(function (p) { p.classList.remove('is-active'); });
    if (STATE.days.length === 7) {
      presetBtns.forEach(function (p) { if (p.dataset.preset === 'everyday' || p.dataset.preset === 'every') p.classList.add('is-active'); });
    } else if (arraysEqual(STATE.days, WEEKDAYS)) {
      presetBtns.forEach(function (p) { if (p.dataset.preset === 'weekdays') p.classList.add('is-active'); });
    }

    // Alina reacts only when user manually changes from the default. Don't
    // override the space-tailored entry message just because no days are
    // selected yet — the Continue button handles the "pick at least one"
    // validation on submit.
    var alinaEl = getAlinaTextEl('days');
    if (alinaEl && STATE.currentStepName === 'days') {
      var n = STATE.days.length;
      if (n === 7) {
        alinaEl.textContent = 'Every day? That\u2019s serious coverage \u2014 love it.';
      } else if (n > 0 && !arraysEqual(STATE.days, WEEKDAYS)) {
        alinaEl.textContent = n + ' day' + (n > 1 ? 's' : '') + ' selected. Adjust anytime.';
      }
      // n === 0 or weekdays-match: keep the space-tailored entry message.
    }
  }

  /** Compare two arrays of strings (sorted) for equality */
  function arraysEqual(a, b) {
    var aSorted = a.slice().sort();
    var bSorted = b.slice().sort();
    if (aSorted.length !== bSorted.length) return false;
    for (var i = 0; i < aSorted.length; i++) {
      if (aSorted[i] !== bSorted[i]) return false;
    }
    return true;
  }

  if (SCREENS.days) {
    dayBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var day = btn.getAttribute('data-day');
        var idx = STATE.days.indexOf(day);
        if (idx === -1) { STATE.days.push(day); } else { STATE.days.splice(idx, 1); }
        syncDaysUI();
      });
    });

    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.preset;
        if (p === 'weekdays') STATE.days = WEEKDAYS.slice();
        else if (p === 'everyday' || p === 'every') STATE.days = ALL_DAYS.slice();
        else if (p === 'clear') STATE.days = [];
        syncDaysUI();
      });
    });

    if (daysContinueBtn) {
      daysContinueBtn.addEventListener('click', function () {
        if (STATE.days.length === 0) return;

        var summary = STATE.days.length === 7 ? 'Every day'
          : arraysEqual(STATE.days, WEEKDAYS) ? 'Mon\u2013Fri'
          : STATE.days.length + ' days';
        setRailValue('days', summary);

        // Determine next screen from flow
        goNext();
      });
    }
  }

  /* =======================================================================
     PORTER step — Progressive reveal + smart scheduling
     ======================================================================= */
  if (SCREENS.porter) {
    function timeOptions(defaultVal) {
      var opts = '';
      for (var h = 6; h <= 23; h++) {
        var ampm = h < 12 ? 'AM' : 'PM';
        var hr = h <= 12 ? h : h - 12;
        if (hr === 0) hr = 12;
        opts += '<option value="' + h + '"' + (h === defaultVal ? ' selected' : '') + '>' + hr + ':00 ' + ampm + '</option>';
      }
      return opts;
    }

    function buildPorterRows(count) {
      var rowsEl = document.getElementById('qfPorterRows');
      if (!rowsEl) return;
      var html = '';
      for (var i = 1; i <= count; i++) {
        html += '<div class="qf-porter-row">' +
                '<span class="qf-porter-row-label">Porter ' + i + '</span>' +
                '<div class="qf-porter-row-times">' +
                '<div class="qf-porter-row-field">' +
                '<span class="qf-porter-row-sub">Start time</span>' +
                '<select class="qf-s5-time-select" data-porter="' + i + '" data-time="start" aria-label="Porter ' + i + ' start time">' + timeOptions(8) + '</select>' +
                '</div>' +
                '<span class="qf-porter-row-sep">to</span>' +
                '<div class="qf-porter-row-field">' +
                '<span class="qf-porter-row-sub">End time</span>' +
                '<select class="qf-s5-time-select" data-porter="' + i + '" data-time="end" aria-label="Porter ' + i + ' end time">' + timeOptions(17) + '</select>' +
                '</div>' +
                '</div></div>';
      }
      rowsEl.innerHTML = html;
      // Pre-populate STATE with defaults so if the user doesn't change the selects,
      // the time still gets captured ("08:00" / "17:00"). Previously STATE stayed null
      // until the user triggered a change event, showing "(not set)" in the summary.
      if (!STATE.timeStart) STATE.timeStart = '08:00';
      if (!STATE.timeEnd)   STATE.timeEnd   = '17:00';
    }

    function advanceFromPorter(porterVal) {
      STATE.porterCount = porterVal;
      var count = STATE.porterCount === 'notsure' ? 1 : parseInt(STATE.porterCount) || 1;
      buildPorterRows(count);

      // Combine space-tailored context with porter-count specifics.
      var hoursAlina = document.getElementById('qfAlinaSaysHours');
      if (hoursAlina) {
        var spaceHint = ALINA_HOURS_BY_SPACE[STATE.space] || ALINA_HOURS_BY_SPACE.Other;
        hoursAlina.textContent = count === 1
          ? spaceHint
          : 'Set the hours for each of your ' + count + ' porters. ' + spaceHint;
      }

      var label = STATE.porterCount === 'notsure' ? 'TBD' : STATE.porterCount + ' porter' + (STATE.porterCount !== '1' ? 's' : '');
      setRailValue('porter', label);
      goNext();
    }

    // When the porter screen becomes active, personalize Alina's line by space type
    var porterEnterObs = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target === SCREENS.porter && SCREENS.porter.classList.contains('is-active')) {
          var alina = document.getElementById('qfAlinaSaysPorter');
          if (!alina) return;
          alina.textContent = ALINA_PORTER_BY_SPACE[STATE.space] || ALINA_PORTER_BY_SPACE.Other;
        }
      });
    });
    porterEnterObs.observe(SCREENS.porter, { attributes: true, attributeFilter: ['class'] });

    // Quick-pick cards — auto-advance
    SCREENS.porter.querySelectorAll('.qf-service-card[data-porters]').forEach(function (card) {
      card.addEventListener('click', function () {
        advanceFromPorter(card.getAttribute('data-porters'));
      });
    });

    // Custom count submit
    var porterCustomSubmit = document.getElementById('qfPorterCustomSubmit');
    var porterCustomInput = document.getElementById('qfPorterCustomCount');
    if (porterCustomSubmit && porterCustomInput) {
      porterCustomSubmit.addEventListener('click', function () {
        var val = porterCustomInput.value.trim();
        if (!val || isNaN(val) || Number(val) < 3) {
          porterCustomInput.style.borderColor = '#C84444';
          porterCustomInput.focus();
          return;
        }
        porterCustomInput.style.borderColor = '';
        advanceFromPorter(val);
      });
      porterCustomInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); porterCustomSubmit.click(); }
      });
      porterCustomInput.addEventListener('input', function () { porterCustomInput.style.borderColor = ''; });
    }
  }

  // Hours screen — Continue button
  if (SCREENS.hours) {
    // Delegated change handler — time selects are built dynamically by buildPorterRows().
    // Converts the integer option values (6..23) emitted by timeOptions() into "HH:00"
    // strings on STATE so the summary card matches the details-screen format.
    SCREENS.hours.addEventListener('change', function (e) {
      var sel = e.target.closest && e.target.closest('.qf-s5-time-select');
      if (!sel) return;
      var hhmm = sel.value.indexOf(':') >= 0 ? sel.value : (sel.value.length === 1 ? '0' + sel.value : sel.value) + ':00';
      if (sel.getAttribute('data-time') === 'start') STATE.timeStart = hhmm;
      else if (sel.getAttribute('data-time') === 'end') STATE.timeEnd = hhmm;
      saveDraft();
    });
    var porterContinueBtn = document.getElementById('qfPorterContinue');
    if (porterContinueBtn) {
      porterContinueBtn.addEventListener('click', function () {
        setRailValue('hours', 'Set');
        goNext();
      });
    }
  }

  /* DETAILS step removed — the "Both services combined" screen was never
     referenced by any FLOWS array. All four service flows use the standard
     porter + hours + days sequence instead. */

  /* =======================================================================
     CONTACT/SUMMARY step — populate summary + handle submit
     ======================================================================= */
  if (SCREENS.contact) {
    // Populate summary when screen becomes active
    var contactObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target === SCREENS.contact && SCREENS.contact.classList.contains('is-active')) {
          populateSummary();
        }
      });
    });
    contactObserver.observe(SCREENS.contact, { attributes: true, attributeFilter: ['class'] });

    function formatPorters() {
      if (!STATE.porterCount) return '';
      if (STATE.porterCount === 'notsure') return 'Not sure';
      return STATE.porterCount + ' porter' + (STATE.porterCount !== '1' ? 's' : '');
    }

    function formatWindow() {
      if (!STATE.cleaningWindow) return '';
      var map = { before_hours: 'Before hours', after_hours: 'After hours', flexible: 'Flexible' };
      return map[STATE.cleaningWindow] || STATE.cleaningWindow;
    }

    function formatTime() {
      if (STATE.timeStart && STATE.timeEnd) return STATE.timeStart + ' - ' + STATE.timeEnd;
      return '';
    }

    function formatDays() {
      if (STATE.days.length === 0) return '(none selected)';
      if (STATE.days.length === 7) return 'Every day';
      if (STATE.days.length === 5 &&
          ['Monday','Tuesday','Wednesday','Thursday','Friday'].every(function(d){return STATE.days.indexOf(d)>-1;})) {
        return 'Mon\u2013Fri';
      }
      var abbr = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
      return STATE.days.map(function(d){return abbr[d] || d;}).join(', ');
    }

    // Price estimate block removed in Bento Grid review redesign — dollar amounts
    // are handled manually by the sales team for every lead. Keeping the JS
    // removed keeps the bundle lean and avoids running dead functions on submit.

    function populateSummary() {
      // Personalize the plan hero title
      var heroTitle = document.getElementById('qfPlanHeroTitle');
      if (heroTitle) {
        // Escape the name so it can safely be rendered with innerHTML (<em> tag)
        var safeName = (STATE.userName || '').replace(/[&<>"']/g, function (c) {
          return ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c];
        });
        heroTitle.innerHTML = safeName
          ? 'Looks good, <em>' + safeName + '</em>?'
          : 'Looks good?';
      }
      // Re-evaluate floating CTA visibility once layout settles
      setTimeout(function () { if (window.qfRecheckFloatingCta) window.qfRecheckFloatingCta(); }, 60);
      var setVal = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val || '\u2014';
      };
      var fullName = (STATE.userName || '') + (STATE.userLastName ? ' ' + STATE.userLastName : '');
      setVal('qfSumName', fullName.trim() || '(not provided)');
      setVal('qfSumEmail', STATE.userEmail || '(not provided)');
      setVal('qfSumPhone', STATE.userPhone || '');
      setVal('qfSumCompany', STATE.companyName || '');
      setVal('qfSumAddress', STATE.userAddress || '(not provided)');
      setVal('qfSumSpace', STATE.space || '(not set)');
      setVal('qfSumSize', formatSizeLabel(STATE.size) || '(not set)');
      setVal('qfSumService', SERVICE_LABELS[STATE.service] || STATE.service);
      setVal('qfSumPorters', formatPorters() || '(not set)');
      setVal('qfSumSchedule', formatDays());
      setVal('qfSumTime', formatTime() || '(not set)');

      // Plan-at-a-glance chips — quick visual summary under the hero.
      // Each chip shows a tiny emoji + label, hides cleanly when the field
      // isn't applicable for the current service.
      var setChip = function (id, emoji, label) {
        var el = document.getElementById(id);
        if (!el) return;
        if (!label) { el.hidden = true; el.textContent = ''; return; }
        el.hidden = false;
        el.textContent = emoji + '  ' + label;
      };
      var SERVICE_EMOJI = { janitorial: '\uD83E\uDDF9', dayporter: '\uD83D\uDC64', both: '\u2728', unsure: '\uD83E\uDD14' };
      var SPACE_EMOJI = { Office: '\uD83C\uDFE2', Medical: '\uD83C\uDFE5', Retail: '\uD83D\uDECD\uFE0F', Restaurant: '\uD83C\uDF7D\uFE0F', Fitness: '\uD83C\uDFCB\uFE0F', Other: '\u2699\uFE0F' };
      setChip('qfChipService', SERVICE_EMOJI[STATE.service] || '\u2728', SERVICE_LABELS[STATE.service] || STATE.service);
      setChip('qfChipSpace', SPACE_EMOJI[STATE.space] || '\uD83D\uDCCD', STATE.space || '');
      setChip('qfChipSize', '\uD83D\uDCCF', STATE.service !== 'dayporter' ? formatSizeLabel(STATE.size) : '');
      setChip('qfChipDays', '\uD83D\uDCC5', formatDays() && formatDays() !== '(none selected)' ? formatDays() : '');
      setChip('qfChipPorters', '\uD83D\uDC65', (STATE.service === 'dayporter' || STATE.service === 'both') ? formatPorters() : '');

      // Conditional rows
      var show = function (id, cond) {
        var el = document.getElementById(id);
        if (el) el.hidden = !cond;
      };
      // Phone is always shown on summary (so user can add it here if skipped)
      show('qfSumPhoneRow', true);
      var phoneValEl = document.getElementById('qfSumPhone');
      if (phoneValEl && !STATE.userPhone) {
        // Fix #21 — the placeholder text is clickable to open the edit row
        phoneValEl.innerHTML = '<button type="button" class="qf-rev-add-link" data-edit="phone">Add phone number</button>';
      }
      show('qfSumCompanyRow', !!STATE.companyName);
      show('qfSumSizeRow', STATE.service !== 'dayporter');
      show('qfSumPortersRow', STATE.service === 'dayporter' || STATE.service === 'both');
      // Show time row for any dayporter-ish service (even if user never touched the hours screen)
      var needsTime = STATE.service === 'dayporter' || STATE.service === 'both';
      show('qfSumTimeRow', needsTime || !!(STATE.timeStart && STATE.timeEnd));

      // Footer email
      var footEmail = document.getElementById('qfRevFootEmail');
      if (footEmail) {
        footEmail.textContent = STATE.userEmail
          ? 'Delivered to ' + STATE.userEmail
          : 'Delivered to your inbox';
      }
    }

    // Fix #53 — contextual aria-labels on Edit buttons
    var FIELD_LABELS = {
      name: 'name', email: 'email address', phone: 'phone number',
      company: 'company name', address: 'address', space: 'space type',
      size: 'space size', service: 'service type', porters: 'porter count',
      window: 'cleaning window', days: 'schedule days', time: 'porter hours'
    };
    document.querySelectorAll('.qf-rev-edit[data-edit]').forEach(function (b) {
      var f = b.getAttribute('data-edit');
      if (f && !b.getAttribute('aria-label')) b.setAttribute('aria-label', 'Edit ' + (FIELD_LABELS[f] || f));
    });

    // Inline edit: open editor
    document.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.getAttribute('data-edit');
        var row = btn.closest('.qf-rev-row');
        if (!row) return;
        // Pre-fill input with current STATE value
        if (field === 'name') {
          document.getElementById('qfEditFirstName').value = STATE.userName || '';
          document.getElementById('qfEditLastName').value = STATE.userLastName || '';
        } else if (field === 'email') {
          document.getElementById('qfEditEmail').value = STATE.userEmail || '';
        } else if (field === 'phone') {
          document.getElementById('qfEditPhone').value = STATE.userPhone || '';
        } else if (field === 'company') {
          document.getElementById('qfEditCompany').value = STATE.companyName || '';
        } else if (field === 'address') {
          document.getElementById('qfEditAddress').value = STATE.userAddress || '';
        } else if (field === 'space') {
          document.getElementById('qfEditSpace').value = STATE.space || 'Office';
        } else if (field === 'size') {
          document.getElementById('qfEditSize').value = STATE.size || 'notsure';
        } else if (field === 'service') {
          document.getElementById('qfEditService').value = STATE.service || 'janitorial';
        } else if (field === 'porters') {
          document.getElementById('qfEditPorters').value = STATE.porterCount || '1';
        } else if (field === 'window') {
          document.getElementById('qfEditWindow').value = STATE.cleaningWindow || 'flexible';
        } else if (field === 'days') {
          document.querySelectorAll('#qfEditDays input').forEach(function (cb) {
            cb.checked = STATE.days.indexOf(cb.value) > -1;
          });
        } else if (field === 'time') {
          document.getElementById('qfEditTimeStart').value = STATE.timeStart || '';
          document.getElementById('qfEditTimeEnd').value = STATE.timeEnd || '';
        }
        row.classList.add('is-editing');
      });
    });

    // Inline edit: cancel
    document.querySelectorAll('[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.qf-rev-row');
        if (row) row.classList.remove('is-editing');
      });
    });

    // Inline edit: save
    document.querySelectorAll('[data-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.getAttribute('data-save');
        if (field === 'name') {
          STATE.userName = document.getElementById('qfEditFirstName').value.trim();
          STATE.userLastName = document.getElementById('qfEditLastName').value.trim();
        } else if (field === 'email') {
          var email = document.getElementById('qfEditEmail').value.trim();
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            qfToast({ type:'warn', title:'Invalid email', message:'Please enter a valid email address.' });
            return;
          }
          STATE.userEmail = email;
        } else if (field === 'phone') {
          STATE.userPhone = document.getElementById('qfEditPhone').value.trim();
        } else if (field === 'company') {
          STATE.companyName = document.getElementById('qfEditCompany').value.trim();
        } else if (field === 'address') {
          STATE.userAddress = document.getElementById('qfEditAddress').value.trim();
        } else if (field === 'space') {
          STATE.space = document.getElementById('qfEditSpace').value;
        } else if (field === 'size') {
          STATE.size = document.getElementById('qfEditSize').value;
        } else if (field === 'service') {
          var oldService = STATE.service;
          var newService = document.getElementById('qfEditService').value;
          STATE.service = newService;
          // Clear incompatible fields when service changes
          if (oldService !== newService) {
            if (newService === 'dayporter') {
              STATE.size = null; // dayporter doesn't use size
            }
            if (newService === 'janitorial' || newService === 'unsure') {
              STATE.porterCount = null;
              STATE.cleaningWindow = null;
              STATE.timeStart = null;
              STATE.timeEnd = null;
            }
            // Rebuild rail for new service
            if (typeof buildRail === 'function') buildRail(newService);
          }
        } else if (field === 'porters') {
          STATE.porterCount = document.getElementById('qfEditPorters').value;
        } else if (field === 'window') {
          STATE.cleaningWindow = document.getElementById('qfEditWindow').value;
        } else if (field === 'days') {
          STATE.days = Array.from(document.querySelectorAll('#qfEditDays input:checked')).map(function(cb){return cb.value;});
        } else if (field === 'time') {
          STATE.timeStart = document.getElementById('qfEditTimeStart').value;
          STATE.timeEnd = document.getElementById('qfEditTimeEnd').value;
        }
        var row = btn.closest('.qf-rev-row');
        if (row) row.classList.remove('is-editing');
        populateSummary();
        // Update rail values to reflect edits
        try {
          if (field === 'name') setRailValue('info', STATE.userName || 'Done');
          else if (field === 'email') setRailValue('info', STATE.userName || 'Done');
          else if (field === 'address' || field === 'company') setRailValue('location', STATE.userAddress || STATE.companyName || 'Done');
          else if (field === 'space') setRailValue('space', STATE.space);
          else if (field === 'size') setRailValue('size', formatSizeLabel(STATE.size));
          else if (field === 'days') {
            var d = STATE.days.length === 7 ? 'Every day' : STATE.days.length === 5 ? 'Mon\u2013Fri' : STATE.days.join(', ');
            setRailValue('days', d || '\u2014');
          }
          else if (field === 'service') {
            setRailValue('service', SERVICE_LABELS[STATE.service] || STATE.service);
          }
          else if (field === 'porters') {
            setRailValue('porter', formatPorters() || '\u2014');
          }
        } catch (e) { /* setRailValue may not exist for all keys */ }
      });
    });

    // Special instructions character counter (Fix #25 — color escalates near limit)
    var specialInput = document.getElementById('qfSpecialInstructions');
    var specialCounter = document.getElementById('qfSpecialCounter');
    if (specialInput && specialCounter) {
      var counterWrap = specialCounter.parentElement;
      var updateCounter = function () {
        var len = specialInput.value.length;
        specialCounter.textContent = len;
        if (counterWrap) {
          counterWrap.classList.remove('is-warn', 'is-danger');
          if (len >= 490) counterWrap.classList.add('is-danger');
          else if (len >= 450) counterWrap.classList.add('is-warn');
        }
      };
      specialInput.addEventListener('input', updateCounter);
      updateCounter();
    }

    // Build payload for /api/submit-quote endpoint
    function buildSubmitPayload() {
      var formType = STATE.service === 'dayporter' ? 'dayporter' : 'janitorial';
      var payload = {
        em: STATE.userEmail,
        fn: STATE.userName,
        ln: STATE.userLastName,
        ph: STATE.userPhone,
        co: STATE.companyName,
        addr: STATE.userAddress,
        space: STATE.space,
        size: STATE.size,
        formType: formType,
        notes: STATE.specialInstructions || ''
      };
      // Schedule days
      if (STATE.days && STATE.days.length) {
        if (formType === 'dayporter') payload.dpDays = STATE.days;
        else payload.janDays = STATE.days;
        // For "both", also send dpDays so dayporter schedule is captured
        if (STATE.service === 'both') payload.dpDays = STATE.days;
      }
      // Porter fields
      if (STATE.porterCount) payload.porters = STATE.porterCount;
      // Cleaning window (janitorial/both) — keep separate from porter hours
      if (STATE.cleaningWindow) payload.window = STATE.cleaningWindow;
      // Day Porter start/end time — sent as startTime + hrs range
      if (STATE.timeStart) payload.startTime = STATE.timeStart;
      if (STATE.timeStart && STATE.timeEnd) payload.hrs = STATE.timeStart + '-' + STATE.timeEnd;
      // Service flag — if user picked "both", mark cross-sell
      if (STATE.service === 'both') {
        if (formType === 'janitorial') payload.addDayPorter = true;
        else payload.addJanitorial = true;
      }
      // Drop empty/null fields so form_data stays clean
      Object.keys(payload).forEach(function (k) {
        var v = payload[k];
        if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
          delete payload[k];
        }
      });
      return payload;
    }

    // Check that all required fields for the current service are captured
    function validateForSubmit() {
      var errs = [];
      if (!STATE.userEmail || !EMAIL_RE.test(STATE.userEmail)) errs.push({ field: 'email', msg: 'Email is missing or invalid.' });
      if (!STATE.userName || !STATE.userName.trim()) errs.push({ field: 'name', msg: 'First name is missing.' });
      if (STATE.userPhone && !isValidPhone(STATE.userPhone)) errs.push({ field: 'phone', msg: 'Phone number is invalid.' });
      if (!STATE.userAddress || STATE.userAddress.length < 5 || !/\d/.test(STATE.userAddress)) errs.push({ field: 'address', msg: 'A valid address or ZIP is missing.' });
      if (!STATE.space) errs.push({ field: 'space', msg: 'Space type is missing.' });
      if (STATE.service !== 'dayporter' && !STATE.size) errs.push({ field: 'size', msg: 'Space size is missing.' });
      if (!STATE.days || !STATE.days.length) errs.push({ field: 'days', msg: 'Please pick at least one service day.' });
      if ((STATE.service === 'dayporter' || STATE.service === 'both') && !STATE.porterCount) {
        errs.push({ field: 'porters', msg: 'Porter count is missing.' });
      }
      return errs;
    }

    // Floating submit CTA — scroll-driven: shows when inline footer is not in view
    (function wireFloatingCta() {
      var floater = document.getElementById('qfPlanFloatingCta');
      var floaterBtn = document.getElementById('qfFloatingSubmitBtn');
      var inlineFoot = SCREENS.contact ? SCREENS.contact.querySelector('.qf-rev-foot') : null;
      var mainBtn = document.getElementById('qfContactSubmit');
      if (!floater || !floaterBtn || !inlineFoot || !mainBtn) return;

      // Forward click + mirror disabled / aria-busy state
      floaterBtn.addEventListener('click', function () {
        if (mainBtn.disabled) return;
        mainBtn.click();
      });
      var mirrorState = function () {
        floaterBtn.disabled = mainBtn.disabled;
        if (mainBtn.hasAttribute('aria-busy')) floaterBtn.setAttribute('aria-busy', 'true');
        else floaterBtn.removeAttribute('aria-busy');
      };
      new MutationObserver(mirrorState).observe(mainBtn, { attributes: true, attributeFilter: ['disabled', 'aria-busy'] });

      // Decide visibility based on scroll position + viewport
      var rafPending = false;
      window.qfRecheckFloatingCta = function () {
        var onFinal = document.querySelector('main.q-flow').classList.contains('is-step-final');
        if (!onFinal) {
          floater.classList.remove('is-visible');
          floater.setAttribute('aria-hidden', 'true');
          return;
        }
        var rect = inlineFoot.getBoundingClientRect();
        // Show floater when the inline CTA is below the visible area (user hasn't
        // scrolled down to it yet) OR already scrolled past it (above the fold).
        var outOfView = rect.bottom < 40 || rect.top > (window.innerHeight - 20);
        floater.classList.toggle('is-visible', outOfView);
        floater.setAttribute('aria-hidden', outOfView ? 'false' : 'true');
      };
      var onScroll = function () {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () { rafPending = false; window.qfRecheckFloatingCta(); });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    })();

    // Submit button
    var submitBtn = document.getElementById('qfContactSubmit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        // Capture special instructions
        var specialInput = document.getElementById('qfSpecialInstructions');
        if (specialInput) STATE.specialInstructions = specialInput.value.trim();

        // Full validation — surface first issue and pop the relevant edit row
        var issues = validateForSubmit();
        if (issues.length) {
          var first = issues[0];
          qfToast({ type:'warn', title:'Please review your answers', message: first.msg, duration: 5500 });
          // Open the inline editor for the offending field so user can fix it here
          var editBtn = document.querySelector('[data-edit="' + first.field + '"]');
          if (editBtn) {
            editBtn.click();
            var row = editBtn.closest('.qf-rev-row');
            if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          return;
        }

        // AYS Ola 3 #17 — client-side submit cooldown so a double-click or
        // accidental retry can't spam the endpoint. 60s between completed submits
        // per device. The real server-side rate limit should live in a Cloudflare
        // Rule (Dashboard → Security → WAF → Rate limiting) since Workers can't
        // persist counters without KV.
        var SUBMIT_COOLDOWN_KEY = 'ecco_quote_last_submit_ts';
        var SUBMIT_COOLDOWN_MS = 60 * 1000;
        try {
          var lastTs = parseInt(localStorage.getItem(SUBMIT_COOLDOWN_KEY) || '0', 10);
          var elapsed = Date.now() - lastTs;
          if (lastTs && elapsed < SUBMIT_COOLDOWN_MS) {
            var wait = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000);
            qfToast({ type:'warn', title:'Just a moment', message: 'Please wait ' + wait + 's before sending another request.', duration: 4000 });
            return;
          }
        } catch (_) { /* localStorage may be disabled — ignore */ }

        // Loading state — Fix #47 aria-busy for screen readers
        var originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = 'Sending\u2026';

        // POST to /api/submit-quote — include Turnstile token if present
        var payload = buildSubmitPayload();
        if (window.qfTurnstileToken) payload.turnstileToken = window.qfTurnstileToken;
        // Force Turnstile to execute before submit if available and no token yet
        if (!window.qfTurnstileToken && window.turnstile) {
          try { window.turnstile.execute('#qfTurnstile'); } catch(_) {}
        }
        fetch('/api/submit-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        }).then(function (result) {
          if (!result.ok || !result.data || !result.data.ok) {
            var msg = (result.data && result.data.error) || 'Please try again or email info@eccofacilities.com.';
            qfToast({ type:'error', title:'Submission failed', message: msg, duration: 7000 });
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            submitBtn.classList.remove('is-loading');
            submitBtn.innerHTML = originalHTML;
            return;
          }
          // Success: show success screen
          // Fix #30 — if backend didn't return a ref, generate a readable one client-side
          var refNumber = result.data.ref || (
            (STATE.service === 'dayporter' ? 'EDP-' : 'ECJ-') +
            Date.now().toString(36).toUpperCase()
          );
          var successTitle = document.getElementById('qfSuccessTitle');
          var successSub = document.getElementById('qfSuccessSub');
          if (successTitle) {
            successTitle.textContent = STATE.userName
              ? 'Your proposal is on its way, ' + STATE.userName + '!'
              : 'Your proposal is on its way!';
          }
          if (successSub && STATE.userEmail) {
            successSub.textContent = 'Check ' + STATE.userEmail + ' \u2014 your custom plan will be there shortly.';
          }
          // Show reference number hero with count-up reveal (Sprint 5 cinematic).
          var refBox = document.getElementById('qfSuccessRef');
          var refNumEl = document.getElementById('qfSuccessRefNum');
          if (refBox && refNumEl && refNumber) {
            refBox.hidden = false;
            if (qfReducedMotion) {
              refNumEl.textContent = refNumber;
            } else {
              var digits = String(refNumber).match(/\d+/);
              if (!digits) { refNumEl.textContent = refNumber; }
              else {
                var prefix = refNumber.slice(0, refNumber.indexOf(digits[0]));
                var target = parseInt(digits[0], 10);
                var width = digits[0].length;
                var start = null;
                var duration = 900;
                function tick(ts) {
                  if (!start) start = ts;
                  var p = Math.min((ts - start) / duration, 1);
                  var eased = 1 - Math.pow(1 - p, 3);
                  var val = Math.floor(target * eased);
                  refNumEl.textContent = prefix + String(val).padStart(width, '0');
                  if (p < 1) requestAnimationFrame(tick);
                  else refNumEl.textContent = refNumber;
                }
                // Start count-up after the title/timeline stagger arrives (~1s).
                setTimeout(function () { requestAnimationFrame(tick); }, 1050);
              }
            }
          }

          // Fix #28 — personalize the success timeline with actual weekdays
          var fmt = function (offsetDays) {
            var d = new Date(); d.setDate(d.getDate() + offsetDays);
            return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          };
          var tl = document.querySelectorAll('.qf-success-timeline-when');
          if (tl.length >= 3) {
            tl[0].textContent = 'By ' + fmt(1);
            tl[1].textContent = 'By ' + fmt(2);
            tl[2].textContent = 'Week of ' + fmt(7);
          }
          setRailValue('contact', '\u2713');
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.classList.remove('is-loading');
          submitBtn.innerHTML = originalHTML;
          clearDraft();
          try { localStorage.setItem(SUBMIT_COOLDOWN_KEY, String(Date.now())); } catch (_) {}
          // Sprint 5 — wire the share-a-colleague CTA on success.
          var shareBtn = document.getElementById('qfShareColleagueBtn');
          if (shareBtn && !shareBtn._qfWired) {
            shareBtn._qfWired = true;
            var shareTitle = 'Ecco Facilities — commercial cleaning in NYC';
            var shareText = 'I just requested a quote from Ecco Facilities for commercial cleaning. Thought it might be worth a look if you manage a space in NYC.';
            var shareUrl = 'https://eccofacilities.com/';
            shareBtn.addEventListener('click', function () {
              qfHaptic(QF_HAPTIC.select);
              if (navigator.share) {
                navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(function(){});
              } else {
                var subject = encodeURIComponent(shareTitle);
                var body = encodeURIComponent(shareText + '\n\n' + shareUrl);
                window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
              }
            });
          }
          goNext();
        }).catch(function (err) {
          qfToast({ type:'error', title:'Network error', message:'Check your connection and try again, or email info@eccofacilities.com.', duration: 7000 });
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.classList.remove('is-loading');
          submitBtn.innerHTML = originalHTML;
        });
      });
    }
  }

  /* =======================================================================
     Time select helpers
     ======================================================================= */

  /** Populate a <select> with 30-min time slots from 6AM to 10PM */
  function populateTimeSelect(selectEl, defaultVal) {
    if (!selectEl) return;
    // Clear existing options
    selectEl.innerHTML = '';
    for (var h = 6; h <= 22; h++) {
      for (var m = 0; m < 60; m += 30) {
        if (h === 22 && m === 30) break; // stop at 10:00 PM
        var val = padTime(h) + ':' + padTime(m);
        var label = formatTime12(h, m);
        var opt = document.createElement('option');
        opt.value = val;
        opt.textContent = label;
        if (val === defaultVal) opt.selected = true;
        selectEl.appendChild(opt);
      }
    }
  }

  /** Set both start and end time selects */
  function setTimeSelects(startEl, endEl, startVal, endVal) {
    if (startEl) { startEl.value = startVal; STATE.timeStart = startVal; }
    if (endEl) { endEl.value = endVal; STATE.timeEnd = endVal; }
  }

  /** Pad single digit to two digits */
  function padTime(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** Format 24h time to 12h label */
  function formatTime12(h, m) {
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    var minStr = m === 0 ? '' : ':' + padTime(m);
    return h12 + minStr + ' ' + suffix;
  }

  /* =======================================================================
     Flow bar — back button + Ask Alina
     ======================================================================= */
  if (flowBackBtn) {
    flowBackBtn.addEventListener('click', function () {
      goBack();
    });
  }

  if (askAlinaBtn) {
    askAlinaBtn.addEventListener('click', function () {
      var pill = document.getElementById('qAskToggle');
      if (pill) pill.click();
      else qfToast({ type:'warn', title:'Alina chat', message:'Chat will open here in production.' });
    });
  }

  /* =======================================================================
     Feature #13: Exit intent recovery
     ======================================================================= */
  var exitShown = false;

  if (exitOverlay && !sessionStorage.getItem('qf_exit_shown')) {
    // Delay exit intent — only arm after 20 seconds on page
    setTimeout(function () {
      var showExit = function () {
        if (exitShown) return;
        exitShown = true;
        sessionStorage.setItem('qf_exit_shown', '1');
        exitOverlay.hidden = false;
      };
      // Desktop: detect mouse leaving the top edge of the viewport
      document.addEventListener('mouseleave', function (e) {
        if (e.clientY > 5) return;
        showExit();
      });
      // AYS Ola 3 #16 — mobile equivalent: fire when the tab becomes hidden,
      // which covers switching apps, pulling up the URL bar, or closing the tab.
      // Gated to touch-first devices so desktop still uses mouseleave only.
      if (qfTouchFirst) {
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'hidden' && STATE.currentStepName !== 'welcome' && STATE.currentStepName !== 'success') {
            showExit();
          }
        });
      }
    }, 20000);
  }
  if (exitClose) {
    exitClose.addEventListener('click', function () {
      if (exitOverlay) exitOverlay.hidden = true;
    });
  }
  if (exitForm) {
    exitForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = exitForm.querySelector('input[type="email"]');
      var val = email ? email.value.trim() : '';
      if (!val || !EMAIL_RE.test(val)) {
        if (email) { email.classList.add('qf-input-invalid'); email.focus(); }
        qfToast({ type:'warn', title:'Valid email needed', message:'We need a real email to send your resume link.', duration: 4500 });
        return;
      }
      // Fix #27 — actually persist the partial lead so we can follow up
      var submitBtn = exitForm.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending\u2026'; }
      fetch('/api/capture-partial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val, firstName: STATE.userName || '', phone: STATE.userPhone || '' })
      }).catch(function(){ /* silent — backend may be offline */ })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
          qfToast({ type:'success', title:'We\u2019ve got your spot', message:'We\u2019ll follow up with ' + val + ' so you can pick this up later.' });
          if (exitOverlay) exitOverlay.hidden = true;
          // Save draft so resume banner works too
          STATE.userEmail = STATE.userEmail || val;
          saveDraft();
        });
    });
  }

  // IntersectionObserver removed — screens are born on demand, no need to track scroll position

  /* =======================================================================
     Custom smooth scroll (bypasses CSS scroll-behavior: smooth conflict)
     Uses easeInOutCubic for natural feel
     ======================================================================= */
  function smoothScrollTo(targetY, duration) {
    var startY = window.scrollY || document.documentElement.scrollTop;
    var diff = targetY - startY;
    if (Math.abs(diff) < 2) return;
    var startTime = null;
    var html = document.documentElement;
    var prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = ease(progress);
      document.documentElement.scrollTop = startY + diff * eased;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        html.style.scrollBehavior = prevBehavior;
      }
    }

    requestAnimationFrame(step);
  }

  /* =======================================================================
     Mouse parallax for washes (desktop only)
     ======================================================================= */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && supportsHover) {
    var washes = document.querySelectorAll('.qf-wash');
    var raf = null;
    document.addEventListener('mousemove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var x = (e.clientX / window.innerWidth - 0.5) * 2;
        var y = (e.clientY / window.innerHeight - 0.5) * 2;
        washes.forEach(function (w, i) {
          var intensity = [30, 25, 15][i] || 20;
          w.style.transform = 'translate(' + (x * intensity) + 'px, ' + (y * intensity) + 'px)';
        });
        raf = null;
      });
    });
  }

  /* =======================================================================
     Init: letter reveal + initial progress ring
     ======================================================================= */
  syncFlowBar(STATE.currentStepName || 'welcome');
  updateProgressRing(STATE.currentStepName || 'welcome');
  // Animate the greeting after a tiny delay so the screen fade-in starts first
  setTimeout(animateGreeting, 280);

  /* -----------------------------------------------------------------------
     Resume draft — personalized smart defaults when prior session exists.
     Sprint 6: instead of a generic banner, we pre-glow the previously picked
     service card and surface the resume prompt with the service name.
     ----------------------------------------------------------------------- */
  (function offerResume() {
    var draft = loadDraft();
    if (!draft || !draft.service || draft.currentStepName === 'welcome' || draft.currentStepName === 'success') return;

    // (Pre-highlighting the prior card was removed — the green ring read as
    // "selected" to users. The resume banner above is enough context.)
    var SERVICE_NAMES = { janitorial:'Janitorial', dayporter:'Day Porter', both:'Both Services', unsure:'that plan' };
    var niceName = SERVICE_NAMES[draft.service] || 'your plan';

    // AYS Ola 3 #1+#25 — XSS fix. The previous version inlined `draft.userName`
    // and `niceName` into `innerHTML`, so any attacker who could seed
    // localStorage (via malicious link that does `localStorage.setItem`
    // then redirects here) achieved XSS in the eccofacilities.com origin.
    // Now every user-derived value flows through `.textContent` and element
    // creation, which browsers escape automatically.
    var banner = document.createElement('div');
    banner.className = 'qf-resume-banner qf-resume-smart';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Resume previous session');

    var inner = document.createElement('div');
    inner.className = 'qf-resume-inner';

    var ico = document.createElement('span');
    ico.className = 'qf-resume-ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.textContent = '\u23F1\uFE0F';

    var textWrap = document.createElement('span');
    textWrap.className = 'qf-resume-text';
    var strong = document.createElement('strong');
    strong.textContent = draft.userName ? (draft.userName + ', welcome back!') : 'Welcome back!';
    textWrap.appendChild(strong);
    textWrap.appendChild(document.createTextNode(' Last time you picked '));
    var em = document.createElement('em');
    em.textContent = niceName;
    textWrap.appendChild(em);
    textWrap.appendChild(document.createTextNode(' \u2014 pick up where you left off?'));

    var resumeBtn = document.createElement('button');
    resumeBtn.type = 'button';
    resumeBtn.className = 'qf-resume-btn qf-resume-resume';
    resumeBtn.textContent = 'Resume';

    var startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'qf-resume-btn qf-resume-start';
    startBtn.textContent = 'Start over';

    inner.appendChild(ico);
    inner.appendChild(textWrap);
    inner.appendChild(resumeBtn);
    inner.appendChild(startBtn);
    banner.appendChild(inner);

    var stage = document.getElementById('qfStage');
    if (stage) stage.insertBefore(banner, stage.firstChild);

    resumeBtn.addEventListener('click', function () {
      // Merge saved state in
      Object.keys(draft).forEach(function (k) { STATE[k] = draft[k]; });
      buildRail(STATE.service);
      setRailValue('welcome', SERVICE_LABELS[STATE.service] || 'Service');
      if (STATE.userName) setRailValue('info', STATE.userName);
      if (STATE.userAddress) setRailValue('location', STATE.userAddress);
      if (STATE.space) setRailValue('space', STATE.space);
      if (STATE.size) setRailValue('size', formatSizeLabel(STATE.size));
      if (STATE.days && STATE.days.length) {
        var d = STATE.days.length === 7 ? 'Every day' : STATE.days.length === 5 ? 'Mon\u2013Fri' : STATE.days.length + ' days';
        setRailValue('days', d);
      }
      banner.remove();
      goToScreen(STATE.currentStepName);
    });
    startBtn.addEventListener('click', function () {
      clearDraft();
      banner.remove();
    });
  })();

})();
