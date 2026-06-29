// Remote JSON published by the daily pipeline.
export const REMOTE_DATA_URL = "https://cj84368436-spec.github.io/eojje-issue/today-news.json";

// Show the stale-data banner when the feed is older than this many KST days.
export const STALE_AFTER_DAYS = 2;

export const CATEGORIES = [
  { id: "politics", label: "정치" },
  { id: "economy", label: "경제" },
  { id: "society", label: "사회" },
  { id: "culture", label: "문화" },
  { id: "entertainment", label: "연예" },
  { id: "ai", label: "AI", optional: true }
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label]));

export const TABS = [
  { id: "headlines", label: "전체" },
  ...CATEGORIES,
  { id: "saved", label: "저장" }
];
