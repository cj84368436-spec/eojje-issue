export type Sensitivity = "낮음" | "중간" | "높음";
export type Category = "정치" | "경제" | "사회" | "문화" | "연예";

export interface CardNews {
  id: string;
  category: Category;
  source: { name: string; url: string };
  rank: number;
  attention: number;
  sensitivity: Sensitivity;
  needsReview?: boolean;
  createdAt?: string;
  cover: { title: string };
  what: { lines: [string, string, string] };
  points: [string, string, string];
  number: { value: string; caption: string };
  keywords: [string, string, string];
  summary: { text: string };
}
