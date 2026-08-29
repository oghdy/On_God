// P1-S4-T5 (ADR-0003): 외부 앨범커버 URL을 다운로드 → WebP 변환·리사이즈(메인 600px +
// 위젯용 축소 150px, ADR-0003의 "위젯용 작은 사이즈 변형도 동일 파이프라인에서 함께
// 생성") → Supabase Storage(`album-covers` 버킷)에 업로드한다.
//
// 외부 URL을 그대로 `songs.album_cover_url`에 박아두면 Apple Music/Spotify/YouTube가
// 나중에 이미지를 지우거나 URL을 바꿨을 때 조용히 깨진다 — 우리가 직접 소유한 사본을
// 만들어두는 이유.

import "server-only";
import sharp from "sharp";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

const BUCKET = "album-covers";
const MAIN_SIZE = 600;
const THUMBNAIL_SIZE = 150;

export interface AlbumCoverResult {
  albumCoverUrl: string;
  albumCoverThumbnailUrl: string;
}

async function downloadImage(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`이미지 다운로드 실패: HTTP ${res.status} (${url})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timer);
  }
}

async function toWebp(source: Buffer, size: number): Promise<Buffer> {
  return sharp(source)
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
}

/**
 * 외부 이미지를 복사해 Storage에 올리고 공개 URL을 반환한다. 실패하면 예외를 던진다 —
 * 호출부(오케스트레이터)가 이걸 잡아서 `pipeline_runs.steps.albumCover`에 실패로 기록한다
 * (부분 성공 처리 — 이 단계가 실패해도 나머지 콘텐츠는 이미 저장돼 있다).
 */
export async function copyAlbumCoverToStorage(songId: string, sourceUrl: string): Promise<AlbumCoverResult> {
  const original = await downloadImage(sourceUrl);
  const [mainWebp, thumbnailWebp] = await Promise.all([
    toWebp(original, MAIN_SIZE),
    toWebp(original, THUMBNAIL_SIZE),
  ]);

  const db = getServiceRoleClient();
  const mainPath = `${songId}/cover.webp`;
  const thumbnailPath = `${songId}/thumbnail.webp`;

  const [mainUpload, thumbnailUpload] = await Promise.all([
    db.storage.from(BUCKET).upload(mainPath, mainWebp, { contentType: "image/webp", upsert: true }),
    db.storage.from(BUCKET).upload(thumbnailPath, thumbnailWebp, { contentType: "image/webp", upsert: true }),
  ]);

  if (mainUpload.error) throw new Error(`Storage 업로드 실패(메인): ${mainUpload.error.message}`);
  if (thumbnailUpload.error) throw new Error(`Storage 업로드 실패(썸네일): ${thumbnailUpload.error.message}`);

  return {
    albumCoverUrl: db.storage.from(BUCKET).getPublicUrl(mainPath).data.publicUrl,
    albumCoverThumbnailUrl: db.storage.from(BUCKET).getPublicUrl(thumbnailPath).data.publicUrl,
  };
}
