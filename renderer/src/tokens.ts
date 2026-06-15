import type { Category } from "./types";

export const CATEGORIES: Array<"전체" | Category> = ["전체", "정치", "경제", "사회", "문화", "연예"];

export const GRAD: Record<Category, string> = {
  정치: "linear-gradient(160deg,#FF5A78,#B5123F)",
  경제: "linear-gradient(160deg,#1FDE9E,#089268)",
  사회: "linear-gradient(160deg,#5BA0FF,#2059C9)",
  문화: "linear-gradient(160deg,#AD78FF,#6B2FD6)",
  연예: "linear-gradient(160deg,#FFA24D,#E85D04)"
};

export const COLOR: Record<Category, string> = {
  정치: "#FF3D6E",
  경제: "#0FC98A",
  사회: "#3D87FF",
  문화: "#9B5CFF",
  연예: "#FF8A2B"
};

export function attentionLabel(attention: number): string {
  if (attention >= 90) return "최상위";
  if (attention >= 75) return "높음";
  return "보통";
}

export function sensitivityClass(value: string): string {
  if (value === "높음") return "high";
  if (value === "중간") return "mid";
  return "low";
}
