# 수능 문제지·해설 PDF에서 문항별 그림을 잘라냅니다.
# 사용: python3 src/practice/extract.py <원본 폴더> <출력 폴더>
#   원본 폴더: p1/d1(문제) p1/d2(정답) p1/d3(해설), p2/... 구조. 파일 이름은 p1_2026_11.pdf 형식.
#   출력 폴더: <과목>_<학년도>_<월>/q01.webp, e01.webp, info.json(정답, 문항 글자)
import sys, os, re, json, glob, io
import pymupdf
from PIL import Image, ImageChops

DPI = 125
CIRC = '①②③④⑤'

def trim(img, pad=6):
    g = img.convert('L'); bg = Image.new('L', g.size, 255)
    box = ImageChops.difference(g, bg).point(lambda v: 255 if v > 40 else 0).getbbox()
    if not box: return img
    return img.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad)))

def strip_footer(img):
    """쪽 아래의 꼬리선과 그 아래(쪽 번호, 로고)를 잘라낸다: 아래쪽 22% 안에 있는 가로로 긴 선을 찾는다."""
    px = img.load(); n = len(range(0, img.width, 2))
    for yy in range(int(img.height * 0.78), img.height):
        if sum(1 for xx in range(0, img.width, 2) if px[xx, yy] < 225) > n * 0.8: return img.crop((0, 0, img.width, max(1, yy - 2)))
    return img

def render(page, rect):
    pm = page.get_pixmap(dpi=DPI, clip=rect, colorspace=pymupdf.csGRAY)
    return Image.open(io.BytesIO(pm.tobytes('png'))).convert('L')

def save(img, path):
    img.save(path, 'WEBP', quality=55, method=6)

def markers(doc, cols, top_skip=0.0, bottom=0.94):
    """문항 번호(1.~20.)의 위치를 찾는다. 반환: [(n, page, col, y 위, y 아래, x)]"""
    cand = []
    for pi, page in enumerate(doc):
        W, H = page.rect.width, page.rect.height
        words = page.get_text('words')
        body = [w for w in words if H * 0.05 < w[1] < H * bottom]
        for c in range(cols):
            x0, x1 = W * c / cols, W * (c + 1) / cols
            # 오른쪽 단의 번호가 가운데 선보다 조금 왼쪽에 찍힌 회차가 있어 12pt 여유를 둔다
            cw = [w for w in body if x0 - (12 if c else 0) <= w[0] < x1 - (12 if c < cols - 1 else 0)]
            if not cw: continue
            xs = sorted(w[0] for w in cw); left = xs[max(0, len(xs) // 50)]
            for w in cw:
                m = re.match(r'^(\d{1,2})\.', w[4])
                if m and w[0] - left < 14 and (pi > 0 or c > 0 or w[1] > H * top_skip):
                    # 정답 목록("1. ③")은 문항 번호가 아니다
                    head = '답' in w[4] or any(v[4] == '답' and abs(v[1] - w[1]) < 4 and 0 < v[0] - w[0] < 30 for v in cw)   # "1. 답 ④" 모양의 해설 머리
                    if not head and (any(v[4][:1] in CIRC and abs(v[1] - w[1]) < 4 and 0 < v[0] - w[0] < 45 for v in cw) or w[4][-1:] in CIRC): continue
                    cand.append((int(m.group(1)), pi, c, w[1], w[3], w[0]))
    cand.sort(key=lambda t: (t[1], t[2], t[3]))
    out, need, i = [], 1, 0
    for t in cand:
        if t[0] == need: out.append(t); need += 1
        if need > 20: break
    return out

def cut_questions(pdf, outdir):
    doc = pymupdf.open(pdf); mk = markers(doc, 2)
    texts = {}
    if len(mk) != 20: return len(mk), texts
    for k, (n, pi, c, y0, _, mx) in enumerate(mk):
        page = doc[pi]; W, H = page.rect.width, page.rect.height
        nxt = mk[k + 1] if k + 1 < 20 else None
        y1 = nxt[3] - 3 if nxt and nxt[1] == pi and nxt[2] == c else H * 0.945
        gap = W * 0.006
        rect = pymupdf.Rect(min(W * c / 2 + gap, mx - 2) if c else W * 0.03, y0 - 4, W * (c + 1) / 2 - (gap if not c else W * 0.03), y1)
        img = render(page, rect)
        # 선택지(⑤) 아래로 큰 여백이 나오면 그 뒤(쪽 번호, 확인 사항 등)는 버린다
        fives = [w[3] for w in page.get_text('words', clip=rect) if w[4][:1] == '⑤']
        if fives:
            sc = DPI / 72; start = min(int((max(fives) - rect.y0) * sc), img.height); px = img.load()
            ink = [sum(1 for xx in range(0, img.width, 2) if px[xx, yy] < 130) >= 2 for yy in range(img.height)]
            last = max([yy for yy in range(img.height) if ink[yy]] or [0]); run = 0
            for yy in range(start, img.height):
                if not ink[yy]: run += 1; continue
                # 여백이 크거나, 여백 뒤에 남은 것이 작은 덩어리(쪽 번호 상자, 저작권 문구)이면 거기서 자른다
                if run >= 28 or (run >= 10 and last - yy < 100): img = img.crop((0, 0, img.width, yy - run + 8)); break
                run = 0
        save(trim(img), os.path.join(outdir, f'q{n:02d}.webp'))
        texts[n] = re.sub(r'\s+', ' ', page.get_text('text', clip=rect)).strip()
    return 20, texts

def gap_markers(doc):
    """본문이 글자로 읽히지 않는 한 단짜리 해설(2012학년도 6월 등): 문항 사이의 넓은 빈 줄(보통 줄 간격의 두 배쯤)로 나눈다.
    첫 쪽은 '해설' 머리 아래부터. 20문항이 모자라면 아래 여백이 큰 쪽부터 '다음 쪽 첫 줄이 새 문항'으로 본다. 반환 모양은 markers와 같다."""
    sure, maybe = [], []; sc = DPI / 72; prev = None   # prev: (앞 쪽 아래 여백)
    for pi, page in enumerate(doc):
        W, H = page.rect.width, page.rect.height; top = H * 0.06
        if pi == 0:
            hs = [w[3] for w in page.get_text('words') if w[4] == '해설']
            if not hs: return []
            top = max(hs) + 2
        img = render(page, pymupdf.Rect(W * 0.1, top, W * 0.92, H * 0.925)); px = img.load()
        ink = [sum(1 for x in range(0, img.width, 2) if px[x, y] < 140) >= 2 for y in range(img.height)]
        first = next((y for y in range(img.height) if ink[y]), None)
        if first is None: continue
        mk = lambda y: (pi, 0, top + y / sc, top + y / sc + 12, W * 0.1)
        if pi == 0: sure.append(mk(first))
        elif prev is not None: maybe.append((prev, mk(first)))
        last = max(y for y in range(img.height) if ink[y]); y = first
        while y < last:
            if ink[y]: y += 1; continue
            s0 = y
            while not ink[y]: y += 1
            if y - s0 >= 36: sure.append(mk(y))
        prev = img.height - last
    need = 20 - len(sure)
    if need < 0 or need > len(maybe): return []
    sure += [m for _, m in sorted(maybe, key=lambda t: -t[0])[:need]]
    return [(n + 1,) + m for n, m in enumerate(sorted(sure, key=lambda m: (m[0], m[2])))]

def cut_explanations(pdf, outdir):
    doc = pymupdf.open(pdf); cols = 2 if doc[0].rect.width > doc[0].rect.height else 1
    mk = markers(doc, cols, top_skip=0.12 if cols == 1 else 0.25, bottom=0.95)
    if len(mk) != 20 and cols == 1: mk = gap_markers(doc)
    titles = {}
    if len(mk) != 20: return len(mk), titles
    regions = [(p, c) for p in range(len(doc)) for c in range(cols)]
    for k, (n, pi, c, y0, yb, _) in enumerate(mk):
        nxt = mk[k + 1] if k + 1 < 20 else None
        end = (nxt[1], nxt[2]) if nxt else regions[-1]; end_y = nxt[3] - 3 if nxt else None
        parts = []
        for (p, cc) in regions[regions.index((pi, c)):regions.index(end) + 1]:
            page = doc[p]; W, H = page.rect.width, page.rect.height
            a = y0 - 4 if (p, cc) == (pi, c) else H * 0.06
            b = end_y if ((p, cc) == end and end_y is not None) else H * 0.925
            if b - a < 6: continue
            x0 = W * cc / cols + (W * 0.04 if cc == 0 else W * 0.005); x1 = W * (cc + 1) / cols - (W * 0.04 if cc == cols - 1 else W * 0.005)
            im = render(page, pymupdf.Rect(x0, a, x1, b))
            if not ((p, cc) == end and end_y is not None): im = strip_footer(im)
            im = trim(im)
            if im.height > 12: parts.append(im)
        if not parts: continue
        w = max(p.width for p in parts); h = sum(p.height for p in parts)
        canvas = Image.new('L', (w, h), 255); y = 0
        for p in parts: canvas.paste(p, (0, y)); y += p.height
        save(canvas, os.path.join(outdir, f'e{n:02d}.webp'))
        page = doc[pi]; W = page.rect.width
        tt = re.sub(r'\s+', ' ', page.get_text('text', clip=pymupdf.Rect(W * c / cols, y0 - 3, W * (c + 1) / cols, yb + 3))).strip()[:60]
        titles[n] = '' if re.search('[\ue000-\uf8ff]', tt) else tt   # 글꼴이 깨져 읽을 수 없는 제목은 버린다
    return 20, titles

def answers(expl_pdf, ans_file, sub):
    # a: 해설 첫머리의 정답 목록, b: 평가원 정답표
    t = pymupdf.open(expl_pdf)[0].get_text(); cut = re.search(r'해\s*설\s*[>\]]|\[정답', t[60:]); head = t[:60 + cut.start()] if cut else t[:500]
    a = [CIRC.index(ch) + 1 for ch in head if ch in CIRC]; a = a if len(a) == 20 else None
    if a is None:   # 해설마다 "1. 답 ④"가 붙은 모양
        found = dict((int(n), ('①②③④⑤'.find(c) + 1) or ('⑴⑵⑶⑷⑸'.find(c) + 1)) for n, c in re.findall(r'(?m)^\s*(\d{1,2})\.\s*답\s*([①②③④⑤⑴⑵⑶⑷⑸])', ''.join(pg.get_text() for pg in pymupdf.open(expl_pdf))))
        if len(found) == 20: a = [found[i] for i in range(1, 21)]
    b = None
    if ans_file and ans_file.endswith('.pdf'):
        for page in pymupdf.open(ans_file):
            tt = re.sub(r'\s+', ' ', page.get_text()); name = re.sub(r'\s', '', tt)[:200]
            want = 'Ⅱ' if sub == 'p2' else 'Ⅰ'
            if '물리' in name and (want + ')' in name or want + '과목' in name or '물리학' + want in name or '물리' + want in name or re.search('물리[^ⅠⅡ]{0,8}' + want, name)):
                found = dict((int(n), CIRC.index(c) + 1) for n, c in re.findall(r'(\d{1,2}) ?([①②③④⑤]) ?\d', tt))
                if len(found) >= 19: b = [found.get(i) for i in range(1, 21)]   # 전원 정답 처리된 문항은 None
                break
    return a, b

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    for sub in ['p1', 'p2']:
        for q in sorted(glob.glob(f'{src}/{sub}/d1/*.pdf')):
            name = os.path.basename(q)[:-4]; _, year, month = name.split('_')   # 월: 06, 09, 11(수능)
            od = os.path.join(out, f'{sub}_{year}_{month}'); os.makedirs(od, exist_ok=True)
            e = f'{src}/{sub}/d3/{name}.pdf'; af = (glob.glob(f'{src}/{sub}/d2/{name}.*') or [None])[0]
            nq, texts = cut_questions(q, od); ne, titles = cut_explanations(e, od); a, b = answers(e, af, sub)
            ok = '정답 없음!' if (a is None and b is None) else '한쪽만' if (a is None or b is None) else 'ok' if a == b else 'MISMATCH'
            json.dump({'answers': a, 'official': b, 'texts': texts, 'titles': titles}, open(os.path.join(od, 'info.json'), 'w'), ensure_ascii=False)
            print(f'{sub}_{year}_{month}: 문제 {nq}/20  해설 {ne}/20  정답 {ok} (해설 {"O" if a else "X"}, 정답표 {"O" if b else "X"})')
