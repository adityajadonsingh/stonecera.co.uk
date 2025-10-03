interface ImageAttributes {
  url: string;
  alternativeText: string;
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
