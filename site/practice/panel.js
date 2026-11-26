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
    '.pq .pq-zoom{overflow-x:auto;margin:0 0 10px;-webkit-overflow-scrolling:touch}.pq img{display:block;width:100%;max-width:none;height:auto;cursor:zoom-in}.pq .pq-tip{font-size:12px;color:#5b6475;margin:-4px 0 10px}' +
    '.pq-pop{position:fixed;inset:0;z-index:9999;background:rgba(20,24,32,.94);display:none;flex-direction:column}' +
    '.pq-pbar{display:flex;gap:8px;align-items:center;padding:10px 12px;background:#1d2330}.pq-pbar button{font:inherit;font-size:16px;font-weight:700;min-width:42px;padding:8px 10px;white-space:nowrap;border-radius:8px;border:1px solid #5b6475;background:#2a3140;color:#fff;touch-action:manipulation}.pq-pbar button:disabled{opacity:.35}' +
    '.pq-pbar .pq-px{margin-left:auto;background:#2f6fdf;border-color:#2f6fdf}.pq-plv{color:#fff;font-size:14px;min-width:46px;text-align:center;font-variant-numeric:tabular-nums}' +
    '.pq-pscroll{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff}.pq-pscroll img{display:block;width:100%;max-width:none;height:auto}' +
    '.pq .pq-load{color:#5b6475;font-size:14px;margin:0 0 10px;min-height:120px}' +
    '.pq .pq-ch{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.pq .pq-ch button{padding:11px 4px;font-size:17px}' +
    '.pq .pq-ch button.on{border-color:#2f6fdf;background:#e8eefb;font-weight:700}' +
    '.pq .pq-ch button.ok{border-color:#2e9e6a;background:#e3f4ec;font-weight:700}.pq .pq-ch button.no{border-color:#d64541;background:#fbe9e8}' +
    '.pq .pq-res{font-weight:700;margin:10px 0 0}.pq .pq-exp{border-top:1px solid #d9dde4;padding:10px 0 0;margin:10px 0 0}.pq .pq-exp b{display:block;font-size:13px;color:#5b6475;margin:0 0 6px}' +
    '.pq .pq-rec{font-size:13px;color:#5b6475;margin:0 0 8px}.pq .pq-rec a{color:#5b6475;margin-left:6px}.pq .pq-err{color:#d64541;font-size:14px;margin:8px 0 0}.pq .pq-copy{font-size:12px;color:#5b6475;margin:12px 0 0}' +
    '.pq .pq-meta{font-size:14px;margin:0 0 2px;line-height:1.5}.pq .pq-meta b{margin-right:6px}.pq .pq-meta span{color:#2f6fdf;display:inline-block}.pq .pq-pt{font-size:13px;color:#1d2330;margin:2px 0 0}.pq .pq-era{font-size:12px;color:#5b6475;margin:0 0 10px}' +
    '.pq .pq-seg{display:flex;margin:0 0 10px}.pq .pq-seg button{flex:1;padding:9px 6px;font-weight:700}.pq .pq-seg button:first-child{border-radius:8px 0 0 8px}.pq .pq-seg button:last-child{border-radius:0 8px 8px 0;border-left:0}.pq .pq-seg button.on{background:#2f6fdf;border-color:#2f6fdf;color:#fff}' +
    '.pq .pq-item{border-top:2px solid #d9dde4;padding-top:12px;margin-top:18px;min-width:0}.pq .pq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,max(420px,calc(50% - 14px))),1fr));gap:0 28px;align-items:start}.pq .pq-item .pq-meta b{font-size:16px}.pq .pq-tag{font-style:normal}' +
    '.pq a.pq-link{font-size:13px;color:#5b6475;margin-left:auto}.pq a.pq-sim{display:block;font-size:15px;color:#2f6fdf;font-weight:700;text-decoration:none;text-align:center;border:1px solid #2f6fdf;border-radius:8px;padding:10px 12px;margin:0 0 10px;background:#f3f7ff}' +
    '.pq .pq-chk{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:6px;margin:0 0 12px}.pq .pq-chk label{display:flex;gap:8px;align-items:center;border:1px solid #d9dde4;border-radius:8px;padding:9px 10px;font-size:14px;cursor:pointer}.pq .pq-chk label.on{border-color:#2f6fdf;background:#f3f7ff}.pq .pq-chk input{flex:none;width:18px;height:18px;margin:0}.pq .pq-chk small{color:#5b6475;margin-left:auto}' +
    '.pq h3{font-size:15px;margin:14px 0 6px}.pq .pq-bar{position:sticky;bottom:0;background:#fff;border-top:1px solid #d9dde4;margin:14px -14px -14px;padding:10px 14px;border-radius:0 0 12px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:5}.pq .pq-bar span{font-size:14px;color:#5b6475;margin-right:auto}' +
    '.pq .pq-score{font-size:22px;font-weight:800;margin:6px 0}.pq .pq-omr{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:4px;margin:8px 0 4px}.pq .pq-omr a{display:block;text-align:center;font-size:13px;padding:6px 2px;border-radius:6px;border:1px solid #d9dde4;color:#1d2330;text-decoration:none}.pq .pq-omr a.ok{border-color:#2e9e6a;background:#e3f4ec}.pq .pq-omr a.no{border-color:#d64541;background:#fbe9e8}.pq .pq-omr a.on{border-color:#2f6fdf;background:#e8eefb}';

  // 그림 크게 보기: 화면 전체를 덮는 창. 처음에는 화면 폭에 맞추고, +/− 로 키우며 위아래·옆으로 밀어 본다.
  // 휴대폰의 '뒤로' 버튼을 누르면 창만 닫힌다.
  var zp = null;
  function zoomPop(src, alt) {
    if (!zp) {
      zp = el('div', 'pq-pop'); var bar = el('div', 'pq-pbar'), sc = el('div', 'pq-pscroll'), im = el('img'), lv = el('span', 'pq-plv');
      var minus = el('button', '', '−'), plus = el('button', '', '+'), fit = el('button', '', '맞춤'), x = el('button', 'pq-px', '닫기 ✕');
      [minus, plus, fit, x].forEach(function (b) { b.type = 'button'; });
      bar.appendChild(minus); bar.appendChild(lv); bar.appendChild(plus); bar.appendChild(fit); bar.appendChild(x); sc.appendChild(im); zp.appendChild(bar); zp.appendChild(sc);
      var Z = [1, 1.5, 2, 3, 4]; zp.zi = 0;
      zp.set = function (i) { zp.zi = Math.max(0, Math.min(Z.length - 1, i)); im.style.width = (Z[zp.zi] * 100) + '%'; lv.textContent = Math.round(Z[zp.zi] * 100) + '%'; minus.disabled = zp.zi === 0; plus.disabled = zp.zi === Z.length - 1; };
      minus.addEventListener('click', function () { zp.set(zp.zi - 1); }); plus.addEventListener('click', function () { zp.set(zp.zi + 1); }); fit.addEventListener('click', function () { zp.set(0); sc.scrollTo(0, 0); });
      zp.close = function () { if (!zp.open) return; zp.open = false; zp.style.display = 'none'; document.documentElement.style.overflow = ''; };
      x.addEventListener('click', function () { if (zp.hist) history.back(); else zp.close(); });
      window.addEventListener('popstate', function () { if (zp.open) { zp.hist = false; zp.close(); } });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && zp.open) x.click(); });
      zp.im = im; zp.sc = sc; document.body.appendChild(zp);
    }
    zp.im.src = src; zp.im.alt = alt || ''; zp.set(0); zp.style.display = 'flex'; zp.open = true; zp.sc.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    zp.hist = false; try { history.pushState({ pqzoom: 1 }, ''); zp.hist = true; } catch (e) {}
  }

  // 난이도: 정답률(%) 기준 6단계. 정답률이 없는 문항(2015학년도 이전)은 'none'
  var LV = [['최상', '최상 (정답률 30% 미만)'], ['상', '상 (정답률 30~49%)'], ['중상', '중상 (정답률 50~59%)'], ['중', '중 (정답률 60~79%)'], ['중하', '중하 (정답률 80~89%)'], ['하', '하 (정답률 90% 이상)'], ['none', '정답률 없음 (2015학년도 이전)']];
  function lvOf(x) { var r = x.r; if (r == null || r === '') return 'none'; r = +r; return r < 30 ? '최상' : r < 50 ? '상' : r < 60 ? '중상' : r < 80 ? '중' : r < 90 ? '중하' : '하'; }

  // 출처: 평가원(수능·6월·9월 모의평가) / 교육청(학력평가). 고른 탭은 기기에 기억
  function isEdu(x) { return !/_(06|09|11)_\d\d$/.test(x.id); }
  function getOrg() { try { return localStorage.getItem('pq-org') === 'edu' ? 'edu' : 'kice'; } catch (e) { return 'kice'; } }
  function setOrg(v) { try { localStorage.setItem('pq-org', v); } catch (e) {} }
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
    var key = null, all = null, list = null, idx = 0, std = '', tp = '', lv = '', mode = '', urls = [], cache = {};
    // std: 고른 2022 성취기준, tp: 고른 주제
    function pool() { var h = hasBoth(); return all.filter(function (x) { return !h || isEdu(x) === (getOrg() === 'edu'); }); }
    function hasBoth() { return all.some(isEdu) && all.some(function (x) { return !isEdu(x); }); }
    function scope() { return pool().filter(function (x) { return (!std || x.c === std) && (!tp || x.t === tp) && (!lv || lvOf(x) === lv); }); }
    function apply() { var g = getLog(); list = scope().filter(function (x) { var r = g[x.id]; return mode === 'new' ? !r : mode === 'wrong' ? r && !r[0] : true; }); idx = 0; }
    box.className = 'pq';
    function freeUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }
    function pic(blob, alt) { var u = URL.createObjectURL(blob); urls.push(u); var w = el('div', 'pq-zoom'), im = el('img'); im.alt = alt; im.src = u; im.addEventListener('click', function () { zoomPop(u, alt); }); w.appendChild(im); return w; }
    // 파일 = iv(12바이트) + 암호문. 실패 이유를 구분한다: 'net'(받지 못함) / 'key'(코드가 틀림)
    function load(name, k) {
      return fetch(o.base + name).then(function (r) { if (!r.ok) throw new Error('net'); return r.arrayBuffer(); }, function () { throw new Error('net'); })
        .then(function (buf) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, k, new Uint8Array(buf, 12)).catch(function () { throw new Error('key'); }); });
    }
    function open(code, onFail) {
      makeKey(code).then(function (k) {
        return load(o.file, k).then(function (buf) { key = k; setCode(code.trim()); all = JSON.parse(new TextDecoder().decode(buf)); std = ''; tp = ''; lv = ''; mode = ''; apply(); cache = {}; show(); });
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
    // 보기 방식: 'one' 한 문제씩, 'all' 한꺼번에(10문제씩 이어서). 고른 방식은 이 기기에 기억한다.
    var VKEY = 'pq-view-' + (o.codes ? 'unit' : 'sim'), PAGE = 10, marks = ['①', '②', '③', '④', '⑤'];
    function getView() { try { var v = localStorage.getItem(VKEY); if (v === 'one' || v === 'all') return v; } catch (e) {} return o.codes ? 'all' : 'one'; }
    function setView(v) { try { localStorage.setItem(VKEY, v); } catch (e) {} }
    // 문제 하나: 시뮬레이션 연결, 그림, 답 고르기, 정답 확인, 해설. lazy이면 화면 가까이 왔을 때 그림을 불러온다.
    function item(it, lazy, num, onMark) {
      var wrap = el('div'), picked = 0, data = null, g = getLog(), r = g[it.id];
      var mt = el('p', 'pq-meta'), hb = el('b'), tag = el('i', 'pq-tag');
      if (num) { var setTag = function (v) { tag.textContent = v == null ? '' : v ? '✓ ' : '✗ '; tag.style.color = v ? '#2e9e6a' : '#d64541'; }; setTag(r ? r[0] : null); hb.appendChild(tag); hb.appendChild(document.createTextNode(num + '. ')); }
      hb.appendChild(document.createTextNode(it.src)); mt.appendChild(hb);
      if (it.c) mt.appendChild(el('span', '', '[' + it.c + '] ' + (it.t || (o.codes && o.codes[it.c]) || '')));
      wrap.appendChild(mt);
      if (it.p) wrap.appendChild(el('p', 'pq-pt', '배점 ' + it.p + '점' + (it.r != null ? ', 정답률 ' + it.r + '% (난이도 ' + lvOf(it) + ')' : '')));
      if (it.e) wrap.appendChild(el('p', 'pq-era', '출제 당시: ' + it.e + ' 교육과정' + (it.e !== '7차' && it.o ? ' ' + it.o : '')));
      if (o.names && it.s) { var sa = el('a', 'pq-sim', '▶ 시뮬레이션 열기: ' + (o.names[it.s] || it.s)); sa.href = o.simBase + it.s + '/'; wrap.appendChild(sa); }
      var area = el('div', 'pq-load', '문제를 불러오는 중…'); wrap.appendChild(area);
      var ch = el('div', 'pq-ch'), btns = [];
      marks.forEach(function (mk, k) { var b = el('button', '', mk); b.type = 'button'; b.setAttribute('aria-label', (k + 1) + '번');
        b.addEventListener('click', function () { if (ch.dataset.done) return; picked = k + 1; btns.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); btns.push(b); ch.appendChild(b); });
      wrap.appendChild(ch);
      var res = el('p', 'pq-res'), exp = el('div', 'pq-exp'); exp.style.display = 'none';
      var row = el('div', 'pq-row'), chk = el('button', 'pq-main', '정답 확인'); chk.disabled = true; row.appendChild(chk);
      function fetchPic() {
        getItem(it).then(function (d) { if (!area.isConnected) return; data = d; area.className = ''; area.textContent = ''; area.appendChild(pic(d.q, it.src)); area.appendChild(el('p', 'pq-tip', '그림을 누르면 크게 볼 수 있어요.')); chk.disabled = false;
        }).catch(function () { if (!area.isConnected) return; area.textContent = '문제를 불러오지 못했습니다. '; var again = el('a', '', '다시 불러오기'); again.href = '#';
          again.addEventListener('click', function (e) { e.preventDefault(); area.textContent = '문제를 불러오는 중…'; fetchPic(); }); area.appendChild(again); });
      }
      if (lazy && window.IntersectionObserver) { var ob = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { ob.disconnect(); fetchPic(); } }, { rootMargin: '800px 0px' }); ob.observe(area); }
      else fetchPic();
      chk.addEventListener('click', function () {
        if (!picked) { res.textContent = '답을 먼저 고르세요.'; res.style.color = '#5b6475'; return; }
        ch.dataset.done = '1'; var ok = picked === it.a; mark(it.id, ok); if (num) setTag(ok);
        btns.forEach(function (x, k) { x.classList.remove('on'); if (k + 1 === it.a) x.classList.add('ok'); else if (k + 1 === picked) x.classList.add('no'); });
        res.textContent = ok ? '정답입니다.' : '정답은 ' + marks[it.a - 1] + '입니다.'; res.style.color = ok ? '#2e9e6a' : '#d64541';
        if (data && data.e.size) { exp.appendChild(el('b', '', /_(0[3457]|10)_\d\d$/.test(it.id) ? '해설 (교육청)' : '해설 (EBS)')); exp.appendChild(pic(data.e, '해설')); exp.style.display = 'block'; }
        chk.disabled = true; });
      wrap.appendChild(res); wrap.appendChild(exp); wrap.appendChild(row);
      return { el: wrap, row: row };
    }
    function show() {
      var it = list[idx], g = getLog(), view = getView(); freeUrls(); head(); box.classList.toggle('pq-all', view === 'all' && !!it);
      var sc = scope(), nDone = 0, nOk = 0; sc.forEach(function (x) { var r = g[x.id]; if (r) { nDone++; if (r[0]) nOk++; } });
      var recRow = el('p', 'pq-rec'); recRow.appendChild(document.createTextNode('내 기록: ' + sc.length + '문제 중 ' + nDone + '문제 풀었어요' + (nDone ? ' (맞음 ' + nOk + ', 틀림 ' + (nDone - nOk) + ')' : '') + ' '));
      if (nDone) { var rz = el('a', '', '기록 지우기'); rz.href = '#'; rz.addEventListener('click', function (e) { e.preventDefault(); if (window.confirm('여기 보이는 ' + sc.length + '문제의 기록을 지울까요?')) { clearLog(sc.map(function (x) { return x.id; })); apply(); show(); } }); recRow.appendChild(rz); }
      if (hasBoth()) {   // 평가원 기출 / 교육청 기출 탭
        var org = getOrg(), og = el('div', 'pq-seg pq-org'), ne = all.filter(isEdu).length;
        [['kice', '평가원 기출', all.length - ne], ['edu', '교육청 기출', ne]].forEach(function (a) { var b = el('button', a[0] === org ? 'on' : '', a[1] + ' (' + a[2] + ')'); b.type = 'button';
          b.addEventListener('click', function () { if (a[0] !== getOrg()) { setOrg(a[0]); std = ''; tp = ''; lv = ''; apply(); show(); } }); og.appendChild(b); });
        box.appendChild(og);
      }
      var P = pool();
      if (o.codes) {   // 성취기준별로, 그 안에서 주제별로 골라 보기
        var cnt = {}, ord = []; P.forEach(function (x) { if (!cnt[x.c]) { cnt[x.c] = 0; ord.push(x.c); } cnt[x.c]++; }); ord.sort();
        if (ord.length > 1) {
          var ts = el('select'); ts.setAttribute('aria-label', '성취기준 고르기');
          var o0 = el('option', '', '성취기준: 전체 (' + P.length + '문제)'); o0.value = ''; ts.appendChild(o0);
          ord.forEach(function (c) { var op = el('option', '', '[' + c + '] ' + (o.codes[c] || '') + ' (' + cnt[c] + '문제)'); op.value = c; ts.appendChild(op); }); ts.value = std;
          ts.addEventListener('change', function () { std = ts.value; tp = ''; apply(); show(); }); box.appendChild(ts);
        }
        var base = std ? P.filter(function (x) { return x.c === std; }) : P, tc = {}, tf = {}, tord = [];
        base.forEach(function (x) { if (!(x.t in tc)) { tc[x.t] = 0; tf[x.t] = x.c; tord.push(x.t); } tc[x.t]++; });
        tord.sort(function (a, b) { return tf[a] < tf[b] ? -1 : tf[a] > tf[b] ? 1 : a.localeCompare(b, 'ko'); });
        if (tord.length > 1) {
          var tt = el('select'); tt.setAttribute('aria-label', '주제 고르기');
          var t0 = el('option', '', '주제: 전체 (' + base.length + '문제)'); t0.value = ''; tt.appendChild(t0);
          tord.forEach(function (t) { var op = el('option', '', (t || '주제 없음') + ' (' + tc[t] + '문제)'); op.value = t; tt.appendChild(op); }); tt.value = tp;
          tt.addEventListener('change', function () { tp = tt.value; apply(); show(); }); box.appendChild(tt);
        }
      }
      // 난이도별로 골라 보기 (정답률 기준, 2016학년도부터)
      var lbase = P.filter(function (x) { return (!std || x.c === std) && (!tp || x.t === tp); }), lc = {};
      lbase.forEach(function (x) { var l = lvOf(x); lc[l] = (lc[l] || 0) + 1; });
      if (LV.some(function (L) { return L[0] !== 'none' && lc[L[0]]; })) {
        var ls = el('select'); ls.setAttribute('aria-label', '난이도 고르기');
        var l0 = el('option', '', '난이도: 전체 (' + lbase.length + '문제)'); l0.value = ''; ls.appendChild(l0);
        LV.forEach(function (L) { if (!lc[L[0]] && lv !== L[0]) return; var op = el('option', '', L[1] + ' (' + (lc[L[0]] || 0) + '문제)'); op.value = L[0]; ls.appendChild(op); }); ls.value = lv;
        ls.addEventListener('change', function () { lv = ls.value; apply(); show(); }); box.appendChild(ls);
      }
      box.appendChild(recRow);
      var ms = el('select'); ms.setAttribute('aria-label', '볼 문제 고르기');
      [['', '모든 문제 보기'], ['new', '아직 안 푼 문제만 보기'], ['wrong', '틀린 문제만 보기']].forEach(function (a) { var op = el('option', '', a[1]); op.value = a[0]; ms.appendChild(op); }); ms.value = mode;
      ms.addEventListener('change', function () { mode = ms.value; apply(); show(); }); box.appendChild(ms);
      var seg = el('div', 'pq-seg');
      [['one', '한 문제씩'], ['all', '한꺼번에 보기']].forEach(function (a) { var b = el('button', a[0] === view ? 'on' : '', a[1]); b.type = 'button';
        b.addEventListener('click', function () { if (a[0] !== getView()) { setView(a[0]); show(); } }); seg.appendChild(b); });
      box.appendChild(seg);
      var out = el('a', 'pq-link', '수업 코드 지우기'); out.href = '#';
      out.addEventListener('click', function (e) { e.preventDefault(); setCode(''); keyP = {}; key = null; all = list = null; cache = {}; freeUrls(); start(); });
      function tail() {
        box.appendChild(el('p', 'pq-copy', '학습 기록은 이 기기의 이 브라우저에만 저장돼요. 다른 기기에서는 보이지 않고, 인터넷 사용 기록을 지우면 함께 지워져요.')); box.appendChild(el('p', 'pq-copy', '문제와 해설의 저작권은 한국교육과정평가원과 EBS, 해당 시·도 교육청에 있습니다. 수업을 듣는 학생의 학습을 위해서만 제공하므로 다른 곳에 올리거나 나누어 주지 마세요.'));
      }
      if (!it) { box.appendChild(el('p', 'pq-load', !sc.length ? '이 조건에 맞는 문제가 없어요. 난이도나 주제를 바꿔 보세요.' : mode === 'wrong' ? '틀린 문제가 없어요.' : '안 푼 문제가 없어요. 모두 풀었어요!')); return; }
      if (view === 'all') {
        var holder = el('div', 'pq-grid'), moreRow = el('div', 'pq-row'), more = el('button', '', ''), shown = 0;
        more.type = 'button'; moreRow.appendChild(more); moreRow.appendChild(out);
        var addMore = function () {
          list.slice(shown, shown + PAGE).forEach(function (x, j) {
            var card = el('div', 'pq-item'); card.appendChild(item(x, true, shown + j + 1).el);
            holder.appendChild(card); });
          shown = Math.min(list.length, shown + PAGE);
          var left = list.length - shown; more.style.display = left ? '' : 'none';
          more.textContent = '다음 ' + Math.min(PAGE, left) + '문제 더 보기 (남은 문제 ' + left + '개)';
        };
        more.addEventListener('click', addMore);
        box.appendChild(el('p', 'pq-rec', '모두 ' + list.length + '문제입니다. 아래로 내리며 풀어 보세요.'));
        box.appendChild(holder); addMore(); box.appendChild(moreRow); tail(); return;
      }
      var sel = el('select'); sel.setAttribute('aria-label', '문제 고르기');
      list.forEach(function (x, k) { var r = g[x.id], op = el('option', '', (r ? (r[0] ? '✓ ' : '✗ ') : '') + (k + 1) + '. ' + x.src); op.value = k; sel.appendChild(op); }); sel.value = idx;
      sel.addEventListener('change', function () { idx = +sel.value; show(); }); box.appendChild(sel);
      var one = item(it, false, 0), prev = el('button', '', '이전'), next = el('button', '', '다음 문제');
      prev.disabled = idx === 0; next.disabled = idx === list.length - 1;
      prev.addEventListener('click', function () { idx--; show(); }); next.addEventListener('click', function () { idx++; show(); });
      one.row.appendChild(prev); one.row.appendChild(next); one.row.appendChild(out);
      box.appendChild(one.el); tail();
    }
    function start() {
      head();
      var row = el('div', 'pq-row'), go = el('button', 'pq-main', '기출문제 풀어 보기'); row.appendChild(go); box.appendChild(row);
      var run = function () { var c = getCode(); if (c) { go.disabled = true; go.textContent = '여는 중…'; open(c, gate); } else gate(); };
      go.addEventListener('click', run); if (o.auto) run();
    }
    start();
  }

  // 모의고사 만들기: 단원·출처·문제 수를 골라 무작위로 뽑은 문제를 한꺼번에 풀고 마지막에 채점한다.
  // o: { base, units: {단원 코드: [과목, 단원 이름]}, counts: {단원 코드: 문제 수}, codes }
  // 푸는 중인 시험(문항 id, 고른 답, 시작 시각)은 이 기기에 저장해서 새로 고침해도 이어서 풀 수 있다.
  function exam(box, o) {
    var marks = ['①', '②', '③', '④', '⑤'], key = null, urls = [], cache = {}, EKEY = 'pq-exam', SKEY = 'pq-exam-set', T = null;
    box.className = 'pq';
    function freeUrls() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; }
    function pic(blob, alt) { var u = URL.createObjectURL(blob); urls.push(u); var w = el('div', 'pq-zoom'), im = el('img'); im.alt = alt; im.src = u; im.addEventListener('click', function () { zoomPop(u, alt); }); w.appendChild(im); return w; }
    function load(name, k) {
      return fetch(o.base + name).then(function (r) { if (!r.ok) throw new Error('net'); return r.arrayBuffer(); }, function () { throw new Error('net'); })
        .then(function (buf) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, k, new Uint8Array(buf, 12)).catch(function () { throw new Error('key'); }); });
    }
    function getItem(it) {
      if (cache[it.id]) return Promise.resolve(cache[it.id]);
      return load('q/' + it.id + '.bin', key).then(function (buf) {
        var n = new DataView(buf).getUint32(0), d = { q: new Blob([new Uint8Array(buf, 4, n)], { type: 'image/webp' }), e: new Blob([new Uint8Array(buf, 4 + n)], { type: 'image/webp' }) };
        cache[it.id] = d; return d; });
    }
    function lists(us) { return Promise.all(us.map(function (u) { return load('u_' + u + '.bin', key).then(function (b) { return JSON.parse(new TextDecoder().decode(b)).map(function (x) { x.u = u; return x; }); }); })); }
    function rd(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }
    function wr(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    function head(sub) { if (T) { clearInterval(T); T = null; } freeUrls(); box.innerHTML = ''; box.appendChild(el('h2', '', sub ? '모의고사' : '조건 고르기')); box.appendChild(el('p', 'pq-sub', sub ? sub + ' · 그림 속 번호는 원래 시험의 번호예요.' : '단원과 문제 수를 고르면 기출문제를 무작위로 뽑아 모의고사를 만들어요. 다 푼 뒤 한꺼번에 채점해요.')); }
    function gate(msg) {
      head();
      var row = el('div', 'pq-row'), inp = el('input'), go = el('button', 'pq-main', '시작하기');
      inp.type = 'text'; inp.placeholder = '수업 코드'; inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', '수업 코드');
      row.appendChild(inp); row.appendChild(go); box.appendChild(row);
      var err = el('p', 'pq-err', msg || ''); box.appendChild(err);
      box.appendChild(el('p', 'pq-copy', '수업 시간에 안내받은 수업 코드를 입력하세요. 한 번 입력하면 이 기기에 기억됩니다.'));
      var run = function () { if (!inp.value.trim()) { err.textContent = '수업 코드를 입력하세요.'; return; } go.disabled = true; go.textContent = '여는 중…'; open(inp.value); };
      go.addEventListener('click', run); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    }
    function open(code) {
      var us = Object.keys(o.counts).filter(function (u) { return o.counts[u]; });
      makeKey(code).then(function (k) { return load('u_' + us[0] + '.bin', k).then(function () { key = k; setCode(code.trim()); var ex = rd(EKEY, null); if (ex && ex.items && ex.items.length) resume(ex); else settings(); }); })
        .catch(function (e) { if (e && e.message === 'key') { setCode(''); gate('수업 코드가 맞지 않습니다. 대문자와 소문자, 띄어쓰기를 확인하세요.'); } else gate('문제를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.'); });
    }
    // 1단계: 조건 고르기
    function settings(msg) {
      head();
      var st = rd(SKEY, {}), sel = {}, n = st.n || 20, org = st.org || 'kice', fresh = !!st.fresh;
      (st.units || []).forEach(function (u) { if (o.counts[u]) sel[u] = 1; });
      box.appendChild(el('h3', '', '1. 문제 수'));
      var seg = el('div', 'pq-seg'); [10, 15, 20].forEach(function (v) { var b = el('button', v === n ? 'on' : '', v + '문제'); b.type = 'button';
        b.addEventListener('click', function () { n = v; [].forEach.call(seg.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); seg.appendChild(b); }); box.appendChild(seg);
      box.appendChild(el('h3', '', '2. 단원 (여러 개 고를 수 있어요)'));
      var subj = {}, order = []; Object.keys(o.units).forEach(function (u) { var s = o.units[u][0]; if (!subj[s]) { subj[s] = []; order.push(s); } subj[s].push(u); });
      var boxes = [];
      order.forEach(function (s) {
        var grid = el('div', 'pq-chk'), all = el('label'), ca = el('input'); ca.type = 'checkbox'; all.appendChild(ca); all.appendChild(el('b', '', s + ' 전체'));
        var mine = subj[s].filter(function (u) { return o.counts[u]; }); if (!mine.length) return;
        var sync = function () { ca.checked = mine.every(function (u) { return sel[u]; }); all.classList.toggle('on', ca.checked); };
        ca.addEventListener('change', function () { mine.forEach(function (u) { if (ca.checked) sel[u] = 1; else delete sel[u]; }); boxes.forEach(function (f) { f(); }); });
        grid.appendChild(all);
        mine.forEach(function (u) { var lb = el('label'), c = el('input'); c.type = 'checkbox'; lb.appendChild(c); lb.appendChild(document.createTextNode(o.units[u][1])); lb.appendChild(el('small', '', o.counts[u] + ''));
          var f = function () { c.checked = !!sel[u]; lb.classList.toggle('on', c.checked); sync(); }; boxes.push(f);
          c.addEventListener('change', function () { if (c.checked) sel[u] = 1; else delete sel[u]; f(); }); grid.appendChild(lb); });
        box.appendChild(grid); });
      boxes.forEach(function (f) { f(); });
      box.appendChild(el('h3', '', '3. 출처'));
      var sg = el('div', 'pq-seg'); [['kice', '평가원'], ['edu', '교육청'], ['both', '모두']].forEach(function (a) { var b = el('button', a[0] === org ? 'on' : '', a[1]); b.type = 'button';
        b.addEventListener('click', function () { org = a[0]; [].forEach.call(sg.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); sg.appendChild(b); }); box.appendChild(sg);
      var fl = el('div', 'pq-chk'), flb = el('label', fresh ? 'on' : ''), fc = el('input'); fc.type = 'checkbox'; fc.checked = fresh; flb.appendChild(fc); flb.appendChild(document.createTextNode('아직 안 푼 문제를 먼저 뽑기'));
      fc.addEventListener('change', function () { fresh = fc.checked; flb.classList.toggle('on', fresh); }); fl.appendChild(flb); box.appendChild(fl);
      var err = el('p', 'pq-err', msg || ''), row = el('div', 'pq-row'), go = el('button', 'pq-main', '모의고사 만들기'); row.appendChild(go); box.appendChild(row); box.appendChild(err);
      go.addEventListener('click', function () {
        var us = Object.keys(sel); if (!us.length) { err.textContent = '단원을 하나 이상 고르세요.'; return; }
        wr(SKEY, { n: n, units: us, org: org, fresh: fresh }); go.disabled = true; go.textContent = '만드는 중…';
        lists(us).then(function (ls) { make(ls, n, org, fresh, us); }).catch(function () { go.disabled = false; go.textContent = '모의고사 만들기'; err.textContent = '문제를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.'; });
      });
    }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    // 단원마다 고르게(돌아가며) 뽑는다. 쉬운 문제(2점, 정답률 높은 문제)가 앞에 오도록 늘어놓는다.
    function make(ls, n, org, fresh, us) {
      var seen = {}, g = getLog(), per = ls.map(function (l) {
        var c = l.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return org === 'both' || isEdu(x) === (org === 'edu'); });
        c = shuffle(c); if (fresh) c.sort(function (a, b) { return (g[a.id] ? 1 : 0) - (g[b.id] ? 1 : 0); }); return c; });
      var pick = [], k = 0; while (pick.length < n && per.some(function (c) { return c.length; })) { var c = per[k % per.length]; if (c.length) pick.push(c.shift()); k++; }
      if (!pick.length) { settings('고른 조건에 맞는 문제가 없어요. 출처나 단원을 바꿔 보세요.'); return; }
      var w = function (x) { return (x.p || 2) * 1000 - (x.r != null ? +x.r : 60); }; pick.sort(function (a, b) { return w(a) - w(b); });
      var ex = { items: pick.map(function (x) { return { id: x.id, src: x.src, a: x.a, c: x.c, t: x.t, p: x.p, r: x.r }; }), ans: {}, t0: Date.now(), units: us, done: false };
      wr(EKEY, ex); resume(ex);
    }
    function mmss(ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); return m + '분 ' + ('0' + (s % 60)).slice(-2) + '초'; }
    // 2단계: 풀기, 3단계: 채점 결과
    function resume(ex) {
      var N = ex.items.length, total = ex.items.reduce(function (t, x) { return t + (x.p || 2); }, 0);
      head(N + '문제 · 만점 ' + total + '점 · ' + ex.units.map(function (u) { return o.units[u][1]; }).join(', '));
      var omr = el('div', 'pq-omr'), cells = [], score = null;
      if (ex.done) {
        var ok = 0, pt = 0; ex.items.forEach(function (x) { if (ex.ans[x.id] === x.a) { ok++; pt += x.p || 2; } });
        score = el('div'); score.appendChild(el('p', 'pq-score', pt + '점 / ' + total + '점'));
        score.appendChild(el('p', 'pq-rec', N + '문제 중 ' + ok + '문제 맞음 · 걸린 시간 ' + mmss(ex.t1 - ex.t0))); box.appendChild(score);
      }
      box.appendChild(omr);
      var holder = el('div', 'pq-grid'); box.appendChild(holder);
      ex.items.forEach(function (it, i) {
        var card = el('div', 'pq-item'), mt = el('p', 'pq-meta'), hb = el('b', '', (i + 1) + '번'); card.id = 'pq-q' + (i + 1);
        hb.appendChild(el('small', '', ' (' + (it.p || 2) + '점)')); mt.appendChild(hb); card.appendChild(mt);
        if (ex.done) { card.appendChild(el('p', 'pq-pt', it.src)); if (it.c) card.appendChild(el('p', 'pq-era', '[' + it.c + '] ' + (it.t || (o.codes && o.codes[it.c]) || '') + (it.r != null ? ' · 정답률 ' + it.r + '%' : ''))); }
        var area = el('div', 'pq-load', '문제를 불러오는 중…'); card.appendChild(area);
        var ch = el('div', 'pq-ch'), btns = [], cell = el('a', '', (i + 1) + ''); cell.href = '#pq-q' + (i + 1); cells.push(cell);
        var paint = function () { var v = ex.ans[it.id]; btns.forEach(function (b, k) { b.className = ''; if (ex.done) { if (k + 1 === it.a) b.className = 'ok'; else if (k + 1 === v) b.className = 'no'; } else if (k + 1 === v) b.className = 'on'; });
          cell.className = ex.done ? (v === it.a ? 'ok' : 'no') : v ? 'on' : ''; cell.textContent = (i + 1) + (v ? ' ' + marks[v - 1] : ''); };
        marks.forEach(function (mk, k) { var b = el('button', '', mk); b.type = 'button'; b.setAttribute('aria-label', (i + 1) + '번 문제 ' + (k + 1) + '번');
          b.addEventListener('click', function () { if (ex.done) return; ex.ans[it.id] = ex.ans[it.id] === k + 1 ? undefined : k + 1; wr(EKEY, ex); paint(); count(); }); btns.push(b); ch.appendChild(b); });
        card.appendChild(ch); paint();
        var exp = el('div', 'pq-exp'); exp.style.display = 'none';
        if (ex.done) { var v = ex.ans[it.id], rs = el('p', 'pq-res', v === it.a ? '정답입니다.' : (v ? '오답 (고른 답 ' + marks[v - 1] + ')' : '답하지 않음') + ' · 정답 ' + marks[it.a - 1]); rs.style.color = v === it.a ? '#2e9e6a' : '#d64541'; card.appendChild(rs);
          var sx = el('button', '', '해설 보기'); sx.type = 'button'; var r2 = el('div', 'pq-row'); r2.appendChild(sx); card.appendChild(r2); card.appendChild(exp);
          sx.addEventListener('click', function () { if (exp.style.display === 'none') { exp.style.display = 'block'; sx.textContent = '해설 닫기'; if (!exp.firstChild) getItem(it).then(function (d) { exp.appendChild(el('b', '', isEdu(it) ? '해설 (교육청)' : '해설 (EBS)')); exp.appendChild(pic(d.e, '해설')); }); } else { exp.style.display = 'none'; sx.textContent = '해설 보기'; } }); }
        var fetchPic = function () { getItem(it).then(function (d) { if (!area.isConnected) return; area.className = ''; area.textContent = ''; area.appendChild(pic(d.q, (i + 1) + '번 문제')); })
          .catch(function () { if (!area.isConnected) return; area.textContent = '문제를 불러오지 못했습니다. '; var again = el('a', '', '다시 불러오기'); again.href = '#'; again.addEventListener('click', function (e) { e.preventDefault(); area.textContent = '문제를 불러오는 중…'; fetchPic(); }); area.appendChild(again); }); };
        if (window.IntersectionObserver) { var ob = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { ob.disconnect(); fetchPic(); } }, { rootMargin: '800px 0px' }); ob.observe(area); } else fetchPic();
        holder.appendChild(card);
      });
      cells.forEach(function (c) { omr.appendChild(c); });
      var bar = el('div', 'pq-bar'), info = el('span'); bar.appendChild(info);
      function count() { var a = ex.items.filter(function (x) { return ex.ans[x.id]; }).length; info.textContent = ex.done ? '채점을 마쳤어요.' : '답한 문제 ' + a + ' / ' + N + ' · ' + mmss(Date.now() - ex.t0); }
      if (!ex.done) {
        var grade = el('button', 'pq-main', '채점하기'); grade.type = 'button'; bar.appendChild(grade);
        grade.addEventListener('click', function () {
          var left = ex.items.filter(function (x) { return !ex.ans[x.id]; }).length;
          if (!window.confirm(left ? '아직 답하지 않은 문제가 ' + left + '개 있어요. 그래도 채점할까요?' : '채점할까요?')) return;
          ex.done = true; ex.t1 = Date.now(); ex.items.forEach(function (x) { if (ex.ans[x.id]) mark(x.id, ex.ans[x.id] === x.a); }); wr(EKEY, ex); resume(ex); box.scrollIntoView({ block: 'start' }); });
        var quit = el('a', 'pq-link', '그만두기'); quit.href = '#'; bar.appendChild(quit);
        quit.addEventListener('click', function (e) { e.preventDefault(); if (window.confirm('이 모의고사를 그만둘까요? 고른 답은 저장되지 않아요.')) { wr(EKEY, null); settings(); } });
        T = setInterval(count, 1000);
      } else {
        var again = el('button', 'pq-main', '같은 조건으로 새 모의고사'), ch2 = el('button', '', '조건 바꾸기'); again.type = ch2.type = 'button'; bar.appendChild(again); bar.appendChild(ch2);
        again.addEventListener('click', function () { var st = rd(SKEY, null); wr(EKEY, null); if (!st) { settings(); return; } again.disabled = true; lists(st.units).then(function (ls) { make(ls, st.n, st.org, st.fresh, st.units); }).catch(function () { settings('문제를 불러오지 못했습니다.'); }); });
        ch2.addEventListener('click', function () { wr(EKEY, null); settings(); });
      }
      count(); box.appendChild(bar);
      box.appendChild(el('p', 'pq-copy', '채점한 결과는 단원별 기출문제의 학습 기록(✓, ✗)에도 남아요. 학습 기록은 이 기기의 이 브라우저에만 저장돼요.'));
      box.appendChild(el('p', 'pq-copy', '문제와 해설의 저작권은 한국교육과정평가원과 EBS, 해당 시·도 교육청에 있습니다. 수업을 듣는 학생의 학습을 위해서만 제공하므로 다른 곳에 올리거나 나누어 주지 마세요.'));
    }
    var c = getCode(); if (c) { head(); box.appendChild(el('p', 'pq-load', '여는 중…')); open(c); } else gate();
  }

  function ready(base) {
    return fetch(base + 'index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || d.v !== 2) return null; meta = d;
      if (!styled) { styled = true; var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
      return d; });
  }
  window.PQ = { ready: ready, mount: mount, exam: exam };

  if (m) ready('../../practice/data/').then(function (d) {   // 시뮬레이션 화면
    if (!d || !d.sims || !d.sims[m[1]]) return;
    var box = el('section'); (document.querySelector('.wrap') || document.body).appendChild(box);
    mount(box, { base: '../../practice/data/', file: m[1] + '.bin', title: '연결된 기출문제', sub: '이 시뮬레이션과 관련된 기출문제(평가원·교육청) ' + d.sims[m[1]] + '개를 풀어 볼 수 있어요.' });
  }).catch(function () {});
})();
