import { CATEGORIES, ITEMS_PER_CATEGORY } from "./config.js";
import { isSimilarIssue } from "./text.js";

// 최종 선별.
// - 카테고리당 5개: 요약 있는 기사 우선, 같은 사건 중복 금지.
// - 헤드라인 5개: 카테고리 대표 1개씩. 완결 요약 필수, 민감도 "높음" 제외,
//   카테고리를 넘어 같은 인물/사건 중복 금지.
export function selectNews(items) {
  const categories = {};
  const headlines = [];

  for (const category of CATEGORIES) {
    const pool = items
      .filter((item) => item.category === category.id)
      .filter((item) => item.categoryFit >= 2 || item.rawCategory === category.id)
      .sort(byQuality);

    categories[category.id] = pickDiverse(pool, ITEMS_PER_CATEGORY);
  }

  for (const category of CATEGORIES) {
    const candidates = categories[category.id];
    // 1순위: 사건형 제목 (분석/질문형 제외) + 요약 있음 + 민감도 높음 제외.
    const headline = candidates.find((item) =>
      item.summary &&
      item.sensitivity !== "높음" &&
      !isAnalysisTitle(item.title) &&
      !headlines.some((picked) => isSimilarIssue(picked, item))
    ) || candidates.find((item) =>
      item.summary &&
      item.sensitivity !== "높음" &&
      !headlines.some((picked) => isSimilarIssue(picked, item))
    ) || candidates.find((item) =>
      item.summary && !headlines.some((picked) => isSimilarIssue(picked, item))
    );

    if (headline) headlines.push(headline);
  }

  return { categories, headlines };
}

// 분석/질문형 제목: "~할까", "~변화는", "~왜" 등. 사건을 전달하지 않으므로
// 헤드라인 대표로는 후순위로 둔다 (목록에는 포함 가능).
function isAnalysisTitle(title) {
  const t = String(title).trim();
  return /\?$/.test(t) || /(할까|일까|날까|을까|는|왜|전망|변수|괜찮나|어디로|갈림길)$/.test(t);
}

function byQuality(a, b) {
  // 요약 유무 > 주목도 > 최신성.
  const aSum = a.summary ? 1 : 0;
  const bSum = b.summary ? 1 : 0;
  if (aSum !== bSum) return bSum - aSum;
  if (a.heat !== b.heat) return b.heat - a.heat;
  return new Date(b.publishedAt) - new Date(a.publishedAt);
}

function pickDiverse(pool, limit) {
  const selected = [];

  // 1차: 요약 있는 기사 + 사건 중복 금지.
  for (const item of pool) {
    if (selected.length >= limit) break;
    if (!item.summary) continue;
    if (selected.some((picked) => isSimilarIssue(picked, item))) continue;
    selected.push(item);
  }

  // 2차: 모자라면 요약 없는 기사 허용 (중복 금지는 유지).
  if (selected.length < limit) {
    for (const item of pool) {
      if (selected.length >= limit) break;
      if (selected.some((picked) => picked.id === item.id)) continue;
      if (selected.some((picked) => isSimilarIssue(picked, item))) continue;
      selected.push(item);
    }
  }

  // 3차: 그래도 모자라면 채운다 (개수 보장이 우선).
  if (selected.length < limit) {
    for (const item of pool) {
      if (selected.length >= limit) break;
      if (selected.some((picked) => picked.id === item.id)) continue;
      selected.push(item);
    }
  }

  return selected;
}
