import {
  ChartNoAxesColumnIncreasing,
  Landmark,
  Mic2,
  Palette,
  UsersRound
} from "lucide-react";
import type { Category } from "../types";

interface CategoryIconProps {
  category: Category;
  className?: string;
}

const ICONS = {
  정치: Landmark,
  경제: ChartNoAxesColumnIncreasing,
  사회: UsersRound,
  문화: Palette,
  연예: Mic2
} satisfies Record<Category, typeof Landmark>;

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = ICONS[category];
  return <Icon className={className} strokeWidth={2.2} aria-hidden="true" />;
}
