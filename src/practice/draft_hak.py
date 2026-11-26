# 학력평가(교육청) 회차의 분류 초안을 만듭니다.
# 사용: python3 src/practice/draft_hak.py [--show] <cut 폴더> <회차> [<회차> ...]   예) practice-src/cut_hak p2_2025_10
#       python3 src/practice/draft_hak.py --fix <cut 폴더> <검토.json>            {"p2_2025_10_02": "주제"} 또는 {id: [주제, 메모]}
# 준비: pip install scikit-learn  (cut 폴더에 extract_hak.py가 만든 info.json이 있어야 함)
#
# 방법: 학력평가 해설에는 문항마다 "[출제의도] 전류에 의한 자기장을 이해한다." 줄이 있습니다.
#       수능·모의평가 분류(codes_detail.json, codes_mock.json)에 적힌 해설 제목(title) 약 1,600개로 '제목 → 주제' 모형을 배우고,
#       [출제의도] 줄과 문제 첫머리로 주제를 고릅니다. 그 주제의 성취기준·시뮬레이션·당시 성취기준은 수능에서 같은 과목이 받은 것(다수결).
# 결과: codes_mock.json 에 문항 추가(이미 있는 문항은 건드리지 않음), map.json 에 회차 줄 추가.
#       check 칸이 "자동 분류(확신 0.42 …)"이면 사람이 아직 보지 않은 것.
import json, os, re, sys, collections
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

here = os.path.dirname(os.path.abspath(__file__))
load = lambda f: json.load(open(os.path.join(here, f), encoding='utf-8'))
D = {k: v for k, v in load('codes_detail.json').items() if not k.startswith('_')}
U = load('units.json'); MAP = load('map.json')
MOCK_F = os.path.join(here, 'codes_mock.json'); MOCK = json.load(open(MOCK_F, encoding='utf-8'))
M = {k: v for k, v in MOCK.items() if not k.startswith('_')}

def sim_of(qid):
    ex, n = qid[:10], int(qid[-2:]); return (MAP.get(ex) or [''] * 20)[n - 1]
def era_of(year): return '2015 개정' if year >= 2021 else '2009 개정' if year >= 2014 else '7차'
def clean(t):
    t = re.sub(r'\s+', ' ', re.sub(r'^\d{1,2}\.\s*', '', t or '')).strip()
    return re.split(r'(?<=한다)\.|(?<=하기)(?=\s)|\s\[|\sㄱ\s?[.,]|\s[A-Z가-힣]{1,3}\s?[,:]\s', t)[0].strip()
def tdoc(sub, title, text=''):
    # 출제의도 줄의 끝말("…을 이해한다", "…하기")은 주제와 상관없어 뺀다
    title = re.sub(r'(을|를)?\s*(이해|분석|적용|설명|탐구|파악|비교|계산|구)(한다|하기|할 수 있다)\.?$', '', clean(title))
    return sub + ' ' + re.sub(r'\s+', '', (title + ' ') * 3 + text[:120])

# 수능·모의평가에서 배우기
NEW, SIM, OLD = (collections.defaultdict(collections.Counter) for _ in range(3))
for k, v in D.items():
    sub = k[:2]; NEW[(sub, v['topic'])][v['new']] += 1; NEW[v['topic']][v['new']] += 1
    s = sim_of(k)
    if s: SIM[(sub, v['topic'])][s] += 1; SIM[v['topic']][s] += 1
    if v['old']: OLD[(v['era'], sub, v['topic'])][v['old']] += 1
def top(c): return c.most_common(1)[0][0] if c else ''
train = [(k[:2], v['title'], v['topic']) for k, v in {**D, **M}.items() if v.get('title') and not re.search(r'[-]', v['title'])]
vec = TfidfVectorizer(analyzer='char', ngram_range=(2, 4), sublinear_tf=True, min_df=1)
clf = LogisticRegression(C=20, max_iter=4000)
clf.fit(vec.fit_transform([tdoc(s, t) for s, t, _ in train]), np.array([t for _, _, t in train]))
KNOWN = {v['topic'] for v in D.values()}

def entry(ex, n, t, check, info):
    sub, year = ex[:2], int(ex[3:7]); era = era_of(year)
    new = top(NEW[(sub, t)]) or top(NEW[t]); area = U['units'][U['prefix'][new[:6]]] if new != '미분류' else ['미분류', '미분류']
    title = clean(info['titles'].get(str(n), ''))[:60]
    old = top(OLD[(era, sub, t)]) if era != '7차' else ''
    pt = 3 if re.search(r'\[\s*3\s*점', info['texts'].get(str(n), '')) else 2
    return {'era': era, 'old': old, 'new': new, 'area': area, 'topic': t, 'title': title, 'check': check, '배점': pt, '난이도': '', 'sim': top(SIM[(sub, t)]) or top(SIM[t])}

def draft(cut, ex):
    info = json.load(open(os.path.join(cut, ex, 'info.json'), encoding='utf-8')); out = {}
    docs = [tdoc(ex[:2], info['titles'].get(str(n), ''), re.sub(r'①.*', '', info['texts'].get(str(n), ''))) for n in range(1, 21)]
    P = clf.predict_proba(vec.transform(docs))
    for n in range(1, 21):
        p = P[n - 1]; o = p.argsort()[::-1]
        out[f'{ex}_{n:02d}'] = entry(ex, n, clf.classes_[o[0]], f'자동 분류(확신 {p[o[0]]:.2f}, 다음 후보: {clf.classes_[o[1]]})', info)
    return out

def save():
    keys = sorted(k for k in MOCK if not k.startswith('_'))
    json.dump({'_설명': MOCK['_설명'], **{k: MOCK[k] for k in keys}}, open(MOCK_F, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    mk = sorted(k for k in MAP if not k.startswith('_'))
    lines = ['{', '  "_설명": ' + json.dumps(MAP['_설명'], ensure_ascii=False) + ','] + \
            [f'  "{k}": ' + json.dumps(MAP[k], ensure_ascii=False) + (',' if i < len(mk) - 1 else '') for i, k in enumerate(mk)] + ['}']
    open(os.path.join(here, 'map.json'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')

if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['--fix']:
        cut = args[1]; fixes = json.load(open(args[2], encoding='utf-8'))
        for k, v in fixes.items():
            t, memo = (v, '검토함') if isinstance(v, str) else v
            if t not in KNOWN: sys.exit('없는 주제입니다: ' + k + ' ' + t)
            info = json.load(open(os.path.join(cut, k[:10], 'info.json'), encoding='utf-8'))
            e = entry(k[:10], int(k[-2:]), t, memo, info); MAP[k[:10]][int(k[-2:]) - 1] = e.pop('sim')
            old = MOCK.get(k, {}); e['배점'] = old.get('배점', e['배점']); MOCK[k] = e
        save(); sys.exit()
    show = args[:1] == ['--show']; args = args[1:] if show else args
    cut, exams = args[0], args[1:]
    for ex in exams:
        if not re.match(r'^p[12]_\d{4}_(03|04|05|07|10)$', ex): sys.exit('학력평가 회차 이름은 p2_2025_10 형식입니다: ' + ex)
        d = draft(cut, ex)
        if show:
            for k, v in d.items(): print(k, v['topic'], '|', v['new'], v['sim'] or '-', v['check'], '|', v['title'])
            continue
        sims = MAP.get(ex) or [''] * 20; added = 0
        for k, v in d.items():
            if k in MOCK: continue
            sims[int(k[-2:]) - 1] = v.pop('sim'); MOCK[k] = v; added += 1
        MAP[ex] = sims; print(ex, '새로 넣은 문항', added)
    if not show: save()
