import { Bell, Flame, Newspaper } from "lucide-react";

interface BentoHeaderProps {
  readCount: number;
  totalCount: number;
  streakDays: number;
}

export function BentoHeader({ readCount, totalCount, streakDays }: BentoHeaderProps) {
  const ratio = Math.max(0, Math.min(1, totalCount ? readCount / totalCount : 0));
  const dash = 119;
  const offset = dash - dash * ratio;

  return (
    <>
      <header className="head">
        <div className="head-top">
          <div className="brand">
            <div className="ic" aria-hidden="true"><Newspaper size={21} strokeWidth={2.2} /></div>
            <div>
              <h1>어제이슈</h1>
              <div className="date">6월 15일 월요일 · 조간 브리핑</div>
            </div>
          </div>
          <button className="bell" type="button" aria-label="알림"><Bell size={18} strokeWidth={2.2} /></button>
        </div>
      </header>

      <section className="bento reveal d1" aria-label="브리핑 상태">
        <div className="tile streak">
          <div className="lab">연속 출석</div>
          <div className="big">{streakDays}일째 <Flame size={22} strokeWidth={2.4} aria-hidden="true" /></div>
          <div className="sub">3일만 더! 14일 뱃지</div>
        </div>
        <div className="tile">
          <div className="lab today-label">오늘 브리핑</div>
          <div className="prog">
            <div className="ring" aria-label={`${totalCount}개 중 ${readCount}개 읽음`}>
              <svg width="46" height="46" aria-hidden="true">
                <circle cx="23" cy="23" r="19" fill="none" stroke="#EAECEF" strokeWidth="5" />
                <circle
                  cx="23"
                  cy="23"
                  r="19"
                  fill="none"
                  stroke="#FF3D6E"
                  strokeWidth="5"
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="pct">{readCount}/{totalCount}</div>
            </div>
            <div className="ptxt">
              <b>{readCount}개 읽음</b>
              <p>{Math.max(totalCount - readCount, 0)}개 더 보면<br />완료</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
