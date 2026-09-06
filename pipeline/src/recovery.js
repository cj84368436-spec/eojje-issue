import { CATEGORIES, ITEMS_PER_CATEGORY } from "./config.js";

export const RECOVERY_FRESH_HOURS = 72;

export function buildRecoveryPlan(categories) {
  const categoryIds = CATEGORIES
    .filter((category) => !category.optional)
    .filter((category) => (categories?.[category.id] || []).length < ITEMS_PER_CATEGORY)
    .map((category) => category.id);

  if (categoryIds.length === 0) return null;

  return {
    categoryIds,
    freshHours: RECOVERY_FRESH_HOURS
  };
}

export function mergeCollectedItems(primaryItems = [], recoveryItems = []) {
  const byUrl = new Map();
  for (const item of [...primaryItems, ...recoveryItems]) {
    const key = item?.sourceUrl || item?.id;
    if (!key || byUrl.has(key)) continue;
    byUrl.set(key, item);
  }
  return [...byUrl.values()];
}
