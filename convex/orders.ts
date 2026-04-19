import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const order = await ctx.db.get(args.id);
    if (!order || order.userId !== userId) return null;
    return order;
  },
});

export const place = mutation({
  args: {
    shippingAddress: v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) throw new Error("Cart is empty");

    const items = [];
    let subtotal = 0;
    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      items.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      });
      subtotal += product.price * item.quantity;
    }

    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + shipping;

    const orderId = await ctx.db.insert("orders", {
      userId,
      status: "processing",
      items,
      subtotal,
      shipping,
      total,
      shippingAddress: args.shippingAddress,
    });

    // Clear cart
    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    // Record purchase interactions
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      await ctx.db.insert("interactions", {
        userId,
        productId: item.productId,
        type: "purchase",
        weight: 5,
        categoryId: product.categoryId,
        tags: product.tags,
      });
    }

    return orderId;
  },
});
