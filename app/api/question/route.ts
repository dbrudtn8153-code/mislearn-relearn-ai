import { GoogleGenAI } from "@google/genai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cleanText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*`>-]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function generateWithRetry(
  ai: GoogleGenAI,
  model: string,
  contents: string,
  retries = 3
) {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
      });
    } catch (e: any) {
      lastError = e;

      const message = String(e?.message || "");
      const retryable =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED");

      if (!retryable || i === retries - 1) {
        throw e;
      }

      await sleep(1500 * (i + 1));
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { summary } = await req.json();

    if (!summary || typeof summary !== "string") {
      return Response.json({ error: "summary가 없습니다." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
다음 요약을 바탕으로 학습 점검 문제 20개를 만들어줘.

조건:
- 총 20문제
- 객관식 15문제, 주관식 5문제
- 객관식은 보기 4개
- 정답은 반드시 1개만 존재해야 함
- 애매하거나 복수정답 가능성이 있는 보기 금지
- 과목에 상관없이 범용적으로 적용
- 문제는 이해 확인형으로 만들 것
- markdown 절대 사용 금지
- #, *, **, -, >, \`\`\` 전부 사용 금지
- 수식이 필요하면 일반 텍스트로만 표현
- JSON 배열만 출력
- 코드블록 절대 금지
- 정답은 반드시 정확해야 함
- 틀린 보기를 정답으로 설정하면 안됨
- answer는 반드시 choices 배열 기준 정확한 index
- 기초 개념 문제에서는 절대 틀린 개념을 정답으로 설정 금지
- 애매한 문제 금지

JSON 형식:
[
  {
    "type": "multiple",
    "question": "문제 내용",
    "choices": ["보기1", "보기2", "보기3", "보기4"],
    "answer": 1,
    "explanation": "해설"
  },
  {
    "type": "short",
    "question": "문제 내용",
    "answer": "정답",
    "explanation": "해설"
  }
]

요약:
${summary}
`;

    const response = await generateWithRetry(
      ai,
      "gemini-2.5-flash-lite",
      prompt
    );

    const raw = response.text ?? "";
    const cleaned = cleanText(raw);
    const parsed = JSON.parse(cleaned);

    return Response.json({
      result: parsed,
    });
  } catch (e: any) {
    console.error("question api error:", e);
    return Response.json(
      { error: e?.message || "문제 생성 실패" },
      { status: 500 }
    );
  }
}