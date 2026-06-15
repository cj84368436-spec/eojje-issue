import { Bookmark } from "lucide-react";
import type { CardNews } from "../types";

interface StorySlideProps {
  card: CardNews;
  slideIndex: number;
  active: boolean;
}

export function StorySlide({ card, slideIndex, active }: StorySlideProps) {
  const cls = `slide ${active ? "on" : ""} ${slideIndex === 4 ? "final" : ""}`;

  if (slideIndex === 0) {
    return (
      <article className={cls} aria-hidden={!active}>
        <span className="stag">{card.category} · 카드뉴스</span>
        <h2>{card.cover.title}</h2>
        <p className="src3">{card.source.name} · 원문 기반 요약</p>
      </article>
    );
  }

  if (slideIndex === 1) {
    return (
      <article className={cls} aria-hidden={!active}>
        <span className="stag">무슨 일이에요?</span>
        <div className="what">
          <p>{card.what.lines[0]}</p>
          <p>{card.what.lines[1]}</p>
          <p><span className="hl">{card.what.lines[2]}</span></p>
        </div>
      </article>
    );
  }

  if (slideIndex === 2) {
    return (
      <article className={cls} aria-hidden={!active}>
        <span className="stag">핵심 포인트 3</span>
        <div className="pts">
          {card.points.map((point, index) => (
            <div className="pt" key={point}>
              <span className="no">{index + 1}</span>
              <p>{point}</p>
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (slideIndex === 3) {
    return (
      <article className={cls} aria-hidden={!active}>
        <span className="stag">숫자로 보기</span>
        <div className="statnum">{card.number.value}</div>
        <p className="statcap">{card.number.caption}</p>
        <div className="kws">
          {card.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
        </div>
      </article>
    );
  }

  return (
    <article className={cls} aria-hidden={!active}>
      <span className="stag">한 줄 정리</span>
      <h2>{card.summary.text}</h2>
      <div className="acts">
        <button className="save" type="button"><Bookmark size={17} strokeWidth={2.2} />저장</button>
        <a className="orig" href={card.source.url} target="_blank" rel="noreferrer">원문 보기 →</a>
      </div>
    </article>
  );
}
