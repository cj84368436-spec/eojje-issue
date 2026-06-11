import { REMOTE_DATA_URL, STALE_AFTER_DAYS, CATEGORIES } from "./config.js";

// 원격 데이터를 먼저 시도하고, 실패하면 번들에 포함된 데이터로 내려간다.
export async function loadNews() {
  const sources = [
    REMOTE_DATA_URL && { url: REMOTE_DATA_URL, remote: true },
    { url: "./today-news.json", remote: false }
  ].filter(Boolean);

  let lastError = null;

  for (const source of sources) {
    try {
      const payload = await fetchJson(source.url);
      if (!isValidPayload(payload)) {
        throw new Error(`데이터 형식 오류 (${source.url})`);
      }
      return { payload, remote: source.remote };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("뉴스 데이터를 불러올 수 없습니다.");
}

async function fetchJson(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} (${url})`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date || "")) return false;
  if (!payload.categories || typeof payload.categories !== "object") return false;
  const total = Object.values(payload.categories).flat().length;
  return total >= 5;
}

// payload를 화면에서 쓰기 좋은 형태로 펼친다.
export function flattenPayload(payload) {
  const byId = new Map();
  for (const category of CATEGORIES) {
    for (const item of payload.categories[category.id] || []) {
      byId.set(item.id, item);
    }
  }
  for (const item of payload.headlines || []) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return byId;
}

// KST 기준으로 데이터가 며칠 뒤처졌는지 계산한다.
export function staleDays(payload) {
  const todayKst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const dataDate = new Date(`${payload.date}T00:00:00Z`).getTime();
  const today = new Date(`${todayKst}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((today - dataDate) / 86_400_000));
}

export function isStale(payload) {
  return staleDays(payload) >= STALE_AFTER_DAYS;
}
