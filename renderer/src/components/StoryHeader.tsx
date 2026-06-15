import { COLOR } from "../tokens";
import type { CardNews } from "../types";

interface StoryHeaderProps {
  card: CardNews;
  onClose: () => void;
}

export function StoryHeader({ card, onClose }: StoryHeaderProps) {
  return (
    <div className="story-top">
      <div className="who">
        <div className="av" style={{ background: COLOR[card.category] }} aria-hidden="true">{card.emoji}</div>
        <div>
          <div className="nm">{card.source.name}</div>
          <div className="tm">{card.category} · {card.rank}위 카드뉴스</div>
        </div>
      </div>
      <button className="story-x" type="button" onClick={onClose} aria-label="닫기">×</button>
    </div>
  );
}
