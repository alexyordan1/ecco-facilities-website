(function () { 'use strict';
const CONFIG = {
  apiUrl: 'https://ecco-chat-backend.vercel.app/api/chat',
  botName: 'Alina',
  botTitle: 'Cleaning Experience Advisor',
  avatar: 'images/alina-avatar.jpg',
  greeting: "Glad you stopped by! 👋\n\nI can help you find the right service, ballpark pricing, or line up a free quote in 24 hours.\n\nSo — what's on your mind?",
  placeholder: 'Ask Alina anything...',
  poweredBy: '🤖 AI-powered assistant · Not a real person'
};

var styles = document.createElement('style');
styles.textContent = `
.ecco-chat-toggle { position: fixed; bottom: 28px; left: 28px; z-index: 999; display: inline-flex; align-items: center; gap: 10px; padding: 8px 22px 8px 8px; background: #fff; border: 1.5px solid rgba(11,29,56,.12); border-radius: 100px; box-shadow: 0 14px 36px -8px rgba(11,29,56,.2), 0 4px 10px rgba(11,29,56,.08); font-family: 'DM Sans', system-ui, sans-serif; font-size: .88rem; font-weight: 600; color: #0B1D38; cursor: pointer; transition: all .3s cubic-bezier(.34,1.3,.64,1); }
.ecco-chat-toggle:hover { border-color: #2D7A32; transform: translateY(-3px) scale(1.02); box-shadow: 0 20px 44px -10px rgba(45,122,50,.3), 0 6px 14px rgba(45,122,50,.12); }
.ecco-chat-toggle:hover .ecco-chat-toggle-label { color: #2D7A32; }
.ecco-chat-toggle.open { display: none; }
.ecco-chat-toggle-avatar { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; border: 2px solid #fff; flex-shrink: 0; box-shadow: 0 4px 10px rgba(45,122,50,.22); position: relative; z-index: 2; }
.ecco-chat-toggle-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ecco-chat-toggle-label { transition: color .25s; position: relative; z-index: 2; }
.ecco-chat-toggle-pulse { position: absolute; top: 8px; left: 8px; width: 38px; height: 38px; border-radius: 50%; background: #2D7A32; opacity: .35; z-index: 1; animation: ecco-pulse-ring 2.6s ease-out infinite; pointer-events: none; }
.ecco-close-icon { display: none; }
.ecco-chat-dot { display: none; }
@keyframes ecco-pulse-ring { 0% { transform: scale(1); opacity: .35; } 70% { transform: scale(1.7); opacity: 0; } 100% { opacity: 0; } }
.ecco-chat-tooltip { position: fixed; bottom: 5.5rem; left: 28px; z-index: 998; background: #fff; color: #1A1E2C; padding: .8rem 1.2rem; border-radius: 14px 14px 14px 4px; box-shadow: 0 8px 32px rgba(11,29,56,.15); font-size: .82rem; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500; max-width: 240px; opacity: 0; visibility: hidden; transform: translateY(8px); transition: all .4s cubic-bezier(.4,0,.2,1); line-height: 1.5; }
.ecco-chat-tooltip.show { opacity: 1; visibility: visible; transform: translateY(0); }
.ecco-chat-tooltip .tip-name { font-weight: 700; color: #0B1D38; }
.ecco-chat-tooltip .tip-close { position: absolute; top: .3rem; right: .5rem; background: none; border: none; color: #94A3B5; cursor: pointer; font-size: .9rem; padding: .2rem; }
.ecco-chat-panel { position: fixed; top: 1rem; left: 1rem; bottom: 1rem; z-index: 998; width: 420px; max-height: none; height: calc(100vh - 2rem); height: calc(100dvh - 2rem); border-radius: 20px; background: #fff; border-radius: 20px; box-shadow: 0 16px 64px rgba(11,29,56,.18); display: flex; flex-direction: column; opacity: 0; visibility: hidden; transform-origin: bottom left; transform: translateY(20px) scale(.95); transition: all .35s cubic-bezier(.4,0,.2,1); overflow: hidden; }
.ecco-chat-panel.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
.ecco-chat-header { background: linear-gradient(135deg, #0B1D38 0%, #1E3562 100%); padding: 1rem 1.2rem; display: flex; align-items: center; gap: .7rem; flex-shrink: 0; }
.ecco-chat-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,255,255,.2); overflow: hidden; flex-shrink: 0; }
.ecco-chat-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ecco-chat-header-info h4 { color: #fff; font-size: .9rem; font-weight: 600; margin: 0; font-family: 'DM Sans', system-ui, sans-serif; }
.ecco-chat-header-title { color: rgba(255,255,255,.5); font-size: .68rem; font-weight: 500; font-family: 'DM Sans', system-ui, sans-serif; margin-top: .1rem; }
.ecco-chat-header-status { display: flex; align-items: center; gap: .3rem; color: #3D9A43; font-size: .65rem; font-weight: 500; margin-top: .15rem; }
.ecco-chat-header-status::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #3D9A43; }
.ecco-chat-actions { margin-left: auto; display: flex; gap: .3rem; }
.ecco-chat-close, .ecco-chat-reset { background: rgba(255,255,255,.08); border: none; color: #9AABC2; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all .2s; }
.ecco-chat-close:hover, .ecco-chat-reset:hover { background: rgba(255,255,255,.2); color: #fff; }
.ecco-chat-reset { font-size: .8rem; }
.ecco-chat-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: .6rem; scroll-behavior: smooth; background: #F5F3EE; }
.ecco-chat-messages::-webkit-scrollbar { width: 4px; }
.ecco-chat-messages::-webkit-scrollbar-track { background: transparent; }
.ecco-chat-messages::-webkit-scrollbar-thumb { background: #DFE4EC; border-radius: 4px; }
.ecco-msg { max-width: 85%; padding: .75rem 1rem; font-size: .84rem; line-height: 1.6; font-family: 'DM Sans', system-ui, sans-serif; animation: ecco-fadeIn .3s ease; }
@keyframes ecco-fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.ecco-msg-bot { background: #fff; color: #1A1E2C; border-radius: 4px 14px 14px 14px; align-self: flex-start; border: 1px solid #EDF0F5; box-shadow: 0 1px 4px rgba(11,29,56,.04); }
.ecco-msg-user { background: linear-gradient(135deg, #0B1D38, #1E3562); color: #fff; border-radius: 14px 4px 14px 14px; align-self: flex-end; }
.ecco-msg-bot a { color: #3068AD; text-decoration: underline; }
.ecco-msg-bot strong { font-weight: 600; }
.ecco-typing { display: flex; gap: 6px; align-items: center; padding: .65rem 1rem; align-self: flex-start; background: #fff; border-radius: 4px 14px 14px 14px; border: 1px solid #EDF0F5; font-size: .75rem; color: #94A3B5; font-family: 'DM Sans', system-ui, sans-serif; }
.ecco-typing-label { margin-right: 4px; font-style: italic; }
.ecco-typing-dots { display: flex; gap: 3px; align-items: center; }
.ecco-typing-dots span { width: 5px; height: 5px; border-radius: 50%; background: #94A3B5; animation: ecco-bounce .6s ease-in-out infinite; }
.ecco-typing-dots span:nth-child(2) { animation-delay: .15s; }
.ecco-typing-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes ecco-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.ecco-chat-input-area { padding: .7rem .8rem; border-top: 1px solid #EDF0F5; background: #fff; display: flex; gap: .5rem; align-items: center; flex-shrink: 0; }
.ecco-chat-input { flex: 1; border: 1.5px solid #DFE4EC; border-radius: 12px; padding: .65rem .9rem; font-size: .84rem; font-family: 'DM Sans', system-ui, sans-serif; color: #1A1E2C; background: #F8F9FB; outline: none; resize: none; max-height: 80px; min-height: 38px; transition: border-color .2s; }
.ecco-chat-input:focus { border-color: #3068AD; background: #fff; }
.ecco-chat-input::placeholder { color: #94A3B5; }
.ecco-chat-send { width: 38px; height: 38px; border-radius: 10px; border: none; background: #0B1D38; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0; }
.ecco-chat-send:hover { background: #15294D; transform: scale(1.05); }
.ecco-chat-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }
.ecco-chat-send svg { width: 16px; height: 16px; }
.ecco-chat-footer { text-align: center; padding: .35rem; font-size: .6rem; color: #94A3B5; background: #fff; flex-shrink: 0; }
.ecco-quick-replies { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .4rem; }
.ecco-quick-btn { padding: .4rem .75rem; border: 1.5px solid #DFE4EC; border-radius: 50px; background: #fff; color: #0B1D38; font-size: .75rem; font-weight: 500; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; transition: all .2s; }
.ecco-quick-btn:hover { border-color: #0B1D38; background: #0B1D38; color: #fff; }
@media (max-width: 480px) {
  .ecco-chat-panel { width: calc(100vw - 1.5rem); left: .75rem; right: auto; bottom: 5.5rem; max-height: calc(100vh - 7rem); border-radius: 16px; }
  .ecco-chat-toggle { bottom: 16px; left: 16px; padding: 6px 16px 6px 6px; font-size: .8rem; }
  .ecco-chat-toggle-avatar { width: 32px; height: 32px; }
  .ecco-chat-toggle-pulse { width: 32px; height: 32px; }
  .ecco-chat-tooltip { left: 16px; bottom: 4.5rem; max-width: 200px; }
}
`;
document.head.appendChild(styles);

var widget = document.createElement('div');
widget.id = 'ecco-chat-widget';
widget.innerHTML = '<button class="ecco-chat-toggle" id="eccoChatToggle" aria-label="Ask Alina" title="Ask Alina"><span class="ecco-chat-toggle-pulse" aria-hidden="true"></span><span class="ecco-chat-toggle-avatar"><img src="' + CONFIG.avatar + '" alt="" width="38" height="38"></span><span class="ecco-chat-toggle-label">Ask Alina</span></button><div class="ecco-chat-tooltip" id="eccoChatTooltip"><button class="tip-close" id="eccoTipClose" aria-label="Dismiss">\u2715</button><span class="tip-name">Hi, I\u2019m Alina \uD83D\uDC4B</span> Looking for the right cleaning fit for your space?</div><div class="ecco-chat-panel" id="eccoChatPanel" role="dialog" aria-modal="true" aria-label="Chat with Alina"><div class="ecco-chat-header"><div class="ecco-chat-avatar"><img src="' + CONFIG.avatar + '" alt="Alina" width="40" height="40"></div><div class="ecco-chat-header-info"><h4>' + CONFIG.botName + '</h4><div class="ecco-chat-header-title">' + CONFIG.botTitle + ' \u00B7 AI</div><div class="ecco-chat-header-status">Online now</div></div><div class="ecco-chat-actions"><button class="ecco-chat-reset" id="eccoChatReset" aria-label="New chat" title="New conversation">\u21BA</button><button class="ecco-chat-close" id="eccoChatClose" aria-label="Close chat">\u2715</button></div></div><div class="ecco-chat-messages" id="eccoChatMessages"></div><div class="ecco-chat-input-area"><textarea class="ecco-chat-input" id="eccoChatInput" placeholder="' + CONFIG.placeholder + '" rows="1"></textarea><button class="ecco-chat-send" id="eccoChatSend" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div><div class="ecco-chat-footer">' + CONFIG.poweredBy + '</div></div>';
document.body.appendChild(widget);

var toggle = document.getElementById('eccoChatToggle');
var panel = document.getElementById('eccoChatPanel');
var closeBtn = document.getElementById('eccoChatClose');
var resetBtn = document.getElementById('eccoChatReset');
var tooltip = document.getElementById('eccoChatTooltip');
var tipClose = document.getElementById('eccoTipClose');
var messages = document.getElementById('eccoChatMessages');
var input = document.getElementById('eccoChatInput');
var sendBtn = document.getElementById('eccoChatSend');
var conversationHistory = [];
var isOpen = false;
var isLoading = false;
var greeted = false;
var msgCount = 0;
var MAX_MESSAGES = 20;
var tooltipShown = false;

setTimeout(function() {
  if (!isOpen && !tooltipShown) { tooltip.classList.add('show'); tooltipShown = true; setTimeout(function() { tooltip.classList.remove('show'); }, 8000); }
}, 5000);
var scrollHideTooltip = false;
window.addEventListener('scroll', function() { if (!scrollHideTooltip && tooltipShown) { tooltip.classList.remove('show'); scrollHideTooltip = true; } }, { passive: true });
tipClose.addEventListener('click', function(e) { e.stopPropagation(); tooltip.classList.remove('show'); });

function sanitize(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[(.*?)\]\(([a-zA-Z0-9._/-]+\.html[^\s)]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>');
}

function addMessage(text, role) {
  var div = document.createElement('div');
  div.className = 'ecco-msg ecco-msg-' + (role === 'user' ? 'user' : 'bot');
  if (role !== 'user') { div.innerHTML = sanitize(text); } else { div.textContent = text; }
  messages.appendChild(div);
  return div;
}

/* Smart scroll — scroll to the TOP of the new message, not bottom */
function scrollToMessage(el) {
  var msgTop = el.offsetTop - 10;
  messages.scrollTo({ top: msgTop, behavior: 'smooth' });
}

/* Split long reply into multiple bubbles and send with delay */
function addBotReplyChunked(fullText) {
  var paragraphs = fullText.split('\n\n').filter(function(p) { return p.trim().length > 0; });
  if (paragraphs.length <= 1) {
    var el = addMessage(fullText, 'bot');
    scrollToMessage(el);
    return Promise.resolve();
  }
  var i = 0;
  return new Promise(function(resolve) {
    function sendNext() {
      if (i >= paragraphs.length) { resolve(); return; }
      if (i > 0) { showTyping(); }
      var delay = i === 0 ? 0 : 400 + Math.min(paragraphs[i].length * 8, 1200);
      setTimeout(function() {
        hideTyping();
        var el = addMessage(paragraphs[i], 'bot');
        scrollToMessage(el);
        i++;
        sendNext();
      }, delay);
    }
    sendNext();
  });
}

function showQuickReplies() {
  var container = document.createElement('div');
  container.className = 'ecco-quick-replies';
  ['What does it cost?', 'How fast can you start?', 'Which service fits me?', 'Talk to the team'].forEach(function(text) {
    var btn = document.createElement('button');
    btn.className = 'ecco-quick-btn';
    btn.textContent = text;
    btn.addEventListener('click', function() { container.remove(); handleSend(text); });
    container.appendChild(btn);
  });
  messages.appendChild(container);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  var div = document.createElement('div');
  div.className = 'ecco-typing';
  div.id = 'eccoTyping';
  div.innerHTML = '<span class="ecco-typing-label">Alina is typing</span><span class="ecco-typing-dots"><span></span><span></span><span></span></span>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function hideTyping() { var t = document.getElementById('eccoTyping'); if (t) t.remove(); }

function autoResize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 80) + 'px'; }

function getPageContext() {
  var sy = window.scrollY; var vh = window.innerHeight; var docH = document.body.scrollHeight;
  if ((sy / (docH - vh)) * 100 < 15) return null;
  var current = null;
  document.querySelectorAll('section.sec').forEach(function(sec) {
    var rect = sec.getBoundingClientRect();
    if (rect.top < vh * 0.5 && rect.bottom > 0) { var h = sec.querySelector('.sec-ttl'); if (h) current = h.textContent.trim().substring(0, 40); }
  });
  return current;
}

async function sendToAPI(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  var pageCtx = getPageContext();
  var contextNote = pageCtx ? ' (User is currently viewing: "' + pageCtx + '")' : '';
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 15000);
  try {
    var res = await fetch(CONFIG.apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage + contextNote, history: conversationHistory.slice(0, -1) }), signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Server error');
    var data = await res.json();
    var reply = data.reply || "Let me connect you with our team \u2014 email **info@eccofacilities.com**.";
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  } catch (err) { clearTimeout(timeout); return getFallbackResponse(userMessage); }
}

function getFallbackResponse(msg) {
  var l = msg.toLowerCase();
  if (l.match(/service|offer|do you do/)) return "We offer two core services:\n\n**Janitorial** \u2014 Recurring cleaning on your schedule.\n\n**Day Porter** \u2014 Dedicated on-site pro during business hours.\n\nWant details? [Get a free quote](quote.html)!";
  if (l.match(/area|borough|where|nyc/)) return "We serve **all 5 boroughs of NYC**!\n\n[Request a free quote](quote.html)";
  if (l.match(/eco|green|safe|chemical/)) return "Every product is **100% eco-certified** \u2014 Green Seal + EPA Safer Choice.\n\nSafe for kids, pets, and allergies. [Learn more](sustainability.html)";
  if (l.match(/quote|price|cost|how much/)) return "Every proposal is custom for your space.\n\nTransparent pricing within **24 hours**.\n\n[Get a Free Quote \u2192](quote.html)";
  if (l.match(/porter|daytime/)) return "Our **Day Porter** keeps your space fresh during business hours \u2014 lobbies, restrooms, spills.\n\n[Learn more](day-porter.html)";
  if (l.match(/janitor|clean|recurring/)) return "**Janitorial** \u2014 recurring cleaning tailored to your space.\n\nYou choose the frequency.\n\n[Learn more](janitorial.html)";
  if (l.match(/career|job|hiring/)) return "We're hiring! Cleaning Techs, Day Porters, Team Leads.\n\n[Apply now](careers.html)!";
  if (l.match(/talk|human|team|contact/)) return "Of course!\n\n\uD83D\uDCE7 **info@eccofacilities.com** \u2014 same-day response\n\n[Request a Quote](quote.html)";
  if (l.match(/which|fit|recommend/)) return "It depends on your space:\n\n\u2022 **Office/Medical** \u2192 Janitorial\n\u2022 **Lobby/High-traffic** \u2192 Day Porter\n\u2022 **Both?** \u2192 24/7 coverage!\n\n[Get a quote](quote.html)";
  if (l.match(/fast|quick|start|urgent/)) return "Most clients start within **5-7 days**.\n\nUrgent? We can begin in **48 hours**.\n\n[Request a quote](quote.html)";
  if (l.match(/hi|hello|hey|hola/)) return "Hi there! \uD83D\uDC4B I'm Alina.\n\nHow can I help you today?";
  if (l.match(/thank|gracias/)) return "You're welcome! \uD83C\uDF3F\n\nAnything else I can help with?";
  return "Great question!\n\n[Request a Free Quote](quote.html) \u2014 24hr response\n\n\uD83D\uDCE7 **info@eccofacilities.com**";
}

async function handleSend(text) {
  var msg = text || input.value.trim();
  if (!msg || isLoading) return;
  if (msgCount >= MAX_MESSAGES) { addMessage("Great chat! For more help: **info@eccofacilities.com** or [get a quote](quote.html).", 'bot'); return; }
  input.value = '';
  autoResize();
  addMessage(msg, 'user');
  messages.scrollTop = messages.scrollHeight;
  msgCount++;
  isLoading = true;
  sendBtn.disabled = true;
  showTyping();
  var reply = await sendToAPI(msg);
  hideTyping();
  await addBotReplyChunked(reply);
  isLoading = false;
  sendBtn.disabled = false;
  input.focus();
}

toggle.addEventListener('click', function() {
  isOpen = !isOpen;
  panel.classList.toggle('open', isOpen);
  toggle.classList.toggle('open', isOpen);
  tooltip.classList.remove('show');
  if (isOpen && !greeted) { greeted = true; setTimeout(async function() { await addBotReplyChunked(CONFIG.greeting); showQuickReplies(); }, 400); }
  if (isOpen) input.focus();
});
closeBtn.addEventListener('click', function() { isOpen = false; panel.classList.remove('open'); toggle.classList.remove('open'); toggle.focus(); });
resetBtn.addEventListener('click', function() { conversationHistory = []; msgCount = 0; messages.innerHTML = ''; greeted = false; setTimeout(async function() { await addBotReplyChunked(CONFIG.greeting); showQuickReplies(); greeted = true; }, 300); });
sendBtn.addEventListener('click', function() { handleSend(); });
input.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
input.addEventListener('input', autoResize);
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); isOpen = !isOpen; panel.classList.toggle('open', isOpen); toggle.classList.toggle('open', isOpen); tooltip.classList.remove('show'); if (isOpen && !greeted) { greeted = true; setTimeout(async function() { await addBotReplyChunked(CONFIG.greeting); showQuickReplies(); }, 400); } if (isOpen) input.focus(); else toggle.focus(); }
  if (e.key === 'Escape' && isOpen) { isOpen = false; panel.classList.remove('open'); toggle.classList.remove('open'); toggle.focus(); }
  if (e.key === 'Tab' && isOpen) { var f = [closeBtn, resetBtn, input, sendBtn].filter(function(el) { return el && !el.disabled; }); var first = f[0]; var last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); } }
});
})();
