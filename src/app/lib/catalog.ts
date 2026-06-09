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
  variants: Array<{
    id: number;
    variantType: string;
    label: string;
    sizeMl: number | null;
    price: number;
    stock: number;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
  }>;
  defaultVariant: {
    id: number | null;
    variantType: string;
    label: string;
    sizeMl: number | null;
    price: number;
    stock: number;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
  };
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
    const variants = (p.variants ?? []).map((variant) => ({
      id: variant.id,
      variantType: variant.variant_type,
      label: variant.label,
      sizeMl: variant.size_ml,
      price: Number(variant.price),
      stock: variant.stock,
      imageUrl: variant.image_url,
      isActive: variant.is_active,
      sortOrder: variant.sort_order,
    }));
    const defaultVariant = p.default_variant
      ? {
          id: p.default_variant.id,
          variantType: p.default_variant.variant_type,
          label: p.default_variant.label,
          sizeMl: p.default_variant.size_ml,
          price: Number(p.default_variant.price),
          stock: p.default_variant.stock,
          imageUrl: p.default_variant.image_url,
          isActive: p.default_variant.is_active,
          sortOrder: p.default_variant.sort_order,
        }
      : {
          id: null,
          variantType: "premium",
          label: "Premium",
          sizeMl: p.volume_ml ?? 100,
          price: Number(p.price),
          stock: p.stock,
          imageUrl: p.image_url,
          isActive: true,
          sortOrder: 0,
        };
    const defaultImage =
      defaultVariant.imageUrl || (p.images && p.images.length > 0 ? p.images[0] : p.image_url);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      description: p.description,
      price: defaultVariant.price,
      originalPrice: p.old_price ? Number(p.old_price) : undefined,
      rating: Number(p.rating ?? 0),
      reviews: p.review_count ?? 0,
      image: defaultImage,
      images: p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
      category: p.category?.name ?? "General",
      categorySlugs: Array.from(
        new Set(
          [p.category?.slug, ...(p.categories ?? []).map((c) => c.slug)].filter(Boolean) as string[]
        )
      ),
      categoryNames: Array.from(
        new Set(
          [p.category?.name, ...(p.categories ?? []).map((c) => c.name)].filter(Boolean) as string[]
        )
      ),
      isNewArrival: Boolean(p.is_new_arrival),
      isBestSeller: Boolean(p.is_best_seller),
      size: `${p.volume_ml ?? 100}ml`,
      gender: p.gender ?? "uniseks",
      stock: p.stock,
      inStock: defaultVariant.stock > 0 || variants.some((variant) => variant.stock > 0),
      variants,
      defaultVariant,
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
