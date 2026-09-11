package com.ongod.widget

import android.content.Context
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

// P3-S3-T4: 앱이 꺼져 있어도 타임라인의 다음 시각(보통 KST 07:00)에 위젯을 다시 그린다.
//
// iOS는 WidgetKit이 타임라인 시각에 맞춰 알아서 다시 그리지만, Android Glance에는 그 기능이 없어
// WorkManager에 "그 시각에 한 번 깨워 달라"를 직접 건다. WorkManager 예약은 재부팅 후에도 남는다.
//
// **네트워크를 쓰지 않는다.** 07:00에 보여줄 내용은 이미 타임라인에 들어 있다. 새 곡을 받아오는 건
// 백그라운드 동기화(P3-S4-T1, expo-background-task)의 몫이다.

internal object WidgetRefreshScheduler {
  private const val WORK_NAME = "ongod-widget-switch"

  fun scheduleNext(context: Context, timeline: WidgetTimeline, now: Long = System.currentTimeMillis()) {
    val workManager = WorkManager.getInstance(context)
    val next = timeline.nextChangeAfter(now)

    if (next == null) {
      workManager.cancelUniqueWork(WORK_NAME)
      return
    }

    val request = OneTimeWorkRequestBuilder<WidgetRefreshWorker>()
      .setInitialDelay(next - now, TimeUnit.MILLISECONDS)
      .build()

    // REPLACE: 타임라인이 바뀌면 이전 예약은 의미가 없다. 같은 시각이면 다시 거는 것뿐이라 무해하다.
    workManager.enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)
  }
}

/** WorkManager가 클래스 이름으로 생성하므로 public이어야 한다. */
class WidgetRefreshWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  override suspend fun doWork(): Result {
    val store = WidgetStore(applicationContext)

    store.markRefreshed() // 세션이 살아 있는 위젯을 깨운다(OnGodWidget 주석 참고)
    OnGodWidget().updateAll(applicationContext) // 세션이 닫힌 위젯을 다시 그린다

    // 워커는 정확히 그 시각보다 늦게 돌 수는 있어도 먼저 돌지는 않는다. 혹시 타임라인에 시각이 더
    // 남아 있으면 이어서 건다.
    WidgetRefreshScheduler.scheduleNext(applicationContext, store.read())
    return Result.success()
  }
}
