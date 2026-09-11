package com.ongod.widget

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import android.util.Log
import java.io.File
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

// P3-S3-T2: 앱(JS)이 넘긴 위젯 타임라인을 보관하는 곳 — iOS의 App Group UserDefaults에 해당한다.
//
// **"무엇을 언제 그릴지"를 여기서 판단하지 않는다.** 그 규칙(KST 07:00 전환·첫 설치 즉시 표시)은
// `@ongod/core`의 `buildWidgetTimeline`이 JS에서 계산해 타임라인으로 넘겨준다. 네이티브는 "지금
// 시각에 해당하는 칸"을 고르기만 한다 — iOS WidgetKit 타임라인과 같은 역할 분담이라, 두 플랫폼이
// 같은 날 다른 곡을 그릴 여지가 없다.

/** 타임라인 한 칸 — `at`(epoch ms)부터 이 내용을 그린다. */
internal data class WidgetEntry(
  val at: Long,
  val title: String,
  val artist: String,
  /** `coversDirectory` 안의 `file://` URI. 없으면 커버 없이 그린다. */
  val imagePath: String?,
)

internal data class WidgetTimeline(
  val entries: List<WidgetEntry>,
  /** 위젯 탭 시 열 딥링크. JS의 `WIDGET_DEEP_LINK`를 받아 쓴다 — 네이티브에 문자열을 또 박지 않으려고. */
  val deepLink: String?,
) {
  /** 지금 그려야 할 칸 = `at <= now` 중 가장 늦은 것. JS `displayedAt`(syncWidget.ts)과 같은 규칙. */
  fun displayedAt(now: Long): WidgetEntry? = entries.filter { it.at <= now }.maxByOrNull { it.at }

  /** 다음에 그림이 바뀌어야 하는 순간. 더 없으면 null. */
  fun nextChangeAfter(now: Long): Long? = entries.map { it.at }.filter { it > now }.minOrNull()

  companion object {
    val EMPTY = WidgetTimeline(emptyList(), null)
  }
}

/** 커버 이미지를 받아두는 디렉터리. 위젯이 앱과 같은 프로세스에서 돌아 앱 내부 저장소를 그대로 읽는다. */
internal fun coversDirectory(context: Context): File = File(context.filesDir, "ongod-widget")

internal class WidgetStore(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun read(): WidgetTimeline {
    val raw = prefs.getString(KEY_TIMELINE, null) ?: return WidgetTimeline.EMPTY
    return try {
      decode(raw)
    } catch (error: JSONException) {
      // 깨진 값 때문에 위젯이 죽는 것보다, 빈 상태로 그리고 다음 동기화를 기다리는 편이 낫다.
      Log.w(TAG, "타임라인을 읽지 못했다 — 빈 상태로 그린다", error)
      WidgetTimeline.EMPTY
    }
  }

  fun write(timeline: WidgetTimeline) {
    // commit(동기): 호출부가 곧바로 위젯을 다시 그리므로 기록이 끝난 뒤여야 한다.
    prefs.edit().putString(KEY_TIMELINE, encode(timeline)).commit()
  }

  /**
   * 내용은 그대로 두고 "다시 그려라" 신호만 보낸다(전환 워커용). 위젯 세션이 살아 있으면 `updateAll`만으로는
   * 다시 계산되지 않아서, 저장소 변경을 구독하는 쪽(`changes`)을 깨운다.
   */
  fun markRefreshed() {
    prefs.edit().putLong(KEY_REFRESHED_AT, System.currentTimeMillis()).commit()
  }

  /** 저장소가 바뀔 때마다 서로 다른 값을 내보낸다. 구독하는 쪽은 이걸 "다시 읽어라" 신호로 쓴다. */
  fun changes(): Flow<Long> = callbackFlow {
    val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
      trySend(SystemClock.elapsedRealtimeNanos())
    }
    prefs.registerOnSharedPreferenceChangeListener(listener)
    awaitClose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
  }

  private companion object {
    const val TAG = "OnGodWidget"
    const val PREFS_NAME = "ongod_widget"
    const val KEY_TIMELINE = "timeline"
    const val KEY_REFRESHED_AT = "refreshed_at"

    /** 저장 형식을 바꿀 때 올린다. 모르는 버전은 읽지 않고 빈 상태로 둔다(다음 동기화가 새로 쓴다). */
    const val FORMAT_VERSION = 1

    fun encode(timeline: WidgetTimeline): String {
      val entries = JSONArray()
      timeline.entries.forEach { entry ->
        entries.put(
          JSONObject()
            .put("at", entry.at)
            .put("title", entry.title)
            .put("artist", entry.artist)
            .put("imagePath", entry.imagePath),
        )
      }
      return JSONObject()
        .put("version", FORMAT_VERSION)
        .put("deepLink", timeline.deepLink)
        .put("entries", entries)
        .toString()
    }

    fun decode(raw: String): WidgetTimeline {
      val json = JSONObject(raw)
      if (json.optInt("version") != FORMAT_VERSION) return WidgetTimeline.EMPTY

      val entries = json.getJSONArray("entries")
      return WidgetTimeline(
        entries = (0 until entries.length()).map { index ->
          val entry = entries.getJSONObject(index)
          WidgetEntry(
            at = entry.getLong("at"),
            title = entry.getString("title"),
            artist = entry.optString("artist"),
            imagePath = entry.optString("imagePath").takeIf { it.isNotEmpty() },
          )
        },
        deepLink = json.optString("deepLink").takeIf { it.isNotEmpty() },
      )
    }
  }
}
