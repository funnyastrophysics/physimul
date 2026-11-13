---
name: practice-rebuild
description: 기출문제를 시뮬레이션·성취기준에 다시 연결하거나 분류를 고칠 때 사용. "이 문항은 ○○ 시뮬레이션으로", "pulley에 문제 붙여 줘", "분류 다시 해 줘" 같은 요청.
---

# 기출문제 재편성

먼저 README.md의 4절(기출문제를 만드는 방법)을 읽는다.

## 준비 (작업 공간이 새로 시작되면 practice-src가 비어 있다)
1. 선생님께 받은 압축 파일 2개(물리Ⅰ, 물리Ⅱ)를 새 폴더에 푼다. 각 압축 안의 세 폴더(문제, 정답, 해설)를 `<원본>/p1/d1`, `d2`, `d3`(물리Ⅱ는 p2)로 옮긴다. 폴더 이름이 깨져 보이면 안의 파일 이름(p1_2026_11.pdf)과 내용으로 구별한다.
2. `pip install pymupdf pillow`
3. `python3 src/practice/extract.py <원본> practice-src/cut` → 38회분 모두 "문제 20/20 해설 20/20"인지 확인
4. 수업 코드는 선생님께 받는다. 저장소 어디에도 적지 않는다.

## 연결 바꾸기
- 문항→시뮬레이션: `src/practice/map.json` (과목_학년도마다 1~20번 순서, 빈 문자열은 제외)
- 새 시뮬레이션 이름을 쓰면 `src/practice/classify.py`의 `new_code`와 `old_code`에 그 이름의 규칙을 넣는다.
- 문항 하나의 성취기준만 바꿀 때: `src/practice/codes_fix.json`에 `{"p1_2024_05": {"new": "12역학03-02"}}`
- 문항 내용을 확인할 때는 `practice-src/cut/<회차>/info.json`의 texts·titles를 먼저 보고, 애매할 때만 q??.webp 그림을 연다(사용량 절약).

## 다시 만들기
```bash
python3 src/practice/classify.py
PRACTICE_CODE=<수업코드> node src/practice/encrypt.js
```
- 확인: 로컬 서버(`python3 -m http.server`)로 site를 열고, 바꾼 시뮬레이션 화면과 `practice/index.html`에서 수업 코드로 문제가 열리는지 본다.
- 선생님 검토용 표가 필요하면 CSV로 만들어 전달하되 저장소에는 올리지 않는다(.gitignore에 있음).
- 커밋하고 push.

## 지금 남은 일 (README 5절 ②)
- pulley, superposition, generator에 문항 옮기기 (accel, wave·soundinterf·standing, induction에서)
- 판단이 갈리는 곳은 선생님 결정을 받는다: 물리Ⅰ 출처 전자기 유도, 전기장, 열기관
