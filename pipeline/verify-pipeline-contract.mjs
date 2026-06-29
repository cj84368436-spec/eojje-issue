import assert from "node:assert/strict";
import { prepareSummarySentence, summarizeNews, summaryFromConcreteEvent } from "./src/summarize.js";
import { selectNews } from "./src/select.js";
import { shapePayload } from "./src/publish.js";
import { inspectPayload } from "./src/report.js";
import { cleanTitle, hasBalancedQuotes, hasSentenceEnding, includesNumericClaim, isGoodSentence, isSimilarIssue, normalizePublicText, numericClaims } from "./src/text.js";
import { timeLabel } from "../app/src/format.js";

assert.equal(
  prepareSummarySentence(
    '미국-이란, 종전협상 첫 성과…"이란, IAEA 활동 재개 합의" 종전 양해각서 이행을 위해 첫 고위급 회담을 가졌습니다.',
    '종전협상 첫 성과…"이란, IAEA 활동 재개 합의"'
  ),
  "종전 양해각서 이행을 위해 첫 고위급 회담을 가졌습니다.",
  "제목을 반복한 도입부는 제거해야 합니다."
);
assert.equal(
  prepareSummarySentence(
    "제치고 코스피 시총 1위 SK하이닉스가 장중 삼성전자를 제치고 국내 증시 시가총액 1위에 올랐습니다.",
    "SK하이닉스, 삼전 제치고 국내증시 시총 1위 등극"
  ),
  "SK하이닉스가 장중 삼성전자를 제치고 국내 증시 시가총액 1위에 올랐습니다.",
  "문장 중간에서 시작한 연결절은 주어부터 복구해야 합니다."
);

const [rejected] = summarizeNews([{
  title: "환율 1천520원 돌파",
  description: "주말 전국에 비가 내릴 전망입니다. 시민들은 우산을 준비했습니다.",
  summary: ""
}]);
assert.equal(rejected.summary, "", "제목과 무관한 첫 문장을 요약으로 채택하면 안 됩니다.");

const [runOnRejected] = summarizeNews([{
  title: "참교육, 넷플릭스 비영어권 1위",
  description: "넷플릭스 비영어권 TV쇼 2주 연속 세계 1위였다 교사 반응도 이어졌다 해외 매체 평가도 나왔다.",
  summary: ""
}]);
assert.equal(runOnRejected.summary, "", "여러 문장이 붙은 원문 조각을 요약으로 채택하면 안 됩니다.");

assert.equal(isGoodSentence("정부는 지원 대상을 확대한다고 밝혔"), false, "미완성 문장은 거부해야 합니다.");
assert.equal(hasBalancedQuotes('정부는 "지원 확대를 발표했습니다.'), false, "닫히지 않은 인용부호를 거부해야 합니다.");
assert.equal(hasSentenceEnding("정부는 지원 확대를 발표했습니다."), true);
assert.deepEqual(numericClaims("누적 546만 돌파, 7년 만의 기록"), ["546만", "7년"]);

const [numericMismatch] = summarizeNews([{
  title: "영화 군체 누적 546만 돌파",
  description: "영화 군체는 지난달 개봉했습니다. 영화 군체가 누적 관객 546만 명을 돌파했습니다.",
  summary: ""
}]);
assert.equal(numericMismatch.summary, "영화 군체가 누적 관객 546만 명을 돌파했습니다.", "제목의 핵심 숫자를 포함한 문장을 선택해야 합니다.");

const [preserved] = summarizeNews([{
  title: "환율 1천520원 돌파",
  description: "주말 전국에 비가 내릴 전망입니다.",
  summary: "원·달러 환율이 1천520원을 돌파하며 외환시장 변동성이 커졌습니다."
}]);
assert.equal(
  preserved.summary,
  "원·달러 환율이 1천520원을 돌파하며 외환시장 변동성이 커졌습니다.",
  "원문 보강 결과가 나빠져도 기존의 정합한 요약은 보존해야 합니다."
);

const aiItems = Array.from({ length: 2 }, (_, index) => ({
  id: `ai-${index}`,
  category: "ai",
  rawCategory: "ai",
  categoryFit: 5,
  title: `AI 기능 업데이트 ${index + 1}`,
  summary: `AI 기능 업데이트 ${index + 1}의 주요 변경 내용이 공개됐습니다.`,
  heat: 80 - index,
  publishedAt: new Date().toISOString(),
  sensitivity: "낮음"
}));
const selected = selectNews(aiItems);
assert.deepEqual(selected.categories.ai, [], "AI 뉴스가 6건 미만이면 AI 카테고리를 숨겨야 합니다.");

assert.equal(isSimilarIssue(
  { title: "코스피 9000인데 국내 증시 8%가 동전주, 7월부터 상장폐지 대상" },
  { title: "1000원 미만 동전주 219개, 상폐 규정 시행" }
), true, "같은 이슈의 약어 표기 차이를 중복으로 판정해야 합니다.");

assert.equal(
  normalizePublicText("[환율 급등 (연합뉴스 자료사진)]환율이 1,520원을 넘었다.21일 시장 변동성 이 커졌다."),
  "환율이 1,520원을 넘었다. 21일 시장 변동성이 커졌다.",
  "사진 캡션, 붙은 문장, 비정상 조사 띄어쓰기를 정규화해야 합니다."
);
assert.equal(normalizePublicText("최미나수가 &#x27;라이징스타상&#x27;을 받았다&hellip;화제다."), "최미나수가 '라이징스타상'을 받았다…화제다.");
assert.equal(normalizePublicText("관광 객이 관광 지를 찾고 지난주 개봉 한 영화도 봤다."), "관광객이 관광지를 찾고 지난주 개봉한 영화도 봤다.");
assert.equal(normalizePublicText("관광 공사는 축제 , 맛집 정보를 제공하기로했다."), "관광공사는 축제, 맛집 정보를 제공하기로 했다.");
assert.equal(normalizePublicText("▶ 글 싣는 순서 ①첫 기사 ②둘째 기사 (계속) 검사의 보완수사권을 폐지하는 법안이 시행된다."), "검사의 보완수사권을 폐지하는 법안이 시행된다.");
assert.equal(normalizePublicText("출판 사가 한국 문학 책을 냈고 기업 들이 참여했다."), "출판사가 한국문학 책을 냈고 기업들이 참여했다.");
assert.equal(normalizePublicText("K팝 콘서트 '예매 전쟁' 폐해가 커졌다."), "K팝 콘서트 '예매 전쟁' 폐해가 커졌다.");
assert.equal(normalizePublicText("최근 아이돌 컴백 기간에는이 같은 홍보가 이어졌다."), "최근 아이돌 컴백 기간에는 이 같은 홍보가 이어졌다.");
assert.equal(normalizePublicText("그런데 첫날부터 선관위 주요 책임자들이 무더기로 불출석했습니다."), "첫날부터 선관위 주요 책임자들이 무더기로 불출석했습니다.");

const publicItem = {
  id: "trust-contract",
  category: "politics",
  title: "환율 급등",
  summary: "[연합뉴스 자료사진]환율이 1,520원을 넘었다.21일 시장 변동성 이 커졌다.",
  why: "",
  points: [
    "환율이 1,520원을 넘었다.21일 시장 변동성 이 커졌다.",
    "시장에서는 추가 변동 가능성을 지켜보고 있다."
  ],
  keywords: [],
  sourceName: "테스트",
  sourceUrl: "https://example.com",
  publishedAt: "2999-01-01T00:00:00.000Z",
  heat: 80,
  sensitivity: "낮음",
  scoreSignals: {}
};
const shaped = shapePayload({
  date: "2026-06-21",
  source: "contract",
  categories: { politics: [publicItem] },
  headlines: [publicItem],
  stats: { collected: 1, deduped: 1 }
});
assert.equal(shaped.categories.politics[0].summary, "환율이 1,520원을 넘었다. 21일 시장 변동성이 커졌다.");
assert.deepEqual(shaped.categories.politics[0].points, ["시장에서는 추가 변동 가능성을 지켜보고 있다."]);
assert.equal(shaped.categories.politics[0].publishedAt, "", "미래 발행 시각은 공개 payload에서 격리해야 합니다.");
assert.equal(shaped.categories.politics[0].why, "", "근거가 없는 why를 생성하면 안 됩니다.");
assert.equal("cardNews" in shaped.categories.politics[0], false, "승인 필드가 없는 카드뉴스 캐시는 공개 payload에 포함하면 안 됩니다.");

const rawInspection = inspectPayload({
  generatedAt: "2026-06-21T00:00:00.000Z",
  headlines: [],
  categories: {
    politics: [{ ...publicItem, summary: "환율이 &#x27;급등&#x27;했다.", points: ["환율이 '급등'했다."], publishedAt: "2026-06-22T00:00:00.000Z" }],
    economy: [], society: [], culture: [], ai: []
  }
});
assert.equal(rawInspection.quality.htmlEntity, 1);
assert.equal(rawInspection.quality.futurePublishedAt, 1);
assert.equal(rawInspection.quality.summaryPointDuplicates, 1);

const repeatedTitleInspection = inspectPayload({
  generatedAt: "2026-06-23T00:00:00.000Z",
  headlines: [],
  categories: {
    politics: [{
      ...publicItem,
      title: '종전협상 첫 성과…"이란, IAEA 활동 재개 합의"',
      summary: '미국-이란, 종전협상 첫 성과…"이란, IAEA 활동 재개 합의" 양국은 첫 고위급 회담을 가졌습니다.'
    }],
    economy: [], society: [], culture: [], entertainment: [], ai: []
  }
});
assert.equal(repeatedTitleInspection.quality.titleSummaryDuplicates, 1, "제목을 재복사한 요약은 배포 전에 감지해야 합니다.");

const invalidPointInspection = inspectPayload({
  generatedAt: "2026-06-23T00:00:00.000Z",
  headlines: [],
  categories: {
    politics: [{ ...publicItem, summary: "정부가 검증 가능한 정책 변경 내용을 공식 발표했습니다.", points: ["국힘, 청와대 인선 '혹평"] }],
    economy: [], society: [], culture: [], entertainment: [], ai: []
  }
});
assert.equal(invalidPointInspection.quality.invalidPoint, 1, "깨진 맥락 문장도 배포 전에 차단해야 합니다.");

assert.equal(
  summaryFromConcreteEvent({ title: '"달빛 아래 달콤한 밤"…서초구, 27∼28일 K-디저트 축제' }),
  "서초구가 27일부터 28일까지 K-디저트 축제를 연다."
);
assert.equal(
  summaryFromConcreteEvent({ title: "'K-뷰티의 모든 것'…문체부, 오늘 코리아뷰티페스티벌 개막" }),
  "문체부가 코리아뷰티페스티벌을 개막했다."
);
assert.equal(summaryFromConcreteEvent({ title: "흥미로운 문화 소식" }), "");

assert.equal(
  prepareSummarySentence("처음으로 경찰에 출석해 피의자 조사를 받는다.", "'이 대통령 명예훼손 혐의' 모스탄, 내일 경찰 조사 첫 출석"),
  "모스탄은 처음으로 경찰에 출석해 피의자 조사를 받는다."
);
assert.equal(
  prepareSummarySentence("24일 영화 '호프'(감독 나홍진, 제작 포지드필름스, 공동제작 플러스엠 엔터테인먼트·웨스트월드, 제공/배급 플러스엠 엔터테인먼트) 측은 메이킹 예고편을 공개했다.", "나홍진 신작 '호프' 예고편 공개"),
  "24일 영화 '호프' 측은 메이킹 예고편을 공개했다."
);

assert.equal(isGoodSentence("※CBS노컷뉴스는 여러분의 제보로 함께 세상을 바꿉니다."), false);
assert.equal(cleanTitle("'李대통령 명예훼손 혐의' 모스탄, 내일 경찰 조사 첫 출석"), "'이 대통령 명예훼손 혐의' 모스탄, 내일 경찰 조사 첫 출석");

assert.equal(includesNumericClaim(["27일", "28일"], "27"), true);
assert.equal(includesNumericClaim(["10명"], "10%"), false);

const futureLabel = timeLabel(new Date(Date.now() + 3_600_000).toISOString());
assert.notEqual(futureLabel, "방금 전", "미래 시각을 방금 전으로 표시하면 안 됩니다.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "unrelated summary rejection",
    "run-on summary rejection",
    "aligned summary preservation",
    "optional AI category threshold",
    "duplicate abbreviation normalization",
    "public text normalization",
    "summary-point duplicate removal",
    "future timestamp safeguards",
    "quality report trust metrics"
  ]
}, null, 2));
