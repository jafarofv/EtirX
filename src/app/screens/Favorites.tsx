import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../i18n";
import { addToCart, getFavoriteIds } from "../lib/storage";
import { loadCatalogProducts, type CatalogProduct } from "../lib/catalog";
import { syncStoredCollections } from "../lib/storage";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";
import { Seo } from "../components/Seo";

export function Favorites() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [favorites, setFavorites] = useState<CatalogProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const fmt = (v: number) => formatCurrency(v);

  useEffect(() => {
    (async () => {
      const products = await loadCatalogProducts();
      const favoriteIds = getFavoriteIds();
      setFavorites(products.filter((p) => favoriteIds.includes(p.id)));
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("favorites", JSON.stringify(favorites.map((f) => f.id)));
    window.dispatchEvent(new CustomEvent("app-storage-updated"));
    void syncStoredCollections();
  }, [favorites, hydrated]);

  const removeFavorite = (id: number) => {
    setFavorites((favs) => favs.filter((p) => p.id !== id));
    toast(t("toast.removedFromFavorites"));
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-20 h-20 glass rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-gold" />
        </div>
        <h1 className="font-display text-3xl mb-2">{t("favorites.empty")}</h1>
        <p className="text-sm text-zinc-400 mb-8 text-center">{t("favorites.explore")}</p>
        <button onClick={() => navigate("/")} className="btn-gold px-8 py-3.5 rounded-2xl">
          {t("favorites.explore")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <Seo
        title="Seçilənlər | ƏtirX"
        description="Seçilən məhsullar səhifəsi."
        path="/favorites"
        noindex
      />
      <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <h1 className="font-display text-4xl mb-1">{t("favorites.title")}</h1>
        <p className="text-sm text-zinc-400">
          {favorites.length} {t("shop.count")}
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((perfume) => (
            <div
              key={perfume.id}
              className="glass premium-card rounded-3xl overflow-hidden group relative"
            >
              <Link
                to={`/product/${perfume.slug}`}
                aria-label={perfume.name}
                className="absolute inset-0 z-10"
              />
              <div>
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={perfume.image}
                    alt={perfume.name}
                    onError={onImageError}
                    className="zoom-img w-full h-full object-cover"
                  />
                  <button
                    aria-label={t("a11y.unfavorite")}
                    aria-pressed={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(perfume.id);
                    }}
                    className="absolute top-3 right-3 z-20 w-9 h-9 glass rounded-full flex items-center justify-center hover:border-gold transition-all"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                  {perfume.originalPrice && (
                    <div className="badge-lux badge-sale absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px]">
                      {t("common.sale")}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {perfume.reviews > 0 && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Star aria-hidden="true" className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-xs font-medium">{perfume.rating}</span>
                    </div>
                  )}
                  <h3 className="font-display text-lg mb-1 truncate">{perfume.name}</h3>
                  <p className="text-xs text-zinc-400 mb-1">{perfume.size}</p>
                  {!perfume.inStock && (
                    <p className="text-[10px] text-zinc-400 mb-1">• {t("product.outOfStock")}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gold font-medium">{fmt(perfume.price)}</span>
                      {perfume.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through ml-1.5">
                          {fmt(perfume.originalPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(
                          perfume.id,
                          1,
                          perfume.slug,
                          perfume.defaultVariant
                            ? {
                                id: perfume.defaultVariant.id,
                                label: perfume.defaultVariant.label,
                                variantType: perfume.defaultVariant.variantType,
                                sizeMl: perfume.defaultVariant.sizeMl,
                                price: perfume.defaultVariant.price,
                                imageUrl: perfume.defaultVariant.imageUrl,
                              }
                            : undefined
                        );
                        toast.success(t("toast.addedToCart"));
                      }}
                      aria-label={t("a11y.addToCart")}
                      disabled={!perfume.inStock}
                      className={`btn-gold relative z-20 p-2 rounded-lg ${!perfume.inStock ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
