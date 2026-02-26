# Roles & Tesla API Guide

**Tesla Fleet API 상세**(환경 변수, OAuth, 엔드포인트, 리전 등록)는 **`docs/TESLA_API.md`** 를 참고하세요.

---

## 1. Role 구분 (운전자 / 차량주인 / 운영자)

### 현재 구현된 역할

| 역할 | DB `role` | 설명 | 접근 페이지 |
|------|-----------|------|-------------|
| **운전자 (Driver)** | `user` | 차량을 **빌려 타는** 고객 | 홈, Fleet, Car Details, My Bookings, 결제 |
| **차량주인 (Host/Owner)** | `owner` | 차량을 **등록해 빌려주는** 호스트 | 위 + **Owner Portal**: Dashboard, Manage Cars, Tesla, Bookings, Finances, Incidents |
| **운영자 (Operator/Admin)** | `admin` | 플랫폼 관리, Tesla Partner 토큰으로 차량주인·운전자에게 데이터 제공 | **Admin**: `/admin` (통계, Tesla Partner 설정 상태) + Tesla API는 Partner 토큰 우선 사용 |

- **가입 시 구분**: Sign Up 시 "Rent cars (Driver)" / "List my car (Host)" 선택 가능. Host로 가입하면 처음부터 `role: owner`.
- **나중에 전환**: Driver로 가입했어도 **Owner Portal**(Host a Car 메뉴 또는 `/owner`)에 들어가면 `change-role` API로 `owner`로 전환됨.
- **운영자 (Admin)**: DB에 `role: 'admin'` 인 사용자만 `/admin` 접근. **Tesla Fleet/Partner** 토큰을 서버 `.env`에 설정해 두면, Charging sessions·Telemetry API 호출 시 **Owner 개인 OAuth 대신 Partner 토큰**을 사용해 운전자·차량주인에게 데이터를 보여줌. 첫 운영자 계정은 DB에서 수동 설정 (예: MongoDB Shell `db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })`).

### 페이지별 정리

- **운전자용**: `/`, `/fleet`, `/car-details/:id`, `/my-bookings`, Stripe 결제 후 성공 페이지.
- **차량주인용**: `/owner`, `/owner/dashboard`, `/owner/add-car`, `/owner/manage-cars`, `/owner/manage-bookings`, `/owner/finances`, `/owner/incidentals`, `/owner/tesla`.
- **운영자용**: `/admin` — 플랫폼 통계, Tesla Partner 설정 여부. 운영자 로그인 시 Navbar에 "Admin" 노출.

---

## 2. Tesla Fleet API – Charging Sessions ("unable to get user id")

### 왜 에러가 나는가

- **Charging sessions** (`GET /api/1/dx/charging/sessions`)는 Tesla **Fleet 비즈니스(파트너)** 전용 API입니다.
- 개인 OAuth로 로그인한 **Owner** 토큰으로는 "user id"를 찾을 수 없어 `unable to get user id` 에러가 납니다.
- 즉, **개인 Tesla 계정 연결만으로는 Charging sessions를 쓸 수 없습니다.**

### 하려면 어떻게 해야 하나

1. **Tesla Developer**  
   - [developer.tesla.com](https://developer.tesla.com) 에서 앱 등록 후 **Fleet API** 제품 사용 신청.
2. **Fleet / Partner 비즈니스 승인**  
   - Tesla에서 **Fleet API 파트너(비즈니스)** 로 승인받아야 Charging sessions 같은 DX 엔드포인트 사용 가능.
   - 신청·승인 절차는 Tesla 정책에 따름 (문서: [Tesla Fleet API](https://developer.tesla.com/docs/fleet-api)).
3. **리전 등록**  
   - 승인 후 사용할 리전(예: North America)에 대해 **한 번만** 리전 등록 필요.
   - 프로젝트 루트의 `server/scripts/register-tesla-region.js` 참고.  
   - 공개키 서빙(`/.well-known/appspecific/com.tesla.3p.public-key.pem`), Allowed Origins 등 설정 필요.

정리하면, **개인 Owner가 Tesla 로그인만 한 상태**로는 Charging sessions는 사용할 수 없고, **Tesla 쪽 Fleet/Partner 비즈니스 승인 + 리전 등록**이 선행되어야 합니다.

---

## 3. Tesla Telemetry (차량 원격 정보)

### 누가 허용하는가

- **Telemetry**는 **차량 소유자(Owner)** 가 우리 앱에 Tesla 계정을 연결할 때, OAuth scope에 포함된 권한으로 허용됩니다.
- **운전자(Driver)** 는 Tesla 계정을 연결하지 않습니다. 빌려 탈 뿐이므로, **운전자가 따로 “Telemetry 허용”을 할 구조가 아닙니다.**

### Owner가 할 일

1. **Owner Portal → Tesla** 메뉴에서 **Connect Tesla** (OAuth) 진행.
2. Tesla 로그인 시 요청하는 권한(scope)에 **vehicle_device_data** 등이 포함되어 있으면, 동의 시 그 계정·차량에 대한 telemetry 접근이 허용됨.
3. 그 후 우리 백엔드에서 `GET /api/1/vehicles/{id}/telemetry` 호출 시, **해당 Owner의 토큰**으로 요청하므로, **Owner가 연결한 차량**에 한해 telemetry가 나올 수 있음.

### "Telemetry unavailable" 이 나오는 경우

- **권한/리전**: 해당 계정·앱이 telemetry를 허용하는 리전/제품에 등록되어 있는지 확인.
- **Tesla 앱/계정 설정**: 일부 지역·계정에서는 Tesla 앱에서 “데이터 공유” 또는 제3자 앱 권한을 켜야 할 수 있음. (Tesla 정책·앱 버전에 따라 상이.)
- **차량 상태**: 차량이 오프라인이면 데이터가 없을 수 있음.

### “운전자가 처음 예약/승인할 때 자동으로 허용” 가능 여부

- **불가능합니다.** Telemetry는 **차량 소유 Tesla 계정** 기준입니다.  
- 빌려 타는 운전자는 그 차의 Tesla 소유자가 아니므로, 우리 앱에서 “운전자 승인”으로 telemetry를 켤 수 없습니다.  
- 따라서 **Owner가 Tesla 연결 시 한 번 허용**하면, 그 차량에 대해 우리 앱이 telemetry를 요청할 수 있는 구조가 맞습니다.

---

## 4. 운영자 + Tesla Partner 토큰으로 운전자·차량주인에게 데이터 제공

- **서버 .env**에 `TESLA_PARTNER_ACCESS_TOKEN` 또는 `TESLA_ACCESS_TOKEN`(Fleet Partner 토큰)을 설정해 두면, **Charging sessions**와 **Vehicle telemetry** API 호출 시 **Owner 개인 OAuth 대신 이 토큰**을 사용합니다.
- 따라서 **각 차량주인이 Tesla 연결을 하지 않아도**, 운영자가 한 번 Partner 토큰만 설정하면 차량주인·운전자 화면에서 Charging sessions / Telemetry를 볼 수 있습니다.
- 운영자는 `role: admin` 계정으로 로그인 후 **Admin** 메뉴(`/admin`)에서 플랫폼 통계와 Tesla Partner 설정 여부를 확인할 수 있습니다. Admin 계정은 DB에서 직접 `role: 'admin'`으로 설정해야 합니다.

## 5. 요약

| 항목 | 운전자(Driver) | 차량주인(Owner) | 운영자(Admin) |
|------|----------------|------------------|----------------|
| 가입 시 선택 | "Rent cars (Driver)" | "List my car (Host)" | DB에서 role 수동 설정 |
| Tesla 연결 | 하지 않음 | 선택(Partner 토큰 있으면 불필요) | Partner 토큰을 .env에 설정 |
| Charging sessions | 해당 없음 | Partner 토큰 또는 개인 OAuth | Partner 토큰으로 API 호출 |
| Telemetry | 해당 없음 | Partner 토큰 또는 개인 OAuth | Partner 토큰으로 API 호출 |
| 전용 페이지 | Fleet, My Bookings | Owner Portal | `/admin` |
