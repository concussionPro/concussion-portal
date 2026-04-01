/**
 * Squarespace → Portal sync + traffic optimization
 * Loaded via <script src> from Squarespace Code Injection footer.
 * Hosted on the portal to avoid Squarespace's line-wrapping breaking JS strings.
 */
(function() {
  'use strict';

  var PORTAL = 'https://portal.concussion-education-australia.com';
  var UTM = '?utm_source=squarespace&utm_medium=referral&utm_campaign=banner';
  var FREE_TRAINING = PORTAL + '/scat-mastery' + UTM;

  // ── 1. Form submit: Google Ads conversion + portal account sync ──
  // Squarespace 7.1 React forms don't fire native 'submit' events.
  // Use click listener on submit buttons + submit fallback.

  function ceaFindEmail(container) {
    var sels = [
      'input[type="email"]',
      'input[data-title="Email"]', 'input[data-title="email"]',
      'input[autocomplete="email"]'
    ];
    for (var i = 0; i < sels.length; i++) {
      var el = container.querySelector(sels[i]);
      if (el && el.value) return el.value.trim();
    }
    // Fallback: any input whose placeholder/name contains "email"
    var inputs = container.querySelectorAll('input[type="text"], input:not([type])');
    for (var j = 0; j < inputs.length; j++) {
      var inp = inputs[j];
      var hint = ((inp.name || '') + (inp.placeholder || '') + (inp.getAttribute('data-title') || '')).toLowerCase();
      if (hint.indexOf('email') !== -1 && inp.value && inp.value.indexOf('@') !== -1) return inp.value.trim();
    }
    return '';
  }

  function ceaFindName(container) {
    var sels = [
      'input[data-title="Name"]', 'input[data-title="name"]',
      'input[data-title="First Name"]', 'input[data-title="First name"]'
    ];
    for (var i = 0; i < sels.length; i++) {
      var el = container.querySelector(sels[i]);
      if (el && el.value) return el.value.trim();
    }
    var inputs = container.querySelectorAll('input[type="text"], input:not([type])');
    for (var j = 0; j < inputs.length; j++) {
      var inp = inputs[j];
      var hint = ((inp.name || '') + (inp.placeholder || '') + (inp.getAttribute('data-title') || '')).toLowerCase();
      if (hint.indexOf('name') !== -1 && inp.value) return inp.value.trim();
    }
    // Fallback: first non-email text input (Squarespace labels it "Text" not "Name")
    for (var k = 0; k < inputs.length; k++) {
      var inp2 = inputs[k];
      if (inp2.type === 'email') continue;
      var title = (inp2.getAttribute('data-title') || '').toLowerCase();
      if (title === 'email') continue;
      if (inp2.value) return inp2.value.trim();
    }
    return '';
  }

  function ceaSync(email, name) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    // Session dedup — both click + submit listeners may fire
    if (sessionStorage.getItem('cea-synced-' + email)) return;
    sessionStorage.setItem('cea-synced-' + email, '1');

    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        'send_to': 'AW-17984048021/74x1CLfT0IccEJWXu_9C',
        'value': 25.0,
        'currency': 'AUD'
      });
    }

    fetch(PORTAL + '/api/signup-squarespace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, name: name || '' })
    }).catch(function() {});
  }

  // Primary: click listener on submit buttons (works with React forms)
  document.addEventListener('click', function(e) {
    var btn = e.target;
    while (btn && btn !== document.body) {
      if (btn.tagName === 'BUTTON' || (btn.tagName === 'INPUT' && btn.type === 'submit')) break;
      if (btn.classList && btn.classList.contains('form-button-wrapper')) { btn = btn.querySelector('button') || btn; break; }
      btn = btn.parentElement;
    }
    if (!btn || btn === document.body) return;

    var container = btn.closest('form') || btn.closest('.form-block') || btn.closest('.sqs-block-form') || btn.closest('[data-block-type="form"]');
    if (!container) return;

    var email = ceaFindEmail(container);
    var name = ceaFindName(container);
    if (email) ceaSync(email, name);
  }, true);

  // Fallback: native submit event (in case some forms do fire it)
  document.addEventListener('submit', function(e) {
    if (!e.target) return;
    var email = ceaFindEmail(e.target);
    var name = ceaFindName(e.target);
    if (email) ceaSync(email, name);
  }, true);

  // ── 2. Fix broken link ──
  document.querySelectorAll('a[href="/gp-portal-1"]').forEach(function(a) {
    a.href = '/allied';
  });

  // ── 3. Header CTA override ──
  var headerCta = document.querySelector('.header-actions-action--cta a');
  if (headerCta) {
    var href = headerCta.href || '';
    if (href.indexOf('portal.concussion-education-australia.com') !== -1) {
      headerCta.textContent = 'Free CPD Training';
      headerCta.href = FREE_TRAINING;
    }
  }

  // ── 4. Homepage button override ──
  var path = window.location.pathname;
  if (path === '/' || path === '') {
    document.querySelectorAll('a[data-sqsp-button]').forEach(function(btn) {
      var t = btn.textContent.trim().toLowerCase();
      if (t === 'cpd education suite') {
        btn.textContent = 'Start Free SCAT6 Course \u2014 2 CPD Points \u2192';
        btn.href = FREE_TRAINING;
      }
    });
  }

  // ── 5. Inject banner CSS ──
  var css = document.createElement('style');
  css.textContent = [
    '.cea-portal-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;',
    'background:linear-gradient(135deg,#0d9488,#0891b2);color:#fff;padding:12px 20px;',
    'display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
    'box-shadow:0 -4px 20px rgba(0,0,0,0.15);transform:translateY(100%);',
    'transition:transform 0.4s ease}',
    '.cea-portal-banner.visible{transform:translateY(0)}',
    '.cea-portal-banner-text{font-size:14px;font-weight:600;text-align:center}',
    '.cea-portal-banner-text strong{color:#fef08a}',
    '.cea-portal-banner-cta{display:inline-flex;align-items:center;gap:6px;',
    'background:#fff;color:#0d9488;padding:8px 20px;border-radius:50px;',
    'font-size:14px;font-weight:700;text-decoration:none;transition:all 0.2s;',
    'white-space:nowrap}',
    '.cea-portal-banner-cta:hover{background:#f0fdfa;transform:scale(1.03);',
    'color:#0d9488;text-decoration:none}',
    '.cea-portal-banner-close{position:absolute;right:12px;top:50%;',
    'transform:translateY(-50%);background:none;border:none;',
    'color:rgba(255,255,255,0.7);font-size:20px;cursor:pointer;',
    'padding:4px 8px;line-height:1}',
    '.cea-portal-banner-close:hover{color:#fff}',
    'body.cea-banner-active{padding-bottom:60px}',
    '.header-actions-action--cta a.btn{',
    'background:linear-gradient(135deg,#0d9488,#0891b2)!important;',
    'color:#fff!important;border:none!important;border-radius:50px!important;',
    'padding:10px 22px!important;font-weight:700!important;font-size:13px!important;',
    'letter-spacing:0.5px!important;transition:all 0.2s!important;',
    'box-shadow:0 2px 8px rgba(13,148,136,0.3)!important}',
    '.header-actions-action--cta a.btn:hover{',
    'transform:scale(1.05)!important;',
    'box-shadow:0 4px 16px rgba(13,148,136,0.4)!important}',
    '@media(max-width:640px){',
    '.cea-portal-banner{padding:10px 40px 10px 16px;flex-direction:column;gap:8px}',
    '.cea-portal-banner-text{font-size:13px}}'
  ].join('');
  document.head.appendChild(css);

  // ── 6. Sticky banner (dismissible, per-session) ──
  if (!sessionStorage.getItem('cea-banner-dismissed')) {
    var el = document.createElement('div');
    el.className = 'cea-portal-banner';

    var span = document.createElement('span');
    span.className = 'cea-portal-banner-text';
    span.innerHTML = '<strong>Free SCAT6 Training</strong>';
    span.appendChild(document.createTextNode(
      ' \u2014 ~2 hours, 2 CPD points, instant access'
    ));

    var link = document.createElement('a');
    link.className = 'cea-portal-banner-cta';
    link.href = FREE_TRAINING;
    link.target = '_blank';
    link.textContent = 'Start Free Course \u2192';

    var close = document.createElement('button');
    close.className = 'cea-portal-banner-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '\u00d7';

    el.appendChild(span);
    el.appendChild(link);
    el.appendChild(close);
    document.body.appendChild(el);
    document.body.classList.add('cea-banner-active');

    setTimeout(function() { el.classList.add('visible'); }, 2000);

    close.addEventListener('click', function() {
      el.classList.remove('visible');
      document.body.classList.remove('cea-banner-active');
      sessionStorage.setItem('cea-banner-dismissed', '1');
      setTimeout(function() { el.remove(); }, 400);
    });
  }
})();
