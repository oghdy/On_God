"use client";

import { useActionState } from "react";

import { signIn, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", padding: 24 }}>
      <h1>OnGod Admin 로그인</h1>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          이메일
          <input type="email" name="email" required autoComplete="username" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          비밀번호
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        {state.error ? (
          <p role="alert" style={{ color: "crimson" }}>
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending}>
          {pending ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
