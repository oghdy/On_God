-- P3-S1-T1: 위젯 전용 경량 데이터 뷰.
--
-- 위젯(홈화면 2×2)이 필요한 건 커버·곡명·아티스트뿐인데, 앱의 오늘 카드 쿼리는 가사·해석까지
-- 전부 끌어온다. 위젯이 그 쿼리를 같이 쓰면 (a) 필요 없는 페이로드를 계속 받고 (b) 카드 화면이
-- 바뀔 때마다 위젯 계약이 같이 흔들린다. 그래서 위젯용 읽기 계약을 뷰로 따로 고정한다.
--
-- 이 뷰가 서버에서 강제하는 규칙 두 가지 — 앱·iOS 위젯·Android 위젯 세 곳이 각자 구현하면
-- 반드시 어긋나는 부분이라 DB로 내렸다:
--   1. `status = 'published'`인 것만 (예약/미검수 콘텐츠가 위젯에 새어나가면 안 됨)
--   2. "오늘"의 기준은 **KST 자정** (P1-S6의 발행 cron이 UTC 15:00 = KST 00:00에 도는 것과
--      정확히 같은 기준. 클라이언트 로컬 타임존을 쓰면 해외 사용자에게 하루 어긋난다)
--
-- security_invoker=on: 뷰가 호출자 권한으로 실행돼 하위 테이블의 RLS가 그대로 적용된다.
-- (끄면 뷰 소유자 권한으로 돌아 daily_picks의 "published만 공개" 정책을 우회해버린다.)
create view public.widget_today_pick
with (security_invoker = on) as
select
  dp.pick_date,
  dp.published_at,
  s.id            as song_id,
  s.title,
  s.artist,
  -- 위젯용 512×512 WebP (P3-S1-T3). 컬럼명이 thumbnail이지만 실제 용도는 위젯이다.
  s.album_cover_thumbnail_url as widget_image_url,
  -- 위젯 이미지가 없을 때 앱이 대신 쓸 수 있는 원본 600×600 (fallback, P3-S2-T6)
  s.album_cover_url
from public.daily_picks dp
join public.songs s on s.id = dp.song_id
where dp.status = 'published'
  and dp.pick_date = (now() at time zone 'Asia/Seoul')::date;

comment on view public.widget_today_pick is
  'P3-S1-T1 위젯 전용 읽기 계약. KST 자정 기준 오늘의 published 픽 0~1행. 계약 문서: docs/logs/handoff.md 2026-09-08 backend → frontend';

grant select on public.widget_today_pick to anon, authenticated;
