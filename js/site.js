(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Sticky nav state ── */
  var head = document.getElementById('siteHead');
  function onScroll(){ if(head){ head.classList.toggle('scrolled', window.scrollY > 24); } }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  /* ── Hero word rotator ── */
  /* ── Hero word rotator (ported from live initHeroRotate) ── */
  (function initHeroRotate(){
    var WORDS=[
      {key:'health',text:'health.',anim:'health'},
      {key:'team',text:'team.',anim:'team'},
      {key:'people',text:'people.',anim:'people'},
      {key:'planet',text:'planet.',anim:'planet'},
      {key:'future',text:'future.',anim:'future'},
      {key:'budget',text:'budget.',anim:'budget'}
    ];
    var CYCLE_MS=3400, EXIT_MS=320;
    var wraps=document.querySelectorAll('.hero-rotate');
    if(!wraps.length) return;
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function buildWordDom(wrap,def){
      var kids=wrap.children;
      for(var i=kids.length-1;i>=0;i--){var k=kids[i];if(!k.classList||!k.classList.contains('sizer'))wrap.removeChild(k);}
      var layer=document.createElement('span');
      layer.className='word-layer anim-'+def.anim;
      layer.setAttribute('data-word',def.key);
      if(def.anim==='team'||def.anim==='people'){
        var chars=def.text.split('');
        for(var j=0;j<chars.length;j++){var sp=document.createElement('span');sp.className='char';sp.textContent=chars[j];layer.appendChild(sp);}
      } else { layer.textContent=def.text; }
      wrap.appendChild(layer);
      void layer.offsetWidth;
      var addIn=function(){layer.classList.add('in');};requestAnimationFrame(addIn);setTimeout(addIn,60);
    }
    function exitLayer(layer){
      if(!layer) return;
      layer.classList.remove('in');layer.classList.add('out');
      setTimeout(function(){if(layer.parentNode)layer.parentNode.removeChild(layer);},EXIT_MS);
    }
    function showWord(idx){
      var def=WORDS[idx];
      for(var w=0;w<wraps.length;w++){(function(wrap){
        var existing=wrap.querySelectorAll('.word-layer');
        for(var e=0;e<existing.length;e++)exitLayer(existing[e]);
        setTimeout(function(){buildWordDom(wrap,def);},180);
      })(wraps[w]);}
    }
    for(var k2=0;k2<wraps.length;k2++)buildWordDom(wraps[k2],WORDS[0]);
    if(reduced) return;
    var idx=0, heroVisible=true;
    var heroEl=document.querySelector('.hero');
    if(heroEl&&'IntersectionObserver' in window){
      new IntersectionObserver(function(entries){heroVisible=entries[0].isIntersecting;},{threshold:0}).observe(heroEl);
    }
    setInterval(function(){
      if(document.hidden||!heroVisible) return;
      idx=(idx+1)%WORDS.length;
      showWord(idx);
    },CYCLE_MS);
  })();

  /* ── Desktop dropdown (hover via CSS; click/keyboard via JS) ── */
  var svcTrigger = document.getElementById('svcTrigger');
  var svcMenu = document.getElementById('svcMenu');
  if(svcTrigger && svcMenu){
    var wrap = svcTrigger.closest('.nav-dd-wrap');
    function openDD(){ svcMenu.classList.add('open'); svcTrigger.setAttribute('aria-expanded','true'); }
    function closeDD(){ svcMenu.classList.remove('open'); svcTrigger.setAttribute('aria-expanded','false'); }
    svcTrigger.addEventListener('click', function(e){
      e.preventDefault();
      svcMenu.classList.contains('open') ? closeDD() : openDD();
    });
    wrap.addEventListener('mouseenter', function(){ svcTrigger.setAttribute('aria-expanded','true'); });
    wrap.addEventListener('mouseleave', function(){ svcTrigger.setAttribute('aria-expanded','false'); closeDD(); });
    document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) closeDD(); });
    svcTrigger.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ closeDD(); svcTrigger.focus(); }
      if(e.key === 'ArrowDown'){ e.preventDefault(); openDD(); var first = svcMenu.querySelector('a'); if(first) first.focus(); }
    });
    svcMenu.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ closeDD(); svcTrigger.focus(); } });
  }

  /* ── Mobile menu ── */
  var burger = document.getElementById('burger');
  var scrim = document.getElementById('navScrim');
  var mobile = document.getElementById('mobileMenu');
  function setMenu(open){
    document.body.classList.toggle('menu-open', open);
    if(burger){ burger.setAttribute('aria-expanded', open ? 'true' : 'false'); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    if(mobile) mobile.setAttribute('aria-hidden', open ? 'false' : 'true');
    if(scrim) scrim.setAttribute('aria-hidden', open ? 'false' : 'true');
    if(open){ setTimeout(function(){ var ff = mobile && mobile.querySelector('a,button'); if(ff) ff.focus(); }, 60); }
    else if(burger){ burger.focus(); }
  }
  if(burger){ burger.addEventListener('click', function(){ setMenu(!document.body.classList.contains('menu-open')); }); }
  if(scrim){ scrim.addEventListener('click', function(){ setMenu(false); }); }
  if(mobile){ mobile.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); }); }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
  if(mobile){ mobile.addEventListener('keydown', function(e){ if(e.key !== 'Tab' || !document.body.classList.contains('menu-open')) return; var fcs = mobile.querySelectorAll('a,button'); if(!fcs.length) return; var fst = fcs[0], lst = fcs[fcs.length-1]; if(e.shiftKey && document.activeElement === fst){ e.preventDefault(); lst.focus(); } else if(!e.shiftKey && document.activeElement === lst){ e.preventDefault(); fst.focus(); } }); }

  /* ── Six commitments selector ── */
/* six commitments are static markup now — no JS needed */

  /* ── Reveal on scroll ── */
  var revs = document.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
    revs.forEach(function(el){ io.observe(el); });
  } else {
    revs.forEach(function(el){ el.classList.add('in'); });
  }

  /* ── Cookie bar ── */
  var cookieBar = document.getElementById('cookieBar');
  var stored;
  try { stored = localStorage.getItem('ecco_cookies'); } catch(e){ stored = null; }
  if(cookieBar && !stored){
    setTimeout(function(){ cookieBar.classList.add('show'); }, 1200);
  }
  function dismissCookie(val){
    try { localStorage.setItem('ecco_cookies', val); } catch(e){}
    if(cookieBar) cookieBar.classList.remove('show');
  }
  var ckA = document.getElementById('ckAccept');
  var ckD = document.getElementById('ckDecline');
  if(ckA) ckA.addEventListener('click', function(){ dismissCookie('accepted'); });
  if(ckD) ckD.addEventListener('click', function(){ dismissCookie('declined'); });

  /* ── Sticky CTA: aparece tras pasar ~70% del viewport (funciona en toda página) ── */
  var mcta = document.getElementById('mcta');
  if(mcta){
    // On the careers page the sticky CTA must recruit, not sell — re-point it
    // to the careers inbox instead of the sales proposal form.
    if(document.body.classList.contains('page-careers')){
      mcta.href = 'mailto:careers@eccofacilities.com';
      mcta.innerHTML = 'Apply';
    }
    var mctaToggle = function(){ mcta.classList.toggle('show', window.scrollY > window.innerHeight * 0.7); };
    mctaToggle();
    window.addEventListener('scroll', mctaToggle, {passive:true});
  }

  /* ── Comparison: build paired usual/Ecco rows (shown on mobile via CSS) ── */
  (function(){
    var grid=document.querySelector('.compare-grid'); if(!grid)return;
    var u=grid.querySelector('.cmp-usual'), e=grid.querySelector('.cmp-ecco'); if(!u||!e)return;
    var uR=u.querySelectorAll('.cmp-row'), eR=e.querySelectorAll('.cmp-row');
    var n=Math.min(uR.length,eR.length); if(!n)return;
    var wrap=document.createElement('div'); wrap.className='cmp-paired';
    for(var i=0;i<n;i++){
      var pair=document.createElement('div'); pair.className='cmp-pair';
      var uc=uR[i].cloneNode(true); uc.classList.add('pr-usual');
      var ec=eR[i].cloneNode(true); ec.classList.add('pr-ecco');
      pair.appendChild(uc); pair.appendChild(ec); wrap.appendChild(pair);
    }
    grid.appendChild(wrap);
  })();
})();
