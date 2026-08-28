-- P0-S2-T5: RLS 정책
-- ADR-0001: 운영 테이블(songs/lyrics/song_info/daily_picks)에는 의도적으로
-- INSERT/UPDATE/DELETE 정책을 두지 않는다 (anon 클라이언트 쓰기 차단).
-- 콘텐츠 쓰기는 어드민 서버가 service_role 키로 RLS를 우회해 수행한다.

alter table profiles enable row level security;
alter table user_favorites enable row level security;
alter table push_subscriptions enable row level security;
alter table songs enable row level security;
alter table lyrics enable row level security;
alter table song_info enable row level security;
alter table daily_picks enable row level security;

-- profiles: 본인 행만
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = auth_user_id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = auth_user_id);

-- user_favorites: 본인 행만
create policy "favorites_select_own" on user_favorites
  for select using (user_id = (select id from profiles where auth_user_id = auth.uid()));
create policy "favorites_insert_own" on user_favorites
  for insert with check (user_id = (select id from profiles where auth_user_id = auth.uid()));
create policy "favorites_delete_own" on user_favorites
  for delete using (user_id = (select id from profiles where auth_user_id = auth.uid()));

-- push_subscriptions: 본인 행만
create policy "push_select_own" on push_subscriptions
  for select using (user_id = (select id from profiles where auth_user_id = auth.uid()));
create policy "push_insert_own" on push_subscriptions
  for insert with check (user_id = (select id from profiles where auth_user_id = auth.uid()));
create policy "push_update_own" on push_subscriptions
  for update using (user_id = (select id from profiles where auth_user_id = auth.uid()));

-- 콘텐츠 테이블: 공개 읽기만 허용, 쓰기 정책 없음 (service_role만 쓰기 가능)
create policy "songs_public_read" on songs
  for select using (true);
create policy "lyrics_public_read" on lyrics
  for select using (true);
create policy "song_info_public_read" on song_info
  for select using (true);
create policy "picks_public_read" on daily_picks
  for select using (status = 'published');
