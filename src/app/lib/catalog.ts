import { perfumes } from "../data/perfumes";
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
  category: string;
  size: string;
  inStock: boolean;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
};

function fromLocal() {
  return perfumes.map((p) => ({
    id: p.id,
    slug: String(p.id),
    name: p.name,
    brand: p.brand,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating,
    reviews: p.reviews,
    image: p.image,
    category: p.category,
    size: p.size,
    inStock: p.inStock,
    notes: p.notes,
  }));
}

function fromApi(items: ApiProduct[]) {
  const localById = new Map(perfumes.map((p) => [p.id, p] as const));
  const localByName = new Map(perfumes.map((p) => [p.name.toLowerCase(), p] as const));

  return items.map((p) => {
    const local = localById.get(p.id) ?? localByName.get(p.name.toLowerCase());
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.old_price ? Number(p.old_price) : undefined,
      rating: local?.rating ?? 4.8,
      reviews: local?.reviews ?? 0,
      image: p.image_url,
      category: p.category?.name ?? "General",
      size: local?.size ?? "100ml",
      inStock: p.stock > 0,
      notes: local?.notes ?? { top: [], heart: [], base: [] },
    } satisfies CatalogProduct;
  });
}

export async function loadCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const apiProducts = await getProducts();
    if (!apiProducts.length) return fromLocal();
    return fromApi(apiProducts);
  } catch {
    return fromLocal();
  }
}

export async function loadCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const apiProduct = await getProductBySlug(slug);
    return fromApi([apiProduct])[0] ?? null;
  } catch {
    const local = fromLocal();
    return local.find((p) => p.slug === slug) ?? local.find((p) => String(p.id) === slug) ?? null;
  }
}
