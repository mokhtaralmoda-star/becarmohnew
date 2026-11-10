// Local behaviour for captured reference pages. Never sends form data anywhere.
(function () {
  var file = location.pathname.split('/').pop() || '';
  var m = file.match(/^(.+)-(ar|en)(-m|-t)?\.html$/);
  var lang = m ? m[2] : 'ar';
  function go(to, nextLang) {
    var l = nextLang || lang;
    var msg = { type: 'ref-nav', to: to, lang: l };
    if (window.parent !== window) window.parent.postMessage(msg, location.origin);
    else location.href = to + (l === 'en' ? '?lang=en' : '');
  }
  var tabs = [
    [/^(المركبات|Vehicles|Motor|Vehicle)$/i, '/motor-insurance'],
    [/^(الأخطاء الطبية|Medical Malpractice)$/i, '/medical-malpractice'],
    [/^(السفر|Travel)$/i, '/travel-insurance'],
    [/^(العمالة المنزلية|Domestic Workers|Domestic Helpers|Domestic Labor)$/i, '/domestic-workers'],
    [/^(طبي للمنشآت|Medical|Medical Insurance|Corporate Medical)$/i, '/medical-insurance'],
    [/^(أفراد|Individuals)$/i, '@ind'],
    [/^(شركات|Companies|Corporates|Business)$/i, '/medical-insurance'],
    [/^(EN|AR|عربي|English)$/i, '@lang'],
    [/^(طلب العروض|Get Quotations|Request Offers|Get Quotes)$/i, '@quote']
  ];
  // The captured pages scroll inside <body>, so the arrow scrolls every possible scroller.
  function scrollToTop() {
    [document.body, document.documentElement, document.scrollingElement].forEach(function (el) {
      if (el && el.scrollTo) el.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Support chat window like the original. It is local only: typed text is never sent, queued or stored.
  var chatBox = null;
  // تنبيه بصري عند وصول رسالة من الإدارة والزائر لم يفتح الدردشة
  var alertStyle = document.createElement('style');
  alertStyle.textContent = '.ref-chat-alert{position:fixed;transform:translateX(-50%);z-index:2147483000;background:#dc2626;color:#fff;font-size:12px;font-weight:700;padding:5px 10px;border-radius:12px;white-space:nowrap;pointer-events:none;animation:ref-blink 2s steps(1,end) infinite;box-shadow:0 2px 8px rgba(0,0,0,.25)}' +
    '.bubble-frame.ref-alert,.bubble-frame.bg-yellowtheme.ref-alert{background:#dc2626 !important;background-color:#dc2626 !important;border-color:#dc2626 !important;animation:ref-pulse 1s ease-in-out infinite}' +
    '.bubble-frame.ref-alert svg,.bubble-frame.ref-alert img{filter:brightness(0) invert(1)}' +
    '@keyframes ref-blink{0%,49%{opacity:1}50%,100%{opacity:0}}' +
    '@keyframes ref-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}';
  document.head.appendChild(alertStyle);

  var chatAlertEl = null, chatAlertTimer = null, pendingIncoming = [];

  function clearChatAlert() {
    if (chatAlertTimer) { clearInterval(chatAlertTimer); chatAlertTimer = null; }
    if (chatAlertEl && chatAlertEl.parentNode) chatAlertEl.parentNode.removeChild(chatAlertEl);
    chatAlertEl = null;
    document.querySelectorAll('.bubble-frame').forEach(function (b) { b.classList.remove('ref-alert'); b.style.removeProperty('background-color'); b.style.removeProperty('background'); b.style.removeProperty('animation'); });
  }

  function showChatAlert() {
    var btn = document.querySelector('bcare-bubbles .bubble-frame') || document.querySelector('.bubble-frame');
    console.log('[chat-alert] btn=', !!btn, 'open=', !!(chatBox && !chatBox.hidden));
    if (window.parent !== window) window.parent.postMessage({ type: 'ref-chat-ack', found: !!btn }, location.origin);
    if (!btn) return;
    btn.classList.add('ref-alert');
    btn.style.setProperty('background-color', '#dc2626', 'important');
    btn.style.setProperty('background', '#dc2626', 'important');
    btn.style.setProperty('animation', 'ref-pulse 1s ease-in-out infinite', 'important');
    if (chatAlertEl) return;
    chatAlertEl = document.createElement('div');
    chatAlertEl.className = 'ref-chat-alert';
    chatAlertEl.textContent = lang === 'ar' ? 'رسالة عاجلة من الإدارة' : 'Urgent message from admin';
    document.body.appendChild(chatAlertEl);
    var place = function () {
      if (!chatAlertEl) return;
      var r = btn.getBoundingClientRect();
      chatAlertEl.style.top = (r.top - 30) + 'px';
      chatAlertEl.style.left = (r.left + r.width / 2) + 'px';
    };
    place();
    chatAlertTimer = setInterval(place, 500);
  }

  function flushIncoming() {
    if (!pendingIncoming.length) return;
    var msgs = chatBox && chatBox.querySelector('.rc-msgs');
    if (!msgs) return;
    while (pendingIncoming.length) {
      var d = document.createElement('div');
      d.className = 'rc-m them';
      d.textContent = pendingIncoming.shift();
      msgs.appendChild(d);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'ref-chat-incoming') return;
    if (typeof e.data.text !== 'string') return;
    console.log('[chat-alert] incoming; hidden=', !chatBox || chatBox.hidden);
    if (chatBox && !chatBox.hidden) return;
    pendingIncoming.push(e.data.text);
    showChatAlert();
  });

  function openChat() {
    clearChatAlert();
    if (chatBox) { chatBox.hidden = false; flushIncoming(); var i = chatBox.querySelector('input'); if (i) i.focus(); return; }
    var ar = lang === 'ar';
    var T = ar
      ? { name: 'B Care', sub: 'الدعم الفني', hi: 'مرحباً بك في خدمة الدعم', how: 'كيف يمكننا مساعدتك؟', ph: 'اكتب رسالتك...', close: 'إغلاق', send: 'إرسال', off: 'خدمة الدردشة غير متصلة بالخادم حالياً، ولم يتم إرسال رسالتك.', fail: 'لم يتم إرسال الرسالة، حاول مجدداً.' }
      : { name: 'B Care', sub: 'Technical Support', hi: 'Welcome to the support service', how: 'How can we help you?', ph: 'Type your message...', close: 'Close', send: 'Send', off: 'Chat is not connected to the server yet, so your message was not sent.', fail: 'Your message was not sent. Please try again.' };
    var logo = '/ref/assets/bcare.com.sa/assets/images/Bcare-logo.svg';
    var style = document.createElement('style');
    style.textContent = '#ref-chat{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);font-family:inherit}' +
      '#ref-chat[hidden]{display:none}' +
      '#ref-chat .rc-win{width:448px;max-width:calc(100vw - 24px);height:500px;max-height:calc(100vh - 24px);background:#fff;border-radius:6px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
      '#ref-chat .rc-head{background:#146394;color:#fff;display:flex;align-items:center;gap:12px;padding:14px 20px;height:72px;flex:none}' +
      '#ref-chat .rc-av{width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;overflow:hidden}' +
      '#ref-chat .rc-av img{width:30px;height:30px;object-fit:contain}' +
      '#ref-chat .rc-t{flex:1;min-width:0;line-height:1.3}#ref-chat .rc-t b{display:block;font-size:14px}#ref-chat .rc-t span{font-size:12px;opacity:.9}' +
      '#ref-chat .rc-x{background:none;border:0;color:#fff;font-size:26px;line-height:1;cursor:pointer;padding:4px 8px}' +
      '#ref-chat .rc-body{flex:1;background:#f8f9fb;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:#6b7280;padding:16px}' +
      '#ref-chat .rc-body img{width:68px;margin-bottom:20px}#ref-chat .rc-body p{margin:0;font-size:16px}#ref-chat .rc-body p+p{font-size:13px}' +
      '#ref-chat .rc-msgs{width:100%;display:flex;flex-direction:column;gap:6px;max-height:55%;overflow:auto;margin-top:8px}' +
      '#ref-chat .rc-m{max-width:80%;padding:8px 12px;border-radius:14px;font-size:14px;text-align:start;word-break:break-word}' +
      '#ref-chat .rc-m.me{align-self:flex-start;background:#146394;color:#fff}#ref-chat .rc-m.them{align-self:flex-end;background:#e8edf2;color:#1f2937}' +
      '#ref-chat .rc-note{font-size:12px;color:#146394;margin-top:12px}' +
      '#ref-chat .rc-foot{display:flex;align-items:center;gap:10px;padding:16px;border-top:1px solid #e5e7eb;background:#fff;flex:none}' +
      '#ref-chat .rc-foot input{flex:1;min-width:0;height:42px;border:1px solid #d9dde3;border-radius:21px;padding:0 16px;font-size:14px;outline:none;background:#fff}' +
      '#ref-chat .rc-foot input:focus{border-color:#146394}' +
      '#ref-chat{--rc-send-active:#146394;--rc-send-inactive:#9fb4c9}' +
      '#ref-chat .rc-send{width:36px;height:36px;border-radius:50%;border:0;background:var(--rc-send-active);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}' +
      '#ref-chat .rc-send:disabled{background:var(--rc-send-inactive);cursor:default}' +
      '#ref-chat .rc-send svg{width:18px;height:18px}' + (ar ? '#ref-chat .rc-send svg{transform:scaleX(-1)}' : '');
    document.head.appendChild(style);
    chatBox = document.createElement('div');
    chatBox.id = 'ref-chat';
    chatBox.setAttribute('dir', ar ? 'rtl' : 'ltr');
    chatBox.innerHTML = '<div class="rc-win" role="dialog" aria-modal="true" aria-label="' + T.name + '">' +
      '<div class="rc-head"><div class="rc-av"><img alt="" src="' + logo + '"></div>' +
      '<div class="rc-t"><b>' + T.name + '</b><span>' + T.sub + '</span></div>' +
      '<button type="button" class="rc-x" aria-label="' + T.close + '">&times;</button></div>' +
      '<div class="rc-body"><img alt="" src="' + logo + '"><p>' + T.hi + '</p><p>' + T.how + '</p><div class="rc-msgs"></div><div class="rc-note" role="status" hidden>' + T.off + '</div></div>' +
      '<div class="rc-foot"><input type="text" autocomplete="off" placeholder="' + T.ph + '">' +
      '<button type="button" class="rc-send" disabled aria-label="' + T.send + '"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button></div></div>';
    document.body.appendChild(chatBox);
    var input = chatBox.querySelector('input'), note = chatBox.querySelector('.rc-note'), msgs = chatBox.querySelector('.rc-msgs');
    flushIncoming();
    var pending = {}, busy = false;
    var sendButton = chatBox.querySelector('.rc-send');
    function updateSendReady() {
      sendButton.disabled = busy || !input.value.trim();
    }
    function bubble(text, who) {
      var d = document.createElement('div'); d.className = 'rc-m ' + who; d.textContent = text;
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
    }
    function close() { chatBox.hidden = true; input.value = ''; note.hidden = true; updateSendReady(); }
    // The page that hosts this copy owns the Socket.IO connection; nothing is queued or stored here.
    function send() {
      var text = input.value.trim();
      if (!text || busy || window.parent === window) return;
      var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
      busy = true; note.hidden = true; input.value = '';
      updateSendReady();
      pending[id] = { el: bubble(text, 'me'), text: text };
      window.parent.postMessage({ type: 'ref-chat-send', id: id, text: text }, location.origin);
    }
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data) return;
      var d = e.data;
      if (d.type === 'ref-chat-result' && pending[d.id]) {
        var p = pending[d.id]; delete pending[d.id]; busy = false;
        if (!d.ok) {
          p.el.remove(); input.value = p.text;
          note.textContent = d.reason === 'offline' ? T.off : T.fail; note.hidden = false;
        }
        updateSendReady();
      } else if (d.type === 'ref-chat-incoming' && typeof d.text === 'string') {
        bubble(d.text, 'them');
      }
    });
    chatBox.querySelector('.rc-x').addEventListener('click', close);
    sendButton.addEventListener('click', send);
    input.addEventListener('input', updateSendReady);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    chatBox.addEventListener('click', function (e) { if (e.target === chatBox) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && chatBox && !chatBox.hidden) close(); });
    input.focus();
  }
  function text(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var nav = t.closest('[data-ref-nav]');
    if (nav) { e.preventDefault(); go(nav.getAttribute('data-ref-nav')); return; }
    if (t.closest('img[src*="top.svg"]')) { e.preventDefault(); scrollToTop(); return; }
    if (t.closest('bcare-bubbles .bubble-frame')) { e.preventDefault(); openChat(); return; }
    if (t.closest('bcare-landing-logo')) { e.preventDefault(); go('/'); return; }
    var el = t.closest('a, button');
    if (!el) return;
    var s = text(el);
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i][0].test(s)) {
        e.preventDefault();
        var to = tabs[i][1];
        if (to === '@lang') return go(currentRoute(), lang === 'ar' ? 'en' : 'ar');
        if (to === '@ind') return go(/^(landing-)?medical-/.test(file) ? '/' : currentRoute());
        if (to === '@quote') return go(quoteRoute());
        return go(to);
      }
    }
    if (el.closest('[data-ref-dead]')) e.preventDefault();
    if (el.matches('button[type=submit]') || el.closest('form')) {
      if (el.matches('[type=submit]')) e.preventDefault();
    }
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  // Restore captured form readiness without sending or persisting its data.
  if (/^(motor|helpers|mm|travel|medical)-/.test(file)) {
    var idStyle = document.createElement('style');
    idStyle.textContent = '.ref-id-invalid{border-color:#c82333 !important;outline:1px solid #c82333;outline-offset:-1px}.ref-id-error{background:#fde8e8;color:#c82333;font-size:12px;line-height:1.6;padding:4px 8px;margin:4px 0 0;text-align:start}';
    document.head.appendChild(idStyle);
    document.querySelectorAll('form[data-ref-form]').forEach(function (form) {
      var fields = Array.prototype.slice.call(form.querySelectorAll('input[type=number], input[type=text], input:not([type])'));
      var consent = form.querySelector('input[type=checkbox]');
      var button = form.querySelector('button.bg-newYellow') || form.querySelector('button[type=submit]');
      if (!button || !consent || !fields.length) return;
      // National Id / Iqama / Sponsor ID: 10 digits starting with 1 or 2 plus the check digit.
      // Company CR / Unified Number: 10 digits, any starting digit, no check digit published.
      var ID_RE = /هوية|iqama|national id/i;
      var CR_RE = /سجل|موحد|unified|company cr/i;
      var identityFields = fields.filter(function (field) {
        return ID_RE.test(field.placeholder || '') || CR_RE.test(field.placeholder || '');
      });
      // Ministry of Interior check digit: double positions 1,3,5,7,9, add the rest, total divisible by 10.
      function checkDigitOk(value) {
        var sum = 0;
        for (var i = 0; i < value.length; i++) {
          var d = Number(value[i]);
          if (i % 2 === 0) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
          sum += d;
        }
        return sum % 10 === 0;
      }
      function isCrField(field) {
        return CR_RE.test(field.placeholder || '');
      }
      function validField(field) {
        var value = field.value.trim();
        // Company CR / Unified numbers publish no check digit, so any 10 digits are accepted there.
        if (isCrField(field)) return /^\d{10}$/.test(value);
        return /^[12]\d{9}$/.test(value) && checkDigitOk(value);
      }
      function validIdentity() {
        return identityFields.every(validField);
      }
      function idErrorText(field) {
        var ph = (field.placeholder || '').trim();
        if (lang === 'en') return (ph || 'National Id / Iqama') + ' is incorrect';
        return (ph || 'رقم الهوية / الإقامة') + (/سجل/.test(ph) ? ' غير صحيح' : ' غير صحيحة');
      }
      function caretRange(field) {
        try {
          var start = field.selectionStart, end = field.selectionEnd;
          if (typeof start === 'number' && typeof end === 'number') return [start, end];
        } catch (err) { /* number inputs reject selection APIs */ }
        return [field.value.length, field.value.length];
      }
      function showIdError(field, final) {
        var v = field.value.trim();
        // The error appears only once the last (10th) digit is entered, never earlier.
        setIdLook(field, v.length >= 10 && !validField(field));
      }
      // Inline !important so the captured page's own focus/border rules cannot hide it.
      function setIdLook(field, invalid) {
        if (invalid) {
          field.style.setProperty('border-color', '#c82333', 'important');
          field.style.setProperty('outline', '1px solid #c82333', 'important');
          field.style.setProperty('outline-offset', '-1px', 'important');
        } else {
          field.style.removeProperty('border-color');
          field.style.removeProperty('outline');
          field.style.removeProperty('outline-offset');
        }
        field.classList.toggle('ref-id-invalid', invalid);
        if (field.__refIdError) field.__refIdError.hidden = !invalid;
      }
      // Digits only, max 10, first digit 1 or 2 — blocked while typing or pasting.
      identityFields.forEach(function (field) {
        field.setAttribute('maxlength', '10');
        field.setAttribute('inputmode', 'numeric');
        var box = document.createElement('p');
        box.className = 'ref-id-error';
        box.setAttribute('role', 'alert');
        box.textContent = idErrorText(field);
        box.hidden = true;
        field.parentNode.insertBefore(box, field.nextSibling);
        field.__refIdError = box;
        field.addEventListener('keydown', function (e) {
          if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
          if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
          var range = caretRange(field);
          var next = field.value.slice(0, range[0]) + e.key + field.value.slice(range[1]);
          if (next.length > 10 || (!isCrField(field) && !/^[12]/.test(next))) e.preventDefault();
        });
        field.addEventListener('paste', function (e) {
          e.preventDefault();
          var data = e.clipboardData ? e.clipboardData.getData('text') : '';
          var digits = (data || '').replace(/\D/g, '').slice(0, 10);
          if (!digits || (!isCrField(field) && !/^[12]\d{0,9}$/.test(digits))) {
            setIdLook(field, digits.length >= 10);
            return;
          }
          var range = caretRange(field);
          field.value = field.value.slice(0, range[0]) + digits + field.value.slice(range[1]);
          showIdError(field);
          field.dispatchEvent(new Event('input', { bubbles: true }));
        });
        field.addEventListener('input', function () {
          var digits = field.value.replace(/\D/g, '').slice(0, 10);
          if (digits && !isCrField(field) && !/^[12]/.test(digits)) {
            // A number that cannot be valid is not entered at all, but the reason stays visible.
            field.value = '';
            setIdLook(field, digits.length >= 10);
            return;
          }
          if (field.value !== digits) field.value = digits;
          showIdError(field);
        });
        field.addEventListener('blur', function () { showIdError(field); });
      });
      var status = document.createElement('p');
      status.setAttribute('role', 'status');
      status.className = 'w-full text-center text-sm text-light-blue';
      status.hidden = true;
      form.appendChild(status);
      function updateReady() {
        // The original phone form replaces the checkbox with consent text above its button.
        var consentControl = consent.closest('mat-checkbox');
        var implicitConsent = consentControl && getComputedStyle(consentControl).display === 'none';
        button.disabled = !(consent.checked || implicitConsent) || !validIdentity() || !fields.every(function (field) {
          return field.value.trim() !== '' && field.validity.valid;
        });
        button.setAttribute('aria-disabled', String(button.disabled));
        status.hidden = true;
      }
      form.addEventListener('input', updateReady);
      form.addEventListener('change', updateReady);
      button.addEventListener('click', function (e) {
        e.preventDefault();
        if (button.disabled) return;
        status.textContent = lang === 'ar'
          ? 'لم يتم إرسال بياناتك؛ جلب العروض والتحقق من الرمز غير متاحين حتى ربط الخادم.'
          : 'Your details were not sent. Quotations and code verification are unavailable until the server is connected.';
        status.hidden = false;
      });
      updateReady();
    });
  }
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.init-custom-tab-item');
    if (!tab) return;
    var all = Array.prototype.slice.call(tab.parentElement.children);
    var idx = all.indexOf(tab);
    all.forEach(function (item, j) {
      item.classList.toggle('bg-light-blue', j === idx);
      item.classList.toggle('text-white', j === idx);
      item.classList.toggle('text-gray-text', j !== idx);
      item.classList.toggle('pointer-events-none', j === idx);
    });
    var radio = document.querySelectorAll('input[name="mat-radio-group-0"]')[idx];
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  // Captured Angular radio/checkbox controls retain their appearance but run locally.
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (input.matches('mat-radio-button input[type=radio]')) {
      document.querySelectorAll('mat-radio-button input[type=radio]').forEach(function (other) {
        if (other.name !== input.name) return;
        other.closest('mat-radio-button').classList.toggle('mat-mdc-radio-checked', other.checked);
      });
      if (/^motor-/.test(file) && input.name === 'mat-radio-group-1') {
        var field = document.querySelector('input[placeholder="الرقم التسلسلي"], input[placeholder="رقم البطاقة الجمركية"], input[placeholder="Sequence Number"], input[placeholder="Custom Card Number"]');
        if (field) field.placeholder = lang === 'ar' ? (input.value === '2' ? 'رقم البطاقة الجمركية' : 'الرقم التسلسلي') : (input.value === '2' ? 'Custom Card Number' : 'Sequence Number');
      }
    }
    if (input.matches('mat-checkbox input[type=checkbox]')) {
      input.closest('mat-checkbox').classList.toggle('mat-mdc-checkbox-checked', input.checked);
      var box = input.closest('.mdc-checkbox');
      if (box) box.classList.toggle('mdc-checkbox--selected', input.checked);
    }
  });
  function currentRoute() {
    var map = { 'landing-mm': '/medical-malpractice', 'landing-travel': '/travel-insurance',
      'landing-helpers': '/domestic-workers', 'landing-medical': '/medical-insurance',
      mm: '/medical-malpractice-request', travel: '/travel-insurance-request',
      helpers: '/domestic-workers-request', medical: '/medical-insurance-request', motor: '/motor-insurance', home: '/' };
    return map[m ? m[1] : 'home'] || '/';
  }
  // the landing page's offer button opens that product's quote form
  function quoteRoute() {
    var r = currentRoute();
    if (r === '/') return '/motor-insurance';
    return /-request$/.test(r) ? r : r + '-request';
  }
  // insurer logo slider: lay out cells at the original's size and auto-slide like the original
  document.querySelectorAll('carousel .carousel-cells').forEach(function (track) {
    var cells = track.querySelectorAll('.carousel-cell');
    var step = 157.8, n = cells.length, pos = 1;
    if (!n) return;
    cells.forEach(function (c, i) {
      c.style.width = '147.8px'; c.style.transform = 'translateX(' + i * step + 'px)';
      c.querySelectorAll('img').forEach(function (im) { im.removeAttribute('width'); im.removeAttribute('height'); });
    });
    track.style.width = n * step + 'px';
    track.style.transition = 'transform 200ms ease-out';
    var visible = function () { return Math.max(1, Math.floor(track.parentElement.clientWidth / step)); };
    track.style.transform = 'translateX(-' + step + 'px)';
    setInterval(function () {
      pos = pos + 1 > n - visible() ? 0 : pos + 1;
      track.style.transform = 'translateX(-' + pos * step + 'px)';
    }, 3000);
  });
  // promo banner: rotate the slides like the original, with clickable dots
  document.querySelectorAll('div[dir="ltr"].transition-transform').forEach(function (track) {
    var slides = track.querySelectorAll(':scope > div');
    if (slides.length < 2) return;
    if (!track.querySelector('img[src*="Banner"], img[src*="predict"], img[src*="roshn"], img[src*="supercare"]')) return;
    var scope = track.parentElement && track.parentElement.parentElement ? track.parentElement.parentElement : track.parentElement;
    var dots = scope ? scope.querySelectorAll('button[aria-label^="Slide"]') : [];
    var idx = 0, n = slides.length;
    function show(k) {
      idx = ((k % n) + n) % n;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      dots.forEach(function (d, j) {
        var on = j === idx;
        d.classList.toggle('bg-[#146394]', on);
        d.classList.toggle('border-[#0C5D86]', on);
        d.classList.toggle('bg-white', !on);
        d.classList.toggle('border-[#707070]', !on);
      });
    }
    dots.forEach(function (d, j) { d.addEventListener('click', function () { show(j); }); });
    setInterval(function () { show(idx + 1); }, 4000);
  });
  // FAQ accordions: answers are in the copy, collapsed with max-height
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#faq-section button');
    if (!btn) return;
    var panel = btn.nextElementSibling;
    if (!panel || panel.style.maxHeight === undefined) return;
    var open = panel.style.maxHeight && panel.style.maxHeight !== '0px';
    panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
    var icon = btn.querySelector('span:last-child'); if (icon) icon.style.transform = open ? '' : 'rotate(180deg)';
  });
  // insurance start date: default to tomorrow like the original, pick with the browser calendar
  function fmt(d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  document.querySelectorAll('input.mat-datepicker-input').forEach(function (inp) {
    if (!inp.value) inp.value = fmt(tomorrow);
    var field = inp.closest('mat-form-field') || inp.parentElement;
    var picker = document.createElement('input');
    picker.type = 'date'; picker.tabIndex = -1;
    picker.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;';
    picker.min = new Date().toISOString().slice(0, 10);
    field.style.position = field.style.position || 'relative';
    field.appendChild(picker);
    picker.addEventListener('change', function () {
      if (!picker.value) return; var p = picker.value.split('-'); inp.value = p[2] + '/' + p[1] + '/' + p[0];
    });
    field.addEventListener('click', function () { try { picker.showPicker(); } catch (e) { picker.focus(); } });
  });
  // captcha refresh: redraw four coloured digits locally
  function drawCaptcha(img) {
    var c = document.createElement('canvas'); c.width = 100; c.height = 50;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 100, 50);
    var colors = ['#8b1a1a', '#1a3a8b', '#5a1a8b', '#c26a00', '#000'];
    for (var i = 0; i < 4; i++) {
      x.save(); x.translate(10 + i * 22, 34); x.rotate((Math.random() - 0.5) * 0.4);
      x.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      x.font = (i % 2 ? 'italic ' : 'bold ') + '28px serif'; x.fillText(String(Math.floor(Math.random() * 10)), 0, 0); x.restore();
    }
    img.src = c.toDataURL();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button, mat-icon, img');
    if (!b) return;
    var s = text(b) + ' ' + (b.getAttribute('alt') || '') + ' ' + (b.className || '');
    if (/refresh|autorenew|cached|sync|reload/i.test(s)) {
      var root = b.closest('mat-form-field, div');
      var img = null; var n = b;
      for (var k = 0; k < 5 && n && !img; k++) { img = n.querySelector && n.querySelector('img[src^="data:image"]'); n = n.parentElement; }
      if (img) { e.preventDefault(); drawCaptcha(img); }
    }
  });
  // exclusive offers: fill the carousel with the original's offer cards (loaded from its API there)
  (function () {
    var section = document.getElementById('exclusive-offers-discounts');
    if (!section) return;
    var isAr = /[؀-ۿ]/.test((section.querySelector('h2') || section).textContent);
    var CATS = [
      [{ img: '/__l5e/assets-v1/aefd453a-ec10-4dd6-bd60-564ace3d56f2/speero-original.png', ar: 'سبيرو', en: 'Speero', d: 10 },
       { img: '/__l5e/assets-v1/7daff4e1-b32e-46a6-95e0-6a6126225f96/klleoo-original.png', ar: 'كليو', en: 'Klleoo', d: 15 },
       { img: '/__l5e/assets-v1/46156563-738f-46f6-ade7-128b5f80c987/altobha-original.png', ar: '', en: 'Altobha', d: null }],
      [{ img: 'perfectWight.webp', ar: 'الوزن المثالي', en: 'Perfect Weight', d: 50 },
       { img: 'Physiotherabia.webp', ar: 'فيزيوثيرابيا', en: 'Physiotherabia', d: 20 },
       { img: 'Group_6444.svg', ar: 'نوفميد', en: 'Novimed', d: 15 }],
      [{ img: 'none.svg', ar: 'نون', en: 'Noon', d: 15 },
       { img: 'sivvi.svg', ar: 'سيفي', en: 'Sivvi', d: 10 },
       { img: 'swater.webp', ar: 'سويتر', en: 'Sweater', d: 20 }],
      [{ img: 'RoshRayhaan.webp', ar: 'روش ريحان', en: 'Rosh Rayhaan', d: 15 }],
      [{ img: '/__l5e/assets-v1/a281d5f0-1450-4a57-b4ab-0440e05f2fc1/eulica.png', ar: 'يوليكا كافيه', en: 'Eulica Cafe', d: 15 },
       { img: '/__l5e/assets-v1/3bacb02d-5506-45ef-bcb3-f2ee5ccf0efc/toyou.png', ar: 'تو يو', en: 'ToYou', d: null, offerAr: 'توصيل بـ 5 ر...', offerEn: 'Delivery for SAR 5…' },
       { img: '/__l5e/assets-v1/757c6f09-fd47-414c-b6c9-e5d33fa17e4c/dailymeal.png', ar: '', en: 'Dailymealz', d: null }]
    ];
    function card(o, mobile) {
      var name = isAr ? o.ar : o.en;
      var disc = o.d == null ? (isAr ? o.offerAr : o.offerEn) || '' : (isAr ? o.d + '% خصم' : o.d + '% Discount');
      var src = o.img.charAt(0) === '/' ? o.img : '/ref/assets/wareef/' + o.img;
      return '<div class="' + (mobile ? 'p-3 w-full flex-none snap-start' : 'flex-none p-4 w-[375px] max-w-full') + ' h-[235px] border-[#D2D2D2] bg-white border rounded-[10px] border-solid flex flex-col justify-between transition-all duration-300 relative overflow-hidden">' +
        '<div class="w-full max-w-[310px] mx-auto flex-1 flex items-center justify-center relative z-10">' +
        '<div class="relative z-10 w-[90px] h-[90px] bg-white border-[1px] border-solid border-[#D2D2D2] rounded-[10px] shadow-[0_0_6px_#0000001A] p-3 flex items-center justify-center shrink-0">' +
        '<img loading="eager" class="w-full h-full rounded-[10px] object-contain" src="' + src + '" alt="' + name + '"></div>' +
        '<div class="relative z-10 flex-1 min-w-0 ps-3 flex flex-col justify-center text-start">' +
        '<h4 class="font-bold leading-[22px] pb-[10px] pt-[20px] tracking-normal text-[#146394] truncate ' + (mobile ? 'text-[24px]' : 'text-[36px]') + '">' + disc + '</h4>' +
        '<p class="font-normal text-[19px] leading-[31px] text-[#146394]">' + name + '</p></div></div>' +
        '<img src="/ref/assets/bcare.com.sa/assets/images/newDesign/dots-1-1.svg" alt="" class="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-20 z-0">' +
        '<div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_#FFFFFF00_0%,_#FFFFFF_100%)] opacity-100 z-0" style="transform:matrix(0,-1,1,0,0,0)"></div></div>';
    }
    var cats = Array.prototype.slice.call(section.querySelectorAll('bcare-category-item'));
    function selectCat(k) {
      cats.forEach(function (c, j) {
        var box = c.querySelector('div'), span = c.querySelector('span'), icon = c.querySelector('img');
        var on = j === k;
        if (!box || !span) return;
        box.classList.toggle('bg-[#146394]', on); box.classList.toggle('text-white', on);
        box.classList.toggle('bg-white', !on);
        box.classList.toggle('border', !on); box.classList.toggle('border-solid', !on); box.classList.toggle('border-[#D2D2D2]', !on);
        span.classList.toggle('font-bold', on); span.classList.toggle('text-white', on);
        span.classList.toggle('font-normal', !on); span.classList.toggle('text-[#146394]', !on);
        if (icon) icon.classList.toggle('selected-icon-color', on);
      });
    }
    // desktop: paged track with arrows and dots
    var track = section.querySelector('div.flex.flex-nowrap.gap-3.overflow-hidden');
    if (track) {
      var wrap = track.parentElement;
      // The reference overlays its arrows on the clipped outer cards.
      var arrowButtons = wrap.querySelectorAll(':scope > button');
      arrowButtons.forEach(function (button, i) {
        button.style.position = 'absolute';
        button.style[i === 0 ? 'right' : 'left'] = '20px';
        button.style.width = '40px'; button.style.height = '40px';
      });
      wrap.style.padding = '0';
      track.style.paddingInline = '76px';
      var prev = wrap.querySelector('button'), next = wrap.querySelectorAll('button')[1];
      var dotsWrap = section.querySelector('bcare-carousel-pagination > div');
      var page = 0, offers = [];
      function render() {
        track.innerHTML = offers.map(function (o) { return card(o, false); }).join('');
        page = 0; update();
      }
      function perPage() { return Math.max(1, Math.floor(track.clientWidth / 387)); }
      function pages() { return Math.max(1, Math.ceil(offers.length / perPage())); }
      function update() {
        var rtl = getComputedStyle(wrap).direction === 'rtl';
        var shift = page * perPage() * 387 * (rtl ? 1 : -1);
        track.querySelectorAll(':scope > div').forEach(function (c) {
          c.style.transition = 'transform .3s'; c.style.transform = 'translateX(' + shift + 'px)';
        });
        if (prev) prev.disabled = page === 0;
        if (next) next.disabled = page >= pages() - 1 || !offers.length;
        if (prev) prev.disabled = prev.disabled || !offers.length;
        if (dotsWrap) {
          dotsWrap.innerHTML = '';
          for (var j = 0; j < (offers.length ? pages() : 0); j++) {
            var d = document.createElement('button');
            d.setAttribute('aria-label', (isAr ? 'صفحة العروض ' : 'Offers page ') + (j + 1));
            d.className = 'w-2 h-2 rounded-full transition-all duration-200 border ' + (j === page ? 'bg-[#146394] border-[#0C5D86]' : 'bg-white border-[#707070]');
            (function (j) { d.addEventListener('click', function () { page = j; update(); }); })(j);
            dotsWrap.appendChild(d);
          }
        }
      }
      if (prev) prev.addEventListener('click', function () { if (page > 0) { page--; update(); } });
      if (next) next.addEventListener('click', function () { if (page < pages() - 1) { page++; update(); } });
      cats.forEach(function (c, j) { c.addEventListener('click', function () { selectCat(j); offers = CATS[j] || []; render(); }); });
      offers = CATS[0]; render();
      window.addEventListener('resize', update);
      return;
    }
    // phone: native horizontal scroll with counter and dots
    var mtrack = section.querySelector('div.overflow-x-auto.snap-x');
    if (mtrack) {
      var counter = section.querySelector('div.text-center.text-\\[\\#9E9E9E\\]');
      var mdots = section.querySelector('bcare-carousel-pagination > div');
      function mrender(offers) {
        mtrack.innerHTML = offers.map(function (o) { return card(o, true); }).join('');
        if (mdots) {
          mdots.innerHTML = '';
          offers.forEach(function (_, j) {
            var d = document.createElement('button');
            d.className = 'w-2 h-2 rounded-full transition-all duration-200 border ' + (j === 0 ? 'bg-[#146394] border-[#0C5D86]' : 'bg-white border-[#707070]');
            d.addEventListener('click', function () { mtrack.children[j] && mtrack.children[j].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }); });
            mdots.appendChild(d);
          });
        }
        mupdate();
      }
      function mupdate() {
        var n = mtrack.children.length;
        var i = n ? Math.min(n - 1, Math.round(Math.abs(mtrack.scrollLeft) / (mtrack.children[0].offsetWidth + 12))) : 0;
        if (counter) counter.textContent = (n ? i + 1 : 0) + '/' + n;
        if (mdots) Array.prototype.forEach.call(mdots.children, function (d, j) {
          d.className = 'w-2 h-2 rounded-full transition-all duration-200 border ' + (j === i ? 'bg-[#146394] border-[#0C5D86]' : 'bg-white border-[#707070]');
        });
      }
      mtrack.addEventListener('scroll', function () { requestAnimationFrame(mupdate); });
      cats.forEach(function (c, j) { c.addEventListener('click', function () { selectCat(j); mrender(CATS[j] || []); }); });
      mrender(CATS[0]);
    }
  })();
})();

(function () {
  var s = document.createElement('style');
  s.textContent = 'bcare-landing-product-nav nav div.pointer-events-none{display:none !important}' +
    '#exclusive-offers-discounts .pointer-events-none.absolute{display:none !important}';
  document.head.appendChild(s);
})();

(function () {
  var s = document.createElement('style');
  s.textContent = 'bcare-landing-product-nav nav a.carousel-item{position:relative !important;z-index:20 !important}' +
    'bcare-landing-product-nav nav div.pointer-events-none{display:none !important}' +
    'bcare-landing-product-nav nav .header-carousel{overflow:visible !important}';
  document.head.appendChild(s);
})();

(function () {
  function kill() {
    var nav = document.querySelector('bcare-landing-product-nav nav');
    if (!nav) return;
    var ds = nav.querySelectorAll('div');
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i], c = d.className || '';
      if (c.indexOf('pointer-events-none') > -1 && c.indexOf('absolute') > -1) {
        d.style.setProperty('display', 'none', 'important');
      }
    }
  }
  kill();
  setTimeout(kill, 200);
  setTimeout(kill, 800);
  setTimeout(kill, 2000);
})();

(function () {
  var s = document.createElement('style');
  s.textContent = 'bcare-landing-product-nav nav div[class*="linear-gradient"]{display:none !important}' +
    '#exclusive-offers-discounts div[class*="linear-gradient"]{display:none !important}';
  document.head.appendChild(s);
  function kill() {
    var els = document.querySelectorAll('bcare-landing-product-nav nav div, #exclusive-offers-discounts div');
    for (var i = 0; i < els.length; i++) {
      var c = els[i].getAttribute('class') || '';
      if (c.indexOf('linear-gradient') > -1) els[i].style.setProperty('display', 'none', 'important');
    }
  }
  kill();
  setTimeout(kill, 300);
  setTimeout(kill, 1500);
})();

(function () {
  var s = document.createElement('style');
  s.textContent = 'bcare-landing-product-nav a.carousel-item{flex:0 0 auto !important;min-width:0 !important}';
  document.head.appendChild(s);
})();;(function(){
  if(document.getElementById('patch-v18'))return;
  var s=document.createElement('style');
  s.id='patch-v18';
  s.textContent=`
html,body{overflow-x:hidden!important;max-width:100%!important}
.bcare-landing-product-nav{max-width:100%!important;width:100%!important;overflow:hidden!important;box-sizing:border-box!important;padding:0 4px!important;position:relative!important;z-index:50!important;background:#fff!important}
.bcare-landing-product-nav .carousel-item{flex:1 1 0!important;min-width:0!important;width:auto!important;max-width:none!important;font-size:11px!important;line-height:1.2!important;padding:4px 2px!important;transform:none!important}
.bcare-landing-product-nav .carousel-item img{max-width:22px!important;height:auto!important;margin:0 auto 2px!important}
.bcare-landing-product-nav .carousel-item span,.bcare-landing-product-nav .carousel-item div{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}
  `;
  document.head.appendChild(s);
})();
;(function(){
  if(document.getElementById('patch-v19'))return;
  var s=document.createElement('style');
  s.id='patch-v19';
  s.textContent=`
html,body{overflow-x:hidden!important}
.bcare-landing-product-nav,.bcare-landing-product-nav nav,.carousel-wrapper{max-width:100%!important;width:100%!important}
.header-carousel{max-width:100%!important;width:100%!important;overflow-x:hidden!important;padding-left:4px!important;padding-right:4px!important;box-sizing:border-box!important}
.header-carousel>div{gap:2px!important;width:100%!important;box-sizing:border-box!important}
.header-carousel .carousel-item{flex:1 1 0!important;min-width:0!important;width:auto!important;max-width:none!important;padding:4px 1px!important;gap:2px!important;justify-content:center!important}
.header-carousel .carousel-item span{font-size:10px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;display:block!important;min-width:0!important}
.header-carousel .carousel-item svg,.header-carousel .carousel-item img{width:18px!important;height:18px!important;flex-shrink:0!important}
  `;
  document.head.appendChild(s);
})();
;(function(){
  if(document.getElementById('patch-v20'))return;
  var s=document.createElement('style');
  s.id='patch-v20';
  s.textContent=`
html{overflow-x:visible!important;max-width:none!important}
body{overflow-x:hidden!important;max-width:100vw!important}
.bcare-landing-product-nav{max-width:100vw!important;width:100%!important;overflow:hidden!important;padding:0!important}
.bcare-landing-product-nav nav,.carousel-wrapper{max-width:100%!important;width:100%!important}
.header-carousel{max-width:100%!important;width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;padding:0 4px!important;box-sizing:border-box!important}
.header-carousel>div{width:auto!important;gap:4px!important;padding-right:8px!important}
.header-carousel .carousel-item{flex:0 0 auto!important;min-width:0!important;width:auto!important;max-width:none!important;padding:4px 8px!important;gap:4px!important}
.header-carousel .carousel-item span{font-size:12px!important;white-space:nowrap!important}
.header-carousel .carousel-item svg,.header-carousel .carousel-item img{width:20px!important;height:20px!important;flex-shrink:0!important}
.header-carousel::-webkit-scrollbar{display:none!important}
  `;
  document.head.appendChild(s);
})();
;(function(){
  if(document.getElementById("dbg21"))return;
  function run(){
    var vw=window.innerWidth,de=document.documentElement,b=document.body;
    var out=["vw="+vw,"docSW="+de.scrollWidth,"bodySW="+b.scrollWidth,"bodyCW="+b.clientWidth];
    var bad=[],all=document.querySelectorAll("body *"),i,e,r,cn;
    for(i=0;i<all.length;i++){
      e=all[i];
      if(e.id==="dbg21")continue;
      r=e.getBoundingClientRect();
      if(r.width>vw+2||r.right>vw+2){
        cn=(e.className&&e.className.toString)?e.className.toString().slice(0,70):"";
        bad.push(e.tagName.toLowerCase()+"."+cn+" w="+Math.round(r.width)+" r="+Math.round(r.right)+" x="+Math.round(r.left));
        if(bad.length>=6)break;
      }
    }
    var d=document.createElement("div");
    d.id="dbg21";
    d.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;color:#0f0;font:10px/1.35 monospace;padding:4px;max-height:45%;overflow:auto;direction:ltr;text-align:left";
    d.textContent=out.join(" | ")+"\n"+(bad.length?bad.join("\n"):"no overflow");
    document.body.appendChild(d);
  }
  if(document.readyState==="complete")setTimeout(run,700);
  else window.addEventListener("load",function(){setTimeout(run,700)});
})();
;(function(){
  if(document.getElementById("patch-v22"))return;
  var s=document.createElement("style");
  s.id="patch-v22";
  s.textContent=`
.main-container{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
.main-container>*{min-width:0!important;max-width:100%!important}
.main-container img,.main-container video{max-width:100%!important;height:auto!important}
.content,.responsive-container,.container-landing{min-width:0!important;max-width:100%!important}
.bcare-presentation-landing-page-header{width:100%!important;max-width:100%!important;min-width:0!important}
.bcare-landing-product-nav{position:relative!important;z-index:30!important;background:#F7F7F7!important}
  `;
  document.head.appendChild(s);
})();
