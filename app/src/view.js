import { CATEGORIES, CATEGORY_LABELS, TABS } from "./config.js";
import { timeLabel, briefDateLabel, escapeHtml } from "./format.js";

const BOOKMARK_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 4.2h12a.9.9 0 0 1 .9.9v15.1l-6.9-3.8-6.9 3.8V5.1a.9.9 0 0 1 .9-.9Z" fill="currentColor"/></svg>`;
const BOOKMARK_OUTLINE = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 4.2h12a.9.9 0 0 1 .9.9v15.1l-6.9-3.8-6.9 3.8V5.1a.9.9 0 0 1 .9-.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
const ARROW_ICON = `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M5 10h9m0 0-3.4-3.4M14 10l-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const HOME_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m3 11 9-8 9 8" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v10h14V10" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="M9 20v-6h6v6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/></svg>`;
const FLAME_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8.5 14.5A3.5 3.5 0 0 0 12 21a7 7 0 0 0 7-7c0-4-2.5-6.5-5-9 .3 2.6-.9 4.1-2.3 5.2C10.2 8 8.5 6.7 8.5 4c-2.2 2-3.5 4.7-3.5 8a6.7 6.7 0 0 0 3.5 6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// 앱 마크 (클로드 디자인 원본): 아침에 떠오른 이슈 = 상승하는 막대(트렌드) + 떠오르는 해(아침).
const APP_MARK = `<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
  <circle cx="8.6" cy="8.2" r="3" fill="currentColor" opacity=".5"/>
  <rect x="5.4" y="17" width="4.7" height="9" rx="1.9" fill="currentColor" opacity=".62"/>
  <rect x="13.65" y="13" width="4.7" height="13" rx="1.9" fill="currentColor" opacity=".82"/>
  <rect x="21.9" y="8.6" width="4.7" height="17.4" rx="1.9" fill="currentColor"/>
</svg>`;

const CATEGORY_ICONS = {
  politics: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 10h14M6 18V10m4 8V10m4 8V10m4 8V10M12 3l8 5H4l8-5Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  economy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M7 15l4-4 3 3 5-7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  society: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  culture: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 1 10-10c0 1.7-1.3 3-3 3h-1.7a2 2 0 0 0-1.8 2.8l.2.5a2.6 2.6 0 0 1-2.4 3.7H12Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="10" r="1" fill="currentColor"/><circle cx="10.5" cy="7" r="1" fill="currentColor"/><circle cx="14" cy="7" r="1" fill="currentColor"/><circle cx="16.5" cy="10" r="1" fill="currentColor"/></svg>`,
  entertainment: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ai: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1m-7.2 7.2-2.1 2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="7.5" y="7.5" width="9" height="9" rx="2.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.2 12h3.6M12 10.2v3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
};
const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));

function safeCategoryId(category) {
  return CATEGORY_IDS.has(category) ? category : "society";
}

export function renderSplash() {
  return `
    <div class="splash" role="presentation">
      <div class="splash-inner">
        <span class="splash-mark">${APP_MARK}</span>
        <strong class="splash-word">어제이슈</strong>
        <span class="splash-tag">어제 다들 얘기한 이슈를 오늘 아침 5분 만에</span>
      </div>
    </div>
  `;
}

export function renderShell({ dateString, savedCount, activeTab, staleDaysCount, issueCount = 0 }) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">${APP_MARK}</span>
          <div class="brand-text">
            <h1>어제이슈</h1>
            <p>${escapeHtml(briefDateLabel(dateString))} · 어제의 이슈를 오늘 대화 맥락으로</p>
          </div>
        </div>
      </header>
      ${renderBentoStatus(savedCount, issueCount)}
      <nav class="tabs" aria-label="카테고리">
        <button class="tab ${activeTab === "headlines" ? "is-active" : ""}" data-action="tab" data-tab="headlines" type="button">전체</button>
        ${TABS.filter((tab) => tab.id !== "saved" && tab.id !== "headlines").map((tab) => `
          <button class="tab ${activeTab === tab.id ? "is-active" : ""}" data-action="tab" data-tab="${tab.id}" type="button"><i style="background:var(--c-${tab.id})"></i>${tab.label}</button>
        `).join("")}
      </nav>
      ${staleDaysCount >= 2 ? renderStaleBanner(dateString) : ""}
      <main id="content"></main>
      ${renderBottomNav(activeTab, savedCount)}
      <footer class="app-foot">
        <p>속보를 더 많이 보여주는 앱이 아니라, 어제의 주요 이슈를 맥락 중심으로 정리합니다.</p>
      </footer>
    </div>
    <div id="sheet-root"></div>
  `;
}

function renderBentoStatus(savedCount, issueCount) {
  const countLabel = issueCount > 0 ? `${issueCount}개 이슈` : "오늘의 이슈";
  return `
    <section class="bento-status" aria-label="브리핑 상태">
      <div class="bento-tile streak">
        <span class="tile-label">어제의 맵</span>
        <strong>${countLabel} ${FLAME_ICON}</strong>
        <span class="tile-sub">정치·경제·사회·문화·연예·AI를 한 화면에서 훑기</span>
      </div>
      <div class="bento-tile progress">
        <span class="tile-label">내 브리핑</span>
        <div class="briefing-row">
          <span class="progress-ring">
            <svg viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="19"></circle><circle cx="23" cy="23" r="19" class="on"></circle></svg>
            <b>${savedCount}</b>
          </span>
          <span class="progress-copy"><strong>${savedCount}개 저장</strong><small>다시 볼 이슈만 남기세요</small></span>
        </div>
      </div>
    </section>
  `;
}

function renderBottomNav(activeTab, savedCount) {
  return `
    <nav class="tabbar" aria-label="하단 내비게이션">
      <button class="tabbar-item ${activeTab !== "saved" ? "is-active" : ""}" data-action="tab" data-tab="headlines" type="button">${HOME_ICON}<span>홈</span></button>
      <button class="tabbar-item ${activeTab === "saved" ? "is-active" : ""}" data-action="tab" data-tab="saved" type="button">${BOOKMARK_OUTLINE}<span>저장</span><em data-saved-count>${savedCount}</em></button>
    </nav>
  `;
}

function renderStaleBanner(dateString) {
  return `
    <div class="stale-banner" role="status">
      <strong>최신 뉴스 갱신에 실패했어요</strong>
      <span>지금 보이는 내용은 ${escapeHtml(briefDateLabel(dateString))} 기준입니다.</span>
    </div>
  `;
}

export function renderLoading() {
  return `
    <div class="skeleton-list" aria-label="뉴스를 불러오는 중">
      <div class="skeleton-card lead">
        <div class="skeleton-line w-30"></div>
        <div class="skeleton-line w-90 tall"></div>
        <div class="skeleton-line w-70 tall"></div>
        <div class="skeleton-line w-40"></div>
      </div>
      ${Array.from({ length: 3 }, () => `
        <div class="skeleton-card">
          <div class="skeleton-line w-30"></div>
          <div class="skeleton-line w-90"></div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderError() {
  return `
    <div class="empty-state">
      <span class="empty-mark">${APP_MARK}</span>
      <strong>뉴스를 불러오지 못했어요</strong>
      <p>네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
      <button class="retry-btn" data-action="retry" type="button">다시 시도</button>
    </div>
  `;
}

export function renderHeadlines(headlines, saved) {
  if (headlines.length === 0) {
    return `<div class="empty-state"><span class="empty-mark">${APP_MARK}</span><strong>아직 브리핑이 없어요</strong><p>잠시 후 다시 확인해 주세요.</p></div>`;
  }

  const [lead, ...rest] = headlines;
  const firstRows = rest.slice(0, 2);
  const laterRows = rest.slice(2);
  return `
    <section class="section headline-section">
      <div class="section-head">
        <strong>어제의 이슈 맵</strong>
        <span>뉴스를 더 많이 보기보다, 오늘 필요한 맥락만 ${headlines.length}개</span>
      </div>
      ${renderLeadCard(lead, saved)}
      <div class="headline-rows">
        ${firstRows.map((item, index) => renderHeadlineRow(item, index + 2, saved)).join("")}
        ${headlines.length >= 4 ? renderAdSlot("feed") : ""}
        ${laterRows.map((item, index) => renderHeadlineRow(item, index + 4, saved)).join("")}
      </div>
    </section>
  `;
}

function renderLeadCard(item, saved) {
  const category = safeCategoryId(item.category);
  return `
    <article class="lead-card cat-${category}" data-id="${escapeHtml(item.id)}">
      <button class="lead-main" data-action="open" data-id="${escapeHtml(item.id)}" type="button">
        ${renderArticleVisual(item, "lead")}
        <div class="lead-top">
          <span class="rank-badge">01</span>
          <span class="cat-label">${CATEGORY_LABELS[category] || ""}</span>
          ${renderAiBadge(item)}
          <span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        ${briefText(item) ? `<p>${escapeHtml(briefText(item))}</p>` : ""}
        <div class="lead-signals">
          ${renderHeatMeter(item)}
          ${renderSensitivity(item)}
        </div>
      </button>
      ${renderSaveButton(item.id, saved)}
    </article>
  `;
}

function coverageLabel(item) {
  const sourceName = item.sourceName || "뉴스";
  const count = Number(item.coverage?.sourceCount || 1);
  if (count <= 1) return sourceName;
  return `${sourceName} 외 ${count - 1}개사 보도`;
}

function renderHeadlineRow(item, rank, saved) {
  const category = safeCategoryId(item.category);
  return `
    <article class="headline-row cat-${category}" data-id="${escapeHtml(item.id)}">
      <button class="row-main" data-action="open" data-id="${escapeHtml(item.id)}" type="button">
        ${renderArticleVisual(item, "row")}
        <span class="row-body">
          <span class="row-meta"><span class="rank">${rank}</span><span class="cat-label">${CATEGORY_LABELS[category] || ""}</span>${renderAiBadge(item)}<span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span></span>
          <span class="row-title">${escapeHtml(item.title)}</span>
          ${briefText(item) ? `<span class="row-summary">${escapeHtml(briefText(item))}</span>` : ""}
          <span class="row-foot">
            ${renderHeatMeter(item, { compact: true })}
            ${renderSensitivity(item, { compact: true })}
          </span>
        </span>
      </button>
      ${renderSaveButton(item.id, saved)}
    </article>
  `;
}

export function renderCategoryList(items, saved) {
  if (items.length === 0) {
    return `<div class="empty-state"><span class="empty-mark">${APP_MARK}</span><strong>오늘은 선별된 소식이 없어요</strong><p>기준을 통과한 이슈가 있는 날에만 보여드립니다.</p></div>`;
  }
  return `
    <section class="section">
      <div class="card-list">
        ${items.map((item, index) => `${index === 3 ? renderAdSlot("category") : ""}${renderIssueCard(item, saved)}`).join("")}
      </div>
    </section>
  `;
}

export function renderSavedList(entries, saved) {
  if (entries.length === 0) {
    return `
      <div class="empty-state">
        <span class="empty-mark">${BOOKMARK_OUTLINE}</span>
        <strong>저장한 뉴스가 없어요</strong>
        <p>다시 보고 싶은 이슈는 책갈피로 모아두세요.</p>
      </div>
    `;
  }
  return `
    <section class="section">
      <div class="card-list">
        ${entries.map((entry) => renderIssueCard(entry.item, saved)).join("")}
      </div>
    </section>
  `;
}

function renderIssueCard(item, saved) {
  const category = safeCategoryId(item.category);
  return `
    <article class="issue-card cat-${category}" data-id="${escapeHtml(item.id)}">
      <button class="card-main" data-action="open" data-id="${escapeHtml(item.id)}" type="button">
        ${renderArticleVisual(item, "card")}
        <div class="card-copy">
          <div class="card-meta">
            <span class="cat-label">${CATEGORY_LABELS[category] || ""}</span>
            ${renderAiBadge(item)}
              <span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          ${briefText(item) ? `<p>${escapeHtml(briefText(item))}</p>` : ""}
          <div class="card-foot">
            ${renderHeatMeter(item, { compact: true })}
            ${(item.keywords || []).length ? `
              <div class="tags">${item.keywords.slice(0, 2).map((k) => `<span>#${escapeHtml(k)}</span>`).join("")}</div>
            ` : ""}
          </div>
        </div>
      </button>
      ${renderSaveButton(item.id, saved)}
    </article>
  `;
}

function renderAiBadge(item) {
  if (item.category === "ai") return `<span class="ai-badge">AI 업데이트</span>`;
  return item.cardNews ? `<span class="ai-badge">브리핑</span>` : "";
}


function renderArticleVisual(item, size) {
  const image = item.imageUrl || item.thumbnail || item.image || item.ogImage || "";
  const category = safeCategoryId(item.category);
  const label = CATEGORY_LABELS[category] || "이슈";
  if (image) {
    // data-* 는 이미지 로드 실패 시 폴백으로 교체할 때 쓴다 (main.js의 error 핸들러).
    return `<span class="article-visual ${size}" data-size="${escapeHtml(size)}" data-label="${escapeHtml(label)}"><img src="${escapeHtml(image)}" alt="" loading="lazy"></span>`;
  }
  return articleVisualFallbackHtml(size, label, category);
}

export function articleVisualFallbackHtml(size, label, category = "") {
  const safeCategory = safeCategoryId(category);
  return `
    <span class="article-visual ${escapeHtml(size)} is-fallback" aria-hidden="true">
      <span class="visual-icon">${CATEGORY_ICONS[safeCategory] || CATEGORY_ICONS.society}</span>
      <span class="visual-label">${escapeHtml(label)}</span>
    </span>
  `;
}

function renderSaveButton(id, saved) {
  return saveButtonHtml(id, saved.has(id));
}

export function saveButtonHtml(id, on) {
  return `
    <button class="save-btn ${on ? "is-on" : ""}" data-action="save" data-id="${escapeHtml(id)}" type="button"
      aria-pressed="${on}" aria-label="${on ? "저장 해제" : "저장"}">
      ${on ? BOOKMARK_ICON : BOOKMARK_OUTLINE}
    </button>
  `;
}

// 기사 상세는 재료가 있는 만큼만 스토리 슬라이드로 보여준다.
// 고정 5장을 억지로 채우지 않고, 빈약한 핵심 포인트는 생략한다.

export function renderStory(item, saved, { index = 0 } = {}) {
  const on = saved.has(item.id);
  const category = safeCategoryId(item.category);
  const kor = CATEGORY_LABELS[category] || "이슈";
  const high = (item.cardNews?.sensitivity || item.sensitivity) === "높음";

  const slides = buildStorySlides(item, kor, on, high);
  const activeIndex = Math.max(0, Math.min(index, slides.length - 1));

  return `
    <section class="story cat-${category}" role="dialog" aria-modal="true"
      aria-label="${escapeHtml(item.title)} 카드뉴스">
      <div class="pbars" aria-label="${slides.length}장 중 ${activeIndex + 1}장">
        ${slides.map((_, i) =>
          `<i class="${i < activeIndex ? "done" : i === activeIndex ? "cur" : ""}"><b></b></i>`).join("")}
      </div>
      <div class="story-top">
        <div class="who">
          <div class="av" style="background:var(--c-${category})" aria-hidden="true">${CATEGORY_ICONS[category] || CATEGORY_ICONS.society}</div>
          <div>
            <div class="nm">${escapeHtml(item.sourceName || "뉴스")}</div>
            <div class="tm">${escapeHtml(kor)} · ${slides.length > 2 ? "맥락 포함 브리핑" : "핵심 브리핑과 원문 근거"}</div>
          </div>
        </div>
        <button class="story-x" data-action="close" type="button" aria-label="닫기">×</button>
      </div>
      ${high ? `<div class="sensitive-banner in-story">민감한 이슈예요. 원문과 함께 확인해 주세요</div>` : ""}

      <div class="stage">
        ${slides.map((html, i) => {
          const inactive = i !== activeIndex;
          return `<article class="slide ${inactive ? "" : "on"} ${i === slides.length - 1 ? "final" : ""}" aria-hidden="${inactive}" ${inactive ? "hidden inert" : ""}>${html}</article>`;
        }).join("")}
      </div>

      <div class="story-controls" aria-label="기사 상세 장 이동">
        <button class="story-nav prev" data-action="story-prev" type="button" ${activeIndex === 0 ? "disabled" : ""}>이전</button>
        <output class="story-count" aria-live="polite">${activeIndex + 1} / ${slides.length}</output>
        <button class="story-nav next" data-action="story-next" type="button" ${activeIndex === slides.length - 1 ? "disabled" : ""}>다음</button>
      </div>
    </section>
  `;
}

function buildStorySlides(item, kor, on, high) {
  const slides = [
    storyBrief(item, kor)
  ];

  const contextSlide = storyContext(item);
  if (contextSlide) slides.push(contextSlide);

  slides.push(storyFinal(item, on, high));
  return slides;
}

function cleanTextList(values = []) {
  return values
    .map((value) => cleanArticleText(value))
    .filter(Boolean);
}

function cleanArticleText(text = "") {
  return String(text || "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/(?<!\d)([.!?。])(?=[가-힣A-Za-z0-9])/g, "$1 ")
    .replace(/^[\s,.:]+|[\s,.:]+$/g, "")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function briefText(item) {
  const candidates = [
    item.cardNews?.summary?.text,
    ...(item.cardNews?.what?.lines || []),
    item.summary,
    ...(item.points || []),
    item.why
  ].map(cleanArticleText).filter(Boolean);

  const title = normalizeComparable(item.title);
  const picked = candidates.find((text) => {
    const normalized = normalizeComparable(text);
    if (!normalized || normalized === title) return false;
    if (normalized.length < 10) return false;
    if (/^(알려줘|작성해 줘|저는 대사가 없어요)/.test(text)) return false;
    return true;
  });

  return finalSummaryText(picked || "");
}

function completeSentence(text) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, "")
    .trim();
  if (!clean) return "";
  if (/[.!?。]$/.test(clean) || /(다|요|죠|함|됨|중|예정)$/.test(clean)) return clean;
  return `${clean}.`;
}

function finalSummaryText(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "핵심만 확인하고 원문에서 맥락을 이어서 보세요.";
  const first = splitSentences(clean)[0] || clean;
  return completeSentence(first);
}

function storyBrief(item, kor) {
  const first = briefText(item);

  return `
    <span class="stag">무슨 일이 있었나 · ${escapeHtml(kor)} 30초 브리핑</span>
    <h2 class="story-title">${escapeHtml(item.title)}</h2>
    <div class="what story-brief">
      <p>${escapeHtml(completeSentence(first))}</p>
    </div>
  `;
}

function storyContext(item) {
  const lines = buildContextLines(item, briefText(item)).slice(0, 3);
  if (lines.length === 0) return "";

  return `
    <span class="stag">알아둘 맥락</span>
    <div class="pts">
      ${lines.slice(0, 3).map((line, i) => `<div class="pt"><span class="no">${i + 1}</span><p>${escapeHtml(completeSentence(line))}</p></div>`).join("")}
    </div>
  `;
}

function buildContextLines(item, brief) {
  const lines = [];
  const why = cleanArticleText(item.why);
  if (why && isUsefulContext(why, item.title) && !isNearDuplicate(why, brief)) lines.push(why);

  cleanTextList(item.cardNews?.points || item.points || []).forEach((point) => {
    if (isUsefulContext(point, item.title) && !isNearDuplicate(point, brief)) lines.push(point);
  });

  return dedupeLines(lines).slice(0, 4);
}

function isUsefulContext(text, title) {
  const normalized = normalizeComparable(text);
  if (!normalized || normalized.length < 8) return false;
  const titleText = normalizeComparable(title);
  if (normalized === titleText || titleText.includes(normalized)) return false;
  return !/^(알려줘|작성해 줘|저는 대사가 없어요)/.test(text);
}

function dedupeLines(lines) {
  const kept = [];
  for (const line of lines) {
    if (!line || kept.some((existing) => isNearDuplicate(line, existing))) continue;
    kept.push(line);
  }
  return kept;
}

function isNearDuplicate(a, b) {
  const left = normalizeComparable(a);
  const right = normalizeComparable(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;

  const leftTokens = comparableTokens(a);
  const rightTokens = comparableTokens(b);
  const smaller = Math.min(leftTokens.size, rightTokens.size);
  if (smaller === 0) return false;

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });
  return overlap / smaller >= 0.7;
}

function comparableTokens(text) {
  return new Set(String(text || "")
    .replace(/[^가-힣A-Za-z0-9%\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2));
}

function normalizeComparable(text = "") {
  return String(text).replace(/["'“”‘’\s.,!?·]/g, "").trim();
}

function storyFinal(item, on, high) {
  const sourceName = item.sourceName || "출처 미상";
  const sourceCount = Math.max(1, Number(item.coverage?.sourceCount || 1));
  const sourceNames = dedupeLines(cleanTextList([sourceName, ...(item.coverage?.sourceNames || [])]));
  const publishedAt = formatPublishedAt(item.publishedAt);

  return `
    <span class="stag">취재 근거</span>
    <dl class="source-facts">
      <div><dt>원문 출처</dt><dd>${escapeHtml(sourceName)}</dd></div>
      <div><dt>관련 보도</dt><dd>${sourceCount}개 출처</dd></div>
      ${sourceNames.length ? `<div><dt>매체</dt><dd>${sourceNames.map(escapeHtml).join(" · ")}</dd></div>` : ""}
      <div><dt>발행 시각</dt><dd>${escapeHtml(publishedAt)}</dd></div>
    </dl>
    <div class="acts">
      ${storySaveButtonHtml(item.id, on)}
      ${safeExternalUrl(item.sourceUrl)
        ? `<a class="orig sheet-link ${high ? "is-emphasis" : ""}" href="${escapeHtml(safeExternalUrl(item.sourceUrl))}" target="_blank" rel="noopener noreferrer">원문 보기 ${ARROW_ICON}</a>`
        : `<span class="orig is-disabled" aria-disabled="true">원문 링크 확인 중</span>`}
      <button class="complete" data-action="close" type="button">확인 완료</button>
    </div>
  `;
}

function safeExternalUrl(value = "") {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function formatPublishedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "발행 시각 미상";
  if (date.getTime() > Date.now() + 60_000) return "시각 확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(date);
}
function splitSentences(text = "") {
  return String(text)
    .split(/(?<=[.!?。…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function storySaveButtonHtml(id, on) {
  return `
    <button class="save ${on ? "is-on" : ""}" data-action="save" data-id="${escapeHtml(id)}" type="button" aria-pressed="${on}">
      ${on ? BOOKMARK_ICON : BOOKMARK_OUTLINE} ${on ? "저장됨" : "저장"}
    </button>
  `;
}

function renderAdSlot(placement) {
  if (!import.meta.env?.DEV) return "";
  return `
    <aside class="ad-slot" data-ad-placement="${placement}" aria-label="광고 영역">
      <span class="ad-kicker">AD</span>
      <strong>출근길에 보기 좋은 추천 콘텐츠</strong>
      <p>실제 광고 SDK 연결 전까지 쓰는 미리보기 영역입니다.</p>
    </aside>
  `;
}

function heatPct(heat) {
  return Math.max(6, Math.min(100, Math.round(Number(heat) || 0)));
}

function renderHeatMeter(item, { compact = false } = {}) {
  const pct = heatPct(item.heat);
  if (compact) {
    return `
      <span class="heat-meter is-compact" aria-label="주목도 ${heatLabel(item.heat)}">
        <span class="heat-track"><span class="heat-fill" style="width:${pct}%"></span></span>
        <span class="heat-val">${heatLabel(item.heat)}</span>
      </span>
    `;
  }
  return `
    <div class="heat-meter" aria-label="주목도 ${heatLabel(item.heat)}">
      <span class="heat-cap">주목도</span>
      <span class="heat-track"><span class="heat-fill" style="width:${pct}%"></span></span>
      <strong class="heat-val">${heatLabel(item.heat)}</strong>
    </div>
  `;
}

function renderSensitivity(item, { compact = false } = {}) {
  const value = item.sensitivity || "낮음";
  const cls = sensitivityClass(value);
  return `
    <span class="sens-pill sens-${cls} ${compact ? "is-compact" : ""}">
      <i class="sens-dot" aria-hidden="true"></i>민감도 ${escapeHtml(value)}
    </span>
  `;
}

function heatLabel(heat = 0) {
  if (heat >= 90) return "최상위";
  if (heat >= 75) return "높음";
  if (heat >= 60) return "보통";
  return "낮음";
}

function sensitivityClass(value = "낮음") {
  if (value === "높음") return "high";
  if (value === "중간") return "mid";
  return "low";
}
