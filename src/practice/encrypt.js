// 연습문제를 수업 코드로 암호화해서 site/practice/data/ 에 넣습니다.
// 사용:  PRACTICE_CODE=수업코드 node src/practice/encrypt.js
//
// 원본은 저장소 맨 위의 practice-src/ 폴더에 둡니다. 이 폴더는 .gitignore에 들어 있어 GitHub에 올라가지 않습니다.
//   practice-src/<시뮬레이션 이름>/problems.json
//   practice-src/<시뮬레이션 이름>/<그림 파일>
// problems.json 예:
//   [ { "src": "2025학년도 수능 물리학Ⅰ 7번", "img": "2025-sat-07.png", "answer": 3, "exp": "글로 쓴 해설(선택)", "expImg": "해설 그림(선택).png" },
//     { "src": "예시", "q": "글로 쓴 문제", "choices": ["가", "나", "다", "라", "마"], "answer": 2 } ]
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..', '..'), srcDir = path.join(root, 'practice-src'), outDir = path.join(root, 'site', 'practice', 'data');
const code = (process.env.PRACTICE_CODE || '').trim();
if (!code) { console.error('PRACTICE_CODE(수업 코드)를 지정하세요.'); process.exit(1); }
if (!fs.existsSync(srcDir)) { console.error('practice-src 폴더가 없습니다.'); process.exit(1); }
const ITER = 200000, MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.json')) fs.unlinkSync(path.join(outDir, f));
const index = {};
for (const sim of fs.readdirSync(srcDir).sort()) {
  const pj = path.join(srcDir, sim, 'problems.json'); if (!fs.existsSync(pj)) continue;
  if (!fs.existsSync(path.join(root, 'site', 'sim', sim))) { console.error('시뮬레이션 이름이 틀렸습니다: ' + sim); process.exit(1); }
  const items = JSON.parse(fs.readFileSync(pj, 'utf8')).map((it, k) => {
    if (!(it.answer >= 1 && it.answer <= 5)) throw new Error(`${sim} ${k + 1}번: answer는 1~5여야 합니다.`);
    const o = { src: it.src || '', answer: it.answer };
    if (it.q) o.q = it.q; if (it.choices) o.choices = it.choices; if (it.exp) o.exp = it.exp;
    for (const k of ['img', 'expImg']) if (it[k]) { const ip = path.join(srcDir, sim, it[k]), mime = MIME[path.extname(ip).toLowerCase()]; if (!mime) throw new Error('지원하지 않는 그림 형식: ' + it[k]);
      o[k] = 'data:' + mime + ';base64,' + fs.readFileSync(ip).toString('base64'); }
    return o; });
  if (!items.length) continue;
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), key = crypto.pbkdf2Sync(code, salt, ITER, 32, 'sha256');
  const c = crypto.createCipheriv('aes-256-gcm', key, iv), data = Buffer.concat([c.update(JSON.stringify({ items }), 'utf8'), c.final(), c.getAuthTag()]);
  fs.writeFileSync(path.join(outDir, sim + '.json'), JSON.stringify({ v: 1, iter: ITER, salt: salt.toString('base64'), iv: iv.toString('base64'), data: data.toString('base64') }));
  index[sim] = items.length; console.log(sim + ': ' + items.length + '문제');
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
console.log('완료: 시뮬레이션 ' + Object.keys(index).length + '개');
