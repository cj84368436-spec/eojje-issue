import { IssueListItem } from "./IssueListItem";
import type { CardNews } from "../types";

interface IssueListProps {
  cards: CardNews[];
  onOpen: (id: string) => void;
}

export function IssueList({ cards, onOpen }: IssueListProps) {
  return (
    <section className="list reveal d3" aria-label="이슈 목록">
      {cards.map((card) => (
        <IssueListItem key={card.id} card={card} onClick={() => onOpen(card.id)} />
      ))}
    </section>
  );
}
