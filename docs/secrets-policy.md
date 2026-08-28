# 시크릿 분리 정책 (P0-S5-T3)

> 시크릿이 어디에 있어야 하는지, 어떤 접두사가 클라이언트 번들에 노출되는지 정리한다.
> `packages/config/src/env.ts`의 zod 스키마와 짝을 맞춰 관리한다 — 필드를 추가/삭제하면
> 여기·`.env.example`·`env.ts` 세 곳을 같이 고친다.

## 원칙

1. **service_role 키·외부 API 키는 서버/Edge Function에서만.** 클라이언트(모바일 앱, 어드민
   브라우저 번들)에는 절대 들어가면 안 된다.
2. **anon key만 클라이언트에 공개 가능.** RLS가 이미 anon의 쓰기를 막고 있어서(ADR-0001)
   노출돼도 안전하도록 설계돼 있다.
3. **각 배포 대상은 그 대상의 표준 방식으로 시크릿을 등록한다** — `.env` 파일을 복사해
   여기저기 붙여넣지 않는다. 아래 표 참고.

## 위치별 정리

| 시크릿 | 로컬 개발 | Supabase Edge Function | Vercel (admin) | EAS (mobile) |
|--------|-----------|------------------------|-----------------|----------------|
| Supabase anon key | `.env`의 `SUPABASE_*_ANON_KEY` | 불필요(공개 가능 값) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Supabase service_role key | `.env`의 `SUPABASE_*_SERVICE_ROLE_KEY` | `supabase secrets set` | Vercel 환경변수(접두사 없이, 서버 전용) | **등록 안 함** — 모바일 앱은 service_role을 쓸 일이 없다 |
| Apple/Spotify/YouTube/Genius/Anthropic API 키 | `.env` | `supabase secrets set` | Vercel 환경변수(접두사 없이) | **등록 안 함** — 파이프라인은 어드민/Edge Function에서만 실행 |
| DB 비밀번호 (direct connection) | `/tmp/ongod_{dev,prod}_dbpw.txt` (의도적으로 `.env`에 평문 저장 안 함, [backend-log](./logs/backend-log.md#2026-08-28--p0-s2-t1t8--supabase-devprod-프로젝트-생성-및-스키마-적용) 참고) | 불필요 | 불필요 | 불필요 |

## 명령어 참고

**Supabase Edge Function 시크릿** (프로젝트별로 따로 설정):
```bash
supabase secrets set APPLE_MUSIC_KEY_ID=xxx --project-ref <dev-또는-prod-ref>
supabase secrets list --project-ref <ref>
```

**Vercel** (🧑 대시보드에서, 또는 CLI):
- Project Settings → Environment Variables
- Production/Preview/Development 환경을 구분해서 등록 (dev 값은 Preview에, prod 값은 Production에)
- `NEXT_PUBLIC_` 접두사가 붙은 것만 브라우저 번들에 포함됨 (Next.js 자체 규칙) — service_role·외부
  API 키에는 절대 이 접두사를 붙이지 않는다

**EAS** (🧑 Expo 계정 필요):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <value>
```
- `EXPO_PUBLIC_` 접두사가 붙은 것만 앱 번들에 인라인됨 (Expo 자체 규칙) — 모바일 앱은 애초에
  anon key 하나만 있으면 되므로 다른 시크릿을 EAS에 등록할 일이 없다

## 왜 이렇게

- Next.js(`NEXT_PUBLIC_`)와 Expo(`EXPO_PUBLIC_`)가 이미 "이 접두사만 클라이언트에 노출"
  규칙을 프레임워크 레벨에서 강제하고 있어서, 그 규칙을 그대로 따르는 게 별도 장치를
  만드는 것보다 실수할 여지가 적다 — 접두사를 안 붙이면 기본적으로 서버 전용이라는
  뜻이 되도록 이름을 짓는다.
- DB 비밀번호를 `.env`에 넣지 않은 건 P0-S2에서 이미 내려진 결정([backend-log](./logs/backend-log.md#2026-08-28--p0-s2-t1t8--supabase-devprod-프로젝트-생성-및-스키마-적용))을 그대로 문서화한 것 —
  runtime 코드는 DB 비밀번호가 필요 없고(anon/service_role 키로 충분), `supabase gen types`
  같은 1회성 CLI 작업에서만 쓰이기 때문에 굳이 상시 파일에 평문으로 남겨둘 필요가 없다는 판단.
