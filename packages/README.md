# 패키지 의존 규칙 (P0-S1-T7)

모노레포 경계를 강제하는 규칙. 위반은 리뷰에서 반려하고, 가능하면 lint/CI로도 차단한다.

## 의존 방향 (단방향, 역류 금지)

```
apps/mobile ─┐
apps/admin  ─┼─▶ integrations ─▶ db ─▶ core ◀── (core는 누구도 import 안 함)
             └─▶ ui-tokens
```

## 규칙

1. **`apps/*`는 `packages/*`를 import할 수 있다. 역은 금지.**
   `packages/*` 안의 코드가 `apps/mobile`이나 `apps/admin`을 import하면 안 된다 (순환 의존 방지).
2. **`packages/core`는 아무것도 import하지 않는다.**
   프레임워크 무관 순수 도메인 로직만 둔다. Supabase 클라이언트, fetch, React 등 금지.
3. **`packages/db`는 `packages/core`의 타입만 참조한다.**
   Supabase 클라이언트 생성 + 자동 생성 DB 타입 + DB row → 도메인 타입 변환만 다룬다.
4. **`packages/integrations`는 `packages/db`와 `packages/core`를 참조할 수 있다.**
   외부 API(Apple/Spotify/YouTube/Genius/Claude) 호출은 반드시 이 패키지의 어댑터 인터페이스 뒤에 숨긴다.
   `apps/*`가 외부 API를 직접 호출하는 것 금지.
5. **`packages/ui-tokens`는 다른 `packages/*`를 참조하지 않는다.**
   색상/타이포/스페이싱 등 순수 디자인 토큰만 (프레임워크 무관, 앱 양쪽에서 재사용).
6. **`packages/config`는 다른 패키지의 코드에 의존하지 않는다.**
   eslint/tsconfig/prettier 설정만 export하는 설정 전용 패키지.

## 왜 이렇게

- Turborepo + pnpm workspace의 `dependencies` 그래프가 곧 허용된 import 관계다. 패키지가
  실제로 필요하지 않은 의존을 `package.json`에 추가하지 않으면, 잘못된 import는 모듈
  해석 단계에서부터 실패한다 — 규칙을 "설명"이 아니라 "구조"로 강제한다.
- `core`를 의존성 그래프의 리프로 둔 이유는 SRS 도메인 로직(Daily Pick 선정, 가사 매칭
  등)을 Supabase나 특정 프레임워크 교체와 무관하게 테스트 가능한 상태로 유지하기 위함.
