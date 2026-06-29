export function cleanText(raw = "") {
  return decodeHtmlEntities(String(raw))
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]{2,24}=[^\]]{2,40}\]/g, " ")
    .replace(/\([가-힣]{2,8}=[가-힣A-Za-z0-9]{2,16}\)\s*([가-힣]{2,4}\s*기자\s*=?\s*)?/g, " ")
    .replace(/[가-힣]{2,4}\s?기자\s?=\s?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  lt: "<",
  nbsp: " ",
  quot: '"'
};

function decodeHtmlEntities(value) {
  let decoded = value;
  for (let pass = 0; pass < 2; pass += 1) {
    const next = decoded.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));?/gi, (entity, decimal, hex, named) => {
      if (decimal) return safeCodePoint(Number(decimal), entity);
      if (hex) return safeCodePoint(Number.parseInt(hex, 16), entity);
      return HTML_ENTITIES[named.toLowerCase()] ?? entity;
    });
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function safeCodePoint(code, fallback) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback;
  }
}

export function normalizePublicText(raw = "") {
  return normalizeKoreanSpacing(
    cleanText(raw)
      .replace(/^▶\s*/, "")
      .replace(/^글 싣는 순서.*?\(계속\)\s*/, "")
      .replace(/^\[[^\]]{2,20}(?:앵커|기자)\]\s*/i, "")
      .replace(/^(?:그런데|하지만|그러나)\s+/, "")
      .replace(/^\[[^\]]*(?:사진|촬영|제공)[^\]]*\]\s*/i, "")
      .replace(/^\((?:사진|촬영|제공)\s*[=:][^)]+\)\s*/i, "")
      .replace(/^(?:사진|촬영|제공)\s*[=:]\s*[^.!?]*(?:[.!?]\s*|$)/i, "")
      .replace(/\s*\((?:사진|촬영|제공)\s*[=:][^)]+\)\s*$/i, "")
      .replace(/(?<!\d)([.!?。])(?=[가-힣A-Z0-9])/g, "$1 ")
  );
}

function normalizeKoreanSpacing(value) {
  return value
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/·\s+/g, "·")
    .replace(/([가-힣A-Za-z0-9)])\s+(은|는|이|가|을|를|의|에|에서|에게|께서|와|과|도|만|로|으로|부터|까지|보다|처럼)(?=\s|[,.!?]|$)/g, "$1$2")
    .replace(/([가-힣])\s+(했다|됐다|한다|된다|하였다|되었다)(?=\s|[,.!?]|$)/g, "$1$2")
    .replace(/교육\s+(부|청|학술정보원)/g, "교육$1")
    .replace(/관광\s+(객|지)/g, "관광$1")
    .replace(/관광\s*公(?:사)?/g, "관광공사")
    .replace(/관광\s+공사/g, "관광공사")
    .replace(/여행\s+사(?=\s|[,(])/g, "여행사")
    .replace(/한국\s+교육\s+시설안전원/g, "한국교육시설안전원")
    .replace(/한국\s+문학/g, "한국문학")
    .replace(/출판\s+사/g, "출판사")
    .replace(/기업\s+들/g, "기업들")
    .replace(/국회\s+의장/g, "국회의장")
    .replace(/(^|[\s(\[])((?:["']))\s+(?=[가-힣])/g, "$1$2")
    .replace(/개봉\s+한/g, "개봉한")
    .replace(/문학\s+동네/g, "문학동네")
    .replace(/대\s+법원\s+서/g, "대법원서")
    .replace(/에는이\s+같은/g, "에는 이 같은")
    .replace(/해야한다/g, "해야 한다")
    .replace(/하기로했다/g, "하기로 했다")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasHtmlEntity(text = "") {
  return /&(?:#\d+;?|#x[\da-f]+;?|(?:amp|apos|gt|hellip|lt|nbsp|quot);?)/i.test(String(text));
}

export function cleanTitle(raw = "") {
  return normalizeKoreanSpacing(cleanText(raw)
    .replace(/李대통령/g, "이 대통령")
    .replace(/^\s*(\[[^\]]{1,12}\]|<[^>]{1,12}>)\s*/g, "")
    .replace(/\s*(\[[^\]]{1,12}\]|<[^>]{1,12}>)\s*$/g, "")
    .replace(/^\s*(단독|속보|종합|영상|사진|르포)\s*[:\]]?\s*/g, "")
    .replace(/\s*[|·-]\s*[가-힣A-Za-z0-9 ]{2,14}(일보|신문|뉴스|경제|데일리|타임스|TV)\s*$/g, "")
    .replace(/[,;:·]+$/g, "")
    .trim());
}

export function isTruncated(text = "") {
  return /(\.{2,}|…)\s*$/.test(String(text).trim());
}

export function splitSentences(text = "") {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  return cleaned
    .replace(/([.!?。]|다\.|요\.|음\.|임\.)\s+/g, "$1|")
    .split("|")
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 10);
}

export function isPhotoCaption(text = "") {
  const value = String(text);
  return /^사진\s*[=:]/.test(value)
    || /^\[?\s*사진/.test(value)
    || /^\[?\s*[가-힣]{2,4}\s+기자\]?/.test(value)
    || /^\[?[가-힣A-Za-z0-9가-힣 ]{2,24}\s+제공\]?/.test(value)
    || /(제보된 영상입니다|영상으로 전해졌습니다)/.test(value)
    || (/모습(이다)?\s*[.!]?$/.test(value) && /(사진|촬영|포즈|기념|참석자)/.test(value));
}

const FRAGMENT_STARTS = [
  "것이다", "때문에", "따라", "관련해", "대해", "또한", "그리고", "하지만", "그러나",
  "그런데", "이와", "이에", "그는", "그녀는", "으로", "라고", "면서", "거나", "까지"
];

const LEADING_CLAUSE_FRAGMENTS = [
  "제치고", "따라", "통해", "위해", "두고", "관련해", "대해", "이어", "반면", "또한", "그러나", "하지만"
];

const LEADING_CASE_FRAGMENTS = /^(?:혐의|의혹|논란|영향|이유|문제|과정|수사|재판|협상|논의)(?:로|으로|에서)(?:\s|,)/;

export function hasLeadingFragment(text = "") {
  const value = String(text).trim();
  return FRAGMENT_STARTS.some((word) => value.startsWith(word))
    || LEADING_CLAUSE_FRAGMENTS.some((word) => value.startsWith(`${word} `) || value.startsWith(`${word},`))
    || LEADING_CASE_FRAGMENTS.test(value)
    || /^[,.:;!?※▶]/.test(value);
}

export function repairLeadingFragment(text = "") {
  const value = normalizePublicText(text);
  if (!hasLeadingFragment(value)) return value;
  const subject = value.match(/(?:^|\s)([^\s,]{2,24}[은는이가])\s/);
  if (!subject || subject.index === undefined) return value;
  return value.slice(subject.index + (subject[0].startsWith(" ") ? 1 : 0));
}

const FRAGMENT_ENDS = ["에서", "으로", "하며", "하고", "하는", "있는", "통해", "위해", "관련해", "대해", "따라", "면서"];

export function hasTrailingFragment(text = "") {
  const value = String(text).replace(/[.!?]$/, "").trim();
  return FRAGMENT_ENDS.some((word) => value.endsWith(word));
}

export function hasRunOn(text = "") {
  const body = String(text).replace(/[.!?]$/, "");
  return /(했다|됐다|였다|이다|있다|없다|입니다|밝혔다|전했다|나왔다|이어졌다|올랐다)(?:\s+|["'“”‘’])[가-힣A-Z0-9]/.test(body)
    || /\d+\s*넘겨(?=[가-힣])/.test(body)
    || /^[^.!?]{10,80}…[^.!?]{5,80}\d{1,2}일/.test(body);
}

export function isGoodSentence(text = "") {
  const value = cleanText(text);
  if (value.length < 18 || value.length > 160) return false;
  if (isTruncated(value)) return false;
  if (isPhotoCaption(value)) return false;
  if (hasLeadingFragment(value)) return false;
  if (hasTrailingFragment(value)) return false;
  if (hasRunOn(value)) return false;
  if (!hasBalancedQuotes(value)) return false;
  if (!hasSentenceEnding(value)) return false;
  if (!/[가-힣]/.test(value)) return false;
  return true;
}

export function hasBalancedQuotes(text = "") {
  const value = String(text);
  const pairs = [["\"", "\""], ["'", "'"], ["“", "”"], ["‘", "’"]];
  return pairs.every(([open, close]) => {
    if (open === close) return value.split(open).length % 2 === 1;
    return value.split(open).length === value.split(close).length;
  });
}

export function hasSentenceEnding(text = "") {
  const value = String(text).trim();
  return /[.!?。][\"'”’)]?$/.test(value)
    || /(다|요|죠|함|됨|중|예정)[\"'”’)]?$/.test(value);
}

export function numericClaims(text = "") {
  const values = String(text).match(/\d+(?:[,.]\d+)*(?:%|천|만|억|조|명|개|건|회|배|원|위|년|개월|월|일|시간|분)|\d{2,}(?:[,.]\d+)*/g) || [];
  return [...new Set(values)]
    .map((value) => value.replace(/,/g, ""));
}

export function includesNumericClaim(claims, expected) {
  if (claims.includes(expected)) return true;
  const expectedMatch = String(expected).match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!expectedMatch || expectedMatch[2]) return false;
  return claims.some((claim) => String(claim).match(/^(\d+(?:\.\d+)?)/)?.[1] === expectedMatch[1]);
}

const STOPWORDS = new Set([
  "오늘", "어제", "뉴스", "이슈", "이번", "최근", "기자", "단독", "종합", "네이버",
  "검색", "주목", "발표", "공개", "확인", "관련", "통해", "에서", "으로", "했다",
  "됐다", "한다", "대한", "위해", "가운데", "진행", "모습", "사진", "영상"
]);

export function importantTokens(text = "", limit = 18) {
  return [...new Set(
    cleanText(text)
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((token) => canonicalToken(token.trim()))
      .filter((token) => token.length >= 2 && token.length <= 12)
      .filter((token) => !STOPWORDS.has(token))
      .filter((token) => !/^\d+$/.test(token))
  )].slice(0, limit);
}

function canonicalToken(token) {
  if (token === "상폐") return "상장폐지";
  return token;
}

export function overlapRatio(aTokens, bTokens) {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const bSet = new Set(bTokens);
  const overlap = aTokens.filter((token) => bSet.has(token)).length;
  return overlap / Math.min(aTokens.length, bTokens.length);
}

export function isSubstantiallySameText(a, b) {
  const aText = normalizePublicText(a).replace(/[^\p{L}\p{N}]/gu, "");
  const bText = normalizePublicText(b).replace(/[^\p{L}\p{N}]/gu, "");
  if (!aText || !bText) return false;
  if (aText.includes(bText) || bText.includes(aText)) {
    return Math.min(aText.length, bText.length) / Math.max(aText.length, bText.length) >= 0.6;
  }
  return overlapRatio(importantTokens(a, 20), importantTokens(b, 20)) >= 0.55;
}

function prefixMatch(a, b) {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 2 && long.includes(short) && long.length - short.length <= 2;
}

export function isSimilarIssue(a, b) {
  const aTitle = importantTokens(a.title, 14);
  const bTitle = importantTokens(b.title, 14);
  if (overlapRatio(aTitle, bTitle) >= 0.5) return true;

  const sharedTokens = aTitle.filter((token) => bTitle.some((other) => prefixMatch(token, other)));
  if (sharedTokens.length >= 2 && sharedTokens.some((token) => token.length >= 4)) return true;
  if (sharedTokens.length >= 3 && sharedTokens.length / Math.min(aTitle.length, bTitle.length) >= 0.4) return true;

  const bTitleSet = new Set(bTitle);
  if (aTitle.some((token) => token.length >= 6 && bTitleSet.has(token))) return true;

  const aAll = importantTokens(`${a.title} ${a.summary || ""}`, 20);
  const bAll = importantTokens(`${b.title} ${b.summary || ""}`, 20);
  const bSet = new Set(bAll);
  const shared = aAll.filter((token) => bSet.has(token)).length;
  return shared >= 4 || overlapRatio(aAll, bAll) >= 0.55;
}
