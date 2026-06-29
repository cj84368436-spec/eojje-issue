import { renderShell, renderCategoryList, renderStory } from "./src/view.js";
import { readFile } from "node:fs/promises";

const checked = [];
const mainSource = await readFile(new URL("./src/main.js", import.meta.url), "utf8");
expect(!mainSource.includes("renderSplash"), "app should show useful content without a timed splash delay");
checked.push("no timed splash delay");

expect(renderCategoryList([], new Set()).includes("오늘은 선별된 소식이 없어요"),
  "empty AI category should render an empty state");
checked.push("empty AI category state");

for (const issueCount of [5, 6]) {
  const shell = renderShell({
    dateString: "2026-06-19",
    savedCount: 0,
    activeTab: "headlines",
    staleDaysCount: 0,
    attendance: null,
    issueCount
  });
  expect(shell.includes(`${issueCount}개 이슈`), `shell should show dynamic ${issueCount} issue count`);
  expect(shell.includes('data-tab="ai"'), "shell should include AI tab");
}
checked.push("dynamic issue count", "AI tab visibility");

const baseStory = {
  id: "contract-story",
  category: "ai",
  title: "AI 업데이트 테스트",
  summary: "AI 기능 업데이트가 사용자 흐름을 바꾸는지 확인하는 문장입니다.",
  why: "기능 변화가 실제 사용 맥락에 영향을 줍니다.",
  points: ["채팅방 안에서 바로 호출합니다.", "별도 앱 이동을 줄입니다."],
  keywords: ["AI", "업데이트", "사용 흐름"],
  sourceName: "테스트",
  sourceUrl: "https://example.com",
  publishedAt: "2026-06-19T00:00:00.000Z",
  heat: 80,
  sensitivity: "낮음"
};

const unsafeStory = renderStory({ ...baseStory, sourceUrl: "javascript:alert(1)" }, new Set());
expect(!unsafeStory.includes('href="javascript:'), "unsafe source protocols must not become links");
expect(unsafeStory.includes("원문 링크 확인 중"), "unsafe source links should show a disabled state");
expect(!unsafeStory.includes("확인된 보도"), "coverage count must not imply independent fact verification");
expect(unsafeStory.includes("관련 보도"), "coverage count should use an honest related-coverage label");
expect(unsafeStory.includes("hidden inert"), "inactive story slides must be removed from keyboard navigation");
expect(mainSource.includes("trapStoryFocus") && mainSource.includes("detailOpener"),
  "story modal must trap focus and restore the opener");
checked.push("safe source links", "honest coverage label", "modal focus contract");

verifyFixture("summary equals point", {
  ...baseStory,
  id: "summary-equals-point",
  summary: "동일한 핵심 문장은 한 카드에서만 보여야 합니다.",
  why: "",
  points: ["동일한 핵심 문장은 한 카드에서만 보여야 합니다."],
  cardNews: undefined
}, 2);

verifyFixture("seventy percent token overlap", {
  ...baseStory,
  id: "seventy-percent-overlap",
  summary: "정부는 오늘 새로운 청년 주거 지원 정책의 세부 계획을 발표했습니다.",
  why: "",
  points: ["정부는 오늘 새로운 청년 주거 지원 정책의 시행 계획을 공개했습니다."],
  cardNews: undefined
}, 2);

verifyFixture("empty why", {
  ...baseStory,
  id: "empty-why",
  why: "",
  points: ["관리자는 변경 범위를 먼저 확인할 수 있습니다."]
}, 3);

verifyFixture("missing cardNews", {
  ...baseStory,
  id: "missing-card-news",
  cardNews: undefined
}, 3);

console.log(JSON.stringify({ checked, ok: true }, null, 2));

function verifyFixture(name, item, expectedSlides) {
  const slides = extractSlideTexts(renderStory(item, new Set(), { rank: 1, index: 0 }));
  expect(slides.length === expectedSlides,
    `${name}: expected ${expectedSlides} user-visible slides, received ${slides.length}`);
  expect(slides[0].includes("30초 브리핑") && slides[0].includes(item.title),
    `${name}: first slide should show title and 30-second briefing`);

  const finalText = slides.at(-1);
  for (const label of ["취재 근거", "원문", "저장", "완료"]) {
    expect(finalText.includes(label), `${name}: final slide should show ${label}`);
  }
  for (const phrase of ["사람들 반응", "주의할 점", "키워드"]) {
    expect(!slides.join(" ").includes(phrase), `${name}: should not show ${phrase}`);
  }
  checked.push(`${name} fixture`);
}

function extractSlideTexts(html) {
  return [...html.matchAll(/<article\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>([\s\S]*?)<\/article>/g)]
    .map((match) => match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim());
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}
