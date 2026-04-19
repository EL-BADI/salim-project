import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    tags: v.array(v.string()),
    imageUrl: v.string(),
    stock: v.number(),
    isActive: v.boolean(),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_active", ["isActive"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        imageUrl: v.string(),
      })
    ),
    subtotal: v.number(),
    shipping: v.number(),
    total: v.number(),
    shippingAddress: v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
    }),
  }).index("by_user", ["userId"]),

  // Interaction tracking for recommendations
  interactions: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    type: v.union(
      v.literal("view"),
      v.literal("search"),
      v.literal("cart_add"),
      v.literal("purchase")
    ),
    weight: v.number(), // view=1, search=2, cart_add=3, purchase=5
    categoryId: v.id("categories"),
    tags: v.array(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_and_product", ["userId", "productId"])
    .index("by_user_and_type", ["userId", "type"]),

  // Cached recommendations per user
  recommendations: defineTable({
    userId: v.id("users"),
    productIds: v.array(v.id("products")),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
