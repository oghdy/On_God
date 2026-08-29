import { notFound } from "next/navigation";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

import { AutoRefresh } from "./auto-refresh";

const STATUS_LABEL: Record<string, string> = {
  running: "실행 중",
  partial: "부분 성공",
  done: "완료",
  failed: "실패",
};

const STEP_STATUS_COLOR: Record<string, string> = {
  done: "green",
  failed: "crimson",
  skipped: "#999",
};

function isStepResult(value: unknown): value is { status: string; [key: string]: unknown } {
  return typeof value === "object" && value !== null && "status" in value;
}

export default async function PipelineRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getServiceRoleClient();

  const { data: run } = await db.from("pipeline_runs").select("*").eq("id", id).maybeSingle();
  if (!run) notFound();

  const song = run.song_id
    ? (await db.from("songs").select("*").eq("id", run.song_id).maybeSingle()).data
    : null;

  const steps = (run.steps ?? {}) as Record<string, unknown>;

  return (
    <div style={{ maxWidth: 640 }}>
      {run.status === "running" ? <AutoRefresh /> : null}
      <h1>파이프라인 진행 상황</h1>
      <p>
        상태: <strong>{STATUS_LABEL[run.status] ?? run.status}</strong>
        {run.status === "running" ? " (3초마다 자동 새로고침)" : null}
      </p>

      {song ? (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16 }}>
            {song.title} — {song.artist}
          </h2>
          <ul style={{ fontSize: 14, color: "#444" }}>
            <li>앨범: {song.album ?? "-"}</li>
            <li>발매연도: {song.release_year ?? "-"}</li>
            <li>장르: {song.genre ?? "-"}</li>
            <li>Apple Music: {song.apple_music_url ?? "-"}</li>
            <li>Spotify: {song.spotify_url ?? "-"}</li>
            <li>YouTube: {song.youtube_url ?? "-"}</li>
          </ul>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16 }}>단계별 진행 상황</h2>
        <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(steps).map(([stepName, value]) => {
            const status = isStepResult(value) ? value.status : "unknown";
            const detail = isStepResult(value) ? (value.detail as string | undefined) : undefined;
            return (
              <li key={stepName}>
                <strong>{stepName}</strong>:{" "}
                <span style={{ color: STEP_STATUS_COLOR[status] ?? "black" }}>{status}</span>
                {detail ? <div style={{ fontSize: 12, color: "#666" }}>{detail}</div> : null}
              </li>
            );
          })}
        </ul>
      </div>

      {run.error_log ? (
        <p style={{ marginTop: 16, color: "crimson" }}>error_log: {run.error_log}</p>
      ) : null}
    </div>
  );
}
