import { cleanText } from "./text.js";

// 최종 선별된 기사(하루 25건)에 한해 원문 페이지의 og:description / og:image 메타 태그를 읽어
// 요약 재료와 썸네일을 보강한다. 기사 전문을 저장하지 않으며(메타 설명 1~3문장),
// 메신저 링크 미리보기와 같은 수준의 접근이다. NEWS_ENRICH=false 로 끌 수 있다.

const TIMEOUT_MS = 6000;
const MAX_BYTES = 120_000;
const CONCURRENCY = 5;

export async function enrichItems(items) {
  if (process.env.NEWS_ENRICH === "false") return { items, enriched: 0 };

  const queue = [...items];
  const result = new Map();
  let enriched = 0;

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      const metadata = await fetchOpenGraph(item.sourceUrl);
      const description = trimToCompleteSentence(metadata.description);
      if (description && description.length > 50) {
        enriched += 1;
        const base = cleanText(item.description || "");
        // 메타 설명을 앞에 두고, 기존 검색 요약이 다른 내용이면 뒤에 잇는다.
        const merged = base && !description.includes(base.slice(0, 28))
          ? `${description} ${base}`
          : description;
        result.set(item.id, { ...item, description: merged, imageUrl: metadata.imageUrl || item.imageUrl || "" });
      } else {
        result.set(item.id, { ...item, imageUrl: metadata.imageUrl || item.imageUrl || "" });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`[enrich] 원문 메타 보강: ${enriched}/${items.length}건`);
  return { items: items.map((item) => result.get(item.id) || item), enriched };
}

async function fetchOpenGraph(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    if (!response.ok) return { description: "", imageUrl: "" };

    // <head>만 필요하므로 앞부분만 읽는다.
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let html = "";
    while (html.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    return extractOpenGraph(html, response.url || url);
  } catch {
    return { description: "", imageUrl: "" };
  } finally {
    clearTimeout(timeout);
  }
}

// 메타 설명은 중간에서 잘리는 경우가 많다. 마지막 완결 문장까지만 남겨서
// 잘린 꼬리가 기존 검색 요약과 붙어 깨진 문장을 만들지 않게 한다.
function trimToCompleteSentence(text) {
  const s = cleanText(text).replace(/(\.{2,}|…)\s*$/, "").trim();
  if (!s) return "";
  const lastEnd = Math.max(s.lastIndexOf("다."), s.lastIndexOf("요."), s.lastIndexOf("죠."));
  if (lastEnd >= 20) return s.slice(0, lastEnd + 2).trim();
  return /[다요죠]$/.test(s) ? s : "";
}

function extractOpenGraph(html, pageUrl) {
  const descriptionPatterns = [
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']description["']/i
  ];
  const imagePatterns = [
    /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i
  ];

  let description = "";
  for (const pattern of descriptionPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const text = cleanText(match[1]);
      if (text.length >= 30) {
        description = text;
        break;
      }
    }
  }

  let imageUrl = "";
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (!match || !match[1]) continue;
    imageUrl = normalizeImageUrl(cleanText(match[1]), pageUrl);
    if (imageUrl) break;
  }

  return { description, imageUrl };
}

function normalizeImageUrl(value, pageUrl) {
  if (!value || value.startsWith("data:")) return "";
  try {
    const url = new URL(value, pageUrl);
    if (!/^https?:$/.test(url.protocol)) return "";
    return url.href;
  } catch {
    return "";
  }
}
