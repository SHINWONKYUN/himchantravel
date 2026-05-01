# AI 여행 찬스 — MVP (UI 미리보기)

패키지 여행 **인천·김포(서울권) 출발** 찬스를 적은 수의 카드로 보여 주는 프론트 MVP입니다. 지방 공항 출발 상품은 목록에서 제외합니다. 실제 API·DB·로그인은 없으며, 샘플 데이터·**로컬 이미지**·**localStorage**만 사용합니다.

## 문서

| 문서 | 설명 |
|------|------|
| [**docs/preview.md**](docs/preview.md) | 스크린샷 4종 + 화면별 역할 (총사령관 빠른 확인용) |
| [**docs/mvp-report.md**](docs/mvp-report.md) | 인수인계 보고서 (기능·스택·저장 키·검토 포인트) |

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 **터미널에 표시된 Local 주소**로 접속합니다. (기본은 `http://localhost:5173/` — **`/dashboard` 등 입찰 프로젝트 경로와 혼동하지 마세요.**)

다른 앱이 이미 5173을 쓰면 Vite가 **5174** 등으로 자동 변경하거나 실패할 수 있습니다. 그때는 `npm run dev -- --port 5174` 로 실행한 뒤, 터미널에 나온 포트로 접속하세요.

프로덕션 빌드 미리보기:

```bash
npm run build
npm run preview
```

## 화면 미리보기 (URL)

하단 탭 전환 없이 특정 화면을 열 때는 쿼리 `tab`을 사용할 수 있습니다.

| 화면   | 예시 URL |
|--------|----------|
| 홈     | `http://localhost:5173/` |
| 특가   | `http://localhost:5173/?tab=business` |
| 관심   | `http://localhost:5173/?tab=favorites` |
| 내 여행 | `http://localhost:5173/?tab=myTrips` |

**참고:** 주소에 `?tab=`이 없으면 **마지막으로 선택한 탭**이 `localStorage`에서 복원됩니다. `?tab=`이 있으면 그 탭이 초기 화면으로 열립니다.

## localStorage (요약)

- 관심 저장 ID, 내 여행 방문 체크, 마지막 탭, 홈 필터 칩 — 새로고침 후 유지.  
- 자세한 키 이름은 **`docs/mvp-report.md`** 의 「localStorage 저장 항목」을 참고하세요.

## 샘플 이미지

정적 파일은 `public/images/trips/` 에 있습니다. 빌드·개발 서버에서 `/images/trips/…` 경로로 제공됩니다. 이미지 로드 실패 시 카드 상단에는 지역별 **그라데이션 placeholder**가 표시됩니다.

## 스크린샷 파일

| 파일 | 설명 |
|------|------|
| `docs/screenshots/home.png` | 홈 |
| `docs/screenshots/business.png` | 특가 |
| `docs/screenshots/favorites.png` | 관심 |
| `docs/screenshots/my-trips.png` | 내 여행 |

역할 설명은 **[docs/preview.md](docs/preview.md)** 에 있습니다.

자동 캡처 예시(Chromium이 없으면 `npx playwright install chromium` 필요):

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# 다른 터미널에서
npx playwright screenshot "http://127.0.0.1:4173/" docs/screenshots/home.png --viewport-size=440,900
```

---

## 인수인계

기능 목록·미구현 범위·파일 구조·검토 포인트는 **[docs/mvp-report.md](docs/mvp-report.md)** 를 참고하세요.
