import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products;
    if (args.categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    if (args.search) {
      const term = args.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return results.filter(Boolean);
  },
});

export const getTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;
    // Get products with most interactions
    const interactions = await ctx.db.query("interactions").collect();
    const counts: Record<string, number> = {};
    for (const i of interactions) {
      const key = i.productId as string;
      counts[key] = (counts[key] ?? 0) + i.weight;
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (sorted.length === 0) {
      // fallback: just return newest active products
      return await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(limit);
    }

    const products = await Promise.all(sorted.map((id) => ctx.db.get(id as any)));
    return products.filter(Boolean);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    tags: v.array(v.string()),
    imageUrl: v.string(),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
      rating: 4.0 + Math.random(),
      reviewCount: Math.floor(Math.random() * 200) + 5,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    stock: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return null;
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").collect();
    if (existing.length > 0) return null;

    const categories = await ctx.db.query("categories").collect();
    if (categories.length === 0) return null;

    const catMap: Record<string, any> = {};
    for (const c of categories) {
      catMap[c.slug] = c._id;
    }

    const products = [
      // Electronics
      { name: "Wireless Noise-Cancelling Headphones", slug: "wireless-headphones", description: "Premium over-ear headphones with 30-hour battery life and active noise cancellation. Perfect for travel and work.", price: 299.99, compareAtPrice: 399.99, categoryId: catMap["electronics"], tags: ["audio", "wireless", "noise-cancelling"], imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", stock: 45 },
      { name: "Smart Watch Pro", slug: "smart-watch-pro", description: "Feature-packed smartwatch with health monitoring, GPS, and 7-day battery life.", price: 249.99, compareAtPrice: 329.99, categoryId: catMap["electronics"], tags: ["wearable", "fitness", "smart"], imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", stock: 30 },
      { name: "4K Portable Projector", slug: "4k-projector", description: "Compact 4K projector with built-in speakers. Stream movies anywhere.", price: 449.99, categoryId: catMap["electronics"], tags: ["projector", "4k", "portable"], imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop", stock: 15 },
      { name: "Mechanical Keyboard", slug: "mechanical-keyboard", description: "Tactile mechanical keyboard with RGB backlighting and programmable keys.", price: 129.99, compareAtPrice: 159.99, categoryId: catMap["electronics"], tags: ["keyboard", "gaming", "mechanical"], imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop", stock: 60 },
      { name: "Wireless Charging Pad", slug: "wireless-charger", description: "Fast 15W wireless charging pad compatible with all Qi-enabled devices.", price: 39.99, categoryId: catMap["electronics"], tags: ["charging", "wireless", "accessories"], imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop", stock: 100 },
      { name: "Bluetooth Speaker", slug: "bluetooth-speaker", description: "Waterproof portable speaker with 360° sound and 24-hour battery.", price: 89.99, compareAtPrice: 119.99, categoryId: catMap["electronics"], tags: ["audio", "bluetooth", "portable"], imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop", stock: 55 },

      // Clothing
      { name: "Premium Cotton T-Shirt", slug: "premium-tshirt", description: "Ultra-soft 100% organic cotton t-shirt. Available in 12 colors.", price: 34.99, categoryId: catMap["clothing"], tags: ["casual", "cotton", "basics"], imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", stock: 200 },
      { name: "Slim Fit Chinos", slug: "slim-chinos", description: "Versatile slim-fit chinos perfect for office or casual wear.", price: 69.99, compareAtPrice: 89.99, categoryId: catMap["clothing"], tags: ["pants", "casual", "office"], imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop", stock: 80 },
      { name: "Merino Wool Sweater", slug: "merino-sweater", description: "Luxuriously soft merino wool sweater. Warm yet breathable.", price: 119.99, categoryId: catMap["clothing"], tags: ["sweater", "wool", "winter"], imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop", stock: 40 },
      { name: "Running Shoes", slug: "running-shoes", description: "Lightweight performance running shoes with responsive cushioning.", price: 149.99, compareAtPrice: 179.99, categoryId: catMap["clothing"], tags: ["shoes", "running", "sports"], imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", stock: 70 },

      // Books
      { name: "The Art of Clean Code", slug: "art-of-clean-code", description: "A practical guide to writing maintainable, readable, and efficient code.", price: 39.99, categoryId: catMap["books"], tags: ["programming", "software", "technical"], imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop", stock: 150 },
      { name: "Deep Work", slug: "deep-work", description: "Rules for focused success in a distracted world by Cal Newport.", price: 16.99, compareAtPrice: 24.99, categoryId: catMap["books"], tags: ["productivity", "focus", "self-help"], imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop", stock: 200 },
      { name: "Atomic Habits", slug: "atomic-habits", description: "An easy and proven way to build good habits and break bad ones.", price: 18.99, categoryId: catMap["books"], tags: ["habits", "self-help", "productivity"], imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop", stock: 180 },

      // Home & Garden
      { name: "Ceramic Pour-Over Coffee Set", slug: "pour-over-coffee", description: "Handcrafted ceramic pour-over dripper with matching carafe. Brews the perfect cup.", price: 64.99, categoryId: catMap["home-garden"], tags: ["coffee", "kitchen", "ceramic"], imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop", stock: 35 },
      { name: "Indoor Plant Collection", slug: "indoor-plants", description: "Curated set of 3 low-maintenance indoor plants with decorative pots.", price: 49.99, compareAtPrice: 69.99, categoryId: catMap["home-garden"], tags: ["plants", "decor", "indoor"], imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop", stock: 25 },
      { name: "Bamboo Cutting Board Set", slug: "bamboo-cutting-boards", description: "Set of 3 eco-friendly bamboo cutting boards in different sizes.", price: 44.99, categoryId: catMap["home-garden"], tags: ["kitchen", "bamboo", "eco"], imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop", stock: 60 },

      // Sports
      { name: "Yoga Mat Premium", slug: "yoga-mat", description: "Non-slip 6mm thick yoga mat with alignment lines. Eco-friendly material.", price: 79.99, compareAtPrice: 99.99, categoryId: catMap["sports"], tags: ["yoga", "fitness", "mat"], imageUrl: "https://images.unsplash.com/photo-1601925228008-f5e4c5e5e5e5?w=400&h=400&fit=crop", stock: 90 },
      { name: "Adjustable Dumbbells", slug: "adjustable-dumbbells", description: "Space-saving adjustable dumbbells from 5-52.5 lbs. Replace 15 sets of weights.", price: 349.99, compareAtPrice: 429.99, categoryId: catMap["sports"], tags: ["weights", "fitness", "home-gym"], imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop", stock: 20 },
      { name: "Resistance Bands Set", slug: "resistance-bands", description: "Set of 5 resistance bands with different tension levels. Includes carry bag.", price: 29.99, categoryId: catMap["sports"], tags: ["fitness", "bands", "portable"], imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop", stock: 120 },
    ];

    for (const p of products) {
      await ctx.db.insert("products", {
        ...p,
        isActive: true,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 300) + 10,
      });
    }
    return null;
  },
});
