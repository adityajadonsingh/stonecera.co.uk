const { createCoreController } = require("@strapi/strapi").factories;

/**
 * Predefined sets for filters that must always appear even when count = 0
 */
const ENUMS = {
  thickness: [
    "THICKNESS 12-20MM",
    "THICKNESS 15-25MM",
    "THICKNESS 18MM",
    "THICKNESS 20MM",
    "THICKNESS 22MM",
    "THICKNESS 25-35MM",
    "THICKNESS 25-45MM",
    "THICKNESS 30-40MM",
    "THICKNESS 35-50MM",
    "THICKNESS 35-55MM",
    "THICKNESS 68MM",
  ],
  size: [
    "SIZE 100X100",
    "SIZE 100X200",
    "SIZE 150X900",
    "SIZE 200X600",
    "SIZE 228X110",
    "SIZE 600X1200",
    "SIZE 600X150",
    "SIZE 600X600",
    "SIZE 600X900",
    "Mix Pack",
  ],
  colorTone: [
    "Beige",
    "Black",
    "Blue",
    "Bronze",
    "Brown",
    "Cream",
    "Golden",
    "Green",
    "Grey",
    "Mint",
    "Multi",
    "Red",
    "Silver",
    "White",
    "Yellow",
  ],
};

module.exports = createCoreController("api::category.category", ({ strapi }) => ({
  // /api/categories
  async customList(ctx) {
    const categories = await strapi.db.query("api::category.category").findMany({
      distinct: ["slug"],
      select: ["name", "slug"],
      populate: {
        images: { select: ["id", "url", "alternativeText"] },
      },
    });

    return categories.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      categoryDiscount: cat.categoryDiscount,
      images: cat.images
        ? cat.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alternativeText,
          }))
        : [],
    }));
  },

  // /api/category/:slug
  async customDetail(ctx) {
    const { slug } = ctx.params;
    const { price, colorTone, finish, thickness, size } = ctx.query;

    // 1️⃣ Parse filters
    const filters = {};
    if (price) {
      const [minPrice, maxPrice] = price.split("-").map(Number);
      filters.Price = { $gte: minPrice, $lte: maxPrice };
    }
    if (colorTone) filters["variation.ColorTone"] = colorTone.trim();
    if (finish) filters["variation.Finish"] = finish.trim();
    if (thickness) filters["variation.Thickness"] = thickness.trim();
    if (size) filters["variation.Size"] = size.trim();

    // 2️⃣ Fetch category with all products + variations
    const category = await strapi.db.query("api::category.category").findOne({
      where: { slug },
      populate: {
        images: { select: ["id", "url", "alternativeText"] },
        products: {
          select: ["name", "slug", "createdAt", "updatedAt", "productDiscount"],
          populate: {
            images: { select: ["id", "url", "alternativeText"] },
            variation: true,
          },
        },
        seo: true,
      },
    });

    if (!category) return ctx.notFound("Category not found");

    // 3️⃣ Prepare base filter counts
    const filterCounts = {
      price: {},
      colorTone: Object.fromEntries(ENUMS.colorTone.map((opt) => [opt, 0])),
      finish: {},
      thickness: Object.fromEntries(ENUMS.thickness.map((opt) => [opt, 0])),
      size: Object.fromEntries(ENUMS.size.map((opt) => [opt, 0])),
      pcs: {},
      packSize: {},
    };

    const priceRanges = [
      { label: "0-200", min: 0, max: 200 },
      { label: "200-300", min: 200, max: 300 },
      { label: "300-500", min: 300, max: 500 },
      { label: "500-1000", min: 500, max: 1000 },
      { label: "1000-2000", min: 1000, max: 2000 },
    ];
    priceRanges.forEach((r) => (filterCounts.price[r.label] = 0));

    // 4️⃣ Filter products by all active filters (used for display only)
    const filteredProducts = category.products
      .map((prod) => {
        const filteredVariations = prod.variation.filter((v) => {
          let match = true;
          if (filters.Price) {
            if (v.Price < filters.Price.$gte || v.Price > filters.Price.$lte)
              match = false;
          }
          if (
            filters["variation.ColorTone"] &&
            v.ColorTone !== filters["variation.ColorTone"]
          )
            match = false;
          if (
            filters["variation.Finish"] &&
            v.Finish !== filters["variation.Finish"]
          )
            match = false;
          if (
            filters["variation.Thickness"] &&
            v.Thickness !== filters["variation.Thickness"]
          )
            match = false;
          if (
            filters["variation.Size"] &&
            v.Size !== filters["variation.Size"]
          )
            match = false;
          return match;
        });
        return { ...prod, variation: filteredVariations };
      })
      .filter((prod) => prod.variation.length > 0);

    // helper to compute counts excluding one key (prevents self-filtering)
    const computeVisibleCount = (excludeKey) => {
      const active = Object.entries(filters).reduce((acc, [key, val]) => {
        if (key !== excludeKey) acc[key] = val;
        return acc;
      }, {});
      const subset = category.products
        .map((prod) => {
          const variations = prod.variation.filter((v) => {
            let match = true;
            if (active.Price && (v.Price < active.Price.$gte || v.Price > active.Price.$lte))
              match = false;
            if (
              active["variation.ColorTone"] &&
              v.ColorTone !== active["variation.ColorTone"]
            )
              match = false;
            if (
              active["variation.Finish"] &&
              v.Finish !== active["variation.Finish"]
            )
              match = false;
            if (
              active["variation.Thickness"] &&
              v.Thickness !== active["variation.Thickness"]
            )
              match = false;
            if (active["variation.Size"] && v.Size !== active["variation.Size"])
              match = false;
            return match;
          });
          return { ...prod, variation: variations };
        })
        .filter((prod) => prod.variation.length > 0);
      return subset;
    };

    // 5️⃣ Calculate counts independently per group
    // --- Price ---
    computeVisibleCount("Price").forEach((prod) => {
      prod.variation.forEach((v) => {
        if (v.Price != null) {
          for (const range of priceRanges) {
            if (v.Price >= range.min && v.Price < range.max)
              filterCounts.price[range.label] += 1;
          }
        }
      });
    });

    // --- ColorTone ---
    computeVisibleCount("variation.ColorTone").forEach((prod) => {
      prod.variation.forEach((v) => {
        if (v.ColorTone && filterCounts.colorTone[v.ColorTone] != null)
          filterCounts.colorTone[v.ColorTone] += 1;
      });
    });

    // --- Finish ---
    computeVisibleCount("variation.Finish").forEach((prod) => {
      prod.variation.forEach((v) => {
        if (v.Finish)
          filterCounts.finish[v.Finish] =
            (filterCounts.finish[v.Finish] || 0) + 1;
      });
    });

    // --- Thickness ---
    computeVisibleCount("variation.Thickness").forEach((prod) => {
      prod.variation.forEach((v) => {
        if (v.Thickness && filterCounts.thickness[v.Thickness] != null)
          filterCounts.thickness[v.Thickness] += 1;
      });
    });

    // --- Size ---
    computeVisibleCount("variation.Size").forEach((prod) => {
      prod.variation.forEach((v) => {
        if (v.Size && filterCounts.size[v.Size] != null)
          filterCounts.size[v.Size] += 1;
      });
    });

    // --- Pcs / PackSize (simple aggregate from filtered set)
    filteredProducts.forEach((prod) => {
      prod.variation.forEach((v) => {
        if (v.Pcs)
          filterCounts.pcs[String(v.Pcs)] =
            (filterCounts.pcs[String(v.Pcs)] || 0) + 1;
        if (v.PackSize)
          filterCounts.packSize[String(v.PackSize)] =
            (filterCounts.packSize[String(v.PackSize)] || 0) + 1;
      });
    });

    // 6️⃣ Pagination (limit + offset)
    const start = parseInt(ctx.query.offset || 0, 10);
    const limit = parseInt(ctx.query.limit || 12, 10);
    const paginatedProducts = filteredProducts.slice(start, start + limit);

    // 7️⃣ Build final response
    const productsResponse = paginatedProducts.map((prod) => {
      const v = prod.variation?.[0];
      return {
        variation: v
          ? {
              SKU: v.SKU,
              Thickness: v.Thickness,
              Size: v.Size,
              Finish: v.Finish,
              PackSize: v.PackSize,
              Pcs: v.Pcs,
              Stock: v.Stock,
              ColorTone: v.ColorTone,
              Price: v.Price,
            }
          : undefined,
        product: {
          name: prod.name,
          slug: prod.slug,
          productDiscount: prod.productDiscount,
          images:
            prod.images?.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alternativeText,
            })) ?? [],
          createdAt: prod.createdAt,
          updatedAt: prod.updatedAt,
        },
      };
    });

    // 8️⃣ Return response
    return {
      name: category.name,
      slug: category.slug,
      categoryDiscount: category.categoryDiscount,
      short_description: category.short_description,
      images: category.images?.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alternativeText,
      })),
      totalProducts: filteredProducts.length,
      products: productsResponse,
      seo: category.seo,
      filterCounts,
    };
  },
}));