-- P0-S2-T6b: 파이프라인 실행 상태 추적 테이블
-- ADR-0002: 외부 API 5개를 순차 호출하는 파이프라인의 부분 실패/재시도를 추적

create table pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id) on delete cascade,
  status text not null default 'running'
    check (status in ('running', 'partial', 'done', 'failed')),
  steps jsonb not null default '{}',
  error_log text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pipeline_runs enable row level security;
-- 쓰기/읽기 정책 없음: 어드민 서버(service_role)만 접근, anon 완전 차단

create trigger trg_pipeline_runs_updated_at
  before update on pipeline_runs for each row execute function update_updated_at();
