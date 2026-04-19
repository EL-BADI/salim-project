import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) return null;

    const cats = [
      { name: "Electronics", slug: "electronics", description: "Gadgets and devices" },
      { name: "Clothing", slug: "clothing", description: "Fashion and apparel" },
      { name: "Books", slug: "books", description: "Books and literature" },
      { name: "Home & Garden", slug: "home-garden", description: "Home improvement and decor" },
      { name: "Sports", slug: "sports", description: "Sports and outdoor equipment" },
    ];

    for (const cat of cats) {
      await ctx.db.insert("categories", cat);
    }
    return null;
  },
});
