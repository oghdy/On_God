# ADR-0003 — 앨범커버 Supabase Storage 복사 + WebP

- 상태: 채택(Accepted)
- 일자: 2026-06-28
- 관련: `P1-S4-T5`, `P3-S1-T3`, SRS 4.2 / 4.3

## 배경

Apple Music/Spotify가 반환하는 앨범커버 URL은 만료·변경될 수 있다.
`songs.album_cover_url`에 외부 URL을 그대로 저장하면 어느 날 깨진 이미지가 된다.
또한 SRS 4.2는 CDN 캐싱·WebP를, 4.3은 출처 표기를 요구한다.

## 결정

파이프라인 수집 단계에서 외부 이미지를 **다운로드 → WebP 변환/리사이즈 → Supabase Storage 업로드**하고,
DB에는 우리가 소유한 Storage 경로를 저장한다.

```
songs.album_cover_url        = Supabase Storage 경로 (우리 소유, 영구)
songs.album_cover_source_url = 원본 외부 URL (출처 추적용, 신규 컬럼)
```

위젯용 작은 사이즈 변형도 동일 파이프라인에서 함께 생성.

## 근거

- 이미지를 소유하면 만료 위험 제거. SRS 4.2의 CDN·WebP를 Storage가 그대로 충족.
- 위젯(`P3-S1-T3`)이 요구하는 경량 이미지를 같은 단계에서 생성 가능.
- `source_url` 보존으로 저작권 출처 추적(SRS 4.3) 용이.

## 영향

- `songs`에 `album_cover_source_url TEXT` 컬럼 추가(마이그레이션).
- 이미지 처리 의존성(sharp 등) 또는 Supabase 이미지 변환 기능 사용.
- Storage 버킷·공개 읽기 정책 설정 필요.
