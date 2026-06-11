import { splitSentences, isGoodSentence, cleanText, importantTokens, overlapRatio } from "./text.js";

// 추출형 요약을 카드뉴스 블록으로 구조화한다.
// - summary("무슨 일?"): 제목이 제기한 사건에 직접 답하는 완결 문장 1개.
//   완결 문장이라도 제목 키워드와 겹치지 않으면 배경 설명으로 보고 쓰지 않는다.
// - why("왜 중요해?"): 배경/이유/파장 문장. 제목과 무관한 일반론은 제외.
// - points("핵심 포인트"): 보조 문장 최대 3개.
// 제목에 답하는 문장이 없으면 요약을 비운다. 빈 요약 기사는 선별에서 후순위로 밀린다.

const WHY_MARKERS = [
  "때문", "따라", "배경", "거론", "영향", "전망", "우려", "기대", "갈등", "논란",
  "예정", "계획", "분석", "평가", "지적", "이유", "관측", "가능성", "파장", "주목",
  "조치", "화제", "여파", "맞물려", "풀이", "해석"
];

// "보통/일반적으로 ~하는 경우가 있다" 류의 일반론·관행 설명 신호.
const GENERIC_BACKGROUND = [
  "경우가 있다", "경우가 많다", "것이 일반적", "흔히", "보통", "통상",
  "관행", "대개", "일쑤", "곤 한다", "기도 한다"
];

// 제목의 행위/주장 유형. 제목에 key가 있으면 요약 문장은 같은 그룹의 stem을 담아
// 실제로 그 주장에 답해야 한다. (예: 제목 "해명" → 요약에 해명/부인/일축 내용 필수)
const ACTION_GROUPS = [
  { keys: ["해명", "반박", "부인", "선긋", "일축"], stems: ["해명", "반박", "부인", "아니라", "아니다", "일축", "선을 그", "설명했"] },
  { keys: ["판결", "선고", "승소", "패소", "무죄", "유죄"], stems: ["판결", "선고", "승소", "패소", "무죄", "유죄", "확정"] },
  { keys: ["사퇴", "사의", "사임"], stems: ["사퇴", "사의", "사임", "물러나", "사직"] },
  { keys: ["취소"], stems: ["취소"] },
  { keys: ["확정"], stems: ["확정", "결정", "하기로"] },
  { keys: ["발표", "공개", "공식화"], stems: ["발표", "공개", "밝혔", "공식", "내놨"] },
  { keys: ["출연", "컴백", "개봉", "발매", "데뷔"], stems: ["출연", "컴백", "개봉", "발매", "데뷔", "돌아온", "돌아왔", "오른다", "공개"] },
  { keys: ["1위", "신기록", "돌파", "최고"], stems: ["1위", "기록", "돌파", "경신", "최고", "차지했"] },
  { keys: ["하락", "급락"], stems: ["하락", "급락", "떨어졌", "꺾였", "내렸", "줄었"] },
  { keys: ["상승", "급등"], stems: ["상승", "급등", "올랐", "뛰었", "치솟"] },
  { keys: ["구속", "기소", "압수수색"], stems: ["구속", "기소", "압수수색", "영장", "수사"] },
  { keys: ["사망", "숨져", "별세"], stems: ["사망", "숨졌", "숨져", "별세", "세상을 떠"] }
];

function answersTitleAction(title, sentence) {
  for (const group of ACTION_GROUPS) {
    if (!group.keys.some((k) => title.includes(k))) continue;
    if (!group.stems.some((s) => sentence.includes(s))) return false;
  }
  return true;
}

export function summarizeNews(items) {
  return items.map((item) => {
    const titleTokens = importantTokens(item.title, 14);
    const sentences = splitSentences(item.description || "");
    const good = dedupeSentences(sentences.filter(isGoodSentence));

    // 제목 키워드 겹침 + 제목의 행위/주장에 답하는지로 후보 문장을 채점한다.
    const ranked = good
      .map((sentence) => ({ sentence, score: titleAlignment(titleTokens, sentence) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked.find((c) =>
      c.score >= 2 &&
      !isGenericBackground(c.sentence) &&
      answersTitleAction(item.title, c.sentence)
    );
    const summary = best ? best.sentence : "";

    const rest = good.filter((s) => s !== summary);

    // why: 맥락 문장이되 제목과 최소 1개 키워드는 겹쳐야 한다 (무관한 일반론 차단).
    const why = rest.find((s) =>
      WHY_MARKERS.some((m) => s.includes(m)) &&
      titleAlignment(titleTokens, s) >= 1 &&
      !isGenericBackground(s)
    ) || "";

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

// 핵심 포인트: 목표 2~3개. 보조 문장 + 절 단위 팩트(숫자/결정/인물)로 채운다.
// 기사에 없는 내용은 만들지 않는다.
function buildPoints({ item, titleTokens, rest, summary, why }) {
  const used = [summary, why].filter(Boolean);
  const points = [];

  const tryAdd = (candidate) => {
    if (!candidate || points.length >= 3) return;
    if (candidate.length < 9 || candidate.length > 90) return;
    if (isGenericBackground(candidate)) return;
    // 물음표 뒤에 글이 바로 이어지면 두 문장이 붙은 깨진 절이다.
    if (/\?[가-힣A-Za-z0-9]/.test(candidate)) return;
    if (/기자\s?[=\]]/.test(candidate)) return;
    const tokens = importantTokens(candidate, 14);
    const all = [...used, ...points];
    if (all.some((s) => overlapRatio(tokens, importantTokens(s, 14)) >= 0.55)) return;
    points.push(candidate);
  };

  // 1순위: 제목과 이어지는 보조 완결 문장.
  for (const s of rest) {
    if (s === why) continue;
    if (titleAlignment(titleTokens, s) >= 1) tryAdd(s);
  }

  // 2순위: 본문 절 단위 팩트 (숫자·결정·인용 중심).
  if (points.length < 2) {
    for (const fact of extractFactClauses(item.description || "", true)) {
      tryAdd(fact);
      if (points.length >= 2) break;
    }
  }

  // 3순위: 제목 분해 팩트. 제목이 두 가지 사실을 담고 있으면
  // ("코스피 반등 마감…외국인 순매수") 요약이 다루지 않은 쪽을 불릿으로 쓴다.
  if (points.length < 2) {
    for (const segment of titleFactBullets(item.title)) {
      tryAdd(segment);
      if (points.length >= 2) break;
    }
  }

  // 4순위: 제목 겹침이 없어도 완결 보조 문장/정보성 절이면 허용 (빈 구조 방지).
  if (points.length < 2) {
    for (const s of rest) {
      if (s === why) continue;
      tryAdd(s);
      if (points.length >= 2) break;
    }
  }
  if (points.length < 2) {
    for (const clause of extractFactClauses(item.description || "", false)) {
      tryAdd(clause);
      if (points.length >= 2) break;
    }
  }

  return points;
}

// 제목을 …/·/- 단위로 분해해 독립된 팩트 조각을 얻는다.
// 첫 조각은 제목의 본체(요약이 다루는 내용)이므로 버리고, 두 번째 이후만 쓴다.
function titleFactBullets(title) {
  return String(title)
    .split(/…|\s\|\s|\s-\s|·{2,}/)
    .slice(1)
    .map((segment) => segment.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, ""))
    .filter((segment) => segment.length >= 8 && segment.length <= 45)
    .filter((segment) => /[가-힣]/.test(segment))
    .filter((segment) => ((segment.match(/["'“”‘’]/g) || []).length % 2) === 0);
}

// 쉼표/마침표로 나눈 절 중 숫자·결정·인용이 들어간 팩트 절을 골라 불릿으로 만든다.
function extractFactClauses(description, requireFactSignal = true) {
  const text = cleanText(description);
  if (!text) return [];

  const FACT_SIGNAL = /(\d|발표|결정|확정|판결|선고|취소|합의|체결|승소|패소|구속|기소|사퇴|출연|개봉|컴백|1위)/;

  let clauses = text.split(/[,.](?=\s|$)/).map((clause) => clause.trim());
  // 네이버 API가 본문을 자른 경우 마지막 절은 미완성이므로 버린다.
  if (/(\.{2,}|…)\s*$/.test(text)) clauses = clauses.slice(0, -1);

  return clauses
    .filter((clause) => !/(\.{2,}|…)\s*$/.test(clause))
    .filter((clause) => clause.length >= 12 && clause.length <= 70)
    .filter((clause) => !requireFactSignal || FACT_SIGNAL.test(clause))
    .filter((clause) => /[가-힣]/.test(clause))
    .map(normalizeClauseEnd)
    .filter(Boolean);
}

// "복지정책이 가장 높았고" → "복지정책이 가장 높았다" 처럼 연결어미를 종결형으로 다듬는다.
// 다듬을 수 없는 연결형 절은 버린다.
function normalizeClauseEnd(clause) {
  let s = clause.replace(/["'“”‘’]+$/g, "").trim();
  s = s.replace(/([았었했됐])고$/, "$1다").replace(/(이)라고$/, "$1다");
  if (/(하며|면서|는데|지만|고|이며|이고|라며|가운데|상황에서|와중에|위해|통해|따라)$/.test(s)) return "";
  if (/[이가은는을를와과의에로도]$/.test(s) && !/(보도|예정|계획|확정|취소)$/.test(s)) return "";
  return s;
}

// 제목 핵심 토큰이 문장에 몇 개 들어 있는지 센다 (부분 포함 허용: "멋진 신세계" ⊂ "'멋진 신세계' 측").
function titleAlignment(titleTokens, sentence) {
  if (titleTokens.length === 0) return 0;
  const matched = titleTokens.filter((t) => sentence.includes(t)).length;
  // 제목이 짧으면(토큰 1~2개) 1개만 겹쳐도 정합으로 본다.
  if (titleTokens.length <= 2) return matched >= 1 ? 2 : 0;
  return matched;
}

function isGenericBackground(sentence) {
  return GENERIC_BACKGROUND.some((m) => sentence.includes(m));
}

// 같은 내용을 두 번 보여주지 않도록 토큰 겹침이 큰 문장을 제거한다.
function dedupeSentences(sentences) {
  const kept = [];
  for (const sentence of sentences) {
    const tokens = importantTokens(sentence, 14);
    if (kept.some((k) => overlapRatio(tokens, importantTokens(k, 14)) >= 0.6)) continue;
    kept.push(sentence);
  }
  return kept;
}

// 해시태그용 키워드: 제목을 그대로 베끼지 않는다.
// 1) 제목의 인용 표기 고유명(작품/인물) 1개  2) 제목·본문 공통 토큰  3) 본문에만 있는 보조 토큰
function extractKeywords(item, titleTokens) {
  const body = cleanText(item.description || "");
  const rawBodyTokens = importantTokens(body, 20);
  const vocab = new Set([...titleTokens, ...rawBodyTokens]);
  const titleSet = new Set(titleTokens);

  const normalize = (t) => stripJosa(refineKeyword(t), vocab, titleSet);
  const bodyTokens = rawBodyTokens.map(normalize).filter(Boolean).filter(isGoodKeyword);
  const cleanTitleTokens = titleTokens.map(normalize).filter(Boolean).filter(isGoodKeyword);
  const bodySet = new Set(bodyTokens);

  // 제목 속 '인용 고유명' (작품명/프로그램명 등) - 짧은 명칭만, 인용 문장은 제외.
  const quoted = [...item.title.matchAll(/[''"‘’“”]([^''"‘’“”]{2,12})[''"‘’“”]/g)]
    .map((m) => m[1].trim())
    .filter((t) => t.length >= 2 && t.length <= 10 && t.split(/\s+/).length <= 2);
  const entity = quoted[0] || "";

  const notInEntity = (t) => !entity || !entity.includes(t);
  const inBoth = cleanTitleTokens.filter((t) => bodySet.has(t)).filter(notInEntity);
  const bodyOnly = bodyTokens.filter((t) => !cleanTitleTokens.includes(t)).filter(notInEntity);

  const merged = [...new Set([
    ...(entity ? [entity] : []),
    ...inBoth.slice(0, 2),
    ...bodyOnly
  ])];

  return merged.slice(0, 3);
}

const JOSA_SUFFIXES = ["에서", "으로", "에게", "이", "가", "은", "는", "을", "를", "와", "과", "의", "에", "로", "도"];

// 조사가 붙은 토큰 정리: "허남준이" → "허남준" (어간이 제목/본문에 실제로 등장할 때만 안전하게 분리).
// 어간이 어디에도 없고 본문에만 있는 조사꼴 토큰("의장은")은 버린다.
// 제목에 그대로 있는 토큰(벨기에, 겨울연가)은 명사로 보고 보존한다.
function stripJosa(token, vocab, titleSet) {
  for (const suffix of JOSA_SUFFIXES) {
    if (!token.endsWith(suffix)) continue;
    const stem = token.slice(0, token.length - suffix.length);
    if (stem.length >= 2 && vocab.has(stem)) return stem;
  }
  const singleJosa = /[이가은는을를와과의에로도]$/.test(token);
  if (singleJosa && !titleSet.has(token) && token.length >= 3) return "";
  return token;
}

// 안전하게 판단 가능한 꼬리만 다듬는다 ("서울광장서" → "서울광장").
// 단일 조사("에" 등)는 명사 일부일 수 있어 떼지 않는다 (벨기에, 겨울연가 등).
function refineKeyword(token) {
  const placeMatch = token.match(/^([가-힣]{2,}(장|원|관|역|당|궁|점))서$/);
  if (placeMatch) return placeMatch[1];
  // "급등에"/"박물관장에"처럼 행위·직책 명사 + "에"는 조사를 뗀다 (벨기에 등은 보존).
  const josaMatch = token.match(/^([가-힣]+(등|률|율|장|값|상|식))에$/);
  if (josaMatch) return josaMatch[1];
  return token;
}

// 숫자로 시작하는 수량 표현("6개월", "1호")과 동사형 토큰("계속되는", "지났더니")은 태그로 쓰지 않는다.
const VERB_LIKE = /(하는|되는|기는|리는|가는|했다|됐다|된다|한다|린다|온다|난다|었다|았다|라며|라고|이라고|면서|하고|하며|두고|더니|자마자|려고|지만|는데|넘나|의한|예치한|위한)$/;
const KEYWORD_BLACKLIST = new Set(["오는", "이번엔", "새로운", "지난해", "올해", "이날", "당시", "이번", "측은", "측이"]);

function isGoodKeyword(token) {
  return token.length >= 2
    && !/^\d/.test(token)
    && !VERB_LIKE.test(token)
    && !KEYWORD_BLACKLIST.has(token);
}
