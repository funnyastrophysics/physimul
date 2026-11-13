# 6월·9월 모의평가처럼 codes_detail.json(선생님 분류)에 없는 회차의 분류 초안을 만듭니다.
# 사용: python3 src/practice/draft_mock.py <회차> [<회차> ...]      예) p1_2027_06 p2_2027_09
#       python3 src/practice/draft_mock.py --show <회차>              초안만 화면에 보여 줌(파일은 그대로)
#       python3 src/practice/draft_mock.py --fix <검토.json>          검토한 주제 반영: {"p1_2027_06_02": "운동의 기술·그래프(직선)"} 또는 {id: [주제, 메모]}
# 준비: pip install scikit-learn  (practice-src/cut 에 수능과 해당 회차 그림·info.json이 있어야 함)
#
# 방법: 수능 760문항(codes_detail.json의 주제)으로 배운 글자 조각 모형이 해설 제목·문제 글을 보고 주제(topic)를 고르고,
#       그 주제를 수능에서 같은 과목이 받은 2022 성취기준·시뮬레이션·출제 당시 성취기준(다수결)을 붙입니다.
# 결과: src/practice/codes_mock.json (codes_detail.json과 같은 모양), src/practice/map.json 에 회차 줄 추가.
#       이미 codes_mock.json에 있는 문항은 건드리지 않습니다(검토한 내용 보호). 고친 내용은 codes_mock.json을 직접 고칩니다.
# check 칸: "자동 분류(확신 0.42)"처럼 남기므로, 확신이 낮은 문항부터 검토합니다.
import json, os, re, sys, collections
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '..', '..'); CUT = os.path.join(root, 'practice-src', 'cut')
load = lambda f: json.load(open(os.path.join(here, f), encoding='utf-8'))
D = {k: v for k, v in load('codes_detail.json').items() if not k.startswith('_')}
U = load('units.json'); MAP = load('map.json')
MOCK_F = os.path.join(here, 'codes_mock.json')
MOCK = json.load(open(MOCK_F, encoding='utf-8')) if os.path.exists(MOCK_F) else {'_설명': '6월·9월 모의평가 문항별 분류. 모양은 codes_detail.json과 같음. draft_mock.py가 초안을 만들고 검토한 뒤 직접 고침. check=확인 메모(학생 화면에 안 보임)'}
infos = {}
def info(ex):
    if ex not in infos: infos[ex] = json.load(open(os.path.join(CUT, ex, 'info.json'), encoding='utf-8'))
    return infos[ex]
def doc(ex, n):
    i = info(ex); t = re.sub(r'①.*', '', i['texts'].get(str(n), '')); ti = i['titles'].get(str(n), '')
    if re.search(r'[㐀-䶿一-鿿\ue000-\uf8ff]', ti): ti = ''   # 글꼴이 깨진 해설 제목은 쓰지 않는다
    return ex[:2] + ' ' + re.sub(r'\s+', '', (ti + ' ') * 3 + t)   # 해설 제목에 무게를 더 준다
def sim_of(qid):
    ex, n = qid[:10], int(qid[-2:]); return (MAP.get(ex) or [''] * 20)[n - 1]
def era_of(year): return '2015 개정' if year >= 2021 else '2009 개정' if year >= 2014 else '7차'

# 수능에서 배우기: 주제 → (과목별) 성취기준, 시뮬레이션, 출제 당시 성취기준
NEW, SIM, OLD = (collections.defaultdict(collections.Counter) for _ in range(3))
for k, v in D.items():
    sub, year = k[:2], int(k[3:7]); NEW[(sub, v['topic'])][v['new']] += 1; NEW[v['topic']][v['new']] += 1
    s = sim_of(k)
    if s: SIM[(sub, v['topic'])][s] += 1; SIM[v['topic']][s] += 1
    if v['old']: OLD[(v['era'], sub, v['topic'])][v['old']] += 1
def top(c): return c.most_common(1)[0][0] if c else ''
vec = TfidfVectorizer(analyzer='char', ngram_range=(2, 4), sublinear_tf=True, min_df=2)
ids = list(D); clf = LogisticRegression(C=20, max_iter=3000)
clf.fit(vec.fit_transform([doc(k[:10], int(k[-2:])) for k in ids]), np.array([D[k]['topic'] for k in ids]))

def entry(ex, n, t, check):
    """주제 t로 문항 하나의 분류를 만든다(성취기준·시뮬레이션·당시 성취기준은 수능에서 그 주제가 받은 것)."""
    sub, year = ex[:2], int(ex[3:7]); era = era_of(year)
    new = top(NEW[(sub, t)]) or top(NEW[t]); area = U['units'][U['prefix'][new[:6]]] if new != '미분류' else ['미분류', '미분류']
    title = info(ex)['titles'].get(str(n), '')
    if re.search(r'[㐀-䶿一-鿿\ue000-\uf8ff]', title): title = ''
    title = re.sub(r'^\d{1,2}\.\s*', '', title) if re.match(r'^\d{1,2}\.\s*\S', title) and len(title) < 40 else ''
    old = top(OLD[(era, sub, t)]) if era != '7차' else ''
    if old == '[12물리Ⅰ01-04]' and '충격량' in title: old = '[12물리Ⅰ01-05]'   # 2015 물리학Ⅰ: 01-04 운동량 보존, 01-05 충격량
    return {'era': era, 'old': old, 'new': new, 'area': area, 'topic': t, 'title': title, 'check': check, 'sim': top(SIM[(sub, t)]) or top(SIM[t])}

def draft(ex):
    out = {}; P = clf.predict_proba(vec.transform([doc(ex, n) for n in range(1, 21)]))
    for n in range(1, 21):
        p = P[n - 1]; o = p.argsort()[::-1]
        out[f'{ex}_{n:02d}'] = entry(ex, n, clf.classes_[o[0]], f'자동 분류(확신 {p[o[0]]:.2f}, 다음 후보: {clf.classes_[o[1]]})')
    return out

def set_topics(fixes):
    """검토 결과 반영: {문항 id: 주제} 또는 {문항 id: [주제, 확인 메모]}. 주제는 codes_detail.json에 있는 이름이어야 한다."""
    known = {v['topic'] for v in D.values()}
    for k, v in fixes.items():
        t, memo = (v, '') if isinstance(v, str) else v
        if t not in known: sys.exit('없는 주제입니다: ' + k + ' ' + t)
        e = entry(k[:10], int(k[-2:]), t, memo); sims = MAP[k[:10]]; sims[int(k[-2:]) - 1] = e.pop('sim'); MOCK[k] = e

if __name__ == '__main__':
    args = sys.argv[1:]; show = args[:1] == ['--show']; exams = [a for a in args if not a.startswith('--')]
    if args[:1] == ['--fix']:   # python3 draft_mock.py --fix 검토.json   ({"p1_2027_06_02": "운동의 기술·그래프(직선)", ...})
        set_topics(json.load(open(args[1], encoding='utf-8'))); exams = []
    for ex in exams:
        if not re.match(r'^p[12]_\d{4}_(06|09)$', ex): sys.exit('회차 이름은 p1_2027_06 형식(6월 06, 9월 09)으로 적으세요: ' + ex)
        d = draft(ex)
        if show:
            for k, v in d.items(): print(k, v['topic'], v['new'], v['sim'] or '-', v['check'], '|', v['title'])
            continue
        sims = MAP.get(ex) or [''] * 20; added = 0
        for k, v in d.items():
            if k in MOCK: continue
            sims[int(k[-2:]) - 1] = v.pop('sim'); MOCK[k] = v; added += 1
        MAP[ex] = sims; print(ex, '새로 넣은 문항', added)
    if not show:
        keys = sorted(k for k in MOCK if not k.startswith('_'))
        json.dump({'_설명': MOCK['_설명'], **{k: MOCK[k] for k in keys}}, open(MOCK_F, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        mk = sorted(k for k in MAP if not k.startswith('_'))
        lines = ['{', '  "_설명": ' + json.dumps(MAP['_설명'], ensure_ascii=False) + ','] + \
                [f'  "{k}": ' + json.dumps(MAP[k], ensure_ascii=False) + (',' if i < len(mk) - 1 else '') for i, k in enumerate(mk)] + ['}']
        open(os.path.join(here, 'map.json'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
