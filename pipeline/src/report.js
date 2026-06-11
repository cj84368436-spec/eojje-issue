import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CATEGORIES, CATEGORY_LABELS, ITEMS_PER_CATEGORY } from "./config.js";
import { isSimilarIssue, hasLeadingFragment, hasRunOn, isPhotoCaption, isTruncated, importantTokens } from "./text.js";

const REPORT_MD_PATH = resolve("output", "quality-report.md");
const REPORT_JSON_PATH = resolve("output", "quality-report.json");

// 발행 직전 payload를 검사해서 품질 리포트와 경고 목록을 만든다.
// blocking 경고가 있으면 발행은 되돌리지 않지만 run.js가 exit code 1로 종료해
// CI에서 바로 보이게 한다.
export function inspectPayload(payload) {
  const warnings = [];
  const allItems = Object.values(payload.categories).flat();

  // 1) 구성 검사
  const headlineCategories = payload.headlines.map((i) => i.category);
  if (payload.headlines.length !== CATEGORIES.length) {
    warnings.push({ level: "block", message: `헤드라인이 ${payload.headlines.length}개입니다 (목표 ${CATEGORIES.length}개).` });
  }
  for (const category of CATEGORIES) {
    const count = (payload.categories[category.id] || []).length;
    if (count < ITEMS_PER_CATEGORY) {
      warnings.push({ level: "block", message: `${category.label} 카테고리가 ${count}개입니다 (최소 ${ITEMS_PER_CATEGORY}개).` });
    }
    if (!headlineCategories.includes(category.id)) {
      warnings.push({ level: "block", message: `헤드라인에 ${category.label} 대표 기사가 없습니다.` });
    }
  }

  // 2) 헤드라인 중복(같은 인물/사건) 검사
  for (let i = 0; i < payload.headlines.length; i += 1) {
    for (let j = i + 1; j < payload.headlines.length; j += 1) {
      if (isSimilarIssue(payload.headlines[i], payload.headlines[j])) {
        warnings.push({ level: "warn", message: `헤드라인 중복 의심: "${payload.headlines[i].title}" / "${payload.headlines[j].title}"` });
      }
    }
  }

  // 3) 문장 품질 지표
  const quality = { total: allItems.length, emptySummary: 0, truncated: 0, fragment: 0, runOn: 0, caption: 0, titleMismatch: 0 };
  const mismatched = [];
  for (const item of allItems) {
    if (!item.summary) quality.emptySummary += 1;
    const textsToCheck = [item.title, item.summary, item.why, ...(item.points || [])].filter(Boolean);
    if (textsToCheck.some(isTruncated)) quality.truncated += 1;
    if (item.summary && hasLeadingFragment(item.summary)) quality.fragment += 1;
    if (item.summary && hasRunOn(item.summary)) quality.runOn += 1;
    if (item.summary && isPhotoCaption(item.summary)) quality.caption += 1;
    if (item.summary && isTitleMismatch(item)) {
      quality.titleMismatch += 1;
      mismatched.push(item);
    }
  }
  for (const item of mismatched) {
    warnings.push({ level: "warn", message: `제목-요약 불일치 의심: "${item.title}" / 요약: "${item.summary.slice(0, 40)}..."` });
  }

  // 3-1) 주목도 분포: 90점대 쏠림이면 점수가 의미를 잃는다.
  const heats = allItems.map((i) => i.heat || 0);
  quality.heat = {
    avg: Number((heats.reduce((s, h) => s + h, 0) / Math.max(1, heats.length)).toFixed(1)),
    max: Math.max(...heats),
    min: Math.min(...heats),
    ge90: heats.filter((h) => h >= 90).length,
    ge75: heats.filter((h) => h >= 75).length,
    lt60: heats.filter((h) => h < 60).length
  };
  if (quality.heat.ge90 > 8) {
    warnings.push({ level: "warn", message: `주목도 90점 이상이 ${quality.heat.ge90}개입니다. 점수가 상단에 쏠려 있습니다 (목표 8개 이하).` });
  }
  if (quality.heat.max - quality.heat.min < 20) {
    warnings.push({ level: "warn", message: `주목도 분포 폭이 ${quality.heat.max - quality.heat.min}점으로 좁습니다.` });
  }

  // 3-2) 민감도 분포.
  quality.sensitivity = { "낮음": 0, "중간": 0, "높음": 0 };
  for (const item of allItems) {
    if (item.sensitivity in quality.sensitivity) quality.sensitivity[item.sensitivity] += 1;
  }
  if (quality.truncated > 0) warnings.push({ level: "block", message: `말줄임(...)으로 끝나는 제목/요약이 ${quality.truncated}개 있습니다.` });
  if (quality.caption > 0) warnings.push({ level: "warn", message: `사진 캡션으로 의심되는 요약이 ${quality.caption}개 있습니다.` });
  if (quality.fragment > 0) warnings.push({ level: "warn", message: `앞이 잘린 요약이 ${quality.fragment}개 있습니다.` });
  if (quality.runOn > 0) warnings.push({ level: "warn", message: `문장이 붙은 요약이 ${quality.runOn}개 있습니다.` });
  const emptyRate = quality.total ? quality.emptySummary / quality.total : 0;
  if (emptyRate > 0.4) warnings.push({ level: "warn", message: `빈 요약 비율이 ${(emptyRate * 100).toFixed(0)}%입니다.` });

  // 4) 헤드라인 요약/민감도 검사
  for (const item of payload.headlines) {
    if (!item.summary) warnings.push({ level: "warn", message: `헤드라인 요약 없음: "${item.title}"` });
    if (item.sensitivity === "높음") warnings.push({ level: "warn", message: `민감도 높은 헤드라인: "${item.title}"` });
  }

  // 5) 카테고리 내부 중복 검사
  let dupSuspects = 0;
  for (const [categoryId, items] of Object.entries(payload.categories)) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        if (isSimilarIssue(items[i], items[j])) {
          dupSuspects += 1;
          warnings.push({ level: "warn", message: `${CATEGORY_LABELS[categoryId]} 중복 의심: "${items[i].title}" / "${items[j].title}"` });
        }
      }
    }
  }

  return { warnings, quality: { ...quality, dupSuspects, emptySummaryRate: Number(emptyRate.toFixed(3)) } };
}

export async function writeReport(payload, inspection, runMeta) {
  const { warnings, quality } = inspection;
  const blockers = warnings.filter((w) => w.level === "block");

  const md = [
    "# 어제 이슈 품질 리포트",
    "",
    `- 생성 시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
    `- 데이터 날짜: ${payload.date}`,
    `- 수집원: ${payload.source}`,
    `- 수집 ${runMeta.collected}건 → 중복 제거 후 ${runMeta.deduped}건 → 발행 ${quality.total}건`,
    "",
    "## 품질 지표",
    "",
    `- 빈 요약: ${quality.emptySummary}/${quality.total} (${(quality.emptySummaryRate * 100).toFixed(0)}%)`,
    `- 말줄임 잘림: ${quality.truncated}`,
    `- 앞 잘린 파편: ${quality.fragment}`,
    `- 문장 붙음(run-on): ${quality.runOn}`,
    `- 사진 캡션 의심: ${quality.caption}`,
    `- 제목-요약 불일치 의심: ${quality.titleMismatch}`,
    `- 중복 의심 쌍: ${quality.dupSuspects}`,
    "",
    "## 주목도 분포",
    "",
    `- 평균 ${quality.heat.avg} / 최고 ${quality.heat.max} / 최저 ${quality.heat.min}`,
    `- 90점 이상: ${quality.heat.ge90}개 (목표 8개 이하)`,
    `- 75점 이상: ${quality.heat.ge75}개`,
    `- 60점 미만: ${quality.heat.lt60}개`,
    "",
    "## 민감도 분포",
    "",
    `- 낮음 ${quality.sensitivity["낮음"]} / 중간 ${quality.sensitivity["중간"]} / 높음 ${quality.sensitivity["높음"]}`,
    `- 헤드라인 내 높음: ${payload.headlines.filter((i) => i.sensitivity === "높음").length}개`,
    "",
    "## 지역/행사성 판단",
    "",
    ...regionalJudgementLines(payload),
    "",
    `## 검수 결과 (${blockers.length > 0 ? "차단 경고 있음" : "통과"})`,
    "",
    ...(warnings.length
      ? warnings.map((w) => `- [${w.level === "block" ? "차단" : "주의"}] ${w.message}`)
      : ["- 문제 없음"]),
    "",
    "## 헤드라인",
    "",
    ...payload.headlines.map((item, index) => [
      `### ${index + 1}. ${CATEGORY_LABELS[item.category]} | ${item.title}`,
      "",
      `- 요약: ${item.summary || "(요약 없음)"}`,
      `- 출처: ${item.sourceName} · 주목도 ${item.heat} · 민감도 ${item.sensitivity}`,
      `- 원문: ${item.sourceUrl}`,
      ""
    ].join("\n")),
    "## 카테고리별 발행 목록",
    "",
    ...Object.entries(payload.categories).flatMap(([categoryId, items]) => [
      `### ${CATEGORY_LABELS[categoryId]}`,
      "",
      ...items.map((item, index) =>
        `${index + 1}. [${item.heat}·${item.sensitivity}] ${item.title} (${item.sourceName})${item.summary ? "" : " ※요약 없음"}`),
      ""
    ])
  ].join("\n");

  await mkdir(dirname(REPORT_MD_PATH), { recursive: true });
  await writeFile(REPORT_MD_PATH, `${md}\n`, "utf8");
  await writeFile(REPORT_JSON_PATH, `${JSON.stringify({ date: payload.date, quality, warnings }, null, 2)}\n`, "utf8");

  return { mdPath: REPORT_MD_PATH, jsonPath: REPORT_JSON_PATH, blockers: blockers.length, warnings: warnings.length };
}

// 제목의 핵심 토큰이 요약에 2개 미만으로 반영되면 배경 설명 의심으로 본다.
// (제목 토큰이 2개 이하인 짧은 제목은 1개만 겹쳐도 정합으로 인정)
function isTitleMismatch(item) {
  const titleTokens = importantTokens(item.title, 14);
  if (titleTokens.length === 0) return false;
  const matched = titleTokens.filter((t) => item.summary.includes(t)).length;
  return titleTokens.length <= 2 ? matched < 1 : matched < 2;
}

// 발행된 기사 중 행사성 감점/전국성 가점이 작동한 항목과 그 사유를 보여준다.
// "지역이라서 버림"이 아니라 "전국 대화 가능성으로 판단"이 동작하는지 확인하는 용도.
function regionalJudgementLines(payload) {
  const judged = Object.values(payload.categories).flat()
    .filter((item) => {
      const s = item.scoreSignals || {};
      return (s.rawPenalty || 0) > 0 || (s.national || 0) > 0;
    })
    .map((item) => {
      const s = item.scoreSignals || {};
      const parts = [];
      if (s.national > 0) parts.push(`전국성 가점 +${s.national}`);
      if (s.rawPenalty > 0) parts.push(`행사성 감점 -${s.rawPenalty}${s.penalty < s.rawPenalty ? ` (상쇄 후 -${s.penalty})` : ""}`);
      return `- [${CATEGORY_LABELS[item.category]}] ${item.title} → ${parts.join(", ")} → 유지`;
    });

  return judged.length ? judged : ["- 해당 항목 없음 (발행 기사 중 행사성 감점/전국성 가점 작동 사례 없음)"];
}
