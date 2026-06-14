import { Link } from "react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useI18n } from "../i18n";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";
import { noteChipClass, noteToAz } from "../lib/noteMeta";

/**
 * Normalized view-model for a catalog product card. Callers adapt their own
 * product shape (CatalogProduct, ApiProduct, …) into this so the card stays
 * purely presentational and context-specific logic (badges, favourite/cart
 * wiring) lives with the caller.
 */
export interface ProductCardData {
  id: number;
  slug: string;
  name: string;
  /** Secondary line under the name — typically the brand. */
  secondary: string;
  image: string;
  price: number;
  oldPrice?: number | null;
  rating: number;
  reviews: number;
  inStock: boolean;
  /** Raw note keys (English) — the card translates + colour-codes them. */
  notes: string[];
  /**
   * Badges to overlay on the image, highest priority first (caller caps the count).
   * Each: localized label + style class ("badge-sale" | "badge-new" | "badge-best").
   */
  badges: Array<{ label: string; className: string }>;
}

type ProductCardProps = {
  data: ProductCardData;
  /** "grid" = compact catalog card (default), "featured" = larger hero card. */
  variant?: "grid" | "featured";
  isFavorite: boolean;
  pulseFav: boolean;
  pulseCart: boolean;
  onToggleFav: () => void;
  onAddToCart: () => void;
};

export function ProductCard({
  data,
  variant = "grid",
  isFavorite,
  pulseFav,
  pulseCart,
  onToggleFav,
  onAddToCart,
}: ProductCardProps) {
  const { t } = useI18n();
  const featured = variant === "featured";
  const notes = data.notes.slice(0, featured ? 3 : 2);

  return (
    <div
      className={`premium-card glass rounded-3xl overflow-hidden group relative ${
        featured ? "min-w-[260px] sm:min-w-[300px] lg:min-w-[340px] md:min-w-0" : ""
      }`}
    >
      <Link to={`/product/${data.slug}`} aria-label={data.name} className="absolute inset-0 z-10" />
      <div className="aspect-square relative overflow-hidden">
        <img
          src={data.image}
          alt={data.name}
          onError={onImageError}
          className="zoom-img w-full h-full object-cover"
        />
        {featured && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          aria-label={isFavorite ? t("a11y.unfavorite") : t("a11y.favorite")}
          aria-pressed={isFavorite}
          className={`absolute z-20 rounded-full glass flex items-center justify-center hover:border-gold transition-all ${
            featured ? "top-4 left-4 w-9 h-9" : "top-3 left-3 w-8 h-8"
          }`}
        >
          <Heart
            className={`${featured ? "w-4 h-4" : "w-3.5 h-3.5"} ${
              isFavorite ? "fill-red-500 text-red-500" : "text-white"
            } ${pulseFav ? "scale-125" : ""} transition-transform`}
          />
        </button>
        {data.badges.length > 0 && (
          <div
            className={`pointer-events-none absolute z-20 flex flex-col items-end gap-1.5 ${
              featured ? "top-4 right-4" : "top-3 right-3"
            }`}
          >
            {data.badges.map((b) => (
              <span
                key={b.className}
                className={`badge-lux ${b.className} rounded-full text-[10px] ${
                  featured ? "px-3 py-1.5" : "px-2.5 py-1"
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={featured ? "p-5" : "p-4"}>
        {data.reviews > 0 && (
          <div className={`flex items-center gap-1 ${featured ? "mb-2" : "mb-1.5"}`}>
            <Star
              aria-hidden="true"
              className={`${featured ? "w-4 h-4" : "w-3 h-3"} fill-gold text-gold`}
            />
            <span className={`${featured ? "text-sm" : "text-xs"} font-medium`}>{data.rating}</span>
            {featured && <span className="text-xs text-zinc-500">({data.reviews})</span>}
          </div>
        )}
        <h3
          className={`font-display leading-tight mb-0.5 ${featured ? "text-2xl" : "text-lg truncate"}`}
        >
          {data.name}
        </h3>
        <p className={`text-zinc-400 mb-1 ${featured ? "text-sm" : "text-xs"}`}>{data.secondary}</p>
        {!data.inStock && (
          <p className={featured ? "text-xs text-zinc-400 mb-2" : "text-[10px] text-zinc-400 mb-1"}>
            • {t("product.outOfStock")}
          </p>
        )}
        <div
          className={
            featured ? "flex flex-wrap gap-1.5 mb-3" : "flex flex-wrap gap-1 mb-2.5 min-h-[18px]"
          }
        >
          {notes.map((note) => (
            <span
              key={`${data.id}-note-${note}`}
              className={`rounded-full ${noteChipClass(note)} ${
                featured
                  ? "px-2 py-0.5 text-[10px] sm:text-xs"
                  : "px-1.5 py-0.5 text-[10px] leading-none"
              }`}
            >
              {noteToAz(note)}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          {featured ? (
            <div className="flex items-baseline gap-2">
              <span className="text-gold text-xl font-medium">{formatCurrency(data.price)}</span>
              {data.oldPrice ? (
                <span className="text-sm text-zinc-500 line-through">
                  {formatCurrency(data.oldPrice)}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-start leading-tight">
              <span className="text-gold font-medium whitespace-nowrap">
                {formatCurrency(data.price)}
              </span>
              {data.oldPrice ? (
                <span className="text-[11px] text-zinc-500 line-through whitespace-nowrap">
                  {formatCurrency(data.oldPrice)}
                </span>
              ) : null}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            aria-label={t("a11y.addToCart")}
            disabled={!data.inStock}
            className={`btn-gold relative z-20 ${featured ? "p-2.5 rounded-xl" : "p-2 rounded-lg"} ${
              pulseCart ? "scale-110" : ""
            } ${!data.inStock ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <ShoppingBag className={featured ? "w-4 h-4" : "w-3.5 h-3.5"} />
          </button>
        </div>
      </div>
    </div>
  );
}
