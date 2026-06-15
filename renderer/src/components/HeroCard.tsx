import { attentionLabel, COLOR, GRAD, sensitivityClass } from "../tokens";
import type { CardNews } from "../types";
import { CategoryIcon } from "./CategoryIcon";

interface HeroCardProps {
  card: CardNews;
  onClick: () => void;
}

export function HeroCard({ card, onClick }: HeroCardProps) {
  return (
    <button
      className="hero reveal d2"
      type="button"
      onClick={onClick}
      style={{ background: GRAD[card.category] }}
      aria-label={`${card.cover.title} 카드뉴스 열기`}
    >
      <span className="hero-icon" aria-hidden="true">
        <CategoryIcon category={card.category} />
      </span>
      <span className="scrim" aria-hidden="true" />
      <span className="cap">
        <span className="badge">{card.rank}위 · {card.category} · 카드뉴스{card.needsReview ? " · 검수 전" : ""}</span>
        <h3>{card.cover.title}</h3>
        <span className="one">{card.summary.text}</span>
        <span className="hrow">
          <span className="lv" style={{ background: `${COLOR[card.category]}55` }}>주목 {attentionLabel(card.attention)}</span>
          <span className={`lv sens-${sensitivityClass(card.sensitivity)}`}>민감 {card.sensitivity}</span>
          <span className="tap">보기</span>
        </span>
      </span>
    </button>
  );
}
