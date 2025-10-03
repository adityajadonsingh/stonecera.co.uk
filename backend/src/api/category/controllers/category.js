const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController("api::category.category", ({ strapi }) => ({
  // /api/categories
  async customList(ctx) {
    const categories = await strapi.db.query("api::category.category").findMany({
      select: ["name", "slug"],
      populate: {
        images: {
          select: ["id", "url", "alternativeText"],
        },
      },
    });

    return categories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      images: cat.images?.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.alternativeText,
      })),
    }));
  },

  // /api/category/:slug
  async customDetail(ctx) {
    const { slug } = ctx.params;
    const { price, colorTone, finish, thickness, size } = ctx.query; // Capture filter parameters

    let filters = {};
    let filterCounts = {
      price: {},
      colorTone: {},
      finish: {},
      thickness: {},
      size: {},
    };

    // Function to handle the filter for each field (handle single values for now)
    const handleSingleFilter = (filterValues) => {
      return filterValues ? filterValues.trim() : null;
    };

    // Apply filters only if values are provided in the query parameters
    if (price) {
      const [minPrice, maxPrice] = price.split('-').map(Number);
      filters.Price = { $gte: minPrice, $lte: maxPrice };
    }
    if (colorTone) {
      filters["variation.ColorTone"] = handleSingleFilter(colorTone); // Single value for colorTone
    }
    if (finish) {
      filters["variation.Finish"] = handleSingleFilter(finish); // Single value for finish
    }
    if (thickness) {
      filters["variation.Thickness"] = handleSingleFilter(thickness); // Single value for thickness
    }
    if (size) {
      filters["variation.Size"] = handleSingleFilter(size); // Single value for size
    }

    const category = await strapi.db.query("api::category.category").findOne({
      where: { slug },
      populate: {
        images: { select: ["id", "url", "alternativeText"] },
        products: {
          select: ["name", "slug"],
          populate: {
            images: { select: ["id", "url", "alternativeText"] },
            variation: true,
          },
        },
        seo: true,
      },
    });

    if (!category) {
      return ctx.notFound("Category not found");
    }

    // Filter the products based on the price filter and the provided filters
    const filteredProducts = category.products.filter(prod => {
      return prod.variation.some(variation => {
        let match = true;

        // Price filter check: Only include variations that match the price filter
        if (filters.Price && !(variation.Price >= filters.Price.$gte && variation.Price <= filters.Price.$lte)) {
          match = false;
        }

        // Apply other filters (colorTone, finish, thickness, size)
        if (filters["variation.ColorTone"] && filters["variation.ColorTone"] !== variation.ColorTone) {
          match = false;
        }
        if (filters["variation.Finish"] && filters["variation.Finish"] !== variation.Finish) {
          match = false;
        }
        if (filters["variation.Thickness"] && filters["variation.Thickness"] !== variation.Thickness) {
          match = false;
        }
        if (filters["variation.Size"] && filters["variation.Size"] !== variation.Size) {
          match = false;
        }

        return match;
      });
    });

    // Recalculate filter counts based on the filtered results
    filteredProducts.forEach(prod => {
      prod.variation.forEach(variation => {
        // Price filter count (only valid products within the price range)
        if (filters.Price && (variation.Price >= filters.Price.$gte && variation.Price <= filters.Price.$lte)) {
          const priceRange = `${Math.floor(variation.Price / 100) * 100}-${Math.floor(variation.Price / 100) * 100 + 100}`;
          filterCounts.price[priceRange] = (filterCounts.price[priceRange] || 0) + 1;
        }

        // ColorTone filter count
        if (!filters["variation.ColorTone"] || filters["variation.ColorTone"] === variation.ColorTone) {
          filterCounts.colorTone[variation.ColorTone] = (filterCounts.colorTone[variation.ColorTone] || 0) + 1;
        }

        // Finish filter count
        if (!filters["variation.Finish"] || filters["variation.Finish"] === variation.Finish) {
          filterCounts.finish[variation.Finish] = (filterCounts.finish[variation.Finish] || 0) + 1;
        }

        // Thickness filter count
        if (!filters["variation.Thickness"] || filters["variation.Thickness"] === variation.Thickness) {
          filterCounts.thickness[variation.Thickness] = (filterCounts.thickness[variation.Thickness] || 0) + 1;
        }

        // Size filter count
        if (!filters["variation.Size"] || filters["variation.Size"] === variation.Size) {
          filterCounts.size[variation.Size] = (filterCounts.size[variation.Size] || 0) + 1;
        }
      });
    });

    return {
      name: category.name,
      slug: category.slug,
      short_description: category.short_description,
      images: category.images?.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.alternativeText,
      })),
      products: filteredProducts.map(prod => {
        const variations = prod.variation || [];
        let chosenVariation = null;

        if (variations.length === 1) {
          chosenVariation = variations[0];
        } else if (variations.length > 1) {
          const available = variations.filter(v => v.Stock > 0);
          if (available.length > 0) {
            chosenVariation = available.reduce((min, v) => v.Price < min.Price ? v : min);
          } else {
            chosenVariation = variations[0];
          }
        }

        return {
          variation: {
            SKU: chosenVariation?.SKU,
            Thickness: chosenVariation?.Thickness,
            Size: chosenVariation?.Size,
            Finish: chosenVariation?.Finish,
            PackSize: chosenVariation?.PackSize,
            Pcs: chosenVariation?.Pcs,
            Stock: chosenVariation?.Stock,
            ColorTone: chosenVariation?.ColorTone,
            Price: chosenVariation?.Price,
          },
          product: {
            name: prod.name,
            slug: prod.slug,
            images: prod.images?.map(img => ({
              id: img.id,
              url: img.url,
              alt: img.alternativeText,
            })),
          },
        };
      }),
      seo: category.seo,
      filterCounts, // Send filter count data
    };
  },
}));
