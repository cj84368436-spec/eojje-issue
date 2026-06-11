// 주목도(heat)와 민감도 계산.
//
// 선별 원칙: "지역성"이 아니라 "전국적 관심도·대화 가능성·사회적 파급력"으로 판단한다.
// 지역 행사/축제 뉴스라도 전국 신호(유명 인물, 대형 행사, 사회적 파급)가 있으면
// 감점을 상쇄하고 가점을 받는다. 반대로 보도자료성/인사·동정/일정 안내는 강하게 감점한다.

// ---- 민감도 ----
// 높음: 범죄 단정, 사망/재난, 성범죄, 미성년자, 자살, 명예훼손 위험
const HIGH_SENSITIVITY = [
  "사망", "숨진", "숨져", "살인", "살해", "성폭행", "성범죄", "성추행", "성희롱",
  "자살", "극단적 선택", "투신", "마약", "시신", "학대", "미성년", "참사", "붕괴 사고", "폭발 사고"
];
// 중간: 정치 공방, 재판/수사, 실명 논란, 연예 사생활, 사회적 갈등
const MID_SENSITIVITY = [
  "특검", "탄핵", "계엄", "구속", "기소", "혐의", "수사", "압수수색", "고발", "고소",
  "재판", "판결", "선고", "공방", "반발", "책임론", "사퇴", "경질", "의혹", "내홍",
  "논란", "갑질", "폭행", "사기", "이혼", "결별", "열애", "불화", "루머", "폭로",
  "명예훼손", "파업", "시위", "집회", "갈등", "맞고소", "설전",
  "비판", "맹공", "직격", "규탄", "공세", "반격"
];

// ---- 대화 소재성 ----
const CONVERSATION_WORDS = [
  "대통령", "국회", "선거", "특검", "탄핵",
  "물가", "금리", "환율", "코스피", "부동산", "전세", "대출", "월급", "연봉",
  "사고", "재판", "날씨", "폭염", "한파", "지하철", "학교", "수능",
  "아이돌", "드라마", "예능", "콘서트", "빌보드", "신곡", "시청률", "결혼"
];

// ---- 전국적 관심 신호 (지역/행사성 감점을 상쇄) ----
// 1) 대중 인지도 높은 인물/콘텐츠
const NATIONAL_FIGURE_SIGNALS = [
  "BTS", "방탄소년단", "K팝", "케이팝", "K-팝", "아이돌", "한류", "빌보드",
  "유명 배우", "톱스타", "월드투어", "내한", "감독", "작가", "노벨", "칸 영화제"
];
// 2) 공공 관심도 높은 기관/행사
const NATIONAL_EVENT_SIGNALS = [
  "영화제", "박스오피스", "국가유산", "문화재", "청와대", "국립", "유네스코",
  "세계적", "국제", "전국", "올림픽", "월드컵", "엑스포", "비엔날레", "한강", "고궁"
];
// 3) 사회적 파급 (숙박/교통/지역경제 등 생활에 닿는 여파)
const RIPPLE_SIGNALS = [
  "숙박", "바가지", "예약 취소", "교통 혼잡", "교통 통제", "관광객", "외국인",
  "매진", "암표", "인파", "민원", "지역경제", "경제효과", "품절", "오픈런", "북새통"
];

// ---- 보도자료성 / 인사·동정 / 일정 안내 (강한 감점) ----
const PRESS_RELEASE_WORDS = [
  "업무협약", "협약 체결", "MOU", "수출상담회", "기념식", "발대식", "간담회",
  "포럼 개최", "캠페인", "홍보대사", "위촉", "표창", "수상했다", "선포식", "착공식",
  "준공식", "개소식", "모집한다", "신청 접수", "설명회", "취임식", "이취임",
  "인사 단행", "임원 인사", "정기 인사", "부고", "별세",
  "직무연수", "연수 개최", "출범식", "역량 강화", "워크숍",
  "인식개선", "브랜드평판", "사회공헌", "봉사활동", "기부금 전달", "공로패", "성과 공유"
];

const LOCAL_GOV_PATTERN = /[가-힣]{2,5}(시청|군청|구청|시의회|군의회|구의회|군수|구청장|부시장|읍|면사무소|교육청|도청|교육지원청)/;
// 인사·동정: "OO장에 홍길동(씨)" / "신임 OO장에 ..." 패턴.
const APPOINTMENT_PATTERN = /(^|\s)(신임\s*)?[가-힣]{2,14}(장|이사장|사장|회장|대표|위원장|총장|청장)에\s+[가-힣]{2,4}(씨|님)?(\s|$)/;
// 단순 일정 안내: "~ 개최/열린다/개막" 으로 끝나는 행사 공지형 제목.
const SCHEDULE_TITLE_PATTERN = /(축제|행사|페스티벌|박람회|대회|전시회?|음악회|발표회)[^,]{0,14}(개최|열린다|열려|개막)$/;
// 기관 공지형: "OO문화재단, ~ 모금/모집/공모 ..." 같은 보도자료 제목.
const INSTITUTION_NOTICE_PATTERN = /[가-힣]{2,10}(문화재단|문화원|진흥원|재단|공사|협회|위원회)[^.]{0,24}(모금|모집|공모|개시|운영|추진|선정|지원사업)/;
// 지자체 주어형: "포천시, ~" 처럼 지자체가 주어인 홍보성 제목.
const LOCAL_LEAD_PATTERN = /^[가-힣]{2,5}(시|군|구|도)(청)?,/;

// 기관 일정성(과정) 뉴스: 만남/논의/촉구 자체가 핵심인 기사.
// 결과(결정·판결·사퇴 등)가 없으면 "오늘 대화 소재"가 되기 어려우므로 감점한다.
const PROCESS_TITLE_PATTERN = /(만나|만난|회동|면담|접견|당부|촉구|논의|협의|점검|주재|참석|간담|토론회|세미나|머리를 맞)/;
const OUTCOME_PATTERN = /(결정|확정|판결|선고|사퇴|사의|해임|경질|통과|부결|구속|기소|취소|타결|합의했|발표|급등|급락|하락|상승|1위|돌파|무산|연기)/;

// 문화/연예 화제성 신호: 유명 인물·흥행·논란·팬덤·사회적 파급.
// 이 신호가 하나도 없는 문화/연예 기사는 대화 소재가 약하므로 하위로 보낸다.
const FAME_SIGNALS = /(1위|박스오피스|시청률|차트|빌보드|흥행|매진|신기록|역대|논란|화제|팬|컴백|열애|결별|결혼|수상|시상식|월드투어|내한|BTS|K팝|케이팝|아이돌|오스카|칸|넷플릭스|밀리언|역주행|민원|인파|품절|오픈런)/;

export function scoreNews(items) {
  const scored = items.map((item) => {
    const text = `${item.title} ${item.description || ""}`;

    const cluster = Math.min(24, (item.clusterSize - 1) * 8);          // 여러 매체 반복 보도
    const recency = recencyScore(item.publishedAt);                     // 최신성
    const conversation = hitScore(text, CONVERSATION_WORDS, 5, 20);     // 대화 소재성
    const fit = Math.min(20, item.categoryFit * 2);                     // 카테고리 적합성
    const source = item.sourceTier === 1 ? 10 : item.sourceTier === 2 ? 6 : 0;

    // 전국적 관심 신호: 가점 + 지역/행사성 감점 상쇄에 사용.
    const national = nationalInterestScore(text);
    let rawPenalty = lowInterestPenalty(text, item.title);

    // 결과 없는 일정성(과정) 뉴스 감점: "만나/논의/촉구"만 있고 결정·판결 등 결과가 없는 기사.
    if (PROCESS_TITLE_PATTERN.test(item.title) && !OUTCOME_PATTERN.test(item.title)) {
      rawPenalty += 16;
    }
    // 문화/연예는 화제성 신호(유명 인물·흥행·논란·팬덤·파급)가 없으면 하위로.
    if ((item.category === "culture" || item.category === "entertainment") && !FAME_SIGNALS.test(text)) {
      rawPenalty += 15;
    }

    const penalty = Math.max(0, rawPenalty - national);                 // 전국 신호가 감점을 상쇄

    return {
      ...item,
      sensitivity: sensitivityOf(text),
      heat: cluster + recency + conversation + fit + source + Math.min(12, national) - penalty,
      scoreSignals: { cluster, recency, conversation, fit, source, national, rawPenalty, penalty }
    };
  });

  return scored;
}

// 최종 발행 후보(25개) 안에서 상대 점수로 재스케일링한다.
// 90~100 최상위 / 75~89 많이 이야기될 이슈 / 60~74 참고 이슈.
// 전부 90점대로 몰리면 점수가 의미를 잃기 때문에 범위를 넓게 쓴다.
export function rescaleHeat({ categories, headlines }) {
  const unique = [...new Map(
    [...Object.values(categories).flat(), ...headlines].map((item) => [item.id, item])
  ).values()];

  const sorted = [...unique].sort((a, b) => b.heat - a.heat);
  const n = sorted.length;
  const headlineIds = new Set(headlines.map((item) => item.id));

  sorted.forEach((item, index) => {
    const ratio = n > 1 ? index / (n - 1) : 0;     // 0 = 최상위
    let heat = Math.round(96 - ratio * 38);        // 96 ~ 58
    if (headlineIds.has(item.id)) heat = Math.max(heat, 86);
    item.heat = heat;
  });
}

function nationalInterestScore(text) {
  const figure = hitScore(text, NATIONAL_FIGURE_SIGNALS, 8, 16);
  const event = hitScore(text, NATIONAL_EVENT_SIGNALS, 6, 12);
  const ripple = hitScore(text, RIPPLE_SIGNALS, 8, 16);
  return Math.min(28, figure + event + ripple);
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
  const hits = words.filter((w) => text.includes(w)).length;
  return Math.min(max, hits * per);
}

function lowInterestPenalty(text, title) {
  const cleanedTitle = String(title).trim();
  let penalty = hitScore(text, PRESS_RELEASE_WORDS, 14, 42);
  if (LOCAL_GOV_PATTERN.test(text)) penalty += 14;
  if (APPOINTMENT_PATTERN.test(cleanedTitle)) penalty += 34;
  if (SCHEDULE_TITLE_PATTERN.test(cleanedTitle)) penalty += 22;
  if (INSTITUTION_NOTICE_PATTERN.test(cleanedTitle)) penalty += 26;
  if (LOCAL_LEAD_PATTERN.test(cleanedTitle)) penalty += 14;
  return Math.min(70, penalty);
}

function sensitivityOf(text) {
  if (HIGH_SENSITIVITY.some((w) => text.includes(w))) return "높음";
  if (MID_SENSITIVITY.some((w) => text.includes(w))) return "중간";
  return "낮음";
}
