// 텍스트 정제와 문장 품질 판정.
// 원칙: 불완전한 문장을 억지로 고치지 않는다. 판정에서 떨어지면 비우고, 선별에서 후순위로 보낸다.

export function cleanText(raw = "") {
  return String(raw)
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);?/g, (_, code) => String.fromCodePoint(Number(code)))
    // 기자 바이라인 제거: "[오피니언뉴스=박정훈 기자]", "(서울=연합뉴스) 홍길동 기자 ="
    .replace(/\[[가-힣A-Za-z0-9 ]{2,16}=[^\]]{2,20}\]/g, " ")
    .replace(/\([가-힣]{2,8}=[가-힣A-Za-z0-9]{2,12}\)\s*([가-힣]{2,4}\s*기자\s*=?\s*)?/g, " ")
    .replace(/[가-힣]{2,4}\s?기자\s?=\s?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 제목 정제: 말머리/매체명 꼬리표 제거. 내용은 줄이지 않는다.
export function cleanTitle(raw = "") {
  let title = cleanText(raw)
    .replace(/^\s*(\[[^\]]{1,12}\]|【[^】]{1,12}】|<[^>]{1,12}>)\s*/g, "")
    .replace(/\s*(\[[^\]]{1,12}\]|【[^】]{1,12}】)\s*$/g, "")
    .replace(/^\s*(단독|속보|종합|영상|포토|르포)\s*[:\]]?\s*/g, "")
    .replace(/\s*[|·-]\s*[가-힣A-Za-z0-9 ]{2,14}(일보|신문|뉴스|경제|투데이|타임스|저널)\s*$/g, "")
    .trim();
  // 꼬리 구두점 정리 (말줄임표는 isTruncated에서 따로 판정한다)
  title = title.replace(/[,;:·]+$/g, "").trim();
  return title;
}

export function isTruncated(text = "") {
  return /(\.{2,}|…)\s*$/.test(String(text).trim());
}

const SENTENCE_END = /[.!?]$|[다요죠음함]\.?$/;

export function splitSentences(text = "") {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  return cleaned
    .replace(/([.!?])\s+/g, "$1|")
    .replace(/(다|요|죠)\.\s*/g, "$1.|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length >= 10);
}

// 사진 캡션 판정: "사진은 ~ 모습." 류 문장은 요약으로 쓰지 않는다.
export function isPhotoCaption(text = "") {
  const s = String(text);
  if (/^사진\s*[=은:]/.test(s)) return true;
  if (/^\[?\s*사진/.test(s)) return true;
  if (/모습(이다)?\s*[.!]?$/.test(s) && /(사진|촬영|포즈|기념|참석한|자리한)/.test(s)) return true;
  if (/(촬영했다|포즈를 취하|기념촬영)/.test(s)) return true;
  return false;
}

// 앞이 잘린 파편 판정.
const FRAGMENT_STARTS = [
  "것이다", "겁니다", "거면", "수준의", "등으로", "등을", "등이", "라며", "라고", "라는",
  "이며", "이고", "지만", "면서", "때문에", "덕분에", "따라", "관련해", "대해",
  "이에", "이를", "그는", "또", "한편", "하지만", "그러나", "그리고", "또한",
  "혐의로", "혐의를", "혐의가", "씨는", "씨가", "다고", "다는", "다며", "여기에"
];

export function hasLeadingFragment(text = "") {
  const s = String(text);
  return FRAGMENT_STARTS.some((w) => s.startsWith(w))
    || /^["'“”‘’),.·:;!?]/.test(s)
    || /^[가-힣]+['"“”‘’],\s*/.test(s);
}

// 뒤가 잘린 파편 판정 (연결어미로 끝나는 경우).
const FRAGMENT_ENDS = [
  "에서", "으로", "하며", "라고", "라는", "되는", "있는", "통해", "위해",
  "관련해", "대해", "따라", "면서", "이고", "이며", "하고", "및", "등"
];

export function hasTrailingFragment(text = "") {
  const s = String(text).replace(/[.!?]$/, "").trim();
  return FRAGMENT_ENDS.some((w) => s.endsWith(w));
}

// 두 문장이 붙은 run-on 판정.
export function hasRunOn(text = "") {
  const body = String(text).replace(/[.!?]$/, "");
  return /(했다|됐다|입니다|합니다|한다|된다|있다|없다|였다|이다)\s+[A-Z0-9가-힣]/.test(body);
}

// 요약으로 쓸 수 있는 완결 문장인지 판정.
export function isGoodSentence(text = "") {
  const s = cleanText(text);
  if (s.length < 22 || s.length > 150) return false;
  if (isTruncated(s)) return false;
  if (isPhotoCaption(s)) return false;
  if (hasLeadingFragment(s)) return false;
  if (hasTrailingFragment(s)) return false;
  if (hasRunOn(s)) return false;
  if (!SENTENCE_END.test(s)) return false;
  if (!/[가-힣]/.test(s)) return false;
  // 따옴표 짝이 안 맞으면 인용문 중간에서 잘린 파편이다 (예: 문장 끝 ~다"고 주장했다.).
  if (((s.match(/["“”]/g) || []).length % 2) === 1) return false;
  if (((s.match(/['‘’]/g) || []).length % 2) === 1) return false;
  return true;
}

const STOPWORDS = new Set([
  "오늘", "어제", "내일", "뉴스", "관련", "이슈", "이번", "최근", "기자", "단독", "종합",
  "네이버", "검색", "주목", "발표", "공개", "확인", "대해", "통해", "에서", "으로",
  "했다", "있다", "된다", "대한", "일부", "사람", "소식", "가운데", "지난", "이날",
  "위해", "함께", "대상", "가능성", "예정", "진행", "모습", "사진", "영상"
]);

// 기사 제목의 한자 약칭을 한글로 정규화한다 ("李대통령" = "이 대통령").
const HANJA_MAP = { "李": "이", "尹": "윤", "美": "미", "中": "중", "日": "일", "北": "북", "韓": "한", "與": "여", "野": "야", "靑": "청", "檢": "검" };

function normalizeHanja(text = "") {
  return String(text).replace(/[李尹美中日北韓與野靑檢]/g, (ch) => HANJA_MAP[ch] || ch);
}

export function importantTokens(text = "", limit = 18) {
  return [...new Set(
    cleanText(normalizeHanja(text))
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && w.length <= 10)
      .filter((w) => !STOPWORDS.has(w))
      .filter((w) => !/^\d+$/.test(w))
  )].slice(0, limit);
}

function prefixMatch(a, b) {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  // "할인"="할인권", "대통령"="이대통령" 처럼 포함 관계 + 길이 차이 2 이내면 같은 토큰으로 본다.
  return short.length >= 2 && long.includes(short) && long.length - short.length <= 2;
}

export function overlapRatio(aTokens, bTokens) {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const bSet = new Set(bTokens);
  const overlap = aTokens.filter((t) => bSet.has(t)).length;
  return overlap / Math.min(aTokens.length, bTokens.length);
}

// 같은 사건/인물을 다룬 기사인지 판정 (목록 다양성, 헤드라인 중복 방지에 사용).
export function isSimilarIssue(a, b) {
  const aTitle = importantTokens(a.title, 14);
  const bTitle = importantTokens(b.title, 14);
  if (overlapRatio(aTitle, bTitle) >= 0.5) return true;

  // 표현은 달라도 핵심 토큰("한은·6개월·연장" 등)이 3개 이상 겹치면 같은 사건으로 본다.
  // "할인"/"할인권"처럼 어미만 다른 토큰은 접두 일치로 같은 토큰으로 센다.
  const sharedTokens = aTitle.filter((t) => bTitle.some((b) => prefixMatch(t, b)));
  const sharedTitle = sharedTokens.length;
  if (sharedTitle >= 3 && sharedTitle / Math.min(aTitle.length, bTitle.length) >= 0.4) return true;

  // 같은 인물(직책) + 같은 행위가 겹치면 같은 사건으로 본다
  // (예: "이 대통령 ~ 응원" / "李대통령 ~ 응원 메시지").
  const PERSON_TITLES = ["대통령", "총리", "장관", "총재", "의장", "위원장", "회장"];
  if (sharedTitle >= 2 && sharedTokens.some((t) => PERSON_TITLES.some((p) => t.includes(p)))) return true;
  const bTitleSet = new Set(bTitle);

  // 6자 이상 고유명(그룹명/기관명 등)을 제목에서 공유하면 같은 주제로 본다
  // (예: "보이넥스트도어" 컴백 기사 2건이 한 카테고리에 같이 실리는 것 방지).
  if (aTitle.some((t) => t.length >= 6 && bTitleSet.has(t))) return true;

  const aAll = importantTokens(`${a.title} ${a.summary || ""}`, 20);
  const bAll = importantTokens(`${b.title} ${b.summary || ""}`, 20);
  const bSet = new Set(bAll);
  const shared = aAll.filter((t) => bSet.has(t)).length;
  return shared >= 4 || overlapRatio(aAll, bAll) >= 0.55;
}
