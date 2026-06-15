import { useEffect, useState } from "react";
import { GRAD } from "../tokens";
import type { CardNews } from "../types";
import { ProgressBars } from "./ProgressBars";
import { StoryHeader } from "./StoryHeader";
import { StorySlide } from "./StorySlide";

interface CardNewsStoryProps {
  card: CardNews | null;
  onClose: () => void;
}

const SLIDE_COUNT = 5;

export function CardNewsStory({ card, onClose }: CardNewsStoryProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (card) setIndex(0);
  }, [card?.id]);

  useEffect(() => {
    if (!card) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, index]);

  if (!card) return <section className="story" aria-hidden="true" />;

  function goPrev() {
    setIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setIndex((current) => {
      if (current >= SLIDE_COUNT - 1) {
        onClose();
        return current;
      }
      return current + 1;
    });
  }

  return (
    <section
      className="story on"
      style={{ background: GRAD[card.category] }}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.cover.title} 카드뉴스`}
    >
      <ProgressBars activeIndex={index} total={SLIDE_COUNT} />
      <StoryHeader card={card} onClose={onClose} />
      {card.sensitivity === "높음" && (
        <div className="sensitive-banner in-story">민감한 이슈예요. 원문과 함께 확인해 주세요</div>
      )}

      <div className="stage">
        {Array.from({ length: SLIDE_COUNT }, (_, slideIndex) => (
          <StorySlide
            key={slideIndex}
            card={card}
            slideIndex={slideIndex}
            active={index === slideIndex}
          />
        ))}
      </div>

      <div className="nav-zone" aria-hidden="true">
        <button className="z prev" type="button" onClick={goPrev} tabIndex={-1} />
        <button className="z next" type="button" onClick={goNext} tabIndex={-1} />
      </div>
      <div className="hint">왼쪽 탭 이전 · 오른쪽 탭 다음</div>
    </section>
  );
}
