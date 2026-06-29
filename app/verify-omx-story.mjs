import { readFile } from "node:fs/promises";
import { renderStory } from "./src/view.js";

const payload = JSON.parse(await readFile(new URL("./public/today-news.json", import.meta.url), "utf8"));
const items = [
  ...(payload.headlines || []),
  ...Object.values(payload.categories || {}).flat()
];
const stories = Array.from(new Map(items.map((item) => [item.id, item])).values());
const failures = [];
const extractedStories = [];

for (const item of stories) {
  const slides = extractSlides(renderStory(item, new Set(), { rank: 1, index: 0 }));
  extractedStories.push({ id: item.id, slides: slides.map((slide) => slide.text) });
  verifyStory(item, slides, failures);
}

console.log(JSON.stringify({
  checkedStories: stories.length,
  checkedSlides: extractedStories.reduce((total, story) => total + story.slides.length, 0),
  failures,
  firstSixStories: extractedStories.slice(0, 6)
}, null, 2));

if (failures.length) process.exitCode = 1;

function verifyStory(item, slides, errors) {
  if (slides.length < 2 || slides.length > 3) {
    errors.push(`${item.id}: expected 2-3 slides, received ${slides.length}`);
    return;
  }

  const first = slides[0];
  if (!first.text.includes("30초 브리핑")) {
    errors.push(`${item.id}: first slide missing 30초 브리핑`);
  }
  if (!first.text.includes(item.title)) {
    errors.push(`${item.id}: first slide missing title`);
  }

  const allText = slides.map((slide) => slide.text).join(" ");
  for (const phrase of ["사람들 반응", "주의할 점", "키워드"]) {
    if (allText.includes(phrase)) errors.push(`${item.id}: forbidden phrase rendered: ${phrase}`);
  }

  const final = slides.at(-1);
  for (const label of ["취재 근거", "원문", "저장", "완료"]) {
    if (!final.text.includes(label)) errors.push(`${item.id}: final slide missing ${label}`);
  }

  for (let left = 0; left < slides.length; left += 1) {
    for (let right = left + 1; right < slides.length; right += 1) {
      verifyDistinctSlides(item.id, slides[left], slides[right], left + 1, right + 1, errors);
    }
  }

  const earlierBlocks = slides.slice(0, -1).flatMap((slide) => slide.coreBlocks);
  for (const finalBlock of final.coreBlocks) {
    const repeated = earlierBlocks.find((block) => similarity(block, finalBlock) >= 0.7);
    if (repeated) {
      errors.push(`${item.id}: final slide repeats summary: "${short(finalBlock)}"`);
    }
  }
}

function verifyDistinctSlides(id, left, right, leftNumber, rightNumber, errors) {
  for (const leftBlock of left.coreBlocks) {
    for (const rightBlock of right.coreBlocks) {
      const score = similarity(leftBlock, rightBlock);
      if (score >= 1) {
        errors.push(`${id}: slides ${leftNumber}/${rightNumber} repeat core text: "${short(rightBlock)}"`);
      } else if (score >= 0.7) {
        errors.push(`${id}: slides ${leftNumber}/${rightNumber} share ${Math.round(score * 100)}% of core tokens: "${short(rightBlock)}"`);
      }
    }
  }
}

function extractSlides(html) {
  return [...html.matchAll(/<article\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>([\s\S]*?)<\/article>/g)]
    .map((match) => {
      const body = match[1];
      return {
        text: visibleText(body),
        coreBlocks: [...body.matchAll(/<(?:h1|h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|p|li)>/g)]
          .map((block) => visibleText(block[1]))
          .filter(isCoreText)
      };
    });
}

function visibleText(html) {
  return decodeHtml(String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isCoreText(text) {
  return contentTokens(text).length >= 3
    && !/원문 기반 브리핑$/.test(text)
    && !/^요약만으로 판단하지 말고/.test(text);
}

function similarity(left, right) {
  const normalizedLeft = normalizeSentence(left);
  const normalizedRight = normalizeSentence(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const leftTokens = new Set(contentTokens(left));
  const rightTokens = new Set(contentTokens(right));
  const denominator = Math.min(leftTokens.size, rightTokens.size);
  if (denominator === 0) return 0;

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / denominator;
}

function normalizeSentence(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^가-힣a-z0-9%]/g, "");
}

function contentTokens(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^가-힣a-z0-9%\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .filter((token) => !/^(기사|뉴스|관련|기록|했다|됐다|입니다)$/.test(token));
}

function short(value) {
  return value.length > 90 ? `${value.slice(0, 87)}...` : value;
}
