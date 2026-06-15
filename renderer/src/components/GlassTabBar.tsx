export function GlassTabBar() {
  return (
    <nav className="tabbar" aria-label="하단 내비게이션">
      <button className="tab on" type="button"><span className="ti">🏠</span>홈</button>
      <button className="tab" type="button"><span className="ti">🔖</span>저장</button>
      <button className="tab" type="button"><span className="ti">🔥</span>랭킹</button>
      <button className="tab" type="button"><span className="ti">👤</span>마이</button>
    </nav>
  );
}
