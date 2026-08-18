(function(){
  // 2026-08-18 — storage-blocked contexts (privacy modes, some embedded
  // webviews) made the first bare localStorage.getItem THROW, killing this
  // whole IIFE: no banner, no consent, and an uncaught error in console.
  // Safe wrappers degrade to "no stored consent" instead.
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  // Consent gating (Fase 3). The Consent Mode v2 DEFAULT state (analytics/ad
  // storage denied) is set inline in each page <head> BEFORE GTM loads, so GA4
  // stays cookieless until the user accepts. This file owns: the banner, the
  // Consent Mode 'update' on accept, and loading Microsoft Clarity + HubSpot
  // (which do not support Consent Mode) only AFTER consent.

  function loadClarity(){
    if(window.clarity) return;
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w546w8zoh2");
  }
  function loadHubSpot(){
    // Only on pages that originally embedded HubSpot (marked window.ECCO_HS).
    if(!window.ECCO_HS || document.getElementById('hs-script-loader')) return;
    var h=document.createElement('script');
    h.type='text/javascript'; h.id='hs-script-loader'; h.async=true; h.defer=true;
    h.src='//js-na2.hs-scripts.com/245755967.js';
    document.head.appendChild(h);
  }
  function grant(){
    if(typeof window.gtag==='function'){
      window.gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
    }
    loadClarity();
    loadHubSpot();
  }

  // Respect Global Privacy Control (GPC): auto-decline, load nothing.
  if(navigator.globalPrivacyControl===true){
    LS.set('ecco_cookies','declined');
    LS.set('ecco_consent','declined');
    window.dispatchEvent(new CustomEvent('ecco:consent-declined'));
    return;
  }

  // Returning visitor who already accepted: load gated trackers now.
  if(LS.get('ecco_cookies')==='accepted'){ grant(); return; }
  // Returning visitor who declined: do nothing.
  if(LS.get('ecco_cookies')) return;

  // First visit: show the banner.
  var b=document.createElement('div');
  b.className='cookie-banner';
  b.innerHTML='<p>We use cookies to analyze site traffic and improve your experience. Analytics and session tools load only if you accept. See our <a href="/privacy.html">Privacy Policy</a>.</p><div style="display:flex;gap:.5rem;justify-content:center"><button class="cookie-btn cookie-btn-accept" onclick="acceptCookies()">Accept</button><button class="cookie-btn cookie-btn-decline" onclick="declineCookies()">Decline</button></div>';
  document.body.appendChild(b);
  setTimeout(function(){b.classList.add('visible')},1000);

  window.acceptCookies=function(){
    LS.set('ecco_cookies','accepted');
    LS.set('ecco_consent','accepted');
    b.classList.remove('visible');
    setTimeout(function(){b.remove()},400);
    grant();
    window.dispatchEvent(new CustomEvent('ecco:consent-accepted'));
  };
  window.declineCookies=function(){
    LS.set('ecco_cookies','declined');
    LS.set('ecco_consent','declined');
    b.classList.remove('visible');
    setTimeout(function(){b.remove()},400);
    window.dispatchEvent(new CustomEvent('ecco:consent-declined'));
  };
})();
