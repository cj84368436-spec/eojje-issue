// 세상 기준 화제량 신호: 상위 후보의 핵심 키워드로 네이버 뉴스 전체 기사 수(total)를 질의해
// "우리 풀에서 몇 건"이 아니라 "세상에서 몇 건 보도됐나"로 주목도를 보정한다.
// 예: 월드컵 개막 25만 건(+20) vs 평범한 기사 수백 건(+0~6).

const TOP_N = Number(process.env.NEWS_BUZZ_TOP_N || 20);
const TIMEOUT_MS = 5000;

export async function applyBuzzSignal(items) {
  if (process.env.NEWS_BUZZ === "false") return { items, queried: 0 };
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) return { items, queried: 0 };

  // 예비 점수 상위 후보만 질의한다 (호출 수 제한).
  const candidates = [...items]
    .filter((item) => (item.keywords || []).length >= 1)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, TOP_N);

  let queried = 0;
  for (const item of candidates) {
    const query = item.keywords.slice(0, 2).join(" ");
    const total = await fetchTotal(query);
    queried += 1;
    if (total > 0) {
      // log 스케일: 1천 건 +6, 1만 건 +12, 10만 건 이상 +20 (상한).
      const boost = Math.min(20, Math.max(0, Math.round((Math.log10(total) - 2) * 6)));
      item.heat += boost;
      item.scoreSignals = { ...item.scoreSignals, buzzTotal: total, buzzBoost: boost };
    }
    await delay(120);
  }

  console.log(`[buzz] 화제량 질의 ${queried}건 적용`);
  return { items, queried };
}

async function fetchTotal(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = new URL("https://openapi.naver.com/v1/search/news.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", "1");
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET
      }
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return Number(data.total || 0);
  } catch {
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
