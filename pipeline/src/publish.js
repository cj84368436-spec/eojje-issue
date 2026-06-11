import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CATEGORIES } from "./config.js";

const OUTPUT_PATH = resolve("output", "today-news.json");
const APP_PUBLIC_PATH = resolve("..", "app", "public", "today-news.json");

export function shapePayload({ date, source, categories, headlines, stats }) {
  const grouped = {};
  for (const category of CATEGORIES) {
    grouped[category.id] = (categories[category.id] || []).map(toPublicItem);
  }

  return {
    version: 2,
    date,
    generatedAt: new Date().toISOString(),
    source,
    headlines: headlines.map(toPublicItem),
    categories: grouped,
    stats
  };
}

function toPublicItem(item) {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    summary: item.summary || "",
    why: item.why || "",
    points: item.points || [],
    keywords: item.keywords || [],
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    imageUrl: item.imageUrl || "",
    publishedAt: item.publishedAt,
    heat: item.heat,
    sensitivity: item.sensitivity,
    scoreSignals: item.scoreSignals
  };
}

export async function publishJson(payload) {
  await writeJson(OUTPUT_PATH, payload);

  // 날짜별 아카이브 (품질 추적용).
  await writeJson(resolve("output", "history", `news-${payload.date}.json`), payload);

  if (process.env.PUBLISH_TO_APP_PUBLIC !== "false") {
    await writeJson(APP_PUBLIC_PATH, payload);
  }

  return OUTPUT_PATH;
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
