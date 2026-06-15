import { runDailyBatch, type Article } from "./card-news.js";

const sampleArticle: Article = {
  id: "sample-article-001",
  category: "경제",
  sourceName: "샘플뉴스",
  sourceUrl: "https://example.com/news/sample-article-001",
  title: "코스피 급등에 매수 사이드카 발동",
  body: `코스피가 장중 급등하면서 프로그램 매수 호가의 효력이 일시 정지되는 매수 사이드카가 발동됐다.
한국거래소는 이날 오전 9시 6분 코스피200 선물 가격이 전일 종가보다 5% 이상 상승하고 1분 이상 지속돼 매수 사이드카를 발동했다고 밝혔다.
사이드카는 선물시장의 급격한 변동이 현물시장에 미치는 영향을 줄이기 위해 프로그램 매매를 5분간 제한하는 제도다.
이날 유가증권시장에서는 반도체와 금융 업종을 중심으로 매수세가 유입됐다.`,
  publishedAt: new Date().toISOString(),
  attention: 92
};

const results = await runDailyBatch([sampleArticle]);
console.log(JSON.stringify(results, null, 2));
