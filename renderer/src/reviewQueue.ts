import reviewQueue from "../../pipeline/output/review-queue/card-news.json";
import type { CardNews } from "./types";

type ReviewQueuePayload = {
  version: number;
  generatedAt: string;
  items: CardNews[];
};

const payload = reviewQueue as ReviewQueuePayload;

export const REVIEW_QUEUE_CARDS: CardNews[] = payload.items;
export const REVIEW_QUEUE_GENERATED_AT = payload.generatedAt;
