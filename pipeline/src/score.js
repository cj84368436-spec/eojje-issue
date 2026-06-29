const HIGH_SENSITIVITY = [
  "사망", "숨진", "숨져", "살해", "폭행", "성폭력", "성범죄", "성추행", "자살",
  "마약", "시신", "미성년", "참사", "붕괴 사고", "대형 사고"
];

const MID_SENSITIVITY = [
  "논란", "의혹", "계엄", "구속", "기소", "수사", "압수수색", "고발", "고소",
  "재판", "판결", "신고", "공방", "반발", "책임론", "사퇴", "경질", "파업",
  "갈등", "비판", "직격", "규탄", "공세", "반격"
];

const CONVERSATION_WORDS = [
  "대통령", "국회", "선거", "논란", "의혹", "물가", "금리", "환율", "코스피",
  "부동산", "전세", "대출", "상장", "공모주", "사고", "재판", "날씨", "폭염",
  "한파", "학교", "수능", "아이돌", "드라마", "예능", "콘서트", "빌보드",
  "ChatGPT", "OpenAI", "Claude", "Gemini", "Perplexity", "AI"
];

const PRESS_RELEASE_WORDS = [
  "업무협약", "MOU", "기념식", "간담회", "캠페인", "홍보대사", "워크숍", "시상식",
  "개소식", "모집한다", "신청 접수", "설명회", "취임식", "인사 단행", "팝업스토어",
  "셀카 공개", "근황 공개"
];

export function scoreNews(items) {
  return items.map((item) => {
    const text = `${item.title} ${item.description || ""}`;
    const cluster = Math.min(24, (item.clusterSize - 1) * 8);
    const topFeed = item.fromTopFeed ? 8 : 0;
    const recency = recencyScore(item.publishedAt);
    const conversation = hitScore(text, CONVERSATION_WORDS, 5, 20);
    const fit = Math.min(20, Math.max(0, item.categoryFit || 0) * 2);
    const source = item.sourceTier === 1 ? 10 : item.sourceTier === 2 ? 6 : 0;
    const penalty = lowInterestPenalty(text, item.title);

    return {
      ...item,
      sensitivity: sensitivityOf(text),
      heat: cluster + topFeed + recency + conversation + fit + source - penalty,
      scoreSignals: { cluster, topFeed, recency, conversation, fit, source, penalty }
    };
  });
}

export function rescaleHeat({ categories, headlines }) {
  const unique = [...new Map(
    [...Object.values(categories).flat(), ...headlines].map((item) => [item.id, item])
  ).values()];

  const sorted = [...unique].sort((a, b) => b.heat - a.heat);
  const n = sorted.length;
  const headlineIds = new Set(headlines.map((item) => item.id));

  sorted.forEach((item, index) => {
    const ratio = n > 1 ? index / (n - 1) : 0;
    let heat = Math.round(96 - ratio * 38);
    if (headlineIds.has(item.id)) heat = Math.max(heat, 86);
    item.heat = heat;
  });
}

function recencyScore(publishedAt) {
  const published = new Date(publishedAt).getTime();
  if (!Number.isFinite(published)) return 4;
  const hours = Math.max(0, (Date.now() - published) / 3_600_000);
  if (hours <= 6) return 20;
  if (hours <= 12) return 17;
  if (hours <= 24) return 13;
  if (hours <= 36) return 8;
  return 3;
}

function hitScore(text, words, per, max) {
  const hits = words.filter((word) => text.includes(word)).length;
  return Math.min(max, hits * per);
}

function lowInterestPenalty(text, title) {
  let penalty = hitScore(text, PRESS_RELEASE_WORDS, 12, 36);
  if (/^[가-힣]{2,5}(시|군|구),/.test(title)) penalty += 8;
  if (/(모집|접수|공모|개최 안내|참가자 모집)$/.test(title)) penalty += 18;
  return Math.min(50, penalty);
}

function sensitivityOf(text) {
  if (HIGH_SENSITIVITY.some((word) => text.includes(word))) return "높음";
  if (MID_SENSITIVITY.some((word) => text.includes(word))) return "중간";
  return "낮음";
}
