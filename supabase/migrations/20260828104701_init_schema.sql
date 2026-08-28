-- P0-S2-T3: SRS 7.2 기반 핵심 테이블 7개

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  album text,
  release_year int,
  genre text,
  origin_country text default 'US',
  apple_music_id text,
  spotify_id text,
  youtube_id text,
  apple_music_url text,
  spotify_url text,
  youtube_url text,
  album_cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lyrics (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null unique references songs(id) on delete cascade,
  original_text text,
  korean_translation text,
  translation_notes text,
  ai_model_used text,
  is_verified boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table song_info (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null unique references songs(id) on delete cascade,
  description_ko text,
  historical_context_ko text,
  scripture_reference text,
  ai_model_used text,
  is_verified boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table daily_picks (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete restrict,
  pick_date date not null unique,
  editor_note text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, song_id)
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  expo_push_token text not null,
  notify_at time not null default '08:00:00',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
