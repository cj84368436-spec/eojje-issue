import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { HomeFeed } from "./components/HomeFeed";
import { CardNewsStory } from "./components/CardNewsStory";
import { MOCK } from "./mock";
import type { Category } from "./types";
import "./styles.css";

function App() {
  const [activeCategory, setActiveCategory] = useState<"전체" | Category>("전체");
  const [openId, setOpenId] = useState<string | null>(null);

  const cards = useMemo(
    () =>
      MOCK
        .filter((card) => activeCategory === "전체" || card.category === activeCategory)
        .sort((a, b) => a.rank - b.rank),
    [activeCategory]
  );
  const openCard = MOCK.find((card) => card.id === openId) ?? null;

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
