const ANALYTICS_KEY = "eojje-issue:analytics:v1";
const MAX_EVENTS = 200;

function readEvents() {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function track(eventName, payload = {}) {
  // 제출(프로덕션) 빌드에서는 아무것도 기록하지 않는다.
  // 정식 계측은 출시 후 토스 제공 분석 도구 연결 시점에 붙인다.
  if (!import.meta.env.DEV) return;

  const event = {
    eventName,
    payload,
    at: new Date().toISOString()
  };
  const events = [...readEvents(), event].slice(-MAX_EVENTS);
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  } catch {
    // 분석 저장 실패가 앱 사용을 막으면 안 된다.
  }
  console.info("[analytics]", eventName, payload);
}
