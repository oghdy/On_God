-- P1-S4: lyrics.source_url — Genius 등 가사 provider의 출처 URL을 저장한다.
-- ADR-0003(album_cover_source_url)과 같은 패턴: 저작권 출처 추적용 원본 URL을 별도 보관.
-- human-actions.md의 출시 체크리스트 "가사 저작권 출처 표기 최종 점검"에 실제로 필요한 컬럼.

alter table lyrics
  add column source_url text;
