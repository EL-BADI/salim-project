# Product Recommendations — How they work (for the client)

This document explains how the current product recommendation pipeline (implemented in `convex/recommendations.ts`) works, which user behaviors it captures, why it is promising, and what you should realistically expect.

## Where the logic lives

- Main files: `convex/recommendations.ts`
- Key functions:
  - `getForUser(args)` — public query used by the app to fetch recommendations for the signed-in user.
  - `generateForUser()` — mutation that computes and caches recommendations for a user.

## High-level flow

1. getForUser
   - Checks the `recommendations` table for a cached record keyed by `userId` (index: `by_user`).
   - If a cached entry exists and is fresh (updatedAt within 1 hour), it loads the product documents for the cached `productIds` and returns them (default limit: 8).
   - If no valid cache exists, it falls back to returning the top active/trending products (query `products` with `isActive === true`, ordered, take `limit`).

2. generateForUser (mutation)
   - Reads all the user's `interactions` (index: `by_user`). If there are no interactions, it returns `null` and leaves the cache alone.
   - Builds per-category and per-tag scores by summing `interaction.weight` for each category and tag encountered.
   - Loads all active products and computes a score per product: score = categoryScore[product.categoryId] + sum(tagScores for product.tags).
   - Filters out products the user has already interacted with (viewedProducts), sorts by score, selects the top N (currently 20), and writes the ordered `productIds` into the `recommendations` record for that user with `updatedAt = Date.now()` (insert or patch).
   - Note: `generateForUser` is a write-only mutation that updates the cache and returns `null` — the cached results are consumed by `getForUser` later.

## Data signals used

- Interactions table: the system relies on `interaction.weight`, `productId`, `categoryId`, and `tags` to compute preferences.
- Product metadata: `categoryId`, `tags`, and `isActive` are used to build candidate lists and scoring.
- Recommendations table: per-user cached ordered list of `productIds` plus `updatedAt` timestamp.

## Caching, TTL and limits

- Cache TTL: 1 hour (the code checks `Date.now() - cached.updatedAt < 3600000`).
- Read-time limit: `getForUser` accepts an optional `limit` (default 8) to control how many items are returned. `generateForUser` computes up to 20 items and caches them.
- Fallback: when there are no cached results or cache is stale, `getForUser` returns trending/active products.

## Behaviors you should expect

- Personalization: recommendations reflect categories and tags the user has interacted with, weighted by interaction strength.
- Cold start: new users (no interactions) will see trending/active products until interactions accumulate.
- Latency: reads are fast because they typically return cached product IDs; writes (generation) can be heavier because they iterate over product candidates.
- Staleness: updates from new interactions will appear after `generateForUser` runs and the 1-hour TTL elapses, unless you trigger regeneration sooner.

## What's promising about this approach

- Simplicity and interpretability: scores are easy to reason about (category/tag additive scoring), which makes debugging and tuning straightforward.
- Low read latency via per-user cache: serving recommendations is fast for the client.
- Uses existing product metadata (categories/tags) — no additional data modeling required to start improving relevance.
- Safe fallback: users always see trending active products if personalization data is missing.

## Main limitations & things to watch for

- Basic algorithm: it's a simple content-based scorer (category + tags). It does not use collaborative signals, embeddings, or advanced ML.
- Scalability: `generateForUser` currently calls `collect()` on all active products. For large catalogs this will be slow / memory-intensive.
- Staleness & availability:
  - Cached `productIds` are not re-validated for `isActive` at read time in the current `getForUser` path (the code maps `productIds` -> `ctx.db.get(id)` and only filters nulls). If a product is deactivated after caching it may still be returned until the cache is regenerated.
  - New interactions may not show up immediately because of the 1-hour TTL unless you run generation more often or trigger it on events.
- Diversity & user experience: scoring favors high-scoring categories/tags and may produce narrow results (low diversity / serendipity).

## Recommended next steps (prioritized)

1. Quick fixes (low effort, high impact):
   - Filter cached results by `isActive` when returning items from cache (skip products where `isActive !== true`).
   - Ensure `generateForUser` only caches active product IDs (it already queries active products, but add defensive checks).

2. Triggering and scheduling:
   - Run `generateForUser` after high-signal events (purchase, add-to-cart) or add a scheduled job (cron) to refresh recommendations for active users.
   - Prefer background execution (actions / cron) so generation work doesn't block front-end flows.

3. Scalability improvements:
   - Avoid collecting the entire products table: narrow candidates (e.g., products in the user's top categories), sample candidates, or precompute product vectors.
   - Consider an ANN (embedding) approach or a lightweight collaborative filter for stronger personalization at scale.

4. Product & UX improvements:
   - Mix popularity + personalization (e.g., top 3 trending + top 5 personalized) to balance novelty and relevance.
   - Add deduplication, diversity heuristics, and freshness/time-decay for interaction weights.

5. Measurement & iteration:
   - Instrument impressions, clicks, add-to-cart, purchases attributable to recommended items and run A/B tests to quantify lift.
   - Track cache hit rate, generation time, and recommendation-to-conversion funnel.

## Short rollout expectations

- Immediate: measurable personalization for users with several interactions (category/tag signals).
- Within days: small CTR/conversion gains for returning users if you trigger generation on purchases or key events.
- Long term: to achieve larger lifts, add collaborative signals, embeddings, or hybrid models and invest in candidate generation and instrumentation.

---

If you'd like, I can implement the quick fixes now (filter cached items by `isActive`, add a cron or background job to regenerate, and avoid collecting the entire products table). Tell me which improvements to prioritize.
