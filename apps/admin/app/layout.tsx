import type { ReactNode } from "react";

export const metadata = {
  title: "OnGod Admin",
  description: "OnGod 콘텐츠 파이프라인 운영자 어드민",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
