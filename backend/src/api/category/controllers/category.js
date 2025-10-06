const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::category.category", ({ strapi }) => ({
  // /api/categories
  async customList(ctx) {
    const categories = await strapi.db.query("api::category.category").findMany({
      distinct: ["slug"],
      select: ["name", "slug"],
      populate: {
        images: {
          select: ["id", "url", "alternativeText"],
        },
      },
    });

    return categories.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
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

    const filters = {};
    if (price) {
      const [minPrice, maxPrice] = price.split("-").map(Number);
      filters.Price = { $gte: minPrice, $lte: maxPrice };
    }
    if (colorTone) filters["variation.ColorTone"] = colorTone.trim();
    if (finish) filters["variation.Finish"] = finish.trim();
    if (thickness) filters["variation.Thickness"] = thickness.trim();
    if (size) filters["variation.Size"] = size.trim();

    // ✅ 1. Fetch category with all products and variations (for counts and filtering)
    const category = await strapi.db.query("api::category.category").findOne({
      where: { slug },
      populate: {
        images: { select: ["id", "url", "alternativeText"] },
        products: {
          select: ["name", "slug"],
          populate: {
            images: { select: ["id", "url", "alternativeText"] },
            variation: true, // fetch all variations
          },
        },
        seo: true,
      },
    });

    if (!category) return ctx.notFound("Category not found");

    // ✅ 2. Build filter counts using *all* variations (independent of active filters)
    const filterCounts = {
      price: {},
      colorTone: {},
      finish: {},
      thickness: {},
      size: {},
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

    category.products.forEach((prod) => {
      prod.variation.forEach((variation) => {
        const { Price, ColorTone, Finish, Thickness, Size, Pcs, PackSize } = variation;

        // Price range counts
        if (Price != null) {
          for (const range of priceRanges) {
            if (Price >= range.min && Price < range.max) {
              filterCounts.price[range.label] = (filterCounts.price[range.label] || 0) + 1;
              break;
            }
          }
        }

        if (ColorTone)
          filterCounts.colorTone[ColorTone] =
            (filterCounts.colorTone[ColorTone] || 0) + 1;

        if (Finish)
          filterCounts.finish[Finish] =
            (filterCounts.finish[Finish] || 0) + 1;

        if (Thickness)
          filterCounts.thickness[Thickness] =
            (filterCounts.thickness[Thickness] || 0) + 1;

        if (Size)
          filterCounts.size[Size] =
            (filterCounts.size[Size] || 0) + 1;

        if (Pcs)
          filterCounts.pcs[String(Pcs)] =
            (filterCounts.pcs[String(Pcs)] || 0) + 1;

        if (PackSize)
          filterCounts.packSize[String(PackSize)] =
            (filterCounts.packSize[String(PackSize)] || 0) + 1;
      });
    });

    // ✅ 3. Filter products based on active filters (for visible results)
    const filteredProducts = category.products
      .map((prod) => {
        const filteredVariations = prod.variation.filter((variation) => {
          let match = true;

          if (filters.Price) {
            if (
              variation.Price < filters.Price.$gte ||
              variation.Price > filters.Price.$lte
            ) {
              match = false;
            }
          }

          if (
            filters["variation.ColorTone"] &&
            variation.ColorTone !== filters["variation.ColorTone"]
          )
            match = false;

          if (
            filters["variation.Finish"] &&
            variation.Finish !== filters["variation.Finish"]
          )
            match = false;

          if (
            filters["variation.Thickness"] &&
            variation.Thickness !== filters["variation.Thickness"]
          )
            match = false;

          if (
            filters["variation.Size"] &&
            variation.Size !== filters["variation.Size"]
          )
            match = false;

          return match;
        });

        return { ...prod, variation: filteredVariations };
      })
      .filter((prod) => prod.variation.length > 0);

    // ✅ 4. Prepare clean response structure
    return {
      name: category.name,
      slug: category.slug,
      short_description: category.short_description,
      images: category.images?.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alternativeText,
      })),
      products: filteredProducts.map((prod) => {
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
            images:
              prod.images?.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alternativeText,
              })) ?? [],
          },
        };
      }),
      seo: category.seo,
      filterCounts,
    };
  },
}));