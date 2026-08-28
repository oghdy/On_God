#!/usr/bin/env bash
# P0-S3-T1: dev/prod Supabase 스키마로부터 TypeScript 타입 생성
#
# `--project-id`로 클라우드에 연결된 프로젝트에서 직접 타입을 받아온다 — 로컬 컨테이너
# (Docker/Podman)도, DB 비밀번호도 필요 없다. Docker가 필요한 건 완전 오프라인 로컬
# 스택(`supabase start`)을 쓸 때뿐이다 (P0-S3-T1 후속, backend-log 2026-08-28 참고 —
# 이전엔 `--db-url` 방식을 쓰다 Docker 에러를 만나 마이그레이션 SQL 기준으로 손으로 타입을
# 작성했었는데, 그건 불필요한 우회였다).
#
# 필요한 건 `SUPABASE_ACCESS_TOKEN` 환경변수(Personal Access Token)뿐. 이 스크립트는
# 그 값을 저장하지 않는다 — 실행할 때마다 셸에서 넘겨줘라:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx pnpm --filter @ongod/db gen:types
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. .env.example을 복사해 값을 채워라." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TARGET="${1:-dev}"
case "$TARGET" in
  dev)
    REF="${SUPABASE_DEV_PROJECT_REF:-}"
    ;;
  prod)
    REF="${SUPABASE_PROD_PROJECT_REF:-}"
    ;;
  *)
    echo "usage: gen-types.sh [dev|prod]" >&2
    exit 1
    ;;
esac

if [ -z "$REF" ]; then
  echo "error: SUPABASE_${TARGET^^}_PROJECT_REF가 .env에 없다." >&2
  exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "error: SUPABASE_ACCESS_TOKEN 환경변수가 없다." >&2
  echo "       https://supabase.com/dashboard/account/tokens 에서 ongod 계정으로 발급받아" >&2
  echo "       SUPABASE_ACCESS_TOKEN=sbp_xxx pnpm --filter @ongod/db gen:types 처럼 실행해라." >&2
  exit 1
fi

OUT_DIR="$(dirname "${BASH_SOURCE[0]}")/../src/types"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/database.ts"

echo "-- generating types from $TARGET (ref: $REF) --" >&2
supabase gen types typescript --project-id "$REF" --schema public > "$OUT_FILE"
echo "generated: $OUT_FILE" >&2
