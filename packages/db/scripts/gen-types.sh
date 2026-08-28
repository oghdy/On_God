#!/usr/bin/env bash
# P0-S3-T1: dev/prod Supabase 스키마로부터 TypeScript 타입 생성
# .env의 DB 비밀번호로 직접 DB URL을 구성해 `supabase gen types`를 실행한다.
# (project-ref 방식 로그인 대신 --db-url을 쓰는 이유: CLI 세션이 다른 Supabase 계정에
#  로그인돼 있어도 영향받지 않고, 프로젝트를 link하지 않아도 됨)
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
    PASSWORD="${SUPABASE_DEV_DB_PASSWORD:-}"
    ;;
  prod)
    REF="${SUPABASE_PROD_PROJECT_REF:-}"
    PASSWORD="${SUPABASE_PROD_DB_PASSWORD:-}"
    ;;
  *)
    echo "usage: gen-types.sh [dev|prod]" >&2
    exit 1
    ;;
esac

# P0-S2에서 DB 비밀번호는 의도적으로 .env에 평문 저장하지 않고 /tmp에만 뒀다
# (backend-log 2026-08-28 참고). .env 값이 그 자리표시자거나 비어있으면 /tmp에서 읽는다.
TMP_PW_FILE="/tmp/ongod_${TARGET}_dbpw.txt"
if [ -z "$PASSWORD" ] || [[ "$PASSWORD" == __see* ]]; then
  if [ -f "$TMP_PW_FILE" ]; then
    PASSWORD="$(cat "$TMP_PW_FILE")"
  fi
fi

if [ -z "$REF" ] || [ -z "$PASSWORD" ]; then
  echo "error: SUPABASE_${TARGET^^}_PROJECT_REF가 .env에 없거나, DB 비밀번호를 .env와 $TMP_PW_FILE 둘 다에서 찾지 못했다." >&2
  echo "       Supabase 대시보드(Project Settings > Database)에서 비밀번호를 확인해 $TMP_PW_FILE 에 저장하거나 .env에 채워라." >&2
  exit 1
fi

OUT_DIR="$(dirname "${BASH_SOURCE[0]}")/../src/types"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/database.ts"

# 직접 연결 호스트(db.<ref>.supabase.co)는 IPv6 전용이라 이 환경에서 DNS가 안 풀린다.
# Supavisor 세션모드 풀러(IPv4 호환, 포트 5432)를 대신 쓴다. 리전은 서울(ap-northeast-2) 고정.
DB_URL="postgresql://postgres.${REF}:${PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

echo "-- generating types from $TARGET (ref: $REF) --" >&2
supabase gen types typescript --db-url "$DB_URL" > "$OUT_FILE"
echo "generated: $OUT_FILE" >&2
