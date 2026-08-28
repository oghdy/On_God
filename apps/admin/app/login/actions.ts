"use server";

import { redirect } from "next/navigation";

import { serverEnv } from "@/lib/env.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SignInState {
  error: string | null;
}

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해라." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않다." };
  }

  const isAdmin = !!data.user.email && serverEnv.ADMIN_EMAILS.includes(data.user.email.toLowerCase());
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "이 계정은 운영자로 등록되지 않았다." };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
