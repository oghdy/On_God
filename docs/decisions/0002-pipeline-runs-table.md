# ADR-0002 — 파이프라인 상태 추적 테이블 (`pipeline_runs`)

- 상태: 채택(Accepted)
- 일자: 2026-06-28
- 관련: `P0-S2-T6b`, `P1-S4-T7`, `P1-S5`

## 배경

SRS 6장 파이프라인은 외부 API 5개(Apple/Spotify/YouTube/Genius/Claude)를 순차/병렬 호출한다.
하나가 실패하면(특히 YouTube 자동 매칭) 어디까지 진행됐는지 추적하거나 재시도할 수단이 없다.

## 결정

곡별 파이프라인 실행을 추적하는 테이블 1개를 추가한다.

```sql
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',   -- running | partial | done | failed
  steps JSONB NOT NULL DEFAULT '{}',        -- {apple:'ok', spotify:'ok', youtube:'failed', genius:'ok', ai:'ok'}
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 근거

- 별도 큐 시스템(Redis 등) 도입은 MVP에 과함.
- `steps`를 JSONB로 두면 단계가 늘거나 줄어도 스키마 변경 없이 흡수 → 확장성.
- 검수 UI(`P1-S5`)의 "어느 단계 실패 → 수동 보완" 흐름과 자연스럽게 연결, 재실행 판단 근거가 됨.

## 영향

- 마이그레이션에 테이블 추가(`P0-S2-T6b`).
- RLS: 운영 전용 → public 정책 없음(Service Role만 접근).
- 오케스트레이터가 각 단계 완료 시 `steps` 갱신(`P1-S4-T7`).
