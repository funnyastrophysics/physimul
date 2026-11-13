# 물리 수업 실험실

고등학교 물리 교사(이정태)가 수업에서 쓰는 비영리 사이트입니다. 학생들이 QR 코드로 들어와 휴대폰·태블릿에서 씁니다.

- 공개 주소: https://funnyastrophysics.github.io/physimul/
- 저장소: funnyastrophysics/physimul (main 브랜치에 올리면 1~2분 뒤 자동으로 공개됩니다)

이 문서는 **새 대화에서 작업을 이어 갈 때 가장 먼저 읽는 안내서**입니다.

---

## 1. 함께 일하는 방식 (꼭 지킬 것)

- 선생님은 코딩을 모릅니다. 설명은 쉬운 한국어로 하고, 직접 눌러야 하는 버튼은 화면 위치까지 하나씩 안내합니다.
- 되돌리기 어려운 일(파일 삭제, 저장소 설정 변경 등)은 하기 전에 먼저 묻습니다.
- 작업 공간에서는 공개 주소(github.io)에 접속할 수 없습니다. 실제 주소에서의 확인은 선생님께 부탁합니다.
- 사용량을 아끼기 위해: 스크린숏은 꼭 필요한 것만 보고, 요청은 묶어서 처리합니다.

### 페이지를 만들 때의 원칙

- 페이지 하나는 HTML 파일 하나로 완결합니다(외부 라이브러리 없음). 예외는 기출문제 칸(`site/practice/panel.js`)뿐입니다.
- 휴대폰 세로 화면이 기준입니다. 터치로 조작할 수 있어야 하고 옆으로 넘치지 않아야 합니다.
- 용어와 설명은 2022 개정 「물리학」, 「역학과 에너지」, 「전자기와 양자」 교과서 표현을 따릅니다(긴반지름, 퍼텐셜 에너지, 실이 당기는 힘(장력) 등).
- 모든 페이지에 `noindex`를 넣습니다. `site/robots.txt`도 있습니다.
- 만들거나 고친 뒤에는 Playwright로 아이폰 크기 화면에서 열어, JS 오류가 없는지와 글자가 겹치거나 잘리지 않는지 확인합니다.

---

## 2. 폴더 구조

```
site/                 공개되는 웹사이트
  index.html          첫 화면 (탭: 시뮬레이션 / 측정 도구 / 연습문제)
  sim/<이름>/         시뮬레이션 40개
  tools/accel/        측정 도구: 가속도 기록
  practice/           단원별 기출문제 (index.html, panel.js, data/)
src/                  시뮬레이션 원본과 만드는 도구
  common.css, common.js   모든 2차·3차 시뮬레이션이 같이 쓰는 스타일과 함수
  <이름>.src              첫 줄 제목, 본문 HTML, ---CSS---(선택), ---SCRIPT--- 순서
  build.py                python3 build.py 이름1 이름2 ... → site/sim/<이름>/index.html
  practice/               기출문제를 만드는 도구 (4번 참고)
practice-src/         기출문제 원본 그림 (GitHub에 올리지 않음, 작업 공간에만 있음)
.github/workflows/pages.yml   site 폴더를 GitHub Pages로 내보내는 설정
```

### 시뮬레이션 40개

| 첫 화면 분류 | 이름 |
|---|---|
| 역학과 열역학 13 | accel, pulley, forces, torque, projectile, circular, orbit, collision, energy, shm, heating, gas, engine |
| 전자기학 10 | charging, efield, circuit, capacitor, magnet, bfield, lorentz, motor, generator, induction |
| 빛과 파동 8 | wave, superposition, standing, doppler, soundinterf, optics, slit, polarization |
| 현대물리 9 | photoelectric, laser, spectrum, atom, diode, qubit, tunnel, relativity, equivalence |

**원본이 두 종류입니다.**

- `src/<이름>.src`가 있는 29개: `.src`나 `common.*`를 고치고 `python3 build.py`로 다시 만듭니다. `common.*`를 고쳤으면 29개를 모두 다시 만듭니다.
  `cd src && python3 build.py $(ls *.src | sed 's/\.src$//')`
- 처음 받은 11개(shm, energy, collision, projectile, capacitor, circuit, efield, induction, optics, slit, gas): `site/sim/<이름>/index.html` 자체가 원본이라 직접 고칩니다.

### 공통 기능 (src/common.js)

| 함수 | 하는 일 |
|---|---|
| `setStats(items)` | 값 칸 표시. 칸 구성이 같으면 값만 바꿉니다 |
| `timeBar(host, o)` | 시간 막대, ±버튼, '시간' 값 칸을 직접 입력 칸으로 |
| `loopT(fn, o)` | 시계가 달린 반복 실행. 뒤로 갈 때는 `reset` 뒤 그 시각까지 다시 계산 |
| `gTxt(a)`, `gAcc(a)` | 가속도를 g의 배수로 (예: `7.84 m/s² = 4/5 g`) |
| 슬라이더 값 직접 입력 | 슬라이더 옆 값을 누르면 숫자 입력. 처음 받은 11개에는 같은 조각을 페이지 안에 넣어 두었습니다(`/*SLIDER-EDIT*/` 표시) |

시간 막대와 시각 직접 입력이 들어간 곳: accel, projectile, pulley, circular, superposition, generator, forces(빗면), wave(횡파와 종파), relativity, shm, collision, energy.
넣지 않은 곳: 화면의 시간이 실제 시간이 아닌 것(standing, doppler, soundinterf, lorentz, orbit 등), 무작위로 움직이는 것(gas, laser, qubit 등), 시간이 흐르지 않는 것.

---

## 3. 지금까지 한 일

- 시뮬레이션 40개 (처음 30개 + 3차 7개 + pulley, superposition, generator)
- 첫 화면 탭 구조, 분류 이름: 역학과 열역학 / 전자기학 / 빛과 파동 / 현대물리
- 단원별 기출문제: 수능 물리Ⅰ·Ⅱ 2008~2026학년도 760문항 가운데 759문항(물리Ⅱ 2017학년도 9번은 정답이 없어 뺌). 그중 613문항은 시뮬레이션에도 연결
  - 분류 기준은 선생님이 주신 `src/practice/codes_detail.json`(2022 성취기준, 주제, 출제 당시 교육과정·성취기준). 성취기준에 맞지 않는 74문항은 「미분류」 카드
  - 영역 안에서 성취기준 → 주제로 골라 보기, 문항마다 출처 옆에 [2022 성취기준] 주제, 아래에 출제 당시 교육과정
  - 문항 id는 `p1_2024_11_05`(과목_학년도_월_번호). 2026년 11월에 이 형식으로 바꾸면서 학생 학습 기록이 한 번 초기화됨
  - 시뮬레이션 화면 아래 '연결된 기출문제', 첫 화면 연습문제 탭의 '단원별 기출문제'
  - 수업 코드로 암호화, 정답 확인 뒤 해설(EBS) 표시, 그림 확대, 학습 기록(기기에 저장)
- 측정 도구: 가속도 기록 1개. 나머지는 phyphox 앱 안내로 대체하는 방향으로 논의 중(미정)

---

## 4. 기출문제를 만드는 방법

### 받은 자료의 모양

선생님이 주시는 압축 파일은 과목별로 `문제`, `정답`, `해설` 폴더가 들어 있고, 파일 이름은 `p1_2026_11.pdf`(과목_학년도_월) 형식입니다. 작업할 때 아래처럼 풀어 놓습니다.

```
<원본 폴더>/p1/d1  물리Ⅰ 문제      <원본 폴더>/p2/d1  물리Ⅱ 문제
<원본 폴더>/p1/d2  물리Ⅰ 정답      <원본 폴더>/p2/d2  물리Ⅱ 정답
<원본 폴더>/p1/d3  물리Ⅰ 해설      <원본 폴더>/p2/d3  물리Ⅱ 해설
```

### 순서

```bash
pip install pymupdf pillow
python3 src/practice/extract.py <원본 폴더> practice-src/cut   # ① 문제·해설을 문항별 그림으로 자름
python3 src/practice/classify.py                               # ② codes_detail.json(+규칙, codes_fix.json)으로 분류 → codes.json
PRACTICE_CODE=수업코드 node src/practice/encrypt.js             # ③ 암호화해서 site/practice/data 에 생성
```

| 파일 | 내용 |
|---|---|
| `src/practice/map.json` | 문항 → 연결할 시뮬레이션. 키는 과목_학년도_월(`p1_2024_11`), 1~20번 순서. 빈 칸은 시뮬레이션 연결만 없는 문항(단원별 기출문제에는 들어감) |
| `src/practice/codes_detail.json` | **분류 기준(선생님이 정함).** 문항마다 new(2022 성취기준 또는 "미분류"), topic(주제), era·old(출제 당시 교육과정·성취기준), check(선생님 메모, 학생 화면에 안 보임). 프로그램이 고치지 않음 |
| `src/practice/classify.py` | codes_detail.json을 그대로 쓰고, 거기에 없는 문항(새 모의평가 등)만 시뮬레이션·낱말 규칙으로 분류 |
| `src/practice/codes.json` | ②의 결과. 문항 하나만 고치려면 `codes_fix.json`에 `{"p1_2024_11_05": {"new": "12역학03-02", "topic": "…"}}` |
| `src/practice/units.json` | 2022 과목·영역 이름, 성취기준 짧은 이름 |
| `src/practice/answers_manual.json` | 정답표가 그림뿐이라 직접 읽어 넣은 정답(2011학년도) |

### 꼭 알아 둘 점

- **수업 코드는 저장소 어디에도 적지 않습니다.** 저장소가 공개이기 때문입니다. 선생님이 대화에서 알려 주십니다.
- **암호화 전 그림(practice-src)은 GitHub에 없습니다.** 작업 공간이 새로 시작되면 사라지므로, 분류를 바꾸거나 문항을 더할 때는 선생님께 압축 파일을 다시 받아 ①부터 실행합니다.
- 수업 코드를 바꾸려면 `site/practice/data/index.json`을 지우고 ③을 다시 실행합니다.
- 암호화 결과는 내용이 같으면 파일도 같게 나옵니다. 바뀐 문항만 새로 올라갑니다.
- 해설은 EBS 자료입니다. 화면에 "해설 (EBS)"와 저작권 안내를 표시합니다. 선생님은 저작권법 제25조(학교 수업 목적)에 따라 수강 학생에게만 제공한다는 입장입니다.
- 분류는 해설 제목과 문제 첫 문장을 보고 한 것이라 틀린 문항이 있을 수 있습니다.

---

## 5. 다음에 할 일 (급한 순서)

### ① 시뮬레이션 다듬기

선생님이 휴대폰에서 보며 주시는 피드백을 반영합니다. 지금까지 나온 방향은 이렇습니다.

- 기출문제의 상황을 그대로 재현할 수 있게 하기(예: 실로 연결된 물체, 타원 궤도)
- 슬라이더와 함께 숫자 직접 입력, 원하는 시각 고르기
- 중력이 관련된 가속도는 g의 배수로도 표시
- 아직 정하지 않은 것: 발전기 그림을 입체로 바꿀지, 파동의 중첩에 "같은 매질(속력 고정)" 선택지를 넣을지

### ② 시뮬레이션에 맞추어 기출문제 재편성

- 새로 만든 시뮬레이션 3개에는 연결된 문항이 없습니다. `map.json`에서 옮겨야 합니다.
  - `pulley`(실로 연결된 물체): 지금 `accel`에 있는 뉴턴 운동 법칙·도르래 문항
  - `superposition`(파동의 중첩): 지금 `wave`, `soundinterf`, `standing`에 있는 중첩 문항
  - `generator`(발전기): 지금 `induction`에 있는 발전기 문항
- 새 이름을 쓰려면 `classify.py`의 `new_code`와 `old_code`에도 그 이름의 규칙을 넣어야 합니다(없으면 오류가 납니다).
- 판단이 갈려 선생님 결정이 필요한 곳: 물리Ⅰ 출처의 전자기 유도(지금 12물리02-06), 전기장(지금 모두 12전자01-01), 열기관(지금 12역학02-04).
- 문항 수가 고르지 않습니다(12물리01-02에 59문항). 줄일지는 선생님이 정합니다.

### ③ 6월·9월 모의평가 넣기

준비는 끝났습니다. 문항 id와 회차 폴더에 월이 들어가고(`p1_2026_06`, `p1_2026_09`, `p1_2026_11`), 출처 문구도 월에 따라 "6월 모의평가", "9월 모의평가", "수능"으로 나옵니다.

- 남은 것: `map.json`에 새 회차 줄 추가, 새 문항의 분류(`codes_detail.json`에 없으므로 규칙으로 분류되고 주제가 비어 있음 → 선생님 검토 후 `codes_fix.json` 또는 `codes_detail.json`에 넣기), `panel.js`·`practice/index.html`의 "수능 기출문제" 문구를 "기출문제"로.
- 6월·9월 해설의 쪽 모양이 수능과 다를 수 있으므로, 자른 결과를 표본으로 확인합니다.

### 그 밖에 남은 일

- 측정 도구를 phyphox 안내로 바꿀지 결정, 동영상 분석을 어떻게 할지
- 개인 도메인 연결(후보: phyjt.kr, let.me.kr 등). 연결하면 주소가 바뀌어 학습 기록이 한 번 초기화됩니다.
- 2013학년도 이전 문항의 출제 당시 성취기준(자료 없음)
- 더 긴 수업 코드로 교체

---

## 6. 작업 지침 (skill)

`.claude/skills/` 에 작업별 지침이 있습니다. 새 대화에서 해당 일을 할 때 자동으로 쓰입니다.

| 지침 | 쓰는 때 |
|---|---|
| `sim-polish` | 시뮬레이션 고치기·새로 만들기 |
| `practice-rebuild` | 기출문제를 시뮬레이션·성취기준에 다시 연결 |
| `practice-add-mock` | 6월·9월 모의평가 추가 |

모든 화면 맨 아래에는 `© 2026 이정태. All Rights Reserved.` 가 있습니다(시뮬레이션은 build.py 틀에 포함).

## 7. 새 대화를 시작할 때 선생님이 올려 주실 것

| 할 일 | 필요한 것 |
|---|---|
| ① 시뮬레이션 다듬기 | 없음. 고칠 곳의 화면 캡처나 풀어 보고 싶은 문제 사진이 있으면 좋습니다 |
| ② 기출문제 재편성 | 수업 코드, 수능 문제 압축 파일 2개(물리Ⅰ, 물리Ⅱ). 분류표를 새로 주시면 `codes_detail.json`을 바꿉니다 |
| ③ 6월·9월 모의평가 | 수업 코드, 6월·9월 문제·정답·해설 파일(수능과 같은 폴더 구조와 파일 이름 형식) |

성취기준 PDF는 규칙이 `classify.py`에 들어 있어 다시 올리지 않아도 됩니다.
