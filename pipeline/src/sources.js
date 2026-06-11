// 언론사 도메인 -> 출처명 / 신뢰 등급.
// tier 1: 전국 단위 주요 매체, tier 2: 인지도 있는 매체, tier 3: 그 외 (지역/소규모).

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
  ["news1.kr", "뉴스1", 2],
  ["newsis.com", "뉴시스", 2],
  ["nocutnews.co.kr", "노컷뉴스", 2],
  ["newspim.com", "뉴스핌", 2],
  ["ohmynews.com", "오마이뉴스", 2],
  ["pressian.com", "프레시안", 2],
  ["mediatoday.co.kr", "미디어오늘", 2],
  ["sisain.co.kr", "시사IN", 2],
  ["hankyung.com", "한국경제", 1],
  ["biz.chosun.com", "조선비즈", 2],
  ["dt.co.kr", "디지털타임스", 2],
  ["zdnet.co.kr", "지디넷코리아", 2],
  ["bloter.net", "블로터", 2],
  ["sportsseoul.com", "스포츠서울", 2],
  ["sportschosun.com", "스포츠조선", 2],
  ["sportsdonga.com", "스포츠동아", 2],
  ["osen.co.kr", "OSEN", 2],
  ["xportsnews.com", "엑스포츠뉴스", 2],
  ["tvreport.co.kr", "TV리포트", 2],
  ["mydaily.co.kr", "마이데일리", 2],
  ["newsen.com", "뉴스엔", 2],
  ["tf.co.kr", "더팩트", 2],
  ["wikitree.co.kr", "위키트리", 3],
  ["insight.co.kr", "인사이트", 3],
  ["etoday.co.kr", "이투데이", 2],
  ["ajunews.com", "아주경제", 2],
  ["kukinews.com", "쿠키뉴스", 2],
  ["dailian.co.kr", "데일리안", 2],
  ["newdaily.co.kr", "뉴데일리", 3],
  ["breaknews.com", "브레이크뉴스", 3]
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

  // 모르는 매체: 등록 도메인의 첫 레이블을 이름으로 사용 (co.kr 같은 2단 TLD 처리).
  const parts = host.split(".");
  const secondLevelTlds = new Set(["co", "or", "go", "ne", "re", "pe", "ac"]);
  let base = parts.length >= 2 ? parts[parts.length - 2] : host;
  if (parts.length >= 3 && secondLevelTlds.has(base)) {
    base = parts[parts.length - 3];
  }
  return { name: base, tier: 3 };
}
