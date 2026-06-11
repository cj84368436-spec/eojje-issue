import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// .env 파일을 의존성 없이 읽는다. 이미 설정된 환경변수는 덮어쓰지 않는다.
export async function loadEnv(path = resolve(".env")) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}
