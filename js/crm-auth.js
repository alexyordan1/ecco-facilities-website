/* crm-auth.js — Login page logic v1.0 */
(function() {
  /* If already logged in, redirect to leads */
  if (CRM.isLoggedIn()) {
    window.location.href = '/crm/leads.html';
    return;
  }

  var form = document.getElementById('loginForm');
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var submitBtn = document.getElementById('loginBtn');
  var errorEl = document.getElementById('loginError');

  if (!form) return;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }

  function hideError() {
    errorEl.classList.remove('visible');
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter your email and password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in\u2026';

    try {
      var res = await fetch('/api/crm-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      var data = await res.json();

      if (data.ok) {
        CRM.setSession(data.data);
        window.location.href = '/crm/leads.html';
      } else {
        showError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      showError('Unable to connect. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
})();
