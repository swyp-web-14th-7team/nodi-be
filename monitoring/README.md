# 로그 수집 (Alloy → Loki → Grafana)

컨테이너 로그를 모아서 검색할 수 있게 하는 스택입니다.

```
컨테이너 stdout ──(docker.sock)──> Alloy ──push──> Loki <──query── Grafana
```

- **Alloy**: Docker 소켓으로 컨테이너를 자동 탐색해 로그를 읽고 라벨을 붙여 Loki 로 전송
- **Loki**: 로그 저장·검색 (14일 보존, 로컬 파일시스템)
- **Grafana**: 조회 UI (`http://<서버>:3000`, id `admin`)

서비스 정의는 루트 `docker-compose.yml` 에 있고, 이 디렉터리에는 설정 파일만 있습니다.

| 파일 | 역할 |
| --- | --- |
| `alloy/config.alloy` | 수집 대상 탐색, 라벨링, pino JSON 파싱 |
| `loki/loki-config.yml` | 저장소·보존 기간 |
| `grafana/provisioning/datasources/loki.yml` | Loki 데이터소스 자동 등록 |

## 기동

환경변수는 다른 서비스와 동일하게 `.env.deploy` 로 관리합니다. Grafana 비밀번호도 여기서 읽습니다.

```bash
# .env.deploy
GF_SECURITY_ADMIN_PASSWORD=<임의의_긴_비밀번호>
```

⚠️ **이 값을 빠뜨려도 아무 에러가 나지 않습니다.** Grafana 가 조용히 기본 비밀번호
`admin/admin` 으로 뜨고, 3000 포트는 외부에 열려 있으므로 로그 전체가 무방비가 됩니다.
`.env.deploy` 를 새로 만들거나 서버를 옮길 때 이 항목이 있는지 반드시 확인하세요.

```bash
# 서버에서 확인
grep GF_SECURITY_ADMIN_PASSWORD .env.deploy
```

### 비밀번호를 나중에 바꿀 때

`GF_SECURITY_ADMIN_PASSWORD` 는 **Grafana 가 처음 뜰 때(= `grafana-data` 볼륨이 비어 있을 때)만**
적용됩니다. 이미 한 번 뜬 뒤에는 `.env.deploy` 를 고치고 재시작해도 **비밀번호가 바뀌지 않고
예전 것이 그대로 살아 있습니다.** 에러도 안 나서 바뀐 줄 알기 쉬우니 주의하세요.

바꾸려면 `.env.deploy` 를 수정한 뒤 아래 명령까지 실행해야 합니다.

```bash
docker compose exec grafana grafana cli admin reset-admin-password '<새_비밀번호>'
```

```bash
docker compose up -d loki alloy grafana
```

앱과 무관하게 언제든 따로 재시작할 수 있습니다. 설정 파일만 바꿨다면:

```bash
docker compose restart alloy
```

## 조회

`http://<서버>:3000` → Grafana 로그인 → 왼쪽 **Explore** → 데이터소스 `Loki`.

아래는 붙여넣기용 LogQL 모음입니다. 그대로 복사해 Explore 쿼리창에 넣으면 됩니다.

### 기본 선택

```logql
{service=~"backend_.+"}
```
```logql
{service="backend_blue"}
```
```logql
{service="nginx"}
```

`{service=~"backend_.+"}` 는 blue/green 무관하게 백엔드 전체입니다. 배포 중에는 두 색이
잠깐 공존하므로 평소엔 이걸 쓰는 게 편합니다.

### 에러만

```logql
{service=~"backend_.+", level="error"}
```

`level` 은 라벨이라 인덱스에서 바로 걸러져 가장 빠릅니다.

### 본문·상태코드·경로로 필터

```logql
{service=~"backend_.+"} |= "TypeError"
```
```logql
{service=~"backend_.+"} | json | res_statusCode="500"
```
```logql
{service=~"backend_.+"} | json | req_url=~"/auth/.*"
```

`|=` 는 로그 본문에 그 문자열이 포함된 줄(빠름). `| json` 뒤에는 필드로 거릅니다.
필드명은 `| json` 이 중첩을 `_` 로 평탄화한 이름입니다: `res.statusCode → res_statusCode`,
`req.url → req_url`, `user.nickname → user_nickname`.

### 요청 ID 로 한 요청 추적

```logql
{service=~"backend_.+"} | json | req_id="01J..."
```

`req.id` 는 요청마다 다른 값이라 **라벨로 만들면 Loki 인덱스가 터집니다(카디널리티)**.
그래서 라벨이 아니라 본문에 두고 `| json` 으로 파싱해 검색합니다. nginx 가 `X-Request-Id` 를
발급해 백엔드로 넘기므로, 같은 요청은 replica 가 달라도 같은 ID 로 묶입니다.

### 한 줄 요약으로 보기 (대시보드와 동일한 표시)

```logql
{service=~"backend_.+"} | json | line_format "{{if .req_method}}{{.req_method}} {{.req_url}} → {{.res_statusCode}} ({{.responseTime}}ms){{else}}{{.msg}}{{end}}{{if .user_nickname}} [{{.user_nickname}}]{{end}}"
```

`GET /profile-cards → 200 (12ms) [홍길동]` 처럼 접힌 한 줄로 나옵니다. 줄을 클릭하면
원본 필드가 펼쳐집니다. 이 쿼리는 대시보드의 로그 패널과 동일합니다.

### 실시간 스트리밍 (Live, 웹소켓)

위 쿼리들은 우측 상단 **Live** 버튼을 누르면 폴링이 아니라 웹소켓(`/loki/api/v1/tail`)으로
실시간 스트리밍됩니다. `line_format` 도 Live 에서 그대로 적용됩니다. 모바일 로그인 실패 등을
실시간으로 지켜볼 때 유용합니다. 단, Live 는 "지금부터 들어오는 로그"만 흘리며 과거 조회·집계는
안 되니, 추이는 대시보드(폴링)로 봅니다.

### 초당 에러율 (그래프 패널용)

```logql
sum(rate({service=~"backend_.+", level="error"}[1m]))
```

로그 개수 기반 메트릭 쿼리입니다. Explore 에서 실행하면 표가 아니라 그래프로 나옵니다.

> 분위수(p95 등)처럼 `unwrap` 을 쓰는 쿼리는 `by (service)` 로 집계 그룹을 지정해야 합니다.
> 안 그러면 로그 한 줄이 각각 별개 시계열이 돼서 분위수가 계산되지 않습니다
> (대시보드 "응답시간" 패널 참고).

## 라벨

의도적으로 최소한만 둡니다.

| 라벨 | 값 예시 |
| --- | --- |
| `service` | `backend_blue`, `backend_green`, `nginx`, `redis` |
| `container` | `nodi-be-backend_blue-1` (replica 구분) |
| `level` | `info`, `error` (백엔드만) |
| `service_name` | `service` 와 값이 같음 |

`level` 은 백엔드 컨테이너에만 붙습니다. nginx·redis 는 평문 로그라 JSON 파싱을 하지 않습니다.

`service_name` 은 우리가 만든 게 아니라 Loki 3 가 `service` 를 보고 자동으로 붙이는 라벨입니다.
Grafana 의 Logs UI 가 이 이름을 사용해서 그대로 뒀습니다. 값이 같으니 `service` 를 쓰면 됩니다.

수집 대상은 **compose 로 뜬 컨테이너만**입니다. 개발자가 `docker run` 으로 띄운 컨테이너까지
긁어오면 `service` 가 빈 스트림이 생기고, 그 컨테이너의 몇 주치 과거 로그가 한꺼번에 밀려들어와
거부 에러가 쏟아지기 때문입니다. Loki·Alloy·Grafana 자신의 로그도 제외합니다 (`config.alloy` 의 drop 규칙).

## 보존

14일. Loki 의 compactor 가 자동으로 삭제합니다. 늘리려면 `loki/loki-config.yml` 의
`retention_period` 와 `max_query_lookback` 을 **둘 다** 바꾸세요. 하나만 바꾸면
데이터는 남아 있는데 조회가 안 되거나, 조회는 되는데 데이터가 지워집니다.

## 트러블슈팅

**로그가 아예 안 들어옴** — Alloy 가 Docker 소켓을 못 읽는 경우가 대부분입니다.

```bash
docker compose logs alloy | tail -50
```

**Alloy 내부 상태 확인** — Alloy UI 는 호스트에 노출돼 있지 않으니 컨테이너 안에서 확인합니다.

```bash
docker compose exec alloy wget -qO- localhost:12345/metrics | grep loki_write
```

**Grafana 에서 `level` 라벨이 안 보임** — 백엔드가 `NODE_ENV=prod` 로 떠야 합니다.
dev 에서는 pino-pretty 가 사람이 읽는 형식으로 출력해서 JSON 파싱이 되지 않습니다
(`src/lib/logger/logger.module.ts` 참고).

**Loki 가 로그를 거부함 (`timestamp too old`)** — 보존 기간(14일)보다 오래된 로그는 받지 않습니다.
컨테이너를 2주 넘게 정지시켰다 켜면 그 사이 로그가 이 이유로 안 들어올 수 있습니다.

## 알려진 제약 / 후속 작업

- **Grafana 가 평문 HTTP 로 열려 있습니다.** 로그인 비밀번호가 네트워크에 그대로 오갑니다.
  nginx 뒤에 두고 TLS 를 붙이는 것이 다음 작업으로 적절합니다.
- **Grafana 컨테이너에 앱 비밀이 함께 주입됩니다.** `env_file: .env.deploy` 가 파일 전체를
  주입하기 때문에, Grafana 가 쓰지 않는 `DATABASE_URL`·`AWS_SECRET_ACCESS_KEY`·`JWT_SECRET` 까지
  컨테이너 env 에 들어갑니다. 외부에 열린 유일한 서비스라 노출 범위를 줄이려면
  Grafana 전용 env 파일로 분리하거나, `${...}` 치환 방식으로 비밀번호만 넘기면 됩니다.
- **Loki 는 인증이 없습니다.** 지금은 호스트 포트에 노출돼 있지 않아(`expose` 만 사용) 안전하지만,
  `ports` 로 바꾸면 누구나 로그를 읽고 쓸 수 있게 됩니다. 바꾸지 마세요.
- 로그가 호스트 디스크(`loki-data` 볼륨)에 쌓입니다. 서버가 죽으면 로그도 같이 사라지므로,
  장기 보관이 필요해지면 S3 백엔드로 전환을 검토하세요.