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

  // Forgot password toggle
  var showForgotBtn = document.getElementById('showForgot');
  var forgotSection = document.getElementById('forgotSection');
  var backToLoginBtn = document.getElementById('backToLogin');
  var forgotEmailInput = document.getElementById('forgotEmail');
  var forgotBtn = document.getElementById('forgotBtn');
  var loginFormEl = document.getElementById('loginForm');

  if (showForgotBtn) {
    showForgotBtn.addEventListener('click', function() {
      loginFormEl.style.display = 'none';
      showForgotBtn.style.display = 'none';
      forgotSection.style.display = 'block';
      forgotEmailInput.focus();
    });
  }

  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function() {
      loginFormEl.style.display = '';
      showForgotBtn.style.display = '';
      forgotSection.style.display = 'none';
      hideError();
    });
  }

  if (forgotBtn) {
    forgotBtn.addEventListener('click', async function() {
      var email = forgotEmailInput.value.trim();
      if (!email) { showError('Please enter your email.'); return; }

      forgotBtn.disabled = true;
      forgotBtn.textContent = 'Sending...';
      hideError();

      try {
        var res = await fetch('/api/crm-auth', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        var data = await res.json();

        if (data.ok) {
          forgotSection.innerHTML = '<div class="crm-forgot-success"><p>Reset link sent! Check your email.</p><button type="button" id="backToLogin2" class="crm-login-back">Back to sign in</button></div>';
          document.getElementById('backToLogin2').addEventListener('click', function() { window.location.reload(); });
        } else {
          showError(data.error || 'Failed to send reset link.');
        }
      } catch (err) {
        showError('Unable to connect. Please try again.');
      } finally {
        forgotBtn.disabled = false;
        forgotBtn.textContent = 'Send Reset Link';
      }
    });
  }
})();
