import { inspectPayload } from "./report.js";

const DEFAULT_REMOTE_URL = "https://cj84368436-spec.github.io/eojje-issue/today-news.json";
const url = process.env.NEWS_VALIDATE_URL || process.argv[2] || DEFAULT_REMOTE_URL;

const response = await fetch(url, { cache: "no-store" });
if (!response.ok) {
  console.log(JSON.stringify({
    ok: false,
    url,
    error: `HTTP ${response.status}`
  }, null, 2));
  process.exitCode = 1;
} else {
  const payload = await response.json();
  const { warnings, quality } = inspectPayload(payload);
  const blockers = warnings.filter((warning) => warning.level === "block");

  console.log(JSON.stringify({
    ok: blockers.length === 0,
    url,
    date: payload.date,
    generatedAt: payload.generatedAt,
    headlineCount: Array.isArray(payload.headlines) ? payload.headlines.length : 0,
    categoryCounts: Object.fromEntries(
      Object.entries(payload.categories || {}).map(([id, items]) => [id, Array.isArray(items) ? items.length : 0])
    ),
    quality,
    warnings: warnings.map((warning) => `[${warning.level}] ${warning.message}`)
  }, null, 2));

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}
