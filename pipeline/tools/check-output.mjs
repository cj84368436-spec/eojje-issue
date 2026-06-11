// 발행 결과 빠른 점검용 스크립트 (수동 실행).
import { readFile } from "node:fs/promises";

const p = JSON.parse(await readFile(new URL("../output/today-news.json", import.meta.url), "utf8"));
const all = Object.values(p.categories).flat();

const unbalanced = all.filter((i) => i.summary && ((i.summary.match(/["“”]/g) || []).length % 2) === 1);

console.log(JSON.stringify({
  date: p.date,
  unbalancedQuotes: unbalanced.map((i) => i.title),
  whyCount: all.filter((i) => i.why).length,
  pointsCount: all.filter((i) => i.points && i.points.length).length,
  emptySummary: all.filter((i) => !i.summary).length,
  heat: all.map((i) => i.heat).sort((a, b) => b - a).join(","),
  sensitivity: all.reduce((acc, i) => ({ ...acc, [i.sensitivity]: (acc[i.sensitivity] || 0) + 1 }), {}),
  headlines: p.headlines.map((i) => `${i.category}|${i.heat}|${i.sensitivity}|${i.title}`)
}, null, 1));
