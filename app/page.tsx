"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!input.trim()) {
      alert("학습 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const summaryRes = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const summaryRaw = await summaryRes.text();

      let summaryData: any;
      try {
        summaryData = JSON.parse(summaryRaw);
      } catch {
        throw new Error("요약 API 오류");
      }

      if (!summaryRes.ok) {
        throw new Error(summaryData.error || "요약 실패");
      }

      const summaryText = summaryData.result || "";

      const questionRes = await fetch("/api/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary: summaryText }),
      });

      const questionRaw = await questionRes.text();

      let questionData: any;
      try {
        questionData = JSON.parse(questionRaw);
      } catch {
        throw new Error("문제 생성 오류");
      }

      if (!questionRes.ok) {
        throw new Error(questionData.error || "문제 생성 실패");
      }

      const questionsData = questionData.result || [];

      localStorage.setItem("studyInput", input);
      localStorage.setItem("summaryResult", summaryText);
      localStorage.setItem("questionsResult", JSON.stringify(questionsData));
      localStorage.removeItem("userAnswers");
      localStorage.removeItem("wrongQuestions");
      localStorage.removeItem("score");

      router.push("/summary");
    } catch (error: any) {
      console.error("error:", error);

      const msg = String(error?.message || "");

      if (msg.includes("429") || msg.includes("quota")) {
        alert("AI 사용량 초과입니다. 잠시 후 다시 시도해주세요.");
      } else {
        alert(msg || "오류 발생");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ 수학 예시 (업그레이드 버전)
  const fillExample = () => {
    setInput(`함수의 증가와 감소는 도함수를 이용하여 판단할 수 있다. 어떤 함수 f(x)가 있을 때, 도함수 f'(x)가 양수이면 해당 구간에서 함수는 증가하고, 음수이면 감소한다. 도함수가 0이 되는 지점은 극값 후보가 되며, 이 지점에서 함수의 증가와 감소가 바뀌면 극대값 또는 극소값이 된다. 이를 판단하기 위해서는 도함수의 부호 변화를 확인해야 한다. 또한, 이계도함수를 이용하면 더 간단하게 극값의 종류를 판별할 수 있다. 이계도함수가 양수이면 극소값, 음수이면 극대값이 된다. 학생들이 자주 헷갈리는 부분은 도함수가 0이라고 해서 항상 극값이 되는 것은 아니라는 점이다.`);
  };

  // ✅ 코딩 예시 (응용 버전)
  const fillCodingExample = () => {
    setInput(`파이썬에서 리스트 컴프리헨션은 반복문과 조건문을 한 줄로 표현할 수 있는 기능이다. 예를 들어, 리스트에서 짝수만 추출하려면 [x for x in numbers if x % 2 == 0]과 같이 작성할 수 있다. 이는 가독성을 높이고 코드 길이를 줄여준다. 또한 함수는 def 키워드를 사용하여 정의하며, 매개변수를 받아 값을 반환할 수 있다. 리스트 컴프리헨션과 함수를 함께 사용하면 데이터 처리 로직을 매우 간결하게 만들 수 있다. 예를 들어, 특정 조건을 만족하는 값들만 변환하여 새로운 리스트를 만드는 작업에 유용하다. 학생들이 자주 헷갈리는 부분은 리스트 컴프리헨션에서 조건문의 위치와 실행 순서이다.`);
  };

  // ✅ 입력 초기화
  const clearInput = () => {
    setInput("");
  };

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div className="badge">AI 교육 솔루션 · 오답 기반 재학습</div>
          <h1 className="title">Mislearn → Relearn AI</h1>
          <p className="subtitle">
            강의 내용을 입력하면 AI가 요약하고 문제를 생성합니다.
          </p>
        </header>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>학습 내용 입력</h2>
              <p>강의 내용이나 필기를 입력하세요.</p>
            </div>
            <span className="step">STEP 1</span>
          </div>

          <textarea
            className="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="내용을 입력하세요..."
          />

          <div className="button-row">
            <button
              className="primary-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "생성 중..." : "요약 + 문제 생성"}
            </button>

            <button className="secondary-btn" onClick={fillExample}>
              수학 예시
            </button>

            <button className="secondary-btn" onClick={fillCodingExample}>
              코딩 예시
            </button>

            <button className="secondary-btn" onClick={clearInput}>
              입력 초기화
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}