import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Star, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../i18n";
import { addToCart, toggleFavorite } from "../lib/storage";
import { loadCatalogProducts, type CatalogProduct } from "../lib/catalog";
import { Seo } from "../components/Seo";
import { ProductGridSkeleton } from "../components/ProductGridSkeleton";
import { noteChipClass, noteToAz } from "../lib/noteMeta";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";

export function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") ?? "[]");
    } catch {
      return [];
    }
  });
  const [pulseFavorite, setPulseFavorite] = useState<number | null>(null);
  const [pulseCart, setPulseCart] = useState<number | null>(null);
  const fmt = (v: number) => formatCurrency(v);

  const refreshFavorites = () => {
    try {
      setFavoriteIds(JSON.parse(localStorage.getItem("favorites") ?? "[]"));
    } catch {
      setFavoriteIds([]);
    }
  };

  useEffect(() => {
    window.addEventListener("app-storage-updated", refreshFavorites as EventListener);
    return () =>
      window.removeEventListener("app-storage-updated", refreshFavorites as EventListener);
  }, []);

  useEffect(() => {
    loadCatalogProducts()
      .then(setProducts)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const featuredPerfumes = products.slice(0, 3);
  const tabs = [
    { key: "all", label: t("home.tab.all") },
    { key: "new", label: t("home.tab.new") },
    { key: "women", label: t("home.tab.women") },
    { key: "men", label: t("home.tab.men") },
    { key: "unisex", label: t("home.tab.unisex") },
    { key: "sale", label: t("home.tab.sale") },
    { key: "best", label: t("home.tab.best") },
  ];

  const latestProductId = Math.max(...products.map((x) => x.id), 0);
  const hasCategory = (p: CatalogProduct, slug: string) => p.categorySlugs.includes(slug);
  const isWomen = (p: CatalogProduct) =>
    hasCategory(p, "qadin") || /women|qadin/i.test(`${p.name} ${p.description} ${p.category}`);
  const isMen = (p: CatalogProduct) =>
    hasCategory(p, "kisiler") || /men|kisi/i.test(`${p.name} ${p.description} ${p.category}`);
  const isUnisex = (p: CatalogProduct) =>
    hasCategory(p, "uniseks") || /unisex/i.test(`${p.name} ${p.description} ${p.category}`);
  const isNew = (p: CatalogProduct) =>
    p.isNewArrival || hasCategory(p, "yeni-gelenler") || p.id >= latestProductId - 2;
  const bestSellerIds = new Set(
    [...products]
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating)
      .slice(0, 8)
      .map((p) => p.id)
  );
  const isBest = (p: CatalogProduct) =>
    p.isBestSeller || hasCategory(p, "en-cox-satanlar") || bestSellerIds.has(p.id);

  const filteredPerfumes = products.filter(
    (p) =>
      selectedCategory === "all" ||
      (selectedCategory === "new" && isNew(p)) ||
      (selectedCategory === "women" && isWomen(p)) ||
      (selectedCategory === "men" && isMen(p)) ||
      (selectedCategory === "unisex" && isUnisex(p)) ||
      (selectedCategory === "sale" && Boolean(p.originalPrice)) ||
      (selectedCategory === "best" && isBest(p))
  );

  const getBadge = (perfume: CatalogProduct) => {
    if (perfume.originalPrice) return t("common.sale");
    if (isNew(perfume)) return "Yeni";
    if (isBest(perfume)) return "Çox Satılan";
    return null;
  };
  const getBadgeClass = (perfume: CatalogProduct) => {
    if (perfume.originalPrice) return "badge-sale";
    if (isNew(perfume)) return "badge-new";
    return "badge-best";
  };

  const addPerfumeToCart = (perfume: CatalogProduct) => {
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
    setPulseCart(perfume.id);
    setTimeout(() => setPulseCart(null), 180);
    toast.success(t("toast.addedToCart"));
  };

  const onToggleFavorite = (perfume: CatalogProduct) => {
    const added = toggleFavorite(perfume.id, perfume.slug);
    setPulseFavorite(perfume.id);
    setTimeout(() => setPulseFavorite(null), 180);
    toast(added ? t("toast.addedToFavorites") : t("toast.removedFromFavorites"));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Seo
        title="ƏtirX | Premium Ətirlər"
        description="Qadın, kişi və uniseks premium ətirləri notlara görə axtarın: oud, rose, vanilla, amber və daha çox."
        path="/"
      />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="hero-lux px-4 sm:px-6 lg:px-8 pt-8 pb-7 sm:pt-10 sm:pb-8 lg:pt-12 lg:pb-10">
          <div className="mx-auto max-w-7xl">
            <div className="animate-fade-up max-w-xl">
              <p className="text-gold text-[11px] sm:text-xs tracking-[0.34em] uppercase mb-2.5">
                {t("home.tagline")}
              </p>
              <h1 className="font-display font-semibold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mb-3">
                {t("brand.name")}
              </h1>
              <div className="gold-rule mb-3.5" />
              <p className="text-zinc-300/90 text-sm sm:text-[15px] max-w-md leading-relaxed">
                {t("footer.about")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category tabs ────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar md:flex-wrap md:justify-center">
          {tabs.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all border ${
                selectedCategory === category.key
                  ? "bg-gold border-gold text-[#1a1206] font-semibold"
                  : "bg-white/5 text-zinc-300 hover:border-gold/50 border-white/10"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured ─────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">{t("home.featured")}</h2>
            <div className="gold-rule mt-2" />
          </div>
          <button
            onClick={() => navigate("/perfumes")}
            className="text-sm text-zinc-400 hover:text-gold transition-colors flex items-center gap-1"
          >
            {t("home.viewAll")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
          {featuredPerfumes.map((perfume) => (
            <div
              key={perfume.id}
              className="premium-card glass min-w-[260px] sm:min-w-[300px] lg:min-w-[340px] md:min-w-0 rounded-3xl overflow-hidden group relative"
            >
              <Link
                to={`/product/${perfume.slug}`}
                aria-label={perfume.name}
                className="absolute inset-0 z-10"
              />
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={perfume.image}
                  alt={perfume.name}
                  onError={onImageError}
                  className="zoom-img w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(perfume);
                  }}
                  aria-label={t("a11y.favorite")}
                  className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full glass flex items-center justify-center hover:border-gold transition-all"
                >
                  <Heart
                    className={`w-4 h-4 ${favoriteIds.includes(perfume.id) ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite === perfume.id ? "scale-125" : ""} transition-transform`}
                  />
                </button>
                {getBadge(perfume) && (
                  <div
                    className={`badge-lux ${getBadgeClass(perfume)} absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px]`}
                  >
                    {getBadge(perfume)}
                  </div>
                )}
              </div>
              <div className="p-5">
                {perfume.reviews > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star aria-hidden="true" className="w-4 h-4 fill-gold text-gold" />
                    <span className="text-sm font-medium">{perfume.rating}</span>
                    <span className="text-xs text-zinc-500">({perfume.reviews})</span>
                  </div>
                )}
                <h3 className="font-display text-2xl leading-tight mb-0.5">{perfume.name}</h3>
                <p className="text-sm text-zinc-400 mb-1">{perfume.brand}</p>
                {!perfume.inStock && (
                  <p className="text-xs text-zinc-400 mb-2">• {t("product.outOfStock")}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {perfume.notes.top.slice(0, 3).map((note) => (
                    <span
                      key={`${perfume.id}-featured-note-${note}`}
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${noteChipClass(note)}`}
                    >
                      {noteToAz(note)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gold text-xl font-medium">{fmt(perfume.price)}</span>
                    {perfume.originalPrice && (
                      <span className="text-sm text-zinc-500 line-through">
                        {fmt(perfume.originalPrice)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addPerfumeToCart(perfume);
                    }}
                    aria-label={t("a11y.addToCart")}
                    disabled={!perfume.inStock}
                    className={`btn-gold relative z-20 p-2.5 rounded-xl ${pulseCart === perfume.id ? "scale-110" : ""} ${!perfume.inStock ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── All products ─────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-5">
          <h2 className="font-display text-3xl sm:text-4xl">{t("home.all")}</h2>
          <div className="gold-rule mt-2" />
        </div>
        {loading ? (
          <ProductGridSkeleton />
        ) : loadError ? (
          <p className="text-amber-400">{t("shop.fallback")}</p>
        ) : filteredPerfumes.length === 0 ? (
          <p className="text-zinc-400">{t("shop.noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredPerfumes.map((perfume) => (
              <div
                key={perfume.id}
                className="premium-card glass rounded-3xl overflow-hidden group relative"
              >
                <Link
                  to={`/product/${perfume.slug}`}
                  aria-label={perfume.name}
                  className="absolute inset-0 z-10"
                />
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={perfume.image}
                    alt={perfume.name}
                    onError={onImageError}
                    className="zoom-img w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(perfume);
                    }}
                    aria-label={t("a11y.favorite")}
                    className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full glass flex items-center justify-center hover:border-gold transition-all"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${favoriteIds.includes(perfume.id) ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite === perfume.id ? "scale-125" : ""} transition-transform`}
                    />
                  </button>
                  {getBadge(perfume) && (
                    <div
                      className={`badge-lux ${getBadgeClass(perfume)} absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px]`}
                    >
                      {getBadge(perfume)}
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
                  <h3 className="font-display text-lg leading-tight mb-0.5 truncate">
                    {perfume.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mb-1">{perfume.brand}</p>
                  {!perfume.inStock && (
                    <p className="text-[10px] text-zinc-400 mb-1">• {t("product.outOfStock")}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2.5 min-h-[18px]">
                    {perfume.notes.top.slice(0, 2).map((note) => (
                      <span
                        key={`${perfume.id}-all-note-${note}`}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${noteChipClass(note)}`}
                      >
                        {noteToAz(note)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-gold font-medium whitespace-nowrap">
                        {fmt(perfume.price)}
                      </span>
                      {perfume.originalPrice && (
                        <span className="text-[11px] text-zinc-500 line-through whitespace-nowrap">
                          {fmt(perfume.originalPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addPerfumeToCart(perfume);
                      }}
                      aria-label={t("a11y.addToCart")}
                      disabled={!perfume.inStock}
                      className={`btn-gold relative z-20 p-2 rounded-lg ${pulseCart === perfume.id ? "scale-110" : ""} ${!perfume.inStock ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
