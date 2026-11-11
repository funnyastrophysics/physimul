// 기출문제 칸. 시뮬레이션 화면 아래에는 자동으로 붙고, 단원별 기출문제 화면에서는 PQ.mount로 붙입니다.
// 문제 자료(practice/data/)는 수업 코드로 암호화되어 있고, 코드를 입력해야 풀립니다.
(function () {
  if (location.protocol.indexOf('http') !== 0 || !window.crypto || !crypto.subtle || !window.fetch) return;
  var m = location.pathname.match(/\/sim\/([^/]+)\//), KEY = 'pq-code', meta = null, keyP = {}, styled = false;

  var css = '.pq{background:#fff;border:1px solid #d9dde4;border-radius:12px;padding:14px;margin:12px 0;font-size:15px;line-height:1.55;color:#1d2330}' +
    '.pq h2{font-size:17px;margin:0 0 4px}.pq .pq-sub{color:#5b6475;font-size:13px;margin:0 0 10px}' +
    '.pq button,.pq input,.pq select{font:inherit;font-size:15px;border-radius:8px;border:1px solid #d9dde4;background:#fff;color:#1d2330;padding:10px 14px;touch-action:manipulation}' +
    '.pq button{cursor:pointer}.pq button:disabled{opacity:.45}.pq button.pq-main{background:#2f6fdf;border-color:#2f6fdf;color:#fff;font-weight:700}' +
    '.pq .pq-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}.pq input{flex:1 1 140px;min-width:0}' +
    '.pq select{width:100%;max-width:100%;margin:0 0 10px}' +
    '.pq .pq-zoom{overflow-x:auto;margin:0 0 10px;-webkit-overflow-scrolling:touch}.pq img{display:block;width:100%;max-width:none;height:auto;cursor:zoom-in}.pq img.big{width:190%;cursor:zoom-out}.pq .pq-tip{font-size:12px;color:#5b6475;margin:-4px 0 10px}' +
    '.pq .pq-load{color:#5b6475;font-size:14px;margin:0 0 10px;min-height:120px}' +
    '.pq .pq-ch{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.pq .pq-ch button{padding:11px 4px;font-size:17px}' +
    '.pq .pq-ch button.on{border-color:#2f6fdf;background:#e8eefb;font-weight:700}' +
    '.pq .pq-ch button.ok{border-color:#2e9e6a;background:#e3f4ec;font-weight:700}.pq .pq-ch button.no{border-color:#d64541;background:#fbe9e8}' +
    '.pq .pq-res{font-weight:700;margin:10px 0 0}.pq .pq-exp{border-top:1px solid #d9dde4;padding:10px 0 0;margin:10px 0 0}.pq .pq-exp b{display:block;font-size:13px;color:#5b6475;margin:0 0 6px}' +
    '.pq .pq-rec{font-size:13px;color:#5b6475;margin:0 0 8px}.pq .pq-rec a{color:#5b6475;margin-left:6px}.pq .pq-err{color:#d64541;font-size:14px;margin:8px 0 0}.pq .pq-copy{font-size:12px;color:#5b6475;margin:12px 0 0}' +
    '.pq a.pq-link{font-size:13px;color:#5b6475;margin-left:auto}.pq a.pq-sim{display:block;font-size:15px;color:#2f6fdf;font-weight:700;text-decoration:none;text-align:center;border:1px solid #2f6fdf;border-radius:8px;padding:10px 12px;margin:0 0 10px;background:#f3f7ff}';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function b64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function getCode() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  // 학습 기록: 이 기기에만 저장한다. { 문항 id: [마지막에 맞았는지(1/0), 푼 횟수, 처음에 맞았는지(1/0)] }
  var LOG = 'pq-log', log = null;
  function getLog() { if (!log) { try { log = JSON.parse(localStorage.getItem(LOG) || '{}') || {}; } catch (e) { log = {}; } } return log; }
  function mark(id, ok) { var g = getLog(), r = g[id]; g[id] = r ? [ok ? 1 : 0, r[1] + 1, r[2]] : [ok ? 1 : 0, 1, ok ? 1 : 0]; try { localStorage.setItem(LOG, JSON.stringify(g)); } catch (e) {} }
  function clearLog(ids) { var g = getLog(); ids.forEach(function (id) { delete g[id]; }); try { localStorage.setItem(LOG, JSON.stringify(g)); } catch (e) {} }
  function setCode(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  function makeKey(code) {
    code = code.trim(); if (keyP[code]) return keyP[code];
    return keyP[code] = crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(meta.salt), iterations: meta.iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); });
  }

  // box: 붙일 요소, o: { base: data 폴더 경로, file: 목록 파일 이름, title, sub, simBase: 시뮬레이션 폴더 경로, names: {시뮬레이션 이름: 제목}, codes: {성취기준: 짧은 이름} }
  function mount(box, o) {
    var key = null, all = null, list = null, idx = 0, picked = 0, topic = '', mode = '', urls = [], cache = {};
    function scope() { return topic ? all.filter(function (x) { return x.c === topic; }) : all; }
    function apply() { var g = getLog(); list = scope().filter(function (x) { var r = g[x.id]; return mode === 'new' ? !r : mode === 'wrong' ? r && !r[0] : true; }); idx = 0; }
    box.className = 'pq';
    function freeUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }
    function pic(blob, alt) { var u = URL.createObjectURL(blob); urls.push(u); var w = el('div', 'pq-zoom'), im = el('img'); im.alt = alt; im.src = u; im.addEventListener('click', function () { im.classList.toggle('big'); }); w.appendChild(im); return w; }
    // 파일 = iv(12바이트) + 암호문. 실패 이유를 구분한다: 'net'(받지 못함) / 'key'(코드가 틀림)
    function load(name, k) {
      return fetch(o.base + name).then(function (r) { if (!r.ok) throw new Error('net'); return r.arrayBuffer(); }, function () { throw new Error('net'); })
        .then(function (buf) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, k, new Uint8Array(buf, 12)).catch(function () { throw new Error('key'); }); });
    }
    function open(code, onFail) {
      makeKey(code).then(function (k) {
        return load(o.file, k).then(function (buf) { key = k; setCode(code.trim()); all = JSON.parse(new TextDecoder().decode(buf)); topic = ''; mode = ''; apply(); cache = {}; show(); });
      }).catch(function (e) {
        if (e && e.message === 'key') { setCode(''); onFail('수업 코드가 맞지 않습니다. 대문자와 소문자, 띄어쓰기를 확인하세요.'); }
        else onFail('문제를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.'); });
    }
    function head() { box.innerHTML = ''; box.appendChild(el('h2', '', o.title)); box.appendChild(el('p', 'pq-sub', o.sub)); }
    function gate(msg) {
      head();
      var row = el('div', 'pq-row'), inp = el('input'), go = el('button', 'pq-main', '문제 열기');
      inp.type = 'text'; inp.placeholder = '수업 코드'; inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', '수업 코드');
      row.appendChild(inp); row.appendChild(go); box.appendChild(row);
      var err = el('p', 'pq-err', msg || ''); box.appendChild(err);
      box.appendChild(el('p', 'pq-copy', '수업 시간에 안내받은 수업 코드를 입력하세요. 한 번 입력하면 이 기기에 기억됩니다.'));
      var run = function () { if (!inp.value.trim()) { err.textContent = '수업 코드를 입력하세요.'; return; } go.disabled = true; go.textContent = '여는 중…'; open(inp.value, gate); };
      go.addEventListener('click', run); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    }
    function getItem(it) {
      if (cache[it.id]) return Promise.resolve(cache[it.id]);
      return load('q/' + it.id + '.bin', key).then(function (buf) {
        var n = new DataView(buf).getUint32(0), d = { q: new Blob([new Uint8Array(buf, 4, n)], { type: 'image/webp' }), e: new Blob([new Uint8Array(buf, 4 + n)], { type: 'image/webp' }) };
        cache[it.id] = d; return d; });
    }
    function show() {
      var it = list[idx], g = getLog(); picked = 0; freeUrls(); head();
      var sc = scope(), nDone = 0, nOk = 0; sc.forEach(function (x) { var r = g[x.id]; if (r) { nDone++; if (r[0]) nOk++; } });
      var recRow = el('p', 'pq-rec'); recRow.appendChild(document.createTextNode('내 기록: ' + sc.length + '문제 중 ' + nDone + '문제 풀었어요' + (nDone ? ' (맞음 ' + nOk + ', 틀림 ' + (nDone - nOk) + ')' : '') + ' '));
      if (nDone) { var rz = el('a', '', '기록 지우기'); rz.href = '#'; rz.addEventListener('click', function (e) { e.preventDefault(); if (window.confirm('여기 보이는 ' + sc.length + '문제의 기록을 지울까요?')) { clearLog(sc.map(function (x) { return x.id; })); apply(); show(); } }); recRow.appendChild(rz); }
      if (o.codes) {   // 성취기준별로 골라 보기
        var cnt = {}, ord = []; all.forEach(function (x) { if (!cnt[x.c]) { cnt[x.c] = 0; ord.push(x.c); } cnt[x.c]++; }); ord.sort();
        var ts = el('select'); ts.setAttribute('aria-label', '성취기준 고르기');
        var o0 = el('option', '', '전체 (' + all.length + '문제)'); o0.value = ''; ts.appendChild(o0);
        ord.forEach(function (c) { var op = el('option', '', '[' + c + '] ' + (o.codes[c] || '') + ' (' + cnt[c] + '문제)'); op.value = c; ts.appendChild(op); }); ts.value = topic;
        ts.addEventListener('change', function () { topic = ts.value; apply(); show(); }); box.appendChild(ts);
      }
      box.appendChild(recRow);
      var ms = el('select'); ms.setAttribute('aria-label', '볼 문제 고르기');
      [['', '모든 문제 보기'], ['new', '아직 안 푼 문제만 보기'], ['wrong', '틀린 문제만 보기']].forEach(function (a) { var op = el('option', '', a[1]); op.value = a[0]; ms.appendChild(op); }); ms.value = mode;
      ms.addEventListener('change', function () { mode = ms.value; apply(); show(); }); box.appendChild(ms);
      if (!it) { box.appendChild(el('p', 'pq-load', mode === 'wrong' ? '틀린 문제가 없어요.' : '안 푼 문제가 없어요. 모두 풀었어요!')); return; }
      var sel = el('select'); sel.setAttribute('aria-label', '문제 고르기');
      list.forEach(function (x, k) { var r = g[x.id], op = el('option', '', (r ? (r[0] ? '✓ ' : '✗ ') : '') + (k + 1) + '. ' + x.src); op.value = k; sel.appendChild(op); }); sel.value = idx;
      sel.addEventListener('change', function () { idx = +sel.value; show(); }); box.appendChild(sel);
      if (o.names && it.s) { var sa = el('a', 'pq-sim', '▶ 시뮬레이션 열기: ' + (o.names[it.s] || it.s)); sa.href = o.simBase + it.s + '/'; box.appendChild(sa); }
      var area = el('div', 'pq-load', '문제를 불러오는 중…'); box.appendChild(area);
      var ch = el('div', 'pq-ch'), marks = ['①', '②', '③', '④', '⑤'], btns = [];
      marks.forEach(function (mk, k) { var b = el('button', '', mk); b.type = 'button'; b.setAttribute('aria-label', (k + 1) + '번');
        b.addEventListener('click', function () { if (ch.dataset.done) return; picked = k + 1; btns.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); btns.push(b); ch.appendChild(b); });
      box.appendChild(ch);
      var res = el('p', 'pq-res'), exp = el('div', 'pq-exp'); exp.style.display = 'none';
      var row = el('div', 'pq-row'), chk = el('button', 'pq-main', '정답 확인'), prev = el('button', '', '이전'), next = el('button', '', '다음 문제'), out = el('a', 'pq-link', '수업 코드 지우기');
      out.href = '#'; prev.disabled = idx === 0; next.disabled = idx === list.length - 1; chk.disabled = true;
      var data = null;
      getItem(it).then(function (d) { if (list[idx] !== it || !area.isConnected) return; data = d; area.className = ''; area.textContent = ''; area.appendChild(pic(d.q, it.src)); area.appendChild(el('p', 'pq-tip', '그림을 누르면 크게 볼 수 있어요.')); chk.disabled = false;
      }).catch(function () { if (area.isConnected) area.textContent = '문제를 불러오지 못했습니다. 인터넷 연결을 확인하고 다른 문제를 골랐다가 다시 골라 주세요.'; });
      chk.addEventListener('click', function () {
        if (!picked) { res.textContent = '답을 먼저 고르세요.'; res.style.color = '#5b6475'; return; }
        ch.dataset.done = '1'; var ok = picked === it.a; mark(it.id, ok);
        btns.forEach(function (x, k) { x.classList.remove('on'); if (k + 1 === it.a) x.classList.add('ok'); else if (k + 1 === picked) x.classList.add('no'); });
        res.textContent = ok ? '정답입니다.' : '정답은 ' + marks[it.a - 1] + '입니다.'; res.style.color = ok ? '#2e9e6a' : '#d64541';
        if (data && data.e.size) { exp.appendChild(el('b', '', '해설 (EBS)')); exp.appendChild(pic(data.e, '해설')); exp.style.display = 'block'; }
        chk.disabled = true; });
      prev.addEventListener('click', function () { idx--; show(); }); next.addEventListener('click', function () { idx++; show(); });
      out.addEventListener('click', function (e) { e.preventDefault(); setCode(''); keyP = {}; key = null; all = list = null; cache = {}; freeUrls(); start(); });
      row.appendChild(chk); row.appendChild(prev); row.appendChild(next); row.appendChild(out);
      box.appendChild(res); box.appendChild(exp); box.appendChild(row);
      box.appendChild(el('p', 'pq-copy', '학습 기록은 이 기기의 이 브라우저에만 저장돼요. 다른 기기에서는 보이지 않고, 인터넷 사용 기록을 지우면 함께 지워져요.')); box.appendChild(el('p', 'pq-copy', '문제의 저작권은 한국교육과정평가원에, 해설의 저작권은 EBS에 있습니다. 수업을 듣는 학생의 학습을 위해서만 제공하므로 다른 곳에 올리거나 나누어 주지 마세요.'));
    }
    function start() {
      head();
      var row = el('div', 'pq-row'), go = el('button', 'pq-main', '기출문제 풀어 보기'); row.appendChild(go); box.appendChild(row);
      var run = function () { var c = getCode(); if (c) { go.disabled = true; go.textContent = '여는 중…'; open(c, gate); } else gate(); };
      go.addEventListener('click', run); if (o.auto) run();
    }
    start();
  }

  function ready(base) {
    return fetch(base + 'index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || d.v !== 2) return null; meta = d;
      if (!styled) { styled = true; var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
      return d; });
  }
  window.PQ = { ready: ready, mount: mount };

  if (m) ready('../../practice/data/').then(function (d) {   // 시뮬레이션 화면
    if (!d || !d.sims || !d.sims[m[1]]) return;
    var box = el('section'); (document.querySelector('.wrap') || document.body).appendChild(box);
    mount(box, { base: '../../practice/data/', file: m[1] + '.bin', title: '연결된 기출문제', sub: '이 시뮬레이션과 관련된 수능 기출문제 ' + d.sims[m[1]] + '개를 풀어 볼 수 있어요.' });
  }).catch(function () {});
})();
