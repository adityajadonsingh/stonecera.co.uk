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
}

export interface Category {
  name: string;
  slug: string;
  short_description: string;
  images: ImageAttributes[];
  products: CategoryProduct[];
  filterCounts?: FilterCounts;
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
export interface CategoryProduct {
  variation: ProductVariation;
  product: Product;
}
export interface Product {
  name: string;
  slug: string;
  images: ImageAttributes[];
}
