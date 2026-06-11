import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectPayload } from "./report.js";

// 발행된 today-news.json을 독립적으로 재검사한다 (CI 게이트용).
const payload = JSON.parse(await readFile(resolve("output", "today-news.json"), "utf8"));
const { warnings, quality } = inspectPayload(payload);
const blockers = warnings.filter((w) => w.level === "block");

console.log(JSON.stringify({
  ok: blockers.length === 0,
  date: payload.date,
  quality,
  warnings: warnings.map((w) => `[${w.level}] ${w.message}`)
}, null, 2));

if (blockers.length > 0) {
  process.exitCode = 1;
}
