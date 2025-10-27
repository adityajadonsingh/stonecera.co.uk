// backend/src/api/cart/controllers/cart.js

module.exports = {
  // POST /api/cart/add
  async add(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("You must be logged in");

    const { product: productId, variation_id, quantity = 1 } = ctx.request.body ?? {};

    if (!productId || (variation_id === undefined || variation_id === null)) {
      return ctx.badRequest("product and variation_id are required");
    }

    // Fetch product with variations
    const product = await strapi.entityService.findOne("api::product.product", productId, {
      populate: { variation: true, images: true },
    });
    if (!product) return ctx.badRequest("Product not found");

    // Find the variation within this product by id (uuid numeric or id)
    const variation = (product.variation || []).find((v) => String(v.uuid ?? v.id) === String(variation_id));
    if (!variation) return ctx.badRequest("Variation not found for this product");

    // Compute unit price server-side from Per_m2 * PackSize (rounded to 2 decimals)
    const per = Number(variation.Per_m2 || 0);
    const pack = Number(variation.PackSize || 0);
    const unitPrice = per && pack ? Number((per * pack).toFixed(2)) : 0;

    // Check if cart item already exists (same user + variation)
    const existing = await strapi.entityService.findMany("api::cart.cart", {
      filters: { user: user.id, uuid: String(variation_id) },
      limit: 1,
    });

    if (existing && existing.length > 0) {
      const item = existing[0];
      const newQty = Number(item.quantity || 0) + Number(quantity || 1);
      const updated = await strapi.entityService.update("api::cart.cart", item.id, {
        data: { quantity: newQty },
      });
      return ctx.send(updated);
    }

    // Create new cart item
    const created = await strapi.entityService.create("api::cart.cart", {
      data: {
        user: user.id,
        uuid: Number(variation_id), 
        quantity: Number(quantity),
        unit_price: unitPrice,
        product: productId,
        metadata: {
          productName: product.name,
          productImage: product.images?.[0]?.url ?? null,
          sku: variation.SKU ?? null,
        },
      },
    });

    return ctx.send(created);
  },

  // GET /api/cart
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const items = await strapi.entityService.findMany("api::cart.cart", {
      filters: { user: user.id },
      populate: { product: { populate: ["images"] } },
    });

    return ctx.send(items);
  },

  // PUT /api/cart/:id -> update quantity
  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;
    const { quantity } = ctx.request.body ?? {};

    if (quantity === undefined) return ctx.badRequest("quantity required");

    const item = await strapi.entityService.findOne("api::cart.cart", id, { populate: ["user"] });
    if (!item) return ctx.notFound("Cart item not found");
    if (String(item.user?.id) !== String(user.id)) return ctx.unauthorized("Not your cart item");

    const updated = await strapi.entityService.update("api::cart.cart", id, {
      data: { quantity: Number(quantity) },
    });

    return ctx.send(updated);
  },

  // DELETE /api/cart/:id
  async remove(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;
    const item = await strapi.entityService.findOne("api::cart.cart", id, { populate: ["user"] });
    if (!item) return ctx.notFound("Cart item not found");
    if (String(item.user?.id) !== String(user.id)) return ctx.unauthorized("Not your cart item");

    await strapi.entityService.delete("api::cart.cart", id);
    return ctx.send({ ok: true });
  },
};