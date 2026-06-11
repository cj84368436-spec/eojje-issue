// 데이터 로드 전/실패 시 헤더에 보여줄 KST 오늘 날짜.
export function todayFallbackDate() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
