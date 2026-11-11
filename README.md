# 물리 수업 실험실

- site/ : 실제로 공개되는 웹사이트 (GitHub Pages에 올리는 폴더)
  - index.html : 첫 화면 (역학과 열 12 / 전자기 9 / 파동과 빛 7 / 현대 물리 9)
  - sim/<이름>/index.html : 시뮬레이션 37개
  - robots.txt : 검색 노출 방지 (모든 페이지에 noindex도 들어 있음)
- src/ : 2차·3차 시뮬레이션의 원본 (3차 7개: magnet, relativity, equivalence, laser, qubit, tunnel, atom)
  - common.css, common.js : 모든 시뮬레이션이 같이 쓰는 스타일과 함수
  - <이름>.src : 첫 줄 제목, 본문 HTML, ---CSS---(선택), ---SCRIPT--- 순서
  - build.py : `python3 build.py 이름1 이름2 ...` 실행하면 site/sim/<이름>/index.html 생성
- 1차 시뮬레이션 11개(shm, energy, collision, projectile, capacitor, circuit, efield, induction, optics, slit, gas)는 site/sim 안의 파일 자체가 원본입니다.
- 공개: main 브랜치에 올리면 .github/workflows/pages.yml이 site 폴더를 GitHub Pages로 내보냅니다.
- 연습문제: 시뮬레이션 화면 아래에 '연결된 기출문제' 칸이 붙습니다(site/practice/panel.js).
  - 수능 물리Ⅰ·Ⅱ(2008~2026학년도) 가운데 2022 개정 성취기준에 맞는 문항을 시뮬레이션별로 연결했습니다. 연결표는 src/practice/map.json 입니다.
  - 만드는 순서: ① `python3 src/practice/extract.py <원본 폴더> practice-src/cut` (문제·해설 PDF를 문항별 그림으로 자름, PyMuPDF와 Pillow 필요)
    ② `PRACTICE_CODE=수업코드 node src/practice/encrypt.js` (수업 코드로 암호화해 site/practice/data 에 생성)
  - 원본 폴더 구조: p1/d1(문제) p1/d2(정답) p1/d3(해설), p2/… 이고 파일 이름은 p1_2026_11.pdf 형식입니다.
  - 단원별 기출문제 화면은 site/practice/index.html 입니다. 문항을 2022 개정 과목·영역으로 나누는 규칙은 src/practice/units.json 에 있습니다.
  - 문제 원본(practice-src)과 수업 코드는 GitHub에 올리지 않습니다(.gitignore). 수업 코드를 바꾸면 site/practice/data/index.json 을 지우고 다시 암호화합니다.
- 남은 일: 6월·9월 모의평가 문항 넣기, 측정 도구(tools/), 도메인 연결
