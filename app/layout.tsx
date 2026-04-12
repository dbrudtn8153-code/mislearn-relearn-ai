import "./globals.css";

export const metadata = {
  title: "Mislearn → Relearn AI",
  description: "오답 기반 재학습 AI 학습 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}