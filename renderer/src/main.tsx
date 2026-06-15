import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { HomeFeed } from "./components/HomeFeed";
import { CardNewsStory } from "./components/CardNewsStory";
import { REVIEW_QUEUE_CARDS } from "./reviewQueue";
import type { Category } from "./types";
import "./styles.css";

function App() {
  const [activeCategory, setActiveCategory] = useState<"전체" | Category>("전체");
  const [openId, setOpenId] = useState<string | null>(null);

  const cards = useMemo(
    () =>
      REVIEW_QUEUE_CARDS
        .filter((card) => activeCategory === "전체" || card.category === activeCategory)
        .sort((a, b) => a.rank - b.rank),
    [activeCategory]
  );
  const openCard = REVIEW_QUEUE_CARDS.find((card) => card.id === openId) ?? null;

  return (
    <div className="phone">
      <HomeFeed
        cards={cards}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onOpen={setOpenId}
      />
      <CardNewsStory card={openCard} onClose={() => setOpenId(null)} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
