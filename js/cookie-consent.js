(function(){
  if(localStorage.getItem('ecco_cookies'))return;
  var b=document.createElement('div');
  b.className='cookie-banner';
  b.innerHTML='<p>We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our <a href="privacy.html">Privacy Policy</a>.</p><div style="display:flex;gap:.5rem"><button class="cookie-btn cookie-btn-accept" onclick="acceptCookies()">Accept</button><button class="cookie-btn cookie-btn-decline" onclick="declineCookies()">Decline</button></div>';
  document.body.appendChild(b);
  setTimeout(function(){b.classList.add('visible')},1000);
  window.acceptCookies=function(){
    localStorage.setItem('ecco_cookies','accepted');
    b.classList.remove('visible');
    setTimeout(function(){b.remove()},400);
  };
  window.declineCookies=function(){
    localStorage.setItem('ecco_cookies','declined');
    b.classList.remove('visible');
    setTimeout(function(){b.remove()},400);
    // Disable HubSpot tracking if declined
    if(window._hsq)window._hsq.push(['doNotTrack']);
  };
})();
