package com.ongod.widget

import android.content.Context
import android.net.Uri
import androidx.glance.appwidget.updateAll
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

// P3-S3-T2: JS(`lib/widget/syncWidget.ts`)가 위젯에 타임라인을 넘기는 입구.
//
// expo-widgets iOS의 `getTimeline`/`updateTimeline`과 같은 모양으로 맞췄다 — JS 쪽 플랫폼 분기가
// "어느 표면에 넘기느냐" 하나로 끝나고, 07:00 판단·커버 캐시·중복 건너뛰기는 두 플랫폼이 공유한다(ADR-0010).

class OnGodWidgetModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("OnGodWidget")

    Function("getCoversDirectory") {
      val directory = coversDirectory(context).apply { mkdirs() }
      Uri.fromFile(directory).toString()
    }

    AsyncFunction("getTimeline") {
      WidgetStore(context).read().entries.map { entry ->
        mapOf(
          "date" to entry.at.toDouble(),
          "title" to entry.title,
          "artist" to entry.artist,
          "imagePath" to entry.imagePath,
        )
      }
    }

    AsyncFunction("updateTimeline") Coroutine { entries: List<TimelineEntryRecord>, deepLink: String ->
      val timeline = WidgetTimeline(
        entries = entries
          .map { WidgetEntry(at = it.date.toLong(), title = it.title, artist = it.artist, imagePath = it.imagePath) }
          .sortedBy { it.at },
        deepLink = deepLink,
      )

      WidgetStore(context).write(timeline)
      OnGodWidget().updateAll(context)
      WidgetRefreshScheduler.scheduleNext(context, timeline)
    }
  }
}

/**
 * JS `OnGodWidgetEntry`(modules/ongod-widget/index.ts)와 같은 모양.
 *
 * `@OptimizedRecord`: 없으면 expo-modules-core가 리플렉션으로 변환하며 경고를 남긴다(실제로 떴다).
 * expo 자체 모듈(expo-crypto 등)과 같은 방식으로, 변환 코드는 expo-module-gradle-plugin이 만든다.
 */
@OptimizedRecord
class TimelineEntryRecord : Record {
  @Field var date: Double = 0.0
  @Field var title: String = ""
  @Field var artist: String = ""
  @Field var imagePath: String? = null
}
