-- P0-S2-T7: 개발용 샘플 데이터.
-- `supabase db reset`(로컬 스택, CI의 supabase-migrations.yml 워크플로 포함)에서 마이그레이션
-- 직후 자동 로드된다 (supabase/config.toml의 [db.seed] 참고). dev/prod 클라우드 프로젝트에는
-- 자동 적용되지 않는다 — 필요하면 `psql`로 직접 실행해라.
--
-- 원문 가사는 넣지 않는다: 저작권 이슈를 피하려고 퍼블릭 도메인 흑인영가(traditional
-- spiritual) 제목만 쓰고, 가사/번역/해설은 전부 "개발용 샘플" 표시가 있는 더미 텍스트다.
-- 실제 콘텐츠는 Phase 1 파이프라인(Genius/Claude 어댑터)이 채운다.
--
-- 고정 UUID + ON CONFLICT DO NOTHING을 써서 재실행해도 안전하게 만든다.

insert into songs (
  id, title, artist, album, release_year, genre, origin_country,
  album_cover_url, album_cover_source_url
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Wade in the Water', 'Traditional', null, null, 'Negro Spiritual', 'US',
    null, null
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Swing Low, Sweet Chariot', 'Traditional', null, null, 'Negro Spiritual', 'US',
    null, null
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Go Down Moses', 'Traditional', null, null, 'Negro Spiritual', 'US',
    null, null
  )
on conflict (id) do nothing;

insert into lyrics (song_id, original_text, korean_translation, translation_notes, ai_model_used, is_verified)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '[개발용 샘플 원문 — 실제 가사 아님] Wade in the water, wade in the water, children.',
    '[개발용 샘플 번역 — 실제 해석 아님] 물 속으로 들어가라, 아이들아, 물 속으로 들어가라.',
    '개발용 샘플 데이터입니다. 실제 해석은 Phase 1 파이프라인이 생성합니다.',
    'seed', false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '[개발용 샘플 원문 — 실제 가사 아님] Swing low, sweet chariot, coming for to carry me home.',
    '[개발용 샘플 번역 — 실제 해석 아님] 낮게 내려오라, 감미로운 마차여, 나를 집으로 데려가려고.',
    '개발용 샘플 데이터입니다. 실제 해석은 Phase 1 파이프라인이 생성합니다.',
    'seed', false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '[개발용 샘플 원문 — 실제 가사 아님] Go down, Moses, way down in Egypt land.',
    '[개발용 샘플 번역 — 실제 해석 아님] 내려가라, 모세여, 저 멀리 이집트 땅으로.',
    '개발용 샘플 데이터입니다. 실제 해석은 Phase 1 파이프라인이 생성합니다.',
    'seed', false
  )
on conflict (song_id) do nothing;

insert into song_info (song_id, description_ko, historical_context_ko, scripture_reference, ai_model_used, is_verified)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '[개발용 샘플] 노예 시대 흑인 공동체 사이에서 불리던 대표적인 흑인영가.',
    '[개발용 샘플] 강을 건너 자유를 향해 가는 여정을 상징한다고 전해진다.',
    '요한복음 5:4',
    'seed', false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '[개발용 샘플] 가장 널리 알려진 흑인영가 중 하나.',
    '[개발용 샘플] 고통스러운 현실 속에서 천국을 향한 소망을 노래한다고 전해진다.',
    null,
    'seed', false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '[개발용 샘플] 출애굽 이야기를 노예 해방에 빗댄 흑인영가.',
    '[개발용 샘플] 모세가 파라오에게 "내 백성을 보내라" 외친 장면을 직접 인용한다.',
    '출애굽기 8:1',
    'seed', false
  )
on conflict (song_id) do nothing;

-- daily_picks: 오늘(published) · 어제(published) · 내일(scheduled) 세 가지 상태를 커버해서
-- 앱의 "오늘의 카드"와 어드민의 예약 발행 큐를 둘 다 로컬에서 바로 확인할 수 있게 한다.
insert into daily_picks (song_id, pick_date, editor_note, status, published_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    current_date,
    '개발용 샘플 — 오늘의 카드',
    'published',
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    current_date - 1,
    '개발용 샘플 — 어제 카드',
    'published',
    now() - interval '1 day'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    current_date + 1,
    '개발용 샘플 — 내일 예약',
    'scheduled',
    null
  )
on conflict (pick_date) do nothing;
