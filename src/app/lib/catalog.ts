import { getProductBySlug, getProducts, type ApiProduct } from "./api";

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  category: string;
  categorySlugs: string[];
  categoryNames: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  size: string;
  gender: string;
  stock: number;
  inStock: boolean;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
};

function fromApi(items: ApiProduct[]) {
  const splitNotes = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return items.map((p) => {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.old_price ? Number(p.old_price) : undefined,
      rating: 4.8,
      reviews: 0,
      image: (p.images && p.images.length > 0 ? p.images[0] : p.image_url),
      images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
      category: p.category?.name ?? "General",
      categorySlugs: Array.from(new Set([p.category?.slug, ...(p.categories ?? []).map((c) => c.slug)].filter(Boolean) as string[])),
      categoryNames: Array.from(new Set([p.category?.name, ...(p.categories ?? []).map((c) => c.name)].filter(Boolean) as string[])),
      isNewArrival: Boolean(p.is_new_arrival),
      isBestSeller: Boolean(p.is_best_seller),
      size: `${p.volume_ml ?? 100}ml`,
      gender: p.gender ?? "uniseks",
      stock: p.stock,
      inStock: p.stock > 0,
      notes: {
        top: splitNotes(p.top_notes),
        heart: splitNotes(p.heart_notes),
        base: splitNotes(p.base_notes),
      },
    } satisfies CatalogProduct;
  });
}

export async function loadCatalogProducts(): Promise<CatalogProduct[]> {
  const apiProducts = await getProducts();
  return fromApi(apiProducts);
}

export async function loadCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const apiProduct = await getProductBySlug(slug);
  return fromApi([apiProduct])[0] ?? null;
}
