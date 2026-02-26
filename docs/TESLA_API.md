# Tesla Fleet API 연동 가이드

공식 문서: **[Tesla Fleet API](https://developer.tesla.com/docs/fleet-api)**  
앱 등록: **[Tesla Developer](https://developer.tesla.com/)**

---

## 1. 환경 변수 (server/.env)

| 변수 | 필수 | 설명 |
|------|------|------|
| **TESLA_CLIENT_ID** | OAuth 사용 시 | Tesla Developer에서 발급한 앱 Client ID |
| **TESLA_CLIENT_SECRET** | OAuth 사용 시 | 앱 Client Secret |
| **TESLA_REDIRECT_URI** | OAuth 사용 시 | 콜백 URL. 백엔드 기준 (예: `https://api.mongoori.com/api/tesla/callback`). Tesla 앱 설정의 Redirect URI와 **완전 일치**해야 함 |
| **TESLA_FLEET_API_BASE** | 선택 | Fleet API 베이스 URL. 기본값: `https://fleet-api.prd.na.vn.cloud.tesla.com` (North America) |
| **TESLA_PARTNER_DOMAIN** | 리전 등록 시 | 리전 등록에 쓰는 도메인 (예: `api.mongoori.com`). 공개키는 `https://<도메인>/.well-known/appspecific/com.tesla.3p.public-key.pem` 에 서빙 필요 |
| **TESLA_PARTNER_ACCESS_TOKEN** | Partner 사용 시 | Fleet/Partner 승인 후 발급한 **Partner 토큰**. 설정 시 Charging sessions·Telemetry 호출에 Owner OAuth 대신 사용 |
| **TESLA_ACCESS_TOKEN** | Partner 대안 | 위와 동일 용도. 둘 중 하나만 설정하면 됨 |

- OAuth만 쓸 때: `TESLA_CLIENT_ID`, `TESLA_CLIENT_SECRET`, `TESLA_REDIRECT_URI` 필요.
- Charging sessions / Telemetry를 Owner 개인 연결 없이 쓰려면: **TESLA_PARTNER_ACCESS_TOKEN** (또는 TESLA_ACCESS_TOKEN) 추가.

---

## 2. OAuth 플로우 (차량주인 Tesla 연결)

1. **차량주인**이 Owner Portal → **Add Car (Tesla)** 페이지에서 **Connect Tesla** 클릭.
2. 프론트는 백엔드 주소로 리다이렉트:  
   `GET /api/tesla/auth?token=<JWT>`  
   - 백엔드는 JWT로 사용자 식별, `state`에 userId 넣어 Tesla 인증 URL로 리다이렉트.
3. 사용자가 Tesla 로그인·동의 후 Tesla가 콜백:  
   `GET /api/tesla/callback?code=...&state=...`  
   - 백엔드가 `code`로 토큰 교환, **User** 문서에 `teslaAccessToken`, `teslaRefreshToken` 저장 후 프론트 `/owner/tesla?tesla=connected` 로 리다이렉트.

### 요청하는 OAuth scope

```
openid offline_access user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds
```

- **vehicle_device_data**: 차량 상태·Telemetry 등.
- **vehicle_cmds**: 원격 명령(미구현).
- **vehicle_charging_cmds**: 충전 관련(Charging sessions는 Fleet Partner 전용이라 개인 OAuth만으로는 불가할 수 있음).

### 사용하는 Tesla URL (코드 기준)

| 용도 | URL |
|------|-----|
| 인증 시작 | `https://auth.tesla.com/oauth2/v3/authorize` |
| 토큰 교환 | `https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token` |
| API 호출 | `TESLA_FLEET_API_BASE` (기본: `https://fleet-api.prd.na.vn.cloud.tesla.com`) |

---

## 3. 우리 백엔드 API (Tesla 연동 부분)

모두 **인증 필요** (Authorization 헤더에 JWT). Base path: **/api/tesla**.

| 메서드 | 경로 | 역할 | 권한 |
|--------|------|------|------|
| GET | /api/tesla/auth | Tesla OAuth 시작 (리다이렉트) | 쿼리 `token`=JWT |
| GET | /api/tesla/callback | OAuth 콜백, 토큰 저장 | Tesla 리다이렉트 |
| GET | /api/tesla/status | Tesla 연결 여부 | owner |
| GET | /api/tesla/vehicles | 차량 목록 + isOwner 플래그 | owner |
| GET | /api/tesla/vehicles/:vinOrId | 단일 차량 상세 | owner |
| GET | /api/tesla/charging-sessions/:carId | 충전 세션 (query: start, end) | owner 또는 admin |
| GET | /api/tesla/vehicle-telemetry/:carId | 차량 Telemetry | owner 또는 admin |
| GET | /api/tesla/usage/:carId/daily | 일별 주행(odometer 기반), query: days=7 | owner |

- **charging-sessions**, **vehicle-telemetry**: `.env`에 **TESLA_PARTNER_ACCESS_TOKEN**(또는 TESLA_ACCESS_TOKEN)이 있으면 **Owner의 teslaAccessToken 대신 Partner 토큰**으로 Tesla를 호출함 (각 차량주인이 Tesla 연결하지 않아도 동작).

---

## 4. Tesla Fleet API 엔드포인트 (우리 앱이 호출하는 것)

아래는 **Tesla 서버**에 요청하는 주소. 우리 백엔드는 `server/services/teslaFleetService.js`에서 이 주소들로 `fetch` 호출.

| 용도 | Tesla Fleet API | 비고 |
|------|------------------|------|
| 차량 목록 | `GET /api/1/vehicles` | 페이지네이션, response에 배열 |
| 단일 차량 | `GET /api/1/vehicles/{vinOrId}` | VIN 또는 vehicle id |
| Owner 여부 | `GET /api/1/vehicles/{vin}/drivers` | 2xx = owner, 4xx/5xx = driver 등 |
| Telemetry | `GET /api/1/vehicles/{vehicleId}/telemetry` | 일부 리전/계정만 지원, 404 시 안내 메시지 반환 |
| Charging sessions | `GET /api/1/dx/charging/sessions?vehicle_id=...&start_date=...&end_date=...` | **Fleet Partner** 전용. 개인 OAuth 시 "unable to get user id" 가능 |

- 인증: 모든 요청에 `Authorization: Bearer <access_token>`.
- 토큰: Owner OAuth 토큰 또는 **Partner 토큰**(env에 설정 시).

---

## 5. 리전 등록 (Fleet API 사용 전 한 번)

일부 기능/리전은 **앱을 해당 리전에 등록**해야 동작함.

1. **공개키 준비**  
   - `openssl ecparam -name prime256v1 -genkey -noout -out server/key.pem`  
   - `openssl ec -in server/key.pem -pubout -out server/public-key.pem`  
   - `key.pem`은 커밋하지 말 것 (.gitignore에 있음).

2. **공개키 서빙**  
   - `GET /.well-known/appspecific/com.tesla.3p.public-key.pem` 이 백엔드에서 응답하도록 이미 구현됨 (`server/server.js`).  
   - 배포 시 `https://<TESLA_PARTNER_DOMAIN>/.well-known/appspecific/com.tesla.3p.public-key.pem` 로 접근 가능해야 함.

3. **리전 등록 스크립트**  
   - `server/scripts/register-tesla-region.js`  
   - 실행: `TESLA_PARTNER_DOMAIN=api.mongoori.com node server/scripts/register-tesla-region.js` (서버 디렉터리에서).  
   - Tesla Developer 앱의 Allowed Origins 등에 해당 도메인 포함 필요.

자세한 조건은 [Tesla Fleet API – Partner / Region 등록](https://developer.tesla.com/docs/fleet-api) 문서 참고.

---

## 6. 토큰 사용 우선순위

Charging sessions·Telemetry 호출 시:

1. **TESLA_PARTNER_ACCESS_TOKEN** 또는 **TESLA_ACCESS_TOKEN** 이 있으면 → 해당 토큰 사용 (Owner 연결 불필요).
2. 없으면 → 해당 차량의 Owner `teslaAccessToken` 사용 (Owner가 Connect Tesla 한 경우).

차량 목록·단일 차량 조회는 **Owner OAuth**만 사용 (Partner 토큰으로 목록 호출은 현재 미사용).

---

## 7. 에러·제한 사항

| 상황 | 메시지/대응 |
|------|-------------|
| Charging sessions "unable to get user id" | Fleet **Partner** 전용. 개인 OAuth만으로는 불가. Partner 토큰 발급 또는 Partner 승인 필요. |
| Telemetry 404 (HTML) | 해당 리전/계정에서 Telemetry 미지원일 수 있음. 백엔드에서 404 시 안내 문구로 치환해 반환. |
| Owner/Driver 구분 | `/api/1/vehicles/{vin}/drivers` 호출로 Owner만 2xx. 우리는 차량 목록에 `isOwner` 플래그로 내려줌. |

역할·Partner·운영자 정책은 **docs/ROLES_AND_TESLA.md** 참고.
