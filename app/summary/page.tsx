"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SummaryPage() {
  const [summary, setSummary] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    setSummary(localStorage.getItem("summaryResult") || "");
    setInput(localStorage.getItem("studyInput") || "");
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div className="badge">STEP 2 · 요약 결과</div>
          <h1 className="title">AI 요약 정리</h1>
          <p className="subtitle">
            입력한 학습 내용의 핵심 개념과 헷갈리기 쉬운 포인트를 확인하세요.
          </p>
        </header>

        <section className="result-grid">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>원본 학습 내용</h2>
                <p>입력했던 내용을 다시 확인할 수 있습니다.</p>
              </div>
            </div>
            <div className="result-box small">
              {input || "입력 내용이 없습니다."}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>AI 요약 결과</h2>
                <p>핵심 개념 중심으로 정리된 내용입니다.</p>
              </div>
            </div>
            <div className="result-box">
              {summary || "요약 결과가 없습니다."}
            </div>

            <div className="button-row">
              <Link href="/questions" className="primary-link">
                문제 풀러 가기
              </Link>
              <Link href="/" className="secondary-link">
                처음으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}