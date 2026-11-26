# 학력평가(교육청) 물리Ⅱ 문제지·해설 PDF에서 문항별 그림을 잘라냅니다.
# 사용: python3 src/practice/extract_hak.py <원본 폴더> <출력 폴더> [회차 ...]
#   원본 폴더: p2/d1(문제) p2/d2(정답, pdf·png·jpg) p2/d3(해설). 파일 이름은 p2_2025_10.pdf 형식(학년도_월).
#   출력 폴더: p2_<학년도>_<월>/q01.webp, e01.webp, info.json
# extract.py와 다른 점
#   - 글자가 없는 쪽(스캔)은 tesseract(kor+eng)로 글자 위치를 읽는다. 결과는 <출력 폴더>/_ocr 에 저장해 다시 쓰지 않는다.
#   - 해설은 여러 과목이 이어진 책자이므로 "n. [출제의도]" 번호를 모두 찾고, 1~20이 이어지는 묶음 가운데
#     문제 글과 가장 비슷한 묶음을 물리Ⅱ로 고른다(물리Ⅰ·화학 등이 함께 든 회차, 학년도가 어긋난 회차를 걸러 냄).
#   - 정답은 해설 묶음 바로 앞의 정답 목록, 해설 본문의 "정답 ③"류, 정답 그림(OCR) 순으로 모아 비교한다.
import sys, os, re, json, glob, io, subprocess, hashlib
import pymupdf
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from extract import trim, strip_footer, render, save, CIRC, DPI

OCR_DIR = None
ALT = {'➀': '①', '➁': '②', '➂': '③', '➃': '④', '➄': '⑤'}

def norm(s):
    return ''.join(ALT.get(c, c) for c in s)

def hangul(t): return len(re.findall('[가-힣]', t))

def tess(img, psm='3'):
    tmp = os.path.join(OCR_DIR, '_tmp_%d.png' % os.getpid()); img.save(tmp)
    r = subprocess.run(['tesseract', tmp, '-', '-l', 'kor+eng', '--psm', psm, 'tsv'], capture_output=True, text=True).stdout
    os.remove(tmp); return r

def ocr_words(page, key):
    """글자가 없는 쪽: 그림으로 만들어 tesseract로 읽고 (x0, y0, x1, y1, 글자) 목록을 돌려준다(쪽 좌표).
    해상도에 따라 tesseract가 엉뚱하게 읽는 일이 있어 150·200·300dpi 가운데 한글을 가장 많이 읽은 결과를 쓴다."""
    path = os.path.join(OCR_DIR, key + '.json')
    if os.path.exists(path): return [tuple(w) for w in json.load(open(path))]
    best = None
    for dpi in (150, 200, 300):
        pm = page.get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY); img = Image.open(io.BytesIO(pm.tobytes('png')))
        tsv = tess(img); sc = 72 / dpi; out = []
        for line in tsv.splitlines()[1:]:
            f = line.split('\t')
            if len(f) < 12 or not f[11].strip(): continue
            x, y, w, h = map(int, f[6:10])
            out.append((x * sc, y * sc, (x + w) * sc, (y + h) * sc, f[11].strip()))
        k = hangul(' '.join(w[4] for w in out))
        if best is None or k > best[0]: best = (k, out)
    json.dump(best[1], open(path, 'w'), ensure_ascii=False)
    return best[1]

def upright(doc, key):
    """스캔 쪽이 옆으로 누워 있으면 바로 세운 새 문서를 만든다(글자가 있는 쪽은 그대로)."""
    if all(sum(len(w[4]) for w in p.get_text('words')) >= 150 for p in doc): return doc
    path = os.path.join(OCR_DIR, key + '_upright.pdf')
    if os.path.exists(path): return pymupdf.open(path)
    nd = pymupdf.open()
    for page in doc:
        if sum(len(w[4]) for w in page.get_text('words')) >= 150: nd.insert_pdf(doc, from_page=page.number, to_page=page.number); continue
        pm = page.get_pixmap(dpi=200, colorspace=pymupdf.csGRAY); img = Image.open(io.BytesIO(pm.tobytes('png')))
        small = img.copy(); small.thumbnail((1000, 1000)); best = None
        for rot in (0, 90, 270, 180):
            t = tess(small.rotate(rot, expand=True), '6'); k = hangul(t)
            if best is None or k > best[0] * 1.3: best = (k, rot)
            if rot == 0 and k > 150: break
        img = img.rotate(best[1], expand=True); buf = io.BytesIO(); img.save(buf, 'PNG')
        np = nd.new_page(width=img.width * 72 / 200, height=img.height * 72 / 200); np.insert_image(np.rect, stream=buf.getvalue())
    nd.save(path); return pymupdf.open(path)

def page_words(doc, name, pi):
    page = doc[pi]
    ws = [(w[0], w[1], w[2], w[3], norm(w[4])) for w in page.get_text('words')]
    if hangul(' '.join(w[4] for w in ws)) < 120:   # 한글이 거의 없으면 스캔(또는 글자를 선으로 그린 쪽)으로 본다
        ws = [w[:5] for w in ocr_words(page, f'{name}_{pi}')]
    return ws

def is_scan(doc, name, pi):
    return hangul(doc[pi].get_text()) < 120

def clip_words(ws, rect):
    return [w for w in ws if w[0] >= rect.x0 - 1 and w[2] <= rect.x1 + 1 and w[1] >= rect.y0 - 1 and w[3] <= rect.y1 + 1]

def text_of(ws):
    ws = sorted(ws, key=lambda w: (round(w[1] / 6), w[0]))
    return re.sub(r'\s+', ' ', ' '.join(w[4] for w in ws)).strip()

# ---------- 문제지 ----------
def q_markers(doc, name):
    cand = []
    for pi in range(len(doc)):
        page = doc[pi]; W, H = page.rect.width, page.rect.height
        body = [w for w in page_words(doc, name, pi) if H * 0.05 < w[1] < H * 0.95]; scan = is_scan(doc, name, pi)
        for c in range(2):
            x0, x1 = W * c / 2, W * (c + 1) / 2
            cw = [w for w in body if x0 - (12 if c else 0) <= w[0] < x1 - (12 if c == 0 else 0)]
            if not cw: continue
            xs = sorted(w[0] for w in cw); left = xs[max(0, len(xs) // 50)]
            for w in cw:
                m = re.match(r'^(\d{1,2})\.', w[4]) or (scan and re.match(r'^(\d{1,2})[.,]?$', w[4]))
                if not m or w[0] - left >= 16: continue
                # 선택지("1. ③")나 문제 안의 번호 목록은 문항 번호가 아니다
                if any(v[4][:1] in CIRC and abs(v[1] - w[1]) < 4 and 0 < v[0] - w[0] < 45 for v in cw) or w[4][-1:] in CIRC: continue
                cand.append((int(m.group(1)), pi, c, w[1], w[3], w[0]))
    cand.sort(key=lambda t: (t[1], t[2], t[3]))
    out, need = [], 1
    for t in cand:
        if t[0] == need: out.append(t); need += 1
        if need > 20: break
    return out

def set_heads(doc, name, mk):
    """'[19~20] 그림은 …' 처럼 두 문항이 함께 쓰는 글의 위치: {첫 번호: (끝 번호, 쪽, 단, y)}"""
    out = {}
    for pi in range(len(doc)):
        page = doc[pi]; W = page.rect.width; ws = page_words(doc, name, pi); lines = {}
        for w in ws: lines.setdefault((0 if w[0] < W / 2 - 12 else 1, round(w[1] / 4)), []).append(w)
        for (c, _), lw in lines.items():
            lw.sort(key=lambda w: w[0]); t = ''.join(w[4] for w in lw)
            m = re.match(r'^\[(\d{1,2})[~～∼](\d{1,2})\]', t)
            if m and int(m.group(1)) not in out: out[int(m.group(1))] = (int(m.group(2)), pi, c, min(w[1] for w in lw[:3]))
    return out

def cut_questions(doc, name, outdir):
    mk = q_markers(doc, name); texts = {}
    if len(mk) != 20: return len(mk), texts
    heads = set_heads(doc, name, mk); stems = {}
    def col_rect(page, c, mx, y0, y1):
        W = page.rect.width; gap = W * 0.006
        return pymupdf.Rect(min(W * c / 2 + gap, mx - 2) if c else W * 0.03, y0, W * (c + 1) / 2 - (gap if not c else W * 0.03), y1)
    for a, (b, pi, c, y) in heads.items():   # 함께 쓰는 글: 그 위치부터 a번 앞(또는 단 끝)까지
        m = mk[a - 1]; page = doc[pi]
        y1 = m[3] - 3 if (m[1], m[2]) == (pi, c) else page.rect.height * 0.945
        r = col_rect(page, c, m[5] if c == m[2] else page.rect.width / 2, y - 3, y1)
        stems.update({n: (pi, r) for n in range(a, b + 1)})
    for k, (n, pi, c, y0, _, mx) in enumerate(mk):
        page = doc[pi]; W, H = page.rect.width, page.rect.height
        nxt = mk[k + 1] if k + 1 < 20 else None
        y1 = nxt[3] - 3 if nxt and nxt[1] == pi and nxt[2] == c else H * 0.945
        for a, (b, hp, hc, hy) in heads.items():   # 다음 묶음의 글이 이 문항 아래에 있으면 거기서 끊는다
            if (hp, hc) == (pi, c) and y0 < hy < y1: y1 = hy - 3
        rect = col_rect(page, c, mx, y0 - 4, y1)
        img = render(page, rect); ws = clip_words(page_words(doc, name, pi), rect)
        fives = [w[3] for w in ws if w[4][:1] == '⑤']
        if fives:   # 선택지(⑤) 아래 큰 여백 뒤(쪽 번호, 확인 사항 등)는 버린다
            sc = DPI / 72; start = min(int((max(fives) - rect.y0) * sc), img.height); px = img.load()
            ink = [sum(1 for xx in range(0, img.width, 2) if px[xx, yy] < 130) >= 2 for yy in range(img.height)]
            last = max([yy for yy in range(img.height) if ink[yy]] or [0]); run = 0
            for yy in range(start, img.height):
                if not ink[yy]: run += 1; continue
                if run >= 28 or (run >= 10 and last - yy < 100): img = img.crop((0, 0, img.width, yy - run + 8)); break
                run = 0
        elif not nxt or nxt[1] != pi or nxt[2] != c:
            img = strip_footer(img)
        img = trim(img); t = text_of(ws)
        if n in stems:   # 함께 쓰는 글을 위에 붙인다
            sp, sr = stems[n]; st = trim(strip_footer(render(doc[sp], sr)))
            cv = Image.new('L', (max(st.width, img.width), st.height + img.height + 10), 255); cv.paste(st, (0, 0)); cv.paste(img, (0, st.height + 10)); img = cv
            t = text_of(clip_words(page_words(doc, name, sp), sr)) + ' ' + t
        save(img, os.path.join(outdir, f'q{n:02d}.webp'))
        texts[n] = t
    return 20, texts

def drop_tail(img, maxh=60, mingap=15):
    """아래쪽에 떨어져 있는 작은 덩어리(쪽 번호, 꼬리말)를 버린다."""
    for _ in range(2):
        px = img.load(); segs = []
        for y in range(img.height):
            if any(px[x, y] < 140 for x in range(0, img.width, 2)):
                if segs and y - segs[-1][1] < 8: segs[-1][1] = y
                else: segs.append([y, y])
        if len(segs) < 2: break
        a, b = segs[-1]; pa, pb = segs[-2]
        if b - a < maxh and a - pb >= mingap: img = img.crop((0, 0, img.width, pb + 5))
        else: break
    return img

def cut_manual(doc, name, spec, outdir, prefix):
    """marks_hak.json에 적어 둔 위치로 자른다(스캔본)."""
    mk = spec['marks']; split = spec.get('split', 0.49); xr = spec.get('xr', 0.97); texts = {}
    def rect(pi, c, a, b):
        W = doc[pi].rect.width
        return pymupdf.Rect(W * 0.03 if c == 0 else W * split, a, W * split if c == 0 else W * xr, b)
    for k, m in enumerate(mk):
        pi, c, y = m[:3]; nxt = mk[k + 1] if k + 1 < len(mk) else None
        parts = []
        if nxt and nxt[0] == pi and nxt[1] == c: b = nxt[2] - 3
        elif not nxt: b = spec.get('end20', spec['bottom'])
        else: b = spec['bottom']
        parts.append(rect(pi, c, y - 2, b))
        if len(m) > 3: parts.append(rect(pi, m[3], m[4], (nxt[2] - 3) if nxt and nxt[0] == pi and nxt[1] == m[3] else spec['bottom']))
        ims = [trim(drop_tail(render(doc[pi], r)) if abs(r.y1 - spec['bottom']) < 1 else render(doc[pi], r)) for r in parts]
        w = max(i.width for i in ims); h = sum(i.height for i in ims)
        canvas = Image.new('L', (w, h), 255); yy = 0
        for i in ims: canvas.paste(i, (0, yy)); yy += i.height
        save(canvas, os.path.join(outdir, f'{prefix}{k + 1:02d}.webp'))
        texts[k + 1] = text_of([w for r in parts for w in clip_words(page_words(doc, name, pi), r)])
    return len(mk), texts

def cut_manual_e(doc, name, spec, outdir):
    titles, etexts = {}, {}
    for n, parts in enumerate(spec['items'], 1):
        ims, ws = [], []
        for pi, c, a, b in parts:
            x0, x1 = spec['cols'][str(pi)][c]; r = pymupdf.Rect(x0, a, x1, b)
            ims.append(trim(render(doc[pi], r))); ws += clip_words(page_words(doc, name, pi), r)
        w = max(i.width for i in ims); h = sum(i.height for i in ims)
        canvas = Image.new('L', (w, h), 255); yy = 0
        for i in ims: canvas.paste(i, (0, yy)); yy += i.height
        save(canvas, os.path.join(outdir, f'e{n:02d}.webp'))
        etexts[n] = text_of(ws); mm = re.search(r'의도\s*\]?\s*(.{0,60})', etexts[n]); titles[n] = mm.group(1).strip() if mm else ''
    return len(spec['items']), titles, etexts

# ---------- 해설 ----------
def e_markers(doc, name):
    """모든 쪽의 "n. [출제의도]" 번호: (n, page, x, y위, y아래) 를 읽는 순서로."""
    out = []
    for pi in range(len(doc)):
        ws = page_words(doc, name, pi)
        for i, w in enumerate(ws):
            if '출제의도' not in w[4] and not re.match(r'^\[?출제', w[4]) and not re.match(r'^의도\]', w[4]): continue
            m = re.match(r'^(\d{1,2})\.', w[4])
            if m: out.append((int(m.group(1)), pi, w[0], w[1], w[3])); continue
            # 같은 줄 바로 왼쪽의 "n." 낱말
            left = [v for v in ws if abs((v[1] + v[3]) / 2 - (w[1] + w[3]) / 2) < 5 and v[2] <= w[0] + 2 and w[0] - v[2] < (40 if '출' in w[4] else 75) and re.match(r'^\d{1,2}[.,]?$', v[4].replace('[', ''))]
            if not left:   # 글자 순서가 뒤섞인 회차: 줄 맨 앞 근처의 "n." 낱말
                left = [v for v in ws if abs(v[1] - w[1]) < 5 and v[2] <= w[0] + 2 and w[0] - v[2] < 60 and re.match(r'^\d{1,2}\.', v[4])]
            if left:
                v = max(left, key=lambda v: v[0]); n = int(re.match(r'\d+', v[4]).group())
                out.append((n, pi, v[0], min(v[1], w[1]), max(v[3], w[3])))
    # 단(column) 순서: 쪽마다 x를 묶어 단 번호를 붙인다
    res = []
    for pi in sorted(set(m[1] for m in out)):
        ms = [m for m in out if m[1] == pi]; xs = sorted(set(round(m[2]) for m in ms)); cols = []
        for x in xs:
            if not cols or x - cols[-1][-1] > 60: cols.append([x])
            else: cols[-1].append(x)
        lefts = [min(c) for c in cols]
        for m in ms:
            c = max(i for i, l in enumerate(lefts) if m[2] >= l - 30)
            res.append((m[0], pi, c, m[3], m[4], m[2], lefts))
    res.sort(key=lambda t: (t[1], t[2], t[3]))
    return res

def runs(mk):
    """1~20이 이어지는 묶음들(중간에 빠진 번호 하나까지는 허용하지 않음)."""
    out = []
    for i, m in enumerate(mk):
        if m[0] != 1: continue
        seq, need = [], 1
        for t in mk[i:]:
            if t[0] == need: seq.append(t); need += 1
            elif t[0] == 1 and seq: break
            if need > 20: break
        out.append((i, seq))
    return out

def bigrams(s):
    s = re.sub(r'[^가-힣A-Za-z0-9]', '', s); return set(s[i:i + 2] for i in range(len(s) - 1))

def sim(a, b):
    A, B = bigrams(a), bigrams(b)
    return len(A & B) / (len(A | B) or 1)

def region_rect(doc, m, lefts, to=None):
    page = doc[m[1]]; W, H = page.rect.width, page.rect.height; c = m[2]
    x0 = lefts[c] - 4; x1 = (lefts[c + 1] - 6) if c + 1 < len(lefts) else W - max(20, lefts[0] - 10)
    return pymupdf.Rect(x0, m[3] - 4, x1, to if to else H * 0.94)

def seq_regions(doc, name, seq, mk):
    """묶음의 각 번호에 대해 (쪽, 사각형) 조각 목록. 다음 번호(다른 과목의 번호 포함) 바로 앞에서 끝낸다."""
    allm = sorted(mk, key=lambda t: (t[1], t[2], t[3])); out = []
    for k, m in enumerate(seq):
        j = allm.index(m); nxt = allm[j + 1] if j + 1 < len(allm) else None
        if k + 1 < len(seq) and nxt is not seq[k + 1]: nxt = seq[k + 1]
        parts = []; cur = (m[1], m[2]); lefts = m[6]; top = m[3]
        for _ in range(8):
            page = doc[cur[0]]; H = page.rect.height
            end = nxt[3] - 3 if nxt and (nxt[1], nxt[2]) == cur else None
            if end is None and k == 19:
                # 마지막 문항: 그 단 안에서 다음 과목 머리(과목 이름, 정답 목록)가 나오면 거기서 멈춘다
                r = region_rect(doc, (0, cur[0], cur[1], top), lefts)
                hs = [w[1] for w in clip_words(page_words(doc, name, cur[0]), r) if w[1] > top + 10 and re.match(r'^[\[〔【]?(물리|화학|생명|생물|지구|과학)', w[4])]
                if hs: end = min(hs) - 4
            parts.append((cur[0], region_rect(doc, (0, cur[0], cur[1], top), lefts, end)))
            if end is not None: break
            # 다음 단 또는 다음 쪽 첫 단으로
            c = cur[1] + 1
            if c < len(lefts): cur = (cur[0], c)
            else:
                if cur[0] + 1 >= len(doc) or k == 19: break   # 마지막 문항은 다음 쪽으로 넘기지 않는다
                pl = [t[6] for t in allm if t[1] == cur[0] + 1]; lefts = pl[0] if pl else lefts; cur = (cur[0] + 1, 0)
            top = doc[cur[0]].rect.height * 0.05
        out.append(parts)
    return out

def answer_lists(doc):
    """책자 안의 모든 "1 ③ 2 ⑤ … 20 ②" 목록과 그 앞 머리글(과목 이름). 글꼴이 바뀌어 ①~⑤가 다른 글자로 나오면
    연달아 붙은 다섯 글자를 차례대로 ①~⑤로 본다."""
    out = []
    for pi, page in enumerate(doc):
        t = norm(re.sub(r'\s+', ' ', page.get_text()))
        for m in re.finditer(r'(?<!\d)1 (\S)(?: \d{1,2} \S){19}', t):
            toks = m.group(0).split(' '); nums = toks[0::2]; ans = toks[1::2]
            if nums != [str(k) for k in range(1, 21)]: continue
            if all(a in CIRC for a in ans): a = [CIRC.index(x) + 1 for x in ans]
            else:
                cs = sorted(set(ord(x) for x in ans))
                if len(cs) != 5 or cs[-1] - cs[0] != 4: continue
                a = [ord(x) - cs[0] + 1 for x in ans]
            out.append((pi, m.start(), t[max(0, m.start() - 40):m.start()], a))
    return out

def answer_list_region(doc, name, seq):
    """묶음 1번 앞(같은 단 위쪽, 또는 그 앞 단)의 정답 목록."""
    m = seq[0]; ws = page_words(doc, name, m[1]); lefts = m[6]; c = m[2]
    for cc in range(c, -1, -1):
        r = region_rect(doc, (0, m[1], cc, 0), lefts, m[3] if cc == c else None)
        found = dict((int(n), CIRC.index(ch) + 1) for n, ch in re.findall(r'(?<!\d)(\d{1,2}) ?([①②③④⑤])', text_of(clip_words(ws, r))))
        if all(i in found for i in range(1, 21)): return [found[i] for i in range(1, 21)]
    return None

def answer_list_near(doc, name, seq):
    r = answer_list_region(doc, name, seq)
    if r: return r
    # 정답 목록이 다른 쪽에 따로 있는 회차: '물리Ⅱ' 머리 아래 상자에서 찾는다
    for pi in range(len(doc)):
        ws = page_words(doc, name, pi)
        for h in ws:
            if not (re.search(r'물리\s*(학)?\s*(Ⅱ|II|∥)', h[4]) or (h[4] in ('Ⅱ', 'II', 'Ⅱ]') and any('물리' in v[4] and abs(v[1] - h[1]) < 6 and 0 < h[0] - v[0] < 70 for v in ws))): continue
            box = [w for w in ws if h[0] - 160 < w[0] < h[0] + 320 and h[1] - 5 < w[1] < h[3] + 260]
            found = dict((int(n), CIRC.index(ch) + 1) for n, ch in re.findall(r'(?<!\d)(\d{1,2}) ?([①②③④⑤])', text_of(box)))
            if all(i in found for i in range(1, 21)): return [found[i] for i in range(1, 21)]
    ls = answer_lists(doc)
    two = [l for l in ls if re.search(r'물리\s*학?[^가-힣]{0,6}(Ⅱ|II|∥|棰)[^가-힣]{0,3}(정답)?\s*$', l[2])]
    if two: return two[-1][3] if len(set(tuple(l[3]) for l in two)) == 1 else None
    # 과목 이름을 못 읽었으면: 묶음 1번과 같은 쪽이거나 그 앞 가장 가까운 목록
    before = [l for l in ls if l[0] <= seq[0][1] and not re.search(r'Ⅰ|I(?!I)', l[2])]
    return before[-1][3] if before and len(ls) == 1 else None

def cut_explanations(doc, name, outdir, qtexts):
    mk = e_markers(doc, name); best = None
    for i, seq in runs(mk):
        if len(seq) != 20: continue
        regs = seq_regions(doc, name, seq, mk)
        etexts = {n + 1: text_of([w for p, r in regs[n] for w in clip_words(page_words(doc, name, p), r)]) for n in range(20)}
        s = sum(sim(qtexts.get(n, ''), etexts[n]) for n in range(1, 21)) / 20 if qtexts else 0
        # 문제 글을 못 읽었으면 '물리Ⅱ' 머리가 앞에 있는 묶음을 고른다
        hd = 0
        ws = page_words(doc, name, seq[0][1])
        if any(re.search(r'물리\s*(학)?\s*(Ⅱ|II|∥)', w[4]) and w[1] < seq[0][3] for w in ws): hd = 0.001
        if best is None or s + hd > best[0]: best = (s + hd, seq, regs, etexts)
    if not best: return 0, {}, {}, None, 0
    s, seq, regs, etexts = best
    titles = {}
    for n in range(20):
        ims = []
        for p, r in regs[n]:
            if r.height < 6: continue
            im = trim(strip_footer(render(doc[p], r)) if r.y1 > doc[p].rect.height * 0.9 else render(doc[p], r))
            if im.height > 12: ims.append(im)
        if not ims: continue
        w = max(i.width for i in ims); h = sum(i.height for i in ims)
        canvas = Image.new('L', (w, h), 255); y = 0
        for i in ims: canvas.paste(i, (0, y)); y += i.height
        save(canvas, os.path.join(outdir, f'e{n + 1:02d}.webp'))
        t = etexts[n + 1]; mm = re.search(r'출제의도\s*\]?\s*(.{0,60})', t)
        titles[n + 1] = re.sub(r'\s+', ' ', mm.group(1)).strip() if mm else t[:60]
    return 20, titles, etexts, answer_list_near(doc, name, seq), round(s, 3)

def answers_from_text(etexts):
    found = {}
    for n, t in etexts.items():
        m = re.search(r'(?:정답|답)\s*[:：]?\s*([①②③④⑤])', t)
        if m: found[n] = CIRC.index(m.group(1)) + 1
    return [found[i] for i in range(1, 21)] if len(found) == 20 else None

def answers_from_file(f):
    """정답 파일(pdf·그림)의 물리Ⅱ 정답. 그림은 OCR로 읽고, 숫자 뒤에 오는 ①~⑤를 쓴다."""
    if not f: return None
    if f.endswith('.pdf'):
        t = norm(' '.join(p.get_text() for p in pymupdf.open(f)))
    else:
        key = 'ans_' + os.path.basename(f).split('.')[0]; path = os.path.join(OCR_DIR, key + '.txt')
        if not os.path.exists(path):
            im = Image.open(f).convert('L'); im = im.resize((im.width * 2, im.height * 2)); tmp = path + '.png'; im.save(tmp)
            open(path, 'w').write(subprocess.run(['tesseract', tmp, '-', '-l', 'kor+eng', '--psm', '6'], capture_output=True, text=True).stdout); os.remove(tmp)
        t = norm(open(path).read())
    found = dict((int(n), CIRC.index(c) + 1) for n, c in re.findall(r'(?<!\d)(\d{1,2})\s*([①②③④⑤])', t))
    return [found.get(i) for i in range(1, 21)] if len(found) >= 15 else None

def head_year(doc, name):
    """첫머리의 'YYYY학년도 M월' 또는 'YYYY년 M월'."""
    t = text_of(page_words(doc, name, 0))
    m = re.search(r'(\d{4})\s*학\s*년\s*도[^0-9]{0,30}?(\d{1,2})\s*월', t) or re.search(r'(20\d\d)\s*년\s*(\d{1,2})\s*월', t)
    return f'{m.group(1)}-{int(m.group(2)):02d}' if m else ''

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]; only = sys.argv[3:]
    OCR_DIR = os.path.join(out, '_ocr'); os.makedirs(OCR_DIR, exist_ok=True)
    for q in sorted(glob.glob(f'{src}/p2/d1/*.pdf')):
        name = os.path.basename(q)[:-4]
        if only and name not in only and name[3:] not in only: continue
        od = os.path.join(out, name); os.makedirs(od, exist_ok=True)
        qd = upright(pymupdf.open(q), 'q_' + name); ed = upright(pymupdf.open(f'{src}/p2/d3/{name}.pdf'), 'e_' + name)
        af = (glob.glob(f'{src}/p2/d2/{name}.*') or [None])[0]
        MARKS = json.load(open(os.path.join(os.path.dirname(__file__), 'marks_hak.json')))
        if 'q_' + name in MARKS: nq, texts = cut_manual(qd, 'q_' + name, MARKS['q_' + name], od, 'q')
        else: nq, texts = cut_questions(qd, 'q_' + name, od)
        if 'e_' + name in MARKS:
            ne, titles, etexts = cut_manual_e(ed, 'e_' + name, MARKS['e_' + name], od); a_list = None
            s = round(sum(sim(texts.get(n, ''), etexts[n]) for n in range(1, 21)) / 20, 3)
        else: ne, titles, etexts, a_list, s = cut_explanations(ed, 'e_' + name, od, texts)
        a_txt = answers_from_text(etexts) if etexts else None
        a_file = MARKS.get('a_' + name) or (answers_from_file(af) if af and af.endswith('.pdf') else None)
        json.dump({'answers': a_list or a_txt or a_file, 'answers_text': a_txt, 'official': a_file, 'texts': texts, 'titles': titles,
                   'etexts': etexts, 'match': s, 'qhead': head_year(qd, 'q_' + name), 'ehead': head_year(ed, 'e_' + name),
                   'scan_q': any(is_scan(qd, '', i) for i in range(len(qd)))}, open(os.path.join(od, 'info.json'), 'w'), ensure_ascii=False)
        srcs = [x for x in (a_list, a_txt, a_file) if x]
        agree = '정답 없음!' if not srcs else 'ok' if all(x == srcs[0] for x in srcs) else 'MISMATCH'
        print(f'{name}: 문제 {nq}/20 해설 {ne}/20 짝 {s} 정답 {agree} (목록 {"O" if a_list else "X"} 본문 {"O" if a_txt else "X"} 파일 {"O" if a_file else "X"})', flush=True)
