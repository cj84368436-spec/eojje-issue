import { createHash } from "node:crypto";
import { CATEGORIES, FRESH_HOURS, FETCH_PER_QUERY } from "./config.js";
import { cleanText, cleanTitle, isTruncated } from "./text.js";
import { resolveSource } from "./sources.js";
import { collectMockNews } from "./mock.js";

function hasNaverCredentials() {
  return Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

async function fetchNaverNews(query, sort) {
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(FETCH_PER_QUERY));
  url.searchParams.set("sort", sort);

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET
    }
  });

  if (!response.ok) {
    throw new Error(`네이버 뉴스 API 실패: ${response.status} ${response.statusText} (query=${query})`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function collectNews({ date }) {
  if (!hasNaverCredentials()) {
    console.warn("[collect] NAVER API 키 없음 - 목업 데이터로 진행합니다.");
    return { source: "mock", items: collectMockNews(date) };
  }

  const freshLimit = Date.now() - FRESH_HOURS * 60 * 60 * 1000;
  const items = [];
  const seenUrls = new Set();
  let fetched = 0;
  let droppedStale = 0;
  let droppedBroken = 0;

  for (const category of CATEGORIES) {
    for (const query of category.queries) {
      // 최신순 위주로 수집하고, 화제성 보강용으로 정확도순도 함께 수집한다.
      for (const sort of ["date", "sim"]) {
        let results;
        try {
          results = await fetchNaverNews(query, sort);
        } catch (error) {
          console.warn(`[collect] ${error.message}`);
          continue;
        }
        fetched += results.length;

        for (const result of results) {
          const sourceUrl = result.originallink || result.link;
          if (!sourceUrl || seenUrls.has(sourceUrl)) continue;

          const publishedAt = result.pubDate ? new Date(result.pubDate) : null;
          if (!publishedAt || Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < freshLimit) {
            droppedStale += 1;
            continue;
          }

          const rawTitle = cleanText(result.title);
          const title = cleanTitle(result.title);
          // 잘린 제목은 복구할 수 없으므로 수집 단계에서 버린다.
          if (!title || title.length < 8 || isTruncated(rawTitle) || isTruncated(title)) {
            droppedBroken += 1;
            continue;
          }

          seenUrls.add(sourceUrl);
          const source = resolveSource(sourceUrl);

          items.push({
            id: `${date}-${hash(sourceUrl)}`,
            date,
            rawCategory: category.id,
            title,
            description: cleanText(result.description),
            sourceName: source.name,
            sourceTier: source.tier,
            sourceUrl,
            publishedAt: publishedAt.toISOString()
          });
        }

        await delay(120);
      }
    }
  }

  console.log(`[collect] 수신 ${fetched}건 → 유효 ${items.length}건 (오래됨 ${droppedStale}, 깨짐/중복URL ${droppedBroken})`);
  return { source: "naver", items };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hash(value) {
  return createHash("sha1").update(String(value)).digest("hex").slice(0, 12);
}
