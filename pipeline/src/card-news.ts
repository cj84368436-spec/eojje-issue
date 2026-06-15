import Anthropic from "@anthropic-ai/sdk";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type ArticleCategory = "정치" | "경제" | "사회" | "문화" | "연예";
export type Sensitivity = "낮음" | "중간" | "높음";

export interface Article {
  id: string;
  category: ArticleCategory;
  sourceName: string;
  sourceUrl: string;
  title: string;
  body: string;
  publishedAt: string;
  attention?: number;
}

export interface GeneratedCard {
  cover: { title: string };
  what: { lines: [string, string, string] };
  points: [string, string, string];
  number: { value: string; caption: string };
  keywords: [string, string, string];
  summary: { text: string };
  sensitivity: Sensitivity;
  emoji: string;
}

export interface CardNews extends GeneratedCard {
  id: string;
  category: Article["category"];
  source: { name: string; url: string };
  rank: number;
  attention: number;
  needsReview: boolean;
  createdAt: string;
}

export const SYSTEM_PROMPT = `
역할: 너는 한국 시사 뉴스를 일반 독자용 '카드뉴스'로 요약하는 뉴스 에디터다.
입력으로 기사 본문과 출처가 주어진다. 너는 오직 주어진 기사 본문에 근거해서만 카드뉴스를 만든다.

[절대 규칙]
1. 기사 본문에 없는 사실·숫자·발언·배경을 절대 추가하지 마라. 근거가 없으면 비워라.
2. 추측·전망·논평·평가를 하지 마라. ("~할 전망이다", "~로 보인다" 같은 표현 금지)
3. 정치·사회 갈등 사안은 어느 한쪽 편을 들지 말고, 누가 무엇을 했는지 '사실'만 전달하라.
4. 인용이 필요하면 원문 표현을 그대로 쓰고, 한 문장을 넘기지 마라.
5. 자극적·선정적 표현을 쓰지 마라.

[형식]
- 아래 JSON 객체 '하나만' 출력한다. 인사말·설명·코드펜스(\`\`\`) 없이 JSON만.
- 모든 텍스트는 한국어, 친근한 '~해요'체.

[슬라이드 작성 규칙]
- cover.title  : 핵심을 담은 제목. 24자 이내.
- what.lines   : 정확히 3줄. "무슨 일인지"를 짧게 끊어서. 마지막 줄이 결론.
- points       : 정확히 3개. 기사 핵심 사실 3가지. 각 40자 이내.
- number.value : 기사에서 가장 의미있는 숫자나 순위 1개. 없으면 짧은 라벨(예: "주목"). caption에 설명.
- keywords     : 해시태그 3개. 기사 핵심어. '#'로 시작.
- summary.text : 한 줄 정리 1문장. 단정 대신 사실 기반.

[민감도 판단]
- 사고·재난·사망·범죄·정치 갈등·수사/소송 관련이면 sensitivity를 "중간" 또는 "높음"으로 올린다.
- 그런 경우 summary를 단정형이 아니라 중립·사실형으로 쓴다.
- 그 외 일반 정보성 기사는 "낮음".

[출력 JSON 스키마]
{
  "cover":   { "title": string },
  "what":    { "lines": [string, string, string] },
  "points":  [string, string, string],
  "number":  { "value": string, "caption": string },
  "keywords":[string, string, string],
  "summary": { "text": string },
  "sensitivity": "낮음" | "중간" | "높음",
  "emoji": string
}

[자기 점검]
출력 직전, 각 문장이 기사 본문에 근거가 있는지 확인하라. 근거 없는 문장은 삭제하거나 비워라.
`;

const DEFAULT_MODEL = "claude-haiku-4-5";
const REVIEW_QUEUE_PATH = resolve("output", "review-queue", "card-news.json");
const client = new Anthropic();

export function buildUserInput(a: Article): string {
  return `카테고리: ${a.category}
출처: ${a.sourceName}
원문 제목: ${a.title}

[기사 본문]
${a.body}`;
}

export async function generateCardNews(article: Article, rank: number): Promise<CardNews> {
  const res = await client.messages.create({
    model: process.env.CARD_NEWS_MODEL || DEFAULT_MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserInput(article) }]
  });

  const raw = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const gen = parseAndValidate(raw, article);
  return {
    ...gen,
    id: article.id,
    category: article.category,
    source: { name: article.sourceName, url: article.sourceUrl },
    rank,
    attention: article.attention ?? 0,
    needsReview: true,
    createdAt: new Date().toISOString()
  };
}

export function parseAndValidate(raw: string, article: Article): GeneratedCard {
  const clean = raw.replace(/```json|```/g, "").trim();

  let g: GeneratedCard;
  try {
    g = JSON.parse(clean) as GeneratedCard;
  } catch {
    throw new Error("JSON 파싱 실패");
  }

  if (!g.cover?.title) throw new Error("cover.title 없음");
  if (g.what?.lines?.length !== 3) throw new Error("what.lines는 3줄이어야 함");
  if (g.points?.length !== 3) throw new Error("points는 3개여야 함");
  if (g.keywords?.length !== 3) throw new Error("keywords는 3개여야 함");
  if (!g.summary?.text) throw new Error("summary 없음");
  if (!["낮음", "중간", "높음"].includes(g.sensitivity)) g.sensitivity = "중간";

  if (g.cover.title.length > 24) g.cover.title = g.cover.title.slice(0, 24);

  if (!article.sourceUrl) throw new Error("원문 URL 없음 → 발행 불가");

  const num = g.number?.value?.replace(/[^0-9]/g, "");
  if (num && num.length >= 2 && !article.body.includes(num)) {
    g.number = { value: "주목", caption: g.number.caption || "오늘의 이슈" };
  }

  const sensitiveHit = /사망|사고|재난|수사|기소|소송|자의|혐의|폭행|피해/.test(article.body);
  if (sensitiveHit && g.sensitivity === "낮음") g.sensitivity = "중간";

  return g;
}

export async function generateWithRetry(article: Article, rank: number): Promise<CardNews | null> {
  try {
    return await generateCardNews(article, rank);
  } catch {
    try {
      return await generateCardNews(article, rank);
    } catch (e2) {
      console.error("생성 2회 실패:", article.id, e2);
      return null;
    }
  }
}

export async function runDailyBatch(topArticles: Article[]): Promise<CardNews[]> {
  const results: (CardNews | null)[] = [];
  for (let i = 0; i < topArticles.length; i++) {
    results.push(await generateWithRetry(topArticles[i], i + 1));
  }
  const ready = results.filter((r): r is CardNews => r !== null);
  await saveToReviewQueue(ready);
  return ready;
}

export async function saveToReviewQueue(cards: CardNews[], path = REVIEW_QUEUE_PATH): Promise<void> {
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    items: cards.map((card) => ({ ...card, needsReview: true }))
  };

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
