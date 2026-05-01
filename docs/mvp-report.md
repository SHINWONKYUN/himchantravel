# AI 여행 찬스 — MVP 인수인계 보고서

Claude / Claude Code 검토·후속 개발용 요약입니다. **외부 API·DB·로그인·결제는 없습니다.**

---

## 현재 구현된 기능

- **홈:** 「오늘의 인천/서울 출발 여행 찬스」·**인천·김포 출발 1년 최저가** 문구, 필터 칩(AND), **인천(ICN)·김포(GMP) 출발만** 샘플 패키지 카드 최대 5개(지방 출발 제외), 커버 이미지, 가격·출발 공항+일정·태그·추천 이유·항공 요약, 관심(하트), 가격 신호 배지.
- **특가:** 인천/김포 출발 기준 국적기 비즈니스 특가 목록·카드(이미지·딥 네이비 본문).
- **관심:** 관심 저장 목록·빈 상태 UI·가격 알림 추후 안내.
- **내 여행:** 샘플 도시 9곳 2열 칩, 다녀온 곳/안 가본 곳 표시.
- **하단 탭:** 홈 / 특가 / 관심 / 내 여행. URL `?tab=` 으로 특정 화면 진입 가능.
- **추천 정렬:** 목 데이터 + 간단 점수 함수(화면에 점수 미표시).
- **상태 유지:** `localStorage`에 관심·방문·(선택) 마지막 탭·홈 필터 저장 — 새로고침 후 유지.
- **빌드:** `npm run build` 통과.

---

## 아직 구현하지 않은 기능

- 실제 여행사 API·크롤링·상품 DB.
- 로그인·회원·결제·개인정보 수집.
- AI 채팅·일정 자동 생성·가격 예측·푸시 알림.
- 서버 동기화·다기기 계정 연동.
- 추천엔진·규칙 엔진 고도화.

---

## 사용한 기술 스택

- **React 19** + **TypeScript**
- **Vite 8**
- **React Context** + `useState` / `useEffect`
- **localStorage** (브라우저만, 키는 `ai-travel-chance:*`)

---

## 주요 파일 구조

```
src/
  components/     BottomNav, FilterChips, TravelCard, BusinessDealCard, CoverImage
  context/        AppContext.tsx
  data/           mockTrips.ts
  pages/          Home, BusinessDeals, Favorites, MyTrips
  types/          trip.ts, app.ts (TabId)
  utils/          recommendationScore.ts, storage.ts, departure.ts
public/
  images/trips/   샘플 JPG (정적)
docs/
  screenshots/    홈·특가·관심·내 여행 PNG
  preview.md      스크린샷 설명
  mvp-report.md   본 문서
README.md
```

---

## 실행 방법

```bash
npm install
npm run dev
```

프로덕션 미리보기:

```bash
npm run build
npm run preview
```

URL 예: `http://localhost:5173/?tab=business`

---

## 화면 캡처 위치

| 화면 | 파일 |
|------|------|
| 홈 | `docs/screenshots/home.png` |
| 특가 | `docs/screenshots/business.png` |
| 관심 | `docs/screenshots/favorites.png` |
| 내 여행 | `docs/screenshots/my-trips.png` |

설명·역할은 **`docs/preview.md`** 참고.

---

## localStorage 저장 항목

| 키 | 내용 | 형식 |
|----|------|------|
| `ai-travel-chance:favorites` | 관심 저장한 여행 상품 ID | JSON 문자열 배열 |
| `ai-travel-chance:visited` | 다녀온 여행지 이름(내 여행 칩과 동일) | JSON 문자열 배열 |
| `ai-travel-chance:activeTab` | 마지막 선택 탭 | `home` \| `business` \| `favorites` \| `myTrips` |
| `ai-travel-chance:homeFilters` | 홈 필터 칩 선택값 | JSON 문자열 배열 (`HomeFilterId`) |

**우선순위:** 주소에 `?tab=` 이 있으면 **초기 탭은 URL이 우선**이며, 이후 탭 변경 시 localStorage에 반영됩니다.

---

## 다음 작업 우선순위 (제안)

1. 실상품 스키마·에디터용 목 구조 정리.
2. 가격 알림 UX 스텁 → 백엔드/푸시 연계 시 확장.
3. 접근성(포커스·스크린리더)·다국어 필요 시 i18n.
4. 이미지 CDN·최적화(webp)·저대역폭 대응.
5. E2E·시각 회귀(Playwright 등) CI 연동.

---

## Claude / Claude Code가 검토하면 좋은 부분

- **필터 AND** 조합이 기획과 계속 맞는지, 빈 결과 UX·기본 필터 초기화 정책.
- **localStorage** 만으로의 한계(브라우저 삭제·시크릿·쿼터)·향후 계정 연동 시 마이그레이션.
- **동일 도시**(예: 대만 일반·대만 비즈) 카드·이미지 구분 전략.
- **추천 라벨**(목 데이터)과 **점수 정렬**의 일관성·운영 시 단일 소스 여부.
- **보안/개인정보:** 현재는 저장 데이터가 민감도 낮으나, 향후 위치·식별자 추가 시 검토.
