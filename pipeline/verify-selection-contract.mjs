import assert from "node:assert/strict";
import { classifyNews } from "./src/classify.js";
import { isExcludedTopic, isOpinionLike, selectNews } from "./src/select.js";

const now = "2026-06-22T12:00:00.000Z";
const base = {
  rawCategory: "politics",
  categoryFit: 5,
  summary: "검증 가능한 핵심 내용을 담은 완결된 요약입니다.",
  publishedAt: now,
  sensitivity: "낮음",
  heat: 60
};

const result = selectNews([
  { ...base, id: "weak", category: "politics", title: "이화영 연어 술파티 위증 판결 논란", heat: 60 },
  { ...base, id: "strong", category: "society", rawCategory: "society", title: "이화영 연어 술파티 의혹 위증 유죄 판결", heat: 90 },
  { ...base, id: "distinct", category: "economy", rawCategory: "economy", title: "원달러 환율 1520원 돌파", heat: 80 }
]);

const selected = Object.values(result.categories).flat();
assert.equal(selected.some((item) => item.id === "strong"), true, "중복 이슈 중 더 강한 기사를 남겨야 합니다.");
assert.equal(selected.some((item) => item.id === "weak"), false, "약한 중복 기사를 다른 카테고리에서 되살리면 안 됩니다.");
assert.equal(selected.some((item) => item.id === "distinct"), true, "서로 다른 이슈는 유지해야 합니다.");

const emptySummary = selectNews(Array.from({ length: 6 }, (_, index) => ({
  ...base,
  id: `empty-${index}`,
  category: "politics",
  title: `요약 없는 정치 기사 ${index + 1}`,
  summary: "",
  heat: 100 - index
})));
assert.equal(emptySummary.categories.politics.length, 0, "빈 요약 기사는 발행 후보에 포함하면 안 됩니다.");

assert.equal(isOpinionLike({
  title: "정책 없는 정부",
  sourceName: "테스트일보",
  rawCategory: "politics"
}), true, "사실 사건이 아닌 논평형 제목은 제외해야 합니다.");
assert.equal(isOpinionLike({
  title: '"국힘 파이팅!" 외친 한동훈…천하람 툭 치며 머쓱 웃음',
  sourceName: "테스트일보",
  rawCategory: "politics"
}), true, "정책이나 사건이 없는 정치인의 가벼운 장면은 제외해야 합니다.");
assert.equal(isOpinionLike({
  title: "디지털자산기본법, 하반기에 국회 통과시킬 것",
  sourceName: "테스트일보",
  rawCategory: "politics"
}), false, "구체적인 법안 처리 계획은 사실 기사로 유지해야 합니다.");
assert.equal(isOpinionLike({
  title: "나의 한계와 남편의 특권",
  description: "일사일언 필자의 유럽 여행 이야기",
  sourceName: "테스트일보",
  rawCategory: "culture"
}), true, "개인 칼럼은 문화 뉴스에서 제외해야 합니다.");

assert.equal(isExcludedTopic({
  title: "7회 선두타자 안타 뽑아내는 삼성 김도환",
  description: "KBO리그 야구장에서 타자가 안타를 기록했다."
}), true, "스포츠 경기 기사는 핵심 뉴스 카테고리에서 제외해야 합니다.");
assert.equal(isExcludedTopic({
  title: "삼성전자 온누리상품권 지급 개시",
  description: "전통시장과 동네상권 지원을 시작했다."
}), false, "기업 경제 기사를 스포츠 기사로 오인하면 안 됩니다.");

assert.equal(isExcludedTopic({
  title: "한·중·일 골프 대전 장유빈 역전 우승",
  description: "골프 대회 최종 라운드 결과입니다."
}), true);

const accident = classifyNews([{
  title: "남양주 낚시터서 70대 남성 물에 빠져 숨져",
  description: "경기 남양주시에서 사고가 발생했다.",
  rawCategory: "economy"
}])[0];
assert.equal(accident.category, "society", "지역명 '경기' 때문에 안전사고를 경제로 분류하면 안 됩니다.");

const economyDiversity = selectNews([
  ...Array.from({ length: 4 }, (_, index) => ({
    ...base,
    id: `stock-${index}`,
    category: "economy",
    rawCategory: "economy",
    title: `코스피 증시 변동 ${index + 1}일째 기록`,
    summary: `코스피 시장의 서로 다른 변동 상황 ${index + 1}건을 설명하는 완결된 요약입니다.`,
    heat: 100 - index
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    ...base,
    id: `economy-${index}`,
    category: "economy",
    rawCategory: "economy",
    title: `기업 실적과 수출 지표 ${index + 1}건 발표`,
    summary: `기업별 실적과 수출 지표 ${index + 1}건의 변화를 설명하는 완결된 요약입니다.`,
    heat: 80 - index
  }))
]);
assert.ok(economyDiversity.categories.economy.filter((item) => item.id.startsWith("stock-")).length <= 2, "한 카테고리가 증시 기사로 도배되면 안 됩니다.");

const cultureDiversity = selectNews([
  ...Array.from({ length: 4 }, (_, index) => ({
    ...base,
    id: `movie-${index}`,
    category: "culture",
    rawCategory: "culture",
    title: `영화 신작 ${index + 1} 개봉 관객 기록`,
    summary: `영화 신작 ${index + 1}이 개봉해 관객 기록을 세웠다는 핵심 내용을 설명합니다.`,
    heat: 100 - index
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    ...base,
    id: `culture-${index}`,
    category: "culture",
    rawCategory: "culture",
    title: `전시와 공연 문화 행사 ${index + 1} 개최`,
    summary: `전시와 공연을 결합한 문화 행사 ${index + 1}이 시민을 대상으로 열립니다.`,
    heat: 80 - index
  }))
]);
assert.ok(cultureDiversity.categories.culture.filter((item) => item.id.startsWith("movie-")).length <= 2);

const factualPolitics = Array.from({ length: 6 }, (_, index) => ({
  ...base,
  id: `fact-${index}`,
  category: "politics",
  title: `정부가 정책 개편안 ${index + 1}건을 발표했다`,
  heat: 80 - index
}));
const opinionExcluded = selectNews([
  ...factualPolitics,
  { ...base, id: "opinion", category: "politics", title: "정책 없는 정부", heat: 100 }
]);
assert.equal(opinionExcluded.categories.politics.some((item) => item.id === "opinion"), false, "고득점이어도 논평형 기사를 카테고리에 넣으면 안 됩니다.");

console.log(JSON.stringify({ ok: true, selected: selected.map((item) => item.id) }, null, 2));
