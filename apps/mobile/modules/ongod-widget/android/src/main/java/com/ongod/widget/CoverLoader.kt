package com.ongod.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import java.io.File

// P3-S3-T3/T6: 앱이 받아둔 커버 파일을 위젯용 비트맵으로 읽는다.
//
// 위젯 그림은 RemoteViews로 런처 프로세스에 넘어가는데, 비트맵 크기에 상한이 있어 넘치면 위젯이
// 통째로 안 그려진다. 백엔드 규격(512×512 WebP)은 안전하지만, 폴백으로 600×600 원본 커버가 올 수도
// 있어 목표 크기에 맞춰 줄여서 읽는다.
//
// 실패하면 null — 커버 없이 곡명만 그린다. 이미지 하나 때문에 위젯 전체가 비는 게 더 나쁘다(iOS와 같은 원칙).

internal object CoverLoader {
  private const val TAG = "OnGodWidget"

  /** 위젯 최대 크기(@3x 약 510px, P3-S1-T3 실측)에 맞춘 상한. */
  private const val MAX_EDGE_PX = 512

  fun load(context: Context, uri: String): Bitmap? {
    return try {
      val file = resolveInsideCoversDirectory(context, uri) ?: return null

      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeFile(file.path, bounds)
      if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

      var sampleSize = 1
      while (bounds.outWidth / (sampleSize * 2) >= MAX_EDGE_PX && bounds.outHeight / (sampleSize * 2) >= MAX_EDGE_PX) {
        sampleSize *= 2
      }
      BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sampleSize })
    } catch (error: Exception) {
      Log.w(TAG, "커버를 읽지 못했다 — 커버 없이 그린다", error)
      null
    } catch (error: OutOfMemoryError) {
      Log.w(TAG, "커버가 너무 크다 — 커버 없이 그린다", error)
      null
    }
  }

  /**
   * 경로가 커버 디렉터리 안의 실제 파일일 때만 돌려준다. 타임라인은 앱이 쓴 값이지만, 저장소 값이 무엇이든
   * 위젯이 앱 내부의 다른 파일을 읽어 런처로 내보내는 일은 없어야 한다.
   */
  private fun resolveInsideCoversDirectory(context: Context, uri: String): File? {
    val path = Uri.parse(uri).path ?: return null
    val file = File(path).canonicalFile
    val directory = coversDirectory(context).canonicalFile
    return file.takeIf { it.isFile && it.startsWith(directory) }
  }
}
