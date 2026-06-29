import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateWithRetry, parseAndValidate, runDailyBatch, saveToReviewQueue, type Article, type CardNews } from "./card-news.js";

function makeArticle(index: number): Article {
  return {
    id: "article-" + index,
    category: "경제",
    sourceName: "테스트신문",
    sourceUrl: "https://example.com/news/" + index,
    title: "테스트 기사 " + index,
    summary: "요약 " + index,
    points: ["포인트 " + index],
    body: "본문".repeat(1000),
    publishedAt: new Date().toISOString(),
    attention: 80
  };
}

function makeCard(article: Article, rank: number): CardNews {
  return {
    id: article.id,
    category: article.category,
    source: { name: article.sourceName, url: article.sourceUrl },
    rank,
    attention: article.attention ?? 0,
    needsReview: false,
    createdAt: new Date().toISOString(),
    cover: { title: article.title },
    what: { lines: ["첫 줄", "둘째 줄", "셋째 줄"] },
    points: ["포인트 하나", "포인트 둘", "포인트 셋"],
    number: { value: "5건", caption: "테스트 숫자예요." },
    keywords: ["#테스트", "#카드뉴스", "#안전장치"],
    summary: { text: "한 줄 정리예요." },
    sensitivity: "낮음",
    emoji: ""
  };
}

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), "card-news-safety-"));
  const queuePath = join(tempDir, "card-news.json");
  const articles = Array.from({ length: 655 }, (_, index) => makeArticle(index + 1));

  let calls = 0;
  const disabled = await runDailyBatch(articles, {
    enabled: false,
    reviewQueuePath: queuePath,
    generator: async (article, rank) => {
      calls += 1;
      return makeCard(article, rank);
    }
  });

  if (calls !== 0 || disabled.length !== 0) {
    throw new Error("OFF switch failed: calls=" + calls + ", results=" + disabled.length);
  }

  const corruptQueuePath = join(tempDir, "corrupt-card-news.json");
  await writeFile(corruptQueuePath, "{not-json", "utf8");
  let corruptRejected = false;
  try {
    await runDailyBatch(articles.slice(0, 1), {
      enabled: true,
      reviewQueuePath: corruptQueuePath,
      generator: async (article, rank) => makeCard(article, rank)
    });
  } catch {
    corruptRejected = true;
  }
  const corruptAfter = await readFile(corruptQueuePath, "utf8");
  if (!corruptRejected || corruptAfter !== "{not-json") {
    throw new Error("corrupt queue must fail closed without overwriting existing data");
  }

  calls = 0;
  let maxBodyLength = 0;
  const generated = await runDailyBatch(articles, {
    enabled: true,
    reviewQueuePath: queuePath,
    generator: async (article, rank) => {
      calls += 1;
      maxBodyLength = Math.max(maxBodyLength, article.body.length);
      return makeCard(article, rank);
    }
  });

  if (calls !== 5 || generated.length !== 5) {
    throw new Error("limit failed: calls=" + calls + ", results=" + generated.length);
  }

  if (maxBodyLength > 1203) {
    throw new Error("body truncation failed: maxBodyLength=" + maxBodyLength);
  }

  calls = 0;
  const cached = await runDailyBatch(articles, {
    enabled: true,
    reviewQueuePath: queuePath,
    generator: async (article, rank) => {
      calls += 1;
      return makeCard(article, rank);
    }
  });

  if (calls !== 0 || cached.length !== 5) {
    throw new Error("cache failed: calls=" + calls + ", results=" + cached.length);
  }

  const cacheOnlyPath = join(tempDir, "cache-only.json");
  await saveToReviewQueue([makeCard(articles[0], 1)], cacheOnlyPath);
  calls = 0;
  const mixed = await runDailyBatch(articles.slice(0, 2), {
    enabled: false,
    reviewQueuePath: cacheOnlyPath,
    generator: async (article, rank) => {
      calls += 1;
      return makeCard(article, rank);
    }
  });

  if (calls !== 0 || mixed.length !== 1 || mixed[0]?.id !== articles[0].id) {
    throw new Error("cache with off switch failed: calls=" + calls + ", results=" + mixed.length);
  }

  let retryCalls = 0;
  const retryResult = await generateWithRetry(articles[0], 1, async (article, rank) => {
    retryCalls += 1;
    if (retryCalls === 1) parseAndValidate("not-json", article);
    return makeCard(article, rank);
  });

  if (retryCalls !== 2 || !retryResult) {
    throw new Error("JSON retry failed: calls=" + retryCalls);
  }

  let apiErrorCalls = 0;
  const originalConsoleError = console.error;
  console.error = () => {};
  const apiErrorResult = await generateWithRetry(articles[0], 1, async () => {
    apiErrorCalls += 1;
    throw new Error("network or API error");
  });
  console.error = originalConsoleError;

  if (apiErrorCalls !== 1 || apiErrorResult !== null) {
    throw new Error("API error retry guard failed: calls=" + apiErrorCalls);
  }

  await rm(tempDir, { recursive: true, force: true });
  console.log(JSON.stringify({ ok: true, disabledCalls: 0, corruptQueueRejected: true, limitedCalls: 5, cachedCalls: 0, jsonRetryCalls: retryCalls, apiErrorCalls, maxBodyLength }, null, 2));
}

await main();
