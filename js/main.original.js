/* Ecco Facilities — Premium JS */
(function(){
  /* Mobile menu toggle */
  const nm = document.getElementById('navMenu');
  const mobTog = document.getElementById('mobTog');
  if(mobTog && nm){
    mobTog.addEventListener('click', () => {
      nm.classList.toggle('active');
      mobTog.classList.toggle('open');
      mobTog.setAttribute('aria-expanded', nm.classList.contains('active'));
    });
    nm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nm.classList.remove('active');
      mobTog.classList.remove('open');
      mobTog.setAttribute('aria-expanded', 'false');
    }));
  }

  /* Smart Nav — hide on scroll down, show on scroll up + progress bar */
  const nav = document.getElementById('nav');
  const btt = document.getElementById('btt');
  let lastScroll = 0;
  let ticking = false;
  const heroEl = document.querySelector('.hero');
  const heroH = heroEl ? heroEl.offsetHeight : 600;

  window.addEventListener('scroll', () => {
    if(!ticking) {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? (sy / docH) * 100 : 0;
        // Recalculate hero height for accuracy
        if(heroEl) heroH = heroEl.offsetHeight;

        if(nav) {
          nav.classList.toggle('scrolled', sy > 20);
          nav.style.setProperty('--scroll-progress', progress + '%');
          // Hide nav on scroll down past hero, show on scroll up
          if(sy > heroH && sy > lastScroll + 5) {
            nav.classList.add('nav-hidden');
          } else if(sy < lastScroll - 5 || sy <= heroH) {
            nav.classList.remove('nav-hidden');
          }
        }
        if(btt) btt.classList.toggle('vis', sy > 600);
        lastScroll = sy;
        ticking = false;
      });
      ticking = true;
    }
  });

  /* Hero parallax */
  const heroImg = document.querySelector('.hero-img');
  const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(heroImg && !noMotion) {
    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        if(sy < window.innerHeight) {
          heroImg.style.transform = 'translateY(' + (sy * 0.3) + 'px) scale(1.05)';
        }
      });
    }, { passive: true });
  }

  /* Scroll reveal with stagger (IntersectionObserver) */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting) {
        // Stagger children if element has data-stagger
        const staggerEls = en.target.querySelectorAll('.rv-child');
        if(staggerEls.length > 0) {
          staggerEls.forEach((child, i) => {
            child.style.transitionDelay = (i * 0.08) + 's';
            child.classList.add('vis');
          });
        }
        en.target.classList.add('vis');
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.rv').forEach(el => obs.observe(el));

  /* Back to top */
  if(btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Stats counter animation */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    const suffix = raw.replace(/[\d.]/g, '');
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const isFloat = raw.includes('.');
    el.textContent = '0' + suffix;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      const val = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const statObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.querySelectorAll('.stat-num').forEach(animateCounter);
        statObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stats-bar').forEach(el => statObs.observe(el));

  /* FAQ Accordion — with ARIA support */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      // Close all other items
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      // Toggle current
      if(!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Reduced motion check for parallax */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
