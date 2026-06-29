import { createHash } from "node:crypto";
import { FRESH_HOURS } from "./config.js";
import { cleanText, cleanTitle, isTruncated } from "./text.js";
import { resolveSource } from "./sources.js";

const FEEDS = [
  ["연합뉴스", "https://www.yna.co.kr/rss/news.xml"],
  ["SBS", "https://news.sbs.co.kr/news/headlineRssFeed.do?plink=RSSREADER"],
  ["경향신문", "https://www.khan.co.kr/rss/rssdata/total_news.xml"],
  ["한겨레", "https://www.hani.co.kr/rss/"],
  ["조선일보", "https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml"],
  ["동아일보", "https://rss.donga.com/total.xml"],
  ["매일경제", "https://www.mk.co.kr/rss/30000001/"],
  ["한국경제", "https://www.hankyung.com/feed/all-news"],
  ["노컷뉴스", "https://rss.nocutnews.co.kr/nocutnews.xml"]
];

const PER_FEED = 20;
const TIMEOUT_MS = 8000;

export async function collectRssTopNews({ date }) {
  const freshLimit = Date.now() - FRESH_HOURS * 60 * 60 * 1000;
  const items = [];
  let okFeeds = 0;

  const results = await Promise.allSettled(FEEDS.map(([name, url]) => fetchFeed(name, url)));

  for (const result of results) {
    if (result.status !== "fulfilled" || result.value.length === 0) continue;
    okFeeds += 1;

    for (const entry of result.value.slice(0, PER_FEED)) {
      const publishedAt = entry.pubDate ? new Date(entry.pubDate) : null;
      if (!publishedAt || Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < freshLimit) continue;

      const title = cleanTitle(entry.title);
      if (!title || title.length < 8 || isTruncated(title)) continue;

      const source = resolveSource(entry.link);
      items.push({
        id: `${date}-${hash(entry.link)}`,
        date,
        rawCategory: "",
        fromTopFeed: true,
        title,
        description: cleanText(entry.description || ""),
        sourceName: source.name,
        sourceTier: source.tier,
        sourceUrl: entry.link,
        publishedAt: publishedAt.toISOString()
      });
    }
  }

  console.log(`[rss] 피드 ${okFeeds}/${FEEDS.length}개 수신, 유효 ${items.length}건`);
  return items;
}

async function fetchFeed(name, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml"
      }
    });
    if (!response.ok) throw new Error(`${response.status}`);
    const xml = await response.text();
    return parseRss(xml);
  } catch (error) {
    console.warn(`[rss] ${name} 피드 실패 (${error.message}) - 건너뜀`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function parseRss(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = pickTag(block, "title");
    const link = pickTag(block, "link") || pickAttr(block, "link", "href");
    const pubDate = pickTag(block, "pubDate") || pickTag(block, "dc:date");
    const description = pickTag(block, "description");
    if (!title || !link || !/^https?:\/\//.test(link)) continue;
    items.push({ title, link, pubDate, description });
  }
  return items;
}

function pickTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function pickAttr(block, tag, attr) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i"));
  return match ? match[1].trim() : "";
}

function hash(value) {
  return createHash("sha1").update(String(value)).digest("hex").slice(0, 12);
}
