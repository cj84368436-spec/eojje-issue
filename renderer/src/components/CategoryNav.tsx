import { CATEGORIES, COLOR } from "../tokens";
import type { Category } from "../types";

interface CategoryNavProps {
  active: "전체" | Category;
  onChange: (category: "전체" | Category) => void;
}

export function CategoryNav({ active, onChange }: CategoryNavProps) {
  return (
    <nav className="nav" aria-label="카테고리">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          className={`chip ${active === category ? "on" : ""}`}
          type="button"
          onClick={() => onChange(category)}
        >
          {category !== "전체" && <span className="cd" style={{ background: COLOR[category] }} />}
          {category}
        </button>
      ))}
    </nav>
  );
}
