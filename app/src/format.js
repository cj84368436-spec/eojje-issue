export function timeLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return kstMonthDay(date);
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
  const toKstDay = (value) => Math.floor((value.getTime() + 9 * 3600 * 1000) / 86_400_000);
  return toKstDay(new Date()) - toKstDay(date);
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
