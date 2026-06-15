import { BentoHeader } from "./BentoHeader";
import { CategoryNav } from "./CategoryNav";
import { GlassTabBar } from "./GlassTabBar";
import { HeroCard } from "./HeroCard";
import { IssueList } from "./IssueList";
import type { CardNews, Category } from "../types";

interface HomeFeedProps {
  cards: CardNews[];
  activeCategory: "전체" | Category;
  onCategoryChange: (category: "전체" | Category) => void;
  onOpen: (id: string) => void;
}

export function HomeFeed({ cards, activeCategory, onCategoryChange, onOpen }: HomeFeedProps) {
  const [hero, ...rest] = cards;

  return (
    <main className="screen" aria-label="어제이슈 홈 피드">
      <BentoHeader readCount={2} totalCount={5} streakDays={7} />
      <CategoryNav active={activeCategory} onChange={onCategoryChange} />

      <section className="sec">
        <h2>밤사이 많이 본 이슈</h2>
        <span>탭해서 카드뉴스로 보기</span>
      </section>

      {hero ? (
        <>
          <HeroCard card={hero} onClick={() => onOpen(hero.id)} />
          <IssueList cards={rest} onOpen={onOpen} />
        </>
      ) : (
        <div className="empty-feed">
          <strong>이 카테고리 카드뉴스가 아직 없어요</strong>
          <p>다른 카테고리를 선택해 주세요.</p>
        </div>
      )}

      <GlassTabBar />
    </main>
  );
}
