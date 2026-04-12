import { GoogleGenAI } from "@google/genai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function cleanText(text: string) {
    return text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[#*`>-]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

export async function POST(req: Request) {
    try {
        const { wrongQuestions } = await req.json();

        if (!wrongQuestions || !Array.isArray(wrongQuestions) || wrongQuestions.length === 0) {
            return Response.json(
                { error: "분석에 필요한 데이터가 부족합니다." },
                { status: 400 }
            );
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

        const formatted = wrongQuestions
            .map(
                (item: any, index: number) => `
오답 ${index + 1}
문제 번호: ${item.index}
문제: ${item.question}
학생 답: ${item.userAnswer}
정답: ${item.correctAnswer}
기본 해설: ${item.explanation}
`
            )
            .join("\n");

        const prompt = `
다음은 학생이 틀린 문제 목록이다.

조건:
- 반드시 순수 텍스트로만 작성
- markdown 기호 사용 금지
- 각 오답마다 따로 분석
- 짧고 이해하기 쉽게 설명
- 아래 3가지를 포함
1. 왜 틀렸는지
2. 어떤 개념을 헷갈렸는지
3. 다시 공부할 포인트

출력 형식:
문제 1
왜 틀렸는지: ...
헷갈린 개념: ...
다시 공부할 포인트: ...

문제 2
왜 틀렸는지: ...
헷갈린 개념: ...
다시 공부할 포인트: ...

오답 목록:
${formatted}
`;

        const response = await generateWithRetry(
            ai,
            "gemini-2.5-flash-lite",
            prompt
        );

        const raw = response.text ?? "";
        const cleaned = cleanText(raw);

        return Response.json({
            result: cleaned || "분석 결과가 없습니다.",
        });
    } catch (e: any) {
        console.error("analyze api error:", e);
        return Response.json(
            { error: e?.message || "오답 분석 실패" },
            { status: 500 }
        );
    }
}