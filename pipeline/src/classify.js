import { CATEGORIES } from "./config.js";

// 카테고리 분류: 키워드 점수 - 타 카테고리 감점.
// 점수가 모두 약하면 수집 쿼리의 카테고리(rawCategory)를 유지하되 fitScore를 낮게 남겨서
// 선별 단계에서 후순위로 밀리게 한다.
export function classifyNews(items) {
  return items.map((item) => {
    const text = `${item.title} ${item.description || ""}`;
    const forcedCategory = forceCategory(text);
    let best = { id: item.rawCategory || "", score: 0 };

    for (const category of CATEGORIES) {
      const positive = category.keywords.reduce(
        (sum, word) => sum + (text.includes(word) ? weight(word) : 0), 0
      );
      const negative = category.negative.reduce(
        (sum, word) => sum + (text.includes(word) ? 4 : 0), 0
      );
      const rawBoost = category.id === item.rawCategory ? 2 : 0;
      const score = positive + rawBoost - negative;
      if (score > best.score) best = { id: category.id, score };
    }

    return {
      ...item,
      // RSS처럼 수집 단서가 없는 기사가 어떤 키워드에도 안 걸리면 사회로 보낸다.
      category: forcedCategory || best.id || "society",
      categoryFit: forcedCategory ? Math.max(6, best.score) : best.score
    };
  });
}

function forceCategory(text) {
  if (/(물에 빠져|익사|숨져|사망|화재|큰 불|교통사고|실종)/.test(text)) return "society";
  return "";
}

function weight(word) {
  return word.length >= 4 ? 3 : 2;
}
