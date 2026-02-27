# Mongoori Rides 배포 가이드 (Coolify)

Coolify로 **백엔드(API)** 와 **프론트엔드(웹)** 를 같은 저장소에서 배포하고, GitHub 푸시 시 자동 반영되게 설정하는 방법입니다.

---

## 로컬 + 배포 둘 다 쓰기 (한 번에 요약)

| 단계 | 할 일 | 누가? |
|------|--------|--------|
| **로컬** | `client/.env` 에 `VITE_BASE_URL=` **(비움)** 유지 | ✅ 이미 적용됨 (저장소에 반영) |
| **GitHub** | `client/.env` 커밋하지 않음 | ✅ `.gitignore`에 `client/.env` 있음 → push 시 제외됨 |
| **Coolify** | 프론트 앱 **Environment Variables** 에 `VITE_BASE_URL` = `https://api.mongoori.com` 넣고 **재빌드** | 👤 Coolify 웹에서 직접 한 번 설정 |

로컬에서는 `npm run dev` 시 API·Tesla OAuth 모두 `localhost:3000` 사용. 배포 후에는 Coolify에 넣은 `VITE_BASE_URL` 로 외부 접속 가능.

---

## 배포 후 운영자(Operator) 계정 설정

배포 환경 DB에는 로컬에서 돌린 `set-admin.js`가 반영되지 않습니다. **API로** 운영자로 바꾸려면:

1. **Coolify(또는 서버) 환경 변수**에 추가:
   ```bash
   SET_ADMIN_SECRET=아무거나-긴-랜덤-문자열
   ```
2. **백엔드 재배포** 후, 아래 한 번만 호출 (curl 또는 Postman):
   ```bash
   curl -X POST https://api.mongoori.com/api/admin/set-role \
     -H "Content-Type: application/json" \
     -H "X-Set-Admin-Secret: 아무거나-긴-랜덤-문자열" \
     -d '{"email":"contact@mongoori.com","role":"admin"}'
   ```
   실제 API 주소와 `X-Set-Admin-Secret` 값을 배포 환경에 맞게 바꾸세요.
3. **contact@mongoori.com**으로 로그아웃 후 다시 로그인하면 **Operator**로 표시됩니다.

---

## 0. 로컬 서버에 Coolify 설치 (예: 192.168.1.188)

서버에 DUMB(미디어 서버), gala-node, npm 등이 이미 있어도 Coolify를 같이 쓸 수 있습니다. Coolify는 **포트 8000**으로 웹 UI를 띄우고, 앱들은 Docker 컨테이너로 격리됩니다.

### 0-1. 서버 접속

```bash
ssh 사용자명@192.168.1.188
```

(실제 사용자명으로 바꾸세요. root이면 `ssh root@192.168.1.188`)

### 0-2. 포트 8000 확인

다른 서비스가 8000을 쓰면 충돌합니다. 확인:

```bash
sudo ss -tuln | grep 8000
# 또는
sudo netstat -tuln | grep 8000
```

아무것도 안 나오면 8000 사용 가능합니다. DUMB·gala-node는 보통 다른 포트를 쓰므로 그대로 두면 됩니다.

### 0-3. Coolify 설치 실행

**방법 A – 한 줄로 실행 (추천)**

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

**방법 B – 저장소 스크립트 사용**

```bash
curl -fsSL https://raw.githubusercontent.com/sawolsamsip/mongoori-rides/main/scripts/coolify-install-on-server.sh | sudo bash
```

스크립트가 Docker(24+)가 없으면 설치하고, Coolify를 `/data/coolify` 등에 설치합니다. 기존 Docker가 있어도 보통 함께 동작합니다.

### 0-4. 첫 접속 및 관리자 계정

1. 같은 네트워크의 PC/맥 브라우저에서 **http://192.168.1.188:8000** 접속.
2. 처음 한 번 **관리자 계정** 생성 (이메일, 비밀번호 등).
3. 로그인하면 Coolify 대시보드가 보입니다.

이제 아래 1~3단계대로 **mongoori-rides** 백엔드·프론트를 Coolify에 추가하면 됩니다.

**로컬 IP만 쓸 때 (도메인 없음)**  
- Coolify에서 백엔드/프론트에 **도메인** 대신 **192.168.1.188**와 포트(예: 3001, 3002) 또는 Coolify가 부여한 URL을 쓰면 됩니다.  
- `FRONTEND_URL` = `http://192.168.1.188:프론트포트`  
- `VITE_BASE_URL` = `http://192.168.1.188:백엔드포트`  
- 같은 공유기 안에서만 접속 가능합니다. 외부 접속이 필요하면 나중에 도메인·리버스 프록시를 붙이면 됩니다.

---

## 0-5. 엔드포인트(서버)와 도메인 설정 (192.168.1.88, 포트 8000)

Coolify를 **192.168.1.88**에 설치했고 UI가 **포트 8000**으로 떠 있다면, 아래 순서로 “어디에 배포할지”와 “어떤 주소로 접속할지”를 설정한 뒤 Deploy 하면 됩니다.

### 1) 엔드포인트 = 서버(Server)

- 배포 대상 머신을 Coolify에서는 **Server** 한 개로 등록해서 씁니다.
- **같은 머신(192.168.1.88)**에 Coolify를 설치했다면, 설치 시 그 머신이 **로컬 서버**로 이미 들어가 있는 경우가 많습니다.
- **확인**: 왼쪽 메뉴 **Servers** → 서버 한 개 보이면 OK (이게 엔드포인트입니다). 없으면 **+ Add Server** → **Local** 또는 해당 머신(192.168.1.88)으로 추가합니다.

### 2) 배포 위치 = Destination

- 앱은 “서버 위의 Docker 네트워크”인 **Destination**에 배포됩니다.
- **확인**: **Destinations** 메뉴에 최소 1개 있으면 됩니다. 없으면 **Destinations** → **+ Add** → **Server**에 위 서버 선택 → **Network Name** 입력 후 저장합니다.
- Application 만들 때 **Destination**을 이걸로 선택하면 192.168.1.88 위에 배포됩니다.

### 3) 도메인(FQDN) – 로컬 IP만 쓸 때

도메인 없이 **192.168.1.88**로만 접속하려면:

**방식 A – 포트 매핑 (추천)**  
- Application 설정에서 **Port Exposes**: 백엔드는 `3000`, 프론트(정적 Nginx)는 `80`.
- **Port Mappings**에 `호스트포트:컨테이너포트` 지정.  
  - 백엔드: `3001:3000` → 접속 주소 **http://192.168.1.88:3001**  
  - 프론트: `3002:80` → 접속 주소 **http://192.168.1.88:3002**  
- **Domain/FQDN** 필드는 비워 두거나, Coolify가 자동 부여한 값만 써도 됩니다.

**방식 B – FQDN에 IP:포트 입력**  
- **Domain / FQDN** 란에 `http://192.168.1.88:3001`(백엔드), `http://192.168.1.88:3002`(프론트) 처럼 넣을 수 있으면 그렇게 지정하고, **Port Exposes**도 위와 같이 맞춥니다.

### 4) 정리 (로컬 IP 사용 시)

| 구분 | 설정 |
|------|------|
| **엔드포인트** | Servers에 192.168.1.88(로컬) 한 개 |
| **Destination** | 위 서버로 1개, 앱 배포 시 선택 |
| **백엔드 주소** | `http://192.168.1.88:3001` (Port Mapping `3001:3000`) |
| **프론트 주소** | `http://192.168.1.88:3002` (Port Mapping `3002:80`) |
| **FRONTEND_URL** (백엔드 env) | `http://192.168.1.88:3002` |
| **VITE_BASE_URL** (프론트 빌드 env) | `http://192.168.1.88:3001` |

이렇게 맞춘 뒤 **Deploy** 하면, 같은 LAN에서 `http://192.168.1.88:3002`로 웹, `http://192.168.1.88:3001`로 API 접속 가능합니다.

---

## 1. 백엔드(API) 배포

### 1-1. 리소스 추가

1. Coolify 대시보드 → **Project** 선택 (또는 새로 생성) → **+ Add Resource** → **Application**.
2. **Source**: GitHub 등으로 `sawolsamsip/mongoori-rides` 저장소 연결.
3. **Branch**: `main` (또는 사용하는 브랜치).
4. **Destination**: 0-5에서 확인한 Destination 선택 (192.168.1.88에 배포되도록).

### 1-2. 빌드/실행 설정

| 항목 | 값 |
|------|-----|
| **Base Directory** | `server` |
| **Build Pack** | Nixpacks (Node 감지) |
| **Build Command** | 비워두거나 `npm install` (기본) |
| **Start Command** | `npm start` 또는 `node server.js` |
| **Port** / **Port Exposes** | `3000` (Express 기본 포트) |
| **Port Mappings** (로컬 IP 접속 시) | `3001:3000` → 접속 주소 `http://192.168.1.88:3001` |

`server/package.json`에 `"start": "node server.js"` 있으면 **Start Command**는 `npm start`로 두면 됩니다.

### 1-3. 환경 변수

Coolify 해당 Application **Environment Variables**에 아래 추가 (로컬 `server/.env`에서 복사).

**필수**

- `MONGODB_URI`
- `JWT_SECRET`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (웹훅 URL 정한 뒤 Stripe에서 발급한 값으로 설정)
- `FRONTEND_URL` → **프론트 배포 후** 넣기 (로컬: `http://192.168.1.88:3002`)

**선택**

- `INVOICE_COMPANY_NAME`, `INVOICE_COMPANY_EMAIL`, `INVOICE_COMPANY_PHONE`
- `SMTP_*` (이메일 발송용)

### 1-4. 도메인/포트

- **Domain**: API용 도메인 또는 서브도메인 (예: `api.mongoori.com` 또는 Coolify가 준 URL).
- 포트 3000이 외부에 노출되도록 Coolify에서 설정 (보통 도메인 연결 시 자동).

### 1-5. 배포

**Deploy** 실행 후, 배포된 **백엔드 URL**을 복사해 둡니다. (예: `https://api.mongoori.com`)

---

## 2. 프론트엔드(웹) 배포

### 2-1. 리소스 추가

1. 같은 Coolify 프로젝트에서 **+ Add Resource** → **Application**.
2. **Source**: 같은 저장소 `sawolsamsip/mongoori-rides`, **Branch**: `main`.

### 2-2. 빌드/실행 설정 (정적 사이트)

| 항목 | 값 |
|------|-----|
| **Base Directory** | `client` |
| **Build Pack** | Nixpacks |
| **Is it a static site?** | **Yes** (체크) |
| **Publish Directory** | `dist` |
| **Port Mappings** (로컬 IP 접속 시) | `3002:80` → 접속 주소 `http://192.168.1.88:3002` |

Nixpacks가 `client` 안에서 `npm install` → `npm run build` 하고, 결과물 `dist`를 웹 서버(Nginx 등)로 서빙합니다.

### 2-3. 환경 변수

**Build 시점**에 필요하므로 **Environment Variables**에 반드시 넣기:

| Name | Value |
|------|--------|
| `VITE_BASE_URL` | 백엔드 URL (끝에 `/` 없이). 로컬: `http://192.168.1.88:3001` / 도메인: `https://api.mongoori.com` |

이 값이 빌드 시 프론트 코드에 들어가서, 배포된 사이트는 이 API 주소로 요청합니다.

### 2-4. 도메인

- **Domain/FQDN**: 도메인 쓰면 여기 입력. 로컬 IP만 쓸 때는 0-5처럼 **Port Mappings** `3002:80`만 넣고 `http://192.168.1.88:3002`로 접속하면 됩니다.

### 2-5. 배포

**Deploy** 실행 후, **프론트 URL**을 복사해 둡니다.

---

## 3. 서로 연결

### 3-1. 백엔드에 프론트 URL 알리기

1. Coolify에서 **백엔드 Application** → **Environment Variables**.
2. `FRONTEND_URL` 값을 **프론트엔드 URL**로 설정 (예: `https://mongoori.com`).
3. 저장 후 **재배포** 또는 **Restart** (CORS·리다이렉트에 사용됨).

### 3-2. Stripe 웹훅

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL**: `https://<백엔드-도메인>/api/payment/webhook` (예: `https://api.mongoori.com/api/payment/webhook`).
3. 이벤트: `checkout.session.completed` 등 필요 이벤트 선택.
4. 생성 후 **Signing secret** (`whsec_...`) 복사.
5. Coolify 백엔드 **Environment**에 `STRIPE_WEBHOOK_SECRET` = `whsec_...` 로 설정 후 재배포/재시작.

### 3-3. Tesla Fleet API 리전 등록

Owner가 Tesla 연결 후 **"Account must be registered in the current region"** 오류가 나면, **리전 등록**을 한 번 해야 합니다.

1. [Tesla Developer](https://developer.tesla.com)에서 앱의 **Allowed Origin URLs**에 API 도메인 포함 (예: `https://api.mongoori.com`).
2. **Public key 호스팅**: EC 공개키(PEM, secp256r1)를 아래 URL에서 제공 가능하도록 설정:
   - `https://<API도메인>/.well-known/appspecific/com.tesla.3p.public-key.pem`  
   (예: `https://api.mongoori.com/.well-known/appspecific/com.tesla.3p.public-key.pem`)  
   생성 예: `openssl ecparam -name prime256v1 -genkey -noout -out key.pem` → `openssl ec -in key.pem -pubout -out public-key.pem`
3. 서버에서 **한 번만** 실행 (로컬 또는 배포 서버에서 `.env` 로드 후):
   ```bash
   cd server
   TESLA_PARTNER_DOMAIN=api.mongoori.com node scripts/register-tesla-region.js
   ```
   `TESLA_PARTNER_DOMAIN`은 Allowed Origins의 **루트 도메인**과 맞추면 됩니다 (예: `api.mongoori.com`).
4. 성공하면 해당 리전에서 Owner가 Connect Tesla → Sync 후 차량 목록을 볼 수 있습니다.

자세한 문서: [Tesla Fleet API – Partner Endpoints (register)](https://developer.tesla.com/docs/fleet-api/endpoints/partner-endpoints#register)

---

## 4. 자동 배포 (Git 푸시 시)

- Coolify는 연결된 GitHub 저장소에 **푸시**가 있으면 해당 리소스를 자동으로 다시 빌드·배포할 수 있습니다.
- 리소스 설정에서 **CI/CD** 또는 **Auto Deploy** 옵션이 켜져 있는지 확인하세요. (보통 저장소 연결 시 기본 활성화)
- `main`에 `git push origin main` 하면, 백엔드·프론트 리소스가 각각 새 코드로 배포되어 다른 사람들이 접속했을 때 **최신 내용**이 보이게 됩니다.

---

## 체크리스트

- [ ] Coolify에 백엔드 Application 추가 (Base Directory: `server`), 배포 완료, URL 확인
- [ ] Coolify에 프론트 Application 추가 (Base Directory: `client`, Static, Publish: `dist`), `VITE_BASE_URL` 설정, 배포 완료, URL 확인
- [ ] 백엔드 `FRONTEND_URL` = 프론트 URL
- [ ] Stripe 웹훅 URL = `https://<백엔드 URL>/api/payment/webhook`, `STRIPE_WEBHOOK_SECRET` 설정
- [ ] (Tesla 사용 시) Tesla 리전 등록 실행: `TESLA_PARTNER_DOMAIN=api.mongoori.com node server/scripts/register-tesla-region.js`
- [ ] 브라우저에서 프론트 URL 접속 → 로그인·차량 목록·결제 테스트

---

## 문제 해결

- **API 요청 404 / CORS 에러**  
  - 프론트 빌드 시 `VITE_BASE_URL`이 백엔드 URL과 정확히 같은지 확인 (프로토콜·끝 슬래시 제외).  
  - 백엔드 `FRONTEND_URL`에 프론트 URL이 들어가 있는지 확인.

- **프론트 빌드 실패**  
  - Base Directory가 `client`인지, **Is it a static site?** 체크, **Publish Directory** = `dist` 인지 확인.  
  - `client`에서 로컬로 `npm run build` 가 되는지 먼저 확인.

- **결제 후 예약 안 생김**  
  - Stripe 웹훅 URL이 백엔드 실제 URL과 일치하는지, `STRIPE_WEBHOOK_SECRET`이 Stripe에서 복사한 값인지 확인.  
  - Coolify 백엔드 로그에서 `/api/payment/webhook` 4xx/5xx 에러 확인.

- **Tesla: "Account must be registered in the current region"**  
  - Tesla Fleet API는 **리전당 한 번** Partner 등록이 필요합니다.  
  - 위 **3-3. Tesla Fleet API 리전 등록**대로 `TESLA_PARTNER_DOMAIN` 설정 후 `server/scripts/register-tesla-region.js` 실행.  
  - Developer 콘솔에서 Allowed Origins에 API 도메인 포함 여부와, 공개키 URL 호스팅 여부 확인.

이 가이드대로 하면 Coolify만으로 백엔드·프론트를 배포하고, 푸시할 때마다 자동으로 최신 버전이 반영됩니다.
