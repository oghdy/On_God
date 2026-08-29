-- P1-S6-T3/T4/T5/T6: 예약 발행. Edge Function 대신 pg_cron + DB 함수로 구현한다
-- (아래 backend-log 참고 — 이유 요약: 별도 배포 없이 DB 트랜잭션 안에서 원자적으로
-- 처리되고, 애플리케이션 서버 가동 여부와 무관하게 항상 동작한다).
--
-- ADR-0002(pipeline_runs) 대상이 아님 — 이건 파이프라인이 아니라 발행 스케줄러라
-- 별도 추적 테이블 없이 daily_picks.status 전이 자체가 상태 기록이다.

create extension if not exists pg_cron with schema pg_catalog;

-- P1-S6-T5: 검수 안 된(is_verified=false) 콘텐츠는 발행 대상에서 제외한다.
-- 검수가 늦어지면 그날은 그냥 발행을 건너뛴다(자동으로 미검증 콘텐츠를 내보내는 것보다
-- "오늘의 카드가 없음"이 훨씬 안전한 실패 방식이다) — 검수 완료되면 다음 실행에 발행됨.
-- P1-S6-T6: 날짜 판정은 항상 KST 기준(now() at time zone 'Asia/Seoul').
create or replace function public.publish_scheduled_daily_picks()
returns setof daily_picks
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update daily_picks dp
    set status = 'published',
        published_at = now()
    from lyrics l, song_info si
    where dp.song_id = l.song_id
      and dp.song_id = si.song_id
      and dp.status = 'scheduled'
      and dp.pick_date <= (now() at time zone 'Asia/Seoul')::date
      and l.is_verified = true
      and si.is_verified = true
    returning dp.*;
end;
$$;

comment on function public.publish_scheduled_daily_picks() is
  'P1-S6: KST 자정에 pg_cron이 호출. scheduled 상태이면서 pick_date가 지났고 가사/곡소개가 둘 다 검수된 daily_picks만 published로 전이한다.';

select cron.schedule(
  'publish-daily-picks-kst-midnight',
  '0 15 * * *', -- UTC 15:00 == KST 00:00 (KST는 DST 없음, 연중 고정)
  $$select public.publish_scheduled_daily_picks();$$
);
