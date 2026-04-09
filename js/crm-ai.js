(function() {
  var chatOpen = false;
  var chatMessages = [];
  var isLoading = false;

  function createChatUI() {
    // Floating button
    var btn = document.createElement('button');
    btn.className = 'crm-ai-fab';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z"/><line x1="10" y1="22" x2="14" y2="22"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
    btn.setAttribute('aria-label', 'Ask AI Assistant');
    btn.addEventListener('click', toggleChat);
    document.body.appendChild(btn);

    // Chat panel
    var panel = document.createElement('div');
    panel.id = 'crmAiPanel';
    panel.className = 'crm-ai-panel';
    panel.innerHTML = '<div class="crm-ai-header">' +
      '<div class="crm-ai-header-info">' +
        '<div class="crm-ai-avatar">AI</div>' +
        '<div><div class="crm-ai-name">Claude Assistant</div>' +
        '<div class="crm-ai-status">CRM Intelligence</div></div>' +
      '</div>' +
      '<button class="crm-ai-close" aria-label="Close">&times;</button>' +
    '</div>' +
    '<div id="crmAiMessages" class="crm-ai-messages">' +
      '<div class="crm-ai-message crm-ai-msg-ai">' +
        '<div class="crm-ai-msg-text">Hi! I\'m your CRM assistant. I can help you with:\n\n' +
        '- Analyzing your leads and pipeline\n' +
        '- Writing follow-up emails\n' +
        '- Prioritizing which leads to contact\n' +
        '- Generating reports and insights\n\n' +
        'Ask me anything about your leads!</div>' +
      '</div>' +
    '</div>' +
    '<div class="crm-ai-input-wrap">' +
      '<textarea id="crmAiInput" class="crm-ai-input" placeholder="Ask about your leads..." rows="1"></textarea>' +
      '<button id="crmAiSend" class="crm-ai-send" aria-label="Send">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
    '</div>';
    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('.crm-ai-close').addEventListener('click', toggleChat);

    var input = document.getElementById('crmAiInput');
    var sendBtn = document.getElementById('crmAiSend');

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  function toggleChat() {
    chatOpen = !chatOpen;
    var panel = document.getElementById('crmAiPanel');
    var fab = document.querySelector('.crm-ai-fab');
    if (panel) panel.classList.toggle('open', chatOpen);
    if (fab) fab.classList.toggle('active', chatOpen);
  }

  function getLeadContext() {
    // If on a lead detail page, extract the lead data
    var params = new URLSearchParams(window.location.search);
    var leadId = params.get('id');
    if (leadId && window.location.pathname.indexOf('/crm/lead') !== -1) {
      // The lead data might be in the page — try to extract from DOM
      var nameEl = document.querySelector('.crm-contact-value');
      var breadcrumb = document.getElementById('breadcrumbName');
      return {
        id: leadId,
        name: breadcrumb ? breadcrumb.textContent : '',
        page: 'lead_detail'
      };
    }
    return null;
  }

  function getPageContext() {
    var path = window.location.pathname;
    if (path.indexOf('/pipeline') !== -1) return 'pipeline';
    if (path.indexOf('/lead') !== -1 && path.indexOf('/leads') === -1) return 'detail';
    if (path.indexOf('/leads') !== -1) return 'leads';
    if (path.indexOf('/reports') !== -1) return 'reports';
    return 'dashboard';
  }

  async function sendMessage() {
    var input = document.getElementById('crmAiInput');
    var messagesEl = document.getElementById('crmAiMessages');
    var message = input.value.trim();

    if (!message || isLoading) return;

    // Add user message
    appendMessage('user', message);
    input.value = '';
    input.style.height = 'auto';

    // Show loading
    isLoading = true;
    var loadingEl = appendMessage('ai', '<div class="crm-ai-typing"><span></span><span></span><span></span></div>');

    try {
      var result = await CRM.fetch('/crm-ai', {
        method: 'POST',
        body: {
          message: message,
          lead_context: getLeadContext(),
          page_context: getPageContext()
        }
      });

      // Remove loading
      if (loadingEl) loadingEl.remove();

      if (result && result.ok) {
        appendMessage('ai', formatResponse(result.data.response));
      } else {
        appendMessage('ai', 'Sorry, I couldn\'t process that request. Please try again.');
      }
    } catch (err) {
      if (loadingEl) loadingEl.remove();
      appendMessage('ai', 'Connection error. Please try again.');
    }

    isLoading = false;
  }

  function appendMessage(role, content) {
    var messagesEl = document.getElementById('crmAiMessages');
    var msg = document.createElement('div');
    msg.className = 'crm-ai-message crm-ai-msg-' + role;
    msg.innerHTML = '<div class="crm-ai-msg-text">' + content + '</div>';
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function formatResponse(text) {
    // Convert markdown-like formatting to HTML
    return CRM.escapeHtml(text)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- /gm, '&bull; ')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatUI);
  } else {
    createChatUI();
  }
})();
