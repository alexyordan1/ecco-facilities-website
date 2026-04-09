(function(){ const nm = document.getElementById('navMenu'); const mobTog = document.getElementById('mobTog'); var navOverlay = document.createElement('div'); navOverlay.className = 'nav-overlay'; document.body.appendChild(navOverlay);
function closeNav() { nm.classList.remove('active'); mobTog.classList.remove('open'); mobTog.setAttribute('aria-expanded', 'false'); navOverlay.classList.remove('vis'); document.body.style.overflow = ''; }
if(mobTog && nm){ mobTog.addEventListener('click', () => { var isOpen = nm.classList.toggle('active'); mobTog.classList.toggle('open'); mobTog.setAttribute('aria-expanded', isOpen); navOverlay.classList.toggle('vis', isOpen); if(nav) nav.style.zIndex = isOpen ? '1000' : ''; document.body.style.overflow = isOpen ? 'hidden' : ''; }); nm.querySelectorAll('a').forEach(a => a.addEventListener('click', function(){ closeNav(); if(nav) nav.style.zIndex = ''; })); navOverlay.addEventListener('click', function(){ closeNav(); if(nav) nav.style.zIndex = ''; }); } const nav = document.getElementById('nav'); const btt = document.getElementById('btt'); let lastScroll = 0; let ticking = false; const heroEl = document.querySelector('.hero'); let heroH = heroEl ? heroEl.offsetHeight : 600; const heroImg = document.querySelector('.hero-img'); const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; window.addEventListener('scroll', () => { if(!ticking) { requestAnimationFrame(() => { const sy = window.scrollY; const docH = document.documentElement.scrollHeight - window.innerHeight; const progress = docH > 0 ? (sy / docH) * 100 : 0; if(heroEl) heroH = heroEl.offsetHeight; if(nav) { nav.classList.toggle('scrolled', sy > 20); nav.style.setProperty('--scroll-progress', progress + '%'); if(sy > heroH && sy > lastScroll + 5) { nav.classList.add('nav-hidden'); } else if(sy < lastScroll - 5 || sy <= heroH) { nav.classList.remove('nav-hidden'); } } if(btt) btt.classList.toggle('vis', sy > 600); if(heroImg && !noMotion && sy < window.innerHeight) { var zoom = 1.1 - (sy / window.innerHeight) * 0.1; heroImg.style.transform = 'translateY(' + (sy * 0.25) + 'px) scale(' + Math.max(zoom, 1) + ')'; } lastScroll = sy; ticking = false; }); ticking = true; } }, { passive: true }); const obs = new IntersectionObserver(entries => { entries.forEach(en => { if(en.isIntersecting) { const staggerEls = en.target.querySelectorAll('.rv-child'); if(staggerEls.length > 0) { staggerEls.forEach((child, i) => { child.style.transitionDelay = (i * 0.08) + 's'; child.classList.add('vis'); }); } en.target.classList.add('vis'); obs.unobserve(en.target); } }); }, { threshold: 0.02, rootMargin: '0px 0px -10px 0px' }); document.querySelectorAll('.rv').forEach(el => obs.observe(el)); setTimeout(() => { document.querySelectorAll('.rv:not(.vis), .rv-light:not(.vis)').forEach(el => { el.querySelectorAll('.rv-child').forEach((child, i) => { child.style.transitionDelay = (i * 0.08) + 's'; child.classList.add('vis'); }); el.classList.add('vis'); }); }, 3000); if(btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); function animateCounter(el) { const raw = el.textContent.trim(); const suffix = raw.replace(/[\d.]/g, ''); const target = parseFloat(raw); if (isNaN(target)) return; const duration = 1400; const start = performance.now(); const isFloat = raw.includes('.'); el.textContent = '0' + suffix; function tick(now) { const p = Math.min((now - start) / duration, 1); const ease = 1 - Math.pow(1 - p, 4); const val = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease); el.textContent = val + suffix; if (p < 1) requestAnimationFrame(tick); } requestAnimationFrame(tick); } const statObs = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { en.target.querySelectorAll('.stat-num').forEach(animateCounter); statObs.unobserve(en.target); } }); }, { threshold: 0.3 }); document.querySelectorAll('.stats-bar').forEach(el => statObs.observe(el)); document.querySelectorAll('.faq-q').forEach(btn => { btn.addEventListener('click', () => { const item = btn.parentElement; const wasOpen = item.classList.contains('open'); document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); }); if(!wasOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } }); }); const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* GA4 dataLayer event tracking — fires when GTM is active */
window.dataLayer = window.dataLayer || [];
function trackEvent(event, params) { window.dataLayer.push(Object.assign({ event: event }, params || {})); }

/* Track CTA clicks */
document.querySelectorAll('a[href*="quote"], a[href*="Quote"], .btn-primary, .btn-outline').forEach(function(el) {
  el.addEventListener('click', function() {
    trackEvent('cta_click', { cta_text: el.textContent.trim().substring(0, 50), cta_url: el.href || '', page: location.pathname });
  });
});

/* Track email link clicks */
document.querySelectorAll('a[href^="mailto:"]').forEach(function(el) {
  el.addEventListener('click', function() { trackEvent('email_click', { page: location.pathname }); });
});

/* Track phone link clicks */
document.querySelectorAll('a[href^="tel:"]').forEach(function(el) {
  el.addEventListener('click', function() { trackEvent('phone_click', { page: location.pathname }); });
});

/* Track chat widget open */
var chatBtn = document.getElementById('ecco-chat-toggle') || document.querySelector('.chat-toggle');
if (chatBtn) { chatBtn.addEventListener('click', function() { trackEvent('chat_open', { page: location.pathname }); }); }

/* Track newsletter form submission */
document.querySelectorAll('.footer-nl-form').forEach(function(form) {
  form.addEventListener('submit', function() { trackEvent('newsletter_signup', { page: location.pathname }); });
});

/* Promise Pillars — interactive detail panel */
(function initPillars() {
  var pillars = document.querySelectorAll('.pillar[data-pillar]');
  var detail = document.getElementById('pillar-detail');
  if (!pillars.length || !detail) return;
  var data = [
    { badge: '$', title: 'Transparent, custom pricing', text: 'Every proposal is built from scratch for your space. No generic packages, no hidden fees. You only pay for what you need. Most clients are surprised at how competitive our pricing is \u2014 you\u2019ll have transparent numbers within 24 hours.' },
    { badge: '\u2713', title: 'Satisfaction guaranteed \u2014 always', text: 'We re-clean at no charge. No questions asked, no fine print. If anything doesn\u2019t meet your standards, we send your team back within 24 hours. Your satisfaction isn\u2019t negotiable.' },
    { badge: '\u26A1', title: 'Start in days, not weeks', text: 'Most new clients are fully onboarded within 5-7 business days. For urgent needs, we can often begin within 48 hours. Your dedicated team arrives trained on your specific space and standards.' },
    { badge: '\uD83C\uDF3F', title: '100% eco-certified products', text: 'Green Seal certified, EPA Safer Choice approved. Biodegradable, plant-based, completely safe for children, pets, and people with allergies. No harsh chemicals ever enter your space.' },
    { badge: '\u221E', title: 'Flexible terms, no lock-ins', text: 'We don\u2019t lock you into rigid multi-year contracts. We earn your business every visit. If you\u2019re not happy, adjust or cancel. We keep clients because we\u2019re great \u2014 not because of fine print.' },
    { badge: '\uD83D\uDC65', title: 'Your dedicated team, every visit', text: 'Consistency is core. Your team learns your space, preferences, and standards. No random crew rotations. If someone\u2019s unavailable, we notify you and send a trained backup.' }
  ];
  pillars.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(btn.getAttribute('data-pillar'));
      pillars.forEach(function(p) { p.classList.remove('active'); p.setAttribute('aria-expanded', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      detail.style.animation = 'none';
      detail.offsetHeight;
      detail.style.animation = '';
      detail.querySelector('.pillar-badge').textContent = data[idx].badge;
      detail.querySelector('h3').textContent = data[idx].title;
      detail.querySelector('p').textContent = data[idx].text;
    });
  });
})();

/* Service comparison — viewport-aware ARIA */
var svcMq = window.matchMedia('(max-width: 900px)');
function syncSvcAria() {
  var panels = document.querySelectorAll('.svc-panel');
  if (!panels.length) return;
  if (svcMq.matches) {
    panels.forEach(function(p) { p.setAttribute('aria-hidden', p.classList.contains('active') ? 'false' : 'true'); });
  } else {
    panels.forEach(function(p) { p.removeAttribute('aria-hidden'); });
  }
}
if (document.querySelectorAll('.svc-panel').length) {
  syncSvcAria();
  svcMq.addEventListener('change', syncSvcAria);
}

/* Tab switching */
document.querySelectorAll('.svc-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    var target = tab.dataset.panel;
    document.querySelectorAll('.svc-tab').forEach(function(t) {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      t.setAttribute('tabindex', t === tab ? '0' : '-1');
    });
    document.querySelectorAll('.svc-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === target);
    });
    syncSvcAria();
  });
});

/* Keyboard arrow navigation for tabs */
document.querySelectorAll('.svc-tabs').forEach(function(tablist) {
  tablist.addEventListener('keydown', function(e) {
    var tabs = Array.from(tablist.querySelectorAll('.svc-tab'));
    var idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      var next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    }
  });
});

/* Checklist accordion (mobile) */
document.querySelectorAll('.checklist-toggle').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var grid = btn.previousElementSibling;
    if (!grid || !grid.classList.contains('checklist-grid')) {
      grid = btn.parentElement.querySelector('.checklist-grid');
    }
    if (!grid) return;
    var isCollapsed = grid.classList.contains('collapsed');
    grid.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
    btn.textContent = isCollapsed ? 'Show fewer' : 'Show all ' + grid.children.length + ' items';
  });
});

/* Observe rv-light elements for reveal */
document.querySelectorAll('.rv-light').forEach(function(el) { obs.observe(el); });

})();

/* ============================================================
   HERO STATS — COUNTER ANIMATION
   ============================================================ */
(function initCounters() {
  var counters = document.querySelectorAll('.hero-stat-num');
  if (!counters.length) return;
  var animated = false;

  function animateCounters() {
    if (animated) return;
    animated = true;
    counters.forEach(function(el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 2000;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounters();
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(counters[0].closest('.hero-stats'));
  }

  /* Mandatory fallback — project rule */
  setTimeout(function() {
    if (!animated) {
      counters.forEach(function(el) {
        var target = el.getAttribute('data-target');
        var suffix = el.getAttribute('data-suffix') || '';
        el.textContent = target + suffix;
      });
      animated = true;
    }
  }, 3000);
})();

/* ============================================================
   INDUSTRIES ACCORDION
   ============================================================ */
(function initIndustryAccordion() {
  var cards = document.querySelectorAll('.ind-card');
  if (!cards.length) return;

  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var wasOpen = card.classList.contains('ind-card-open');
      cards.forEach(function(c) { c.classList.remove('ind-card-open'); });
      if (!wasOpen) card.classList.add('ind-card-open');
    });
  });
})();

/* ============================================================
   IMMERSIVE SERVICE TABS
   ============================================================ */
(function initSvcTabs() {
  var tabs = document.querySelectorAll('.svc-tab');
  var panels = document.querySelectorAll('.svc-panel');
  var bgs = document.querySelectorAll('.svc-bg');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.getAttribute('data-svc');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      panels.forEach(function(p) {
        if (p.getAttribute('data-svc') === target) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
      bgs.forEach(function(bg) {
        if (bg.getAttribute('data-svc') === target) {
          bg.classList.add('active');
        } else {
          bg.classList.remove('active');
        }
      });
    });
  });
})();

/* ============================================================
   PARALLAX ENGINE
   ============================================================ */
(function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 769) return; /* Skip on mobile for performance */

  var els = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;

  var visible = new Set();
  var ticking = false;

  var pObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    });
  }, { rootMargin: '100px' });

  els.forEach(function(el) { pObs.observe(el); });

  function updateParallax() {
    var scrollY = window.scrollY;
    visible.forEach(function(el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var rect = el.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var viewCenter = window.innerHeight / 2;
      var offset = (center - viewCenter) * speed;
      el.style.transform = 'translateY(' + offset + 'px)';
    });
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();

/* ============================================================
   DIRECTIONAL REVEAL OBSERVER
   ============================================================ */
(function initDirectionalReveals() {
  var revealEls = document.querySelectorAll('.rv-left, .rv-right, .rv-scale');
  if (!revealEls.length) return;

  var revObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('vis');
        revObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  revealEls.forEach(function(el) { revObs.observe(el); });

  /* Mandatory fallback — 3s */
  setTimeout(function() {
    revealEls.forEach(function(el) {
      if (!el.classList.contains('vis')) el.classList.add('vis');
    });
  }, 3000);
})();

/* ============================================================
   STAGGER DELAY HELPER
   ============================================================ */
(function initStagger() {
  document.querySelectorAll('[data-stagger]').forEach(function(parent) {
    var delay = parseFloat(parent.getAttribute('data-stagger')) || 0.12;
    var children = parent.children;
    for (var i = 0; i < children.length; i++) {
      children[i].style.transitionDelay = (i * delay) + 's';
    }
  });
})();

/* ============================================================
   HERO MORPH — Rotating words in headline
   ============================================================ */
(function initHeroMorph() {
  var el = document.querySelector('.hero-morph');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 900) return;
  var words = ['health.', 'future.', 'planet.', 'people.'];
  var idx = 0;
  function cycle() {
    el.style.opacity = '0';
    setTimeout(function() {
      idx = (idx + 1) % words.length;
      el.textContent = words[idx];
      el.style.opacity = '1';
    }, 400);
  }
  setInterval(cycle, 3000);
})();

/* ============================================================
   HERO BADGE — Rotating social proof messages
   ============================================================ */
(function initBadgeRotate() {
  var el = document.querySelector('.hero-badge-text');
  if (!el || window.innerWidth < 900) return;
  var msgs = [
    "NYC's Eco-Certified Facility Partner",
    '200+ Businesses Trust Us',
    '5.0 Rated on Google Reviews',
    '12+ Years Serving All 5 Boroughs'
  ];
  var idx = 0;
  setInterval(function() {
    el.style.opacity = '0';
    setTimeout(function() {
      idx = (idx + 1) % msgs.length;
      el.textContent = msgs[idx];
      el.style.opacity = '1';
    }, 800);
  }, 5000);
})();

/* ============================================================
   HERO TEST — Mobile word rotation (built from scratch)
   ============================================================ */
(function() {
  var word = document.querySelector('.hero-word-mobile');
  if (!word || window.innerWidth > 900) return;
  var list = ['health.', 'future.', 'people.', 'planet.'];
  var i = 0;
  word.style.transition = 'opacity .4s ease';
  setInterval(function() {
    word.style.opacity = '0';
    setTimeout(function() {
      i = (i + 1) % list.length;
      word.textContent = list[i];
      word.style.opacity = '1';
    }, 400);
  }, 3000);
})();