
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const WEIGHTS = {
  view: 1,
  search: 2,
  cart_add: 3,
  purchase: 5,
} as const;

export const track = mutation({
  args: {
    productId: v.id("products"),
    type: v.union(
      v.literal("view"),
      v.literal("search"),
      v.literal("cart_add"),
      v.literal("purchase")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    await ctx.db.insert("interactions", {
      userId,
      productId: args.productId,
      type: args.type,
      weight: WEIGHTS[args.type],
      categoryId: product.categoryId,
      tags: product.tags,
    });
    return null;
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return interactions;
  },
});