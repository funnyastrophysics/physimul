// 잘라 둔 문항 그림을 수업 코드로 암호화해서 site/practice/data/ 에 넣습니다.
// 사용:  PRACTICE_CODE=수업코드 node src/practice/encrypt.js [문항 그림 폴더]
//
//   문항 그림 폴더(기본: practice-src/cut): extract.py가 만든 <과목>_<학년도>_<월>/q01.webp, e01.webp, info.json
//   src/practice/map.json            : 문항 → 시뮬레이션 연결표(빈 칸은 연결 없음)
//   src/practice/codes.json          : 문항 → 성취기준·주제·출제 당시 교육과정 (classify.py가 만듦)
//   src/practice/answers_manual.json : 정답표가 그림뿐이라 직접 넣은 정답
// practice-src 폴더와 수업 코드는 GitHub에 올리지 않습니다.
//
// 만들어지는 파일
//   data/index.json  : { salt, iter, sims: { 시뮬레이션: 문항 수 } }   (암호화하지 않음)
//   data/<시뮬레이션>.bin : 문항 목록 [{ id, src, a, c, t, e, o }]     (암호화)
//   data/u_<영역>.bin     : 문항 목록 [{ id, src, a, s, c, t, e, o }]  (암호화) s=시뮬레이션, c=2022 성취기준, t=주제, e=출제 당시 교육과정, o=당시 성취기준
//   data/q/<id>.bin  : [문제 그림 길이 4바이트][문제 그림][해설 그림]  (암호화)
// 암호화: PBKDF2-SHA256으로 만든 키, AES-256-GCM. 파일 = iv(12바이트) + 암호문 + 태그.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..', '..'), outDir = path.join(root, 'site', 'practice', 'data');
const cutDir = path.resolve(process.argv[2] || path.join(root, 'practice-src', 'cut'));
const code = (process.env.PRACTICE_CODE || '').trim();
if (!code) { console.error('PRACTICE_CODE(수업 코드)를 지정하세요.'); process.exit(1); }
if (!fs.existsSync(cutDir)) { console.error('문항 그림 폴더가 없습니다: ' + cutDir); process.exit(1); }
const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'map.json'), 'utf8'));
const manual = JSON.parse(fs.readFileSync(path.join(__dirname, 'answers_manual.json'), 'utf8'));
const U = JSON.parse(fs.readFileSync(path.join(__dirname, 'units.json'), 'utf8'));
const CODES = JSON.parse(fs.readFileSync(path.join(__dirname, 'codes.json'), 'utf8'));
const ITER = 200000;

// salt는 한 번 정하면 그대로 쓴다(바뀌면 모든 파일이 달라져 저장소가 불필요하게 커진다).
let salt; const idxPath = path.join(outDir, 'index.json');
try { const old = JSON.parse(fs.readFileSync(idxPath, 'utf8')); if (old.v === 2 && old.salt) salt = Buffer.from(old.salt, 'base64'); } catch (e) {}
if (!salt) salt = crypto.randomBytes(16);
const key = crypto.pbkdf2Sync(code, salt, ITER, 32, 'sha256');
function seal(plain) {   // 내용이 같으면 결과도 같도록 iv를 내용에서 만든다
  const iv = crypto.createHmac('sha256', key).update(plain).digest().subarray(0, 12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  return Buffer.concat([iv, c.update(plain), c.final(), c.getAuthTag()]);
}
const subject = (sub, year) => (year >= 2021 ? '물리학' : '물리') + (sub === 'p1' ? 'Ⅰ' : 'Ⅱ');
const exam_name = mm => ({ '06': '6월 모의평가', '09': '9월 모의평가', '11': '수능' })[mm] || mm + '월';
const unitOf = c => c === '미분류' ? 'x' : U.prefix[c.slice(0, 6)];

const sims = {}, units = {}, wanted = new Set(); let skipped = 0;
for (const exam of Object.keys(map).filter(k => /^p[12]_\d{4}_\d{2}$/.test(k)).sort()) {
  const dir = path.join(cutDir, exam); if (!fs.existsSync(dir)) { console.error('없는 회차: ' + exam); process.exit(1); }
  const info = JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8'));
  const ans = info.official || info.answers || manual[exam];
  if (!ans) { console.error('정답이 없습니다: ' + exam); process.exit(1); }
  const [sub, ys, mm] = exam.split('_'), year = +ys;
  map[exam].forEach((sim, i) => {
    const n = i + 1, a = ans[i];
    if (!(a >= 1 && a <= 5)) { skipped++; return; }   // 전원 정답 처리된 문항 등
    if (sim && !fs.existsSync(path.join(root, 'site', 'sim', sim))) { console.error('시뮬레이션 이름이 틀렸습니다: ' + sim); process.exit(1); }
    const nn = String(n).padStart(2, '0'), id = `${exam}_${nn}`;
    const q = fs.readFileSync(path.join(dir, `q${nn}.webp`)), e = fs.readFileSync(path.join(dir, `e${nn}.webp`));
    const head = Buffer.alloc(4); head.writeUInt32BE(q.length);
    fs.mkdirSync(path.join(outDir, 'q'), { recursive: true });
    const file = path.join(outDir, 'q', id + '.bin'), buf = seal(Buffer.concat([head, q, e]));
    if (!fs.existsSync(file) || !fs.readFileSync(file).equals(buf)) fs.writeFileSync(file, buf);
    wanted.add(id + '.bin');
    const item = { id, src: `${year}학년도 ${exam_name(mm)} ${subject(sub, year)} ${n}번`, a, year, sub, s: sim };
    const cc = CODES[id] || {}, c = cc.new, unit = c && unitOf(c);
    if (!unit || !U.codes[c]) { console.error('성취기준이 없습니다(classify.py를 먼저 실행하세요): ' + id); process.exit(1); }
    Object.assign(item, { c, t: cc.topic || '', e: cc.era || '', o: cc.old || '' });
    if (sim) (sims[sim] = sims[sim] || []).push(item);
    (units[unit] = units[unit] || []).push(item);
  });
}
// 쓰지 않는 예전 파일 정리
for (const f of fs.readdirSync(path.join(outDir, 'q'))) if (!wanted.has(f)) fs.unlinkSync(path.join(outDir, 'q', f));
for (const f of fs.readdirSync(outDir)) if (/\.(bin|json)$/.test(f) && f !== 'index.json' && !sims[f.replace(/\.(bin|json)$/, '')] && !/^u_/.test(f)) fs.unlinkSync(path.join(outDir, f));
const index = { v: 2, iter: ITER, salt: salt.toString('base64'), sims: {}, units: {} };
const order = (x, y) => y.year - x.year || (x.sub < y.sub ? -1 : x.sub > y.sub ? 1 : 0) || (x.id < y.id ? -1 : 1);
for (const sim of Object.keys(sims).sort()) {
  const list = sims[sim].sort(order).map(({ id, src, a, c, t, e, o }) => ({ id, src, a, c, t, e, o }));
  fs.writeFileSync(path.join(outDir, sim + '.bin'), seal(Buffer.from(JSON.stringify(list), 'utf8')));
  index.sims[sim] = list.length;
}
for (const u of Object.keys(U.units)) {
  const list = (units[u] || []).sort(order).map(({ id, src, a, s, c, t, e, o }) => ({ id, src, a, s, c, t, e, o }));
  const f = path.join(outDir, 'u_' + u + '.bin');
  if (list.length) { fs.writeFileSync(f, seal(Buffer.from(JSON.stringify(list), 'utf8'))); index.units[u] = list.length; } else if (fs.existsSync(f)) fs.unlinkSync(f);
}
fs.writeFileSync(idxPath, JSON.stringify(index));
console.log(`완료: 시뮬레이션 ${Object.keys(sims).length}개, 문항 ${wanted.size}개` + (skipped ? ` (정답이 없어 뺀 문항 ${skipped}개)` : ''));
