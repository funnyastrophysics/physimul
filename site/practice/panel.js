// 시뮬레이션 아래에 '연결된 기출문제' 칸을 붙입니다.
// 문제 자료(practice/data/<이름>.json)는 수업 코드로 암호화되어 있고, 코드를 입력해야 풀립니다.
(function () {
  var m = location.pathname.match(/\/sim\/([^/]+)\//);
  if (!m || location.protocol.indexOf('http') !== 0 || !window.crypto || !crypto.subtle || !window.fetch) return;
  var sim = m[1], base = '../../practice/data/', KEY = 'pq-code';
  var items = null, idx = 0, picked = 0, box;

  var css = '.pq{background:#fff;border:1px solid #d9dde4;border-radius:12px;padding:14px;margin:12px 0;font-size:15px;line-height:1.55;color:#1d2330}' +
    '.pq h2{font-size:17px;margin:0 0 4px}.pq .pq-sub{color:#5b6475;font-size:13px;margin:0 0 10px}' +
    '.pq button,.pq input{font:inherit;font-size:15px;border-radius:8px;border:1px solid #d9dde4;background:#fff;color:#1d2330;padding:10px 14px;touch-action:manipulation}' +
    '.pq button{cursor:pointer}.pq button.pq-main{background:#2f6fdf;border-color:#2f6fdf;color:#fff;font-weight:700}' +
    '.pq .pq-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}.pq input{flex:1 1 140px;min-width:0}' +
    '.pq .pq-src{font-size:13px;color:#5b6475;margin:0 0 8px}.pq .pq-q{white-space:pre-wrap;margin:0 0 8px}' +
    '.pq img{display:block;max-width:100%;height:auto;border:1px solid #eef0f4;border-radius:8px;margin:0 0 8px}' +
    '.pq .pq-ch{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.pq .pq-ch.pq-txt{grid-template-columns:1fr}' +
    '.pq .pq-ch button{padding:10px 4px}.pq .pq-ch.pq-txt button{text-align:left;padding:10px 12px}' +
    '.pq .pq-ch button.on{border-color:#2f6fdf;background:#e8eefb;font-weight:700}' +
    '.pq .pq-ch button.ok{border-color:#2e9e6a;background:#e3f4ec;font-weight:700}.pq .pq-ch button.no{border-color:#d64541;background:#fbe9e8}' +
    '.pq .pq-res{font-weight:700;margin:10px 0 0}.pq .pq-exp{white-space:pre-wrap;background:#f4f6f9;border-radius:8px;padding:10px;margin:8px 0 0;font-size:14px}' +
    '.pq .pq-err{color:#d64541;font-size:14px;margin:8px 0 0}.pq .pq-copy{font-size:12px;color:#5b6475;margin:12px 0 0}' +
    '.pq a.pq-link{font-size:13px;color:#5b6475;margin-left:auto}';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function b64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function getCode() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function setCode(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }

  function decrypt(pack, code) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(code.trim()), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(pack.salt), iterations: pack.iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    }).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(pack.iv) }, key, b64(pack.data));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }

  function open(code, onFail) {
    fetch(base + sim + '.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('net'); return r.json(); }).then(function (pack) {
      return decrypt(pack, code).then(function (d) { setCode(code.trim()); items = d.items; idx = 0; show(); }, function () { setCode(''); onFail('수업 코드가 맞지 않습니다. 대문자와 소문자, 띄어쓰기를 확인하세요.'); });
    }).catch(function () { onFail('문제를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.'); });
  }

  function head(count) { box.innerHTML = ''; box.appendChild(el('h2', '', '연결된 기출문제')); box.appendChild(el('p', 'pq-sub', '이 시뮬레이션과 관련된 문제 ' + count + '개를 풀어 볼 수 있어요.')); }

  function gate(count, msg) {
    head(count);
    var row = el('div', 'pq-row'), inp = el('input'), go = el('button', 'pq-main', '문제 열기');
    inp.type = 'text'; inp.placeholder = '수업 코드'; inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', '수업 코드');
    row.appendChild(inp); row.appendChild(go); box.appendChild(row);
    var err = el('p', 'pq-err', msg || ''); box.appendChild(err);
    box.appendChild(el('p', 'pq-copy', '수업 시간에 안내받은 수업 코드를 입력하세요. 한 번 입력하면 이 기기에 기억됩니다.'));
    var run = function () { if (!inp.value.trim()) { err.textContent = '수업 코드를 입력하세요.'; return; } go.disabled = true; go.textContent = '여는 중…'; open(inp.value, function (t) { gate(count, t); }); };
    go.addEventListener('click', run); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  }

  function show() {
    var it = items[idx]; picked = 0; head(items.length);
    box.appendChild(el('p', 'pq-src', (idx + 1) + ' / ' + items.length + '   ' + (it.src || '')));
    if (it.q) box.appendChild(el('p', 'pq-q', it.q));
    if (it.img) { var im = el('img'); im.src = it.img; im.alt = '문제 ' + (idx + 1); box.appendChild(im); }
    var ch = el('div', 'pq-ch' + (it.choices ? ' pq-txt' : '')), marks = ['①', '②', '③', '④', '⑤'], btns = [];
    marks.forEach(function (mk, k) { if (it.choices && !it.choices[k]) return; var b = el('button', '', it.choices ? mk + ' ' + it.choices[k] : mk); b.type = 'button';
      b.addEventListener('click', function () { if (ch.dataset.done) return; picked = k + 1; btns.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); btns.push(b); ch.appendChild(b); });
    box.appendChild(ch);
    var res = el('p', 'pq-res'), exp = el('div', 'pq-exp'); exp.style.display = 'none';
    var row = el('div', 'pq-row'), chk = el('button', 'pq-main', '정답 확인'), prev = el('button', '', '이전'), next = el('button', '', '다음 문제'), out = el('a', 'pq-link', '수업 코드 지우기');
    out.href = '#'; prev.disabled = idx === 0; next.disabled = idx === items.length - 1;
    chk.addEventListener('click', function () {
      if (!picked) { res.textContent = '답을 먼저 고르세요.'; res.style.color = '#5b6475'; return; }
      ch.dataset.done = '1'; var ok = picked === it.answer;
      btns.forEach(function (x, k) { x.classList.remove('on'); if (k + 1 === it.answer) x.classList.add('ok'); else if (k + 1 === picked) x.classList.add('no'); });
      res.textContent = ok ? '정답입니다.' : '정답은 ' + marks[it.answer - 1] + '입니다.'; res.style.color = ok ? '#2e9e6a' : '#d64541';
      if (it.exp || it.expImg) { exp.textContent = ''; exp.appendChild(el('b', '', '해설')); if (it.exp) exp.appendChild(el('div', '', it.exp)); if (it.expImg) { var xi = el('img'); xi.src = it.expImg; xi.alt = '해설'; xi.style.margin = '8px 0 0'; exp.appendChild(xi); } exp.style.display = 'block'; } chk.disabled = true; });
    prev.addEventListener('click', function () { idx--; show(); }); next.addEventListener('click', function () { idx++; show(); });
    out.addEventListener('click', function (e) { e.preventDefault(); setCode(''); items = null; start(items0); });
    row.appendChild(chk); row.appendChild(prev); row.appendChild(next); row.appendChild(out);
    box.appendChild(res); box.appendChild(exp); box.appendChild(row);
    box.appendChild(el('p', 'pq-copy', '문제의 저작권은 출제 기관(한국교육과정평가원, 시·도 교육청)에 있습니다. 수업을 듣는 학생의 학습을 위해서만 제공하므로 다른 곳에 올리거나 나누어 주지 마세요.'));
  }

  var items0 = 0;
  function start(count) {
    items0 = count; head(count);
    var row = el('div', 'pq-row'), go = el('button', 'pq-main', '기출문제 풀어 보기'); row.appendChild(go); box.appendChild(row);
    go.addEventListener('click', function () { var c = getCode(); if (c) { go.disabled = true; go.textContent = '여는 중…'; open(c, function (t) { gate(count, t); }); } else gate(count); });
  }

  fetch(base + 'index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (list) {
    if (!list[sim]) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    box = el('section', 'pq'); (document.querySelector('.wrap') || document.body).appendChild(box); start(list[sim]);
  }).catch(function () {});
})();
