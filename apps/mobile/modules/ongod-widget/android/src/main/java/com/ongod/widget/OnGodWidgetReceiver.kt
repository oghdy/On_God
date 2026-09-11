package com.ongod.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

// P3-S3-T1: 시스템(런처)이 위젯을 찾는 입구. AndroidManifest의 <receiver>가 이 클래스를 가리킨다.

class OnGodWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = OnGodWidget()

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)
    // 위젯을 추가할 때·재부팅 후·앱 업데이트 후에 불린다. 저장된 타임라인으로 다음 전환 예약을 다시 걸어두면
    // 어떤 경로로 왔든 07:00 전환이 빠지지 않는다(이미 걸려 있으면 같은 시각으로 교체될 뿐이다).
    WidgetRefreshScheduler.scheduleNext(context, WidgetStore(context).read())
  }
}
