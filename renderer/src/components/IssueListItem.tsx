import { attentionLabel, COLOR, GRAD, sensitivityClass } from "../tokens";
import type { CardNews } from "../types";
import { CategoryIcon } from "./CategoryIcon";

interface IssueListItemProps {
  card: CardNews;
  onClick: () => void;
}

export function IssueListItem({ card, onClick }: IssueListItemProps) {
  const sensitivity = sensitivityClass(card.sensitivity);

  return (
    <button className="item" type="button" onClick={onClick}>
      <span className="thumb" style={{ background: GRAD[card.category] }} aria-hidden="true">
        <CategoryIcon category={card.category} />
      </span>
      <span className="meta">
        <span className="tl">
          <span className="rkno">{card.rank}</span>
          <span className="pill" style={{ background: COLOR[card.category] }}>{card.category}</span>
          {card.needsReview && <span className="review-pill">검수 전</span>}
          <span className="src">{card.source.name}</span>
        </span>
        <h4>{card.cover.title}</h4>
        <span className="foot">
          <span className="mbar" aria-hidden="true">
            <span style={{ width: `${card.attention}%`, background: COLOR[card.category] }} />
          </span>
          <span className="attn" style={{ color: COLOR[card.category] }}>{attentionLabel(card.attention)}</span>
          <span className={`sdot ${sensitivity}`}><i />민감 {card.sensitivity}</span>
        </span>
      </span>
    </button>
  );
}
