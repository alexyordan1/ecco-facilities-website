(function () { 'use strict';

var PRIMARY_QUOTE_CTA = { label: 'Get a free quote \u2192', primary: true, action: 'startQuoteFlow' };

var PAGE_CONTENT = {
  'janitorial': {
    title: 'Your janitorial guide',
    greeting: "Hey! \uD83D\uDC4B You\u2019re looking at janitorial.\n\nHappy to break down how recurring cleaning works \u2014 frequency, what\u2019s included, pricing \u2014 or line up a free quote.\n\nWhat would help?",
    replies: ['How often do you clean?', "What's included?", 'Ballpark pricing', PRIMARY_QUOTE_CTA]
  },
  'day-porter': {
    title: 'Your day porter advisor',
    greeting: "Hey! \uD83D\uDC4B Day porter page, right?\n\nI can explain how we keep your space guest-ready during business hours \u2014 shifts, coverage, what porters handle. Or get you a quote.\n\nWhat do you want to know?",
    replies: ['How does it work?', 'Typical shift length?', 'Ballpark pricing', PRIMARY_QUOTE_CTA]
  },
  'quote': {
    title: 'Your quote concierge',
    greeting: "Welcome! \uD83D\uDC4B Ready for a quote?\n\nIf you get stuck on any step or want to double-check something, just ask. Most people finish in ~2 minutes.\n\nAnything I can clarify?",
    replies: ['What info do I need?', 'How fast is the reply?', "I'm stuck on a step", 'Talk to the team']
  },
  'sustainability': {
    title: 'Your eco guide',
    greeting: "Glad you stopped by! \uD83D\uDC4B Here for the eco story?\n\nEvery product we use is Green Seal or EPA Safer Choice. Safe for kids, pets, and allergies.\n\nWant the full rundown \u2014 or a quote?",
    replies: ['Which products?', 'Safe for allergies?', 'Certifications?', PRIMARY_QUOTE_CTA]
  },
  'services': {
    title: 'Your service advisor',
    greeting: "Hey! \uD83D\uDC4B Still weighing options?\n\nI can help you decide \u2014 janitorial, day porter, or both. Or get you a quote in 24 hours.\n\nWhat fits your space?",
    replies: ['Janitorial', 'Day porter', 'Both', 'Help me decide']
  },
  'about': {
    title: 'Your Ecco guide',
    greeting: "Hey! \uD83D\uDC4B Reading about Ecco?\n\n12+ years in NYC, dedicated teams, eco-certified, 200+ businesses trust us. Want to chat fit or get a quote?\n\nWhat\u2019s most useful?",
    replies: ['What makes you different?', 'NYC coverage', 'Client examples', PRIMARY_QUOTE_CTA]
  },
  'careers': {
    title: 'Your careers guide',
    greeting: "Hey! \uD83D\uDC4B Interested in joining Ecco?\n\nWe hire Cleaning Techs, Day Porters, and Team Leads. Happy to share what we look for or point you to openings.\n\nWhat\u2019s your question?",
    replies: ['Open positions?', 'How to apply?', 'Pay & benefits', 'Team culture']
  },
  'testimonials': {
    title: 'Cleaning Experience Advisor',
    greeting: "Hey! \uD83D\uDC4B Checking reviews?\n\n200+ NYC businesses trust Ecco. Want to see what stands out, hear about specific industries, or get a quote?\n\nWhat helps?",
    replies: ['Industries you serve?', 'Client retention?', PRIMARY_QUOTE_CTA, 'Talk to the team']
  },
  'why-ecco': {
    title: 'Cleaning Experience Advisor',
    greeting: "Hey! \uD83D\uDC4B Comparing us?\n\nKey things: dedicated teams (no turnover), eco-certified products, 24hr quote turnaround. Dig into any \u2014 or start your quote?\n\nWhat\u2019s on your mind?",
    replies: ['Dedicated teams?', 'Eco-certified?', 'Pricing approach', PRIMARY_QUOTE_CTA]
  },
  'default': {
    title: 'Cleaning Experience Advisor',
    greeting: "Glad you stopped by! \uD83D\uDC4B\n\nI can help you find the right service, ballpark pricing, or line up a free quote in 24 hours.\n\nSo \u2014 what\u2019s on your mind?",
    replies: ['What does it cost?', 'How fast can you start?', 'Which service fits me?', 'Talk to the team']
  }
};

function getPageContextKey() {
  var p = (location.pathname || '').toLowerCase();
  if (/\/janitorial\.html/.test(p)) return 'janitorial';
  if (/\/day-porter\.html/.test(p)) return 'day-porter';
  if (/\/quote(-|\.)/.test(p)) return 'quote';
  if (/\/sustainability/.test(p)) return 'sustainability';
  if (/\/services\.html/.test(p)) return 'services';
  if (/\/about/.test(p)) return 'about';
  if (/\/careers/.test(p)) return 'careers';
  if (/\/testimonials/.test(p)) return 'testimonials';
  if (/\/why-ecco/.test(p)) return 'why-ecco';
  return 'default';
}

var pageContent = PAGE_CONTENT[getPageContextKey()] || PAGE_CONTENT['default'];

const CONFIG = {
  apiUrl: 'https://ecco-chat-backend.vercel.app/api/chat',
  botName: 'Alina',
  botTitle: pageContent.title,
  avatar: 'images/alina-avatar.jpg',
  greeting: pageContent.greeting,
  placeholder: 'Ask Alina anything...',
  poweredBy: '🤖 AI-powered assistant · Not a real person'
};

var styles = document.createElement('style');
styles.textContent = `
.ecco-chat-toggle { position: fixed; bottom: 28px; left: 28px; z-index: 999; display: inline-flex; align-items: center; gap: 10px; padding: 8px 22px 8px 8px; background: #fff; border: 1.5px solid rgba(11,29,56,.12); border-radius: 100px; box-shadow: 0 14px 36px -8px rgba(11,29,56,.2), 0 4px 10px rgba(11,29,56,.08); font-family: 'DM Sans', system-ui, sans-serif; font-size: .88rem; font-weight: 600; color: #0B1D38; cursor: pointer; transition: all .3s cubic-bezier(.34,1.3,.64,1); }
.ecco-chat-toggle:hover { border-color: #2D7A32; transform: translateY(-3px) scale(1.02); box-shadow: 0 20px 44px -10px rgba(45,122,50,.3), 0 6px 14px rgba(45,122,50,.12); }
.ecco-chat-toggle:hover .ecco-chat-toggle-label { color: #2D7A32; }
.ecco-chat-toggle.open { display: none; }
.ecco-chat-toggle-badge { position: absolute; top: 2px; right: 2px; min-width: 18px; height: 18px; border-radius: 50%; background: #E54848; color: #fff; font-size: .65rem; font-weight: 700; display: none; align-items: center; justify-content: center; padding: 0 5px; border: 2px solid #fff; font-family: 'DM Sans', system-ui, sans-serif; z-index: 3; box-shadow: 0 2px 6px rgba(229,72,72,.4); }
.ecco-chat-toggle.has-unread .ecco-chat-toggle-badge { display: inline-flex; animation: ecco-badge-pop .4s cubic-bezier(.34,1.56,.64,1); }
@keyframes ecco-badge-pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
.ecco-chat-shortcut-hint { display: inline-flex; align-items: center; gap: .25rem; padding: 1px 5px 2px; border-radius: 4px; background: rgba(11,29,56,.06); color: rgba(11,29,56,.55); font-family: 'SF Mono', ui-monospace, monospace; font-size: .62rem; font-weight: 600; margin-left: .35rem; letter-spacing: .03em; }
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
.ecco-chat-panel { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 998; width: 400px; height: min(680px, calc(100dvh - 3rem)); max-height: calc(100dvh - 3rem); border-radius: 20px; background: #fff; box-shadow: 0 24px 70px rgba(11,29,56,.22), 0 4px 12px rgba(11,29,56,.08); display: flex; flex-direction: column; opacity: 0; visibility: hidden; transform-origin: 100% 100%; transform: translate(calc(400px - 100vw + 80px), 0) scale(.8); transition: transform .55s cubic-bezier(.25, .46, .45, .94), opacity .35s ease, visibility 0s linear .55s; overflow: hidden; }
.ecco-chat-panel.open { opacity: 1; visibility: visible; transform: translate(0, 0) scale(1); transition: transform .55s cubic-bezier(.25, .46, .45, .94), opacity .25s ease .05s, visibility 0s; }
.ecco-chat-header { background: #fff; border-bottom: 1px solid rgba(11,29,56,.08); padding: .9rem 1rem; display: flex; align-items: center; gap: .7rem; flex-shrink: 0; }
.ecco-chat-avatar { width: 42px; height: 42px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 10px rgba(11,29,56,.12), 0 0 0 1px rgba(11,29,56,.06); overflow: hidden; flex-shrink: 0; }
.ecco-chat-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ecco-chat-header-info h4 { color: #0B1D38; font-size: .95rem; font-weight: 700; margin: 0; font-family: 'DM Sans', system-ui, sans-serif; letter-spacing: -.01em; }
.ecco-chat-header-title { color: rgba(11,29,56,.52); font-size: .72rem; font-weight: 500; font-family: 'DM Sans', system-ui, sans-serif; margin-top: .05rem; }
.ecco-chat-header-status { display: flex; align-items: center; gap: .35rem; color: #2D7A32; font-size: .68rem; font-weight: 600; margin-top: .15rem; }
.ecco-chat-header-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #2D7A32; box-shadow: 0 0 0 3px rgba(45,122,50,.18); }
.ecco-chat-header-info { flex: 1; min-width: 0; }
.ecco-chat-header-info h4 { line-height: 1.15; }
.ecco-chat-header-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.ecco-chat-trust-bar { background: #F5F3EE; padding: .45rem 1rem; font-size: .68rem; color: rgba(11,29,56,.58); font-weight: 500; text-align: center; letter-spacing: .015em; border-bottom: 1px solid rgba(11,29,56,.06); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'DM Sans', system-ui, sans-serif; flex-shrink: 0; }
.ecco-chat-trust-bar strong { color: rgba(11,29,56,.74); font-weight: 600; }
.ecco-chat-trust-bar .sep { opacity: .4; margin: 0 .35rem; }
.ecco-chat-actions { margin-left: auto; display: flex; gap: .25rem; }
.ecco-chat-close, .ecco-chat-reset { background: transparent; border: none; color: #5B6A84; cursor: pointer; width: 44px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem; transition: all .2s; }
.ecco-chat-close:hover, .ecco-chat-reset:hover { background: rgba(11,29,56,.06); color: #0B1D38; }
.ecco-chat-reset { font-size: .9rem; }
.ecco-chat-cta-bar { display: flex; align-items: center; justify-content: center; gap: .55rem; min-height: 44px; padding: .5rem 1rem; background: linear-gradient(135deg, #2D7A32 0%, #236128 100%); color: #fff; text-decoration: none; font-size: .82rem; font-weight: 600; font-family: 'DM Sans', system-ui, sans-serif; transition: background .2s; flex-shrink: 0; letter-spacing: -.005em; }
.ecco-chat-cta-bar:hover, .ecco-chat-cta-bar:focus-visible { background: linear-gradient(135deg, #236128 0%, #1A4A20 100%); outline: none; color: #fff; }
.ecco-chat-cta-icon { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: ecco-cta-pulse 2.2s ease-in-out infinite; flex-shrink: 0; }
@keyframes ecco-cta-pulse { 0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,.55); } 50% { opacity: .75; transform: scale(1.25); box-shadow: 0 0 0 5px rgba(255,255,255,0); } }
.ecco-chat-cta-arrow { display: inline-block; transition: transform .2s; }
.ecco-chat-cta-bar:hover .ecco-chat-cta-arrow { transform: translateX(3px); }
.ecco-chat-divider { text-align: center; font-size: .68rem; color: #94A3B5; padding: .4rem .8rem; font-family: 'DM Sans', system-ui, sans-serif; font-style: italic; letter-spacing: .01em; display: flex; align-items: center; gap: .6rem; margin: .3rem 0; }
.ecco-chat-divider::before, .ecco-chat-divider::after { content: ''; flex: 1; height: 1px; background: rgba(11,29,56,.08); }
.ecco-retry-banner { display: inline-flex; align-items: center; gap: .5rem; align-self: flex-start; padding: .45rem .75rem; background: #FFF7E6; border: 1px solid #F5E3B3; border-radius: 12px; font-size: .74rem; color: #8A6A1C; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500; max-width: 85%; animation: ecco-fadeIn .3s ease; flex-wrap: wrap; }
.ecco-retry-icon { color: #D68A0B; font-size: .55rem; animation: ecco-retry-pulse 1.4s ease-in-out infinite; }
@keyframes ecco-retry-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
.ecco-retry-btn { background: transparent; border: none; color: #8A6A1C; font-weight: 700; text-decoration: underline; cursor: pointer; padding: 0 .1rem; font-family: inherit; font-size: inherit; min-height: 24px; }
.ecco-retry-btn:hover { color: #5E4608; }
.ecco-copyable { display: inline-flex; align-items: center; gap: .25rem; background: rgba(11,29,56,.05); padding: 1px 3px 1px 6px; border-radius: 6px; font-size: .96em; }
.ecco-copy-btn { background: transparent; border: none; cursor: pointer; padding: 1px 4px; font-size: .88em; opacity: .6; transition: opacity .2s; line-height: 1; color: inherit; font-family: inherit; min-height: auto; }
.ecco-copy-btn:hover { opacity: 1; }
.ecco-copy-btn.copied { color: #2D7A32; opacity: 1; }
.ecco-chat-offline-banner { display: flex; align-items: center; gap: .5rem; padding: .5rem .85rem; background: #FFF7E6; border: 1px solid #F5E3B3; border-radius: 10px; font-size: .74rem; color: #8A6A1C; font-weight: 500; align-self: stretch; animation: ecco-fadeIn .3s ease; }
.ecco-chat-offline-banner .ecco-off-icon { color: #D68A0B; font-size: .8rem; }
.ecco-scroll-fab { position: absolute; bottom: 140px; right: 14px; background: #0B1D38; color: #fff; border: none; padding: .5rem .9rem .55rem; border-radius: 22px; font-size: .75rem; font-weight: 600; font-family: 'DM Sans', system-ui, sans-serif; cursor: pointer; box-shadow: 0 6px 18px rgba(11,29,56,.28); opacity: 0; transform: translateY(10px) scale(.9); transition: all .25s cubic-bezier(.34,1.3,.64,1); pointer-events: none; z-index: 5; display: inline-flex; align-items: center; gap: .3rem; }
.ecco-scroll-fab.show { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
.ecco-scroll-fab:hover { background: #15294D; }
.ecco-service-card { background: #fff; border: 1px solid #E5EBF2; border-radius: 14px; padding: .85rem 1rem; margin: .25rem 0; box-shadow: 0 1px 4px rgba(11,29,56,.04); align-self: flex-start; max-width: 92%; animation: ecco-fadeIn .3s ease; }
.ecco-service-card-head { display: flex; align-items: center; gap: .55rem; margin-bottom: .4rem; }
.ecco-service-card-icon { width: 36px; height: 36px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.ecco-service-card-icon.jan { background: linear-gradient(135deg, #E8F5EA, #D4EFD8); }
.ecco-service-card-icon.por { background: linear-gradient(135deg, #E6EEFC, #CFDAF3); }
.ecco-service-card-title { font-family: 'DM Sans', system-ui, sans-serif; font-weight: 700; color: #0B1D38; font-size: .95rem; letter-spacing: -.01em; }
.ecco-service-card-sub { font-family: 'DM Sans', system-ui, sans-serif; font-size: .72rem; color: rgba(11,29,56,.55); font-weight: 500; margin-top: 1px; }
.ecco-service-card-bullets { list-style: none; padding: 0; margin: .4rem 0 .7rem; font-family: 'DM Sans', system-ui, sans-serif; font-size: .78rem; color: #1A1E2C; }
.ecco-service-card-bullets li { padding: .18rem 0 .18rem 1.15rem; position: relative; line-height: 1.4; }
.ecco-service-card-bullets li::before { content: ''; position: absolute; left: 0; top: .62rem; width: 6px; height: 6px; border-radius: 50%; background: #2D7A32; }
.ecco-service-card-cta { display: inline-flex; align-items: center; gap: .3rem; color: #2D7A32; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 700; font-size: .82rem; text-decoration: none; transition: gap .2s; }
.ecco-service-card-cta:hover { gap: .5rem; }
.ecco-proactive-nudge { position: fixed; bottom: 5.5rem; left: 28px; z-index: 998; background: #fff; color: #1A1E2C; padding: .9rem 1.1rem .9rem 1rem; border-radius: 14px 14px 14px 4px; box-shadow: 0 12px 38px rgba(11,29,56,.18); font-size: .84rem; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500; max-width: 290px; opacity: 0; visibility: hidden; transform: translateY(10px); transition: all .4s cubic-bezier(.34,1.3,.64,1); line-height: 1.45; border: 1px solid rgba(11,29,56,.06); }
.ecco-proactive-nudge.show { opacity: 1; visibility: visible; transform: translateY(0); }
.ecco-proactive-nudge .pn-name { font-weight: 700; color: #0B1D38; }
.ecco-proactive-nudge .pn-close { position: absolute; top: .35rem; right: .5rem; background: none; border: none; color: #94A3B5; cursor: pointer; font-size: .88rem; padding: .25rem; }
.ecco-proactive-nudge .pn-open { display: inline-flex; align-items: center; gap: .3rem; margin-top: .5rem; background: #2D7A32; color: #fff; border: none; padding: .45rem .85rem; border-radius: 20px; font-size: .78rem; font-weight: 600; cursor: pointer; font-family: inherit; }
.ecco-proactive-nudge .pn-open:hover { background: #236128; }
.ecco-quote-summary { background: linear-gradient(180deg, #fff 0%, #F5F3EE 100%); border: 1px solid #E5EBF2; border-radius: 16px; padding: 1rem 1.1rem; align-self: stretch; animation: ecco-fadeIn .4s ease; font-family: 'DM Sans', system-ui, sans-serif; }
.eqs-head { font-weight: 700; color: #0B1D38; font-size: .92rem; margin-bottom: .7rem; letter-spacing: -.01em; }
.eqs-list { list-style: none; padding: 0; margin: 0 0 .85rem; display: flex; flex-direction: column; gap: .3rem; }
.eqs-list li { display: grid; grid-template-columns: 22px 80px 1fr; gap: .5rem; align-items: center; font-size: .8rem; color: #1A1E2C; padding: .25rem 0; }
.eqs-ic { font-size: .95rem; }
.eqs-lbl { color: rgba(11,29,56,.5); font-size: .72rem; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; }
.eqs-val { color: #0B1D38; font-weight: 600; font-size: .84rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eqs-send { width: 100%; background: linear-gradient(135deg, #2D7A32, #236128); color: #fff; border: none; padding: .85rem 1rem; border-radius: 12px; font-weight: 700; font-size: .92rem; cursor: pointer; font-family: inherit; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: .35rem; box-shadow: 0 4px 14px rgba(45,122,50,.28); }
.eqs-send:hover { background: linear-gradient(135deg, #236128, #1A4A20); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(45,122,50,.36); }
.eqs-edit { width: 100%; background: transparent; color: #5B6A84; border: none; padding: .55rem; margin-top: .4rem; font-size: .78rem; cursor: pointer; font-family: inherit; text-decoration: underline; }
.eqs-edit:hover { color: #0B1D38; }
.ecco-chat-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: .6rem; background: #F5F3EE; }
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
.ecco-typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #2D7A32; animation: ecco-bounce .6s ease-in-out infinite; }
.ecco-typing-dots span:nth-child(2) { animation-delay: .15s; }
.ecco-typing-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes ecco-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.ecco-chat-input-area { padding: .7rem .8rem; border-top: 1px solid #EDF0F5; background: #fff; display: flex; gap: .5rem; align-items: center; flex-shrink: 0; }
.ecco-chat-input { flex: 1; border: 1.5px solid #DFE4EC; border-radius: 12px; padding: .7rem .95rem; font-size: 16px; line-height: 1.4; font-family: 'DM Sans', system-ui, sans-serif; color: #1A1E2C; background: #F8F9FB; outline: none; resize: none; max-height: 96px; min-height: 44px; transition: border-color .2s; }
.ecco-chat-input:focus { border-color: #3068AD; background: #fff; }
.ecco-chat-input::placeholder { color: #94A3B5; }
.ecco-chat-send { width: 44px; height: 44px; border-radius: 12px; border: none; background: #0B1D38; color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0; }
.ecco-chat-send:hover { background: #15294D; transform: scale(1.05); }
.ecco-chat-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }
.ecco-chat-send svg { width: 18px; height: 18px; }
.ecco-chat-footer { text-align: center; padding: .35rem; font-size: .6rem; color: #94A3B5; background: #fff; flex-shrink: 0; }
.ecco-quick-replies { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .5rem; }
.ecco-quick-btn { min-height: 44px; padding: .55rem 1rem; border: 1.5px solid #DFE4EC; border-radius: 50px; background: #fff; color: #0B1D38; font-size: .82rem; font-weight: 500; cursor: pointer; font-family: 'DM Sans', system-ui, sans-serif; transition: all .2s; display: inline-flex; align-items: center; }
.ecco-quick-btn:hover { border-color: #0B1D38; background: #0B1D38; color: #fff; }
.ecco-quick-btn-primary { background: #2D7A32; color: #fff; border-color: #2D7A32; box-shadow: 0 4px 12px rgba(45,122,50,.22); }
.ecco-quick-btn-primary:hover { background: #236128; border-color: #236128; color: #fff; }
@media (max-width: 480px) {
  .ecco-chat-panel { width: calc(100vw - 1.5rem); left: .75rem; right: auto; bottom: 5.5rem; height: min(620px, calc(100dvh - 7rem)); max-height: calc(100dvh - 7rem); border-radius: 16px; transform-origin: 0% 100%; transform: translate(0, 18px) scale(.88); }
  .ecco-chat-panel.open { transform: translate(0, 0) scale(1); }
  .ecco-chat-cta-bar { font-size: .8rem; padding: .5rem .75rem; }
  .ecco-chat-trust-bar { font-size: .62rem; padding: .4rem .6rem; }
  .ecco-chat-shortcut-hint { display: none; }
  .ecco-chat-toggle { bottom: 16px; left: 16px; padding: 6px 16px 6px 6px; font-size: .8rem; }
  .ecco-chat-toggle-avatar { width: 32px; height: 32px; }
  .ecco-chat-toggle-pulse { width: 32px; height: 32px; }
  .ecco-chat-tooltip { left: 16px; bottom: 4.5rem; max-width: 200px; }
}
`;
document.head.appendChild(styles);

var widget = document.createElement('div');
widget.id = 'ecco-chat-widget';
widget.innerHTML = '<button class="ecco-chat-toggle" id="eccoChatToggle" aria-label="Ask Alina" title="Ask Alina"><span class="ecco-chat-toggle-pulse" aria-hidden="true"></span><span class="ecco-chat-toggle-avatar"><img src="' + CONFIG.avatar + '" alt="" width="38" height="38"></span><span class="ecco-chat-toggle-label">Ask Alina</span><span class="ecco-chat-toggle-badge" id="eccoChatBadge" aria-hidden="true">1</span></button><div class="ecco-chat-tooltip" id="eccoChatTooltip"><button class="tip-close" id="eccoTipClose" aria-label="Dismiss">\u2715</button><span class="tip-name">Hi, I\u2019m Alina \uD83D\uDC4B</span> Looking for the right cleaning fit for your space?</div><div class="ecco-chat-panel" id="eccoChatPanel" role="dialog" aria-modal="true" aria-label="Chat with Alina"><div class="ecco-chat-header"><div class="ecco-chat-avatar"><img src="' + CONFIG.avatar + '" alt="Alina" width="40" height="40"></div><div class="ecco-chat-header-info"><h4>' + CONFIG.botName + '</h4><div class="ecco-chat-header-title">' + CONFIG.botTitle + ' \u00B7 AI</div><div class="ecco-chat-header-status">Online \u00B7 Replies in ~2 min</div></div><div class="ecco-chat-actions"><button class="ecco-chat-reset" id="eccoChatReset" aria-label="New chat" title="New conversation">\u21BA</button><button class="ecco-chat-close" id="eccoChatClose" aria-label="Close chat">\u2715</button></div></div><div class="ecco-chat-trust-bar"><strong>Licensed</strong><span class="sep">\u00B7</span><strong>Insured</strong><span class="sep">\u00B7</span>12 yrs NYC<span class="sep">\u00B7</span>200+ clients</div><a class="ecco-chat-cta-bar" id="eccoChatCta" href="quote.html"><span class="ecco-chat-cta-icon" aria-hidden="true"></span><span class="ecco-chat-cta-label">Start your free quote \u00B7 24-hour turnaround</span><span class="ecco-chat-cta-arrow" aria-hidden="true">\u2192</span></a><div class="ecco-chat-messages" id="eccoChatMessages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Chat messages"></div><div class="ecco-chat-input-area"><textarea class="ecco-chat-input" id="eccoChatInput" placeholder="' + CONFIG.placeholder + '" rows="1"></textarea><button class="ecco-chat-send" id="eccoChatSend" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div><div class="ecco-chat-footer">' + CONFIG.poweredBy + '<span class="ecco-chat-shortcut-hint" aria-hidden="true">\u2318K</span></div></div>';
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
    var card = tryBuildServiceCard(fullText);
    if (card) { messages.appendChild(card); scrollToNewBotContent(card); return Promise.resolve(); }
    var el = addMessage(fullText, 'bot');
    postProcessBot(el);
    scrollToNewBotContent(el);
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
        var p = paragraphs[i];
        var sCard = tryBuildServiceCard(p);
        if (sCard) {
          messages.appendChild(sCard);
          scrollToNewBotContent(sCard);
        } else {
          var el = addMessage(p, 'bot');
          postProcessBot(el);
          scrollToNewBotContent(el);
        }
        i++;
        sendNext();
      }, delay);
    }
    sendNext();
  });
}

var GREETING_REPLIES = pageContent.replies;

function deriveQuickReplies(botText) {
  var t = botText.toLowerCase();
  var quoteCta = { label: 'Get a free quote \u2192', primary: true, action: 'startQuoteFlow' };
  if (/type of space|what kind of space|what.*space.*(?:clean|service|need)|space are you/.test(t)) {
    return ['Office', 'Medical / Clinic', 'Retail / Lobby', 'Other space', quoteCta];
  }
  if (/how soon|when.*start|timing|timeline|how quickly/.test(t)) {
    return ['ASAP', 'Within a month', 'Just browsing', quoteCta];
  }
  if (/which service|janitorial or|day porter or|recurring or|both services/.test(t)) {
    return ['Janitorial', 'Day porter', 'Both', quoteCta];
  }
  if (/quote|proposal|pricing|cost|how much|ballpark|custom.*price/.test(t)) {
    return [
      { label: 'Get my free quote \u2192', primary: true, action: 'startQuoteFlow' },
      'Talk to the team',
      "What's included?"
    ];
  }
  if (/janitorial|day porter|eco-?certified|service/.test(t)) {
    return [
      { label: 'Get a free quote \u2192', primary: true, action: 'startQuoteFlow' },
      'Talk to the team',
      'Compare services'
    ];
  }
  return [
    { label: 'Get a free quote \u2192', primary: true, action: 'startQuoteFlow' },
    'Talk to the team',
    'Services overview'
  ];
}

function showQuickReplies(replies) {
  replies = replies || GREETING_REPLIES;
  var container = document.createElement('div');
  container.className = 'ecco-quick-replies';
  replies.forEach(function(item) {
    var isObj = typeof item === 'object' && item !== null;
    var label = isObj ? item.label : item;
    var sendText = isObj ? (item.text || item.label) : item;
    var primary = isObj && item.primary;
    var action = isObj && item.action;
    var btn = document.createElement('button');
    btn.className = 'ecco-quick-btn' + (primary ? ' ecco-quick-btn-primary' : '');
    btn.textContent = label;
    btn.addEventListener('click', function() {
      container.remove();
      if (action === 'startQuoteFlow') { startQuoteFlow(); return; }
      if (quoteFlow.active) { handleQuoteAnswer(sendText); return; }
      handleSend(sendText);
    });
    container.appendChild(btn);
  });
  messages.appendChild(container);
  scrollIfAtBottom();
}

function showTyping() {
  var div = document.createElement('div');
  div.className = 'ecco-typing';
  div.id = 'eccoTyping';
  div.innerHTML = '<span class="ecco-typing-label">Alina is typing</span><span class="ecco-typing-dots"><span></span><span></span><span></span></span>';
  messages.appendChild(div);
  if (isUserNearBottom()) messages.scrollTop = messages.scrollHeight;
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
  var pageCtx = getPageContext();
  var contextNote = pageCtx ? ' (User is currently viewing: "' + pageCtx + '")' : '';
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 15000);
  try {
    var res = await fetch(CONFIG.apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage + contextNote, history: conversationHistory.slice() }), signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Server error');
    var data = await res.json();
    var reply = data.reply || "Let me connect you with our team \u2014 email **info@eccofacilities.com**.";
    return { text: reply, fromFallback: false };
  } catch (err) { clearTimeout(timeout); return { text: getFallbackResponse(userMessage), fromFallback: true }; }
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

/* ============ SERVICE CARDS + COPY BUTTONS ============ */

function buildServiceCard(kind) {
  var card = document.createElement('div');
  card.className = 'ecco-service-card';
  var config = kind === 'jan'
    ? { icon: '\uD83E\uDDF9', title: 'Janitorial', sub: 'Recurring cleaning, on your schedule', href: 'janitorial.html', bullets: ['You pick the frequency & times', 'Dedicated, trained janitorial team', '100% eco-certified products', 'Works nights, weekends, after-hours'] }
    : { icon: '\uD83D\uDC64', title: 'Day Porter', sub: 'On-site during business hours', href: 'day-porter.html', bullets: ['Keeps lobby & restrooms guest-ready', 'Handles spills, restocks, touch-ups', 'Dedicated, uniformed porter', 'Flexible shifts (4h, 6h, 8h)'] };
  var bulletsHtml = config.bullets.map(function(b) { return '<li>' + b + '</li>'; }).join('');
  card.innerHTML =
    '<div class="ecco-service-card-head">' +
      '<div class="ecco-service-card-icon ' + kind + '">' + config.icon + '</div>' +
      '<div>' +
        '<div class="ecco-service-card-title">' + config.title + '</div>' +
        '<div class="ecco-service-card-sub">' + config.sub + '</div>' +
      '</div>' +
    '</div>' +
    '<ul class="ecco-service-card-bullets">' + bulletsHtml + '</ul>' +
    '<a class="ecco-service-card-cta" href="' + config.href + '">Learn more <span aria-hidden="true">\u2192</span></a>';
  return card;
}

function tryBuildServiceCard(text) {
  var t = text.trim();
  if (/^\*\*Janitorial\*\*/i.test(t)) return buildServiceCard('jan');
  if (/^\*\*Day Porter\*\*/i.test(t)) return buildServiceCard('por');
  return null;
}

function upgradeCopyables(el) {
  if (!el) return;
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  var textNodes = [];
  var node;
  while (node = walker.nextNode()) textNodes.push(node);
  var emailRx = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;
  var phoneRx = /(?:\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/;
  textNodes.forEach(function(n) {
    var p = n.parentNode;
    if (!p) return;
    if (p.tagName === 'A' || (p.classList && p.classList.contains('ecco-copyable'))) return;
    var text = n.nodeValue;
    if (!emailRx.test(text) && !phoneRx.test(text)) return;
    var combinedRx = /(\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)|(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/g;
    var frag = document.createDocumentFragment();
    var lastIdx = 0;
    var m;
    while (m = combinedRx.exec(text)) {
      if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.substring(lastIdx, m.index)));
      var value = m[0];
      var span = document.createElement('span');
      span.className = 'ecco-copyable';
      span.setAttribute('data-copy', value);
      span.textContent = value;
      var btn = document.createElement('button');
      btn.className = 'ecco-copy-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Copy ' + value);
      btn.textContent = '\uD83D\uDCCB';
      span.appendChild(btn);
      frag.appendChild(span);
      lastIdx = m.index + value.length;
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.substring(lastIdx)));
    p.replaceChild(frag, n);
  });
}

function postProcessBot(el) {
  if (!el) return;
  upgradeCopyables(el);
}

/* ============ OFFLINE + SCROLL FAB ============ */

function updateOnlineStatus() {
  if (!messages) return;
  var existing = messages.querySelector('.ecco-chat-offline-banner');
  if (!navigator.onLine) {
    if (!existing) {
      var banner = document.createElement('div');
      banner.className = 'ecco-chat-offline-banner';
      banner.innerHTML = '<span class="ecco-off-icon" aria-hidden="true">\u26A0</span>You\u2019re offline \u2014 responses may be limited';
      messages.insertBefore(banner, messages.firstChild);
    }
  } else {
    if (existing) existing.remove();
  }
}

function isUserNearBottom() {
  if (!messages) return true;
  return (messages.scrollTop + messages.clientHeight) >= messages.scrollHeight - 80;
}

var unreadCount = 0;

function notifyNewContent() {
  if (!scrollFab) return;
  unreadCount++;
  scrollFab.innerHTML = '<span aria-hidden="true">\u2193</span> ' + unreadCount + ' new';
  scrollFab.classList.add('show');
}

function resetUnread() {
  unreadCount = 0;
  if (scrollFab) {
    scrollFab.innerHTML = '<span aria-hidden="true">\u2193</span> New';
    scrollFab.classList.remove('show');
  }
}

function scrollIfAtBottom() {
  if (isUserNearBottom()) { messages.scrollTop = messages.scrollHeight; resetUnread(); }
  else notifyNewContent();
}

function scrollToNewBotContent(el) {
  if (isUserNearBottom()) { scrollToMessage(el); resetUnread(); }
  else notifyNewContent();
}

function maybeShowScrollFab() { /* deprecated — replaced by smart scroll */ }

/* ============ PROACTIVE NUDGE ============ */

function showProactiveNudge(text, key) {
  if (isOpen) return;
  var existing = document.querySelector('.ecco-proactive-nudge');
  if (existing) existing.remove();
  var nudge = document.createElement('div');
  nudge.className = 'ecco-proactive-nudge';
  nudge.innerHTML =
    '<button class="pn-close" type="button" aria-label="Dismiss">\u2715</button>' +
    '<div><span class="pn-name">Alina</span> \u2014 ' + text + '</div>' +
    '<button class="pn-open" type="button">Chat with me <span aria-hidden="true">\u2192</span></button>';
  document.body.appendChild(nudge);
  requestAnimationFrame(function() { nudge.classList.add('show'); });
  nudge.querySelector('.pn-close').addEventListener('click', function() {
    nudge.classList.remove('show');
    setTimeout(function() { if (nudge.parentNode) nudge.remove(); }, 400);
    try { localStorage.setItem('eccoNudgeDismissed_' + key, '1'); } catch(e) {}
  });
  nudge.querySelector('.pn-open').addEventListener('click', function() {
    nudge.classList.remove('show');
    setTimeout(function() { if (nudge.parentNode) nudge.remove(); }, 400);
    toggle.click();
  });
  setTimeout(function() {
    if (nudge.parentNode) {
      nudge.classList.remove('show');
      setTimeout(function() { if (nudge.parentNode) nudge.remove(); }, 400);
    }
  }, 14000);
}

function schedulePageNudge() {
  var nudges = {
    'quote': { delay: 28000, text: "stuck on a step? Just ask." },
    'janitorial': { delay: 40000, text: "curious about pricing or frequency?" },
    'day-porter': { delay: 40000, text: "want to know typical shift length?" },
    'services': { delay: 35000, text: "not sure which service fits? I can help pick." }
  };
  var key = getPageContextKey();
  var nudge = nudges[key];
  if (!nudge) return;
  try { if (localStorage.getItem('eccoNudgeDismissed_' + key)) return; } catch(e) {}
  setTimeout(function() { showProactiveNudge(nudge.text, key); }, nudge.delay);
}

/* ============ QUOTE FLOW ============ */

var QUOTE_STEPS = [
  { field: 'spaceType', prompt: "Got it \u2014 let's build your quote. First: what kind of space?", replies: ['Office', 'Medical / Clinic', 'Retail / Lobby', 'Warehouse', 'Gym / Studio', 'Other'] },
  { field: 'sqft', prompt: "Roughly how many square feet?", replies: ['Under 2,000', '2,000\u20135,000', '5,000\u201310,000', '10,000+', 'Not sure'] },
  { field: 'frequency', prompt: "How often do you need cleaning?", replies: ['Daily (M\u2013F)', '3\u00D7 per week', 'Weekly', 'Bi-weekly', 'One-time', 'Not sure'] },
  { field: 'urgency', prompt: "When are you looking to start?", replies: ['ASAP (within a week)', 'Within a month', 'Just exploring'] },
  { field: 'firstName', prompt: "Great. What's your first name?", input: true, placeholder: 'First name' },
  { field: 'email', prompt: "Best email for the proposal?", input: true, placeholder: 'you@company.com', validate: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, validateMsg: "Hmm, that email looks off \u2014 mind trying again?" },
  { field: 'phone', prompt: "Phone? (optional, but helps us respond faster)", input: true, placeholder: '(xxx) xxx-xxxx', optional: true }
];

var quoteFlow = { active: false, step: 0, data: {} };

function startQuoteFlow() {
  var stale = messages.querySelector('.ecco-quick-replies');
  if (stale) stale.remove();
  addMessage("I'd like a free quote", 'user');
  conversationHistory.push({ role: 'user', content: "I'd like a free quote" });
  quoteFlow = { active: true, step: 0, data: {} };
  askQuoteStep();
}

function askQuoteStep() {
  if (quoteFlow.step >= QUOTE_STEPS.length) { showQuoteSummary(); return; }
  var stepDef = QUOTE_STEPS[quoteFlow.step];
  var stale = messages.querySelector('.ecco-quick-replies');
  if (stale) stale.remove();
  showTyping();
  setTimeout(function() {
    hideTyping();
    var el = addMessage(stepDef.prompt, 'bot');
    postProcessBot(el);
    scrollToNewBotContent(el);
    if (stepDef.replies) {
      showQuickReplies(stepDef.replies);
      input.placeholder = 'Or type your own\u2026';
    } else if (stepDef.input) {
      input.placeholder = stepDef.placeholder || CONFIG.placeholder;
      if (stepDef.optional) { showQuickReplies(['Skip']); }
      input.focus();
    }
  }, 550);
}

function handleQuoteAnswer(value) {
  var stepDef = QUOTE_STEPS[quoteFlow.step];
  if (!stepDef) return false;
  var v = (value || '').trim();
  if (stepDef.optional && /^skip$/i.test(v)) { v = ''; }
  if (stepDef.validate && v && !stepDef.validate.test(v)) {
    addMessage(v, 'user');
    setTimeout(function() {
      var el = addMessage(stepDef.validateMsg || "Try again?", 'bot');
      postProcessBot(el);
      scrollToNewBotContent(el);
    }, 300);
    return true;
  }
  if (!v && !stepDef.optional) { return true; }
  addMessage(v || '(skipped)', 'user');
  quoteFlow.data[stepDef.field] = v;
  quoteFlow.step++;
  input.placeholder = CONFIG.placeholder;
  askQuoteStep();
  return true;
}

function showQuoteSummary() {
  var d = quoteFlow.data;
  var stale = messages.querySelector('.ecco-quick-replies');
  if (stale) stale.remove();
  showTyping();
  setTimeout(function() {
    hideTyping();
    var card = document.createElement('div');
    card.className = 'ecco-quote-summary';
    var rows = [
      { icon: '\uD83C\uDFE2', label: 'Space', v: d.spaceType },
      { icon: '\uD83D\uDCD0', label: 'Size', v: d.sqft },
      { icon: '\uD83D\uDCC5', label: 'Frequency', v: d.frequency },
      { icon: '\u23F1', label: 'Timing', v: d.urgency },
      { icon: '\uD83D\uDC64', label: 'Name', v: d.firstName },
      { icon: '\uD83D\uDCE7', label: 'Email', v: d.email }
    ];
    if (d.phone) rows.push({ icon: '\uD83D\uDCDE', label: 'Phone', v: d.phone });
    /* XSS-safe: build DOM with createElement + textContent (user data never via innerHTML) */
    var head = document.createElement('div');
    head.className = 'eqs-head';
    head.textContent = "Almost done! Here's what I've got:";
    var list = document.createElement('ul');
    list.className = 'eqs-list';
    rows.forEach(function(r) {
      var li = document.createElement('li');
      var ic = document.createElement('span'); ic.className = 'eqs-ic'; ic.textContent = r.icon;
      var lbl = document.createElement('span'); lbl.className = 'eqs-lbl'; lbl.textContent = r.label;
      var val = document.createElement('span'); val.className = 'eqs-val'; val.textContent = r.v || '\u2014';
      li.appendChild(ic); li.appendChild(lbl); li.appendChild(val);
      list.appendChild(li);
    });
    var sendBtn = document.createElement('button');
    sendBtn.className = 'eqs-send'; sendBtn.type = 'button';
    sendBtn.appendChild(document.createTextNode('Send my quote '));
    var arr = document.createElement('span'); arr.setAttribute('aria-hidden', 'true'); arr.textContent = '\u2192';
    sendBtn.appendChild(arr);
    var editBtn = document.createElement('button');
    editBtn.className = 'eqs-edit'; editBtn.type = 'button';
    editBtn.textContent = 'Start over';
    card.appendChild(head); card.appendChild(list); card.appendChild(sendBtn); card.appendChild(editBtn);
    messages.appendChild(card);
    scrollIfAtBottom();
    sendBtn.addEventListener('click', function() {
      var url = buildQuoteUrl(d);
      window.location.href = url;
    });
    editBtn.addEventListener('click', function() {
      card.remove();
      quoteFlow = { active: true, step: 0, data: {} };
      addMessage("No problem \u2014 let me re-ask those.", 'bot');
      askQuoteStep();
    });
    quoteFlow.active = false;
  }, 700);
}

function buildQuoteUrl(d) {
  var params = new URLSearchParams();
  if (d.firstName) params.set('firstName', d.firstName);
  if (d.email) params.set('email', d.email);
  if (d.phone) params.set('phone', d.phone);
  if (d.spaceType) params.set('space', d.spaceType);
  if (d.sqft) params.set('size', d.sqft);
  if (d.frequency) params.set('freq', d.frequency);
  if (d.urgency) params.set('urgency', d.urgency);
  return 'quote.html?' + params.toString();
}

function showRetryBanner(userMessage) {
  var existing = messages.querySelector('.ecco-retry-banner');
  if (existing) existing.remove();
  var banner = document.createElement('div');
  banner.className = 'ecco-retry-banner';
  banner.setAttribute('role', 'alert');
  banner.innerHTML = '<span class="ecco-retry-icon" aria-hidden="true">\u25CF</span><span>Couldn\u2019t reach Alina \u00B7 quick-answer mode</span><button class="ecco-retry-btn" type="button">Try again</button>';
  messages.appendChild(banner);
  banner.querySelector('.ecco-retry-btn').addEventListener('click', function() {
    if (isLoading) return;
    var children = Array.from(messages.children);
    for (var i = children.length - 1; i >= 0; i--) {
      var el = children[i];
      if (el.classList && el.classList.contains('ecco-msg-user')) break;
      el.remove();
    }
    handleSend(userMessage, true);
  });
  scrollIfAtBottom();
}

async function handleSend(text, isRetry) {
  var msg = text || input.value.trim();
  if (!msg || isLoading) return;
  if (quoteFlow.active) { input.value = ''; autoResize(); handleQuoteAnswer(msg); return; }
  if (msgCount >= MAX_MESSAGES) { addMessage("Great chat! For more help: **info@eccofacilities.com** or [get a quote](quote.html).", 'bot'); return; }
  var stale = messages.querySelector('.ecco-quick-replies');
  if (stale) stale.remove();
  var oldBanner = messages.querySelector('.ecco-retry-banner');
  if (oldBanner) oldBanner.remove();
  if (!isRetry) {
    input.value = '';
    autoResize();
    addMessage(msg, 'user');
    conversationHistory.push({ role: 'user', content: msg });
    msgCount++;
    messages.scrollTop = messages.scrollHeight;
  }
  isLoading = true;
  sendBtn.disabled = true;
  showTyping();
  var result = await sendToAPI(msg);
  hideTyping();
  await addBotReplyChunked(result.text);
  if (!result.fromFallback) {
    conversationHistory.push({ role: 'assistant', content: result.text });
  }
  if (msgCount < MAX_MESSAGES) { showQuickReplies(deriveQuickReplies(result.text)); }
  if (result.fromFallback) { showRetryBanner(msg); }
  saveState();
  isLoading = false;
  sendBtn.disabled = false;
  input.focus();
}

var STORAGE_KEY = 'eccoChatState_v1';
var STATE_TTL = 24 * 60 * 60 * 1000;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      history: conversationHistory,
      msgCount: msgCount,
      savedAt: Date.now()
    }));
  } catch (e) {}
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (!s || !s.savedAt || !s.history || !s.history.length) return null;
    if (Date.now() - s.savedAt > STATE_TTL) { localStorage.removeItem(STORAGE_KEY); return null; }
    return s;
  } catch (e) { return null; }
}

function clearState() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }

function restoreConversation(state) {
  state.history.forEach(function(m) {
    var el = addMessage(m.content, m.role === 'user' ? 'user' : 'bot');
    if (m.role !== 'user') postProcessBot(el);
  });
  var divider = document.createElement('div');
  divider.className = 'ecco-chat-divider';
  divider.textContent = 'Picking up where we left off';
  messages.appendChild(divider);
  conversationHistory = state.history;
  msgCount = state.msgCount || 0;
  greeted = true;
  for (var i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i].role === 'assistant') {
      if (msgCount < MAX_MESSAGES) showQuickReplies(deriveQuickReplies(state.history[i].content));
      break;
    }
  }
  requestAnimationFrame(function() { messages.scrollTop = messages.scrollHeight; });
}

var savedState = loadState();

/* ============ INIT: scroll FAB, unread badge, online status, page nudge ============ */

var scrollFab = document.createElement('button');
scrollFab.className = 'ecco-scroll-fab';
scrollFab.type = 'button';
scrollFab.setAttribute('aria-label', 'Scroll to latest');
scrollFab.innerHTML = '<span aria-hidden="true">\u2193</span> New';
panel.appendChild(scrollFab);

messages.addEventListener('scroll', function() {
  if (isUserNearBottom()) resetUnread();
}, { passive: true });

scrollFab.addEventListener('click', function() {
  messages.scrollTop = messages.scrollHeight;
  resetUnread();
});

/* Copy button — event delegation */
messages.addEventListener('click', function(e) {
  var btn = e.target.closest && e.target.closest('.ecco-copy-btn');
  if (!btn) return;
  var span = btn.closest('.ecco-copyable');
  if (!span) return;
  var value = span.getAttribute('data-copy');
  if (!value) return;
  var doCopy = navigator.clipboard && navigator.clipboard.writeText
    ? navigator.clipboard.writeText(value)
    : new Promise(function(resolve, reject) {
        try { var ta = document.createElement('textarea'); ta.value = value; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); resolve(); } catch(err) { reject(err); }
      });
  doCopy.then(function() {
    btn.textContent = '\u2713';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = '\uD83D\uDCCB'; btn.classList.remove('copied'); }, 1500);
  }).catch(function() {});
});

/* Unread indicator */
if (savedState) {
  toggle.classList.add('has-unread');
  var badgeEl = document.getElementById('eccoChatBadge');
  if (badgeEl) badgeEl.textContent = '\u2022';
}

/* Online/offline listeners */
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

/* Schedule proactive page nudge */
schedulePageNudge();

toggle.addEventListener('click', function() {
  isOpen = !isOpen;
  panel.classList.toggle('open', isOpen);
  toggle.classList.toggle('open', isOpen);
  tooltip.classList.remove('show');
  if (isOpen) { toggle.classList.remove('has-unread'); updateOnlineStatus(); }
  if (isOpen && savedState) { restoreConversation(savedState); savedState = null; }
  else if (isOpen && !greeted) { greeted = true; setTimeout(async function() { await addBotReplyChunked(CONFIG.greeting); showQuickReplies(); }, 400); }
  if (isOpen) input.focus();
});
closeBtn.addEventListener('click', function() { isOpen = false; panel.classList.remove('open'); toggle.classList.remove('open'); toggle.focus(); });
resetBtn.addEventListener('click', function() { conversationHistory = []; msgCount = 0; messages.innerHTML = ''; greeted = false; savedState = null; clearState(); setTimeout(async function() { await addBotReplyChunked(CONFIG.greeting); showQuickReplies(); greeted = true; }, 300); });
sendBtn.addEventListener('click', function() { handleSend(); });
input.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
input.addEventListener('input', autoResize);
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); isOpen = !isOpen; panel.classList.toggle('open', isOpen); toggle.classList.toggle('open', isOpen); tooltip.classList.remove('show'); if (isOpen) { toggle.classList.remove('has-unread'); updateOnlineStatus(); } if (isOpen && savedState) { restoreConversation(savedState); savedState = null; } else if (isOpen && !greeted) { greeted = true; setTimeout(async function() { await addBotReplyChunked(CONFIG.greeting); showQuickReplies(); }, 400); } if (isOpen) input.focus(); else toggle.focus(); }
  if (e.key === 'Escape' && isOpen) { isOpen = false; panel.classList.remove('open'); toggle.classList.remove('open'); toggle.focus(); }
  if (e.key === 'Tab' && isOpen) { var f = [closeBtn, resetBtn, input, sendBtn].filter(function(el) { return el && !el.disabled; }); var first = f[0]; var last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); } }
});
})();
