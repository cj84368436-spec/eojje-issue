import "./styles.css";
import { loadNews, flattenPayload, staleDays } from "./data.js";
import { attendanceSummary, checkInToday, savedEntries, savedIds, toggleSaved } from "./store.js";
import {
  renderShell, renderSplash, renderLoading, renderError,
  renderHeadlines, renderCategoryList, renderSavedList, renderStory,
  saveButtonHtml, storySaveButtonHtml, articleVisualFallbackHtml
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
  storyIndex: 0,
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
  sheetRoot.innerHTML = item
    ? renderStory(item, savedIds(), { rank: rankOf(item.id), index: state.storyIndex })
    : "";
  document.body.classList.toggle("sheet-open", Boolean(item));

  // 슬라이드업 등장 애니메이션(.story.on)은 DOM 삽입 후 한 프레임 뒤에 켠다.
  if (item) {
    const story = sheetRoot.querySelector(".story");
    if (story) requestAnimationFrame(() => story.classList.add("on"));
  }
}

// 진행/슬라이드 표시만 갱신한다(전체 재렌더 없이) — 등장 애니메이션 재발동 방지.
function updateStory() {
  const story = root.querySelector("#sheet-root .story");
  if (!story) return;
  const total = storySlideCount();
  state.storyIndex = Math.max(0, Math.min(state.storyIndex, total - 1));
  story.querySelectorAll(".pbars i").forEach((bar, i) => {
    bar.className = i < state.storyIndex ? "done" : i === state.storyIndex ? "cur" : "";
  });
  story.querySelectorAll(".slide").forEach((slide, i) => {
    const on = i === state.storyIndex;
    slide.classList.toggle("on", on);
    slide.setAttribute("aria-hidden", String(!on));
  });
  const label = story.querySelector(".pbars");
  if (label) label.setAttribute("aria-label", `${total}장 중 ${state.storyIndex + 1}장`);
}

function findItem(id) {
  if (state.issueById.has(id)) return state.issueById.get(id);
  const savedEntry = savedEntries().find((entry) => entry.item.id === id);
  return savedEntry ? savedEntry.item : null;
}

// 스토리 헤더의 "N위"는 헤드라인(랭킹) 순서를 우선 쓰고, 없으면 카테고리 내 순서를 쓴다.
function rankOf(id) {
  const headlines = state.payload?.headlines || [];
  const inHeadlines = headlines.findIndex((item) => item.id === id);
  if (inHeadlines >= 0) return inHeadlines + 1;
  const item = findItem(id);
  const list = (item && state.payload?.categories?.[item.category]) || [];
  const inCategory = list.findIndex((entry) => entry.id === id);
  return inCategory >= 0 ? inCategory + 1 : 0;
}

function storySlideCount() {
  return root.querySelectorAll("#sheet-root .story .slide").length || 1;
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
    state.storyIndex = 0;
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

  if (action === "story-prev") {
    if (state.storyIndex > 0) {
      state.storyIndex -= 1;
      updateStory();
    }
    return;
  }

  if (action === "story-next") {
    if (state.storyIndex >= storySlideCount() - 1) {
      state.detailId = null;
      track("sheet_close");
      renderSheet();
    } else {
      state.storyIndex += 1;
      updateStory();
    }
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
    // 스토리가 열려 있으면 한 줄 정리 슬라이드의 저장 버튼만 갱신(슬라이드 위치 유지).
    updateStorySaveButton(item.id);
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

// 스토리(한 줄 정리)의 저장 버튼만 교체해 슬라이드 위치/애니메이션을 유지한다.
function updateStorySaveButton(id) {
  const button = root.querySelector(`#sheet-root .story .acts .save[data-id="${CSS.escape(id)}"]`);
  if (button) button.outerHTML = storySaveButtonHtml(id, savedIds().has(id));
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
  if (!state.detailId) return;
  if (event.key === "Escape") {
    state.detailId = null;
    renderSheet();
  } else if (event.key === "ArrowRight") {
    onAction("story-next", null);
  } else if (event.key === "ArrowLeft") {
    onAction("story-prev", null);
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
