// P3-S4-T1: 앱을 열지 않아도 위젯이 갱신되도록 백그라운드 작업을 등록한다.
//
// 왜 필요한가: 위젯 타임라인은 앱이 실행될 때만 예약된다(P3-S2-T4). 사용자가 어제
// 낮에 앱을 열고 오늘 아침까지 안 열면, 07:00에 바꿔 그릴 예약이 아예 없어서 어제 곡이
// 그대로 남는다. 그 구멍을 메우는 것이 이 파일이다.
//
// **자정~07:00 사이에 한 번만 돌면 된다.** 곡은 KST 자정에 발행되고 위젯 전환은 07:00이라
// (WIDGET_SWITCH_HOUR_KST) 7시간의 여유가 있다 — iOS 백그라운드 작업의 실행 시점이 OS
// 재량이라는 점을 감안하면 이 창이 넓은 것은 큰 이점이다.

import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { syncWidget } from "./syncWidget";

/** 시스템에 등록되는 작업 이름. 바꾸면 기존 등록이 고아가 되므로 상수로 고정한다. */
const WIDGET_SYNC_TASK = "ongod-widget-sync";

/**
 * 몇 시간마다 실행을 요청할지(분). **iOS에서는 "이보다 자주는 돌리지 말라"는 힌트일 뿐**
 * 실제 실행 시점은 OS가 사용자 습관·배터리·네트워크를 보고 정한다. Android(WorkManager)는
 * 이 주기를 비교적 그대로 지킨다.
 *
 * 4시간으로 둔 이유: 하루 최대 6회 정도의 기회를 만들어 자정~07:00의 7시간 창에 한 번은
 * 걸리게 하려는 것이다. 더 짧게 잡으면 Android에서 실제로 그만큼 자주 돌아 하루에 한 번만
 * 바뀌는 데이터를 위해 네트워크를 낭비하고, 더 길게 잡으면 그 창을 통째로 건너뛸 수 있다.
 */
const MINIMUM_INTERVAL_MINUTES = 4 * 60;

// **모듈 최상위에서 정의해야 한다.** 앱이 백그라운드로 깨어날 때 JS가 이 파일을 평가하는
// 시점에 작업이 등록돼 있어야 시스템이 핸들러를 찾는다. 함수 안으로 옮기면 조용히 실패한다.
TaskManager.defineTask(WIDGET_SYNC_TASK, async () => {
  // syncWidget은 절대 던지지 않는다(내부에서 잡는다). 실패해도 위젯은 마지막 값을 유지하고
  // 다음 실행에서 다시 시도하면 되므로, 여기서 성공/실패를 구분해 보고할 필요가 없다.
  await syncWidget();
  return BackgroundTask.BackgroundTaskResult.Success;
});

/**
 * 백그라운드 동기화를 등록한다. 앱 기동 시 한 번 호출하면 되고, 이미 등록돼 있으면
 * 시스템이 알아서 무시한다.
 *
 * 실패해도 던지지 않는다 — 백그라운드 등록이 안 되는 것이 앱 실행을 막아서는 안 된다.
 * (기기 설정에서 백그라운드 앱 새로고침을 꺼둔 경우 `Restricted`가 나온다. 그때도 앱을
 * 열면 P3-S2-T4 경로로 갱신되므로 위젯이 완전히 멈추지는 않는다.)
 */
export async function registerWidgetBackgroundSync(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      console.log("[widget] 백그라운드 실행이 제한됨 — 앱을 열 때만 갱신된다");
      return;
    }

    await BackgroundTask.registerTaskAsync(WIDGET_SYNC_TASK, {
      minimumInterval: MINIMUM_INTERVAL_MINUTES,
    });
    console.log("[widget] 백그라운드 동기화 등록됨");
  } catch (error) {
    console.warn("[widget] 백그라운드 동기화 등록 실패 — 앱을 열 때만 갱신된다", error);
  }
}

/**
 * 개발 중에만 쓰는 수동 실행. `triggerTaskWorkerForTestingAsync`는 디버그 빌드에서만
 * 동작하며, 이게 없으면 백그라운드 경로를 검증하려고 실제로 몇 시간을 기다려야 한다.
 */
export async function triggerWidgetBackgroundSyncForTesting(): Promise<boolean> {
  return BackgroundTask.triggerTaskWorkerForTestingAsync();
}
