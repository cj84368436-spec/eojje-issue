// 날짜/시간 표기는 모두 KST 기준 상대 표현으로 통일한다.

export function timeLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffH = diffMs / 3_600_000;

  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${Math.floor(diffH)}시간 전`;

  const dayDiff = kstDayDiff(date);
  if (dayDiff === 1) return `어제 ${kstClock(date)}`;
  return kstMonthDay(date);
}

export function briefDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Seoul"
  }).format(date);
}

export function kstMonthDay(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric", day: "numeric", timeZone: "Asia/Seoul"
  }).format(date);
}

function kstClock(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul"
  }).format(date);
}

function kstDayDiff(date) {
  const toKstDay = (d) => Math.floor((d.getTime() + 9 * 3600 * 1000) / 86_400_000);
  return toKstDay(new Date()) - toKstDay(date);
}

// 모든 동적 문자열은 innerHTML에 넣기 전에 이스케이프한다.
export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
