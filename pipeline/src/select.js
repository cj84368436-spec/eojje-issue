import { CATEGORIES, ITEMS_PER_CATEGORY } from "./config.js";
import { isSimilarIssue, isTruncated } from "./text.js";

export function selectNews(items) {
  const categories = {};
  const headlines = [];
  const globallyDistinct = pickGlobalIssues(items);

  for (const category of CATEGORIES) {
    const pool = globallyDistinct
      .filter((item) => item.category === category.id)
      .filter((item) => item.categoryFit >= 2 || item.rawCategory === category.id || category.optional)
      .filter((item) => !isFuturePublished(item))
      .filter((item) => !isExcludedTopic(item))
      .filter((item) => !isOpinionLike(item))
      .sort(byQuality);

    const selected = pickDiverse(pool, ITEMS_PER_CATEGORY);
    categories[category.id] = category.optional && selected.length < ITEMS_PER_CATEGORY
      ? []
      : selected;
  }

  const lead = Object.values(categories)
    .flat()
    .filter(isHeadlineCandidate)
    .sort(byHeadlineQuality)[0];

  if (lead) headlines.push(lead);

  for (const category of CATEGORIES) {
    if (category.id === lead?.category) continue;

    const candidates = categories[category.id];
    const headline = candidates.find((item) =>
      item.id !== lead?.id &&
      isHeadlineCandidate(item) &&
      !headlines.some((picked) => isSimilarIssue(picked, item))
    );

    if (headline) headlines.push(headline);
  }

  return { categories, headlines: headlines.slice(0, CATEGORIES.length) };
}

function pickGlobalIssues(items) {
  const eligible = items
    .filter((item) => CATEGORIES.some((category) => category.id === item.category
      && (item.categoryFit >= 2 || item.rawCategory === category.id || category.optional)))
    .filter((item) => !isFuturePublished(item))
    .filter((item) => !isExcludedTopic(item))
    .sort(byQuality);
  const selected = [];

  for (const item of eligible) {
    if (selected.some((picked) => isSimilarIssue(
      { ...picked, summary: "" },
      { ...item, summary: "" }
    ))) continue;
    selected.push(item);
  }

  return selected;
}

function isHeadlineCandidate(item) {
  return Boolean(item?.summary
    && !isTruncated(item.summary)
    && item.sensitivity !== "높음"
    && !isOpinionLike(item)
    && !isLowSubstance(item));
}

export function isOpinionLike(item) {
  const title = String(item?.title || "");
  const source = String(item?.sourceName || "");
  const rawCategory = String(item?.rawCategory || "");
  const description = String(item?.description || "");
  const text = `${title} ${source} ${rawCategory} ${description}`;

  if (isAnalysisTitle(title)) return true;
  if (/(칼럼|오피니언|논평|사설|시론|기고|기자수첩|취재수첩|데스크|만평|일사일언)/.test(text)) return true;
  if (/(정책 없는 정부|모순덩어리|대안 찾아야|파이팅.*머쓱|툭 치며.*웃음)/.test(title)) return true;

  return false;
}

function isLowSubstance(item) {
  const title = String(item?.title || "");
  if (/(팝업스토어|셀카 공개|근황(?:\s|·|…|$)|화보 공개|상품권.*지급)/.test(title)) return true;
  const hasNewsVerb = /(발표|발동|출시|개최|입대|지원|돌파|확정|검토|판결|패소|승소|수사|체포|구속|기소|비판|합의|상장|공모|신고|안내|공개|개봉|급등|폭락|하락|증가|감소|처리|불출석|충돌|남발|포기|요구|돌입|운영|마련|보존|수상|지급|강화|전환|출석|알선|도입|시작|마감|선정|시행|통과|선보|전시|공연|출간|발간|개막|상영|방영|방송|출연|컴백|데뷔|복귀|결혼|계약|연주자상|작품상|대상|신인상|최우수상|팝업스토어|여행비서|시청률|싱글|앨범)/.test(title);
  const hasConcreteSignal = /\d+(?:[,.]\d+)*(?:%|천|만|억|조|명|개|건|회|배|원|위|년|개월|월|일|시간|분)?/.test(title);
  return !hasNewsVerb && !hasConcreteSignal;
}

export function isExcludedTopic(item) {
  const text = `${item?.title || ""} ${item?.description || ""}`;
  return /(KBO리그|프로야구|야구장|타석|타자|투수|안타|홈런|이닝|득점|선발투수|축구대표팀|프로축구|K리그|프리미어리그|챔피언스리그|골프|KPGA|KLPGA|PGA\s*투어)/i.test(text);
}

export function isFuturePublished(item, now = new Date()) {
  const publishedMs = new Date(item?.publishedAt).getTime();
  const nowMs = new Date(now).getTime();
  return Number.isFinite(publishedMs) && Number.isFinite(nowMs) && publishedMs > nowMs;
}

function isAnalysisTitle(title) {
  const value = String(title).trim();
  return /\?$/.test(value) || /(일까|될까|왜|전망|분석|변화는|가능성|어디로|갈림길)\??$/.test(value);
}

function byHeadlineQuality(a, b) {
  if (b.heat !== a.heat) return b.heat - a.heat;
  const coverageDiff = sourceCount(b) - sourceCount(a);
  if (coverageDiff) return coverageDiff;
  return byQuality(a, b);
}

function sourceCount(item) {
  const names = new Set([item.sourceName, ...(item.coverageSources || [])].filter(Boolean));
  return Math.max(1, names.size);
}

function byQuality(a, b) {
  const aSummary = a.summary ? 1 : 0;
  const bSummary = b.summary ? 1 : 0;
  if (aSummary !== bSummary) return bSummary - aSummary;
  const substanceDiff = Number(isLowSubstance(a)) - Number(isLowSubstance(b));
  if (substanceDiff) return substanceDiff;
  if (b.heat !== a.heat) return b.heat - a.heat;
  return new Date(b.publishedAt) - new Date(a.publishedAt);
}

function pickDiverse(pool, limit) {
  const selected = [];

  for (const item of pool) {
    if (selected.length >= limit) break;
    if (!item.summary || isTruncated(item.summary)) continue;
    if (exceedsTopicLimit(selected, item)) continue;
    if (selected.some((picked) => isSimilarIssue(picked, item))) continue;
    selected.push(item);
  }

  if (selected.length < limit) {
    for (const item of pool) {
      if (selected.length >= limit) break;
      if (selected.some((picked) => picked.id === item.id)) continue;
      if (!item.summary || isTruncated(item.summary)) continue;
      if (exceedsTopicLimit(selected, item)) continue;
      if (selected.some((picked) => isSimilarIssue(picked, item))) continue;
      selected.push(item);
    }
  }

  return selected;
}

function exceedsTopicLimit(selected, item) {
  const family = topicFamily(item);
  if (!family) return false;
  return selected.filter((picked) => topicFamily(picked) === family).length >= 2;
}

function topicFamily(item) {
  const text = `${item?.title || ""} ${item?.summary || ""}`;
  if (/(코스피|코스닥|증시|서킷브레이커)/.test(text)) return "stock-market";
  if (item?.category === "culture" && /(영화|극장판|박스오피스|개봉|관객|디즈니|픽사)/.test(text)) return "culture-film";
  return "";
}
