import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CATEGORIES } from "./config.js";
import { cleanTitle, isSubstantiallySameText, normalizePublicText } from "./text.js";

const OUTPUT_PATH = resolve("output", "today-news.json");
const APP_PUBLIC_PATH = resolve("..", "app", "public", "today-news.json");
const CARD_NEWS_PATH = resolve("output", "review-queue", "card-news.json");

export function shapePayload({ date, source, categories, headlines, stats, generatedAt = new Date().toISOString() }) {
  const cardNewsById = loadCardNewsById();
  const grouped = {};
  for (const category of CATEGORIES) {
    grouped[category.id] = (categories[category.id] || []).map((item) => toPublicItem(item, cardNewsById, generatedAt));
  }

  return {
    version: 2,
    date,
    generatedAt,
    source,
    headlines: headlines.map((item) => toPublicItem(item, cardNewsById, generatedAt)),
    categories: grouped,
    stats
  };
}

function toPublicItem(item, cardNewsById = new Map(), generatedAt = new Date().toISOString()) {
  const summary = normalizePublicText(item.summary || "");
  const why = normalizePublicText(item.why || "");
  const points = (item.points || [])
    .map(normalizePublicText)
    .filter(Boolean)
    .filter((point, index, all) => !isSubstantiallySameText(summary, point)
      && all.findIndex((other) => isSubstantiallySameText(other, point)) === index);
  const publicItem = {
    id: item.id,
    category: item.category,
    title: cleanTitle(item.title),
    summary,
    why: why && !isSubstantiallySameText(summary, why) ? why : "",
    points,
    keywords: item.keywords || [],
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    coverage: buildCoverage(item),
    imageUrl: item.imageUrl || "",
    publishedAt: safePublishedAt(item.publishedAt, generatedAt),
    heat: item.heat,
    sensitivity: item.sensitivity,
    scoreSignals: item.scoreSignals
  };

  const cardNews = cardNewsById.get(item.id);
  if (cardNews) publicItem.cardNews = cardNews;

  return publicItem;
}

function safePublishedAt(value, generatedAt) {
  const publishedMs = new Date(value).getTime();
  const generatedMs = new Date(generatedAt).getTime();
  if (!Number.isFinite(publishedMs) || publishedMs > generatedMs) return "";
  return value;
}

function loadCardNewsById() {
  try {
    const payload = JSON.parse(readFileSync(CARD_NEWS_PATH, "utf8"));
    if (!payload || typeof payload !== "object" || payload.version !== 1 || !Array.isArray(payload.items)) {
      throw new Error("card-news.json schema is invalid");
    }
    const approved = payload.items.filter((card) => {
      if (!card || typeof card.id !== "string") throw new Error("card-news item id is invalid");
      return card.approved === true && card.needsReview !== true;
    });
    return new Map(approved.map((card) => [card.id, toPublicCardNews(card)]));
  } catch (error) {
    if (error?.code === "ENOENT") return new Map();
    throw error;
  }
}

function toPublicCardNews(card) {
  return {
    cover: card.cover,
    what: card.what,
    points: card.points || [],
    number: card.number,
    keywords: card.keywords || [],
    summary: card.summary,
    sensitivity: card.sensitivity,
    createdAt: card.createdAt
  };
}

function buildCoverage(item) {
  const sourceNames = uniqueNames([item.sourceName, ...(item.coverageSources || [])]);

  return {
    sourceCount: sourceNames.length || 1,
    sourceNames: sourceNames.slice(0, 12)
  };
}

function uniqueNames(names) {
  const seen = new Set();
  const result = [];

  for (const name of names) {
    const clean = String(name || "").trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
  }

  return result;
}

export async function publishJson(payload, options = {}) {
  const publishToApp = options.publishToApp ?? process.env.PUBLISH_TO_APP_PUBLIC !== "false";

  await writeJson(OUTPUT_PATH, payload);
  await writeJson(resolve("output", "history", `news-${payload.date}.json`), payload);

  if (publishToApp) {
    await writeJson(APP_PUBLIC_PATH, payload);
  }

  return OUTPUT_PATH;
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
