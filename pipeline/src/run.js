import { loadEnv } from "./env.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CATEGORIES, todayKey } from "./config.js";
import { collectNews } from "./collect.js";
import { dedupeNews } from "./dedupe.js";
import { classifyNews } from "./classify.js";
import { summarizeNews } from "./summarize.js";
import { scoreNews, rescaleHeat } from "./score.js";
import { isExcludedTopic, isOpinionLike, selectNews } from "./select.js";
import { enrichItems } from "./enrich.js";
import { applyBuzzSignal } from "./buzz.js";
import { shapePayload, publishJson } from "./publish.js";
import { inspectPayload, writeReport } from "./report.js";
import { isSimilarIssue } from "./text.js";

await loadEnv();

const date = process.env.NEWS_DATE || todayKey();
const cachedInput = Boolean(process.env.NEWS_INPUT_PATH);
const offlineRerun = cachedInput && process.env.NEWS_ENRICH_CACHED !== "1";

console.log(`[run] 어제이슈 파이프라인 시작 (date=${date})`);

const collected = await loadOrCollect({ date });
const deduped = dedupeNews(collected.items);
console.log(`[run] 중복 제거: ${collected.items.length} -> ${deduped.length}`);

const classified = classifyNews(deduped);
const summarized = summarizeNews(classified);
let scored = scoreNews(summarized);

if (!cachedInput) await applyBuzzSignal(scored);
if (!offlineRerun) scored = await enrichSummaryGaps(scored);

let { categories, headlines } = selectNews(scored);

{
  const selected = [...new Map(
    [...Object.values(categories).flat(), ...headlines].map((item) => [item.id, item])
  ).values()];
  const { items: enrichedItems } = offlineRerun ? { items: selected } : await enrichItems(selected);
  const selectedById = new Map(selected.map((item) => [item.id, item]));
  const resummarized = summarizeNews(enrichedItems).map((item) => {
    if (item.summary) return item;
    const original = selectedById.get(item.id);
    return original?.summary
      ? { ...item, summary: original.summary, why: original.why || "", points: original.points || [] }
      : item;
  });
  const byId = new Map(resummarized.map((item) => [item.id, item]));
  categories = Object.fromEntries(
    Object.entries(categories).map(([id, items]) => [id, items.map((item) => byId.get(item.id) || item)])
  );
  headlines = headlines.map((item) => byId.get(item.id) || item);
}

rescaleHeat({ categories, headlines });

const generatedAt = new Date().toISOString();
const rawFuturePublishedAt = countFuturePublishedAt(categories, headlines, generatedAt);
const payload = shapePayload({
  date,
  source: collected.source,
  categories,
  headlines,
  generatedAt,
  stats: {
    collected: collected.items.length,
    deduped: deduped.length
  }
});

const inspection = inspectPayload(payload);
if (rawFuturePublishedAt > inspection.quality.futurePublishedAt) {
  inspection.quality.futurePublishedAt = rawFuturePublishedAt;
  inspection.warnings.push({
    level: "block",
    message: `생성 시각보다 미래인 원본 발행 시각이 ${rawFuturePublishedAt}개 있습니다.`
  });
}
const report = await writeReport(payload, inspection, {
  collected: collected.items.length,
  deduped: deduped.length
});
const publishToApp = report.blockers === 0;
const outputPath = await publishJson(payload, { publishToApp });

console.log(JSON.stringify({
  ok: report.blockers === 0,
  date,
  source: collected.source,
  outputPath,
  publishToApp,
  headline: payload.headlines.map((item) => `${item.category}: ${item.title}`),
  warnings: report.warnings,
  blockers: report.blockers,
  warningMessages: inspection.warnings.map((warning) => `[${warning.level}] ${warning.message}`),
  reportPath: report.mdPath
}, null, 2));

if (report.blockers > 0) {
  process.exitCode = 1;
}

async function loadOrCollect({ date }) {
  const inputPath = process.env.NEWS_INPUT_PATH;
  if (inputPath) {
    const snapshot = JSON.parse(await readFile(resolve(inputPath), "utf8"));
    console.log(`[run] 로컬 수집 스냅샷 사용: ${inputPath} (${snapshot.items?.length || 0}건)`);
    return snapshot;
  }

  const collected = await collectNews({ date });
  const snapshotPath = resolve("output", "cache", `collected-${date}.json`);
  await mkdir(dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, JSON.stringify(collected, null, 2), "utf8");
  console.log(`[run] 수집 스냅샷 저장: ${snapshotPath}`);
  return collected;
}

async function enrichSummaryGaps(items) {
  const candidates = [];
  const preliminary = selectNews(items).categories;

  for (const category of CATEGORIES.filter((entry) => !entry.optional)) {
    const categoryItems = items.filter((item) => item.category === category.id);
    const readyCount = preliminary[category.id]?.length || 0;
    if (readyCount >= 6) continue;

    const needed = Math.min(18, 6 - readyCount + 12);
    const selected = preliminary[category.id] || [];
    const pool = categoryItems
      .filter((item) => !item.summary && !isOpinionLike(item) && !isExcludedTopic(item))
      .filter((item) => !selected.some((picked) => isSimilarIssue(picked, item)))
      .sort((a, b) => (a.sourceTier || 4) - (b.sourceTier || 4) || b.heat - a.heat);
    const diverse = [];
    for (const item of pool) {
      if (diverse.length >= needed) break;
      if (diverse.some((picked) => isSimilarIssue(picked, item))) continue;
      diverse.push(item);
    }
    candidates.push(...diverse);
  }

  if (candidates.length === 0) return items;

  const { items: enriched } = await enrichItems(candidates);
  const resummarized = summarizeNews(enriched);
  const replacements = new Map(resummarized.map((item) => [item.id, item]));
  const recovered = resummarized.filter((item) => item.summary);
  console.log(`[enrich] 부족 카테고리 선별 전 보강: ${recovered.length}/${candidates.length}건 요약 확보`);
  for (const item of recovered) console.log(`[enrich] 요약 복구: ${item.category} | ${item.title}`);
  return items.map((item) => replacements.get(item.id) || item);
}

function countFuturePublishedAt(categories, headlines, generatedAt) {
  const generatedMs = new Date(generatedAt).getTime();
  if (!Number.isFinite(generatedMs)) return 0;

  const byId = new Map();
  for (const item of [...Object.values(categories).flat(), ...headlines]) {
    if (item?.id && !byId.has(item.id)) byId.set(item.id, item);
  }

  let count = 0;
  for (const item of byId.values()) {
    const publishedMs = new Date(item.publishedAt).getTime();
    if (Number.isFinite(publishedMs) && publishedMs > generatedMs) count += 1;
  }
  return count;
}
