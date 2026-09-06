import assert from "node:assert/strict";
import { buildRecoveryPlan } from "./src/recovery.js";

const complete = {
  politics: Array(6),
  economy: Array(6),
  society: Array(6),
  culture: Array(6),
  entertainment: Array(6),
  ai: []
};

assert.equal(
  buildRecoveryPlan(complete),
  null,
  "필수 카테고리가 모두 6개면 추가 수집을 하면 안 됩니다."
);

const shortage = {
  ...complete,
  economy: Array(4),
  entertainment: Array(5)
};

const plan = buildRecoveryPlan(shortage);
assert.deepEqual(
  plan.categoryIds,
  ["economy", "entertainment"],
  "6개 미만인 필수 카테고리만 복구 대상으로 선택해야 합니다."
);
assert.equal(plan.freshHours, 72, "복구 수집은 최대 72시간 범위로 일시 확장해야 합니다.");

const optionalOnly = {
  ...complete,
  ai: Array(2)
};
assert.equal(
  buildRecoveryPlan(optionalOnly),
  null,
  "선택 카테고리인 AI 부족만으로 복구 수집이나 실패를 유발하면 안 됩니다."
);

console.log(JSON.stringify({ ok: true, recoveryCategories: plan.categoryIds }, null, 2));
