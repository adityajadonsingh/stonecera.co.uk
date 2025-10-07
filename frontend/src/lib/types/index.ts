interface ImageAttributes {
  url: string;
  alt: string;
}
interface ProductVariation {
  SKU: string;
  Thickness: string;
  Size: string;
  Finish: string;
  PackSize: number;
  Pcs: number;
  Stock: number;
  ColorTone: string;
  Price: number;
  Per_m2: number;
}

export interface Category {
  name: string;
  slug: string;
  categoryDiscount: number;
  short_description: string;
  images: ImageAttributes[];
  products: CategoryProduct[];
  totalProducts: number;
  filterCounts?: FilterCounts;
}

export interface CategoryProduct {
  variation: ProductVariation;
  product: Product;
  priceBeforeDiscount?: {
    Per_m2: number;
    Price: number;
  } | null;
}

export interface FilterCounts {
  price: Record<string, number>;
  colorTone: Record<string, number>;
  finish: Record<string, number>;
  thickness: Record<string, number>;
  size: Record<string, number>;
  pcs: Record<string, number>;
  packSize: Record<string, number>;
}

export interface Product {
  name: string;
  slug: string;
  productDiscount: number;
  categoryDiscount: number;
  images: ImageAttributes[];
}
