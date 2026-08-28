# ADR-0001 — 운영 테이블 RLS: Service Role 쓰기 전용

- 상태: 채택(Accepted)
- 일자: 2026-06-28
- 관련: `P0-S2-T6`, `P0-S5`, `P1-S1-T4`

## 배경

SRS 7.2의 RLS 정책은 운영 테이블(`songs`, `lyrics`, `song_info`, `daily_picks`)에
`public read`만 정의하고 INSERT/UPDATE/DELETE 정책이 없다. RLS가 켜진 상태에서
쓰기 정책이 없으면 모든 클라이언트 쓰기가 차단된다 — 즉 콘텐츠를 넣을 방법이 없다.

## 결정

콘텐츠 쓰기는 **오직 어드민 서버가 Service Role 키로** 수행한다(RLS 우회).
일반 유저 클라이언트(anon key)에는 운영 테이블 쓰기 정책을 **의도적으로 부여하지 않는다.**

- 운영 테이블: `SELECT` 공개(단 `daily_picks`는 `status='published'`만), 쓰기 정책 없음 → anon 차단
- 유저 테이블(`profiles`/`user_favorites`/`push_subscriptions`): 본인 행만(SRS의 `auth.uid()` 정책 유지)
- `daily_picks.status`에 `CHECK (status IN ('draft','scheduled','published'))` 제약 추가

## 근거

- 운영자는 단일/소수(SRS 8장 미결사항). DB 역할 시스템을 정교하게 만드는 것은 과설계.
- Service Role 키를 어드민 서버 코드에서만 쓰고 클라이언트에 노출하지 않으면 가장 단순·안전.
- 공동 운영자가 생기면 `profiles.role` + admin 정책을 추가하면 됨 → 점진적 확장 가능.

## 영향

- `P0-S2-T6`에서 status CHECK 제약 및 쓰기 차단 확인 테스트 추가.
- Service Role 키는 절대 클라이언트 번들에 포함 금지(`P0-S5` 시크릿 분류표).
