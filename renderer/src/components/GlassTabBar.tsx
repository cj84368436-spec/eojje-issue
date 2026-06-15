import { Bookmark, Flame, Home, UserRound } from "lucide-react";

export function GlassTabBar() {
  return (
    <nav className="tabbar" aria-label="하단 내비게이션">
      <button className="tab on" type="button"><Home className="ti" strokeWidth={2.2} />홈</button>
      <button className="tab" type="button"><Bookmark className="ti" strokeWidth={2.2} />저장</button>
      <button className="tab" type="button"><Flame className="ti" strokeWidth={2.2} />랭킹</button>
      <button className="tab" type="button"><UserRound className="ti" strokeWidth={2.2} />마이</button>
    </nav>
  );
}
