# Release Readiness

Last checked: 2026-06-29

## Decision

- Local release candidate: `GO`
- External release / user launch: `HOLD`

The local app bundle, local data, pipeline checks, card-news safety checks, and production builds pass the current release gate. The external launch is still blocked because the deployed GitHub Pages data at `https://cj84368436-spec.github.io/eojje-issue/today-news.json` is stale or below quality bar.

## Local Validation

- Collected 811 raw items, deduplicated to 724 candidates.
- Published data has 30 core articles: politics 6, economy 6, society 6, culture 6, entertainment 6.
- AI category is hidden because there are fewer than 6 usable AI items.
- Empty summaries: 0.
- Title-summary mismatches: 0.
- Sentence fragments, duplicate card text, sports leakage, columns/opinion leakage: 0.
- Detailed story-card contract passed for 30 articles and 74 detail slides.
- 1/2/3 card duplicate regression: 0 failures.
- Pipeline contract, selection contract, TypeScript checks: passed.
- Card-news API safety and corrupt review-queue regression: passed.
- App data contract, UI contract, story contract: passed.
- Vite production build: passed.
- AIT build: passed.
- AIT bundle: `app/eojje-issue.ait`
- AIT size: 3,725,356 bytes.
- AIT deployment ID: `019f0ed2-ae20-7b03-84c8-5bea7268f9d7`.

## Remote Validation Blocker

`npm run validate:remote` currently fails against the deployed Pages JSON.

Remote snapshot:

- URL: `https://cj84368436-spec.github.io/eojje-issue/today-news.json`
- Date: `2026-06-28`
- generatedAt: `2026-06-27T23:50:57.146Z`
- Headline count: 5
- Category counts: politics 5, economy 5, society 5, culture 5, entertainment 5
- Total published articles: 25

Remote quality failures:

- Each core category has only 5 items; release gate requires 6.
- Empty summaries: 5.
- Invalid sentence: 1.
- Invalid points: 15.
- Summary/point duplicates: 1.
- Title-summary mismatches: 6.
- Duplicate suspects: 2.

Conclusion: the live data URL must not be treated as launch-ready until GitHub Actions reruns with the current pipeline and `npm run validate:remote` passes.

## Issues Fixed In This Pass

- Limited culture movie articles to a maximum of 2.
- Excluded articles that repeat the same issue as headlines when building the recap.
- Required concrete subject/date/action wording for summaries.
- Added golf/KPGA/KLPGA/PGA to the sports filter.
- Excluded columns and personal opinion pieces.
- Repaired summaries with missing subjects.
- Removed empty opening text, beginner guide filler, and unnatural connectors.
- Fixed range-number errors such as `27~8` by preserving units.
- Blocked unknown categories and headline/item category mismatches in remote JSON.
- Restricted detail-card category classes and CSS variable values to known categories.
- Made card-news review queue writes atomic and fail-closed on corrupted JSON.
- Added CI coverage for card-news safety and app production build.
- Added `daily-news` deployment-gate coverage for card-news safety.

## Remaining Launch Steps

1. Commit the current changes.
2. Push to the remote repository.
3. Let GitHub Actions `ci` pass.
4. Rerun GitHub Actions `daily-news` so Pages receives a fresh `today-news.json`.
5. Run `pipeline` `npm run validate:remote` against the deployed URL.
6. Review `npm audit --omit=dev` output. Current count is 57 vulnerabilities: critical 1, high 12, moderate 30, low 14.
7. Upload `app/eojje-issue.ait` to the App in Toss console.
8. Verify category list, detail cards, save action, and source links on a real device by QR.
9. Submit for review.

## Security Risk Memo

`npm audit --omit=dev` reports vulnerabilities mainly through the `@apps-in-toss/web-framework`, `@granite-js/*`, Fastify, and React Native CLI dependency chain. This appears closer to framework/build-chain risk than direct app business-code exposure, but automated `npm audit fix` is deferred because it can break App in Toss SDK compatibility. Before final submission, reinstall or upgrade to the latest App in Toss recommended SDK set, then rerun `npm run check && npm run build`.

## Environment Note

Local browser-server verification can be blocked by the Codex desktop execution sandbox. When that happens, use production build and contract tests as the release gate, then verify the deployed URL and real-device QR flow outside the sandbox.
