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
    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      return Response.json({ error: "입력 없음" }, { status: 400 });
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
다음 학습 자료를 핵심 개념 중심으로 요약해줘.

조건:
- 반드시 순수 텍스트로만 작성
- markdown 기호 절대 사용 금지
- #, *, **, -, >, \`\`\` 전부 사용 금지
- 제목 꾸미기 금지
- 글머리기호 금지
- 번호 목록 금지
- 줄바꿈만 사용해서 읽기 쉽게 정리
- 핵심 개념, 중요한 용어, 헷갈리기 쉬운 포인트를 포함
- 과목에 상관없이 범용적으로 적용

학습 자료:
${input}
`;

    const response = await generateWithRetry(
      ai,
      "gemini-2.5-flash-lite",
      prompt
    );

    const raw = response.text ?? "";
    const cleaned = cleanText(raw);

    return Response.json({
      result: cleaned || "요약 결과가 없습니다.",
    });
  } catch (e: any) {
    console.error("summary api error:", e);
    return Response.json(
      { error: e?.message || "요약 생성 실패" },
      { status: 500 }
    );
  }
}