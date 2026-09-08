#!/usr/bin/env node
// 모바일 번들에 React 사본이 두 개 들어가는 회귀를 막는 검사. 근거는 ADR-0007.
//
// 왜 필요한가: 이 저장소는 React 18(Expo/RN, mobile)과 19(Next, admin)가 공존한다.
// pnpm이 `shamefully-hoist`로 루트 node_modules에 올리는 React는 한 버전뿐인데, react를
// peerDependency로 선언하지 않은 패키지(expo-router, expo-modules-core 등)는 자기 옆에
// react가 없으면 위로 걸어 올라가 그 루트 사본을 잡는다. 루트가 19가 되면 이들만 19를
// 잡고 react-native 렌더러는 18을 써서, 앱이 화면을 하나도 못 그린다.
//
// 왜 타입체크/빌드로는 못 잡나: React 사본이 둘이어도 tsc는 통과하고 Metro 번들링도
// 정상 성공한다. 깨지는 건 런타임에 렌더러가 남의 엘리먼트를 만나는 순간뿐이다.
// 그래서 이 검사가 따로 필요하다.
//
// 검사 방법: apps/mobile이 보는 react를 기준으로 잡고, 과거에 실제로 19를 집어왔던
// 패키지들이 각자 위치에서 react를 어떻게 해석하는지 Node 해석 규칙으로 확인한다
// (문제 당시 이들이 루트로 걸어 올라간 경로와 동일한 규칙).

import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobileDir = join(repoRoot, "apps", "mobile");

// ADR-0007에서 실제로 React 19를 잡고 있던 패키지들. 새로 추가되는 expo 계열 패키지가
// 있으면 여기 넣어두면 같이 감시된다.
const WATCHED = [
  "expo-router",
  "expo-modules-core",
  "@expo/metro-runtime",
  "@expo/vector-icons",
  "expo-apple-authentication",
  "react-native",
  "expo",
];

/** dir 기준으로 specifier의 package.json 경로를 Node 해석 규칙으로 찾는다. */
function resolvePkgJson(specifier, dir) {
  const require = createRequire(join(dir, "noop.js"));
  return realpathSync(require.resolve(`${specifier}/package.json`));
}

function versionOf(pkgJsonPath) {
  return createRequire(import.meta.url)(pkgJsonPath).version;
}

let baseline;
try {
  const p = resolvePkgJson("react", mobileDir);
  baseline = { path: p, version: versionOf(p) };
} catch (error) {
  console.error("apps/mobile에서 react를 해석하지 못했습니다. pnpm install을 먼저 하세요.");
  console.error(String(error));
  process.exit(1);
}

const mismatches = [];
for (const name of WATCHED) {
  let pkgDir;
  try {
    pkgDir = dirname(resolvePkgJson(name, mobileDir));
  } catch {
    continue; // 아직 설치 안 된 선택적 패키지는 건너뛴다
  }

  let seen;
  try {
    const p = resolvePkgJson("react", pkgDir);
    seen = { path: p, version: versionOf(p) };
  } catch {
    continue; // react를 안 쓰는 패키지
  }

  if (seen.path !== baseline.path) {
    mismatches.push({ name, version: seen.version, path: seen.path });
  }
}

if (mismatches.length > 0) {
  console.error("");
  console.error("✗ React 사본이 여러 개입니다 — 모바일 앱이 화면을 못 그립니다.");
  console.error("");
  console.error(`  기준 (apps/mobile): react@${baseline.version}`);
  console.error(`    ${baseline.path}`);
  console.error("");
  console.error("  다른 사본을 잡고 있는 패키지:");
  for (const m of mismatches) {
    console.error(`    ${m.name} → react@${m.version}`);
    console.error(`      ${m.path}`);
  }
  console.error("");
  console.error("  고치는 법: 루트 package.json의 react/react-dom 버전이 apps/mobile과");
  console.error("  같은지 확인하세요. 자세한 배경은 docs/decisions/0007-root-react-runtime-pin.md");
  console.error("");
  process.exit(1);
}

console.log(`✓ React 사본 1개 (react@${baseline.version}) — 검사한 패키지 ${WATCHED.length}개`);
