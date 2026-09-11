package com.ongod.widget

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.ColorProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

// P3-S3-T3/T5/T6: Android 홈 화면 2×2 위젯. iOS `widgets/OnGodToday.tsx`와 같은 모습이 목표다 —
// 커버 풀블리드 + 하단 스크림 + 곡명/아티스트, 커버가 없으면 어두운 배경에 음표.
//
// 색·크기는 iOS 위젯과 같은 값이다. 양쪽 위젯 모두 앱 코드(`@ongod/ui-tokens`)를 import할 수 없어
// 값이 중복되는 것은 의도된 것이다. 한쪽을 바꾸면 다른 쪽도 같이 봐야 한다.

/** `@ongod/ui-tokens`의 colors.dark.background. 커버가 없을 때 이게 배경이 된다. */
private val BACKGROUND = Color(0xFF0B0B0D)
private val TITLE_COLOR = ColorProvider(day = Color.White, night = Color.White)
private val ARTIST_COLOR = ColorProvider(day = Color(0xFFE4E4E9), night = Color(0xFFE4E4E9))

class OnGodWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val store = WidgetStore(context)

    provideContent {
      // **위젯 세션이 살아 있는 동안에는 provideGlance가 다시 불리지 않는다.** 여기서 한 번 읽고 끝내면
      // 앱이 새 타임라인을 넘기거나 07:00 워커가 깨워도 옛 그림이 남는다. 그래서 저장소 변경을 구독해
      // 바뀔 때마다 다시 읽는다.
      val version by remember { store.changes() }.collectAsState(initial = 0L)
      val timeline = remember(version) { store.read() }

      // "지금 그릴 칸"은 다시 그릴 때마다 현재 시각으로 고른다 — 07:00이 지나 다시 그리면 새 곡이 나온다.
      val entry = timeline.displayedAt(System.currentTimeMillis())
      val cover = remember(entry?.imagePath) { entry?.imagePath?.let { CoverLoader.load(context, it) } }

      WidgetContent(context, entry, cover, timeline.deepLink)
    }
  }
}

@Composable
private fun WidgetContent(context: Context, entry: WidgetEntry?, cover: Bitmap?, deepLink: String?) {
  var root = GlanceModifier
    .fillMaxSize()
    .appWidgetBackground()
    .background(BACKGROUND)
    .clickable(actionStartActivity(openAppIntent(context, deepLink)))
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    // Android 12+ 런처의 위젯 모서리 반경을 그대로 따른다.
    root = root.cornerRadius(android.R.dimen.system_app_widget_background_radius)
  }

  Box(modifier = root) {
    if (cover != null) {
      Image(
        provider = ImageProvider(cover),
        contentDescription = null,
        contentScale = ContentScale.Crop,
        modifier = GlanceModifier.fillMaxSize(),
      )
    } else {
      // 커버가 아예 없는 곡이 실제로 있다(dev의 "Go Down Moses"). 이때도 곡명은 읽혀야 하므로
      // 빈 화면 대신 음표로 대체한다 — iOS와 같다.
      Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Image(
          provider = ImageProvider(R.drawable.ongod_widget_music_note),
          contentDescription = null,
          modifier = GlanceModifier.size(44.dp),
        )
      }
    }

    Column(
      modifier = GlanceModifier
        .fillMaxSize()
        // 앨범아트 색을 예측할 수 없다 — 밝은 커버 위에서도 흰 글씨가 읽히도록 아래를 어둡게 깐다.
        .background(ImageProvider(R.drawable.ongod_widget_scrim))
        .padding(12.dp),
      verticalAlignment = Alignment.Bottom,
      horizontalAlignment = Alignment.Start,
    ) {
      Text(
        text = entry?.title ?: context.getString(R.string.ongod_widget_placeholder),
        style = TextStyle(color = TITLE_COLOR, fontSize = 15.sp, fontWeight = FontWeight.Bold),
        maxLines = 2,
      )
      val artist = entry?.artist.orEmpty()
      if (artist.isNotEmpty()) {
        Text(
          text = artist,
          style = TextStyle(color = ARTIST_COLOR, fontSize = 12.sp),
          maxLines = 1,
        )
      }
    }
  }
}

/**
 * 위젯 탭 → 앱의 오늘 카드(P3-S3-T5). 딥링크를 **우리 앱으로만** 보낸다(`setPackage`) — 같은 스킴을
 * 등록한 다른 앱이 끼어들 여지를 없앤다. 앱이 아직 한 번도 동기화하지 않아 딥링크를 모르면 그냥 앱을 연다.
 */
internal fun openAppIntent(context: Context, deepLink: String?): Intent {
  if (!deepLink.isNullOrBlank()) {
    return Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  }
  return context.packageManager.getLaunchIntentForPackage(context.packageName)
    ?: Intent(Intent.ACTION_MAIN).setPackage(context.packageName)
}
