import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const cacheDir = resolve("output", "cache");
const files = (await readdir(cacheDir).catch(() => []))
  .filter((name) => /^collected-\d{4}-\d{2}-\d{2}\.json$/.test(name))
  .sort()
  .reverse();

if (files.length === 0) {
  throw new Error("재처리할 수집 스냅샷이 없습니다. 먼저 npm run run을 실행하세요.");
}

process.env.NEWS_INPUT_PATH = resolve(cacheDir, files[0]);
await import("./run.js");
