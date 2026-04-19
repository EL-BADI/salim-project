import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const getForUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 8;

    // Get cached recommendations
    const cached = await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (cached && Date.now() - cached.updatedAt < 3600000) {
      // Use cache if less than 1 hour old
      const products = await Promise.all(
        cached.productIds.slice(0, limit).map((id) => ctx.db.get(id)),
      );
      return products.filter(Boolean);
    }

    // Return trending if no cache
    return await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

export const generateForUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const limit = 20;

    // Get cached recommendations
    const cached = await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Generate new recommendations
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (interactions.length === 0) {
      return null;
    }

    // Calculate category and tag preferences
    const categoryScores: Record<string, number> = {};
    const tagScores: Record<string, number> = {};
    const viewedProducts = new Set<string>();

    for (const interaction of interactions) {
      viewedProducts.add(interaction.productId);
      const catId = interaction.categoryId as string;
      categoryScores[catId] = (categoryScores[catId] ?? 0) + interaction.weight;

      for (const tag of interaction.tags) {
        tagScores[tag] = (tagScores[tag] ?? 0) + interaction.weight;
      }
    }

    // Get all active products
    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Score products
    const scored = allProducts
      .filter((p) => !viewedProducts.has(p._id))
      .map((p) => {
        let score = 0;
        const catId = p.categoryId as string;
        score += categoryScores[catId] ?? 0;
        for (const tag of p.tags) {
          score += tagScores[tag] ?? 0;
        }
        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const recommendedProducts = scored.map((s) => s.product);
    const productIds = recommendedProducts.map((p) => p._id);

    // Cache recommendations
    if (cached) {
      await ctx.db.patch(cached._id, {
        productIds,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("recommendations", {
        userId,
        productIds,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const generateForAllUsers = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.runMutation(api.recommendations.generateForUser, {
        userId: user._id,
      });
    }
    return null;
  },
});
