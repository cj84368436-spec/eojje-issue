// 매일 갱신되는 뉴스 데이터의 원격 주소.
// 비워두면 빌드에 포함된 ./today-news.json 만 사용한다 (매일 갱신 불가 - 출시 전 반드시 설정).
// 예: GitHub Pages에 파이프라인 결과를 올린 경우
//   "https://<계정>.github.io/<저장소>/today-news.json"
export const REMOTE_DATA_URL = "";

// 데이터 날짜가 오늘(KST)보다 이 일수 이상 뒤처지면 "갱신 지연" 배너를 띄운다.
export const STALE_AFTER_DAYS = 2;

export const CATEGORIES = [
  { id: "politics", label: "정치" },
  { id: "economy", label: "경제" },
  { id: "society", label: "사회" },
  { id: "culture", label: "문화" },
  { id: "entertainment", label: "연예" }
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

export const TABS = [
  { id: "headlines", label: "헤드라인" },
  ...CATEGORIES,
  { id: "saved", label: "저장" }
];
