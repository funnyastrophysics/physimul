# 물리 수업 실험실

- site/ : 실제로 공개되는 웹사이트 (GitHub Pages에 올리는 폴더)
  - index.html : 첫 화면 (역학과 열 / 전자기 / 파동과 빛 / 현대 물리)
  - sim/<이름>/index.html : 시뮬레이션 30개
- src/ : 2차 시뮬레이션의 원본
  - common.css, common.js : 모든 시뮬레이션이 같이 쓰는 스타일과 함수
  - <이름>.src : 첫 줄 제목, 본문 HTML, ---CSS---(선택), ---SCRIPT--- 순서
  - build.py : `python3 build.py 이름1 이름2 ...` 실행하면 site/sim/<이름>/index.html 생성
- 1차 시뮬레이션 11개(shm, energy, collision, projectile, capacitor, circuit, efield, induction, optics, slit, gas)는 site/sim 안의 파일 자체가 원본입니다.
- 남은 일: 측정 도구(tools/), 연습문제(practice/, 접근 제한), GitHub Pages 공개와 도메인 연결
