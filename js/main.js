(function(){ const nm = document.getElementById('navMenu'); const mobTog = document.getElementById('mobTog'); if(mobTog && nm){ mobTog.addEventListener('click', () => { nm.classList.toggle('active'); mobTog.classList.toggle('open'); mobTog.setAttribute('aria-expanded', nm.classList.contains('active')); }); nm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nm.classList.remove('active'); mobTog.classList.remove('open'); mobTog.setAttribute('aria-expanded', 'false'); })); } const nav = document.getElementById('nav'); const btt = document.getElementById('btt'); let lastScroll = 0; let ticking = false; const heroEl = document.querySelector('.hero'); let heroH = heroEl ? heroEl.offsetHeight : 600; const heroImg = document.querySelector('.hero-img'); const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; window.addEventListener('scroll', () => { if(!ticking) { requestAnimationFrame(() => { const sy = window.scrollY; const docH = document.documentElement.scrollHeight - window.innerHeight; const progress = docH > 0 ? (sy / docH) * 100 : 0; if(heroEl) heroH = heroEl.offsetHeight; if(nav) { nav.classList.toggle('scrolled', sy > 20); nav.style.setProperty('--scroll-progress', progress + '%'); if(sy > heroH && sy > lastScroll + 5) { nav.classList.add('nav-hidden'); } else if(sy < lastScroll - 5 || sy <= heroH) { nav.classList.remove('nav-hidden'); } } if(btt) btt.classList.toggle('vis', sy > 600); if(heroImg && !noMotion && sy < window.innerHeight) { heroImg.style.transform = 'translateY(' + (sy * 0.3) + 'px) scale(1.05)'; } lastScroll = sy; ticking = false; }); ticking = true; } }, { passive: true }); const obs = new IntersectionObserver(entries => { entries.forEach(en => { if(en.isIntersecting) { const staggerEls = en.target.querySelectorAll('.rv-child'); if(staggerEls.length > 0) { staggerEls.forEach((child, i) => { child.style.transitionDelay = (i * 0.08) + 's'; child.classList.add('vis'); }); } en.target.classList.add('vis'); obs.unobserve(en.target); } }); }, { threshold: 0.02, rootMargin: '0px 0px -10px 0px' }); document.querySelectorAll('.rv').forEach(el => obs.observe(el)); setTimeout(() => { document.querySelectorAll('.rv:not(.vis), .rv-light:not(.vis)').forEach(el => el.classList.add('vis')); }, 3000); if(btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); function animateCounter(el) { const raw = el.textContent.trim(); const suffix = raw.replace(/[\d.]/g, ''); const target = parseFloat(raw); if (isNaN(target)) return; const duration = 1400; const start = performance.now(); const isFloat = raw.includes('.'); el.textContent = '0' + suffix; function tick(now) { const p = Math.min((now - start) / duration, 1); const ease = 1 - Math.pow(1 - p, 4); const val = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease); el.textContent = val + suffix; if (p < 1) requestAnimationFrame(tick); } requestAnimationFrame(tick); } const statObs = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { en.target.querySelectorAll('.stat-num').forEach(animateCounter); statObs.unobserve(en.target); } }); }, { threshold: 0.3 }); document.querySelectorAll('.stats-bar').forEach(el => statObs.observe(el)); document.querySelectorAll('.faq-q').forEach(btn => { btn.addEventListener('click', () => { const item = btn.parentElement; const wasOpen = item.classList.contains('open'); document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); }); if(!wasOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } }); }); const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* Service comparison tab switching */
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
      p.setAttribute('aria-hidden', p.id !== target ? 'true' : 'false');
    });
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
    var isCollapsed = grid.classList.contains('collapsed');
    grid.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
    btn.textContent = isCollapsed ? 'Show fewer' : 'Show all ' + grid.children.length + ' items';
  });
});

/* Observe rv-light elements for reveal */
document.querySelectorAll('.rv-light').forEach(function(el) { obs.observe(el); });

})();