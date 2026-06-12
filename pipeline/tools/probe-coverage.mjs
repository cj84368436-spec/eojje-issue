// 수집 커버리지 진단: 현재 카테고리 쿼리로 수집되는 풀에
// 특정 주제가 몇 건 들어오는지, 네이버에 실제 기사가 있는지 비교한다.
import { fileURLToPath } from "node:url";
import { loadEnv } from "../src/env.js";
import { collectNews } from "../src/collect.js";
import { todayKey } from "../src/config.js";

await loadEnv(fileURLToPath(new URL("../.env", import.meta.url)));

if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.error("[probe] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 필요합니다.");
  process.exit(1);
}

const TOPICS = ["스페이스X", "SpaceX", "월드컵"];

// 1) 현재 파이프라인 쿼리로 수집한 풀에서 검색
const { items } = await collectNews({ date: todayKey() });
console.log(`\n[풀] 현재 쿼리로 수집된 유효 기사: ${items.length}건`);
for (const topic of TOPICS) {
  const hits = items.filter((i) => `${i.title} ${i.description}`.includes(topic));
  console.log(`[풀] "${topic}" 포함: ${hits.length}건`);
  hits.slice(0, 3).forEach((h) => console.log(`     - [${h.rawCategory}] ${h.title.slice(0, 50)}`));
}

// 2) 네이버에 해당 주제 기사가 실제로 존재하는지 직접 질의
for (const query of ["스페이스X 상장", "월드컵 개막"]) {
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "date");
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET
    }
  });
  const data = await res.json();
  const fresh = (data.items || []).filter((i) => Date.now() - new Date(i.pubDate).getTime() < 40 * 3600 * 1000);
  console.log(`\n[네이버 직접 질의] "${query}": 최근 40시간 내 ${fresh.length}건 (전체 ${data.total}건)`);
  fresh.slice(0, 3).forEach((i) => console.log(`     - ${i.title.replace(/<[^>]+>/g, "").slice(0, 55)}`));
}
