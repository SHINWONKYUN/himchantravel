# himchantravel-api

힘찬트래블 백엔드 — RapidAPI Skyscanner 프록시.

## 목적
브라우저에 RapidAPI 키를 노출하지 않기 위한 서버 사이드 중계.
클라이언트는 `https://himchantravel.com/api/...`만 호출하고, 이 서버가 키를 붙여 RapidAPI로 요청한다.

## 엔드포인트
- `GET /api/health` — 서비스 상태 확인
- `GET /api/skyscanner/*` — Skyscanner Flights & Travel API 일반 프록시
  - 예: `/api/skyscanner/flights/searchAirport?query=Incheon`
  - 예: `/api/skyscanner/flights/searchFlights?...`

## 환경변수 (server/.env, gitignore)
- `RAPIDAPI_KEY` (필수) — RapidAPI 콘솔 발급 키
- `RAPIDAPI_HOST` (선택, 기본 `skyscanner-flights-travel-api.p.rapidapi.com`)
- `PORT` (선택, 기본 `3001`)

## 운영
- PM2로 실행: `pm2 start "node --env-file=.env index.mjs" --name himchantravel-api`
- 부팅 자동시작: `pm2 save && pm2 startup systemd -u ubuntu --hp /home/ubuntu`
- Nginx에서 `/api/` → `127.0.0.1:3001` 프록시

## 키 폐기/교체
1. RapidAPI 콘솔에서 기존 키 폐기
2. 새 키 발급
3. 서버에서 `nano /var/www/himchantravel/server/.env` → `RAPIDAPI_KEY=` 갱신
4. `pm2 reload himchantravel-api --update-env`
