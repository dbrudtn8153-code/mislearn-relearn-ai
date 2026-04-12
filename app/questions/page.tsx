"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Question =
  | {
    type: "multiple";
    question: string;
    choices: string[];
    answer: number;
    explanation: string;
  }
  | {
    type: "short";
    question: string;
    answer: string;
    explanation: string;
  };

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | number | null)[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("questionsResult");
    if (!stored) return;

    try {
      const parsed: Question[] = JSON.parse(stored);
      setQuestions(parsed);
      setAnswers(new Array(parsed.length).fill(null));
    } catch (error) {
      console.error("questionsResult parse error:", error);
      setQuestions([]);
      setAnswers([]);
    }
  }, []);

  const handleChoiceSelect = (index: number, choiceIndex: number) => {
    const next = [...answers];
    next[index] = choiceIndex;
    setAnswers(next);
  };

  const handleShortAnswerChange = (index: number, value: string) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  };

  const handleSubmit = () => {
    const hasUnanswered = answers.some(
      (answer) => answer === null || answer === ""
    );

    if (hasUnanswered) {
      const confirmed = window.confirm(
        "답을 선택하지 않은 문제가 있습니다. 그래도 제출하시겠습니까?"
      );

      if (!confirmed) return;
    }

    const wrongList: {
      index: number;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      explanation: string;
      choices?: string[];
    }[] = [];

    let correctCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAnswer = answers[i];

      if (userAnswer === null || userAnswer === "") {
        wrongList.push({
          index: i + 1,
          question: q.question,
          userAnswer: "미응답",
          correctAnswer:
            q.type === "multiple" ? `${q.answer + 1}번` : String(q.answer),
          explanation: q.explanation,
          choices: q.type === "multiple" ? q.choices : undefined,
        });
        continue;
      }

      if (q.type === "multiple") {
        if (userAnswer === q.answer) {
          correctCount += 1;
        } else {
          wrongList.push({
            index: i + 1,
            question: q.question,
            userAnswer: `${Number(userAnswer) + 1}번`,
            correctAnswer: `${q.answer + 1}번`,
            explanation: q.explanation,
            choices: q.type === "multiple" ? q.choices : undefined,
          });
        }
      } else {
        const normalizedUser = String(userAnswer).trim().toLowerCase();
        const normalizedCorrect = String(q.answer).trim().toLowerCase();

        if (normalizedUser === normalizedCorrect) {
          correctCount += 1;
        } else {
          wrongList.push({
            index: i + 1,
            question: q.question,
            userAnswer: String(userAnswer),
            correctAnswer: String(q.answer),
            explanation: q.explanation,
            choices: undefined,
          });
        }
      }
    }

    localStorage.setItem("userAnswers", JSON.stringify(answers));
    localStorage.setItem("score", String(correctCount));
    localStorage.setItem("wrongQuestions", JSON.stringify(wrongList));

    window.location.href = "/analysis";
  };

  const getMultipleChoiceClass = (qIndex: number, cIndex: number) => {
    const selected = answers[qIndex] === cIndex;
    return selected ? "choice-btn selected" : "choice-btn";
  };

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div className="badge">STEP 3 · 생성 문제</div>
          <h1 className="title">AI 생성 문제</h1>
          <p className="subtitle">
            객관식은 선택해서 풀고, 주관식은 빈칸에 직접 답해보세요.
          </p>
        </header>

        <section className="question-list">
          {questions.map((q, i) => (
            <div className="card" key={i}>
              <div className="card-head">
                <div>
                  <h2>문제 {i + 1}</h2>
                  <p>AI가 생성한 점검 문제입니다.</p>
                </div>
              </div>

              <div className="question-text">{q.question}</div>

              {q.type === "multiple" ? (
                <div className="choices">
                  {q.choices.map((choice, cIndex) => (
                    <button
                      key={cIndex}
                      type="button"
                      className={getMultipleChoiceClass(i, cIndex)}
                      onClick={() => handleChoiceSelect(i, cIndex)}
                    >
                      <span className="choice-number">{cIndex + 1}</span>
                      <span>{choice}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="short-answer-wrap">
                  <input
                    type="text"
                    className="short-answer-input"
                    value={
                      typeof answers[i] === "string" ? (answers[i] as string) : ""
                    }
                    onChange={(e) => handleShortAnswerChange(i, e.target.value)}
                    placeholder=""
                  />
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="button-row">
          <button className="primary-btn" onClick={handleSubmit}>
            답안 제출하기
          </button>

          <Link href="/summary" className="secondary-link">
            요약 다시 보기
          </Link>

          <Link href="/" className="secondary-link">
            처음으로
          </Link>
        </div>
      </div>
    </main>
  );
}