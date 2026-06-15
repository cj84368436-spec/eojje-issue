import type { CardNews } from "./types";

export const MOCK: CardNews[] = [
  {
    id: "1",
    category: "정치",
    source: { name: "노컷뉴스", url: "https://example.com/1" },
    rank: 1,
    attention: 98,
    sensitivity: "중간",
    emoji: "🗳️",
    cover: { title: "李 대통령, '부정선거론' 정면 비판" },
    what: { lines: ["이재명 대통령이 부정선거론 확산을", "\"국민 모욕\"이라며", "강하게 비판했어요"] },
    points: ["14일 순방 중 발언", "선거 조작설은 본질 왜곡", "국민 목소리 모욕하는 행태"],
    number: { value: "1위", caption: "밤사이 주목도 최상위" },
    keywords: ["#부정선거론", "#반사회적", "#李대통령"],
    summary: { text: "대통령이 부정선거론에 공개적으로 선을 그었어요." }
  },
  {
    id: "2",
    category: "경제",
    source: { name: "동아일보", url: "https://example.com/2" },
    rank: 2,
    attention: 95,
    sensitivity: "낮음",
    emoji: "📈",
    cover: { title: "코스피 급등, 매수 사이드카 발동" },
    what: { lines: ["코스피가 빠르게 오르면서", "과열을 막는", "매수 사이드카가 발동됐어요"] },
    points: ["지수 8,506선 돌파", "전일 대비 +383p", "프로그램 매수 일시 중단"],
    number: { value: "+383", caption: "하루 만에 오른 지수(포인트)" },
    keywords: ["#코스피", "#사이드카", "#증시과열"],
    summary: { text: "증시 과열로 안전장치가 작동했어요." }
  },
  {
    id: "3",
    category: "사회",
    source: { name: "동아일보", url: "https://example.com/3" },
    rank: 3,
    attention: 86,
    sensitivity: "낮음",
    emoji: "⚽",
    cover: { title: "이강인, 스승과 '사제 대결'" },
    what: { lines: ["이강인이 마요르카 시절 스승이던", "아기레 감독과", "적으로 맞붙게 됐어요"] },
    points: ["이강인, 현재 PSG 미드필더", "아기레, 멕시코 대표팀 감독", "과거 사제 → 이번엔 상대팀"],
    number: { value: "86점", caption: "100점 만점 주목도" },
    keywords: ["#사제대결", "#이강인", "#아기레"],
    summary: { text: "스승과 제자가 그라운드에서 다시 만나요." }
  }
];
