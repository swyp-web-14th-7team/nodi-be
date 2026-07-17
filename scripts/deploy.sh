#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Blue-Green 무중단 배포 스크립트
#
# 흐름:
#   1) 현재 활성 색 파악 (nginx/active/upstream.conf 에서 읽음)
#   2) 반대 색을 새 이미지로 기동
#   3) 새 색 헬스체크 (★ 전환 전에! 모든 replica 가 healthy 될 때까지)
#        실패 → 새 색 종료, 배포 취소 (현재 색 무사 = 사용자 영향 0)
#   4) upstream.conf 를 새 색으로 교체
#   5) nginx reload (graceful = 무중단 전환)
#   6) 스모크 테스트 (nginx 통해 실제 200 응답 확인)
#        실패 → upstream 롤백 + reload, 새 색 종료 (현재 색 복귀)
#   7) 이전 색 종료
#
# 최초 부팅(둘 다 없을 때)은 먼저 아래로 띄운 뒤 이 스크립트를 사용:
#   docker compose up -d              # blue + nginx + 로그 수집 스택(loki/alloy/grafana)
#
# 사용법:
#   docker compose pull               # ★ 먼저! GHCR 에서 새 이미지를 받아둘 것
#   ./scripts/deploy.sh
#
# ★ 이 스크립트는 pull 하지 않는다. 받아둔 로컬 이미지로만 배포하므로,
#   pull 을 빼먹으면 옛 이미지가 그대로 다시 뜨고 헬스체크·스모크 테스트는 통과한다
#   (= 배포된 줄 알지만 코드는 그대로). compose 는 캐시된 태그를 다시 받지 않음.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# 프로젝트 루트로 이동 (스크립트가 어디서 실행되든 동일하게 동작)
cd "$(dirname "$0")/.."

ACTIVE_FILE="./nginx/active/upstream.conf"
NGINX_SVC="nginx"
HEALTH_TIMEOUT=90      # 새 색 헬스체크 최대 대기(초)
POLL_INTERVAL=3        # 헬스체크 폴링 간격(초)

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy:warn]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[deploy:error]\033[0m %s\n' "$*" >&2; }

# 색 → compose profile 인자 (blue 는 profile 없음, green 만 "green")
profile_args() { [ "$1" = "green" ] && printf -- '--profile green' || printf ''; }

# ── 1) 현재 활성 색 파악 ──────────────────────────────────────
if [ ! -f "$ACTIVE_FILE" ]; then
  err "$ACTIVE_FILE 가 없습니다. 먼저 'set \$upstream backend_blue:3000;' 로 생성하세요."
  exit 1
fi

if grep -q backend_green "$ACTIVE_FILE"; then
  CURRENT=green; NEXT=blue
else
  CURRENT=blue;  NEXT=green
fi

CUR_SVC="backend_$CURRENT"
NEXT_SVC="backend_$NEXT"
CUR_PROFILE=$(profile_args "$CURRENT")
NEXT_PROFILE=$(profile_args "$NEXT")

log "현재 활성: $CURRENT  →  새로 배포: $NEXT"

# ── 2) 새 색 기동 ─────────────────────────────────────────────
log "$NEXT_SVC 기동..."
# shellcheck disable=SC2086
docker compose $NEXT_PROFILE up -d "$NEXT_SVC"

# ── 3) 새 색 헬스체크 (전환 전!) ──────────────────────────────
log "$NEXT_SVC 헬스체크 대기 (최대 ${HEALTH_TIMEOUT}s, replica 전체 healthy 필요)..."
elapsed=0
while :; do
  # shellcheck disable=SC2086
  ids=$(docker compose $NEXT_PROFILE ps -q "$NEXT_SVC")
  total=0; healthy=0
  for id in $ids; do
    total=$((total + 1))
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$id" 2>/dev/null || echo none)
    [ "$status" = "healthy" ] && healthy=$((healthy + 1))
  done
  log "  healthy ${healthy}/${total:-0}"

  if [ "$total" -gt 0 ] && [ "$healthy" -eq "$total" ]; then
    log "✅ $NEXT_SVC 전체 healthy"
    break
  fi

  if [ "$elapsed" -ge "$HEALTH_TIMEOUT" ]; then
    err "$NEXT_SVC 헬스체크 실패 → 배포 취소 (현재 색 $CURRENT 무사)"
    # shellcheck disable=SC2086
    docker compose $NEXT_PROFILE rm -sf "$NEXT_SVC" || true
    exit 1
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
done

# ── 4) upstream 전환 ──────────────────────────────────────────
log "upstream → $NEXT_SVC 로 전환"
printf 'set $upstream %s:3000;\n' "$NEXT_SVC" > "$ACTIVE_FILE"

# ── 5) nginx reload (무중단) ──────────────────────────────────
log "nginx reload (graceful)"
docker compose exec -T "$NGINX_SVC" nginx -s reload
sleep 2   # 워커 교체 + DNS 재해석 잠깐 대기

# ── 6) 스모크 테스트 (nginx 통해 실제 응답 확인) ──────────────
log "스모크 테스트 (http://localhost/health)..."
if ! curl -fsS -m 5 http://localhost:8080/health > /dev/null; then
  err "스모크 테스트 실패 → 롤백 ($CURRENT 로 복귀)"
  printf 'set $upstream %s:3000;\n' "$CUR_SVC" > "$ACTIVE_FILE"
  docker compose exec -T "$NGINX_SVC" nginx -s reload
  # shellcheck disable=SC2086
  docker compose $NEXT_PROFILE rm -sf "$NEXT_SVC" || true
  err "롤백 완료. $CURRENT 가 다시 활성."
  exit 1
fi
log "✅ 스모크 테스트 통과"

# ── 7) 이전 색 종료 ───────────────────────────────────────────
log "이전 색 $CUR_SVC 종료"
# shellcheck disable=SC2086
docker compose $CUR_PROFILE rm -sf "$CUR_SVC" || true

log "🎉 무중단 배포 성공: $CURRENT → $NEXT"
