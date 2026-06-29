// Daily news pipeline settings.
// Category order also controls the app tab order.

export const CATEGORIES = [
  {
    id: "politics",
    label: "정치",
    queries: [
      "국회 법안 여야",
      "대통령 정부 정책",
      "정당 선거 공천",
      "외교 안보 정상회담",
      "검찰 수사 기소 정치"
    ],
    keywords: [
      "대통령", "국회", "정부", "여당", "야당", "정당", "민주당", "국민의힘", "총리", "장관",
      "의원", "선거", "공천", "정책", "검찰", "외교", "정상회담", "청문회", "개표", "법안",
      "국정감사", "여야", "정치권", "대선", "총선", "지방선거"
    ],
    negative: ["코스피", "환율", "금리", "드라마", "아이돌", "예능", "배우", "가수", "영화"]
  },
  {
    id: "economy",
    label: "경제",
    queries: [
      "코스피 증시 주가",
      "환율 금리 한국은행",
      "물가 부동산 전세",
      "기업 실적 영업이익",
      "수출 고용 경기"
    ],
    keywords: [
      "코스피", "코스닥", "증시", "주가", "환율", "금리", "기준금리", "한국은행", "물가",
      "부동산", "전세", "집값", "대출", "예금", "기업", "실적", "수출", "고용", "경기전망", "경기침체", "경기회복",
      "투자", "반도체", "자동차", "달러", "증권", "연금", "최저임금", "유가", "관세",
      "무역", "수입", "영업", "Fed", "인플레이션", "상장", "IPO", "공모", "공모주"
    ],
    negative: ["드라마", "아이돌", "예능", "배우", "결별", "콘서트", "라디오"]
  },
  {
    id: "society",
    label: "사회",
    queries: [
      "사건 사고 경찰",
      "법원 판결 재판",
      "교육 학교 정책",
      "날씨 기상 폭염",
      "의료 노동 복지"
    ],
    keywords: [
      "사건", "사고", "경찰", "검찰", "법원", "판결", "재판", "구속", "화재", "교통",
      "학교", "교육", "교사", "학생", "입시", "수능", "날씨", "폭염", "한파", "호우",
      "지진", "의료", "병원", "간호", "노동", "노조", "파업", "복지", "안전", "범죄",
      "보이스피싱", "실종", "수사", "전국", "주민", "국내", "대법원", "직원"
    ],
    negative: ["코스피", "환율", "배우", "결별", "아이돌", "컴백", "드라마", "시청률", "관세", "영업", "금리 인상"]
  },
  {
    id: "culture",
    label: "문화",
    queries: [
      "영화 개봉 박스오피스",
      "전시 공연 클래식",
      "출판 베스트셀러 문학",
      "문화재 박물관 유산",
      "여행 축제 관광"
    ],
    keywords: [
      "영화", "개봉", "박스오피스", "전시", "공연", "클래식", "뮤지컬", "연극", "미술관",
      "박물관", "문화재", "유산", "출판", "베스트셀러", "문학", "소설", "작가", "축제",
      "여행", "관광", "K콘텐츠", "웹툰", "게임", "공모전", "디자인", "건축"
    ],
    negative: ["코스피", "환율", "금리", "배우", "검찰", "국회", "선거"]
  },
  {
    id: "entertainment",
    label: "연예",
    queries: [
      "아이돌 컴백 신곡",
      "드라마 시청률 배우",
      "예능 방송 화제",
      "가수 콘서트 차트",
      "연예 소속사 발표"
    ],
    keywords: [
      "아이돌", "컴백", "신곡", "앨범", "월드투어", "드라마", "시청률", "배우", "예능", "방송",
      "가수", "콘서트", "차트", "빌보드", "소속사", "뮤직비디오", "라디오", "출연", "캐스팅",
      "걸그룹", "보이그룹", "OST", "시상식", "유튜버"
    ],
    negative: ["코스피", "환율", "금리", "한국은행", "국회", "검찰", "선거", "정당"]
  },
  {
    id: "ai",
    label: "AI",
    optional: true,
    queries: [
      "ChatGPT 업데이트 출시",
      "Claude 업데이트 출시",
      "Gemini 업데이트 출시",
      "Perplexity 업데이트 출시",
      "OpenAI Anthropic Google AI 서비스 업데이트",
      "생성형 AI 모델 API 기능 출시"
    ],
    keywords: [
      "ChatGPT", "챗GPT", "OpenAI", "오픈AI", "Claude", "클로드", "Anthropic", "앤스로픽",
      "Gemini", "제미나이", "Google AI", "구글 AI", "Perplexity", "퍼플렉시티",
      "Copilot", "코파일럿", "Grok", "xAI", "모델", "AI 에이전트", "업데이트", "출시",
      "기능", "API", "GPT", "LLM", "생성형 AI"
    ],
    negative: ["AI 반도체", "엔비디아 주가", "데이터센터 전력", "채용", "교육청", "공모전"]
  }
];

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);
export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label]));

export const ITEMS_PER_CATEGORY = 6;
export const FRESH_HOURS = Number(process.env.NEWS_FRESH_HOURS || 40);
export const FETCH_PER_QUERY = 30;

export function todayKey(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
