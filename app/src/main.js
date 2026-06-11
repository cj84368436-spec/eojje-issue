import "./styles.css";
import { loadNews, flattenPayload, staleDays } from "./data.js";
import { attendanceSummary, checkInToday, savedEntries, savedIds, toggleSaved } from "./store.js";
import {
  renderShell, renderSplash, renderLoading, renderError,
  renderHeadlines, renderCategoryList, renderSavedList, renderDetailSheet,
  saveButtonHtml, articleVisualFallbackHtml
} from "./view.js";
import { CATEGORIES } from "./config.js";
import { todayFallbackDate } from "./fallback.js";
import { track } from "./analytics.js";

const root = document.querySelector("#app");

document.body.insertAdjacentHTML("afterbegin", renderSplash());
setTimeout(() => {
  document.querySelector(".splash")?.remove();
}, 1700);

track("app_open", { source: "browser" });

const state = {
  payload: null,
  issueById: new Map(),
  activeTab: "headlines",
  detailId: null,
  loading: true,
  failed: false
};

function renderApp() {
  const dateString = state.payload?.date || todayFallbackDate();
  root.innerHTML = renderShell({
    dateString,
    savedCount: savedEntries().length,
    activeTab: state.activeTab,
    staleDaysCount: state.payload ? staleDays(state.payload) : 0,
    attendance: attendanceSummary()
  });
  renderContent();
  renderSheet();
}

function renderContent() {
  const content = root.querySelector("#content");
  if (!content) return;

  if (state.loading) {
    content.innerHTML = renderLoading();
    return;
  }
  if (state.failed) {
    content.innerHTML = renderError();
    return;
  }

  const saved = savedIds();
  if (state.activeTab === "headlines") {
    content.innerHTML = renderHeadlines(state.payload.headlines || [], saved);
  } else if (state.activeTab === "saved") {
    content.innerHTML = renderSavedList(savedEntries(), saved);
  } else {
    content.innerHTML = renderCategoryList(state.payload.categories[state.activeTab] || [], saved);
  }
  content.scrollTop = 0;
}

function renderSheet() {
  const sheetRoot = root.querySelector("#sheet-root");
  if (!sheetRoot) return;

  const item = state.detailId ? findItem(state.detailId) : null;
  sheetRoot.innerHTML = item ? renderDetailSheet(item, savedIds()) : "";
  document.body.classList.toggle("sheet-open", Boolean(item));
}

function findItem(id) {
  if (state.issueById.has(id)) return state.issueById.get(id);
  const savedEntry = savedEntries().find((entry) => entry.item.id === id);
  return savedEntry ? savedEntry.item : null;
}

function onAction(action, target) {
  if (action === "tab") {
    state.activeTab = target.dataset.tab;
    state.detailId = null;
    track("tab_change", { tab: state.activeTab });
    renderApp();
    window.scrollTo({ top: 0 });
    return;
  }

  if (action === "open") {
    state.detailId = target.dataset.id;
    track("issue_open", { id: state.detailId });
    renderSheet();
    return;
  }

  if (action === "close") {
    state.detailId = null;
    track("sheet_close");
    renderSheet();
    return;
  }

  if (action === "save") {
    const item = findItem(target.dataset.id);
    if (!item) return;
    toggleSaved(item);
    track("issue_save_toggle", { id: item.id, tab: state.activeTab });
    // 저장 탭에서는 목록 자체가 변하므로 다시 그린다. 그 외에는 버튼/카운트만 갱신.
    if (state.activeTab === "saved") {
      renderContent();
    } else {
      updateSaveButtons(item.id);
    }
    updateSavedCount();
    renderSheet();
    return;
  }

  if (action === "checkin") {
    checkInToday();
    track("attendance_checkin");
    renderApp();
    return;
  }

  if (action === "retry") {
    track("news_retry");
    bootstrap();
  }
}

// 스크롤 위치를 유지하기 위해 목록 전체가 아니라 해당 id의 저장 버튼만 교체한다.
function updateSaveButtons(id) {
  const on = savedIds().has(id);
  const content = root.querySelector("#content");
  if (!content) return;
  content.querySelectorAll(`.save-btn[data-id="${CSS.escape(id)}"]`).forEach((button) => {
    button.outerHTML = saveButtonHtml(id, on);
  });
}

function updateSavedCount() {
  const counter = root.querySelector("[data-saved-count]");
  if (counter) counter.textContent = String(savedEntries().length);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    const sourceLink = event.target.closest(".sheet-link");
    if (sourceLink) {
      track("source_click", { href: sourceLink.href, issueId: state.detailId });
    }
    return;
  }
  // 백드롭 클릭만 close로 처리하고, 시트 내부 클릭은 무시한다.
  if (target.classList.contains("sheet-backdrop") && event.target !== target) return;
  onAction(target.dataset.action, target);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.detailId) {
    state.detailId = null;
    renderSheet();
  }
});

// 언론사 썸네일이 로드에 실패하면 깨진 이미지 대신 카테고리 폴백으로 바꾼다.
document.addEventListener("error", (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const wrap = img.closest(".article-visual");
  if (!wrap || wrap.classList.contains("is-fallback")) return;
  wrap.outerHTML = articleVisualFallbackHtml(wrap.dataset.size || "card", wrap.dataset.label || "이슈");
}, true);

async function bootstrap() {
  state.loading = true;
  state.failed = false;
  renderApp();

  try {
    const { payload } = await loadNews();
    // 카테고리 순서를 앱 기준으로 고정한다 (데이터 순서에 의존하지 않음).
    payload.categories = Object.fromEntries(
      CATEGORIES.map((c) => [c.id, payload.categories[c.id] || []])
    );
    state.payload = payload;
    state.issueById = flattenPayload(payload);
    state.loading = false;
  } catch {
    state.loading = false;
    state.failed = true;
  }

  renderApp();
}

bootstrap();
