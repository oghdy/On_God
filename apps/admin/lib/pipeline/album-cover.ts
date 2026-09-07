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

// Supabase Storage는 업로드 시점의 `cacheControl`을 그대로 오브젝트의 `Cache-Control`
// 응답 헤더로 내보내고, 그 앞단의 Cloudflare CDN이 이 값을 보고 엣지 캐싱 여부를 정한다.
// 지정하지 않으면 기본값이 `no-cache`라서 CDN을 거치기만 하고 실제 캐싱은 안 돼 매 요청이
// 오리진까지 간다(SRS 4.2 "앨범 커버 이미지: CDN 캐싱 적용" 미충족).
//
// 1년으로 길게 잡아도 안전한 이유: 업로드 경로가 `{songId}/cover.webp`인데 songId는
// 파이프라인 실행마다 새로 insert되는 곡의 UUID라, 한 번 쓰인 경로에 다른 이미지가
// 덮어써지는 일이 사실상 없다(`upsert: true`는 같은 실행이 중간에 재시도될 때를 위한 방어).
// 나중에 "기존 곡의 커버만 다시 받아오기" 같은 재처리 경로를 추가한다면, 이 값을 줄이지
// 말고 경로에 버전 세그먼트를 넣어(`{songId}/cover-{hash}.webp`) URL 자체를 바꿔야 한다 —
// 이미 배포된 CDN 캐시는 만료 전까지 무효화할 방법이 없기 때문.
const CACHE_CONTROL_SECONDS = "31536000"; // 1년

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
    db.storage
      .from(BUCKET)
      .upload(mainPath, mainWebp, {
        contentType: "image/webp",
        cacheControl: CACHE_CONTROL_SECONDS,
        upsert: true,
      }),
    db.storage
      .from(BUCKET)
      .upload(thumbnailPath, thumbnailWebp, {
        contentType: "image/webp",
        cacheControl: CACHE_CONTROL_SECONDS,
        upsert: true,
      }),
  ]);

  if (mainUpload.error) throw new Error(`Storage 업로드 실패(메인): ${mainUpload.error.message}`);
  if (thumbnailUpload.error) throw new Error(`Storage 업로드 실패(썸네일): ${thumbnailUpload.error.message}`);

  return {
    albumCoverUrl: db.storage.from(BUCKET).getPublicUrl(mainPath).data.publicUrl,
    albumCoverThumbnailUrl: db.storage.from(BUCKET).getPublicUrl(thumbnailPath).data.publicUrl,
  };
}
