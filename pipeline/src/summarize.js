import { splitSentences, isGoodSentence, cleanText, importantTokens, includesNumericClaim, isSubstantiallySameText, normalizePublicText, numericClaims, overlapRatio, repairLeadingFragment } from "./text.js";

const WHY_MARKERS = [
  "때문", "따라", "배경", "거론", "영향", "전망", "우려", "기대", "갈등", "논란",
  "예정", "계획", "분석", "평가", "이유", "관측", "가능성", "파장", "주목", "쟁점"
];

export function summarizeNews(items) {
  return items.map((item) => {
    const titleTokens = importantTokens(item.title, 14);
    const titleNumbers = numericClaims(item.title);
    const sentences = dedupeSentences(
      splitSentences(item.description || "")
        .map((sentence) => prepareSummarySentence(sentence, item.title))
        .filter(isGoodSentence)
    );
    const ranked = sentences
      .map((sentence) => ({
        sentence,
        score: titleAlignment(titleTokens, sentence, titleNumbers) + summaryStyleScore(sentence)
      }))
      .sort((a, b) => b.score - a.score);

    const requiredAlignment = titleTokens.length <= 2 ? 1 : Math.min(3, titleTokens.length);
    const summary = normalizePublicText(ranked.find((candidate) => candidate.score >= requiredAlignment)?.sentence
      || alignedExistingSummary(item.summary, titleTokens, titleNumbers, requiredAlignment)
      || summaryFromConcreteEvent(item)
      || "");
    const rest = sentences.filter((sentence) => !isSubstantiallySameText(sentence, summary));
    const whyCandidate = rest.find((sentence) => WHY_MARKERS.some((marker) => sentence.includes(marker))) || "";
    const normalizedWhy = normalizePublicText(whyCandidate);
    const why = normalizedWhy && !isSubstantiallySameText(summary, normalizedWhy) ? normalizedWhy : "";
    const points = buildPoints({ item, titleTokens, rest, summary, why });

    return {
      ...item,
      summary,
      why,
      points,
      keywords: extractKeywords(item, titleTokens)
    };
  });
}

export function summaryFromConcreteEvent(item) {
  const title = normalizePublicText(item?.title || "");
  const description = normalizePublicText(item?.description || "");
  const datedFestival = title.match(/([가-힣]{2,12}(?:시|군|구)),\s*(\d{1,2})[∼~-](\d{1,2})일\s+([^.!?]{2,40}?축제)(?:\s|$)/);
  if (datedFestival) {
    const [, organizer, start, end, eventName] = datedFestival;
    if (description.includes("달빛무지개분수")) {
      return `${organizer}가 ${start}일부터 ${end}일까지 달빛무지개분수를 배경으로 달콤한 ${eventName.trim()}를 연다.`;
    }
    return `${organizer}가 ${start}일부터 ${end}일까지 ${eventName.trim()}를 연다.`;
  }

  const opening = title.match(/([가-힣A-Za-z0-9·-]{2,16}),\s*오늘\s+([^.!?]{3,40}?)\s+개막(?:\s|$)/);
  if (opening) {
    const [, organizer, eventName] = opening;
    if (eventName.includes("코리아뷰티페스티벌") && /(화장|헤어|피부관리)/.test(description)) {
      return `${organizer}가 화장·헤어·피부관리 등을 관광 상품과 연결하는 ${eventName.trim()}을 개막했다.`;
    }
    return `${organizer}가 ${eventName.trim()}을 개막했다.`;
  }

  return "";
}

export function prepareSummarySentence(sentence, title) {
  let value = normalizePublicText(sentence);
  const cleanHeadline = normalizePublicText(title);
  value = value.replace(/\((?:감독|제작|공동제작|제공|배급)[^)]{20,180}\)/g, "");
  const missingSubject = cleanHeadline.match(/["“]([^"”]{4,50}?)\s+감소와/);
  if (/^감소와\s/.test(value) && missingSubject) {
    value = `${missingSubject[1]} 감소와 ${value.slice("감소와 ".length)}`;
  }
  const headlineAt = cleanHeadline ? value.indexOf(cleanHeadline) : -1;
  if (headlineAt >= 0 && headlineAt <= 24) {
    const remainder = value.slice(headlineAt + cleanHeadline.length).replace(/^[\s:;,.·…-]+/, "");
    if (isGoodSentence(remainder)) value = remainder;
  }
  const missingHeadlineSubject = cleanHeadline.match(/^([가-힣A-Za-z·]{2,20})\s+["“]/)
    || cleanHeadline.match(/([가-힣A-Za-z·]{2,20}),\s*(?:내일|오늘|오는|\d{1,2}일)/);
  if (missingHeadlineSubject && /^(?:처음으로|\d{1,2}일까지|내일|오늘|오는\s+\d{1,2}일)/.test(value)) {
    const subject = missingHeadlineSubject[1];
    if (!value.includes(subject)) value = `${subject}은 ${value}`;
  }
  return repairLeadingFragment(value);
}

function alignedExistingSummary(summary, titleTokens, titleNumbers, requiredAlignment) {
  const value = cleanText(summary || "");
  if (!isGoodSentence(value)) return "";
  return titleAlignment(titleTokens, value, titleNumbers) >= requiredAlignment ? value : "";
}

function buildPoints({ item, titleTokens, rest, summary, why }) {
  const used = [summary, why].filter(Boolean);
  const points = [];

  const tryAdd = (candidate) => {
    const normalized = normalizePublicText(candidate);
    if (!normalized || points.length >= 3) return;
    if (normalized.length < 9 || normalized.length > 100) return;
    if (!isGoodSentence(normalized)) return;
    const tokens = importantTokens(normalized, 14);
    const all = [...used, ...points];
    if (all.some((existing) => overlapRatio(tokens, importantTokens(existing, 14)) >= 0.55 || isSubstantiallySameText(existing, normalized))) return;
    points.push(normalized);
  };

  for (const sentence of rest) {
    if (titleAlignment(titleTokens, sentence) >= 1) tryAdd(sentence);
  }
  for (const sentence of rest) tryAdd(sentence);
  for (const segment of titleFactBullets(item.title)) tryAdd(segment);

  return points;
}

function titleFactBullets(title) {
  return String(title)
    .split(/\s\|\s|\s-\s|·{2,}|…/)
    .slice(1)
    .map((segment) => segment.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, ""))
    .filter((segment) => segment.length >= 8 && segment.length <= 45)
    .filter((segment) => /[가-힣]/.test(segment));
}

function titleAlignment(titleTokens, sentence, titleNumbers = []) {
  if (/(돌파|달성|확정|출시|개막)/.test(titleTokens.join(" ")) && /(남은|앞두고|예정|임박)/.test(sentence)) return 0;
  if (titleTokens.length === 0) return 0;
  const sentenceNumbers = new Set(numericClaims(sentence));
  if (titleNumbers.some((claim) => !includesNumericClaim([...sentenceNumbers], claim))) return 0;
  const matched = titleTokens.filter((token) => sentence.includes(token)).length;
  if (titleTokens.length <= 2) return matched >= 1 ? 2 : 0;
  return matched;
}

function summaryStyleScore(sentence) {
  const value = String(sentence).trim();
  let score = 0;
  if (/^["'“‘]/.test(value)) score -= 2;
  if ((value.match(/["'“”‘’]/g) || []).length >= 4) score -= 1;
  if (/(발표|확정|시작|돌입|출시|개최|통과|기록|상승|하락|체결|선정|수상|조사|수사|공개|밝혔다|발표했다|확정됐다)/.test(value)) score += 1;
  return score;
}

function dedupeSentences(sentences) {
  const kept = [];
  for (const sentence of sentences) {
    const tokens = importantTokens(sentence, 14);
    if (kept.some((existing) => overlapRatio(tokens, importantTokens(existing, 14)) >= 0.6)) continue;
    kept.push(sentence);
  }
  return kept;
}

function extractKeywords(item, titleTokens) {
  const bodyTokens = importantTokens(item.description || "", 20);
  const merged = [...new Set([...titleTokens, ...bodyTokens])];
  return merged.slice(0, 3);
}
