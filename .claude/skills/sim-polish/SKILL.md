---
name: sim-polish
description: 물리 수업 사이트의 시뮬레이션을 고치거나 새로 만들 때 사용. 선생님이 화면 캡처나 기출문제 사진을 주며 "이렇게 바꿔 줘", "이 문제를 풀 수 있게 해 줘"라고 할 때.
---

# 시뮬레이션 다듬기

먼저 README.md의 1~2절(원칙, 폴더 구조, 공통 기능)을 읽는다.

## 순서
1. 고칠 시뮬레이션의 원본을 찾는다.
   - `src/<이름>.src`가 있으면 그것을 고치고 `cd src && python3 build.py <이름>`.
   - 없으면(shm, energy, collision, projectile, capacitor, circuit, efield, induction, optics, slit, gas) `site/sim/<이름>/index.html`을 직접 고친다.
   - `src/common.js`나 `common.css`를 고쳤으면 29개 모두 다시 만든다: `cd src && python3 build.py $(ls *.src | sed 's/\.src$//')`
2. 새 시뮬레이션이면 `src/<이름>.src`로 만들고, `site/index.html`의 알맞은 분류에 카드를 넣고 분류 옆 개수를 고친다. README의 시뮬레이션 표도 고친다.
3. 기출문제 사진을 받았다면, 그 조건을 넣었을 때 정답과 같은 값이 나오는지 직접 확인한다.
4. 확인: Playwright로 아이폰 13 크기에서 열어 JS 오류, 가로 넘침, 글자 겹침을 본다. 스크린숏은 꼭 필요한 한두 장만.
5. 커밋하고 `git push -u origin main`.

## 이미 정한 방향 (새로 만들 때도 따른다)
- 슬라이더는 두고, 값을 눌러 숫자를 직접 입력 (common.js가 자동 처리)
- 시간이 흐르는 시뮬레이션은 시간 막대 + '시간' 칸 직접 입력: `timeBar` 또는 `loopT` 사용. 상태를 시각의 함수로 계산하면 가장 깔끔하다.
- 중력이 관련된 가속도는 `gAcc(a)`로 g 배수 함께 표시
- 실이 당기는 힘은 "실이 당기는 힘(장력)"
- 맨 아래 저작권 문구는 build.py 틀에 들어 있다. 직접 고치는 페이지에는 `<p class="copy">© 2026 이정태. All Rights Reserved.</p>`

## 아직 결정되지 않은 것 (선생님께 물어볼 것)
- 발전기 그림을 입체로 바꿀지
- 파동의 중첩에 "같은 매질(속력 고정)" 선택지를 넣을지
