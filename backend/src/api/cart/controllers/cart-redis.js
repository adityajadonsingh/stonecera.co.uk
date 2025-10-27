// backend/src/api/cart/controllers/cart-redis.js
"use strict";
const redisService = require("../../../utils/redis");

module.exports = {
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("You must be logged in");

    const client = await redisService.connect();
    const key = `cart:user:${user.id}`;

    const cached = await client.get(key);
    if (cached) {
      return ctx.send(JSON.parse(cached));
    }

    // fallback: load DB cart items if any
    const items = await strapi.entityService.findMany("api::cart.cart", {
      filters: { user: user.id },
      populate: { product: { populate: ["images"] } },
    });

    await client.set(key, JSON.stringify(items), { EX: 60 * 60 }); // cache 1 h
    return ctx.send(items);
  },

  async add(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("You must be logged in");

    const client = await redisService.connect();
    const { product, variation_id, quantity } = ctx.request.body ?? {};
    if (!product || !variation_id) return ctx.badRequest("Missing product or variation_id");

    const key = `cart:user:${user.id}`;
    const cached = await client.get(key);
    const cart = cached ? JSON.parse(cached) : [];

    const existing = cart.find((c) => c.variation_id === variation_id);
    if (existing) existing.quantity += Number(quantity || 1);
    else cart.push({ product, variation_id, quantity: Number(quantity || 1) });

    await client.set(key, JSON.stringify(cart), { EX: 60 * 60 });
    ctx.send({ ok: true, cart });
  },

  async clear(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("You must be logged in");

    const client = await redisService.connect();
    const key = `cart:user:${user.id}`;
    await client.del(key);
    ctx.send({ ok: true });
  },
};