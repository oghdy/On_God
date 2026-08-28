# 브랜치 전략 · 커밋 컨벤션 (P0-S6-T5)

## 브랜치 전략

**기본은 `main`에 직접 커밋한다.** 팀 규모(사람 1명 + 에이전트 세션들)를 고려하면 PR
리뷰 프로세스의 오버헤드가 이득보다 크다. 지금까지의 커밋([`4e795ef`](https://github.com/oghdy/On_God/commit/4e795ef), [`432c29b`](https://github.com/oghdy/On_God/commit/432c29b))도 이 방식이었다.

예외적으로 브랜치를 쓰는 경우:

- **백엔드/프론트엔드 세션이 동시에 같은 로컬 clone에서 작업할 때** — `backend/P0-S1`,
  `frontend/P2-S1`처럼 트랙+진행 중인 Step으로 이름 짓고, 작업이 끝나면 바로 `main`에
  머지하고 브랜치를 지운다. 오래 살아있는 브랜치를 만들지 않는다.
- **되돌릴 가능성이 있는 실험적 변경** — 확신이 서면 `main`에 합치고, 아니면 브랜치째 버린다.
- **GitHub push는 항상 사용자 확인 후에만 한다** (`CLAUDE.md` 규칙) — 로컬에 커밋을 쌓아두는
  것과 원격에 push하는 것은 별개 승인 단계다.

## 커밋 메시지

형식: `<type>: <한국어 설명> (<Task ID 목록>)`

- `type`은 Conventional Commits 접두어를 쓴다 — `feat`/`fix`/`docs`/`refactor`/`test`/`chore` 등
- Task ID는 반드시 포함한다 (`CLAUDE.md` 규칙). 여러 Task를 묶은 커밋이면 `P0-S1-T1~T7`처럼
  범위로 쓴다
- 설명은 "무엇을 했는지"보다 "왜"에 무게를 둔다 — 자세한 내용은 `docs/logs/`에 이미 있으므로
  커밋 메시지는 한 줄 요약이면 충분하다

예시 (실제 이 레포의 커밋):
```
feat: Supabase dev/prod 프로젝트 생성 및 초기 스키마 적용 (P0-S2)
docs: OnGod 개발 문서 체계 구축 (Phase/Step/Task, ADR, 로그, CLAUDE.md)
```

Task ID를 콜론 뒤에 바로 붙이는 형식(`P1-S2-T1: Apple Music 어댑터 구현`)도 괜찮다 — 어느
쪽이든 Task ID가 메시지에 포함되기만 하면 된다.

## PR

지금은 PR을 강제하지 않는다. 나중에 사람이 아닌 외부 기여자가 생기거나, `main` 보호
규칙이 필요해지면 이 문서를 갱신하고 `docs/decisions/`에 ADR을 남긴다 (팀 프로세스를
바꾸는 건 되돌리기 쉬운 결정이 아니므로).
