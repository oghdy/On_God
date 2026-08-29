"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { runPipeline } from "@/lib/pipeline/orchestrator";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface CreateSongState {
  error: string | null;
}

export async function createSong(_prevState: CreateSongState, formData: FormData): Promise<CreateSongState> {
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();

  if (!title || !artist) {
    return { error: "곡 제목과 아티스트를 모두 입력해라." };
  }

  const db = getServiceRoleClient();

  // 중복 감지 (P1-S4-T1)
  const { data: existing } = await db
    .from("songs")
    .select("id")
    .ilike("title", title)
    .ilike("artist", artist)
    .maybeSingle();

  if (existing) {
    return { error: `이미 등록된 곡이다 (제목+아티스트 동일). song id: ${existing.id}` };
  }

  const { data: run, error } = await db
    .from("pipeline_runs")
    .insert({ status: "running", steps: {} })
    .select("id")
    .single();

  if (error || !run) {
    return { error: `파이프라인 시작 실패: ${error?.message ?? "알 수 없는 에러"}` };
  }

  const pipelineRunId = run.id;
  // Vercel/Next 서버 액션 응답을 먼저 돌려보내고, 같은 요청 생명주기 안에서 뒤이어
  // 실행한다 — 별도 Edge Function 배포 없이 "비동기 실행"(P1-S4-T6)을 흉내낸다.
  after(() => runPipeline({ pipelineRunId, title, artist }));

  redirect(`/pipeline-runs/${pipelineRunId}`);
}
