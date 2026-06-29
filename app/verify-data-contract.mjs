import { readFile } from "node:fs/promises";
import { isOutOfScopeArticle, isValidPayload, normalizeItemForDisplay, normalizePayloadForDisplay, resolveNewsSources } from "./src/data.js";

const payload = JSON.parse(await readFile(new URL("./public/today-news.json", import.meta.url), "utf8"));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectValid(name, data) {
  if (!isValidPayload(data)) {
    throw new Error(`${name}: expected valid payload`);
  }
}

function expectInvalid(name, data) {
  if (isValidPayload(data)) {
    throw new Error(`${name}: expected invalid payload`);
  }
}

expectValid("current bundled news", payload);
const displayPayload = normalizePayloadForDisplay(payload);
if (Object.values(displayPayload.categories).flat().some(isOutOfScopeArticle)) {
  throw new Error("display payload: out-of-scope sports article must be filtered");
}
expectValid("filtered display payload", displayPayload);

const remoteSource = { url: "https://example.com/today-news.json", remote: true };
const localSource = { url: "./today-news.json", remote: false };
const defaultSources = resolveNewsSources({ remoteSource, localSource, dev: true });
if (defaultSources[0] !== remoteSource) throw new Error("remote feed must be preferred by default");
const explicitLocalSources = resolveNewsSources({ remoteSource, localSource, dev: true, search: "?local=1" });
if (explicitLocalSources[0] !== localSource) throw new Error("?local=1 must prefer the bundled development feed");

const repeatedHeadline = normalizeItemForDisplay({
  title: '종전협상 첫 성과…"이란, IAEA 활동 재개 합의"',
  summary: '미국-이란, 종전협상 첫 성과…"이란, IAEA 활동 재개 합의" 양국은 첫 고위급 회담을 가졌습니다.'
});
if (repeatedHeadline.summary !== "양국은 첫 고위급 회담을 가졌습니다.") throw new Error("display normalization must remove a repeated headline lead");

const leadingFragment = normalizeItemForDisplay({
  title: "SK하이닉스, 국내증시 시총 1위 등극",
  summary: "",
  points: ["제치고 코스피 시총 1위 SK하이닉스가 장중 삼성전자를 제치고 국내 증시 시가총액 1위에 올랐습니다."]
});
if (!leadingFragment.points[0].startsWith("SK하이닉스가 ")) throw new Error("display normalization must repair a leading clause fragment in fallback points");

const unrecoverableFragment = normalizeItemForDisplay({
  title: "법원, 주요 사건 판결",
  summary: "혐의로 재판에 넘겨져 유죄를 선고받았습니다."
});
if (unrecoverableFragment.summary !== "") throw new Error("unrecoverable leading fragments must not reach the UI");

const missingSummary = clone(payload);
missingSummary.categories.politics[0].summary = "";
expectInvalid("empty summary", missingSummary);

const injectedCategory = clone(payload);
injectedCategory.categories['politics" onclick="alert(1)'] = [{
  ...injectedCategory.categories.politics[0],
  id: "malicious-category",
  category: 'politics" onclick="alert(1)'
}];
expectInvalid("unknown category key", injectedCategory);

const mismatchedCategory = clone(payload);
mismatchedCategory.categories.politics[0].category = 'politics" onclick="alert(1)';
expectInvalid("mismatched item category", mismatchedCategory);

const withoutAi = clone(payload);
withoutAi.categories.ai = [];
withoutAi.headlines = withoutAi.headlines.filter((item) => item.category !== "ai");
expectValid("AI category absent day", withoutAi);

const safeCoreCategory = clone(payload);
safeCoreCategory.categories.politics = safeCoreCategory.categories.politics.slice(0, 5);
expectValid("core category with five distinct items", safeCoreCategory);

const weakCoreCategory = clone(payload);
weakCoreCategory.categories.politics = weakCoreCategory.categories.politics.slice(0, 4);
expectInvalid("core category below safe minimum", weakCoreCategory);

const weakAiCategory = clone(payload);
weakAiCategory.categories.ai = weakAiCategory.categories.politics.slice(0, 2).map((item, index) => ({
  ...item,
  id: `partial-ai-${index}`,
  category: "ai"
}));
weakAiCategory.headlines.push(weakAiCategory.categories.ai[0]);
expectInvalid("active AI category with fewer than six items", weakAiCategory);

const summaryEqualsPoint = clone(payload);
summaryEqualsPoint.categories.politics[0].summary = "같은 핵심 내용을 충분히 설명하는 완결된 문장입니다.";
summaryEqualsPoint.categories.politics[0].points = ["같은 핵심 내용을 충분히 설명하는 완결된 문장입니다."];
expectValid("summary equal to point", summaryEqualsPoint);

const emptyWhy = clone(payload);
emptyWhy.categories.politics[0].why = "";
expectValid("empty why", emptyWhy);

const withoutCardNews = clone(payload);
delete withoutCardNews.categories.politics[0].cardNews;
expectValid("cardNews absent", withoutCardNews);

console.log(JSON.stringify({
  checked: [
    "current bundled news",
    "out-of-scope sports display filter",
    "filtered display payload",
    "remote feed preferred by default",
    "explicit local development override",
    "repeated headline display repair",
    "leading clause display repair",
    "unrecoverable fragment rejection",
    "empty summary rejection",
    "unknown category key rejection",
    "mismatched item category rejection",
    "AI category absent day",
    "core category with five distinct items",
    "core category below safe minimum",
    "active AI category with fewer than six items",
    "summary equal to point",
    "empty why",
    "cardNews absent"
  ],
  ok: true
}, null, 2));
