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
  // V2 2026-04-25 — janitorial flow restructured per mockup G order:
  // welcome → space → info → size → days → location → contact → success.
  // 'checkpoint' step removed (absorbed into review). Other flows keep
  // their pre-V2 shape because this round only redesigns Janitorial.
  var FLOWS = {
    janitorial: ['welcome', 'space', 'info', 'size', 'days', 'location', 'contact', 'success'],
    dayporter:  ['welcome', 'info', 'space', 'location', 'days', 'porter', 'hours', 'contact', 'success'],
    // 'both' asks two day questions in sequence so clients with different
    // cleaning vs porter schedules (e.g. restaurant: porter 7 days, cleaning
    // Mon-Fri only) can express it. First visit = cleaning days, second visit
    // = porter days (pre-filled with cleaning days via a "Same days" preset).
    both:       ['welcome', 'info', 'space', 'location', 'size', 'days', 'dpDays', 'porter', 'hours', 'contact', 'success'],
    unsure:     ['welcome', 'info', 'space', 'location', 'size', 'days', 'contact', 'success']
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
      { key: 'days',     label: 'Cleaning' },
      { key: 'dpDays',   label: 'Porter days' },
      { key: 'porter',   label: 'Porters' },
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
  // AYS Ola 3 #21 — removed legacy 'window' step (no corresponding DOM, all
  // FLOWS path refs dropped in an earlier refactor; still created SCREENS.window = null)
  // V2 2026-04-25 — 'checkpoint' removed (absorbed into review screen).
  var SCREEN_NAMES = ['welcome', 'info', 'space', 'location', 'size', 'days', 'dpDays', 'porter', 'hours', 'contact', 'success'];
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
  // V1 exit overlay retired — V2 wireExitIntent() builds the modal at runtime.
  // Variables kept null so the legacy handlers below short-circuit harmlessly.
  var exitOverlay  = null;
  var exitClose    = null;
  var exitForm     = null;

  /* -----------------------------------------------------------------------
     Dev-only assertion — warn loudly if a critical summary/edit ID is missing
     so a future HTML typo (e.g. qfSumAdress vs qfSumAddress) surfaces in the
     console instead of silently falling back to the setVal() em-dash. Only
     runs on localhost (production bundle stays quiet).
     ----------------------------------------------------------------------- */
  (function qfAssertIds() {
    try {
      var host = (window.location && window.location.hostname) || '';
      if (host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0') return;
      // Pruned to only IDs the V2 review/contact screen still ships.
      // V1→V2 redesign retired the qfSum*/qfRv*/qfEdit* IDs; setVal() calls
      // on those are dead-code no-ops and intentionally not asserted here.
      var REQUIRED = ['qfContactSubmit', 'qfSpecialInstructions'];
      var missing = REQUIRED.filter(function (id) { return !document.getElementById(id); });
      if (missing.length) {
        console.warn('[qf] Missing review/edit elements:', missing.join(', '),
          '— setVal() will silently fall back to em-dash for these.');
      }
    } catch (_) { /* never break the form over an assertion */ }
  })();

  // Ola 3 — GC-friendly tracking of "already-wired" DOM elements. Replaces
  // expando properties like el.__qfRvListenerAttached (which survive clones
  // and clutter devtools). Entries drop automatically when the element goes.
  var _qfListenerAttached = new WeakMap();

  // Ola 6 — safe row builder. Replaces two `innerHTML = list.map(…).join('')`
  // sites in the edit panel that interpolated STATE.porterHours entries —
  // values originate from draft localStorage and are attacker-controllable
  // (an attacker-seeded set in another tab + redirect = XSS via the
  // value="…" attribute). This helper uses createElement + setAttribute +
  // textContent so nothing ever touches the HTML parser, making the
  // patterns immune to injection even if the data shape drifts.
  function renderPorterHourRows(target, hours) {
    var frag = document.createDocumentFragment();
    hours.forEach(function (ph, idx) {
      var n = idx + 1;
      var s = (ph && ph.start) || '08:00';
      var e = (ph && ph.end) || '17:00';
      var row = document.createElement('div');
      row.className = 'qf-rv-porter-hour-row';
      row.setAttribute('data-porter-row', String(n));
      var label = document.createElement('span');
      label.className = 'qf-rv-porter-hour-label';
      label.textContent = 'Porter ' + n;
      row.appendChild(label);
      var fieldRow = document.createElement('div');
      fieldRow.className = 'qf-rv-field-row';
      var startInput = document.createElement('input');
      startInput.type = 'time';
      startInput.className = 'qf-rev-input';
      startInput.setAttribute('data-porter', String(n));
      startInput.setAttribute('data-time', 'start');
      startInput.value = s;
      startInput.setAttribute('aria-label', 'Porter ' + n + ' start time');
      fieldRow.appendChild(startInput);
      var sep = document.createElement('span');
      sep.className = 'qf-rv-field-sep';
      sep.textContent = 'to';
      fieldRow.appendChild(sep);
      var endInput = document.createElement('input');
      endInput.type = 'time';
      endInput.className = 'qf-rev-input';
      endInput.setAttribute('data-porter', String(n));
      endInput.setAttribute('data-time', 'end');
      endInput.value = e;
      endInput.setAttribute('aria-label', 'Porter ' + n + ' end time');
      fieldRow.appendChild(endInput);
      row.appendChild(fieldRow);
      frag.appendChild(row);
    });
    target.replaceChildren(frag);
  }

  /* -----------------------------------------------------------------------
     STATE
     ----------------------------------------------------------------------- */
  // V2 2026-04-25 — added userPosition (job role/title), spaceOther (free-text
  // when "Something else" picked), sizeExact (numeric sq ft), timeOfDay (array
  // of preferred slots), serviceCertainty ('guided_via_quiz' if welcome quiz
  // was used), needsSiteWalk (bool, true when size === 'visit_required' or
  // sizeExact > 15000), scheduleAtypical (bool, computed via the pure helper
  // computeScheduleAtypical for unusual space+time combos).
  var STATE = {
    service:        null,
    space:          null,
    spaceOther:     '',
    size:           null,
    sizeExact:      null,
    days:           [],
    dpDays:         [],
    timeOfDay:      [],
    porterCount:    null,
    timeStart:      null,
    timeEnd:        null,
    porterHours:    [],
    currentStepName: 'welcome',
    userName:       '',
    userLastName:   '',
    userEmail:      '',
    userPosition:   '',
    companyName:    '',
    userAddress:    '',
    userSuite:      '',
    userPhone:      '',
    specialInstructions: '',
    serviceCertainty: null,
    needsSiteWalk:  false,
    scheduleAtypical: false
  };

  /** V2 2026-04-25 — exit-intent modal (mockup G demo B). Desktop only.
   * Fires when the cursor exits via the top edge of the viewport before the
   * user has supplied an email. One-shot per session. Renders a centered
   * modal with email input + "No thanks" / "Send it" actions. On submit
   * we capture STATE.userEmail, save the draft, and close the modal so the
   * user can pick up later via the resume banner.
   */
  (function wireExitIntent() {
    if (typeof window === 'undefined') return;
    if (!matchMedia || !matchMedia('(min-width: 768px)').matches) return; // desktop only
    var fired = false;
    var SHOWN_KEY = 'ecco_quote_exit_shown_v1';
    try { if (sessionStorage.getItem(SHOWN_KEY)) fired = true; } catch (_) {}

    function shouldFire() {
      if (fired) return false;
      // Don't fire if already on review/success or after we have email
      var active = document.querySelector('.qf-screen.is-active');
      if (active && (active.id === 'qfScreen_contact' || active.id === 'qfScreen_success')) return false;
      // Don't fire if user already typed an email
      var emailEl = document.getElementById('qfUserEmail');
      if (emailEl && emailEl.value && emailEl.value.indexOf('@') > -1) return false;
      return true;
    }

    function showModal() {
      if (!shouldFire()) return;
      fired = true;
      try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch (_) {}

      var overlay = document.createElement('div');
      overlay.className = 'qf2-exit-overlay';
      var modal = document.createElement('div');
      modal.className = 'qf2-exit-modal';
      var ava = document.createElement('div');
      ava.className = 'qf2-exit-modal-avatar';
      var img = document.createElement('img');
      img.src = 'images/alina-avatar-96.jpg';
      img.alt = '';
      img.width = 56; img.height = 56;
      ava.appendChild(img);
      modal.appendChild(ava);

      var hand = document.createElement('span');
      hand.className = 'qf2-exit-modal-hand';
      hand.textContent = 'Hey, leaving so soon?';
      modal.appendChild(hand);

      var h2 = document.createElement('h2');
      h2.appendChild(document.createTextNode('Drop your '));
      var em = document.createElement('em');
      em.textContent = 'email';
      h2.appendChild(em);
      modal.appendChild(h2);

      var p = document.createElement('p');
      p.textContent = "I'll send you the form to finish later, no pressure.";
      modal.appendChild(p);

      var fieldWrap = document.createElement('div');
      fieldWrap.className = 'qf2-field';
      var input = document.createElement('input');
      input.type = 'email';
      input.placeholder = 'you@company.com';
      input.id = 'qf2ExitEmail';
      input.setAttribute('aria-label', 'Email address');
      var prevEmail = document.getElementById('qfUserEmail');
      if (prevEmail && prevEmail.value) input.value = prevEmail.value;
      fieldWrap.appendChild(input);
      modal.appendChild(fieldWrap);

      var actions = document.createElement('div');
      actions.className = 'qf2-exit-modal-actions';
      var noBtn = document.createElement('button');
      noBtn.type = 'button';
      noBtn.className = 'qf2-exit-modal-no';
      noBtn.textContent = 'No thanks';
      var yesBtn = document.createElement('button');
      yesBtn.type = 'button';
      yesBtn.className = 'qf2-exit-modal-yes';
      yesBtn.textContent = 'Send it →';

      function close() { try { overlay.remove(); } catch(e){} }

      noBtn.addEventListener('click', close);
      yesBtn.addEventListener('click', function () {
        var v = input.value.trim();
        if (!v || !EMAIL_RE.test(v)) {
          input.focus();
          input.classList.add('qf-input-invalid');
          qfToast({ type:'warn', title:'Valid email needed', message:'We need a real email to send your resume link.', duration: 4500 });
          return;
        }
        STATE.userEmail = v;
        if (prevEmail) prevEmail.value = v;
        try { saveDraft(); } catch(e){}
        // Persist the partial lead so we can follow up (mirrors legacy V1 behaviour).
        var originalText = yesBtn.textContent;
        yesBtn.disabled = true;
        yesBtn.textContent = 'Sending…';
        fetch('/api/capture-partial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: v, firstName: STATE.userName || '', phone: STATE.userPhone || '' })
        }).catch(function(){ /* silent — backend may be offline */ })
          .finally(function () {
            yesBtn.disabled = false;
            yesBtn.textContent = originalText;
            qfToast({ type:'success', title:'We’ve got your spot', message:'We’ll follow up with ' + v + ' so you can pick this up later.' });
            close();
          });
      });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', function escClose(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escClose); }
      });

      actions.appendChild(noBtn);
      actions.appendChild(yesBtn);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      setTimeout(function(){ input.focus(); }, 80);
    }

    document.addEventListener('mouseleave', function (e) {
      // Only fire when cursor exits via the top of the viewport
      if (e.clientY > 0) return;
      // Add a tiny delay so accidental scroll-to-tab-bar doesn't fire it
      showModal();
    });
  })();

  /** V2 2026-04-25 — pure heuristic: returns true if the picked space + time
   * combo is unusual enough to warrant a heads-up on the site visit. Pure
   * function (no DOM, no STATE references) so any handler can call it.
   * Office cleans evenings normally, so morning-only is unusual.
   * Restaurants clean off-hours (eve/night), so morning-only is unusual.
   * Medical clinics typically clean evenings — but evening-ONLY is too
   * narrow for a medical schedule, hence the flag. */
  function computeScheduleAtypical(space, timeOfDay) {
    var times = Array.isArray(timeOfDay) ? timeOfDay : [];
    var morningOnly = times.length === 1 && times[0] === 'morning';
    var eveningOnly = times.length === 1 && times[0] === 'evening';
    var sp = String(space || '').toLowerCase();
    if (sp === 'office' && morningOnly) return true;
    if (sp === 'restaurant' && morningOnly) return true;
    if (sp === 'medical' && eveningOnly) return true;
    return false;
  }

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
    // Ola 5 — on the contact (review/submit) screen, "Step N of N" feels
    // like one more question is coming. Swap in "Last step" so users
    // mentally commit to the final CTA instead of bracing for another page.
    var isFinalInteractive = STATE.currentStepName === 'contact';
    stepEl.textContent = isFinalInteractive
      ? 'Last step'
      : 'Step ' + displayStep + ' of ' + totalSteps;
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
    if (pillLabel) pillLabel.textContent = isFinalInteractive
      ? 'Last step'
      : 'Step ' + displayStep + ' of ' + totalSteps;
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
  // AYS Ola 3 #23 — observer now has a disconnect hook for unload/success,
  // preventing memory leaks and stopping haptic spam after the user submits.
  // AYS Ola 4 Commit L HI-1 — expose observers on a registry so the success
  // transition and beforeunload can both disconnect them. Prevents memory
  // growth when the user completes submits + navigates back.
  var qfObservers = [];
  function registerObserver(obs) { if (obs) qfObservers.push(obs); return obs; }
  function disconnectAllObservers() {
    qfObservers.forEach(function (o) { try { o.disconnect(); } catch (_) {} });
    qfObservers = [];
  }
  var invalidObserver = null;
  try {
    invalidObserver = registerObserver(new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
        var wasInvalid = m.oldValue && m.oldValue.indexOf('qf-input-invalid') !== -1;
        var isInvalid  = m.target.classList && m.target.classList.contains('qf-input-invalid');
        if (!wasInvalid && isInvalid) { qfHaptic(QF_HAPTIC.error); return; }
      }
    }));
    invalidObserver.observe(document.body || document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
  } catch (_) {}
  window.addEventListener('beforeunload', disconnectAllObservers);

  /* -----------------------------------------------------------------------
     Draft persistence — survive refresh + resume next session
     Keys only restore if <7 days old, to avoid stale leads

     AYS Ola 3 #8 — PII consent gate. Previously persisted userName, userEmail,
     userPhone, userAddress, companyName BEFORE the user had accepted cookies.
     Now: anonymous fields always; PII only when `ecco_consent === 'accepted'`.
     A listener re-hydrates the full draft when consent is granted mid-session.
     ----------------------------------------------------------------------- */
  var DRAFT_KEY = 'ecco_quote_draft_v1';
  var DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  var PII_FIELDS = ['userName', 'userLastName', 'userEmail', 'userPhone', 'userAddress', 'companyName'];

  function hasConsent() {
    try {
      // Check both the HubSpot-gating `ecco_consent` key and the cookie-consent
      // module's `ecco_cookies` key. Either set to 'accepted' grants consent.
      var c1 = localStorage.getItem('ecco_consent');
      if (c1 === 'accepted' || c1 === 'true') return true;
      var c2 = localStorage.getItem('ecco_cookies');
      if (c2 === 'accepted') return true;
      var m = (document.cookie || '').match(/(?:^|;\s*)ecco_consent=([^;]+)/);
      return !!m && (m[1] === 'accepted' || m[1] === 'true');
    } catch (_) { return false; }
  }

  function stripPII(state) {
    var clean = {};
    Object.keys(state).forEach(function (k) {
      if (PII_FIELDS.indexOf(k) === -1) clean[k] = state[k];
    });
    return clean;
  }

  function saveDraft() {
    try {
      // Never save submitted / success state
      if (STATE.currentStepName === 'success') return;
      var payload = hasConsent() ? STATE : stripPII(STATE);
      // V2 2026-04-25 — stamp _v: 2 so loadDraft can migrate v1 drafts safely.
      var snap = { _v: 2, s: payload, t: Date.now(), c: hasConsent() ? 1 : 0 };
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
      // Ola 3 — type-guard the restored state so a tampered localStorage blob
      // (attacker-seeded, or just a future schema change) can't crash the
      // form by making downstream code assume object shape. Every field that
      // other code treats as an array gets re-asserted here.
      if (!parsed || typeof parsed !== 'object') return null;
      if (typeof parsed.s !== 'object' || parsed.s === null) return null;
      if (parsed.t && (Date.now() - parsed.t) > DRAFT_MAX_AGE_MS) {
        clearDraft();
        return null;
      }
      var s = parsed.s;
      if (s.days && !Array.isArray(s.days)) s.days = [];
      if (s.dpDays && !Array.isArray(s.dpDays)) s.dpDays = [];
      // V2 2026-04-25 — type-guard new array fields too.
      if (s.timeOfDay && !Array.isArray(s.timeOfDay)) s.timeOfDay = [];
      // V2 2026-04-25 — v1 → v2 migration (per `_v` stamp on snapshot):
      //   - currentStepName 'role' → 'info' (role is now a field on info)
      //   - currentStepName 'checkpoint' → 'contact' (checkpoint absorbed into review)
      // The stamp lives on `parsed._v`. Absent stamp = pre-v2.
      if (!parsed._v || parsed._v < 2) {
        if (s.currentStepName === 'role') s.currentStepName = 'info';
        if (s.currentStepName === 'checkpoint') s.currentStepName = 'contact';
      }
      return s;
    } catch (_) { return null; }
  }

  // AYS Ola 4 Commit L LO-4 — keep named listener so we can remove on unload.
  // Re-save with full PII once the user accepts cookies mid-session.
  var onConsentAccepted = function () { saveDraft(); };
  window.addEventListener('ecco:consent-accepted', onConsentAccepted);

  // AYS Ola 4 Commit L ME-11 — when the user revokes consent mid-session,
  // purge the existing draft so stale PII doesn't linger in localStorage.
  var onConsentDeclined = function () { try { clearDraft(); } catch (_) {} };
  window.addEventListener('ecco:consent-declined', onConsentDeclined);

  // Clean up listeners on navigation away so we don't hold page-scope closures
  // for the lifetime of the browser.
  window.addEventListener('beforeunload', function () {
    try {
      window.removeEventListener('ecco:consent-accepted', onConsentAccepted);
      window.removeEventListener('ecco:consent-declined', onConsentDeclined);
      // Ola 3 — defined later in the file; guarded in case init order changes.
      if (typeof cancelLiveCounter === 'function') cancelLiveCounter();
    } catch (_) {}
  });

  // Ola 5 — abandonment safety: if the user has started answering but hasn't
  // submitted, prompt the native browser "Leave site?" dialog. Most browsers
  // ignore the custom message and show their own, but any prompt is enough
  // to rescue an accidental close. Gated: no prompt at welcome (haven't
  // invested anything) or success (already submitted). Draft is still saved
  // to localStorage regardless, so a user who dismisses the prompt and
  // returns later still resumes where they left off.
  window.addEventListener('beforeunload', function (e) {
    try {
      var step = STATE && STATE.currentStepName;
      if (!step || step === 'welcome' || step === 'success') return;
      // Only warn if the user has actually typed/selected something — spare
      // a prompt for a visitor who opened the page and closed it immediately.
      var hasInput = (STATE.service && STATE.service !== null) ||
                     STATE.userEmail || STATE.userName || STATE.space ||
                     (Array.isArray(STATE.days) && STATE.days.length);
      if (!hasInput) return;
      e.preventDefault();
      // Legacy string (Chrome <51, Edge) — modern browsers show their own copy.
      e.returnValue = 'Your progress is saved. You can pick up where you left off anytime.';
      return e.returnValue;
    } catch (_) {}
  });

  /* -----------------------------------------------------------------------
     Alina copy — contextual messages per screen
     ----------------------------------------------------------------------- */
  var ALINA_MESSAGES = {
    janitorial: 'Perfect choice. Now let\u2019s find the right plan for your space.',
    dayporter:  'Great pick. Let\u2019s match you with the right setup.',
    both:       'Smart move. Full 24/7 coverage. Let\u2019s get to know your space.',
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
    Fitness:    'Gyms range widely: boutiques under 3K, full facilities 10K+. Pick the closest.',
    Other:      'Pick the closest range or enter the exact number below.'
  };

  var ALINA_S4_BY_SPACE = {
    Office:     'For offices, Monday\u2013Friday is most common. Weekends only if you need them.',
    Medical:    'Medical spaces usually match patient-facing days. Pick what fits your schedule.',
    Retail:     'Retail often needs full 7-day coverage. Weekends matter most.',
    Restaurant: 'Restaurants usually need 6\u20137 days. After-hours is the key window.',
    Fitness:    'Gyms and studios often need daily coverage during open hours.',
    Other:      'Pick the days that match your schedule.'
  };

  var ALINA_PORTER_BY_SPACE = {
    Office:     'For an office like yours, 1 porter usually covers it. But you decide!',
    Medical:    'Medical spaces need tight sanitization. 1 dedicated porter works for clinics, 2+ for larger facilities.',
    Retail:     'For retail, 1 porter handles front-of-house freshness. Multi-floor stores usually go with 2.',
    Restaurant: 'Restaurants often need 1\u20132 porters during service: one front, one back.',
    Fitness:    'Gyms benefit from porters on equipment and locker rooms. 1\u20132 usually works.',
    Other:      'Pick what fits your space. We\u2019ll fine-tune on the call.'
  };

  var ALINA_HOURS_BY_SPACE = {
    Office:     'Set the hours for each porter. Most offices go 8 AM to 5 PM.',
    Medical:    'Set the hours to match your patient-facing windows, usually 8 AM to 6 PM.',
    Retail:     'Set the hours to match your store hours, usually 10 AM to 9 PM.',
    Restaurant: 'Set the hours. Restaurants typically need 11 AM to close.',
    Fitness:    'Set the hours. Gyms usually open 5 AM to 10 PM.',
    Other:      'Set the hours that match your operation.'
  };

  var ALINA_WINDOW = {
    janitorial: 'Last scheduling detail. When works best for our team?',
    both:       'When should the janitorial team come in?'
  };


  // AYS Ola 4 Commit L ME-6 — S4_TITLES used to hold raw HTML ("Which <em>days</em>…")
  // and be assigned via `s4title.innerHTML = …`. Safe today because strings are
  // hard-coded, but one future refactor (loading from i18n JSON, CMS, localStorage)
  // would turn this into an XSS. Now split into safe text segments.
  var S4_TITLES = {
    janitorial: { before: 'Which ', emphasis: 'days', after: ' should we clean?' },
    dayporter:  { before: 'Which ', emphasis: 'days', after: ' do you need your porter?' },
    // For 'both' the first days screen captures cleaning days; the porter
    // days live on a separate qfScreen_dpDays in the flow.
    both:       { before: 'Which ', emphasis: 'days', after: ' should we clean?' },
    unsure:     { before: 'Which ', emphasis: 'days', after: ' do you need service?' }
  };
  function renderS4Title(el, tpl) {
    if (!el || !tpl) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(document.createTextNode(tpl.before));
    var em = document.createElement('em');
    em.textContent = tpl.emphasis;
    el.appendChild(em);
    el.appendChild(document.createTextNode(tpl.after));
  }

  var SIZE_LABELS = {
    // Sprint 2 D14 \u2014 rebalanced buckets for better small-business precision.
    // Old "Under 3K" lumped 500 sq ft kiosks with 2,800 sq ft suites.
    'under1k':  'Under 1,000 sq ft',
    '1k-3k':    '1,000\u20133,000 sq ft',
    '3k-6k':    '3,000\u20136,000 sq ft',
    '6k-12k':   '6,000\u201312,000 sq ft',
    '12k-plus': '12,000+ sq ft',
    'visit_required': 'In-person visit',
    'notsure':  'In-person visit',
    // Legacy keys preserved so resume-draft from older sessions still maps.
    'under3k':  'Under 3,000 sq ft',
    '6k-9k':    '6,000\u20139,000 sq ft',
    '9k-12k':   '9,000\u201312,000 sq ft',
    '12k-15k':  '12,000\u201315,000 sq ft'
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
  // Ola 3 — store the pending timer so the success-screen cleanup and
  // beforeunload can cancel it. Previously the recursive setTimeout chain
  // kept ticking after the form completed, touching a DOM node that was
  // about to be removed.
  var _qfLiveCounterTimer = null;
  function scheduleLiveCounter() {
    var delay = 25000 + Math.random() * 15000;
    _qfLiveCounterTimer = setTimeout(function () {
      _qfLiveCounterTimer = null;
      updateLiveCounter();
      scheduleLiveCounter();
    }, delay);
  }
  function cancelLiveCounter() {
    if (_qfLiveCounterTimer) { clearTimeout(_qfLiveCounterTimer); _qfLiveCounterTimer = null; }
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

  /** Build rail DOM for the given service. AYS Ola 4 Commit L ME-5 —
      no more innerHTML string concat. If RAIL_CONFIGS ever pulled from
      an API or localStorage, the old pattern was one rename away from XSS. */
  function buildRail(service) {
    if (!railStations) return;
    var config = RAIL_CONFIGS[service] || RAIL_CONFIGS.unsure;
    // Clear existing content
    while (railStations.firstChild) railStations.removeChild(railStations.firstChild);
    config.forEach(function (station, i) {
      var li = document.createElement('li');
      li.className = 'qf-rail-station' + (i === 0 ? ' is-done' : (i === 1 ? ' is-current' : ''));
      li.setAttribute('data-key', station.key);
      if (i === 1) li.setAttribute('aria-current', 'step');

      var dot = document.createElement('span');
      dot.className = 'qf-rail-dot';
      dot.setAttribute('aria-hidden', 'true');

      var label = document.createElement('span');
      label.className = 'qf-rail-label';
      label.textContent = station.label;

      var val = document.createElement('span');
      val.className = 'qf-rail-value' + (i > 0 ? ' qf-rail-value-pending' : '');
      val.textContent = i === 0 ? (SERVICE_LABELS[service] || 'Service')
                      : (i === 1 ? 'Choose now' : '\u2014');

      li.appendChild(dot);
      li.appendChild(label);
      li.appendChild(val);
      railStations.appendChild(li);
    });
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
    // AYS Ola 4 Commit L HI-1/HI-2 — release all Mutation/Intersection observers
    // when we reach the success screen. The form is effectively done; no need
    // to keep watching invalid states, floater button props, or section activation.
    if (name === 'success') {
      try { disconnectAllObservers(); } catch (_) {}
      // Ola 3 — stop the "live counter" fake-social-proof ticker once the
      // user completes the flow. Otherwise it keeps updating an element
      // that's no longer visible, holding a closure alive.
      try { cancelLiveCounter(); } catch (_) {}
    }
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
      if (alinaEl) {
        // For 'both' the days screen captures only the cleaning schedule; a
        // separate porter-days screen follows. Lead with that context so the
        // client doesn't wonder why they'll pick days twice.
        if (STATE.service === 'both') {
          alinaEl.textContent = 'First, pick the days you want your space cleaned overnight. You\u2019ll choose porter days next.';
        } else {
          alinaEl.textContent = ALINA_S4_BY_SPACE[STATE.space] || ALINA_S4_BY_SPACE.Other;
        }
      }
      var s4title = document.getElementById('qfS4Title');
      if (s4title) renderS4Title(s4title, S4_TITLES[STATE.service] || S4_TITLES.unsure);
      setTimeout(syncDaysUI, 80);
    }

    // DP-days step — only reached in 'both' flow. The MutationObserver wired
    // inside the dpDays block below handles pre-selection + sync; here we
    // just refresh Alina's context copy based on what the client already
    // answered on the prior (cleaning) days screen.
    if (name === 'dpDays') {
      var dpAlinaEl = document.getElementById('qfAlinaSaysTextS4b');
      if (dpAlinaEl) {
        dpAlinaEl.textContent = (Array.isArray(STATE.days) && STATE.days.length)
          ? 'We pre-selected your cleaning days. Tap to adjust, or keep them if the porter schedule matches.'
          : 'A porter is on-site during business hours. Pick the days you need one.';
      }
    }

    // Size step — personalize Alina by space type when entering (covers
    // both forward navigation and scroll-back-into-view cases). For the
    // 'both' flow, prepend a note clarifying this size drives cleaning
    // pricing (not porter coverage) so the client doesn't second-guess.
    if (name === 'size' && STATE.space) {
      var sizeAlinaEl = getAlinaTextEl('size');
      if (sizeAlinaEl) {
        var base = ALINA_S3[STATE.space] || ALINA_S3.Other;
        sizeAlinaEl.textContent = STATE.service === 'both'
          ? 'This sizes your cleaning scope. ' + base
          : base;
      }
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

  // Ola 3 — re-entry guard. Screen transitions run an 800ms animation; rapid
  // double-clicks on Continue/Back previously queued two transitions whose
  // mid-flight DOM mutations could race. One pending transition at a time.
  // D26 — Reduced guard from 850ms → 400ms (matches the actual crossfade
  // duration). 850ms was over-cautious, made back-navigation feel laggy
  // and required users to double-click to actually advance/retreat.
  var _qfTransitioning = false;
  var _qfPendingNav = null; // {fn, args} of a nav request that arrived while locked
  function _qfGuardTransition() {
    if (_qfTransitioning) return false;
    _qfTransitioning = true;
    setTimeout(function () {
      _qfTransitioning = false;
      // D26 — flush any queued navigation. User clicked back/next while
      // the guard was still locked; honor that intent now instead of dropping.
      if (_qfPendingNav) {
        var p = _qfPendingNav;
        _qfPendingNav = null;
        try { p.fn(); } catch (_) {}
      }
    }, 400);
    return true;
  }

  function goNext() {
    if (!_qfGuardTransition()) {
      // D26 — queue. The guard releases in ≤400ms and will replay this call.
      _qfPendingNav = { fn: goNext };
      return;
    }
    var flow = getFlow();
    var idx = getStepIndex(STATE.currentStepName);
    if (idx < 0 || idx >= flow.length - 1) return;
    goToScreen(flow[idx + 1], 'fwd');
    saveDraft();
  }

  function goBack() {
    if (!_qfGuardTransition()) {
      // D26 — queue. The guard releases in ≤400ms and will replay this call.
      // Fixes the "have to click back twice" symptom on quick navigation.
      _qfPendingNav = { fn: goBack };
      return;
    }
    var flow = getFlow();
    var idx = getStepIndex(STATE.currentStepName);
    if (idx <= 0) return;
    var prevName = flow[idx - 1];
    var prevScreen = SCREENS[prevName];
    if (prevScreen) {
      // Actually swap which screen is .is-active. Without this the state
      // pointer moves but the user keeps seeing the current screen.
      goToScreen(prevName, 'back');
      updateRail();
      // AYS Ola 3 #24 — single read via getBoundingClientRect instead of
      // the offsetTop walking loop (which forced a layout flush on every
      // parent.offsetTop read, then another inside the RAF animation).
      var scrollTarget = prevScreen.querySelector('.qf-alina-says') || prevScreen;
      var targetRect = scrollTarget.getBoundingClientRect();
      var flowBarH = flowBar && !flowBar.hidden ? flowBar.offsetHeight : 0;
      var html = document.documentElement;
      var startY = html.scrollTop || window.scrollY;
      // rect.top is relative to viewport; add startY to get absolute, then subtract bar + gap
      var targetY = Math.max(0, targetRect.top + startY - flowBarH - 4);
      var diff = targetY - startY;
      if (Math.abs(diff) < 2) return;
      var prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      var startTime = null;
      requestAnimationFrame(function step(ts) {
        if (!startTime) startTime = ts;
        var p = Math.min((ts - startTime) / 500, 1);
        var e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
        // Single write per frame; no reads inside the loop.
        html.scrollTop = startY + diff * e;
        if (p < 1) requestAnimationFrame(step);
        else html.style.scrollBehavior = prevBehavior;
      });
    }
  }

  /* =======================================================================
     STEP 1 — WELCOME (Service selection)
     ======================================================================= */
  var supportsHover = window.matchMedia('(hover: hover)').matches;

  if (SCREENS.welcome) {
    // V2 2026-04-25 — service cards selected by [data-service]. The new
    // .qf2-card uses the same attribute so this delegated query catches both
    // the V2 cards and any back-compat ones.
    SCREENS.welcome.querySelectorAll('[data-service]').forEach(function (card) {
      card.addEventListener('click', function () {
        // D51 — same double-tap guard as size + space cards.
        if (card.dataset.qfBusy === '1') return;
        card.dataset.qfBusy = '1';
        setTimeout(function () { card.dataset.qfBusy = ''; }, 250);

        var pickedService = card.getAttribute('data-service');
        // 2026-04-25 · If the resume banner is up, the user is visually on
        // welcome but STATE.currentStepName still points at whatever step
        // their saved draft reached. Calling goNext() from a late step
        // (e.g. 'contact') silently no-ops because idx >= flow.length-1,
        // so the click looked dead. Treat any service-card click on
        // welcome as "start fresh with this service": dismiss the banner,
        // clear the draft, reset the step pointer, and surface a toast so
        // the user sees their click took effect.
        var resumeBanner = document.querySelector('.qf-resume-banner');
        if (resumeBanner) {
          try { clearDraft(); } catch(e){}
          resumeBanner.remove();
          var label = SERVICE_LABELS[pickedService] || 'your plan';
          try {
            qfToast({
              type: 'success',
              title: 'Starting fresh',
              message: 'New quote with ' + label + '. Your previous answers were cleared.',
              duration: 3500
            });
          } catch(e){}
        }
        STATE.service = pickedService;
        STATE.currentStepName = 'welcome';
        buildRail(STATE.service);
        goNext();
      });
    });

    // V2 2026-04-25 — "Not sure?" mini-quiz. The toggle expands a panel with
    // 3 chips; each chip recommends a service, sets serviceCertainty so CRM
    // knows the lead was guided, and routes after a brief confirmation pause.
    var qf2QuizToggle = document.getElementById('qf2QuizToggle');
    var qf2QuizPanel  = document.getElementById('qf2QuizPanel');
    var qf2QuizResult = document.getElementById('qf2QuizResult');
    var qf2QuizResultName = document.getElementById('qf2QuizResultName');
    var qf2QuizResultBlurb = document.getElementById('qf2QuizResultBlurb');
    var qf2QuizChips = qf2QuizPanel ? qf2QuizPanel.querySelectorAll('.qf2-quiz-chip') : [];

    if (qf2QuizToggle && qf2QuizPanel) {
      qf2QuizToggle.addEventListener('click', function () {
        var open = !qf2QuizPanel.hidden;
        qf2QuizPanel.hidden = open;
        qf2QuizToggle.setAttribute('aria-expanded', String(!open));
        if (!open) {
          var first = qf2QuizPanel.querySelector('.qf2-quiz-chip');
          if (first) first.focus();
        }
      });
    }

    if (qf2QuizChips.length) {
      var QF2_QUIZ_LABELS = {
        janitorial: { name: 'Janitorial', blurb: '· recurring cleaning after hours.' },
        dayporter:  { name: 'Day Porter', blurb: '· on-site during business hours.' },
        both:       { name: 'Combined',   blurb: '· day porter + janitorial.' }
      };
      qf2QuizChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var pick = chip.getAttribute('data-quiz-pick');
          if (!pick) return;
          // Visually mark the picked chip + clear siblings.
          qf2QuizChips.forEach(function (c) { c.classList.toggle('is-selected', c === chip); });

          // Same defensive flow as the service-card handler: a stale resume
          // banner means STATE.currentStepName still points at a late step
          // from the prior draft, so goNext() would no-op. Treat the quiz
          // pick as a fresh start when the banner is up.
          var resumeBanner = document.querySelector('.qf-resume-banner');
          if (resumeBanner) {
            try { clearDraft(); } catch(e){}
            resumeBanner.remove();
          }

          STATE.service = pick;
          STATE.serviceCertainty = 'guided_via_quiz';
          STATE.currentStepName = 'welcome';

          // Show the recommendation via textContent (XSS-safe).
          if (qf2QuizResult && qf2QuizResultName && qf2QuizResultBlurb) {
            var meta = QF2_QUIZ_LABELS[pick] || { name: pick, blurb: '' };
            qf2QuizResultName.textContent = meta.name;
            qf2QuizResultBlurb.textContent = meta.blurb;
            qf2QuizResult.hidden = false;
          }

          buildRail(STATE.service);
          // Brief pause so the user reads the recommendation before transition.
          setTimeout(function () { goNext(); }, 600);
        });
      });
    }
  }

  /* =======================================================================
     INFO step — Name + Email + Phone capture (with validation)
     ======================================================================= */
  // AYS Ola 3 #6 — strict email regex. MUST match functions/api/submit-quote.js
  // EMAIL_RE byte-for-byte. Rejects `..user@`, `user..x@`, `user@-domain.com`,
  // and trailing-hyphen domains. Client-first validation matches server so
  // users see errors before a round-trip.
  var EMAIL_RE = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?!-)[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;
  // AYS Ola 3 #31 — disposable-email block list. Soft warning only — some legit
  // users forward to aliases, so we warn but don't block.
  //
  // LAST_REVIEWED: 2026-04-20 (Ola 5). Review quarterly. When refreshing, cross-
  // check against https://github.com/disposable-email-domains/disposable-email-domains
  // (MIT-licensed community list). Expected growth: ~5-10 domains per quarter.
  // Adding more than the top-100 hurts first-load cost without preventing real
  // fraud — bots that rotate domains beat any static list anyway.
  // Ola 3 — migrated Array → Set for O(1) domain lookup on every email blur.
  // Previous Array.indexOf was O(n); called repeatedly during live typing
  // via the blur listener. Also removed `mail.tm` per UX audit: it's widely
  // used for legitimate B2B alias forwarding by contractors/freelancers, and
  // blocking it produced false-positive abandonments without meaningfully
  // reducing spam (rotating bots beat static lists anyway).
  var DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com','tempmail.com','10minutemail.com','10minutemail.net','throwaway.email','guerrillamail.com',
    'guerrillamail.net','guerrillamail.info','guerrillamailblock.com','yopmail.com','fakeinbox.com','trashmail.com',
    'trashmail.de','temp-mail.org','temp-mail.io','tempmailo.com','tempail.com','maildrop.cc','mailnesia.com',
    'sharklasers.com','dispostable.com','getairmail.com','mohmal.com','harakirimail.com','spam4.me','mytemp.email',
    'emailondeck.com','moakt.com','mail-temporaire.fr','mailtothis.com','mytrashmail.com','jetable.org',
    'throwam.com','tempomail.org','mailcatch.com','getnada.com','nada.email','burnermail.io','anonbox.net',
    'mailexpire.com','spambox.us','throwawaymail.com','incognitomail.org','einrot.com','dropmail.me',
    'mintemail.com','inboxbear.com','tempinbox.com','tmail.ws','tmailinator.com','email-fake.com','emltmp.com',
    'mohmal.in','mohmal.net','disposablemail.com','eyepaste.com','mailnull.com','mytempemail.com',
    'spamgourmet.com','spambog.com','spambog.de','tempemail.net','tempemail.com','temporarymailbox.com',
    'temp-mail.ru','tempmail.ninja','10minutesmail.com','30minutemail.com','fake-mail.net','fake-mail.ml',
    'fakeinformation.com','harakirimail.jp','sendspamhere.com','spamherelots.com','spamex.com','spamfree24.com',
    'spammotel.com','spamify.com','temporaryemail.net','trash-mail.com','trashdevil.com','trbvm.com',
    'wegwerfemail.com','wegwerfmail.de','wegwerfmail.net','wegwerfmail.org','wh4f.org','yopmail.fr','yopmail.net',
    // 2026 Q2 additions — removed `mail.tm` (legit B2B forwarding). Kept pure-spam providers only.
    'tempmail.plus','inboxkitten.com','linshiyouxiang.net','emailfake.com','tempail.top',
    'tempr.email','minuteinbox.com','luxusmail.org','sute.jp','gufum.com','trashmail.ws'
  ]);
  function isDisposableEmail(e) {
    var m = /@([^@]+)$/.exec((e || '').toLowerCase());
    return m ? DISPOSABLE_EMAIL_DOMAINS.has(m[1]) : false;
  }

  // Ola 3 — client-side typo detection for the top misspellings of common
  // providers. Catches ~25% of what would otherwise fail on server round-trip
  // ("please try again" 3s later) and the user corrects in one tap.
  var EMAIL_TYPO_MAP = {
    'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gnail.com': 'gmail.com',
    'gamil.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.con': 'gmail.com',
    'hotmai.com': 'hotmail.com', 'hotnail.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com', 'hotmail.cm': 'hotmail.com',
    'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahou.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com', 'yahoo.cm': 'yahoo.com',
    'outlok.com': 'outlook.com', 'outloook.com': 'outlook.com', 'outloock.com': 'outlook.com',
    'outlook.co': 'outlook.com', 'outlook.cm': 'outlook.com',
    'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com', 'icoud.com': 'icloud.com',
    'aol.co': 'aol.com', 'aoll.com': 'aol.com'
  };
  function suggestEmailCorrection(email) {
    var m = /^([^@]+)@([^@]+)$/.exec((email || '').toLowerCase());
    if (!m) return null;
    var domain = m[2];
    if (!EMAIL_TYPO_MAP[domain]) return null;
    return m[1] + '@' + EMAIL_TYPO_MAP[domain];
  }
  // Phone: must have at least 10 digits once stripped of formatting; accepts (, ), -, ., +, space.
  // Ola 3 — removed 'x' from allowed chars. Previously 'x' passed the regex but
  // normalizePhone silently dropped it, so the extension vanished without the
  // user knowing. Now `555-1234 x123` fails validation loudly with a clear
  // "digits only" hint, prompting the user to put extensions in the notes field.
  var PHONE_ALLOWED_RE = /^[\d\s\-\+\(\)\.]{10,25}$/;
  function normalizePhone(v) { return (v || '').replace(/[^\d]/g, ''); }
  function isValidPhone(v) {
    if (!v) return true; // optional
    if (!PHONE_ALLOWED_RE.test(v)) return false;
    var digits = normalizePhone(v);
    return digits.length >= 10 && digits.length <= 15;
  }
  // Name normalizer — collapses internal runs of whitespace (tabs, newlines,
  // multiple spaces) to a single space and trims. Applied to first/last name
  // wherever the user can type into the form (info step + review edit panel).
  // Company names keep internal spacing intact since "A.T. & T." style names
  // can legitimately have double spaces/periods.
  function cleanName(v) { return ((v == null) ? '' : String(v)).replace(/\s+/g, ' ').trim(); }
  function showInfoError(msg, offendingEl) {
    var errEl = document.getElementById('qfInfoErr');
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    if (offendingEl) {
      offendingEl.classList.add('qf-input-invalid');
      // Ola 8 — wire aria-describedby so screen readers announce the error
      // message in context with the input, not as an orphaned live-region
      // update 50ms later. We also set aria-invalid for AT that relies on
      // that semantic instead of the visual class.
      offendingEl.setAttribute('aria-describedby', 'qfInfoErr');
      offendingEl.setAttribute('aria-invalid', 'true');
      offendingEl.focus();
    }
  }
  function clearInfoError() {
    var errEl = document.getElementById('qfInfoErr');
    if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
    // Ola 8 — clear across ALL info-step inputs (was 3, missed last name
    // and company). Also strip the aria-describedby + aria-invalid that
    // showInfoError attached so the SR doesn't keep announcing a stale
    // error after the user corrected the field.
    ['qfUserFirstName','qfUserLastName','qfUserEmail','qfUserPhone','qfUserCompany'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove('qf-input-invalid');
        el.removeAttribute('aria-describedby');
        el.removeAttribute('aria-invalid');
      }
    });
  }
  if (SCREENS.info) {
    // V2 — error display. Falls back to legacy showInfoError if the V2 element
    // doesn't exist (e.g. on dayporter/both/unsure flows that still use v1 HTML).
    var qf2InfoErr = document.getElementById('qf2InfoErr');
    function qf2ShowInfoErr(msg, focusEl) {
      if (qf2InfoErr) {
        qf2InfoErr.textContent = msg;
        qf2InfoErr.hidden = false;
      } else {
        showInfoError(msg, focusEl);
      }
      if (focusEl) {
        try { focusEl.focus(); focusEl.classList.add('qf-input-invalid'); } catch(e){}
      }
    }
    function qf2ClearInfoErr() {
      if (qf2InfoErr) qf2InfoErr.hidden = true;
      else clearInfoError();
      ['qfUserFirstName','qfUserLastName','qfUserEmail','qfUserPosition'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.classList.remove('qf-input-invalid');
      });
    }

    var emailField = document.getElementById('qfUserEmail');
    if (emailField) {
      emailField.addEventListener('blur', function () {
        var val = emailField.value.trim();
        if (!val) { qf2ClearInfoErr(); return; }
        // Sprint 4a D16 — full live validation on blur (was format-only).
        // Format → typo suggestion → disposable inbox. All run before Continue
        // click so users get inline feedback as they leave the field.
        if (!EMAIL_RE.test(val)) {
          qf2ShowInfoErr("Hmm, that email doesn't look right. Double-check?", emailField);
          return;
        }
        var typo = (typeof suggestEmailCorrection === 'function') ? suggestEmailCorrection(val) : null;
        if (typo) {
          qf2ShowInfoErr('Did you mean ' + typo + '? Tap to fix it.', emailField);
          return;
        }
        if (typeof isDisposableEmail === 'function' && isDisposableEmail(val)) {
          qf2ShowInfoErr("Need a real inbox so I can deliver your proposal.", emailField);
          return;
        }
        qf2ClearInfoErr();
      });
      emailField.addEventListener('input', qf2ClearInfoErr);
    }
    ['qfUserFirstName','qfUserLastName','qfUserPosition'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', qf2ClearInfoErr);
    });

    var infoContinueBtn = document.getElementById('qfInfoContinue');
    if (infoContinueBtn) {
      infoContinueBtn.addEventListener('click', function () {
        var firstName = document.getElementById('qfUserFirstName');
        var lastName  = document.getElementById('qfUserLastName');
        var email     = document.getElementById('qfUserEmail');
        var position  = document.getElementById('qfUserPosition');

        qf2ClearInfoErr();

        var fnVal  = firstName ? cleanName(firstName.value) : '';
        var lnVal  = lastName  ? cleanName(lastName.value)  : '';
        var emVal  = email     ? email.value.trim()         : '';
        var posVal = position  ? position.value.trim()      : '';

        if (!fnVal) { qf2ShowInfoErr("I'll need your first name to send your quote.", firstName); return; }
        if (!lnVal) { qf2ShowInfoErr("And your last name, keeps the records tidy.", lastName); return; }
        if (!emVal) { qf2ShowInfoErr("Drop me your email so I can send the quote over.", email); return; }
        if (!EMAIL_RE.test(emVal)) { qf2ShowInfoErr("Hmm, that email doesn't look right. Double-check?", email); return; }
        var typoSuggestion = suggestEmailCorrection(emVal);
        if (typoSuggestion) { qf2ShowInfoErr('Did you mean ' + typoSuggestion + '? Tap to fix it.', email); return; }
        if (isDisposableEmail(emVal)) { qf2ShowInfoErr("Need a real inbox so I can deliver your proposal.", email); return; }
        // Sprint 2 D13 — role is now optional. Owners, restaurateurs, school
        // administrators, and other non-FM buyers shouldn't be gated on a
        // free-text role field. STATE.userPosition stays empty when blank;
        // Review/Snapshot already omits the row gracefully when empty.
        if (posVal.length > 80) posVal = posVal.slice(0, 80);

        STATE.userName     = fnVal;
        STATE.userLastName = lnVal;
        STATE.userEmail    = emVal;
        STATE.userPosition = posVal;

        // Personalize Alina for the next step
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

    // V2 — Back arrow + Save for later in the V2 flowbar
    SCREENS.info.querySelectorAll('[data-qf2-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goBack(); });
    });
    SCREENS.info.querySelectorAll('.qf2-flowbar-skip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveDraft();
        try { var orig = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function(){ btn.textContent = orig; }, 1800); } catch(e){}
      });
    });
  }

  /* =======================================================================
     LOCATION step — Company name + Address
     ======================================================================= */
  // Ola 9 — lazy-load Google Places. Previously loaded via a static <script
  // async defer> in the head, forcing ~220KB on every page view even if the
  // user never reached the address step. Now: inject the script the first
  // time the address field gets focus. The inline `window.qfInitPlaces`
  // callback defined in quote.html runs once the library finishes loading.
  (function wireLazyPlaces() {
    var addr = document.getElementById('qfAddress');
    if (!addr) return;
    var GOOGLE_MAPS_KEY = 'AIzaSyBFGpnMAmgg3SGpLrcMKp5_N9DoOEVWJXg';
    var PLACES_SRC = 'https://maps.googleapis.com/maps/api/js?key=' +
      encodeURIComponent(GOOGLE_MAPS_KEY) +
      '&libraries=places&callback=qfInitPlaces&loading=async';
    var loaded = false;
    function loadPlaces() {
      if (loaded) return;
      loaded = true;
      var s = document.createElement('script');
      s.src = PLACES_SRC;
      s.async = true;
      s.defer = true;
      s.onerror = function () {
        // Match the previous inline onerror behaviour — form still works,
        // just without autocomplete.
        try { console.warn('[quote] Google Places failed to load; manual address entry only.'); } catch (_) {}
      };
      document.head.appendChild(s);
    }
    // Load on first focus, or if the user starts typing before focus fires
    // (keyboard-paste into an unfocused field is rare but possible).
    addr.addEventListener('focus', loadPlaces, { once: true });
    addr.addEventListener('input', loadPlaces, { once: true });
  })();

  if (SCREENS.location) {
    var locationContinueBtn = document.getElementById('qfLocationContinue');
    if (locationContinueBtn) {
      // V2 — error display via dedicated qf2LocErr element (falls back to legacy if missing).
      var qf2LocErr = document.getElementById('qf2LocErr');
      var showLocErr = function (msg, el) {
        if (qf2LocErr) {
          qf2LocErr.textContent = msg;
          qf2LocErr.hidden = false;
        }
        if (el) { try { el.classList.add('qf-input-invalid'); el.focus(); } catch(e){} }
      };
      var clearLocErr = function () {
        if (qf2LocErr) { qf2LocErr.textContent = ''; qf2LocErr.hidden = true; }
        ['qfCompanyName','qfAddress'].forEach(function(id){
          var el = document.getElementById(id);
          if (el) el.classList.remove('qf-input-invalid');
        });
      };
      var locAddrField = document.getElementById('qfAddress');
      var locCompanyField = document.getElementById('qfCompanyName');
      if (locAddrField) locAddrField.addEventListener('input', clearLocErr);
      if (locCompanyField) locCompanyField.addEventListener('input', clearLocErr);

      locationContinueBtn.addEventListener('click', function () {
        var companyInput = document.getElementById('qfCompanyName');
        var addressInput = document.getElementById('qfAddress');
        var companyVal = companyInput ? companyInput.value.trim() : '';
        var addr = addressInput ? addressInput.value.trim() : '';

        if (!companyVal) {
          showLocErr("Whose space are we cleaning? (Even your own name works ~)", companyInput);
          return;
        }
        if (companyVal.length > 120) companyVal = companyVal.slice(0, 120);

        if (!addr) {
          showLocErr('Please enter your address or ZIP code so we can match you with the right local team.', addressInput);
          return;
        }
        var isZip = /^\s*\d{5}(-\d{4})?\s*$/.test(addr);
        var hasStreetShape = addr.length >= 6 && /\d/.test(addr) && /[A-Za-z]{2,}/.test(addr);
        if (!isZip && !hasStreetShape) {
          var digitsOnly = /^\s*\d+\s*$/.test(addr);
          var msg;
          if (digitsOnly) {
            var n = addr.replace(/\D/g, '').length;
            msg = 'A US ZIP code is 5 digits (you entered ' + n + '). Try your full ZIP or a street address.';
          } else {
            msg = 'Include a street number + name or a 5-digit ZIP (e.g. "10001" or "350 5th Ave").';
          }
          showLocErr(msg, addressInput);
          return;
        }
        clearLocErr();
        STATE.companyName = companyVal;
        STATE.userAddress = addr;
        // V2 — capture optional suite/floor
        var suiteInput = document.getElementById('qfSuite');
        STATE.userSuite = suiteInput ? suiteInput.value.trim().slice(0, 60) : '';
        setRailValue('location', STATE.userAddress || STATE.companyName || 'Done');
        goNext();
      });
    }

    // V2 — Back arrow + Save for later in the V2 flowbar
    SCREENS.location.querySelectorAll('[data-qf2-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goBack(); });
    });
    SCREENS.location.querySelectorAll('.qf2-flowbar-skip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveDraft();
        try { var orig = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function(){ btn.textContent = orig; }, 1800); } catch(e){}
      });
    });

    // V2 — Atypical schedule heads-up (mockup G demo G). When the user
    // reaches the Location step and STATE.scheduleAtypical is set, inject
    // an Alina mini-bubble at the top of the body warning them that we'll
    // double-check the schedule. Idempotent — only injects once per visit.
    var locObserver = registerObserver(new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.target === SCREENS.location && SCREENS.location.classList.contains('is-active')) {
          renderAtypicalHeadsUp();
        }
      });
    }));
    locObserver.observe(SCREENS.location, { attributes: true, attributeFilter: ['class'] });

    function renderAtypicalHeadsUp() {
      var body = SCREENS.location.querySelector('.qf2-body');
      if (!body) return;
      var existing = body.querySelector('.qf2-atypical-heads-up');
      if (existing) existing.remove();
      if (!STATE.scheduleAtypical) return;
      var SPACE_LABEL = { Office: 'Office', Medical: 'Medical', Restaurant: 'Restaurant' };
      var TIME_LABEL = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible' };
      var sp = SPACE_LABEL[STATE.space] || (STATE.space || 'this space');
      var t = (STATE.timeOfDay && STATE.timeOfDay.length === 1) ? TIME_LABEL[STATE.timeOfDay[0]] : 'this schedule';
      var bubble = document.createElement('div');
      bubble.className = 'qf2-atypical-heads-up';
      var ava = document.createElement('div');
      ava.className = 'qf2-atypical-heads-up-avatar';
      var img = document.createElement('img');
      img.src = 'images/alina-avatar-96.jpg';
      img.alt = '';
      img.width = 26; img.height = 26;
      ava.appendChild(img);
      var text = document.createElement('div');
      text.className = 'qf2-atypical-heads-up-text';
      text.textContent = sp + ' + ' + t + " is a bit unusual. Most " + sp.toLowerCase() + "s clean evenings or after hours. I'll double-check with you when I prepare the quote, no worries ~";
      bubble.appendChild(ava);
      bubble.appendChild(text);
      // Insert after the prompt
      var prompt = body.querySelector('.qf2-prompt');
      if (prompt) prompt.insertAdjacentElement('afterend', bubble);
      else body.insertBefore(bubble, body.firstChild);
    }

    // V2 — Out-of-area warning (mockup G demo F). On address blur, detect
    // non-NYC inputs (NJ/CT/PA/etc) and show an Alina warning bubble with
    // "Yes, waitlist me" and "Continue anyway" actions.
    var addrField = document.getElementById('qfAddress');
    var fieldsWrap = SCREENS.location.querySelector('.qf2-fields');
    function isOutOfNYC(addr) {
      if (!addr) return false;
      var lower = addr.toLowerCase();
      // Detect explicit non-NY state mentions or borough/city outside NYC
      var outStates = /\b(nj|new jersey|ct|connecticut|pa|pennsylvania|jersey city|hoboken|newark|stamford|yonkers|white plains|long island|nassau|suffolk)\b/i;
      if (outStates.test(lower)) return true;
      // ZIP detection: NYC ZIPs are 100xx-104xx + 11xxx (Brooklyn/Queens/SI). Outside = different.
      var zipMatch = lower.match(/\b(\d{5})(?:-\d{4})?\b/);
      if (zipMatch) {
        var zip = parseInt(zipMatch[1], 10);
        // NYC-area ZIPs: 10000-10499 (Manhattan/Bronx), 11000-11499 (Brooklyn/Queens/SI)
        if (zip >= 10000 && zip <= 10499) return false;
        if (zip >= 11000 && zip <= 11499) return false;
        return true;
      }
      return false;
    }
    function renderOutOfArea() {
      if (!fieldsWrap) return;
      var existing = SCREENS.location.querySelector('.qf2-out-of-area');
      if (existing) existing.remove();
      if (!addrField || !isOutOfNYC(addrField.value)) return;
      var bubble = document.createElement('div');
      bubble.className = 'qf2-out-of-area';
      var ava = document.createElement('div');
      ava.className = 'qf2-out-of-area-avatar';
      var img = document.createElement('img');
      img.src = 'images/alina-avatar-96.jpg';
      img.alt = '';
      img.width = 26; img.height = 26;
      ava.appendChild(img);
      var text = document.createElement('div');
      text.className = 'qf2-out-of-area-text';
      var hand = document.createElement('span');
      hand.className = 'qf2-hand';
      hand.textContent = 'Hmm —';
      text.appendChild(hand);
      text.appendChild(document.createTextNode(" that's outside NYC. Want me to add you to the waitlist?"));
      var actions = document.createElement('div');
      actions.className = 'qf2-out-of-area-actions';
      var yesBtn = document.createElement('button');
      yesBtn.type = 'button';
      yesBtn.className = 'qf2-primary';
      yesBtn.textContent = 'Yes, waitlist me';
      var noBtn = document.createElement('button');
      noBtn.type = 'button';
      noBtn.textContent = 'Continue anyway';
      yesBtn.addEventListener('click', function () {
        STATE.outOfArea = 'waitlist';
        bubble.remove();
      });
      noBtn.addEventListener('click', function () {
        STATE.outOfArea = 'continue';
        bubble.remove();
      });
      actions.appendChild(yesBtn);
      actions.appendChild(noBtn);
      text.appendChild(actions);
      bubble.appendChild(ava);
      bubble.appendChild(text);
      fieldsWrap.insertAdjacentElement('afterend', bubble);
    }
    if (addrField) {
      addrField.addEventListener('blur', renderOutOfArea);
    }
  }

  /* =======================================================================
     STEP 3 — SPACE TYPE
     ======================================================================= */
  if (SCREENS.space) {
    var qf2SpaceCards = SCREENS.space.querySelectorAll('.qf2-card[data-space], .qf-service-card[data-space]');
    var qf2SpaceOtherWrap = document.getElementById('qf2SpaceOtherWrap');
    var qf2SpaceOther     = document.getElementById('qf2SpaceOther');
    var qf2SpaceOtherErr  = document.getElementById('qf2SpaceOtherErr');
    var qf2SpaceOtherHelp = document.getElementById('qf2SpaceOtherHelper');
    var qf2SpaceContinue  = document.getElementById('qf2SpaceContinue');

    function qf2AdvanceFromSpace() {
      // Capture email if user typed it inline anywhere (back-compat).
      var emailInput = document.getElementById('qfUserEmail');
      if (emailInput && emailInput.value.trim()) STATE.userEmail = emailInput.value.trim();

      var rail = STATE.space === 'Other' && STATE.spaceOther ? STATE.spaceOther : STATE.space;
      setRailValue('space', rail);

      var flow = getFlow();
      var nextStep = flow[flow.indexOf('space') + 1];
      if (nextStep === 'size') {
        var alinaSize = getAlinaTextEl('size');
        if (alinaSize) alinaSize.textContent = ALINA_S3[STATE.space] || ALINA_S3.Office;
      } else if (nextStep === 'days') {
        var alinaDays = getAlinaTextEl('days');
        if (alinaDays) alinaDays.textContent = ALINA_S4_BY_SPACE[STATE.space] || ALINA_S4_BY_SPACE.Other;
        var s4title = document.getElementById('qfS4Title');
        if (s4title) renderS4Title(s4title, S4_TITLES[STATE.service] || S4_TITLES.unsure);
      }
      goNext();
    }

    qf2SpaceCards.forEach(function (card) {
      card.addEventListener('click', function () {
        // D51 — same double-tap guard as size cards. A fat-finger second click
        // during the 400ms transition window could otherwise queue a second
        // advance and skip the next screen.
        if (card.dataset.qfBusy === '1') return;
        card.dataset.qfBusy = '1';
        setTimeout(function () { card.dataset.qfBusy = ''; }, 250);

        STATE.space = card.getAttribute('data-space');

        // Visual selection: clear all + mark this one
        qf2SpaceCards.forEach(function (c) {
          c.classList.toggle('is-selected', c === card);
          c.setAttribute('aria-pressed', String(c === card));
        });

        // D9 — picking any of the 6 cards clears the catch-all input + advances.
        STATE.spaceOther = '';
        if (qf2SpaceOther) qf2SpaceOther.value = '';
        if (qf2SpaceOtherHelp) qf2SpaceOtherHelp.hidden = true;
        if (qf2SpaceOtherErr) qf2SpaceOtherErr.hidden = true;
        if (qf2SpaceContinue) qf2SpaceContinue.hidden = true;

        qf2AdvanceFromSpace();
      });
    });

    if (qf2SpaceOther) {
      qf2SpaceOther.addEventListener('input', function () {
        var v = qf2SpaceOther.value.trim();
        STATE.spaceOther = v.slice(0, 120);
        if (qf2SpaceOtherErr) qf2SpaceOtherErr.hidden = true;
        if (qf2SpaceOtherHelp) qf2SpaceOtherHelp.hidden = !(v.length >= 3);
        // D9 — show Continue once user has typed enough; clear card selection
        // since the user is overriding the 6-card grid with a custom space.
        if (qf2SpaceContinue) qf2SpaceContinue.hidden = !(v.length >= 3);
        if (v.length >= 3) {
          qf2SpaceCards.forEach(function (c) {
            c.classList.remove('is-selected');
            c.setAttribute('aria-pressed', 'false');
          });
        }
      });
      qf2SpaceOther.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && qf2SpaceContinue) {
          e.preventDefault();
          qf2SpaceContinue.click();
        }
      });
    }

    if (qf2SpaceContinue) {
      qf2SpaceContinue.addEventListener('click', function () {
        var v = (qf2SpaceOther && qf2SpaceOther.value || '').trim();
        if (v.length < 3) {
          if (qf2SpaceOtherErr) {
            qf2SpaceOtherErr.textContent = "A few more letters so I know what we're walking into.";
            qf2SpaceOtherErr.hidden = false;
          }
          if (qf2SpaceOther) qf2SpaceOther.focus();
          return;
        }
        // D9 — Continue from the catch-all input. No "Other" card exists in the
        // grid anymore, so set STATE.space here.
        STATE.space = 'Other';
        STATE.spaceOther = v.slice(0, 120);
        qf2AdvanceFromSpace();
      });
    }

    // V2 — Back arrow on flow-bar (delegated to any [data-qf2-back] in space).
    SCREENS.space.querySelectorAll('[data-qf2-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goBack(); });
    });

    // V2 — Save for later (delegated to any .qf2-flowbar-skip in space).
    SCREENS.space.querySelectorAll('.qf2-flowbar-skip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveDraft();
        // Match the pattern used on every other screen: capture the original
        // label so the mobile/desktop variants ("Save" vs "Save for later")
        // both restore correctly instead of being clobbered to one string.
        try { var orig = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function(){ btn.textContent = orig; }, 1800); } catch(e){}
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
      if (s4title) renderS4Title(s4title, S4_TITLES[STATE.service] || S4_TITLES.unsure);

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
        if (n < 100) { showSizeErr('Sizes under 100 sq ft look unusual. Pick a range instead?'); return; }
        if (n > 1000000) {
          // Ola 5 — previously a blocking "try smaller" without giving the
          // user a next step. Facilities over 1M sq ft are legitimately
          // common for campuses, so we route them to a direct call instead
          // of losing the lead outright.
          showSizeErr('For facilities over 1M sq ft, let\u2019s chat directly. Call (646) 303-0816 or email info@eccofacilities.com and we\u2019ll tailor a custom quote.');
          return;
        }
        clearSizeErr();
        STATE.sizeExact = Math.round(n);
        proceedFromSize(Math.round(n) + 'sqft');
        sizeInput.style.borderColor = '';
      });
      sizeInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sizeSubmit.click(); }
      });
      sizeInput.addEventListener('input', function () { sizeInput.style.borderColor = ''; clearSizeErr(); });
    }

    // V2 mockup G — additional handlers for the rebuilt size screen.
    var qf2SizeCards = SCREENS.size.querySelectorAll('.qf2-size-card[data-size]');
    var qf2WalkHint = document.getElementById('qf2WalkHint');
    var qf2SizeContinue = document.getElementById('qf2SizeContinue');

    qf2SizeCards.forEach(function (card) {
      card.addEventListener('click', function () {
        // D51 — debounce rapid double-taps. Without this guard a fat-finger
        // double-click could queue a second proceedFromSize while the first
        // transition was in flight, with the second resolving against a
        // changed currentStepName and skipping a step. Same pattern day chips
        // already use (line 2324).
        if (card.dataset.qfBusy === '1') return;
        card.dataset.qfBusy = '1';
        setTimeout(function () { card.dataset.qfBusy = ''; }, 250);

        qf2SizeCards.forEach(function (c) {
          c.classList.toggle('is-selected', c === card);
          c.setAttribute('aria-pressed', String(c === card));
        });
        if (sizeInput) { sizeInput.value = ''; sizeInput.classList.remove('has-value'); }
        if (qf2WalkHint) qf2WalkHint.hidden = true;
        STATE.sizeExact = null;
        var s = card.getAttribute('data-size');
        // Sprint 2 D14 — also flag 12K+ enterprise as needing a site walk; that
        // bucket's pricing is too variable to quote without visiting.
        if (s === 'visit_required' || s === '12k-plus') STATE.needsSiteWalk = true;
        proceedFromSize(s);
      });
    });

    // Numeric input — toggle walk hint when > 15K + mute size cards
    // (numeric exclusivity per mockup G section 09 demo E)
    if (sizeInput) {
      sizeInput.addEventListener('input', function () {
        var n = Number(sizeInput.value.replace(/,/g, '')) || 0;
        var hasValue = n > 0;
        sizeInput.classList.toggle('has-value', hasValue);
        qf2SizeCards.forEach(function (c) {
          c.classList.toggle('is-deselected', hasValue);
          c.classList.remove('is-selected');
          c.setAttribute('aria-pressed', 'false');
        });
        if (qf2WalkHint) qf2WalkHint.hidden = !(n > 15000);
        STATE.needsSiteWalk = (n > 15000);
      });
    }

    // Sprint 5 D23 — V2 Continue button validates numeric input directly.
    // Was delegating to legacy `sizeSubmit` (#qfSizeSubmit), an element that
    // doesn't exist in the V2 markup, so the chain silently failed and the
    // Continue button did nothing when the user typed sq ft. Validate inline
    // and advance via proceedFromSize.
    //
    // D50 — Continue also has to honor a previously-selected SIZE CARD.
    // Previous behavior: if the user picked a card, advanced, then came
    // back to Size and clicked Continue (with no number typed), the
    // handler returned early at `if (!val) return;` and the form looked
    // stuck. Now: if a card is selected and the input is empty, advance
    // with that card's data-size value.
    if (qf2SizeContinue && sizeInput) {
      qf2SizeContinue.addEventListener('click', function () {
        var val = sizeInput.value.trim();

        // D50 — empty input → fall back to the selected card. If neither
        // is set, prompt the user to pick something rather than silently
        // returning.
        if (!val) {
          var selectedCard = SCREENS.size.querySelector('.qf2-size-card.is-selected[data-size]');
          if (selectedCard) {
            var s = selectedCard.getAttribute('data-size');
            if (s === 'visit_required' || s === '12k-plus') STATE.needsSiteWalk = true;
            STATE.sizeExact = null;
            proceedFromSize(s);
            return;
          }
          // Neither: show inline guidance + focus input.
          if (typeof showSizeErr === 'function') showSizeErr('Pick a size range or enter your sq ft to continue.');
          sizeInput.focus();
          return;
        }

        var n = Number(val.replace(/,/g, ''));
        if (isNaN(n) || n < 100) {
          if (typeof showSizeErr === 'function') showSizeErr('Please enter a number 100 sq ft or larger.');
          sizeInput.focus();
          return;
        }
        if (n > 1000000) {
          if (typeof showSizeErr === 'function') showSizeErr('For facilities over 1M sq ft, let’s chat directly. Call (646) 303-0816 or email info@eccofacilities.com.');
          return;
        }
        STATE.sizeExact = Math.round(n);
        STATE.needsSiteWalk = (n > 15000);
        proceedFromSize(Math.round(n) + 'sqft');
      });
      // Enter on the numeric input → advance via the V2 Continue handler.
      sizeInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          qf2SizeContinue.click();
        }
      });
    }

    // V2 — Back arrow + Save for later in the V2 flowbar
    SCREENS.size.querySelectorAll('[data-qf2-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goBack(); });
    });
    SCREENS.size.querySelectorAll('.qf2-flowbar-skip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveDraft();
        try { var orig = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function(){ btn.textContent = orig; }, 1800); } catch(e){}
      });
    });
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

    // D49 — Continue requires BOTH ≥1 day AND ≥1 time window selected.
    // Previously the form auto-defaulted to ['flexible'] when no time chip
    // was picked; user feedback: "deja avanzar sin necesidad de seleccionar
    // un gap para la limpieza". Now the time cluster is a real gate.
    var anyTimeSelected = SCREENS.days
      ? SCREENS.days.querySelectorAll('.qf2-chip-time.is-selected').length > 0
      : false;
    if (daysContinueBtn) {
      daysContinueBtn.disabled = STATE.days.length === 0 || !anyTimeSelected;
    }

    // D18 Sprint 4c — gate the time cluster until at least one day is picked.
    // Reduces initial visible-decision count on Step 5 from 14 to 10.
    var timeCluster = document.getElementById('qf2TimeCluster');
    if (timeCluster) {
      timeCluster.setAttribute('data-gated', STATE.days.length === 0 ? '1' : '0');
    }

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
        alinaEl.textContent = 'Every day? That\u2019s serious coverage. Love it.';
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
        // Ola 3 — debounce rapid double-taps. Before this guard a fat-finger
        // double-click would toggle-on-toggle-off and silently drop the day
        // the user meant to select, firing two Alina messages in 50ms.
        if (btn.dataset.qfBusy === '1') return;
        btn.dataset.qfBusy = '1';
        setTimeout(function () { btn.dataset.qfBusy = ''; }, 150);
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

        // V2 — capture timeOfDay from selected chips.
        // D41 — Evening is no longer pre-selected. If the user advances
        // without picking any time slot, auto-default to "flexible" so
        // the sales team still gets a usable answer instead of empty.
        var selectedTimes = Array.from(SCREENS.days.querySelectorAll('.qf2-chip-time.is-selected')).map(function (c) { return c.getAttribute('data-time'); });
        // D49 — block Continue when no time window is selected. Replaces
        // the prior auto-default to ['flexible'] which let users advance
        // without confirming when the cleaning crew was welcome.
        if (selectedTimes.length === 0) {
          var cluster = document.getElementById('qf2TimeCluster');
          if (cluster) {
            try { cluster.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
            cluster.classList.add('qf2-time-cluster-shake');
            setTimeout(function () { cluster.classList.remove('qf2-time-cluster-shake'); }, 600);
          }
          if (typeof qfToast === 'function') {
            qfToast({ type: 'warn', title: 'One more thing', message: 'Pick a time window so I know when we can come.', duration: 3500 });
          }
          return;
        }
        STATE.timeOfDay = selectedTimes;
        STATE.scheduleAtypical = computeScheduleAtypical(STATE.space, STATE.timeOfDay);

        // For 'both' service, seed porter days with cleaning days so the user
        // sees their prior selection pre-filled on the next screen. They can
        // adjust freely or use the "Same as cleaning" preset to re-sync.
        if (STATE.service === 'both' && (!STATE.dpDays || !STATE.dpDays.length)) {
          STATE.dpDays = STATE.days.slice();
        }

        goNext();
      });
    }

    // V2 — Time-of-day chips (Morning / Afternoon / Evening / Flexible).
    // Multi-select for the first three; clicking Flexible clears them and
    // becomes the only selection. Toast announces the exclusion.
    var qf2TimeChips = SCREENS.days.querySelectorAll('.qf2-chip-time');
    var qf2TimeToast = document.getElementById('qf2TimeToast');
    function qf2HideToastSoon() {
      if (!qf2TimeToast) return;
      setTimeout(function(){ qf2TimeToast.hidden = true; }, 2400);
    }
    function qf2ShowToast(msg) {
      if (!qf2TimeToast) return;
      qf2TimeToast.textContent = msg;
      qf2TimeToast.hidden = false;
      qf2HideToastSoon();
    }
    qf2TimeChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var t = chip.getAttribute('data-time');
        var isFlexible = (t === 'flexible');
        var allChips = Array.from(qf2TimeChips);
        if (isFlexible) {
          // Toggle Flexible exclusively — clear all, set this one.
          var hadOthers = allChips.some(c => c !== chip && c.classList.contains('is-selected'));
          allChips.forEach(c => { c.classList.remove('is-selected'); c.setAttribute('aria-pressed', 'false'); });
          chip.classList.add('is-selected');
          chip.setAttribute('aria-pressed', 'true');
          if (hadOthers) qf2ShowToast('Cleared others. Flexible it is ~');
        } else {
          // Toggle this one. If Flexible was selected, deselect it.
          var flex = allChips.find(c => c.getAttribute('data-time') === 'flexible');
          if (flex && flex.classList.contains('is-selected')) {
            flex.classList.remove('is-selected');
            flex.setAttribute('aria-pressed', 'false');
          }
          var currentlyOn = chip.classList.toggle('is-selected');
          chip.setAttribute('aria-pressed', String(currentlyOn));
          // D49 — removed Evening auto-fallback. If the user toggles all
          // chips off, the time cluster stays empty and Continue stays
          // disabled until they pick something. Forcing Evening back on
          // contradicts D41's "no preselection" intent and let users
          // advance without actually confirming when the crew is welcome.
        }
        // After every chip toggle, refresh the disabled state of Continue
        // (which gates on time-cluster having ≥1 selection).
        if (typeof syncDaysUI === 'function') syncDaysUI();
      });
    });

    // V2 — Back arrow + Save for later in the V2 flowbar
    SCREENS.days.querySelectorAll('[data-qf2-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goBack(); });
    });
    SCREENS.days.querySelectorAll('.qf2-flowbar-skip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveDraft();
        try { var orig = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function(){ btn.textContent = orig; }, 1800); } catch(e){}
      });
    });
  }

  /* =======================================================================
     DP-DAYS step — Second day picker, only in the 'both' flow. Lets the user
     pick different days for the porter vs the janitorial cleaning captured
     on the prior screen. Mirrors the days-screen UI and logic with its own
     state slice (STATE.dpDays) and a "Same as cleaning" preset.
     ======================================================================= */
  if (SCREENS.dpDays) {
    var dpDayBtns     = SCREENS.dpDays.querySelectorAll('.qf-dp-day-card');
    var dpPresetBtns  = SCREENS.dpDays.querySelectorAll('.qf-s4-preset');
    var dpCountEl     = document.getElementById('qfDpDaysCount');
    var dpContinueBtn = document.getElementById('qfDpDaysContinue');

    function syncDpDaysUI() {
      dpDayBtns.forEach(function (btn) {
        var selected = (STATE.dpDays || []).indexOf(btn.getAttribute('data-day')) !== -1;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });
      if (dpCountEl) {
        var n = (STATE.dpDays || []).length;
        dpCountEl.textContent = n > 0 ? (n + ' day' + (n > 1 ? 's' : '') + ' selected') : '';
      }
      if (dpContinueBtn) dpContinueBtn.disabled = !((STATE.dpDays || []).length);
      dpPresetBtns.forEach(function (p) { p.classList.remove('is-active'); });
      var dp = STATE.dpDays || [];
      // Priority: when dp matches STATE.days, prefer the "Same as cleaning"
      // chip — it communicates the semantic relation more clearly than a
      // generic "Mon-Fri". Only fall through to Every/Weekdays if STATE.days
      // doesn't match.
      if (dp.length > 0 && arraysEqual(dp, STATE.days || [])) {
        dpPresetBtns.forEach(function (p) { if (p.dataset.presetDp === 'same') p.classList.add('is-active'); });
      } else if (dp.length === 7) {
        dpPresetBtns.forEach(function (p) { if (p.dataset.presetDp === 'every') p.classList.add('is-active'); });
      } else if (arraysEqual(dp, WEEKDAYS)) {
        dpPresetBtns.forEach(function (p) { if (p.dataset.presetDp === 'weekdays') p.classList.add('is-active'); });
      }
    }

    dpDayBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!Array.isArray(STATE.dpDays)) STATE.dpDays = [];
        var day = btn.getAttribute('data-day');
        var idx = STATE.dpDays.indexOf(day);
        if (idx === -1) STATE.dpDays.push(day); else STATE.dpDays.splice(idx, 1);
        syncDpDaysUI();
      });
    });

    dpPresetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.presetDp;
        if (p === 'same') STATE.dpDays = (STATE.days || []).slice();
        else if (p === 'weekdays') STATE.dpDays = WEEKDAYS.slice();
        else if (p === 'every') STATE.dpDays = ALL_DAYS.slice();
        else if (p === 'clear') STATE.dpDays = [];
        syncDpDaysUI();
      });
    });

    // When the dpDays screen becomes active, pre-select whatever we already
    // know — either a prior edit to STATE.dpDays or the cleaning days we
    // copied on exit from the days screen.
    var dpEnterObs = registerObserver(new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target === SCREENS.dpDays && SCREENS.dpDays.classList.contains('is-active')) {
          if (!Array.isArray(STATE.dpDays) || !STATE.dpDays.length) {
            STATE.dpDays = (STATE.days || []).slice();
          }
          syncDpDaysUI();
        }
      });
    }));
    dpEnterObs.observe(SCREENS.dpDays, { attributes: true, attributeFilter: ['class'] });

    if (dpContinueBtn) {
      dpContinueBtn.addEventListener('click', function () {
        if (!(STATE.dpDays || []).length) return;
        var summary = STATE.dpDays.length === 7 ? 'Every day'
          : arraysEqual(STATE.dpDays, WEEKDAYS) ? 'Mon\u2013Fri'
          : STATE.dpDays.length + ' days';
        setRailValue('dpDays', summary);
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
      // Ensure porterHours array matches count. Preserve existing entries so a
      // rebuild (e.g. user goes back and re-selects the same count) keeps their
      // prior schedules. New slots default to 08:00–17:00.
      if (!Array.isArray(STATE.porterHours)) STATE.porterHours = [];
      while (STATE.porterHours.length < count) STATE.porterHours.push({ start: '08:00', end: '17:00' });
      if (STATE.porterHours.length > count) STATE.porterHours.length = count;

      // Helper: pick a select's initial option to match STATE so a user who
      // returns to this screen sees their stored times, not the 8/17 defaults.
      function selectedAttr(optVal, current) {
        var hhmm = String(optVal).length === 1 ? ('0' + optVal + ':00') : (optVal + ':00');
        return hhmm === current ? ' selected' : '';
      }

      var html = '';
      for (var i = 1; i <= count; i++) {
        var ph = STATE.porterHours[i - 1];
        var startHour = parseInt((ph.start || '08:00').split(':')[0], 10);
        var endHour = parseInt((ph.end || '17:00').split(':')[0], 10);
        html += '<div class="qf-porter-row" data-porter-row="' + i + '">' +
                '<span class="qf-porter-row-label">Porter ' + i + '</span>' +
                '<div class="qf-porter-row-times">' +
                '<div class="qf-porter-row-field">' +
                '<span class="qf-porter-row-sub">Start time</span>' +
                '<select class="qf-s5-time-select" data-porter="' + i + '" data-time="start" aria-label="Porter ' + i + ' start time">' + timeOptions(startHour) + '</select>' +
                '</div>' +
                '<span class="qf-porter-row-sep">to</span>' +
                '<div class="qf-porter-row-field">' +
                '<span class="qf-porter-row-sub">End time</span>' +
                '<select class="qf-s5-time-select" data-porter="' + i + '" data-time="end" aria-label="Porter ' + i + ' end time">' + timeOptions(endHour) + '</select>' +
                '</div>' +
                '</div></div>';
      }
      rowsEl.innerHTML = html;

      // Keep legacy single timeStart/timeEnd mirrors synced to porter 1 so
      // downstream display helpers and payload compatibility code keep working.
      STATE.timeStart = STATE.porterHours[0].start;
      STATE.timeEnd = STATE.porterHours[0].end;
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
    var porterEnterObs = registerObserver(new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target === SCREENS.porter && SCREENS.porter.classList.contains('is-active')) {
          var alina = document.getElementById('qfAlinaSaysPorter');
          if (!alina) return;
          alina.textContent = ALINA_PORTER_BY_SPACE[STATE.space] || ALINA_PORTER_BY_SPACE.Other;
        }
      });
    }));
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
      var porterIdx = parseInt(sel.getAttribute('data-porter'), 10) - 1;
      var which = sel.getAttribute('data-time');
      if (isNaN(porterIdx) || porterIdx < 0) return;
      if (!Array.isArray(STATE.porterHours)) STATE.porterHours = [];
      while (STATE.porterHours.length <= porterIdx) STATE.porterHours.push({ start: '08:00', end: '17:00' });
      if (which === 'start') STATE.porterHours[porterIdx].start = hhmm;
      else if (which === 'end') STATE.porterHours[porterIdx].end = hhmm;
      // Mirror porter 1 into legacy fields
      if (porterIdx === 0) {
        if (which === 'start') STATE.timeStart = hhmm;
        else if (which === 'end') STATE.timeEnd = hhmm;
      }
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
    var contactObserver = registerObserver(new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target === SCREENS.contact && SCREENS.contact.classList.contains('is-active')) {
          // D43 — if STATE is empty when reaching Review (e.g. via stale
          // localStorage draft pointing to 'contact' with cleared fields,
          // or via direct URL navigation), redirect to Welcome rather than
          // showing a snapshot full of em-dash placeholders. Triggers when
          // the two most fundamental fields are both empty: service +
          // userName. Either alone could be a partial restore; both
          // missing means there's no quote to review.
          if (!STATE.service && !STATE.userName) {
            try {
              if (typeof qfToast === 'function') {
                qfToast({
                  type: 'warn',
                  title: 'No quote to review yet',
                  message: 'Looks like your draft cleared. Let’s start fresh.',
                  duration: 3500
                });
              }
            } catch (_) {}
            if (typeof goToScreen === 'function') {
              try { goToScreen('welcome', 'back'); } catch (_) {}
            }
            return;
          }
          populateSummary();
          if (typeof qf2PopulateSummary === 'function') qf2PopulateSummary();
        }
      });
    }));
    contactObserver.observe(SCREENS.contact, { attributes: true, attributeFilter: ['class'] });

    // V2 mockup G — populate the qf2-sum-* rows (Service / You / Space / When
    // / Where) using current STATE. XSS-safe via textContent. Called whenever
    // the contact screen activates (above) and after edit-panel saves.
    function qf2PopulateSummary() {
      // D30 — refined hierarchy: every row has ONE primary fact (medium ink)
      // and 0+ sub-facts (muted). No more `·` mixing identity with metadata
      // or days with time. Helper builds: [primary, sub1, sub2, …] into a
      // value element with a primary line + .qf2-sec spans on br'd lines.
      function setStackedValue(id, primary, subs) {
        var el = document.getElementById(id);
        if (!el) return;
        while (el.firstChild) el.removeChild(el.firstChild);
        el.appendChild(document.createTextNode(primary || '—'));
        (subs || []).filter(Boolean).forEach(function (s) {
          el.appendChild(document.createElement('br'));
          var span = document.createElement('span');
          span.className = 'qf2-sec';
          span.textContent = s;
          el.appendChild(span);
        });
      }

      // SERVICE row: primary = service name, sub = descriptive caption.
      // Was "Janitorial · recurring" (redundant for Janitorial, mixes label
      // and qualifier with `·`). Now: "Janitorial" / "Recurring after-hours…"
      var SERVICE_NAMES = { janitorial: 'Janitorial', dayporter: 'Day Porter', both: 'Combined', unsure: 'Help me decide' };
      var SERVICE_CAPTIONS = {
        janitorial: 'Recurring after-hours cleaning',
        dayporter:  'On-site during business hours',
        both:       'Day porter plus janitorial',
        unsure:     "We'll help you choose"
      };
      setStackedValue('qf2SumService',
        SERVICE_NAMES[STATE.service] || (STATE.service || ''),
        [SERVICE_CAPTIONS[STATE.service]]);

      // YOU row: primary = full name; subs = email, then role (if filled).
      // Was "Marina García · Facilities Manager" with email on a separate
      // line. The `·` mixed identity (name) with metadata (role). Now each
      // fact lives on its own line and the role is optional, not a peer.
      var fullName = (STATE.userName || '') + (STATE.userLastName ? ' ' + STATE.userLastName : '');
      var youSubs = [];
      if (STATE.userEmail) youSubs.push(STATE.userEmail);
      if (STATE.userPosition) youSubs.push(STATE.userPosition);
      setStackedValue('qf2SumYou', fullName.trim(), youSubs);

      // SPACE row: primary = company NAME (the user's identity for this
      // space). Sub-line 1 = "Office, 4,500 sq ft" (type + size). Sub-line 2
      // would normally be the address but D28 splits address into the
      // sibling .qf2-sum-row-subvalue (#qf2SumWhere) so it stays separate
      // from this primary value.
      // Fallback when no company is given: use space type + size as primary.
      var spaceLabel = STATE.space === 'Other' && STATE.spaceOther ? STATE.spaceOther : (STATE.space || '');
      var sizeLabel = STATE.needsSiteWalk
        ? 'size to be measured'
        : (typeof formatSizeLabel === 'function' ? formatSizeLabel(STATE.size) : (STATE.size || ''));
      var typeAndSize = [spaceLabel, sizeLabel].filter(Boolean).join(', ');
      var spacePrimary = STATE.companyName ? STATE.companyName : typeAndSize;
      var spaceSubs = STATE.companyName && typeAndSize ? [typeAndSize] : [];
      var spaceEl = document.getElementById('qf2SumSpace');
      if (spaceEl) {
        while (spaceEl.firstChild) spaceEl.removeChild(spaceEl.firstChild);
        spaceEl.appendChild(document.createTextNode(spacePrimary || '—'));
        spaceSubs.forEach(function (s) {
          spaceEl.appendChild(document.createElement('br'));
          var span = document.createElement('span');
          span.className = 'qf2-sec';
          span.textContent = s;
          spaceEl.appendChild(span);
        });
        // Visit indicator (mockup section 09 demo C).
        if (STATE.needsSiteWalk) {
          var visitInd = document.createElement('div');
          visitInd.className = 'qf2-visit-indicator';
          visitInd.textContent = "I'll see it in person ~";
          spaceEl.appendChild(visitInd);
        }
      }

      // V2 — Service certainty badge (when guided_via_quiz)
      var svcEl = document.getElementById('qf2SumService');
      if (svcEl) {
        // Remove any existing badge
        var existingBadge = svcEl.parentElement.querySelector('.qf2-confirm-badge');
        if (existingBadge) existingBadge.remove();
        if (STATE.serviceCertainty === 'guided_via_quiz') {
          var badge = document.createElement('div');
          badge.className = 'qf2-confirm-badge';
          badge.textContent = "Alina helps — I'll confirm the details";
          svcEl.parentElement.appendChild(badge);
        }
      }

      // V2 — CTA dynamic copy swap based on needsSiteWalk
      var ctaBtn = document.getElementById('qfContactSubmit');
      var ctaLbl = ctaBtn?.querySelector('.qf-rv-send-btn-label');
      if (ctaLbl) {
        ctaLbl.textContent = STATE.needsSiteWalk ? 'Send it + book my visit' : 'Send it to Alina';
      }

      // V2 — CTA subtext (site walk variant)
      var ctaWrap = ctaBtn?.parentElement;
      var existingSubtext = ctaWrap?.querySelector('.qf2-cta-subtext');
      if (existingSubtext) existingSubtext.remove();
      if (STATE.needsSiteWalk && ctaBtn) {
        var subtext = document.createElement('p');
        subtext.className = 'qf2-cta-subtext';
        subtext.textContent = "I'll email you a calendar link right after ~";
        ctaBtn.insertAdjacentElement('afterend', subtext);
      }

      // WHEN row: primary = days, sub = time window with hour range.
      // D31 — days now show full names (Monday, Wednesday, Friday) instead
      // of abbreviated (Mon, Wed, Fri). The Snapshot has plenty of width
      // and abbreviations were saving characters that didn't need saving.
      // Special idioms: 7 days → "Every day", Mon–Fri → "Weekdays",
      // Sat+Sun → "Weekends" (semantic phrasing, not abbreviation).
      var WEEKDAYS_ARR = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
      var WEEKEND_ARR  = ['Saturday','Sunday'];
      function _eqSet(a, b) {
        if (!a || a.length !== b.length) return false;
        return b.every(function (d) { return a.indexOf(d) > -1; });
      }
      var daysSummary = '';
      if (STATE.days && STATE.days.length === 7) daysSummary = 'Every day';
      else if (_eqSet(STATE.days, WEEKDAYS_ARR)) daysSummary = 'Weekdays';
      else if (_eqSet(STATE.days, WEEKEND_ARR)) daysSummary = 'Weekends';
      else if (STATE.days && STATE.days.length) daysSummary = STATE.days.join(', ');
      // D41 — softened summaries to match the new "When are we welcome?"
      // framing on Step 5. Ranges marked "loosely" to underline that the
      // exact time is coordinated, not committed.
      var TIME_DETAIL = {
        morning:   'Mornings (loosely 6 am–noon)',
        afternoon: 'Afternoons (loosely noon–5 pm)',
        evening:   'Evenings (loosely 5–10 pm)',
        flexible:  'Anytime, we’ll coordinate'
      };
      var timeSubs = (STATE.timeOfDay || []).map(function(t){ return TIME_DETAIL[t] || t; });
      setStackedValue('qf2SumWhen', daysSummary, timeSubs);

      // WHERE sub-line below The space row: address + optional suite.
      // D31 — company name moved to the row's primary, so the address
      // sub-line is purely location info (no "at" prefix needed now).
      var whereEl = document.getElementById('qf2SumWhere');
      if (whereEl) {
        while (whereEl.firstChild) whereEl.removeChild(whereEl.firstChild);
        var addrParts = [];
        if (STATE.userAddress) addrParts.push(STATE.userAddress);
        if (STATE.userSuite) addrParts.push('Suite ' + STATE.userSuite);
        whereEl.textContent = addrParts.join(' · ') || '—';
      }
    }

    // V2 — wire phone opt-in toggle, textarea counter, edit buttons,
    // back arrow, save-for-later in the V2 review screen.
    var qf2PhoneToggle = document.getElementById('qf2PhoneOptinToggle');
    var qf2PhoneExpanded = document.getElementById('qf2PhoneOptinExpanded');
    if (qf2PhoneToggle && qf2PhoneExpanded) {
      qf2PhoneToggle.addEventListener('click', function () {
        var open = !qf2PhoneExpanded.hidden;
        qf2PhoneExpanded.hidden = open;
        qf2PhoneToggle.setAttribute('aria-expanded', String(!open));
        if (!open) {
          qf2PhoneToggle.hidden = true;
          var ph = document.getElementById('qfUserPhone');
          if (ph && !ph.hasAttribute('hidden')) setTimeout(function(){ ph.focus(); }, 50);
        }
      });
    }

    var qf2NotesArea = document.getElementById('qfSpecialInstructions');
    var qf2NotesCounter = document.getElementById('qf2NotesCounter');
    if (qf2NotesArea && qf2NotesCounter) {
      var updateCounter = function () {
        qf2NotesCounter.textContent = (qf2NotesArea.value.length) + ' / 500';
      };
      qf2NotesArea.addEventListener('input', updateCounter);
      updateCounter();
    }

    // V2 — Edit inline panel (mockup G demo D). Click Edit → expand a panel
    // below the row with fields scoped to that section. Cancel closes.
    // Save updates STATE + re-populates the summary in place.
    //
    // D29 — make the WHOLE row tappable, not just the small Edit pill. The
    // pill remains as a visual cue + a11y tab stop, but a click anywhere on
    // the row body delegates to its Edit button. We attach the listener to
    // the row itself and gate by checking the click target isn't already an
    // input/button/etc inside an open edit panel.
    SCREENS.contact.querySelectorAll('.qf2-sum-row[data-section]').forEach(function (row) {
      row.addEventListener('click', function (e) {
        // Skip if the click landed on the Edit button itself, an input, or
        // any element inside an already-open edit panel. We only want clicks
        // on the row's "passive" area (label, value, icon, empty space).
        if (e.target.closest('.qf2-edit-btn, .qf2-sum-edit-panel, input, textarea, select, button, a')) return;
        var btn = row.querySelector('.qf2-edit-btn[data-edit]');
        if (btn) btn.click();
      });
    });

    SCREENS.contact.querySelectorAll('.qf2-edit-btn[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var section = btn.getAttribute('data-edit');
        var row = btn.closest('.qf2-sum-row');
        if (!row) return;

        // Toggle: if already editing, close.
        var existingPanel = row.nextElementSibling && row.nextElementSibling.classList.contains('qf2-sum-edit-panel') ? row.nextElementSibling : null;
        if (existingPanel) {
          existingPanel.remove();
          row.classList.remove('is-editing');
          btn.textContent = 'Edit';
          return;
        }

        // Close any other open panel first
        SCREENS.contact.querySelectorAll('.qf2-sum-edit-panel').forEach(function(p){ p.remove(); });
        SCREENS.contact.querySelectorAll('.qf2-sum-row.is-editing').forEach(function(r){
          r.classList.remove('is-editing');
          var b = r.querySelector('.qf2-edit-btn');
          if (b) b.textContent = 'Edit';
        });

        row.classList.add('is-editing');
        btn.textContent = 'Cancel';

        // Build the edit panel
        var panel = document.createElement('div');
        panel.className = 'qf2-sum-edit-panel';

        var header = document.createElement('p');
        header.className = 'qf2-sum-edit-header';
        header.textContent = "Let's tweak this ~";
        panel.appendChild(header);

        var fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'qf2-sum-edit-fields';
        panel.appendChild(fieldsWrap);

        // Helper: build a labeled .qf2-field input
        function fieldRow(id, type, value, placeholder, ariaLabel, max) {
          var f = document.createElement('div');
          f.className = 'qf2-field';
          var input = document.createElement('input');
          input.type = type;
          input.id = id;
          input.className = 'qf2-edit-input';
          input.value = value || '';
          if (placeholder) input.placeholder = placeholder;
          if (ariaLabel) input.setAttribute('aria-label', ariaLabel);
          if (max) input.maxLength = max;
          f.appendChild(input);
          return f;
        }

        var inputs = {};
        if (section === 'info') {
          fieldsWrap.appendChild(fieldRow('qf2EditFn', 'text', STATE.userName, 'First name', 'First name', 60));
          fieldsWrap.appendChild(fieldRow('qf2EditLn', 'text', STATE.userLastName, 'Last name', 'Last name', 60));
          fieldsWrap.appendChild(fieldRow('qf2EditEm', 'email', STATE.userEmail, 'Email', 'Email', 254));
          fieldsWrap.appendChild(fieldRow('qf2EditPos', 'text', STATE.userPosition, 'Role (optional)', 'Role (optional)', 80));
        } else if (section === 'location') {
          fieldsWrap.appendChild(fieldRow('qf2EditCo', 'text', STATE.companyName, 'Company or organization', 'Company', 120));
          fieldsWrap.appendChild(fieldRow('qf2EditAddr', 'text', STATE.userAddress, 'Service address', 'Service address', 200));
          fieldsWrap.appendChild(fieldRow('qf2EditSuite', 'text', STATE.userSuite, 'Suite / Floor (optional)', 'Suite or floor', 60));
        } else if (section === 'space') {
          var note = document.createElement('p');
          note.style.cssText = 'font-size:13px;color:var(--qf2-muted);margin:0 0 10px';
          note.textContent = "Hop back to the Space step to switch type.";
          fieldsWrap.appendChild(note);
        } else if (section === 'space-location') {
          // D28 — combined "The space" row covers space TYPE (locked, hop back
          // to change) + the address fields (editable inline).
          var noteSL = document.createElement('p');
          noteSL.style.cssText = 'font-size:13px;color:var(--qf2-muted);margin:0 0 10px';
          noteSL.textContent = 'Type: ' + (STATE.space || '—') + ' (hop back to Step 2 to change). Address below:';
          fieldsWrap.appendChild(noteSL);
          fieldsWrap.appendChild(fieldRow('qf2EditCo', 'text', STATE.companyName, 'Company or organization', 'Company', 120));
          fieldsWrap.appendChild(fieldRow('qf2EditAddr', 'text', STATE.userAddress, 'Service address', 'Service address', 200));
          fieldsWrap.appendChild(fieldRow('qf2EditSuite', 'text', STATE.userSuite, 'Suite / Floor (optional)', 'Suite or floor', 60));
        } else if (section === 'service') {
          var n2 = document.createElement('p');
          n2.style.cssText = 'font-size:13px;color:var(--qf2-muted);margin:0 0 10px';
          n2.textContent = "Hop back to the start to switch service.";
          fieldsWrap.appendChild(n2);
        } else if (section === 'days') {
          var n3 = document.createElement('p');
          n3.style.cssText = 'font-size:13px;color:var(--qf2-muted);margin:0 0 10px';
          n3.textContent = "Hop back to the Schedule step to adjust days/times.";
          fieldsWrap.appendChild(n3);
        } else if (section === 'size') {
          var n4 = document.createElement('p');
          n4.style.cssText = 'font-size:13px;color:var(--qf2-muted);margin:0 0 10px';
          n4.textContent = "Hop back to the Size step to adjust.";
          fieldsWrap.appendChild(n4);
        }

        // Action buttons
        var actions = document.createElement('div');
        actions.className = 'qf2-sum-edit-actions';
        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'qf2-sum-edit-cancel';
        cancelBtn.textContent = 'Cancel';
        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'qf2-sum-edit-save';
        // For sections without inline-editable fields, the Save button instead
        // routes back to that step.
        var routeBack = (section === 'space' || section === 'service' || section === 'days' || section === 'size');
        saveBtn.textContent = routeBack ? 'Hop back' : 'Save changes';

        cancelBtn.addEventListener('click', function () {
          panel.remove();
          row.classList.remove('is-editing');
          btn.textContent = 'Edit';
        });
        saveBtn.addEventListener('click', function () {
          if (routeBack) {
            var TARGET = { service: 'welcome', space: 'space', days: 'days', size: 'size' };
            var step = TARGET[section];
            panel.remove();
            row.classList.remove('is-editing');
            btn.textContent = 'Edit';
            if (step && typeof goToScreen === 'function') {
              try { goToScreen(step, 'back'); } catch(e){}
            }
            return;
          }
          if (section === 'info') {
            var fn = document.getElementById('qf2EditFn').value.trim().slice(0,60);
            var ln = document.getElementById('qf2EditLn').value.trim().slice(0,60);
            var em = document.getElementById('qf2EditEm').value.trim();
            var pos = document.getElementById('qf2EditPos').value.trim().slice(0,80);
            STATE.userName = fn; STATE.userLastName = ln; STATE.userEmail = em; STATE.userPosition = pos;
          } else if (section === 'location' || section === 'space-location') {
            // D28 — space-location merged row uses the same field set as the
            // legacy location row. Space TYPE is non-editable here (locked
            // intentionally — change requires the dedicated Space step).
            var co = document.getElementById('qf2EditCo').value.trim().slice(0,120);
            var addr = document.getElementById('qf2EditAddr').value.trim().slice(0,200);
            var suite = document.getElementById('qf2EditSuite').value.trim().slice(0,60);
            STATE.companyName = co; STATE.userAddress = addr; STATE.userSuite = suite;
          }
          // Re-populate summary + close
          if (typeof qf2PopulateSummary === 'function') qf2PopulateSummary();
          panel.remove();
          row.classList.remove('is-editing');
          btn.textContent = 'Edit';
        });
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        panel.appendChild(actions);

        // Insert after the row
        row.insertAdjacentElement('afterend', panel);

        // Focus first input
        var first = panel.querySelector('input');
        if (first) setTimeout(function(){ first.focus(); }, 50);
      });
    });

    // Back arrow + Save for later in V2 flowbar
    SCREENS.contact.querySelectorAll('[data-qf2-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { goBack(); });
    });
    SCREENS.contact.querySelectorAll('.qf2-flowbar-skip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveDraft();
        try { var orig = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function(){ btn.textContent = orig; }, 1800); } catch(e){}
      });
    });

    function formatPorters() {
      if (!STATE.porterCount) return '';
      if (STATE.porterCount === 'notsure') return 'Not sure';
      return STATE.porterCount + ' porter' + (STATE.porterCount !== '1' ? 's' : '');
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
      // AYS Ola 8 — Idea 2 "Review with Alina as host". Single-column hero + summary card.
      var serviceFocus = SERVICE_LABELS[STATE.service] || STATE.service || '';

      // Hero title: "Got it, <em>Priya</em>. Here's your snapshot." (one line)
      var heroTitle = document.getElementById('qfPlanHeroTitle');
      if (heroTitle) {
        while (heroTitle.firstChild) heroTitle.removeChild(heroTitle.firstChild);
        var firstName = (STATE.userName || '').trim();
        heroTitle.appendChild(document.createTextNode('Got it, '));
        var em = document.createElement('em');
        em.id = 'qfRvHeroName';
        em.textContent = firstName || 'there';
        heroTitle.appendChild(em);
        heroTitle.appendChild(document.createTextNode('. Here\u2019s your snapshot.'));
      }

      // Hero sub: single line, short
      var heroSub = document.getElementById('qfRvHeroSub');
      if (heroSub) {
        heroSub.textContent = 'Tap anything that\u2019s off to edit.';
      }

      // Re-evaluate floating CTA visibility once layout settles
      setTimeout(function () { if (window.qfRecheckFloatingCta) window.qfRecheckFloatingCta(); }, 60);

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

      // AYS Ola 8.2 — adapt each summary row to the actual flow.
      // Flow paths:
      //   janitorial → service, space, size, days (no porter, no hours)
      //   dayporter  → service, space, days, porter, hours (no size)
      //   both       → service, space, size, days, porter, hours
      //   unsure     → service, space, size, days (like janitorial)
      var svc = STATE.service;
      var hasPorters = svc === 'dayporter' || svc === 'both';
      var hasSize = svc !== 'dayporter';
      var days = (formatDays && formatDays()) || '';
      var daysCount = Array.isArray(STATE.days) ? STATE.days.length : 0;
      var porterCount = STATE.porterCount && STATE.porterCount !== 'notsure' ? parseInt(STATE.porterCount) || 0 : 0;

      // Per-porter schedule description. When all porters share the same hours
      // we collapse to a single "HH:MM–HH:MM". When they differ we list each:
      // "Porter 1 08:00–12:00 · Porter 2 13:00–17:00". This preserves fidelity
      // instead of silently flattening to the last-edited porter's schedule.
      var phList = Array.isArray(STATE.porterHours)
        ? STATE.porterHours.filter(function(p){ return p && p.start && p.end; })
        : [];
      var allSameHours = phList.length > 0 && phList.every(function(p){
        return p.start === phList[0].start && p.end === phList[0].end;
      });
      var sharedWin = allSameHours ? (phList[0].start + '\u2013' + phList[0].end) : '';
      var perPorterList = phList.map(function(p, i){
        return 'Porter ' + (i + 1) + ' ' + p.start + '\u2013' + p.end;
      }).join(' \u00b7 ');
      // Back-compat variable used by service-row context strings below.
      var timeWin = allSameHours ? sharedWin : '';

      // ---------- SERVICE row ----------
      // Primary = service name (serif italic, #qfSumService)
      // Primary meta (#qfRvSvcFreq) = frequency or porter count
      // Sub (#qfRvSvcSub) = context phrase

      // Human-friendly frequency label: "Every day" (7), "Every weekday" (Mon-Fri
      // exactly), "Weekends" (Sat+Sun exactly), otherwise "N days / week".
      function cadenceLabel(count) {
        if (count === 7) return 'Every day';
        if (count === 0) return '';
        var set = STATE.days || [];
        var isWeekdays = count === 5 && ['Monday','Tuesday','Wednesday','Thursday','Friday']
          .every(function(d){ return set.indexOf(d) > -1; });
        if (isWeekdays) return 'Every weekday';
        var isWeekends = count === 2 && set.indexOf('Saturday') > -1 && set.indexOf('Sunday') > -1;
        if (isWeekends) return 'Weekends';
        return count + ' day' + (count !== 1 ? 's' : '') + ' / week';
      }
      function portersLabel(n) {
        if (STATE.porterCount === 'notsure') return 'Porters TBD';
        if (!n) return '';
        return n + ' porter' + (n !== 1 ? 's' : '');
      }

      var svcName, svcFreq, svcSub;
      if (svc === 'janitorial') {
        svcName = 'Janitorial';
        svcFreq = cadenceLabel(daysCount) || 'your schedule';
        svcSub = 'Eco-certified \u00b7 insured \u00b7 uniformed team';
      } else if (svc === 'dayporter') {
        svcName = 'Day Porter';
        svcFreq = portersLabel(porterCount) || 'on-site';
        svcSub = (timeWin ? ('On-site ' + timeWin) : 'On-site during business hours') + ' \u00b7 uniformed team';
      } else if (svc === 'both') {
        svcName = 'Both services';
        var freqParts = [];
        var pLbl = portersLabel(porterCount);
        if (pLbl) freqParts.push(pLbl);
        var cLbl = cadenceLabel(daysCount);
        if (cLbl) freqParts.push(cLbl + ' janitorial');
        svcFreq = freqParts.join(' + ') || 'your plan';
        svcSub = 'Day porter + janitorial \u00b7 eco-certified';
      } else {
        svcName = 'Help me decide';
        svcFreq = 'Alina will recommend';
        svcSub = 'Based on your space + schedule, we\u2019ll propose the best fit';
      }
      setVal('qfSumService', svcName);
      var freqEl = document.getElementById('qfRvSvcFreq');
      if (freqEl) freqEl.textContent = svcFreq;
      var svcSubEl = document.getElementById('qfRvSvcSub');
      if (svcSubEl) svcSubEl.textContent = svcSub;

      // ---------- PREMISES row ----------
      // Primary = address (b tag), Sub = space · size (dot + size both hidden when absent)
      var sizeLbl = formatSizeLabel(STATE.size);
      var showSize = !!(hasSize && sizeLbl);
      setVal('qfSumSpace', STATE.space || '(not set)');
      var sumSizeEl = document.getElementById('qfSumSize');
      if (sumSizeEl) {
        sumSizeEl.textContent = showSize ? sizeLbl : '';
        sumSizeEl.hidden = !showSize;
      }
      var premDot = document.querySelector('[data-section="location"] .qf-rv-sum-dot');
      if (premDot) premDot.hidden = !showSize;

      // ---------- SCHEDULE row ----------
      // For 'both' the label flips to "Cleaning" (porter lives in its own
      // row below). For everything else it stays "Schedule".
      var schedLabel = document.getElementById('qfSumScheduleLabel');
      if (schedLabel) schedLabel.textContent = (svc === 'both') ? 'Cleaning' : 'Schedule';
      setVal('qfSumSchedule', days || '(none selected)');
      var schedSubText = '';
      if (svc === 'janitorial' || svc === 'unsure') {
        schedSubText = '';
      } else if (svc === 'dayporter') {
        if (phList.length > 1 && !allSameHours) {
          schedSubText = perPorterList;
        } else if (sharedWin) {
          schedSubText = 'On-site ' + sharedWin;
          if (porterCount) schedSubText += ' \u00b7 ' + porterCount + ' porter' + (porterCount !== 1 ? 's' : '');
        } else {
          schedSubText = 'On-site during business hours';
          if (porterCount) schedSubText += ' \u00b7 ' + porterCount + ' porter' + (porterCount !== 1 ? 's' : '');
        }
      } else if (svc === 'both') {
        // In 'both' this row is the cleaning schedule. Subline clarifies
        // that we handle timing ourselves (overnight by default).
        schedSubText = 'Overnight cleaning';
      }
      var schedTimeEl = document.getElementById('qfSumTime');
      if (schedTimeEl) schedTimeEl.textContent = schedSubText;
      var schedSubEl = document.getElementById('qfRvSchedSub');
      if (schedSubEl) schedSubEl.hidden = !schedSubText;
      var schedMeta = document.getElementById('qfRvSchedMeta');
      if (schedMeta) schedMeta.hidden = true;
      var schedDot = document.getElementById('qfRvSchedDot');
      if (schedDot) schedDot.hidden = true;

      // ---------- PORTER row (only 'both' flow) ----------
      // Shows porter days + porter hours separately from the cleaning row so
      // the client can clearly see — and edit — that porter schedules can
      // differ from cleaning schedules.
      var porterRowEl = document.getElementById('qfSumPorterRow');
      if (porterRowEl) {
        if (svc === 'both') {
          porterRowEl.hidden = false;
          var dpList = Array.isArray(STATE.dpDays) ? STATE.dpDays.slice() : [];
          var dpDaysStr;
          if (dpList.length === 0) {
            dpDaysStr = '(none selected)';
          } else if (dpList.length === 7) {
            dpDaysStr = 'Every day';
          } else if (dpList.length === 5 && ['Monday','Tuesday','Wednesday','Thursday','Friday'].every(function(d){return dpList.indexOf(d)>-1;})) {
            dpDaysStr = 'Mon\u2013Fri';
          } else {
            var abbrM = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };
            dpDaysStr = dpList.map(function(d){ return abbrM[d] || d; }).join(', ');
          }
          setVal('qfSumPorterSchedule', dpDaysStr);
          var porterSubText;
          if (phList.length > 1 && !allSameHours) {
            porterSubText = perPorterList;
          } else if (sharedWin) {
            porterSubText = 'On-site ' + sharedWin;
            if (porterCount) porterSubText += ' \u00b7 ' + porterCount + ' porter' + (porterCount !== 1 ? 's' : '');
          } else {
            porterSubText = 'On-site during business hours';
            if (porterCount) porterSubText += ' \u00b7 ' + porterCount + ' porter' + (porterCount !== 1 ? 's' : '');
          }
          var porterTimeEl = document.getElementById('qfSumPorterTime');
          if (porterTimeEl) porterTimeEl.textContent = porterSubText;
          var porterSubEl = document.getElementById('qfRvPorterSchedSub');
          if (porterSubEl) porterSubEl.hidden = !porterSubText;
        } else {
          porterRowEl.hidden = true;
        }
      }

      // Legacy setter used elsewhere (floating CTA recheck)
      setVal('qfSumPorters', formatPorters() || '');

      // ---------- CONTACT row ----------
      // Separators visible only when both sides present. Treat whitespace-only
      // companyName as empty so a stray space doesn't render an orphan dot.
      var hasCompany = !!(STATE.companyName && STATE.companyName.trim());
      var contactDot = document.getElementById('qfRvContactDot');
      if (contactDot) contactDot.hidden = !(fullName.trim() && hasCompany);
      var contactDot2 = document.getElementById('qfRvContactDot2');
      if (contactDot2) contactDot2.hidden = !(STATE.userEmail && STATE.userPhone);
      var companyEl = document.getElementById('qfSumCompany');
      if (companyEl) companyEl.hidden = !hasCompany;

      // Legacy "plan-at-a-glance" chips (qfChipService/Space/Size/Days/Porters)
      // are marked hidden in HTML and replaced by the 4-row summary above.
      // Previously setChip() still reflowed them every populateSummary() — the
      // work was invisible but cost layout passes. Skipping entirely.

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
      show('qfSumCompanyRow', hasCompany);
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
      days: 'schedule days', time: 'porter hours'
    };
    document.querySelectorAll('.qf-rev-edit[data-edit]').forEach(function (b) {
      var f = b.getAttribute('data-edit');
      if (f && !b.getAttribute('aria-label')) b.setAttribute('aria-label', 'Edit ' + (FIELD_LABELS[f] || f));
    });

    // Inline edit: open editor. Supports both the legacy .qf-rev-row and
    // the Ola 8 .qf-rv-sum-row wrappers. The edit panel inside may carry
    // the `hidden` attribute — we flip it off when entering edit mode.
    // Track which Edit button opened each row so Cancel/Save can return focus
    // back to it (a11y — Sprint 2 G3). Keyed by data-section on the row.
    var _qfEditLastBtn = {};
    document.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.getAttribute('data-edit');
        var row = btn.closest('.qf-rv-sum-row, .qf-rev-row');
        if (!row) return;
        var sectionKey = row.getAttribute('data-section') || field;
        _qfEditLastBtn[sectionKey] = btn;
        var panel = row.querySelector('.qf-rv-sum-edit-panel, .qf-rev-row-edit');
        if (panel) panel.hidden = false;
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
        } else if (field === 'days' || field === 'time') {
          // Days panel. In 'both' this represents CLEANING days only — the
          // porter day picker + hours live in the separate dpDays edit panel.
          // Ola 3 — null-guard: STATE.days can be undefined if user jumped into
          // the edit panel without having passed through the days step yet.
          var _days = Array.isArray(STATE.days) ? STATE.days : [];
          document.querySelectorAll('#qfEditDays input').forEach(function (cb) {
            cb.checked = _days.indexOf(cb.value) > -1;
          });
          var wrap = document.getElementById('qfEditPorterHours');
          // Only 'dayporter' edits porter hours from this panel. For 'both'
          // porter hours move to the dpDays edit panel so clients see a clean
          // separation (cleaning here, porter there).
          if (wrap && STATE.service === 'dayporter') {
            var list = Array.isArray(STATE.porterHours) ? STATE.porterHours : [];
            if (!list.length) list = [{ start: STATE.timeStart || '08:00', end: STATE.timeEnd || '17:00' }];
            renderPorterHourRows(wrap, list);
          } else if (wrap) {
            wrap.replaceChildren();
          }
          // Hide the porter-hours sub-row entirely for 'both' (it owns its own
          // panel now) so the cleaning edit stays focused on cleaning days.
          var timeRowEl = document.getElementById('qfSumTimeRow');
          if (timeRowEl) timeRowEl.hidden = (STATE.service !== 'dayporter');
        } else if (field === 'dpDays') {
          // Porter edit panel (only rendered in 'both' service). Populates
          // porter days + per-porter hour inputs.
          document.querySelectorAll('#qfEditDpDays input').forEach(function (cb) {
            cb.checked = (STATE.dpDays || []).indexOf(cb.value) > -1;
          });
          var dpWrap = document.getElementById('qfEditDpPorterHours');
          if (dpWrap) {
            var phs = Array.isArray(STATE.porterHours) ? STATE.porterHours : [];
            if (!phs.length) phs = [{ start: STATE.timeStart || '08:00', end: STATE.timeEnd || '17:00' }];
            renderPorterHourRows(dpWrap, phs);
          }
        }
        row.classList.add('is-editing');

        // AYS Ola 8.3 — sync visibility of conditional fields inside the open panel.
        // The populate hides porter/size/time rows based on current STATE; we mirror
        // that here live when the user toggles the service dropdown.
        // Ola 3 — migrated the listener-attached flag from an expando property on
        // the DOM element (`__qfRvListenerAttached`) to a module-scope WeakMap.
        // Expando props can leak with element clones and show up as debug
        // noise; WeakMap is GC-friendly and invisible to DOM consumers.
        var serviceSel = panel && panel.querySelector('#qfEditService');
        if (serviceSel && !_qfListenerAttached.has(serviceSel)) {
          _qfListenerAttached.set(serviceSel, true);
          serviceSel.addEventListener('change', function () {
            var v = serviceSel.value;
            var portersRow = document.getElementById('qfSumPortersRow');
            var sizeRow = document.getElementById('qfSumSizeRow');
            if (portersRow) portersRow.hidden = !(v === 'dayporter' || v === 'both');
            if (sizeRow) sizeRow.hidden = (v === 'dayporter');
          });
          // Sync on open
          var v0 = serviceSel.value;
          var portersRow0 = document.getElementById('qfSumPortersRow');
          var sizeRow0 = document.getElementById('qfSumSizeRow');
          if (portersRow0) portersRow0.hidden = !(v0 === 'dayporter' || v0 === 'both');
          if (sizeRow0) sizeRow0.hidden = (v0 === 'dayporter');
        }
      });
    });

    // Inline edit: cancel. Close the panel, roll any inputs back to match STATE
    // (so live-sync changes like the Service dropdown flipping size/porter rows
    // don't leave a stale value), and return focus to the Edit button that
    // opened the panel (a11y).
    document.querySelectorAll('[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.qf-rv-sum-row, .qf-rev-row');
        if (!row) return;
        var field = btn.getAttribute('data-cancel');
        // Re-sync each edit input to STATE so the next open sees fresh data.
        if (field === 'service') {
          var svcSel = document.getElementById('qfEditService');
          if (svcSel) svcSel.value = STATE.service || 'janitorial';
          // Re-sync the live-sync'd conditional rows inside this panel.
          var portersRow = document.getElementById('qfSumPortersRow');
          var sizeRow = document.getElementById('qfSumSizeRow');
          if (portersRow) portersRow.hidden = !(STATE.service === 'dayporter' || STATE.service === 'both');
          if (sizeRow) sizeRow.hidden = (STATE.service === 'dayporter');
        } else if (field === 'address') {
          var a = document.getElementById('qfEditAddress'); if (a) a.value = STATE.userAddress || '';
          var sp = document.getElementById('qfEditSpace'); if (sp) sp.value = STATE.space || 'Office';
          var sz = document.getElementById('qfEditSize'); if (sz) sz.value = STATE.size || 'notsure';
        } else if (field === 'days') {
          document.querySelectorAll('#qfEditDays input').forEach(function (cb) {
            cb.checked = (STATE.days || []).indexOf(cb.value) > -1;
          });
        } else if (field === 'dpDays') {
          document.querySelectorAll('#qfEditDpDays input').forEach(function (cb) {
            cb.checked = (STATE.dpDays || []).indexOf(cb.value) > -1;
          });
        } else if (field === 'name') {
          var fn = document.getElementById('qfEditFirstName'); if (fn) fn.value = STATE.userName || '';
          var ln = document.getElementById('qfEditLastName'); if (ln) ln.value = STATE.userLastName || '';
          var em = document.getElementById('qfEditEmail'); if (em) em.value = STATE.userEmail || '';
          var ph = document.getElementById('qfEditPhone'); if (ph) ph.value = STATE.userPhone || '';
          var co = document.getElementById('qfEditCompany'); if (co) co.value = STATE.companyName || '';
        }
        row.classList.remove('is-editing');
        var panel = row.querySelector('.qf-rv-sum-edit-panel, .qf-rev-row-edit');
        if (panel) panel.hidden = true;
        var sectionKey = row.getAttribute('data-section') || field;
        var openingBtn = _qfEditLastBtn[sectionKey];
        if (openingBtn) setTimeout(function(){ try { openingBtn.focus(); } catch(_){} }, 0);
      });
    });

    // Inline edit: save
    document.querySelectorAll('[data-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = btn.getAttribute('data-save');
        if (field === 'name') {
          // The contact edit panel hosts five fields (firstName, lastName,
          // email, phone, company) but only exposes a single Save button with
          // data-save="name". Previously this branch only persisted the name
          // fields, so any email/phone/company edit was silently dropped on
          // Save. Now all five fields move to STATE together. Email is
          // validated with the same EMAIL_RE used during the info step; the
          // panel stays open if it fails.
          var editEmail = document.getElementById('qfEditEmail');
          var emailVal = editEmail ? editEmail.value.trim() : '';
          if (emailVal && !EMAIL_RE.test(emailVal)) {
            qfToast({ type:'warn', title:'Invalid email', message:'Please enter a valid email address.' });
            return;
          }
          STATE.userName     = cleanName((document.getElementById('qfEditFirstName') || {value:''}).value);
          STATE.userLastName = cleanName((document.getElementById('qfEditLastName')  || {value:''}).value);
          STATE.userEmail    = emailVal;
          STATE.userPhone    = (document.getElementById('qfEditPhone')     || {value:''}).value.trim();
          STATE.companyName  = (document.getElementById('qfEditCompany')   || {value:''}).value.trim();
        } else if (field === 'email') {
          var email = document.getElementById('qfEditEmail').value.trim();
          if (email && !EMAIL_RE.test(email)) {
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
              // dayporter doesn't use size; stash the last known value so swapping
              // back to janitorial/both/unsure can restore it instead of forcing
              // the user to re-pick.
              if (STATE.size) STATE._sizeBeforeDayporter = STATE.size;
              STATE.size = null;
            } else if (oldService === 'dayporter' && !STATE.size) {
              // Coming back from dayporter — restore prior size if we stashed one,
              // otherwise default to 'notsure' so validation for both/janitorial passes.
              STATE.size = STATE._sizeBeforeDayporter || 'notsure';
            }
            if (newService === 'janitorial' || newService === 'unsure') {
              STATE.porterCount = null;
              STATE.timeStart = null;
              STATE.timeEnd = null;
              STATE.porterHours = [];
            }
            // 'dpDays' only lives in the 'both' flow — clear it when leaving.
            if (newService !== 'both') {
              STATE.dpDays = [];
            } else if (!Array.isArray(STATE.dpDays) || !STATE.dpDays.length) {
              // Entering 'both' from another flow — pre-fill dpDays with
              // whatever janitorial days we already know so the porter row
              // is valid from the start (user can still edit).
              STATE.dpDays = (STATE.days || []).slice();
            }
            // Rebuild rail for new service
            if (typeof buildRail === 'function') buildRail(newService);
          }
        } else if (field === 'porters') {
          STATE.porterCount = document.getElementById('qfEditPorters').value;
        } else if (field === 'days' || field === 'time') {
          // Save days selection — cleaning days for 'both', service days otherwise
          STATE.days = Array.from(document.querySelectorAll('#qfEditDays input:checked')).map(function(cb){return cb.value;});
          // Save per-porter hours only in 'dayporter' (for 'both' this lives
          // in the separate dpDays panel).
          if (STATE.service === 'dayporter') {
            var rows = document.querySelectorAll('#qfEditPorterHours .qf-rv-porter-hour-row');
            if (rows.length) {
              var newHours = Array.prototype.map.call(rows, function (row) {
                var s = row.querySelector('[data-time="start"]');
                var e = row.querySelector('[data-time="end"]');
                return {
                  start: (s && s.value) || '08:00',
                  end: (e && e.value) || '17:00'
                };
              });
              STATE.porterHours = newHours;
              STATE.timeStart = newHours[0].start;
              STATE.timeEnd = newHours[0].end;
            }
          }
        } else if (field === 'dpDays') {
          // Save porter days + per-porter hours from the dedicated 'both'
          // panel. STATE.porterHours is shared with the hours-step capture,
          // so this keeps hours and days in sync on the porter side.
          STATE.dpDays = Array.from(document.querySelectorAll('#qfEditDpDays input:checked')).map(function(cb){return cb.value;});
          var dpRows = document.querySelectorAll('#qfEditDpPorterHours .qf-rv-porter-hour-row');
          if (dpRows.length) {
            var dpHours = Array.prototype.map.call(dpRows, function (row) {
              var s = row.querySelector('[data-time="start"]');
              var e = row.querySelector('[data-time="end"]');
              return {
                start: (s && s.value) || '08:00',
                end: (e && e.value) || '17:00'
              };
            });
            STATE.porterHours = dpHours;
            STATE.timeStart = dpHours[0].start;
            STATE.timeEnd = dpHours[0].end;
          }
        }
        var row = btn.closest('.qf-rv-sum-row, .qf-rev-row');
        if (row) {
          row.classList.remove('is-editing');
          var panel = row.querySelector('.qf-rv-sum-edit-panel, .qf-rev-row-edit');
          if (panel) panel.hidden = true;
          // Sprint 2 G3 — return focus to the Edit button that opened this
          // panel so keyboard and screen-reader users aren't dumped at
          // document.body after save.
          var sectionKey = row.getAttribute('data-section') || field;
          var openingBtn = _qfEditLastBtn[sectionKey];
          if (openingBtn) setTimeout(function(){ try { openingBtn.focus(); } catch(_){} }, 0);
        }
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
      // AYS Ola 3 #22 — maxlength on textarea is bypassable via paste in some
      // browsers; enforce the 500-char cap after every paste.
      specialInput.addEventListener('paste', function () {
        setTimeout(function () {
          if (specialInput.value.length > 500) {
            specialInput.value = specialInput.value.slice(0, 500);
          }
          updateCounter();
        }, 0);
      });
      updateCounter();
    }

    // Build payload for /api/submit-quote endpoint
    function buildSubmitPayload() {
      // formType mirrors STATE.service 1:1 — backend ALLOWED_FORM_TYPES accepts
      // janitorial / dayporter / both. 'unsure' defaults to 'janitorial' for routing.
      var formType = STATE.service === 'dayporter' ? 'dayporter'
                    : STATE.service === 'both' ? 'both'
                    : 'janitorial';
      var payload = {
        em: STATE.userEmail,
        fn: STATE.userName,
        ln: STATE.userLastName,
        ph: STATE.userPhone,
        co: STATE.companyName,
        // V2 2026-04-25 — pos = job role / title captured on the info screen.
        pos: STATE.userPosition,
        addr: STATE.userAddress,
        space: STATE.space,
        size: STATE.size,
        formType: formType,
        notes: STATE.specialInstructions || ''
      };
      // Schedule days — 'both' now tracks two separate lists (cleaning +
       // porter) so email templates and CRM can render them distinctly. The
       // 'dayporter' flow writes STATE.days to dpDays (single list). The
       // 'janitorial'/'unsure' flows write STATE.days to janDays.
      if (formType === 'dayporter') {
        if (STATE.days && STATE.days.length) payload.dpDays = STATE.days;
      } else if (formType === 'both') {
        if (STATE.days && STATE.days.length) payload.janDays = STATE.days;
        var dpDaysArr = (Array.isArray(STATE.dpDays) && STATE.dpDays.length) ? STATE.dpDays : STATE.days;
        if (dpDaysArr && dpDaysArr.length) payload.dpDays = dpDaysArr;
      } else {
        if (STATE.days && STATE.days.length) payload.janDays = STATE.days;
      }
      // Porter count
      if (STATE.porterCount) payload.porters = STATE.porterCount;
      // V2 2026-04-25 — extra signals captured by the new Janitorial conversational
      // flow. timeOfDay = preferred slots; serviceCertainty = 'guided_via_quiz'
      // when user used the welcome mini-quiz; needsSiteWalk = true when size is
      // 'visit_required' or numeric > 15K; scheduleAtypical = heuristic flag.
      // exactSize = numeric sq ft when user typed a precise value; spaceOther =
      // free-text when they picked "Something else". Backend ALLOWED_KEYS already
      // accepts all of these (see functions/api/submit-quote.js).
      if (Array.isArray(STATE.timeOfDay) && STATE.timeOfDay.length) payload.timeOfDay = STATE.timeOfDay.slice();
      if (STATE.serviceCertainty) payload.serviceCertainty = STATE.serviceCertainty;
      if (STATE.needsSiteWalk) payload.needsSiteWalk = true;
      if (STATE.scheduleAtypical) payload.scheduleAtypical = true;
      if (STATE.sizeExact) payload.exactSize = STATE.sizeExact;
      if (STATE.spaceOther) payload.spaceOther = STATE.spaceOther;
      // V2 2026-04-25 — optional suite/floor for multi-tenant buildings
      if (STATE.userSuite) payload.suite = STATE.userSuite;
      // Per-porter hours (set in the hours step). Each entry is {start, end}.
      // Legacy startTime/hrs kept for backend consumers that only know shared hours —
      // populated from porter 1 when all porters share a schedule, else empty.
      if (Array.isArray(STATE.porterHours) && STATE.porterHours.length) {
        var nonEmpty = STATE.porterHours.filter(function(p){ return p && p.start && p.end; });
        if (nonEmpty.length) {
          payload.porterHours = nonEmpty.map(function(p){ return { start: p.start, end: p.end }; });
          var first = nonEmpty[0];
          var allSame = nonEmpty.every(function(p){ return p.start === first.start && p.end === first.end; });
          if (allSame) {
            payload.startTime = first.start;
            payload.hrs = first.start + '-' + first.end;
          }
        }
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
      // Ola 3 — re-check disposable + typo at submit. User may have edited
      // the email in the summary panel to a disposable/typo'd address after
      // passing the initial info-step check.
      else if (suggestEmailCorrection(STATE.userEmail)) errs.push({ field: 'email', msg: 'Email looks like a typo. Did you mean ' + suggestEmailCorrection(STATE.userEmail) + '?' });
      else if (isDisposableEmail(STATE.userEmail)) errs.push({ field: 'email', msg: 'Please use a non-disposable email so we can deliver your proposal.' });
      if (!STATE.userName || !STATE.userName.trim()) errs.push({ field: 'name', msg: 'First name is missing.' });
      if (STATE.userPhone && !isValidPhone(STATE.userPhone)) errs.push({ field: 'phone', msg: 'Phone number is invalid.' });
      // AYS Ola 4 Commit L HI-4 — mirror the stricter check from the location step.
      var _a = STATE.userAddress || '';
      var _isZip = /^\s*\d{5}(-\d{4})?\s*$/.test(_a);
      var _hasStreet = _a.length >= 6 && /\d/.test(_a) && /[A-Za-z]{2,}/.test(_a);
      if (!_a || (!_isZip && !_hasStreet)) errs.push({ field: 'address', msg: 'A valid address or ZIP is missing.' });
      if (!STATE.space) errs.push({ field: 'space', msg: 'Space type is missing.' });
      if (STATE.service !== 'dayporter' && !STATE.size) errs.push({ field: 'size', msg: 'Space size is missing.' });
      if (!STATE.days || !STATE.days.length) errs.push({ field: 'days', msg: 'Please pick at least one service day.' });
      // For 'both' we also require porter days. They may legitimately match
      // cleaning days (the "Same as cleaning" preset copies them over), but
      // the STATE slot must be populated so payload carries the right list.
      if (STATE.service === 'both' && (!Array.isArray(STATE.dpDays) || !STATE.dpDays.length)) {
        errs.push({ field: 'dpDays', msg: 'Please pick the days you need your porter on-site.' });
      }
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
      // AYS Ola 4 Commit L HI-2 — register observer for global cleanup so
      // success transitions and unload can disconnect it.
      var floaterMirrorObs = registerObserver(new MutationObserver(mirrorState));
      floaterMirrorObs.observe(mainBtn, { attributes: true, attributeFilter: ['disabled', 'aria-busy'] });

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

        // AYS Ola 3 #14 — fix Turnstile race. Previously the fetch fired even
        // if window.qfTurnstileToken hadn't resolved yet; the backend then saw
        // a missing token and rejected. Now we request execution (if needed)
        // and wait up to 8 seconds for the global callback to set the token
        // before submitting. If the token never arrives we still try the
        // fetch — the backend's captcha check will return a friendly 403 and
        // the user can retry.
        // AYS Ola 4 Commit L HI-3 — cancel pending setTimeout chain when the
        // Promise resolves early (token arrived or timeout). Previous
        // implementation let orphaned timers fire after resolve, touching
        // stale state and leaking closures.
        function awaitTurnstile() {
          return new Promise(function (resolve) {
            if (window.qfTurnstileToken) return resolve(window.qfTurnstileToken);
            if (!window.turnstile) return resolve(null);
            // Reset before execute so rapid Submit clicks don't trigger
            // Cloudflare's "Call to execute() on a widget that is already
            // executing" warning, which can leave a stale challenge in flight.
            try {
              if (typeof window.turnstile.reset === 'function') {
                window.turnstile.reset('#qfTurnstile');
              }
              window.turnstile.execute('#qfTurnstile');
            } catch (_) {}
            var start = Date.now();
            var timerId = null;
            var settled = false;
            function done(v) {
              if (settled) return;
              settled = true;
              if (timerId) { clearTimeout(timerId); timerId = null; }
              resolve(v);
            }
            (function check() {
              if (settled) return;
              if (window.qfTurnstileToken) return done(window.qfTurnstileToken);
              if (Date.now() - start > 8000) return done(null);
              timerId = setTimeout(check, 120);
            })();
          });
        }

        // AYS Ola 4 Commit L CR-1 — Turnstile tokens are single-use. After each
        // submit attempt (success OR error), clear the cached token and reset
        // the widget so the next retry requests a fresh one. Prevents the
        // "backend 403: token already used" loop on resubmit.
        function resetTurnstile() {
          window.qfTurnstileToken = null;
          try {
            if (window.turnstile && typeof window.turnstile.reset === 'function') {
              window.turnstile.reset('#qfTurnstile');
            }
          } catch (_) {}
        }

        awaitTurnstile().then(function (token) {
          var payload = buildSubmitPayload();
          if (token) payload.turnstileToken = token;
          return fetch('/api/submit-quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }).then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
        }).then(function (result) {
          if (!result.ok || !result.data || !result.data.ok) {
            resetTurnstile();
            // Ola 3 — differentiate error messages by status so the user knows
            // whether to retry (transient) or contact support (systemic).
            var title = 'Submission failed';
            var msg;
            var serverMsg = result.data && result.data.error;
            if (result.status === 429) {
              title = 'Too many attempts';
              msg = 'You\u2019ve submitted a few times in the last hour. Please wait a bit or email info@eccofacilities.com and we\u2019ll take it from there.';
            } else if (result.status === 403 || result.status === 401) {
              title = 'Security check didn\u2019t pass';
              msg = 'Please refresh the page and try once more. If it keeps failing, email info@eccofacilities.com.';
            } else if (result.status >= 500) {
              title = 'Our server hiccupped';
              msg = 'This is on our side, not you. Please try again in a minute, or email info@eccofacilities.com and we\u2019ll follow up personally.';
            } else {
              msg = serverMsg || 'Please review your answers and try again, or email info@eccofacilities.com.';
            }
            qfToast({ type:'error', title: title, message: msg, duration: 7000 });
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            submitBtn.classList.remove('is-loading');
            submitBtn.innerHTML = originalHTML;
            return;
          }
          // Success path — also reset so a quick nav-back-and-resubmit doesn't
          // reuse a stale token (edge case but keeps state clean).
          resetTurnstile();
          // Success: show success screen
          // Fix #30 — if backend didn't return a ref, generate a readable one client-side
          // AYS Ola 4 Commit N ME-7 — match backend format: prefix + timestamp + '-' + 4 random
          var refNumber = result.data.ref || (function () {
            var tail = '';
            try {
              var r = crypto.getRandomValues(new Uint8Array(3));
              tail = Array.from(r).map(function (b) { return b.toString(36).padStart(2,'0'); }).join('').slice(0,4).toUpperCase();
            } catch (_) {
              tail = Math.random().toString(36).slice(2, 6).toUpperCase();
            }
            return (STATE.service === 'dayporter' ? 'EDP-' : 'ECJ-')
                   + Date.now().toString(36).toUpperCase()
                   + '-' + tail;
          })();
          var successTitle = document.getElementById('qfSuccessTitle');
          var successSub = document.getElementById('qfSuccessSub');
          if (successTitle) {
            successTitle.textContent = STATE.userName
              ? 'Your proposal is on its way, ' + STATE.userName + '!'
              : 'Your proposal is on its way!';
          }
          if (successSub && STATE.userEmail) {
            successSub.textContent = 'Check ' + STATE.userEmail + '. Your custom plan will be there shortly.';
          }
          // V2 \u2014 populate the qf2 success markup (XSS-safe via textContent)
          var qf2Name = document.getElementById('qf2SuccessName');
          var qf2Ref  = document.getElementById('qf2SuccessRef');
          if (qf2Name) qf2Name.textContent = STATE.userName || 'there';
          if (qf2Ref) qf2Ref.textContent = refNumber || '\u2014';

          // V2 \u2014 site walk variant (mockup G section 09 demo C)
          if (STATE.needsSiteWalk) {
            var qf2Subtitle = document.querySelector('.qf2-success-subtitle');
            if (qf2Subtitle && !qf2Subtitle.querySelector('.qf2-success-extra')) {
              var extra = document.createElement('span');
              extra.className = 'qf2-success-extra';
              extra.textContent = 'Plus a link to pick a time for your visit ~';
              qf2Subtitle.appendChild(extra);
            }
            // Highlight the third timeline item as the site visit step
            var tlItems = document.querySelectorAll('.qf2-timeline-item');
            if (tlItems.length >= 3) {
              tlItems[2].classList.add('is-walk');
              var tlWhen = tlItems[2].querySelector('.qf2-timeline-when');
              if (tlWhen) tlWhen.textContent = 'Site visit';
              var tlWhat = tlItems[2].querySelector('.qf2-timeline-what');
              if (tlWhat) tlWhat.textContent = 'Pick a time from the link.';
            }
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
            var shareTitle = 'Ecco Facilities · commercial cleaning in NYC';
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
          // AYS Ola 3 Commit G #40 + Ola 4 Commit L CR-1 — differentiate captcha
          // failures from network errors AND reset the stale token so retry works.
          resetTurnstile();
          var msg = (err && /captcha|turnstile/i.test(err.message || ''))
            ? 'Captcha didn\u2019t load. Please refresh and try again.'
            : 'Check your connection and try again, or email info@eccofacilities.com.';
          qfToast({ type:'error', title:'Submission failed', message: msg, duration: 7000 });
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

  // Ola 2 — a11y: track the element that had focus before the modal
  // opened so we can restore it on close.
  var exitPrevFocus = null;
  function qfExitClose() {
    if (!exitOverlay || exitOverlay.hidden) return;
    exitOverlay.hidden = true;
    if (exitPrevFocus && typeof exitPrevFocus.focus === 'function') {
      try { exitPrevFocus.focus(); } catch (e) { /* ignore */ }
    }
    exitPrevFocus = null;
  }
  function qfExitOpen() {
    if (!exitOverlay || exitShown) return;
    exitShown = true;
    sessionStorage.setItem('qf_exit_shown', '1');
    exitPrevFocus = document.activeElement;
    exitOverlay.hidden = false;
    // Focus the email input on open so keyboard users land inside the dialog.
    var firstInput = exitOverlay.querySelector('input, button');
    if (firstInput) setTimeout(function () { try { firstInput.focus(); } catch (e) {} }, 0);
  }

  if (exitOverlay && !sessionStorage.getItem('qf_exit_shown')) {
    // Delay exit intent — only arm after 20 seconds on page
    setTimeout(function () {
      // Desktop: detect mouse leaving the top edge of the viewport
      document.addEventListener('mouseleave', function (e) {
        if (e.clientY > 5) return;
        qfExitOpen();
      });
      // AYS Ola 3 #16 — mobile equivalent: fire when the tab becomes hidden,
      // which covers switching apps, pulling up the URL bar, or closing the tab.
      // Gated to touch-first devices so desktop still uses mouseleave only.
      if (qfTouchFirst) {
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'hidden' && STATE.currentStepName !== 'welcome' && STATE.currentStepName !== 'success') {
            qfExitOpen();
          }
        });
      }
    }, 20000);
  }
  if (exitClose) {
    exitClose.addEventListener('click', qfExitClose);
  }
  // Ola 2 — ESC closes the dialog; Tab is trapped inside the dialog so
  // keyboard users can't walk into stale form controls behind it.
  if (exitOverlay) {
    document.addEventListener('keydown', function (e) {
      if (exitOverlay.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); qfExitClose(); return; }
      if (e.key !== 'Tab') return;
      var focusables = exitOverlay.querySelectorAll('input, button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
          qfExitClose();
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
     Prefill from chat widget handoff — reads ?firstName=&email=&phone=...
     and auto-populates the personal info inputs. Does NOT overwrite any
     user-entered data (setValueIfEmpty only fills blank fields).
     ----------------------------------------------------------------------- */
  (function prefillFromUrl() {
    try {
      if (!location.search) return;
      var params = new URLSearchParams(location.search);
      var setIfEmpty = function(id, value) {
        if (!value) return;
        var el = document.getElementById(id);
        if (el && !el.value) {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      setIfEmpty('qfUserFirstName', params.get('firstName'));
      setIfEmpty('qfUserLastName', params.get('lastName'));
      setIfEmpty('qfUserEmail', params.get('email'));
      setIfEmpty('qfUserPhone', params.get('phone'));
      setIfEmpty('qfCompanyName', params.get('company'));
      setIfEmpty('qfAddress', params.get('address'));
      /* Stash non-input params on STATE for the flow to pick up later */
      var space = params.get('space');
      var size = params.get('size');
      var freq = params.get('freq');
      var urgency = params.get('urgency');
      if (typeof STATE !== 'undefined') {
        if (space) STATE.prefillSpace = space;
        if (size) STATE.prefillSize = size;
        if (freq) STATE.prefillFreq = freq;
        if (urgency) STATE.prefillUrgency = urgency;
      }
    } catch (e) {}
  })();

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
    textWrap.appendChild(document.createTextNode('. Pick up where you left off?'));

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

    // H3 D37 — Save-for-later toast. The flowbar's "Save" button already
    // calls saveDraft() and flashes the button text. But on the first save
    // of a session, also show a contextual toast explaining how the user
    // resumes (returning visit auto-shows the resume banner; if they've
    // already given email, we can mail a recovery link). This sets clearer
    // expectations for the "what happens to my answers" question.
    (function saveForLaterToast() {
      var FIRST_SAVE_FLAG = 'ecco_quote_save_explained_v1';
      document.addEventListener('click', function (e) {
        var btn = e.target.closest('.qf2-flowbar-skip');
        if (!btn) return;
        var alreadyExplained;
        try { alreadyExplained = !!localStorage.getItem(FIRST_SAVE_FLAG); } catch (_) { alreadyExplained = false; }
        if (alreadyExplained) return;
        var hasEmail = window.STATE && window.STATE.userEmail;
        var msg = hasEmail
          ? "Saved. Come back from this device, or check " + window.STATE.userEmail + " for the resume link."
          : "Saved on this device. Add your email at the You step so we can mail you the resume link.";
        try {
          if (typeof qfToast === 'function') {
            qfToast({ type: 'success', title: 'Draft saved', message: msg, duration: 5500 });
          }
          localStorage.setItem(FIRST_SAVE_FLAG, '1');
        } catch (_) {}
      });
    })();

    // H3 D36 — first-visit hint. Show a one-time micro banner ("Takes ~2
     // minutes — your draft auto-saves") if the user has no draft AND no
     // localStorage flag indicating they've seen the form before. Sets the
     // flag on dismiss or on any meaningful interaction. Avoids spam for
     // returning visitors.
    (function firstVisitHint() {
      var FLAG = 'ecco_quote_seen_v1';
      try {
        if (localStorage.getItem(FLAG)) return;
        if (localStorage.getItem('ecco_quote_draft_v1')) return; // already engaged
      } catch (_) { return; }
      var welcome = document.querySelector('.qf-screen.step-1');
      if (!welcome) return;
      var hint = document.createElement('div');
      hint.className = 'qf2-first-visit-hint';
      hint.setAttribute('role', 'note');
      hint.innerHTML = '<span class="qf2-first-visit-msg">Takes about 2 minutes &mdash; your answers auto-save as you go.</span>'
        + '<button type="button" class="qf2-first-visit-dismiss" aria-label="Dismiss">&times;</button>';
      welcome.appendChild(hint);
      function dismiss() {
        hint.classList.add('is-leaving');
        setTimeout(function () { hint.remove(); }, 250);
        try { localStorage.setItem(FLAG, '1'); } catch (_) {}
      }
      hint.querySelector('.qf2-first-visit-dismiss').addEventListener('click', dismiss);
      // Auto-mark seen on first card click (the user has clearly engaged).
      welcome.querySelectorAll('[data-service]').forEach(function (card) {
        card.addEventListener('click', function () { try { localStorage.setItem(FLAG, '1'); } catch (_) {} }, { once: true });
      });
      // Auto-dismiss after 12s if untouched.
      setTimeout(dismiss, 12000);
    })();

    // H2 D35 — Turnstile lazy-load. Only fetch the Cloudflare challenge
    // script when the user actually reaches the Contact (Review) step.
    // Saves ~50KB + a third-party connection on every form session that
    // bounces earlier. Idempotent: subsequent activations don't re-inject.
    (function turnstileLazy() {
      var injected = false;
      function inject() {
        if (injected) return;
        injected = true;
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
      var stage = document.getElementById('qfStage');
      if (!stage) return;
      // If contact is already active (e.g. on resume) inject right away.
      if (document.querySelector('#qfScreen_contact.is-active')) inject();
      var obs = new MutationObserver(function () {
        if (document.querySelector('#qfScreen_contact.is-active')) inject();
      });
      obs.observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'] });
    })();

    // H1 D34 — input sanitization on paste. Browser pastes can carry weird
    // unicode, control chars, or 5MB blobs from a clipboard manager. Cap
    // pasted text to each input's maxlength + strip C0 control characters
    // (except \n, \r, \t which are legitimate in textarea). Keeps payload
    // safe and predictable for the sales team that reads the lead later.
    (function inputSanitizer() {
      function clean(str, allowMultiline) {
        if (!str) return '';
        // Strip C0 control chars (except \t, \n, \r when allowed).
        var pattern = allowMultiline
          ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
          : /[\x00-\x1F\x7F]/g;
        return str.replace(pattern, '').normalize ? str.replace(pattern, '').normalize('NFC') : str.replace(pattern, '');
      }
      document.addEventListener('paste', function (e) {
        var t = e.target;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) return;
        var max = parseInt(t.getAttribute('maxlength') || '0', 10);
        var raw = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        var allowML = t.tagName === 'TEXTAREA';
        var cleaned = clean(raw, allowML);
        if (max > 0 && cleaned.length > max) cleaned = cleaned.slice(0, max);
        if (cleaned !== raw) {
          e.preventDefault();
          // Insert cleaned text at cursor.
          var start = t.selectionStart || 0;
          var end = t.selectionEnd || 0;
          var before = t.value.slice(0, start);
          var after = t.value.slice(end);
          t.value = (before + cleaned + after).slice(0, max || Infinity);
          // Trigger input event so existing handlers (validation, save-draft) run.
          t.dispatchEvent(new Event('input', { bubbles: true }));
          t.setSelectionRange(before.length + cleaned.length, before.length + cleaned.length);
        }
      });
    })();

    // H1 D32 — network resilience. Listen for online/offline transitions so
    // a user who briefly loses WiFi sees a clear banner and the Submit button
    // is disabled until connection returns. Avoids the silent-fail where a
    // user clicks Send during a network blip and assumes their lead went
    // through. Banner is removed once back online.
    (function netGuard() {
      var liveBanner = null;
      function showOfflineBanner() {
        if (liveBanner) return;
        liveBanner = document.createElement('div');
        liveBanner.className = 'qf2-offline-banner';
        liveBanner.setAttribute('role', 'status');
        liveBanner.setAttribute('aria-live', 'polite');
        liveBanner.textContent = 'You’re offline. We’ll wait until you’re back to send anything.';
        document.body.appendChild(liveBanner);
        // Disable any visible Submit button.
        var sub = document.getElementById('qfContactSubmit');
        if (sub) { sub.disabled = true; sub.setAttribute('data-net-disabled', '1'); }
      }
      function hideOfflineBanner() {
        if (liveBanner) { liveBanner.remove(); liveBanner = null; }
        var sub = document.getElementById('qfContactSubmit');
        if (sub && sub.getAttribute('data-net-disabled') === '1') {
          sub.disabled = false;
          sub.removeAttribute('data-net-disabled');
        }
      }
      window.addEventListener('offline', showOfflineBanner);
      window.addEventListener('online', hideOfflineBanner);
      if (typeof navigator !== 'undefined' && navigator.onLine === false) showOfflineBanner();
    })();

    // H1 D33 — browser back button integration. Each goToScreen call pushes
    // a new entry; popstate handler routes back to the previous step instead
    // of leaving /quote.html entirely (which lost the user's draft state on
    // some Safari versions). The flag prevents re-pushing during back-nav.
    (function historyGuard() {
      var inPopstate = false;
      var origGoToScreen = window.goToScreen;
      // goToScreen lives in IIFE scope — patch via a wrapper that pushes
      // state. We hook into the SCREENS map mutations indirectly via a
      // MutationObserver on .qf-screen.is-active.
      var stage = document.getElementById('qfStage');
      if (!stage) return;
      var lastActiveId = null;
      var obs = new MutationObserver(function () {
        if (inPopstate) { inPopstate = false; return; }
        var act = stage.querySelector('.qf-screen.is-active');
        var id = act ? act.id : null;
        if (id && id !== lastActiveId) {
          lastActiveId = id;
          try { history.pushState({ screenId: id }, '', '#' + id.replace('qfScreen_', '')); } catch (_) {}
        }
      });
      obs.observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'] });
      window.addEventListener('popstate', function (e) {
        // Browser back: try to traverse our own goBack rather than leaving the page.
        if (typeof goBack === 'function') {
          inPopstate = true;
          try { goBack(); } catch (_) {}
        }
      });
    })();

    startBtn.addEventListener('click', function () {
      // Sprint 5 R-C — Undo pattern. Clear immediately (optimistic) but show
      // a 6-second toast with Undo. Restoring re-saves the draft and re-shows
      // the banner. After timeout the clear is permanent.
      var snapshot = null;
      try { snapshot = localStorage.getItem('ecco_quote_draft_v1'); } catch (_) {}
      clearDraft();
      banner.remove();

      // Build undo toast
      var toast = document.createElement('div');
      toast.className = 'qf2-undo-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      var msg = document.createElement('span');
      msg.className = 'qf2-undo-toast-msg';
      msg.textContent = 'Draft cleared.';
      var undo = document.createElement('button');
      undo.type = 'button';
      undo.className = 'qf2-undo-toast-btn';
      undo.textContent = 'Undo';
      toast.appendChild(msg);
      toast.appendChild(undo);
      document.body.appendChild(toast);
      // Slide-in
      requestAnimationFrame(function () { toast.classList.add('is-shown'); });

      var t = setTimeout(function () {
        toast.classList.remove('is-shown');
        setTimeout(function () { toast.remove(); }, 250);
      }, 6000);

      undo.addEventListener('click', function () {
        clearTimeout(t);
        if (snapshot) {
          try { localStorage.setItem('ecco_quote_draft_v1', snapshot); } catch (_) {}
        }
        toast.classList.remove('is-shown');
        setTimeout(function () { toast.remove(); location.reload(); }, 250);
      });
    });
  })();

  // Sprint 5 R-B — Alina hero pill: tap-to-expand with extended help text.
  // Each per-step pill carries data-alina-help. Click swaps the visible
  // message to the help copy; click again or click any other pill restores.
  // Stores original message in data-alina-original so we can revert.
  //
  // D40 — push the body's top: down by the expanded pill's overflow so it
  // doesn't overlap the H2 below. Required because .qf2-hero-wrap and
  // .qf2-body are independently absolute-positioned; without this hook the
  // pill grew vertically into the H2 region (most visible on mobile where
  // the help text wraps to 3-4 lines).
  function updateBodyTopForPill(pill) {
    var stage = pill.closest('.qf-screen');
    if (!stage) return;
    var body = stage.querySelector('.qf2-body');
    var heroWrap = stage.querySelector('.qf2-hero-wrap');
    if (!body || !heroWrap) return;
    // Cache the default top from CSS the first time we see this body.
    if (!body.hasAttribute('data-qf-default-top')) {
      body.setAttribute('data-qf-default-top', String(parseInt(window.getComputedStyle(body).top, 10) || 0));
    }
    var defaultTop = parseInt(body.getAttribute('data-qf-default-top'), 10) || 0;
    var expanded = pill.getAttribute('aria-expanded') === 'true';
    if (!expanded) {
      body.style.top = '';
      body.style.transition = '';
      return;
    }
    var heroTop = heroWrap.getBoundingClientRect().top - (stage.getBoundingClientRect().top || 0);
    var pillBottom = heroTop + pill.getBoundingClientRect().height;
    var minTop = Math.ceil(pillBottom + 14); // 14px breathing buffer
    if (minTop > defaultTop) {
      body.style.transition = 'top .25s cubic-bezier(0.16, 1, 0.3, 1)';
      body.style.top = minTop + 'px';
    } else {
      body.style.top = '';
    }
  }

  document.addEventListener('click', function (e) {
    var pill = e.target.closest('.qf2-alina-hero[role="button"]');
    if (!pill) return;
    var help = pill.getAttribute('data-alina-help');
    if (!help) return;
    var textEl = pill.querySelector('.qf2-alina-hero-text');
    if (!textEl) return;
    var expanded = pill.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      // Collapse: restore original
      var orig = pill.getAttribute('data-alina-original');
      if (orig) textEl.innerHTML = orig;
      pill.setAttribute('aria-expanded', 'false');
    } else {
      // Expand: stash current, show help
      pill.setAttribute('data-alina-original', textEl.innerHTML);
      // Keep the "Alina ·" prefix when present, swap the rest.
      var nameEl = textEl.querySelector('.qf2-alina-name');
      if (nameEl) {
        textEl.innerHTML = nameEl.outerHTML + ' &middot; ' + help;
      } else {
        textEl.textContent = help;
      }
      pill.setAttribute('aria-expanded', 'true');
    }
    // D40 — re-measure on next frame so layout has settled.
    requestAnimationFrame(function () { updateBodyTopForPill(pill); });
  });
  // D40 — also re-measure when viewport resizes (text wraps differently).
  window.addEventListener('resize', function () {
    var pill = document.querySelector('.qf-screen.is-active .qf2-alina-hero[aria-expanded="true"]');
    if (pill) updateBodyTopForPill(pill);
  });
  // Keyboard activation (Enter/Space) on the pill — already handled by
  // browser default for elements with role="button" + tabindex=0, but only
  // when the click handler fires. The line below ensures Space doesn't scroll.
  document.addEventListener('keydown', function (e) {
    var pill = e.target.closest && e.target.closest('.qf2-alina-hero[role="button"]');
    if (!pill) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      pill.click();
    }
  });

  // Sprint 4b D17 + Sprint 5 R-D — keyboard shortcuts on the active screen.
  // Esc → back. Digits 1-9 → activate Nth picker card (not while typing).
  // Enter on Info text inputs → click the screen's primary CTA.
  // Arrow keys on chip groups → focus next/prev chip (roving tabindex).
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var isTyping = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

    // Esc → goBack (works anywhere except modal/datepicker contexts)
    if (e.key === 'Escape' && typeof goBack === 'function') {
      if (document.querySelector('.qf2-edit-panel, .qf2-exit-overlay:not([hidden])')) return;
      e.preventDefault();
      goBack();
      return;
    }

    // Sprint 5 R-D — Enter on Info text inputs activates the primary CTA on
    // that screen. Avoids users having to Tab to the button. Excludes textarea
    // (newline is intentional there) and email field if format is invalid.
    if (e.key === 'Enter' && t && t.tagName === 'INPUT' && t.type !== 'submit') {
      var active = document.querySelector('.qf-screen.is-active');
      if (active) {
        var primaryCta = active.querySelector('.qf2-cta:not([hidden]):not([disabled])');
        if (primaryCta) {
          e.preventDefault();
          primaryCta.click();
          return;
        }
      }
    }

    // Sprint 5 R-D — Arrow keys on chip groups: roving focus to prev/next chip
    // within the same row. Keeps Tab order at chip-group level (one tab stop)
    // and lets arrow keys navigate within. Common a11y pattern for radio groups.
    if (!isTyping && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      if (t && t.classList && t.classList.contains('qf2-chip')) {
        var row = t.closest('.qf2-chip-row');
        if (row) {
          var chips = Array.from(row.querySelectorAll('.qf2-chip'));
          var idx = chips.indexOf(t);
          if (idx >= 0) {
            var nextIdx;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = (idx - 1 + chips.length) % chips.length;
            else nextIdx = (idx + 1) % chips.length;
            e.preventDefault();
            chips[nextIdx].focus();
            return;
          }
        }
      }
    }

    // Number keys 1-9 → click the Nth card on the active screen (skip when typing)
    if (!isTyping && /^[1-9]$/.test(e.key)) {
      var idx2 = parseInt(e.key, 10) - 1;
      var active2 = document.querySelector('.qf-screen.is-active');
      if (!active2) return;
      var cards = active2.querySelectorAll(
        '.qf2-grid-3 .qf2-card[data-service], ' +
        '.qf2-grid-6 .qf2-card[data-space], ' +
        '.qf2-size-grid .qf2-size-card[data-size]'
      );
      if (cards[idx2]) {
        e.preventDefault();
        cards[idx2].click();
      }
    }
  });

})();
