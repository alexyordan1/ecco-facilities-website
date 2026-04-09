(function() {
  async function init() {
    var authed = await CRM.requireAuth();
    if (!authed) return;
    CRM.renderShell('settings');
    loadProfile();
    loadPreferences();
    bindEvents();
  }

  function loadProfile() {
    var user = CRM.getUser();
    var emailEl = document.getElementById('userEmail');
    var idEl = document.getElementById('userId');
    var sessionEl = document.getElementById('sessionInfo');

    if (user) {
      if (emailEl) emailEl.textContent = user.email || '—';
      if (idEl) idEl.textContent = user.id || '—';
    }

    var expires = parseInt(localStorage.getItem(CRM.STORAGE.expires) || '0');
    if (sessionEl && expires) {
      var remaining = Math.max(0, Math.floor((expires - Date.now()) / 60000));
      sessionEl.textContent = 'Token expires in ' + remaining + ' min';
    }
  }

  function loadPreferences() {
    var staleEl = document.getElementById('staleThreshold');
    var refreshEl = document.getElementById('refreshInterval');
    var prefs = {};
    try { prefs = JSON.parse(localStorage.getItem('crm_prefs') || '{}'); } catch (e) {}

    if (staleEl && prefs.stale_days) staleEl.value = prefs.stale_days;
    if (refreshEl && prefs.refresh_seconds) refreshEl.value = prefs.refresh_seconds;
  }

  function bindEvents() {
    // Change password
    var changeBtn = document.getElementById('changePasswordBtn');
    var pwError = document.getElementById('passwordError');
    var pwSuccess = document.getElementById('passwordSuccess');

    if (changeBtn) {
      changeBtn.addEventListener('click', async function() {
        var newPw = document.getElementById('newPassword').value;
        var confirmPw = document.getElementById('confirmPassword').value;

        pwError.classList.remove('visible');
        pwSuccess.classList.remove('visible');

        if (newPw.length < 6) {
          pwError.textContent = 'Password must be at least 6 characters.';
          pwError.classList.add('visible');
          return;
        }
        if (newPw !== confirmPw) {
          pwError.textContent = 'Passwords do not match.';
          pwError.classList.add('visible');
          return;
        }

        changeBtn.disabled = true;
        changeBtn.textContent = 'Updating...';

        try {
          var token = CRM.getToken();
          var res = await fetch('https://aijgpluromciwgrbvhjq.supabase.co/auth/v1/user', {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer ' + token,
              'apikey': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPw })
          });

          if (res.ok) {
            pwSuccess.textContent = 'Password updated successfully!';
            pwSuccess.classList.add('visible');
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
          } else {
            pwError.textContent = 'Failed to update password. Try logging in again.';
            pwError.classList.add('visible');
          }
        } catch (err) {
          pwError.textContent = 'Connection error. Please try again.';
          pwError.classList.add('visible');
        } finally {
          changeBtn.disabled = false;
          changeBtn.textContent = 'Update Password';
        }
      });
    }

    // Save preferences
    var savePrefsBtn = document.getElementById('savePrefsBtn');
    if (savePrefsBtn) {
      savePrefsBtn.addEventListener('click', function() {
        var staleVal = parseInt(document.getElementById('staleThreshold').value) || 7;
        var refreshVal = parseInt(document.getElementById('refreshInterval').value) || 45;

        staleVal = Math.max(1, Math.min(90, staleVal));
        refreshVal = Math.max(10, Math.min(300, refreshVal));

        var prefs = { stale_days: staleVal, refresh_seconds: refreshVal };
        localStorage.setItem('crm_prefs', JSON.stringify(prefs));

        savePrefsBtn.textContent = 'Saved!';
        setTimeout(function() { savePrefsBtn.textContent = 'Save Preferences'; }, 2000);
      });
    }
  }

  init();
})();
