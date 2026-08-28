-- P0-S2-T4: 인덱스 + updated_at 자동 갱신 트리거

create index idx_daily_picks_date on daily_picks (pick_date desc);
create index idx_daily_picks_status on daily_picks (status);
create index idx_user_favorites_user on user_favorites (user_id);
create index idx_songs_artist on songs (artist);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles for each row execute function update_updated_at();
create trigger trg_songs_updated_at
  before update on songs for each row execute function update_updated_at();
create trigger trg_lyrics_updated_at
  before update on lyrics for each row execute function update_updated_at();
create trigger trg_song_info_updated_at
  before update on song_info for each row execute function update_updated_at();
create trigger trg_push_subscriptions_updated_at
  before update on push_subscriptions for each row execute function update_updated_at();
