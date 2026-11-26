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
//   data/u_<영역>.bin     : 문항 목록 [{ id, src, a, s, c, t, e, o, p, r }]  (암호화) s=시뮬레이션, c=2022 성취기준, t=주제, e=출제 당시 교육과정, o=당시 성취기준, p=배점, r=정답률(2016학년도~)
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
// 학력평가(교육청, 4·5·7·10월): "2025학년도 10월 학력평가(2024년 10월 시행)"
// 파일 이름의 달과 문제지의 달이 다른 회차(4월 시험을 5월에 치르는 등): 문제지에 적힌 이름과 실제 시행 달
const EXAM_FIX = { 'p2_2021_05': [4, 5], 'p2_2024_05': [4, 4], 'p1_2021_04': [3, 4], 'p1_2021_05': [4, 5], 'p1_2024_05': [4, 4] };
const exam_name = (mm, year, exam) => ({ '06': '6월 모의평가', '09': '9월 모의평가', '11': '수능' })[mm] || (([a, b]) => `${a}월 학력평가(${year - 1}년 ${b}월 시행)`)(EXAM_FIX[exam] || [+mm, +mm]);
function open_(buf) { const d = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12)); d.setAuthTag(buf.subarray(buf.length - 16)); return Buffer.concat([d.update(buf.subarray(12, buf.length - 16)), d.final()]); }
// 이미 올라가 있는 문항: 원본 그림(cut 폴더)이 없는 회차는 암호화된 파일과 정답을 그대로 다시 쓴다(기존 문항은 바뀌지 않음).
// 동시에 수업 코드 확인: 지금 코드로 기존 목록이 열리지 않으면 멈춘다(다른 코드로 전부 다시 잠그는 사고 방지).
const PREV = {};
for (const f of fs.existsSync(outDir) ? fs.readdirSync(outDir) : []) if (/^u_.*\.bin$/.test(f)) {
  let list; try { list = JSON.parse(open_(fs.readFileSync(path.join(outDir, f))).toString('utf8')); } catch (e) { console.error('수업 코드가 기존 문제와 다릅니다. 멈춥니다: ' + f); process.exit(1); }
  list.forEach(x => { PREV[x.id] = x; });
}
const unitOf = c => c === '미분류' ? 'x' : U.prefix[c.slice(0, 6)];

const sims = {}, units = {}, wanted = new Set(); let skipped = 0;
for (const exam of Object.keys(map).filter(k => /^p[12]_\d{4}_\d{2}$/.test(k)).sort()) {
  const dir = path.join(cutDir, exam), keep = !fs.existsSync(dir);
  if (keep && !Object.keys(PREV).some(id => id.startsWith(exam + '_'))) { console.error('없는 회차: ' + exam); process.exit(1); }
  const info = keep ? {} : JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8'));
  const ans = keep ? Array.from({ length: 20 }, (_, i) => (PREV[`${exam}_${String(i + 1).padStart(2, '0')}`] || {}).a) : info.official || info.answers || manual[exam];
  if (!ans) { console.error('정답이 없습니다: ' + exam); process.exit(1); }
  const [sub, ys, mm] = exam.split('_'), year = +ys;
  map[exam].forEach((sim, i) => {
    const n = i + 1, a = ans[i];
    if (!(a >= 1 && a <= 5)) { skipped++; return; }   // 전원 정답 처리된 문항 등
    if (sim && !fs.existsSync(path.join(root, 'site', 'sim', sim))) { console.error('시뮬레이션 이름이 틀렸습니다: ' + sim); process.exit(1); }
    const nn = String(n).padStart(2, '0'), id = `${exam}_${nn}`;
    const file = path.join(outDir, 'q', id + '.bin');
    if (keep){ if (!fs.existsSync(file)) { console.error('기존 문항 파일이 없습니다: ' + id); process.exit(1); } }
    else {
      const q = fs.readFileSync(path.join(dir, `q${nn}.webp`)), e = fs.readFileSync(path.join(dir, `e${nn}.webp`));
      const head = Buffer.alloc(4); head.writeUInt32BE(q.length);
      fs.mkdirSync(path.join(outDir, 'q'), { recursive: true });
      const buf = seal(Buffer.concat([head, q, e]));
      if (!fs.existsSync(file) || !fs.readFileSync(file).equals(buf)) fs.writeFileSync(file, buf);
    }
    wanted.add(id + '.bin');
    const item = { id, src: `${year}학년도 ${exam_name(mm, year, exam)} ${subject(sub, year)} ${n}번`, a, year, sub, s: sim };
    const cc = CODES[id] || {}, c = cc.new, unit = c && unitOf(c);
    if (!unit || !U.codes[c]) { console.error('성취기준이 없습니다(classify.py를 먼저 실행하세요): ' + id); process.exit(1); }
    Object.assign(item, { c, t: cc.topic || '', e: cc.era || '', o: cc.old || '', p: cc['배점'], r: cc['정답률'] });
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
  const list = sims[sim].sort(order).map(({ id, src, a, c, t, e, o, p, r }) => ({ id, src, a, c, t, e, o, p, r }));
  fs.writeFileSync(path.join(outDir, sim + '.bin'), seal(Buffer.from(JSON.stringify(list), 'utf8')));
  index.sims[sim] = list.length;
}
for (const u of Object.keys(U.units)) {
  const list = (units[u] || []).sort(order).map(({ id, src, a, s, c, t, e, o, p, r }) => ({ id, src, a, s, c, t, e, o, p, r }));
  const f = path.join(outDir, 'u_' + u + '.bin');
  if (list.length) { fs.writeFileSync(f, seal(Buffer.from(JSON.stringify(list), 'utf8'))); index.units[u] = list.length; } else if (fs.existsSync(f)) fs.unlinkSync(f);
}
fs.writeFileSync(idxPath, JSON.stringify(index));
console.log(`완료: 시뮬레이션 ${Object.keys(sims).length}개, 문항 ${wanted.size}개` + (skipped ? ` (정답이 없어 뺀 문항 ${skipped}개)` : ''));
