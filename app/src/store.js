// 저장 기능: 기사 스냅샷째로 localStorage에 보관한다.
// id만 저장하면 다음 날 데이터가 바뀔 때 저장 목록이 사라지기 때문이다.

const STORAGE_KEY = "eojje-issue:saved:v1";
const ATTENDANCE_KEY = "eojje-issue:attendance:v1";
const MAX_SAVED = 50;

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_SAVED)));
  } catch {
    // 저장 공간 부족 등은 조용히 무시한다 (기능 자체는 세션 내 동작).
  }
}

export function savedEntries() {
  return read();
}

export function savedIds() {
  return new Set(read().map((entry) => entry.item.id));
}

export function isSaved(id) {
  return read().some((entry) => entry.item.id === id);
}

export function toggleSaved(item) {
  const entries = read();
  const index = entries.findIndex((entry) => entry.item.id === item.id);
  if (index >= 0) {
    entries.splice(index, 1);
    write(entries);
    return false;
  }
  entries.unshift({ savedAt: new Date().toISOString(), item });
  write(entries);
  return true;
}

function todayKst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function dayIndex(dateString) {
  return Math.floor(new Date(`${dateString}T00:00:00Z`).getTime() / 86_400_000);
}

function readAttendance() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTENDANCE_KEY));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAttendance(value) {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(value));
  } catch {
    // 출석 보상은 보조 기능이므로 저장 실패는 조용히 무시한다.
  }
}

export function attendanceSummary() {
  const data = readAttendance();
  const today = todayKst();
  return {
    today,
    checkedToday: data.lastCheckedDate === today,
    streak: Number(data.streak || 0),
    total: Number(data.total || 0),
    lastCheckedDate: data.lastCheckedDate || ""
  };
}

export function checkInToday() {
  const data = readAttendance();
  const today = todayKst();
  if (data.lastCheckedDate === today) return attendanceSummary();

  const yesterday = new Date(Date.now() + 9 * 3600 * 1000 - 86_400_000).toISOString().slice(0, 10);
  const next = {
    lastCheckedDate: today,
    streak: data.lastCheckedDate === yesterday ? Number(data.streak || 0) + 1 : 1,
    total: Number(data.total || 0) + 1
  };
  // 오래된 저장 구조에서도 날짜 비교가 안정적이도록 마지막 날짜만 신뢰한다.
  if (data.lastCheckedDate && dayIndex(today) - dayIndex(data.lastCheckedDate) === 1) {
    next.streak = Number(data.streak || 0) + 1;
  }
  writeAttendance(next);
  return attendanceSummary();
}
