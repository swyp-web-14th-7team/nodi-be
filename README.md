# nodi-be

프로필 카드 공유 서비스의 백엔드 API 서버입니다. 사용자가 자신의 프로필을 카드 형태로 만들어
공유하고, 다른 사람과 명함처럼 연결(커넥션)을 맺어 컬렉션으로 관리하는 서비스를 제공합니다.

- **API 문서(Swagger)**: `/api-docs` (OpenAPI JSON: `/docs`)
- **헬스체크**: `GET /health`

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 언어 / 런타임 | TypeScript, Node.js 22 |
| 프레임워크 | NestJS 11 (Express 플랫폼) |
| ORM / DB | Prisma 7 + `@prisma/adapter-mariadb` (MariaDB / MySQL) |
| 캐시 / 세션 | Redis 7 (`ioredis`) — refresh token 등 저장, AOF 영속화 |
| 인증 | JWT (access / refresh), OAuth 2.0 — Google · Naver · Kakao |
| 파일 / 이미지 | AWS S3 + CloudFront, `sharp` (이미지 리사이즈·변환) |
| 검증 / 직렬화 | `class-validator`, `class-transformer` |
| 로깅 | `nestjs-pino` (`pino-http`), 개발 환경은 `pino-pretty` |
| API 문서 | `@nestjs/swagger` (OpenAPI 3.1) |
| ID | ULID (요청 ID·리소스 식별자) |
| 테스트 | Jest, Supertest |
| 린트 / 포맷 | ESLint 9, Prettier (single quote, trailing comma all, printWidth 80) |

## 프로젝트 구조

```
src/
├── main.ts                # 부트스트랩: 전역 파이프·인터셉터·필터, CORS, Swagger, pino 로거
├── app/                   # 루트 모듈, 헬스체크 컨트롤러
├── common/                # 공통 요소 (도메인 비종속)
│   ├── decorator/         # @Auth, @Roles, @CurrentUser, Swagger 응답 데코레이터
│   ├── dto/ · type/       # 페이지네이션, 공통 응답 타입
│   ├── filter/            # PrismaExceptionFilter (Prisma 에러 → HTTP)
│   ├── guard/             # AuthGuard, RolesGuard
│   ├── interceptor/       # TransformInterceptor (성공 응답 규격화)
│   └── enum/              # Provider, UserRole 등
├── lib/                   # 외부 인프라 연동 모듈
│   ├── prisma/ · redis/ · s3/
│   ├── oauth/             # provider별 전략 + resolver
│   └── logger/            # pino 설정
└── module/                # 도메인 모듈 (controller · service · repository · dto · type)
    ├── auth/ · users/ · profile-cards/
    ├── skills/ · skill-categories/ · job-type/ · interests/
    ├── personalities/ · affiliation-statuses/ · purposes/
    ├── collections/ · connections/
    └── files/ · card-background-images/
```

경로 별칭(`tsconfig.json`)

- `@/*` → `src/*`
- `@/prisma/*` → `prisma/generated/prisma/*`

## 컨벤션

### 도메인 모듈 구성
각 도메인은 `controller` → `service` → `repository` 계층으로 나뉩니다. DTO는 `dto/`,
응답·도메인 타입은 `type/` 하위에 둡니다. 파일명은 `kebab-case`, 역할 접미사를 붙입니다
(`*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.dto.ts`, `*.type.ts`).

### 응답 규격
모든 성공 응답은 `TransformInterceptor`가 아래 형태로 감싸고 **상태코드를 200으로 통일**합니다.

```jsonc
{ "success": true, "status": 200, "data": { /* ... */ } }
```

Prisma 예외는 `PrismaExceptionFilter`가 적절한 HTTP 상태로 변환합니다. 컨트롤러의 요약 설명은
`@nestjs/swagger` 플러그인이 JSDoc 주석에서 자동 추출합니다(`introspectComments`).

### 검증
전역 `ValidationPipe`를 `whitelist: true`, `transform: true`로 사용합니다. 요청은 DTO
인스턴스로 변환되어 기본값 주입과 `@Type` 기반 타입 변환이 적용됩니다.

### 코드 스타일
커밋 전 `npm run format`, `npm run lint`를 실행합니다. 커밋 메시지는
`feat:`, `fix:`, `chore:` 등의 접두사를 사용합니다.

## 로깅

`nestjs-pino` 기반 구조적(JSON) 로깅입니다. (`src/lib/logger/logger.module.ts`)

- **요청 추적**: 요청마다 ULID `req.id`를 발급하고 `X-Request-Id` 헤더로 응답합니다.
  기존 `X-Request-Id`가 있으면 재사용하므로 nginx→백엔드 간 요청을 한 ID로 묶을 수 있습니다.
- **환경별 출력**: `NODE_ENV=prod`는 JSON(레벨을 문자열로 출력, 민감 헤더 redact),
  개발 환경은 `pino-pretty`로 사람이 읽기 쉬운 형식 + `debug` 레벨.
- **헬스체크 제외**: `GET /health`는 Docker HEALTHCHECK가 자주 호출하므로 자동 로그에서 제외합니다.

운영에서는 컨테이너 로그를 **Alloy → Loki → Grafana** 스택으로 수집·조회합니다. 아키텍처,
LogQL 조회 예시, 트러블슈팅은 [`monitoring/README.md`](./monitoring/README.md)를 참고하세요.

## 로컬 개발

### 요구사항
- Node.js 22
- MariaDB / MySQL, Redis (또는 접근 가능한 원격 인스턴스)

### 설정 및 실행

```bash
# 1) 의존성 설치
npm ci

# 2) 환경변수 설정 (.env.example 참고)
cp .env.example .env

# 3) Prisma 클라이언트 생성 & 마이그레이션
npx prisma generate
npx prisma migrate dev

# (선택) 시드 데이터 삽입
npx prisma db seed

# 4) 개발 서버 (watch)
npm run start:dev
```

기본 포트는 `3000`(`PORT` 환경변수로 변경). 주요 환경변수는 `.env.example`에 정리되어 있습니다
— DB, OAuth(Google/Naver/Kakao) 자격증명, Redis, AWS(S3/CloudFront), JWT 시크릿 등.

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run start:dev` | watch 모드 개발 서버 |
| `npm run start:prod` | 빌드 산출물(`dist/src/main`) 실행 |
| `npm run build` | `nest build` |
| `npm run lint` | ESLint (`--fix`) |
| `npm run format` | Prettier 포맷 |
| `npm test` / `test:cov` / `test:e2e` | 단위 / 커버리지 / E2E 테스트 |

## 빌드 & 배포

### 이미지 빌드 (CI)
`main` 브랜치에 push(=PR 머지)되면 GitHub Actions가 **linux/arm64** 이미지를 빌드해
GHCR(`ghcr.io/swyp-web-14th-7team/nodi-be`)에 푸시한 뒤 운영 서버에 SSH로 접속해
이미지를 pull하고 Blue-Green 배포 스크립트를 실행합니다. (`.github/workflows/build-image.yml`)

- 빌드 전 `package.json`의 `version` 태그가 GHCR에 이미 있으면 **실패**시켜 버전 누락을 방지합니다.
  → 배포마다 `package.json` 버전을 올려야 합니다.
- 태그: `latest`, 커밋 SHA(불변 핀), `v<version>`(릴리스 식별).
- 멀티스테이지 `Dockerfile`(node:22-alpine)로 빌드 후 dev 의존성을 제거한 런타임 이미지를 생성하며,
  `/health` 기반 `HEALTHCHECK`를 포함합니다.

### GitHub Actions 배포 Secrets

`production` environment 또는 Repository Actions secrets에 아래 값을 등록해야 합니다.

| Secret | 설명 |
| --- | --- |
| `PROD_SSH_HOST` | 운영 서버 IP 또는 도메인 |
| `PROD_SSH_PORT` | SSH 포트(일반적으로 `22`) |
| `PROD_SSH_USER` | SSH 사용자(예: `ubuntu`) |
| `PROD_SSH_PRIVATE_KEY` | 운영 서버 접속용 개인키 전체 |
| `PROD_SSH_FINGERPRINT` | 운영 서버 SSH host key fingerprint |

민감하지 않은 값은 `production` environment 또는 Repository Actions variables에 등록합니다.

| Variable | 설명 |
| --- | --- |
| `PROD_DEPLOY_PATH` | 서버의 배포 루트 절대경로(예: `/home/ubuntu/nodi-be`) |
| `GHCR_IMAGE` | 태그를 제외한 이미지 경로(예: `ghcr.io/swyp-web-14th-7team/nodi-be`) |

SSH 사용자는 `docker` 명령을 실행할 권한이 있어야 하며, private GHCR 이미지를 받을 수 있도록
서버에서 `docker login ghcr.io`가 미리 완료되어 있어야 합니다. 배포 job은 현재 커밋의
`scripts/deploy.sh`를 `${PROD_DEPLOY_PATH}/scripts/deploy.sh`에 덮어쓴 뒤 해당 절대경로로 실행합니다.

### 무중단 배포 (Blue-Green)
운영 서버는 `docker-compose.yml` + nginx로 **Blue-Green 무중단 배포**를 합니다.

```bash
docker compose pull          # ★ 먼저 GHCR에서 새 이미지를 받아둘 것
./scripts/deploy.sh
```

`scripts/deploy.sh` 흐름:

1. 현재 활성 색 파악 (`nginx/active/upstream.conf`)
2. 반대 색을 새 이미지로 기동
3. 새 색 **헬스체크** — 모든 replica가 healthy가 될 때까지 (실패 시 배포 취소, 현재 색 무사)
4. `upstream.conf`를 새 색으로 교체
5. `nginx -s reload` (graceful, 무중단 전환)
6. **스모크 테스트** — nginx 경유 실제 200 응답 확인 (실패 시 upstream 롤백)
7. 이전 색 종료(stop) — 빠른 롤백을 위해 컨테이너 보존

> 상세 절차·롤백 방법·주의사항(특히 `docker compose pull` 누락 함정)은 `docker-compose.yml`
> 하단과 `scripts/deploy.sh` 상단 주석에 정리되어 있습니다.

### 구성 요소 (docker compose)

| 서비스 | 역할 |
| --- | --- |
| `backend_blue` / `backend_green` | 앱 컨테이너 (각 2 replica) — Blue-Green 대상 |
| `nginx` | 리버스 프록시 / upstream 전환 (호스트 `8080`) |
| `redis` | 캐시·토큰 저장 (AOF 영속, 내부망 전용) |
| `loki` / `alloy` / `grafana` | 로그 수집·조회 스택 (배포와 수명주기 분리) |

## 라이선스

UNLICENSED (비공개)
