// @/lib/types/index.ts


export interface ImageAttributes {
  url: string;
  alt: string;
}
export interface ProductVariation {
  id: number;
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
  id: number;
  name: string;
  slug: string;
  productDiscount: number;
  categoryDiscount: number;
  images: ImageAttributes[];
  variations: ProductVariation[];
  category: { name: string; slug: string; categoryDiscount: number };
  priceBeforeDiscount?: {
    Per_m2: number;
    Price: number;
  } | null;
}

export interface UserAttributes {
  id?: number;
  username?: string;
  email?: string;
}

export type StrapiEntity<T> = {
  id: number;
  attributes: T;
};

export type StrapiCollectionResponse<T> = {
  data: StrapiEntity<T>[];
  meta?: unknown;
};

export type StrapiSingleResponse<T> = {
  data: StrapiEntity<T> | null;
  meta?: unknown;
};

export interface CartAttributes {
  uuid?: number | string;
  quantity: number;
  unit_price?: number | null;
  product?: StrapiEntity<Product> | null;
  metadata?: Record<string, unknown> | null;
  user?: StrapiEntity<UserAttributes> | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CartItem = StrapiEntity<CartAttributes>;
export type CartCollectionResponse = StrapiCollectionResponse<CartAttributes>;

export interface AddToCartBody {
  product: number | string;
  variation_id: number;
  quantity: number;
}

export interface UpdateCartBody {
  quantity?: number;
  unit_price?: number;
  metadata?: Record<string, unknown> | null;
}
export interface Address {
  id: number;
  label?: string;
  address?: string;
  city?: string;
  pincode?: string;
}
export interface UserDetails {
  id?: number;
  fullName?: string | null;
  profileImage?: ImageAttributes | null;
  phoneNumbers?: Array<{ phone?: string }>;
  savedAddresses?: Address[];
}

export interface AppUser {
  id: number;
  username?: string | null;
  email?: string | null;
  userDetails?: UserDetails | null;
}