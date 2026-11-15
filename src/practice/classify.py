# 문항마다 2022 개정 성취기준(new), 주제(topic), 출제 당시 교육과정(era)·성취기준(old)을 붙여 src/practice/codes.json 을 만듭니다.
# 사용: python3 src/practice/classify.py [문항 그림 폴더(기본 practice-src/cut)]
#
# 1순위: codes_detail.json (선생님이 정한 수능 분류), codes_mock.json (6월·9월 모의평가 분류). 이 프로그램은 두 파일을 고치지 않습니다.
# 2순위: 두 파일에 없는 문항만 아래 규칙으로 분류합니다(모의평가는 draft_mock.py로 초안을 먼저 만드는 것이 좋습니다).
#        근거: map.json의 시뮬레이션, 출처 과목(Ⅰ/Ⅱ), 학년도, 해설 제목·문제 글에 나오는 낱말.
# 마지막: codes_fix.json 에 {"p1_2024_11_05": {"new": "12역학03-02", "topic": "..."}} 처럼 적은 것이 위의 모든 것보다 우선합니다.
# 문항 id = 과목_학년도_월_번호 (월: 06, 09, 11=수능)
import json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '..', '..')
cut = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'practice-src', 'cut')
MAP = json.load(open(os.path.join(here, 'map.json'), encoding='utf-8'))
DETAIL = {}
for f in ('codes_mock.json', 'codes_detail.json'):   # 모의평가 분류(draft_mock.py 초안을 검토한 것), 수능 분류(선생님)
    if not os.path.exists(os.path.join(here, f)): continue
    for k, v in json.load(open(os.path.join(here, f), encoding='utf-8')).items():
        if k.startswith('_'): continue
        p = k.split('_'); DETAIL['_'.join(p[:2] + ['11'] + p[2:]) if len(p) == 3 else k] = v   # 예전 형식(p1_2024_05)은 수능으로 본다
FIX = json.load(open(os.path.join(here, 'codes_fix.json'), encoding='utf-8')) if os.path.exists(os.path.join(here, 'codes_fix.json')) else {}

def has(t, *words): return any(w in t for w in words)

def new_code(sim, one, t):
    """2022 개정 성취기준. one: 물리Ⅰ(물리학Ⅰ) 출처이면 True"""
    wave_particle = has(t, '물질파', '이중성', '드브로이', '데이비슨', '전자선', '전자 현미경', '전자현미경')
    if sim == 'torque': return '12물리01-01'
    if sim == 'forces':
        if not one: return '12역학01-01'
        if has(t, '작용 반작용', '작용반작용', '반작용'): return '12물리01-03'
        if has(t, '평형'): return '12물리01-01'
        return '12물리01-02'
    if sim == 'accel': return '12물리01-02'
    if sim == 'collision': return '12물리01-03'
    if sim == 'energy': return '12물리01-05' if has(t, '열과 일', '줄의 실험', '열의 일당량') else '12물리01-04'
    if sim == 'circuit': return '12물리02-02'
    if sim == 'magnet': return '12물리02-04'
    if sim == 'motor': return '12물리02-05'
    if sim == 'capacitor': return '12물리02-03' if has(t, '자판', '센서') else '12전자01-06'
    if sim == 'induction': return '12물리02-06' if one else '12전자01-05'
    if sim == 'slit':
        if wave_particle: return '12물리03-03' if one else '12전자03-01'
        return '12물리03-01' if one else '12전자02-01'
    if sim == 'optics':
        if one or (has(t, '굴절') and not has(t, '렌즈', '거울')): return '12물리03-02'
        return '12전자02-02'
    if sim == 'photoelectric': return '12물리03-03' if one else '12전자02-04'
    if sim == 'spectrum': return '12물리03-04'
    if sim == 'diode': return '12전자01-07' if (not one or has(t, '트랜지스터')) else '12물리03-05'
    if sim == 'relativity': return '12물리03-06'
    if sim == 'projectile': return '12역학01-02'
    if sim == 'circular': return '12역학01-03'
    if sim == 'orbit': return '12역학01-05' if has(t, '탈출') else '12역학01-04'
    if sim == 'equivalence': return '12역학01-06'
    if sim == 'heating': return '12역학02-02'
    if sim == 'gas': return '12역학02-02' if has(t, '상태 방정식', '상태방정식', '분자 운동', '분자운동', '열과 온도', '맥스웰') else '12역학02-03'
    if sim == 'engine': return '12역학02-04'
    return {'shm': '12역학03-01', 'wave': '12역학03-02', 'doppler': '12역학03-03', 'soundinterf': '12역학03-04', 'standing': '12역학03-05',
            'efield': '12전자01-01', 'charging': '12전자01-02', 'bfield': '12전자01-03', 'lorentz': '12전자01-04',
            'polarization': '12전자02-03', 'laser': '12전자02-05', 'tunnel': '12전자03-03', 'atom': '12전자03-04', 'qubit': '12전자03-02'}[sim]

def old_code(sim, one, year, t):
    """출제 당시 교육과정의 성취기준. 2013학년도까지(7차)는 받은 자료가 없어 비워 둔다."""
    wp = has(t, '물질파', '이중성', '드브로이', '데이비슨', '전자선')
    if year >= 2021:   # 2015 개정
        if one:
            c = {'accel': '01-02', 'energy': '01-06', 'engine': '01-07', 'gas': '01-07', 'relativity': '01-09', 'efield': '02-01', 'spectrum': '02-02',
                 'bfield': '02-05', 'magnet': '02-06', 'induction': '02-07', 'wave': '03-01', 'soundinterf': '03-04', 'photoelectric': '03-05'}.get(sim)
            if sim == 'forces': c = '01-03' if has(t, '반작용') else '01-02'
            if sim == 'collision': c = '01-05' if has(t, '충격량') else '01-04'
            if sim == 'diode': c = '02-03' if has(t, '에너지띠', '전도도', '전기 전도') else '02-04'
            if sim == 'optics': c = '03-02' if has(t, '전반사', '광섬유', '광통신') else '03-01'
            if sim == 'slit': c = '03-06' if wp else '03-04'
            return '12물리Ⅰ' + c if c else ''
        c = {'forces': '01-01', 'torque': '01-02', 'circular': '01-05', 'orbit': '01-06', 'shm': '01-10', 'efield': '02-01', 'circuit': '02-03', 'diode': '02-04',
             'bfield': '02-06', 'induction': '02-07', 'doppler': '03-02', 'optics': '03-04', 'photoelectric': '03-06', 'atom': '03-08', 'spectrum': '03-08'}.get(sim)
        if sim == 'projectile': c = '01-04' if has(t, '포물선') else '01-03'
        if sim == 'equivalence': c = '01-08' if has(t, '블랙홀', '중력 렌즈', '에딩턴', '일식') else '01-07'
        if sim == 'energy': c = '01-11' if has(t, '열과 일', '줄의 실험') else '01-09'
        if sim == 'slit': c = '03-07' if wp else '03-05'
        return '12물리Ⅱ' + c if c else ''
    if year >= 2014:   # 2009 개정
        if one:
            c = {'energy': '(1)(가)⑤', 'forces': '(1)(가)④', 'orbit': '(1)(나)①', 'relativity': '(1)(나)②', 'efield': '(2)(가)①', 'charging': '(2)(가)②', 'bfield': '(2)(가)③',
                 'spectrum': '(2)(나)①', 'standing': '(3)(가)②', 'motor': '(3)(가)③', 'photoelectric': '(3)(가)④', 'optics': '(3)(나)③', 'engine': '(4)(나)⑤', 'gas': '(4)(나)⑤', 'torque': '(4)(나)②'}.get(sim)
            if sim == 'accel': c = '(1)(가)④' if has(t, '가속도 법칙', '뉴턴', '운동 법칙') else '(1)(가)③'
            if sim == 'magnet': c = '(2)(나)④' if has(t, '초전도') else '(2)(가)④'
            if sim == 'induction': c = '(4)(가)②' if has(t, '변압기', '전력', '송전', '변전') else '(2)(가)⑤'
            if sim == 'diode': c = '(2)(나)②' if has(t, '에너지띠') else '(2)(나)③'
            return '물리Ⅰ ' + c if c else ''
        c = {'accel': '(1)(가)①', 'forces': '(1)(가)②', 'projectile': '(1)(가)③', 'circular': '(1)(가)③', 'shm': '(1)(가)⑥', 'heating': '(1)(나)①', 'efield': '(2)(가)①',
             'capacitor': '(2)(나)⑦', 'bfield': '(2)(나)①', 'induction': '(2)(나)③', 'wave': '(3)(가)①', 'soundinterf': '(3)(가)③', 'standing': '(3)(가)③', 'doppler': '(3)(가)④',
             'optics': '(3)(나)①', 'laser': '(3)(나)③', 'photoelectric': '(4)(가)②', 'atom': '(4)(나)①', 'tunnel': '(4)(나)④', 'spectrum': '(4)(나)②'}.get(sim)
        if sim == 'gas': c = '(1)(나)③' if has(t, '상태 방정식', '상태방정식') else '(1)(나)②' if has(t, '분자', '열과 온도') else '(1)(나)④'
        if sim == 'lorentz': c = '(2)(나)②' if has(t, '도선') else '(2)(나)④'
        if sim == 'slit': c = '(4)(가)③' if wp else '(3)(가)③'
        return '물리Ⅱ ' + c if c else ''
    return ''

def era_of(year): return '2015 개정' if year >= 2021 else '2009 개정' if year >= 2014 else '7차'

out = {}; by_rule = []
for exam in sorted(k for k in MAP if re.match(r'^p[12]_\d{4}_\d{2}$', k)):
    sub, ys, mm = exam.split('_'); year = int(ys); one = sub == 'p1'; info = None
    for i, sim in enumerate(MAP[exam]):
        qid = f'{exam}_{i + 1:02d}'
        if qid in DETAIL:
            d = DETAIL[qid]; c = {k: d.get(k, '') for k in ('new', 'topic', 'era', 'old')}
            c.update({k: d[k] for k in ('배점', '정답률') if k in d})   # 학생 화면에 "배점 3점, 정답률 47%"
        else:
            if info is None: info = json.load(open(os.path.join(cut, exam, 'info.json'), encoding='utf-8'))
            n = str(i + 1); title = info['titles'].get(n, '')
            if year < 2012 or re.search(r'[㐀-䶿]', title): title = ''   # 제목이 없거나 글자가 깨진 회차
            t = title + ' ' + info['texts'].get(n, '')[:260]
            c = {'new': new_code(sim, one, t) if sim else '미분류', 'topic': '', 'era': era_of(year), 'old': old_code(sim, one, year, t) if sim else ''}
            by_rule.append(qid)
        c.update(FIX.get(qid, {})); out[qid] = c
json.dump(out, open(os.path.join(here, 'codes.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
from collections import Counter
cnt = Counter(v['new'] for v in out.values())
for k in sorted(cnt): print(k, cnt[k])
print('문항', len(out), '/ codes_detail·codes_mock에서', len(out) - len(by_rule), '/ 규칙으로 분류', len(by_rule))
if by_rule: print('규칙으로 분류한 문항(주제 없음, 확인 필요):', ' '.join(by_rule))
