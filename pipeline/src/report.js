import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CATEGORIES, CATEGORY_LABELS, ITEMS_PER_CATEGORY } from "./config.js";
import { hasBalancedQuotes, hasHtmlEntity, hasLeadingFragment, hasRunOn, hasSentenceEnding, includesNumericClaim, isGoodSentence, isPhotoCaption, isSimilarIssue, isSubstantiallySameText, isTruncated, importantTokens, normalizePublicText, numericClaims } from "./text.js";
import { isExcludedTopic } from "./select.js";

const REPORT_MD_PATH = resolve("output", "quality-report.md");
const REPORT_JSON_PATH = resolve("output", "quality-report.json");

export function inspectPayload(payload) {
  const warnings = [];
  const allItems = Object.values(payload.categories).flat();
  const headlineCategories = payload.headlines.map((item) => item.category);
  const activeCategories = CATEGORIES.filter((category) => {
    const count = (payload.categories[category.id] || []).length;
    return count > 0 || !category.optional;
  });

  if (payload.headlines.length !== activeCategories.length) {
    warnings.push({ level: "block", message: `헤드라인이 ${payload.headlines.length}개입니다. 목표는 ${activeCategories.length}개입니다.` });
  }

  for (const category of CATEGORIES) {
    const count = (payload.categories[category.id] || []).length;
    if (category.optional && count === 0) continue;
    if (category.optional && count < ITEMS_PER_CATEGORY) warnings.push({ level: "block", message: `${category.label} 카테고리가 ${count}개입니다. 노출하려면 ${ITEMS_PER_CATEGORY}개가 필요합니다.` });
    else if (!category.optional && count < ITEMS_PER_CATEGORY) warnings.push({ level: "block", message: `${category.label} 카테고리가 ${count}개입니다. 발행하려면 ${ITEMS_PER_CATEGORY}개가 필요합니다.` });
    if (!headlineCategories.includes(category.id)) warnings.push({ level: "block", message: `헤드라인에 ${category.label} 대표 기사가 없습니다.` });
  }

  for (let i = 0; i < payload.headlines.length; i += 1) {
    for (let j = i + 1; j < payload.headlines.length; j += 1) {
      if (isSimilarIssue(payload.headlines[i], payload.headlines[j])) {
        warnings.push({ level: "warn", message: `헤드라인 중복 의심: "${payload.headlines[i].title}" / "${payload.headlines[j].title}"` });
      }
    }
  }

  const quality = {
    total: allItems.length,
    emptySummary: 0,
    truncated: 0,
    fragment: 0,
    runOn: 0,
    caption: 0,
    htmlEntity: 0,
    futurePublishedAt: 0,
    summaryPointDuplicates: 0,
    titleSummaryDuplicates: 0,
    titleMismatch: 0,
    weakSummary: 0,
    invalidSentence: 0,
    invalidPoint: 0,
    excludedTopic: 0,
    dupSuspects: 0
  };
  const mismatched = [];
  const weakSummaries = [];

  for (const item of allItems) {
    if (isExcludedTopic(item)) quality.excludedTopic += 1;
    if (!item.summary) quality.emptySummary += 1;
    const textsToCheck = [item.title, item.summary, item.why, ...(item.points || [])].filter(Boolean);
    if (textsToCheck.some(isTruncated)) quality.truncated += 1;
    if ([item.summary, ...(item.points || [])].some(hasHtmlEntity)) quality.htmlEntity += 1;
    if (isFuturePublishedAt(item.publishedAt, payload.generatedAt)) quality.futurePublishedAt += 1;
    quality.summaryPointDuplicates += (item.points || []).filter((point) => isSubstantiallySameText(item.summary, point)).length;
    if (item.summary && repeatsTitleInSummary(item)) quality.titleSummaryDuplicates += 1;
    if (item.summary && hasLeadingFragment(item.summary)) quality.fragment += 1;
    if (item.summary && hasRunOn(item.summary)) quality.runOn += 1;
    if (item.summary && isPhotoCaption(item.summary)) quality.caption += 1;
    if (item.summary && (!hasSentenceEnding(item.summary) || !hasBalancedQuotes(item.summary))) quality.invalidSentence += 1;
    if (item.summary && isTitleMismatch(item)) {
      quality.titleMismatch += 1;
      mismatched.push(item);
    }
    if (item.summary && isWeakSummary(item.summary)) {
      quality.weakSummary += 1;
      weakSummaries.push(item);
    }
    quality.invalidPoint += (item.points || []).filter((point) => !isGoodSentence(point)).length;
  }

  const heats = allItems.map((item) => item.heat || 0);
  quality.heat = {
    avg: Number((heats.reduce((sum, heat) => sum + heat, 0) / Math.max(1, heats.length)).toFixed(1)),
    max: heats.length ? Math.max(...heats) : 0,
    min: heats.length ? Math.min(...heats) : 0,
    ge90: heats.filter((heat) => heat >= 90).length,
    ge75: heats.filter((heat) => heat >= 75).length,
    lt60: heats.filter((heat) => heat < 60).length
  };

  quality.sensitivity = { 낮음: 0, 중간: 0, 높음: 0 };
  for (const item of allItems) {
    if (item.sensitivity in quality.sensitivity) quality.sensitivity[item.sensitivity] += 1;
  }

  if (quality.truncated > 0) warnings.push({ level: "block", message: `말줄임표로 끝나는 제목/요약이 ${quality.truncated}개 있습니다.` });
  if (quality.emptySummary > 0) warnings.push({ level: "block", message: `빈 요약이 ${quality.emptySummary}개 있습니다.` });
  if (quality.caption > 0) warnings.push({ level: "warn", message: `사진 캡션으로 보이는 요약이 ${quality.caption}개 있습니다.` });
  if (quality.invalidSentence > 0) warnings.push({ level: "block", message: `문장 종결 또는 인용부호가 불완전한 요약이 ${quality.invalidSentence}개 있습니다.` });
  if (quality.invalidPoint > 0) warnings.push({ level: "block", message: `앞뒤가 잘리거나 불완전한 맥락 문장이 ${quality.invalidPoint}개 있습니다.` });
  if (quality.excludedTopic > 0) warnings.push({ level: "block", message: `서비스 범위를 벗어난 스포츠 기사가 ${quality.excludedTopic}개 있습니다.` });
  if (quality.fragment > 0) warnings.push({ level: "block", message: `앞이 잘린 요약이 ${quality.fragment}개 있습니다.` });
  if (quality.runOn > 0) warnings.push({ level: "block", message: `문장이 붙은 요약이 ${quality.runOn}개 있습니다.` });
  if (quality.htmlEntity > 0) warnings.push({ level: "block", message: `HTML entity가 남은 요약/포인트가 ${quality.htmlEntity}개 있습니다.` });
  if (quality.futurePublishedAt > 0) warnings.push({ level: "block", message: `생성 시각보다 미래인 발행 시각이 ${quality.futurePublishedAt}개 있습니다.` });
  if (quality.summaryPointDuplicates > 0) warnings.push({ level: "block", message: `요약과 사실상 같은 포인트가 ${quality.summaryPointDuplicates}개 있습니다.` });
  if (quality.titleSummaryDuplicates > 0) warnings.push({ level: "block", message: `제목을 반복한 도입부가 남은 요약이 ${quality.titleSummaryDuplicates}개 있습니다.` });
  if (quality.titleMismatch > 0) {
    warnings.push({ level: "block", message: `제목-요약 불일치 의심이 ${quality.titleMismatch}개 있습니다.` });
    for (const item of mismatched.slice(0, 5)) {
      warnings.push({ level: "warn", message: `불일치 검토 필요: "${item.title}" / "${item.summary.slice(0, 60)}"` });
    }
  }
  if (quality.weakSummary > 0) {
    warnings.push({ level: "block", message: `원문 조각이나 대화문이 그대로 들어간 약한 요약이 ${quality.weakSummary}개 있습니다.` });
    for (const item of weakSummaries.slice(0, 5)) {
      warnings.push({ level: "warn", message: `요약 재작성 필요: "${item.title}" / "${item.summary.slice(0, 60)}"` });
    }
  }

  for (const item of payload.headlines) {
    if (!item.summary) warnings.push({ level: "warn", message: `헤드라인 요약 없음: "${item.title}"` });
    if (item.sensitivity === "높음") warnings.push({ level: "warn", message: `민감도 높음 헤드라인: "${item.title}"` });
  }

  for (const [categoryId, items] of Object.entries(payload.categories)) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        if (isSimilarIssue(items[i], items[j])) {
          quality.dupSuspects += 1;
          warnings.push({ level: "warn", message: `${CATEGORY_LABELS[categoryId]} 중복 의심: "${items[i].title}" / "${items[j].title}"` });
        }
      }
    }
  }

  quality.emptySummaryRate = Number((quality.emptySummary / Math.max(1, quality.total)).toFixed(3));
  return { warnings, quality };
}

export async function writeReport(payload, inspection, runMeta) {
  const { warnings, quality } = inspection;
  const blockers = warnings.filter((warning) => warning.level === "block");

  const md = [
    "# 어제이슈 검수 리포트",
    "",
    `- 생성 시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
    `- 데이터 날짜: ${payload.date}`,
    `- 수집원: ${payload.source}`,
    `- 수집 ${runMeta.collected}건 / 중복 제거 후 ${runMeta.deduped}건 / 발행 후보 ${quality.total}건`,
    `- 앱 공개 발행: ${blockers.length === 0 ? "가능" : "차단"}`,
    "",
    "## 품질 지표",
    "",
    `- 빈 요약: ${quality.emptySummary}/${quality.total} (${(quality.emptySummaryRate * 100).toFixed(0)}%)`,
    `- 말줄임표/잘림: ${quality.truncated}`,
    `- 앞 잘림 의심: ${quality.fragment}`,
    `- 문장 붙음: ${quality.runOn}`,
    `- 사진 캡션 의심: ${quality.caption}`,
    `- 불완전 문장: ${quality.invalidSentence}`,
    `- 불완전 맥락 문장: ${quality.invalidPoint}`,
    `- 서비스 범위 밖 기사: ${quality.excludedTopic}`,
    `- HTML entity 잔존: ${quality.htmlEntity}`,
    `- 미래 발행 시각: ${quality.futurePublishedAt}`,
    `- 요약-포인트 중복: ${quality.summaryPointDuplicates}`,
    `- 제목-요약 반복: ${quality.titleSummaryDuplicates}`,
    `- 제목-요약 불일치 의심: ${quality.titleMismatch}`,
    `- 약한 요약 의심: ${quality.weakSummary}`,
    `- 중복 의심: ${quality.dupSuspects}`,
    "",
    "## 주목도 분포",
    "",
    `- 평균 ${quality.heat.avg} / 최고 ${quality.heat.max} / 최저 ${quality.heat.min}`,
    `- 90 이상: ${quality.heat.ge90}개`,
    `- 75 이상: ${quality.heat.ge75}개`,
    `- 60 미만: ${quality.heat.lt60}개`,
    "",
    "## 민감도 분포",
    "",
    `- 낮음 ${quality.sensitivity.낮음} / 중간 ${quality.sensitivity.중간} / 높음 ${quality.sensitivity.높음}`,
    `- 헤드라인 중 높음: ${payload.headlines.filter((item) => item.sensitivity === "높음").length}개`,
    "",
    `## 검수 결과 (${blockers.length > 0 ? "차단 경고 있음" : "통과"})`,
    "",
    ...(warnings.length ? warnings.map((warning) => `- [${warning.level === "block" ? "차단" : "주의"}] ${warning.message}`) : ["- 문제 없음"]),
    "",
    "## 헤드라인",
    "",
    ...payload.headlines.map((item, index) => [
      `### ${index + 1}. ${CATEGORY_LABELS[item.category]} | ${item.title}`,
      "",
      `- 요약: ${item.summary || "(요약 없음)"}`,
      `- 출처: ${item.sourceName} / 주목도 ${item.heat} / 민감도 ${item.sensitivity}`,
      `- 원문: ${item.sourceUrl}`,
      ""
    ].join("\n")),
    "## 카테고리별 발행 목록",
    "",
    ...Object.entries(payload.categories).flatMap(([categoryId, items]) => [
      `### ${CATEGORY_LABELS[categoryId]}`,
      "",
      ...(items.length ? items.map((item, index) => `${index + 1}. [${item.heat}/${item.sensitivity}] ${item.title} (${item.sourceName})${item.summary ? "" : " - 요약 없음"}`) : ["- 발행할 이슈 없음"]),
      ""
    ])
  ].join("\n");

  await mkdir(dirname(REPORT_MD_PATH), { recursive: true });
  await writeFile(REPORT_MD_PATH, `${md}\n`, "utf8");
  await writeFile(REPORT_JSON_PATH, `${JSON.stringify({ date: payload.date, quality, warnings }, null, 2)}\n`, "utf8");

  return { mdPath: REPORT_MD_PATH, jsonPath: REPORT_JSON_PATH, blockers: blockers.length, warnings: warnings.length };
}

function isTitleMismatch(item) {
  const titleTokens = importantTokens(item.title, 14);
  if (titleTokens.length === 0) return false;
  const matched = titleTokens.filter((token) => item.summary.includes(token)).length;
  const summaryNumbers = new Set(numericClaims(item.summary));
  if (numericClaims(item.title).some((claim) => !includesNumericClaim([...summaryNumbers], claim))) return true;
  return titleTokens.length <= 2 ? matched < 1 : matched < 2;
}

function isWeakSummary(summary = "") {
  return /^(알려줘|작성해 줘|저는 대사가 없어요|당시 캐릭터로서의 반응)/.test(summary.trim())
    || /@\s*ChatGPT/.test(summary)
    || /명령어를 입력하면/.test(summary);
}

function repeatsTitleInSummary(item) {
  const title = normalizePublicText(item.title);
  const summary = normalizePublicText(item.summary);
  const titleAt = title ? summary.indexOf(title) : -1;
  return titleAt >= 0 && titleAt <= 24 && summary.length - title.length >= 12;
}

function isFuturePublishedAt(publishedAt, generatedAt) {
  const publishedMs = new Date(publishedAt).getTime();
  const generatedMs = new Date(generatedAt).getTime();
  return Number.isFinite(publishedMs) && Number.isFinite(generatedMs) && publishedMs > generatedMs;
}
