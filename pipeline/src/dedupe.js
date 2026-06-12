import { importantTokens, overlapRatio } from "./text.js";

// 같은 기사를 제거한다.
// 1) 정규화 제목이 같으면 동일 기사.
// 2) 제목 토큰이 크게 겹치면 같은 사건의 받아쓰기 기사로 보고, 더 나은 쪽(주요 매체/최신)을 남긴다.
// 같은 사건을 다룬 기사 수는 cluster 크기로 남겨서 화제성 점수에 쓴다.
export function dedupeNews(items) {
  const byNormTitle = new Map();

  for (const item of items) {
    const key = normalizeTitle(item.title);
    if (!key) continue;
    const existing = byNormTitle.get(key);
    if (!existing || isBetter(item, existing)) {
      byNormTitle.set(key, {
        ...item,
        clusterSize: (existing?.clusterSize || 0) + 1,
        fromTopFeed: Boolean(item.fromTopFeed || existing?.fromTopFeed)
      });
    } else {
      existing.clusterSize = (existing.clusterSize || 1) + 1;
      existing.fromTopFeed = Boolean(existing.fromTopFeed || item.fromTopFeed);
    }
  }

  const unique = [...byNormTitle.values()].map((item) => ({ ...item, clusterSize: item.clusterSize || 1 }));
  const result = [];

  for (const item of unique) {
    const tokens = importantTokens(item.title, 14);
    const duplicate = result.find((kept) => overlapRatio(tokens, kept._titleTokens) >= 0.6);
    if (duplicate) {
      duplicate.clusterSize += item.clusterSize;
      const fromTopFeed = Boolean(duplicate.fromTopFeed || item.fromTopFeed);
      if (isBetter(item, duplicate)) {
        // 더 나은 기사로 본문을 교체하되 cluster 집계는 유지한다.
        const clusterSize = duplicate.clusterSize;
        Object.assign(duplicate, item, { clusterSize, fromTopFeed, _titleTokens: duplicate._titleTokens });
      } else {
        duplicate.fromTopFeed = fromTopFeed;
      }
      continue;
    }
    result.push({ ...item, _titleTokens: tokens });
  }

  return result.map(({ _titleTokens, ...item }) => item);
}

function isBetter(a, b) {
  if (a.sourceTier !== b.sourceTier) return a.sourceTier < b.sourceTier;
  const aLen = (a.description || "").length;
  const bLen = (b.description || "").length;
  if (Math.abs(aLen - bLen) > 30) return aLen > bLen;
  return new Date(a.publishedAt) > new Date(b.publishedAt);
}

function normalizeTitle(title = "") {
  return String(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}
