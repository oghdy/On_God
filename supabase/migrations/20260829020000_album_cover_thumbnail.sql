-- P1-S4-T5: ADR-0003이 "위젯용 작은 사이즈 변형도 동일 파이프라인에서 함께 생성"한다고
-- 명시했는데, 그걸 저장할 컬럼이 없었다. songs.album_cover_url(메인, 600x600)과 별개로
-- 위젯(P3-S1-T3)이 쓸 경량 썸네일(150x150) 경로를 명시적으로 저장한다.

alter table songs
  add column album_cover_thumbnail_url text;
