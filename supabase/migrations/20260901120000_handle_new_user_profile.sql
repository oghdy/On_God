-- P2-S6-T3: 로그인(회원가입) 시 profiles 자동 생성 + provider 기록.
-- auth.users에 새 행이 생기면(=최초 로그인) 그 즉시 profiles 행도 하나 만들어준다.
-- 클라이언트(앱) 코드가 "로그인 성공 후 profiles insert"를 따로 신경 쓸 필요가
-- 없어진다 — 앱이 실수로 이 스텝을 빼먹어도 DB 레벨에서 항상 보장된다.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (auth_user_id, display_name, avatar_url, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_app_meta_data ->> 'provider'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
