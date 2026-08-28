-- P0-S2-T6: daily_picks.status 값 제약 + 앨범커버 출처 URL 컬럼
-- ADR-0003: 앨범커버는 Storage로 복사해 소유하고, 원본 외부 URL은 출처 추적용으로 별도 보관

alter table daily_picks
  add constraint daily_picks_status_check
  check (status in ('draft', 'scheduled', 'published'));

alter table songs
  add column album_cover_source_url text;
