const PUBLISHERS = [
  ["yna.co.kr", "연합뉴스", 1],
  ["yonhapnewstv.co.kr", "연합뉴스TV", 1],
  ["kbs.co.kr", "KBS", 1],
  ["imbc.com", "MBC", 1],
  ["sbs.co.kr", "SBS", 1],
  ["ytn.co.kr", "YTN", 1],
  ["jtbc.co.kr", "JTBC", 1],
  ["chosun.com", "조선일보", 1],
  ["joongang.co.kr", "중앙일보", 1],
  ["donga.com", "동아일보", 1],
  ["hani.co.kr", "한겨레", 1],
  ["khan.co.kr", "경향신문", 1],
  ["hankookilbo.com", "한국일보", 1],
  ["seoul.co.kr", "서울신문", 1],
  ["kmib.co.kr", "국민일보", 1],
  ["segye.com", "세계일보", 1],
  ["munhwa.com", "문화일보", 1],
  ["mk.co.kr", "매일경제", 1],
  ["hankyung.com", "한국경제", 1],
  ["sedaily.com", "서울경제", 1],
  ["mt.co.kr", "머니투데이", 2],
  ["edaily.co.kr", "이데일리", 2],
  ["fnnews.com", "파이낸셜뉴스", 2],
  ["heraldcorp.com", "헤럴드경제", 2],
  ["asiae.co.kr", "아시아경제", 2],
  ["etnews.com", "전자신문", 2],
  ["zdnet.co.kr", "지디넷코리아", 2],
  ["bloter.net", "블로터", 2],
  ["news1.kr", "뉴스1", 2],
  ["newsis.com", "뉴시스", 2],
  ["nocutnews.co.kr", "노컷뉴스", 2],
  ["sportsseoul.com", "스포츠서울", 2],
  ["sportschosun.com", "스포츠조선", 2],
  ["osen.co.kr", "OSEN", 2],
  ["xportsnews.com", "엑스포츠뉴스", 2],
  ["tvreport.co.kr", "TV리포트", 2],
  ["newsen.com", "뉴스엔", 2],
  ["wikitree.co.kr", "위키트리", 3],
  ["insight.co.kr", "인사이트", 3]
];

export function resolveSource(url = "") {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return { name: "출처 미상", tier: 4 };
  }

  for (const [domain, name, tier] of PUBLISHERS) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return { name, tier };
    }
  }

  const parts = host.split(".");
  const secondLevelTlds = new Set(["co", "or", "go", "ne", "re", "pe", "ac"]);
  let base = parts.length >= 2 ? parts[parts.length - 2] : host;
  if (parts.length >= 3 && secondLevelTlds.has(base)) {
    base = parts[parts.length - 3];
  }
  return { name: base, tier: 3 };
}
