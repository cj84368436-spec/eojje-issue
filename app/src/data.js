import { REMOTE_DATA_URL, STALE_AFTER_DAYS, CATEGORIES } from "./config.js";

const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));

// 원격 데이터를 먼저 시도하고, 실패하면 번들에 포함된 데이터로 내려간다.
export async function loadNews() {
  const localSource = { url: "./today-news.json", remote: false };
  const remoteSource = REMOTE_DATA_URL && { url: REMOTE_DATA_URL, remote: true };
  const sources = resolveNewsSources({
    remoteSource,
    localSource,
    dev: Boolean(import.meta.env?.DEV),
    search: globalThis.location?.search || ""
  });

  let lastError = null;

  for (const source of sources) {
    try {
      const payload = await fetchJson(source.url);
      if (!isValidPayload(payload)) {
        throw new Error(`데이터 형식 오류 (${source.url})`);
      }
      const normalized = normalizePayloadForDisplay(payload);
      if (!isValidPayload(normalized)) {
        throw new Error(`필터 적용 후 데이터 부족 (${source.url})`);
      }
      return { payload: normalized, remote: source.remote };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("뉴스 데이터를 불러올 수 없습니다.");
}

export function resolveNewsSources({ remoteSource, localSource, dev = false, search = "" }) {
  const preferLocal = dev && new URLSearchParams(search).has("local");
  return (preferLocal ? [localSource, remoteSource] : [remoteSource, localSource]).filter(Boolean);
}

export function normalizePayloadForDisplay(payload) {
  const categories = Object.fromEntries(CATEGORIES.map((category) => [
    category.id,
    (payload.categories[category.id] || [])
      .filter((item) => item?.category === category.id && !isOutOfScopeArticle(item))
      .map(normalizeItemForDisplay)
  ]));
  const byId = new Map(Object.values(categories).flat().map((item) => [item.id, item]));
  const visibleIds = new Set(byId.keys());

  return {
    ...payload,
    headlines: payload.headlines
      .filter((item) => visibleIds.has(item.id) && !isOutOfScopeArticle(item))
      .map((item) => byId.get(item.id) || normalizeItemForDisplay(item)),
    categories
  };
}

export function isOutOfScopeArticle(item) {
  const text = `${item?.title || ""} ${item?.description || ""} ${(item?.points || []).join(" ")}`;
  return /(KBO리그|프로야구|야구장|타석|타자|투수|안타|홈런|이닝|득점|선발투수|축구대표팀|프로축구|K리그|프리미어리그|챔피언스리그)/i.test(text);
}

export function normalizeItemForDisplay(item) {
  const title = String(item.title || "").trim();
  const summary = normalizeBriefText(item.summary, title);
  const why = normalizeBriefText(item.why, title);
  const points = (item.points || []).map((point) => normalizeBriefText(point, title)).filter(Boolean);

  return { ...item, summary, why, points };
}

function normalizeBriefText(raw, title) {
  let summary = String(raw || "").replace(/\s+/g, " ").trim();
  const titleAt = title ? summary.indexOf(title) : -1;

  if (titleAt >= 0 && titleAt <= 24) {
    const remainder = summary.slice(titleAt + title.length).replace(/^[\s:;,.·…-]+/, "");
    if (remainder.length >= 18) summary = remainder;
  }

  if (/^(?:제치고|따라|통해|위해|두고|관련해|대해|이어|반면|또한|그러나|하지만)(?:\s|,)/.test(summary)) {
    const subject = summary.match(/(?:^|\s)([^\s,]{2,24}[은는이가])\s/);
    if (subject?.index !== undefined) {
      const repaired = summary.slice(subject.index + (subject[0].startsWith(" ") ? 1 : 0));
      if (repaired.length >= 18) summary = repaired;
    }
  }

  return isDisplayReadyBrief(summary) ? summary : "";
}

function isDisplayReadyBrief(value) {
  if (value.length < 18 || value.length > 180) return false;
  if (/^(?:것이다|때문에|따라|관련해|대해|또한|그리고|하지만|그러나|이와|이에|으로|라고|면서|거나|까지|제치고|통해|위해|두고|이어|반면)(?:\s|,)/.test(value)) return false;
  if (/^(?:혐의|의혹|논란|영향|이유|문제|과정|수사|재판|협상|논의)(?:로|으로|에서)(?:\s|,)/.test(value)) return false;
  if (!/[.!?。]["'”’)]?$/.test(value) && !/(다|요|죠|함|됨|중|예정)["'”’)]?$/.test(value)) return false;
  const pairs = [["\"", "\""], ["'", "'"], ["“", "”"], ["‘", "’"]];
  return pairs.every(([open, close]) => open === close
    ? value.split(open).length % 2 === 1
    : value.split(open).length === value.split(close).length);
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

export function isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date || "")) return false;
  if (!Array.isArray(payload.headlines)) return false;
  if (!payload.categories || typeof payload.categories !== "object") return false;
  if (Object.keys(payload.categories).some((categoryId) => !CATEGORY_IDS.has(categoryId))) return false;
  if (payload.headlines.some((item) => !isValidItemShell(item) || !CATEGORY_IDS.has(item.category))) return false;

  const activeCategories = CATEGORIES.filter((category) => {
    const items = payload.categories[category.id] || [];
    return !category.optional || items.length > 0;
  });
  if (payload.headlines.length < activeCategories.length) return false;

  const headlineCategories = new Set(payload.headlines.map((item) => item.category));
  for (const category of activeCategories) {
    const items = payload.categories[category.id];
    if (!Array.isArray(items)) return false;
    if (items.some((item) => !isValidItemShell(item) || item.category !== category.id)) return false;
    // The reader keeps a five-item compatibility floor for already-deployed feeds.
    // The publishing pipeline is stricter and blocks new core feeds below six.
    const minimum = category.optional ? 6 : 5;
    if (items.length < minimum) return false;
    if (items.some((item) => !normalizeBriefText(item.summary, item.title))) return false;
    if (!headlineCategories.has(category.id)) return false;
  }

  const total = Object.values(payload.categories).flat().length;
  const minimumTotal = activeCategories.reduce((sum, category) => sum + (category.optional ? 6 : 5), 0);
  return total >= minimumTotal;
}

function isValidItemShell(item) {
  return item
    && typeof item === "object"
    && typeof item.id === "string"
    && typeof item.category === "string"
    && typeof item.title === "string";
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
