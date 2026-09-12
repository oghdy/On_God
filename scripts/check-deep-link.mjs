#!/usr/bin/env node
// 위젯 딥링크가 네 곳에서 어긋나는 회귀를 막는 검사 (P3-S4-T3).
//
// 왜 필요한가: "위젯을 누르면 앱이 열린다"는 한 줄짜리 기능인데, 같은 URL이 서로 import할
// 수 없는 네 곳에 나뉘어 있다.
//   1. `apps/mobile/app.json`의 `scheme` — 이게 있어야 OS가 URL을 우리 앱으로 보낸다
//   2. `@ongod/core`의 `WIDGET_DEEP_LINK` — 앱·Android 위젯이 쓰는 단일 출처
//   3. `widgets/OnGodToday.tsx`의 `widgetURL(...)` 리터럴 — iOS 위젯은 별도 JS 컨텍스트에서
//      돌아 앱 코드를 import할 수 없다(ADR-0009). 그래서 값을 복사해 둘 수밖에 없다
//   4. `lib/widget/syncWidget.ts` — Android 네이티브에 상수를 넘긴다(ADR-0010)
//
// 왜 타입체크/테스트로는 못 잡나: 넷 다 문자열이라 어긋나도 컴파일이 통과한다. 깨진 것은
// 사용자가 홈 화면에서 위젯을 눌렀을 때만 드러나고, 그때도 "아무 일도 안 일어남"이라
// 원인을 찾기 어렵다.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(join(repoRoot, ...parts), "utf8");

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// 1. app.json의 scheme
const appJson = JSON.parse(read("apps", "mobile", "app.json"));
const scheme = appJson.expo?.scheme;
check(typeof scheme === "string" && scheme.length > 0, "app.json에 expo.scheme이 없다 — OS가 딥링크를 앱으로 보내지 못한다");

// 2. 공유 상수
const coreSource = read("packages", "core", "src", "domain", "widget.ts");
const constantMatch = coreSource.match(/WIDGET_DEEP_LINK\s*=\s*"([^"]+)"/);
check(constantMatch !== null, "@ongod/core에서 WIDGET_DEEP_LINK 상수를 찾지 못했다");

const deepLink = constantMatch?.[1];
check(deepLink === `${scheme}://`, `WIDGET_DEEP_LINK(${deepLink})가 app.json의 scheme(${scheme}://)과 다르다`);

// 3. iOS 위젯 리터럴 — import가 불가능한 곳이라 값이 같은지 문자열로 확인한다
const iosWidget = read("apps", "mobile", "widgets", "OnGodToday.tsx");
const widgetUrlMatch = iosWidget.match(/widgetURL\("([^"]+)"\)/);
check(widgetUrlMatch !== null, "iOS 위젯에서 widgetURL(...)을 찾지 못했다 — 탭해도 앱이 열리지 않는다");
check(
  widgetUrlMatch?.[1] === deepLink,
  `iOS 위젯의 widgetURL(${widgetUrlMatch?.[1]})이 WIDGET_DEEP_LINK(${deepLink})와 다르다`,
);

// 4. Android는 상수를 그대로 넘겨야 한다(문자열을 또 박으면 이 검사가 무력해진다)
const syncWidget = read("apps", "mobile", "lib", "widget", "syncWidget.ts");
check(
  syncWidget.includes("WIDGET_DEEP_LINK"),
  "syncWidget.ts가 WIDGET_DEEP_LINK를 쓰지 않는다 — Android 위젯에 넘기는 딥링크가 상수와 갈라졌을 수 있다",
);

// 5. 딥링크가 도착할 라우트가 실제로 있어야 한다
try {
  read("apps", "mobile", "app", "index.tsx");
} catch {
  failures.push("app/index.tsx가 없다 — 딥링크가 도착할 오늘 카드 라우트가 사라졌다");
}

if (failures.length > 0) {
  console.error("✗ 위젯 딥링크 불일치");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`✓ 위젯 딥링크 일치 (${deepLink} — app.json scheme · @ongod/core · iOS 위젯 · Android 전달)`);
