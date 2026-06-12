import { loadEnv } from "./env.js";
import { todayKey } from "./config.js";
import { collectNews } from "./collect.js";
import { dedupeNews } from "./dedupe.js";
import { classifyNews } from "./classify.js";
import { summarizeNews } from "./summarize.js";
import { scoreNews, rescaleHeat } from "./score.js";
import { selectNews } from "./select.js";
import { enrichItems } from "./enrich.js";
import { applyBuzzSignal } from "./buzz.js";
import { shapePayload, publishJson } from "./publish.js";
import { inspectPayload, writeReport } from "./report.js";

await loadEnv();

const date = process.env.NEWS_DATE || todayKey();

console.log(`[run] 어제 이슈 파이프라인 시작 (date=${date})`);

const collected = await collectNews({ date });
const deduped = dedupeNews(collected.items);
console.log(`[run] 중복 제거: ${collected.items.length} → ${deduped.length}`);

const classified = classifyNews(deduped);
const summarized = summarizeNews(classified);
const scored = scoreNews(summarized);

// 세상 기준 화제량(네이버 전체 기사 수)으로 상위 후보의 주목도를 보정한다.
await applyBuzzSignal(scored);

let { categories, headlines } = selectNews(scored);

// 최종 선별된 기사만 원문 메타(og:description)로 본문을 보강하고 블록을 다시 만든다.
// 네이버 검색 요약(1~3문장)만으로는 무슨 일/핵심 포인트를 충분히 채울 수 없기 때문이다.
{
  const selected = [...new Map(
    [...Object.values(categories).flat(), ...headlines].map((item) => [item.id, item])
  ).values()];
  const { items: enrichedItems } = await enrichItems(selected);
  const resummarized = summarizeNews(enrichedItems);
  const byId = new Map(resummarized.map((item) => [item.id, item]));
  categories = Object.fromEntries(
    Object.entries(categories).map(([id, items]) => [id, items.map((item) => byId.get(item.id) || item)])
  );
  headlines = headlines.map((item) => byId.get(item.id) || item);
}

// 최종 발행 후보 안에서 주목도를 상대 점수로 재분배한다 (90점대 쏠림 방지).
rescaleHeat({ categories, headlines });

const payload = shapePayload({
  date,
  source: collected.source,
  categories,
  headlines,
  stats: {
    collected: collected.items.length,
    deduped: deduped.length
  }
});

const inspection = inspectPayload(payload);
const outputPath = await publishJson(payload);
const report = await writeReport(payload, inspection, {
  collected: collected.items.length,
  deduped: deduped.length
});

console.log(JSON.stringify({
  ok: report.blockers === 0,
  date,
  source: collected.source,
  outputPath,
  headline: payload.headlines.map((item) => `${item.category}: ${item.title}`),
  warnings: report.warnings,
  blockers: report.blockers,
  reportPath: report.mdPath
}, null, 2));

if (report.blockers > 0) {
  process.exitCode = 1;
}
