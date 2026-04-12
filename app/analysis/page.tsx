"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WrongQuestion = {
    index: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    choices?: string[];
};

export default function AnalysisPage() {
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);
    const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    useEffect(() => {
        const savedScore = Number(localStorage.getItem("score") || 0);
        const savedWrong = JSON.parse(
            localStorage.getItem("wrongQuestions") || "[]"
        );
        const savedQuestions = JSON.parse(
            localStorage.getItem("questionsResult") || "[]"
        );

        setScore(savedScore);
        setWrongQuestions(savedWrong);
        setTotal(savedQuestions.length);
    }, []);

    useEffect(() => {
        const runAnalysis = async () => {
            if (wrongQuestions.length === 0) {
                setAiAnalysis("");
                return;
            }

            try {
                setLoadingAnalysis(true);

                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        wrongQuestions,
                    }),
                });

                const raw = await res.text();

                let data: any;
                try {
                    data = JSON.parse(raw);
                } catch {
                    setAiAnalysis("AI 분석 API가 JSON 대신 에러 페이지를 반환했습니다.");
                    return;
                }

                if (!res.ok) {
                    setAiAnalysis(data.error || "AI 분석을 불러오지 못했습니다.");
                } else {
                    setAiAnalysis(data.result || "분석 결과가 없습니다.");
                }
            } catch (error) {
                console.error("analysis page error:", error);
                setAiAnalysis("AI 분석을 불러오지 못했습니다.");
            } finally {
                setLoadingAnalysis(false);
            }
        };

        runAnalysis();
    }, [wrongQuestions]);

    return (
        <main className="page">
            <div className="container">
                <header className="hero">
                    <div className="badge">STEP 4 · 오답 분석</div>
                    <h1 className="title">오답 분석 결과</h1>
                    <p className="subtitle">
                        틀린 문제를 다시 확인하고, 왜 틀렸는지 복습해보세요.
                    </p>
                </header>

                <div className="card" style={{ marginBottom: "20px" }}>
                    <div className="card-head">
                        <div>
                            <h2>채점 결과</h2>
                            <p>전체 문제 풀이 결과입니다.</p>
                        </div>
                    </div>

                    <div className="result-box small">
                        총 {total}문제 중 {score}문제 정답
                        {"\n"}
                        정답률: {total > 0 ? Math.round((score / total) * 100) : 0}%
                    </div>
                </div>

                {wrongQuestions.length > 0 ? (
                    <>
                        <section className="question-list">
                            {wrongQuestions.map((item) => (
                                <div className="card" key={item.index}>
                                    <div className="card-head">
                                        <div>
                                            <h2>문제 {item.index}</h2>
                                            <p>오답 또는 미응답 문제입니다.</p>
                                        </div>
                                    </div>

                                    <div className="question-text">{item.question}</div>

                                    {item.choices && item.choices.length > 0 && (
                                        <div className="choices" style={{ marginBottom: "12px" }}>
                                            {item.choices.map((choice, idx) => {
                                                const isUserAnswer = item.userAnswer === `${idx + 1}번`;
                                                const isCorrectAnswer = item.correctAnswer === `${idx + 1}번`;

                                                let choiceClass = "choice-btn";

                                                if (isCorrectAnswer) {
                                                    choiceClass = "choice-btn correct";
                                                } else if (isUserAnswer) {
                                                    choiceClass = "choice-btn wrong";
                                                }

                                                return (
                                                    <div key={idx} className={choiceClass}>
                                                        <span className="choice-number">{idx + 1}</span>
                                                        <span>{choice}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}


                                    <div className="feedback-box" style={{ marginBottom: "12px" }}>
                                        <div>
                                            <strong>내 답:</strong> {item.userAnswer}
                                        </div>
                                        <div>
                                            <strong>정답:</strong> {item.correctAnswer}
                                        </div>
                                    </div>

                                    <div className="feedback-box">
                                        <div className="feedback-explanation">
                                            <strong>기본 해설:</strong> {item.explanation}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <div className="card" style={{ marginTop: "20px" }}>
                            <div className="card-head">
                                <div>
                                    <h2>AI 종합 오답 분석</h2>
                                    <p>틀린 문제들을 한 번에 분석한 결과입니다.</p>
                                </div>
                            </div>

                            <div className="result-box small">
                                {loadingAnalysis
                                    ? "AI가 오답을 분석하고 있습니다..."
                                    : aiAnalysis || "분석 결과가 없습니다."}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card">
                        <div className="result-box small">
                            모든 문제를 맞혔습니다. 훌륭해요 👍
                        </div>
                    </div>
                )}

                <div className="button-row">
                    <Link href="/questions" className="secondary-link">
                        문제 다시 보기
                    </Link>

                    <Link href="/" className="secondary-link">
                        처음으로
                    </Link>
                </div>
            </div>
        </main>
    );
}