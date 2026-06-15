import { CATEGORY_LABELS, TABS } from "./config.js";
import { timeLabel, briefDateLabel, escapeHtml } from "./format.js";

const BOOKMARK_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 4.2h12a.9.9 0 0 1 .9.9v15.1l-6.9-3.8-6.9 3.8V5.1a.9.9 0 0 1 .9-.9Z" fill="currentColor"/></svg>`;
const BOOKMARK_OUTLINE = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 4.2h12a.9.9 0 0 1 .9.9v15.1l-6.9-3.8-6.9 3.8V5.1a.9.9 0 0 1 .9-.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
const ARROW_ICON = `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M5 10h9m0 0-3.4-3.4M14 10l-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// 앱 마크 (클로드 디자인 원본): 아침에 떠오른 이슈 = 상승하는 막대(트렌드) + 떠오르는 해(아침).
const APP_MARK = `<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
  <circle cx="8.6" cy="8.2" r="3" fill="currentColor" opacity=".5"/>
  <rect x="5.4" y="17" width="4.7" height="9" rx="1.9" fill="currentColor" opacity=".62"/>
  <rect x="13.65" y="13" width="4.7" height="13" rx="1.9" fill="currentColor" opacity=".82"/>
  <rect x="21.9" y="8.6" width="4.7" height="17.4" rx="1.9" fill="currentColor"/>
</svg>`;

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

export function renderShell({ dateString, savedCount, activeTab, staleDaysCount, attendance }) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">${APP_MARK}</span>
          <div class="brand-text">
            <h1>어제이슈</h1>
            <p>${escapeHtml(briefDateLabel(dateString))} · 오늘 대화에 나올 만한 뉴스</p>
          </div>
        </div>
        <button class="saved-chip ${activeTab === "saved" ? "is-active" : ""}" data-action="tab" data-tab="saved" type="button" aria-label="저장한 뉴스 보기">
          ${BOOKMARK_ICON}<span data-saved-count>${savedCount}</span>
        </button>
      </header>
      ${renderAttendance(attendance)}
      <nav class="tabs" aria-label="카테고리">
        ${TABS.filter((tab) => tab.id !== "saved").map((tab) => `
          <button class="tab ${activeTab === tab.id ? "is-active" : ""}" data-action="tab" data-tab="${tab.id}" type="button">${tab.label}</button>
        `).join("")}
      </nav>
      ${staleDaysCount >= 2 ? renderStaleBanner(dateString) : ""}
      <main id="content"></main>
      <footer class="app-foot">
        <p>요약은 원문 기사에서 추출한 문장입니다.<br>민감한 이슈는 원본에서 맥락을 확인해 주세요.</p>
      </footer>
    </div>
    <div id="sheet-root"></div>
  `;
}

function renderAttendance(attendance) {
  const checked = attendance?.checkedToday;
  return `
    <section class="attendance-card ${checked ? "is-checked" : ""}" aria-label="출석 체크">
      <div>
        <span class="attendance-kicker">${checked ? "오늘 출석 완료" : "오늘 브리핑 열람"}</span>
        <strong>${checked ? `${attendance.streak}일 연속 따라잡는 중` : "출석하고 이슈 감각 유지하기"}</strong>
      </div>
      <button class="attendance-btn" data-action="checkin" type="button" ${checked ? "disabled" : ""}>
        ${checked ? "완료" : "출석"}
      </button>
    </section>
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
    return `<div class="empty-state"><span class="empty-mark">${APP_MARK}</span><strong>오늘의 헤드라인이 아직 없어요</strong><p>잠시 후 다시 확인해 주세요.</p></div>`;
  }

  const [lead, ...rest] = headlines;
  const firstRows = rest.slice(0, 2);
  const laterRows = rest.slice(2);
  return `
    <section class="section headline-section">
      <div class="section-head">
        <strong>오늘 먼저 볼 ${headlines.length}개</strong>
        <span>밤사이 가장 많이 이야기된 이슈</span>
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
  return `
    <article class="lead-card cat-${item.category}" data-id="${escapeHtml(item.id)}">
      <button class="lead-main" data-action="open" data-id="${escapeHtml(item.id)}" type="button">
        ${renderArticleVisual(item, "lead")}
        <div class="lead-top">
          <span class="rank-badge">01</span>
          <span class="cat-label">${CATEGORY_LABELS[item.category] || ""}</span>
          <span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
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
  return `
    <article class="headline-row cat-${item.category}" data-id="${escapeHtml(item.id)}">
      <button class="row-main" data-action="open" data-id="${escapeHtml(item.id)}" type="button">
        ${renderArticleVisual(item, "row")}
        <span class="row-body">
          <span class="row-meta"><span class="rank">${rank}</span><span class="cat-label">${CATEGORY_LABELS[item.category] || ""}</span><span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span></span>
          <span class="row-title">${escapeHtml(item.title)}</span>
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
    return `<div class="empty-state"><span class="empty-mark">${APP_MARK}</span><strong>표시할 뉴스가 없어요</strong><p>잠시 후 다시 확인해 주세요.</p></div>`;
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
  return `
    <article class="issue-card cat-${item.category}" data-id="${escapeHtml(item.id)}">
      <button class="card-main" data-action="open" data-id="${escapeHtml(item.id)}" type="button">
        ${renderArticleVisual(item, "card")}
        <div class="card-copy">
          <div class="card-meta">
            <span class="cat-label">${CATEGORY_LABELS[item.category] || ""}</span>
            <span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
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

function renderArticleVisual(item, size) {
  const image = item.imageUrl || item.thumbnail || item.image || item.ogImage || "";
  const label = CATEGORY_LABELS[item.category] || "이슈";
  if (image) {
    // data-* 는 이미지 로드 실패 시 폴백으로 교체할 때 쓴다 (main.js의 error 핸들러).
    return `<span class="article-visual ${size}" data-size="${escapeHtml(size)}" data-label="${escapeHtml(label)}"><img src="${escapeHtml(image)}" alt="" loading="lazy"></span>`;
  }
  return articleVisualFallbackHtml(size, label);
}

export function articleVisualFallbackHtml(size, label) {
  return `
    <span class="article-visual ${escapeHtml(size)} is-fallback" aria-hidden="true">
      <span class="visual-bars"><i></i><i></i><i></i></span>
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

export function renderDetailSheet(item, saved) {
  const on = saved.has(item.id);
  const points = (item.points || []).filter(Boolean);

  return `
    <div class="sheet-backdrop" data-action="close">
      <section class="sheet cat-${item.category}" role="dialog" aria-modal="true" aria-label="뉴스 상세">
        <div class="sheet-handle" aria-hidden="true"></div>
        <button class="sheet-close" data-action="close" type="button" aria-label="닫기">×</button>
        ${renderArticleVisual(item, "sheet")}

        <div class="sheet-hero">
          <div class="card-meta">
            <span class="cat-label">${CATEGORY_LABELS[item.category] || ""}</span>
            <span class="meta-text">${escapeHtml(coverageLabel(item))} · ${timeLabel(item.publishedAt)}</span>
          </div>
          <h2>${escapeHtml(item.title)}</h2>
        </div>

        <div class="block primary-block">
          <span class="block-label">무슨 일?</span>
          ${item.summary
            ? `<p>${escapeHtml(item.summary)}</p>`
            : `<p class="muted">요약이 제공되지 않는 기사입니다. 원본 뉴스에서 내용을 확인해 주세요.</p>`}
        </div>

        ${item.why ? `
          <div class="block">
            <span class="block-label">왜 중요해?</span>
            <p>${escapeHtml(item.why)}</p>
          </div>
        ` : ""}

        ${points.length ? `
          <div class="block">
            <span class="block-label">핵심 포인트</span>
            <ul class="block-points">
              ${points.map((p) => `<li><span class="pt-dot" aria-hidden="true"></span><span>${escapeHtml(p)}</span></li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${(item.keywords || []).length ? `
          <div class="tags sheet-tags">${item.keywords.map((k) => `<span>#${escapeHtml(k)}</span>`).join("")}</div>
        ` : ""}

        ${item.sensitivity && item.sensitivity !== "낮음" ? `
          <p class="sheet-caution">민감한 이슈입니다. 판단하기 전에 원문과 추가 보도를 함께 확인해 주세요.</p>
        ` : ""}

        ${renderAdSlot("sheet")}

        <div class="signal-grid is-bottom">
          ${renderHeatMetric(item)}
          ${renderSensitivityMetric(item)}
        </div>

        <div class="sheet-actions">
          <button class="sheet-save ${on ? "is-on" : ""}" data-action="save" data-id="${escapeHtml(item.id)}" type="button" aria-pressed="${on}">
            ${on ? `${BOOKMARK_ICON} 저장됨` : `${BOOKMARK_OUTLINE} 저장`}
          </button>
          <a class="sheet-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            원본 뉴스 보기 ${ARROW_ICON}
          </a>
        </div>
      </section>
    </div>
  `;
}

function renderAdSlot(placement) {
  if (!import.meta.env.DEV) return "";
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

function renderHeatMetric(item) {
  const pct = heatPct(item.heat);
  return `
    <div class="metric-card metric-heat">
      <span class="metric-label">주목도</span>
      <strong>${heatLabel(item.heat)}</strong>
      <span class="heat-track lg"><span class="heat-fill" style="width:${pct}%"></span></span>
      <small>100점 만점에 ${Number(item.heat || 0)}점</small>
    </div>
  `;
}

function renderSensitivityMetric(item) {
  const sensitivity = item.sensitivity || "낮음";
  const cls = sensitivityClass(sensitivity);
  return `
    <div class="metric-card metric-sens sens-${cls}">
      <span class="metric-label">민감도</span>
      <strong><i class="sens-dot" aria-hidden="true"></i>${escapeHtml(sensitivity)}</strong>
      <span class="sens-scale" aria-hidden="true">
        <i class="${cls === "low" || cls === "mid" || cls === "high" ? "on" : ""}"></i>
        <i class="${cls === "mid" || cls === "high" ? "on" : ""}"></i>
        <i class="${cls === "high" ? "on" : ""}"></i>
      </span>
      <small>${sensitivityHint(sensitivity)}</small>
    </div>
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

function sensitivityHint(value = "낮음") {
  if (value === "높음") return "원문 확인 필수";
  if (value === "중간") return "맥락 확인 권장";
  return "일반 이슈";
}
