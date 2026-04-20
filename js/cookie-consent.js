(function(){
  // CCPA 2026: Respect Global Privacy Control (GPC) signal
  var gpcEnabled = navigator.globalPrivacyControl === true;
  if(gpcEnabled){
    localStorage.setItem('ecco_cookies','declined');
    if(window._hsq)window._hsq.push(['doNotTrack']);
    return; // No banner needed — GPC auto-declines
  }
  if(localStorage.getItem('ecco_cookies'))return;
  var b=document.createElement('div');
  b.className='cookie-banner';
  b.innerHTML='<p>We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our <a href="privacy.html">Privacy Policy</a>.</p><div style="display:flex;gap:.5rem"><button class="cookie-btn cookie-btn-accept" onclick="acceptCookies()">Accept</button><button class="cookie-btn cookie-btn-decline" onclick="declineCookies()">Decline</button></div>';
  document.body.appendChild(b);
  setTimeout(function(){b.classList.add('visible')},1000);
  // AYS Ola 3 #8 — dispatch a consent-accepted event so downstream code (e.g.
  // quote-flow.js PII persistence) can gate its behaviour on consent. Also set
  // the legacy `ecco_consent` key used by HubSpot gating.
  window.acceptCookies=function(){
    localStorage.setItem('ecco_cookies','accepted');
    localStorage.setItem('ecco_consent','accepted');
    b.classList.remove('visible');
    setTimeout(function(){b.remove()},400);
    window.dispatchEvent(new CustomEvent('ecco:consent-accepted'));
  };
  window.declineCookies=function(){
    localStorage.setItem('ecco_cookies','declined');
    localStorage.setItem('ecco_consent','declined');
    b.classList.remove('visible');
    setTimeout(function(){b.remove()},400);
    if(window._hsq)window._hsq.push(['doNotTrack']);
    window.dispatchEvent(new CustomEvent('ecco:consent-declined'));
  };
})();
