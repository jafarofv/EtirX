import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Heart,
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  MessageCircle,
  CreditCard,
  Droplets,
  CheckCircle2,
  User,
} from "lucide-react";
import { useI18n } from "../i18n";
import { addToCart, isFavorite, toggleFavorite } from "../lib/storage";
import { loadCatalogProductBySlug, type CatalogProduct } from "../lib/catalog";
import { Seo } from "../components/Seo";
import { noteChipClass, noteToAz } from "../lib/noteMeta";
import { useSiteSettings } from "../site-settings";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";

export function ProductDetails() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const site = useSiteSettings();
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [pulseFavorite, setPulseFavorite] = useState(false);
  const [pulseCart, setPulseCart] = useState(false);
  const [perfume, setPerfume] = useState<CatalogProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState("");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const fmt = (v: number) => formatCurrency(v);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!slug) {
        setStatus("notfound");
        return;
      }
      setStatus("loading");
      try {
        const found = await loadCatalogProductBySlug(slug);
        if (!active) return;
        if (!found) {
          setPerfume(null);
          setStatus("notfound");
          return;
        }
        setPerfume(found);
        setSelectedVariantId(found.defaultVariant.id ?? found.variants?.[0]?.id ?? null);
        setActiveImage(found.image || found.defaultVariant.imageUrl || found.images?.[0] || "");
        setFavorite(isFavorite(found.id));
        setStatus("ok");
      } catch (err) {
        if (active) {
          setStatus((err as { status?: number } | null)?.status === 404 ? "notfound" : "error");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, retry]);

  // Keep the displayed image in sync with the selected variant.
  // Must run on every render (BEFORE the early return below) so the hook order stays stable.
  useEffect(() => {
    if (!perfume) return;
    const list = perfume.variants.length > 0 ? perfume.variants : [perfume.defaultVariant];
    const selected = list.find((variant) => variant.id === selectedVariantId) ?? list[0];
    const nextImage = selected?.imageUrl || perfume.image || perfume.images[0];
    if (nextImage) setActiveImage(nextImage);
  }, [perfume, selectedVariantId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-zinc-300 text-sm mb-6 max-w-sm">{t("product.loadError")}</p>
        <button onClick={() => setRetry((r) => r + 1)} className="btn-gold rounded-xl px-6 py-3">
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (status === "notfound" || !perfume) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>{t("product.notFound")}</p>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    setFavorite(toggleFavorite(perfume.id, perfume.slug));
    setPulseFavorite(true);
    setTimeout(() => setPulseFavorite(false), 180);
  };

  const gender =
    perfume.gender === "qadin" ? "Qadın" : perfume.gender === "kisi" ? "Kişi" : "Uniseks";

  const variants = perfume.variants.length > 0 ? perfume.variants : [perfume.defaultVariant];
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const selectedStock = selectedVariant?.stock ?? 0;
  const gallery = perfume.images.length > 0 ? perfume.images : [perfume.image];
  const activeIndex = Math.max(
    0,
    gallery.findIndex((img) => img === activeImage)
  );
  const premiumVariants = variants.filter((variant) => variant.variantType === "premium");
  const gramVariants = variants.filter((variant) => variant.variantType === "gram");
  const renderVariantCard = (variant: (typeof variants)[number]) => {
    const isSelected = selectedVariant?.id === variant.id;
    const isPremium = variant.variantType === "premium";
    return (
      <button
        key={variant.id ?? `${variant.label}-${variant.sizeMl}`}
        type="button"
        onClick={() => {
          setSelectedVariantId(variant.id);
          setActiveImage(variant.imageUrl || perfume.image);
          setQuantity((q) => Math.min(q, Math.max(1, variant.stock)));
        }}
        className={`rounded-2xl border p-3.5 text-left transition-all ${
          isSelected
            ? "border-gold bg-[var(--gold-soft)]"
            : "glass border-white/10 hover:border-gold/50"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                isSelected ? "border-gold bg-gold" : "border-zinc-600"
              }`}
            >
              {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
            </span>
            <div className="min-w-0">
              <p className="font-medium leading-tight">
                {isPremium ? t("product.premiumPack") : `${variant.label}`}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {isPremium
                  ? t("product.originalPackaging")
                  : `${variant.sizeMl ?? variant.label} ml`}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-medium text-gold">{fmt(variant.price)}</p>
            {variant.stock <= 0 && (
              <p className="text-xs mt-1 text-red-400">{t("product.outOfStock")}</p>
            )}
          </div>
        </div>
      </button>
    );
  };

  const goNextImage = () => {
    if (gallery.length <= 1) return;
    const next = (activeIndex + 1) % gallery.length;
    setActiveImage(gallery[next]);
  };
  const goPrevImage = () => {
    if (gallery.length <= 1) return;
    const prev = (activeIndex - 1 + gallery.length) % gallery.length;
    setActiveImage(gallery[prev]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Seo
        title={`${perfume.name} | ${perfume.brand} | ƏtirX`}
        description={`${perfume.description} Top notlar: ${perfume.notes.top.map(noteToAz).join(", ")}.`}
        path={`/product/${perfume.slug}`}
        image={perfume.image}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: perfume.name,
          brand: perfume.brand,
          description: perfume.description,
          image: perfume.image,
          sku: String(perfume.id),
          offers: {
            "@type": "Offer",
            priceCurrency: "AZN",
            price: perfume.price.toFixed(2),
            availability: "https://schema.org/InStock",
          },
        }}
      />
      {/* Mobile/tablet back + favorite row (in-flow, not fixed, so it never
          overlaps the sticky header/promo strip). Desktop uses the inline
          "Geri" link + header favorite instead. */}
      <div className="lg:hidden mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-1 flex items-center justify-between">
        <button
          aria-label={t("a11y.back")}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-gold transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          aria-label={t("a11y.favorite")}
          onClick={handleToggleFavorite}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-gold transition-all"
        >
          <Heart
            className={`w-5 h-5 ${favorite ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite ? "scale-125" : ""} transition-transform`}
          />
        </button>
      </div>

      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-2 lg:gap-8 lg:px-6 lg:pt-24 lg:items-start">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <button
            onClick={() => navigate(-1)}
            className="hidden lg:inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-gold transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("a11y.back")}
          </button>
          <div
            className="aspect-square lg:aspect-square lg:max-h-[560px] bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden rounded-b-3xl lg:rounded-3xl"
            onTouchStart={(e) => setTouchStartX(e.changedTouches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const diff = e.changedTouches[0].clientX - touchStartX;
              if (Math.abs(diff) < 35) return;
              if (diff < 0) goNextImage();
              else goPrevImage();
              setTouchStartX(null);
            }}
          >
            <img
              src={activeImage || perfume.image}
              alt={perfume.name}
              onError={onImageError}
              className="w-full h-full object-contain"
            />
          </div>
          {gallery.length > 1 && (
            <div className="px-4 sm:px-0 mt-3 pb-2 flex gap-2 overflow-x-auto">
              {gallery.map((img, idx) => (
                <button
                  key={`${perfume.id}-img-${idx}`}
                  onClick={() => setActiveImage(img)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border ${activeImage === img ? "border-gold" : "border-white/15"}`}
                >
                  <img
                    src={img}
                    alt=""
                    aria-hidden="true"
                    onError={onImageError}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`bg-black px-4 sm:px-6 lg:px-0 py-8 ${perfume.images.length > 1 ? "mt-0" : "-mt-8"} lg:mt-0 rounded-t-[40px] lg:rounded-none relative z-10`}
        >
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className="min-w-0 truncate text-sm text-gold/80 tracking-wide uppercase">
                {perfume.brand}
              </p>
              <button
                aria-label={t("a11y.favorite")}
                onClick={handleToggleFavorite}
                className="hidden lg:flex w-10 h-10 rounded-full glass items-center justify-center hover:border-gold transition-all shrink-0"
              >
                <Heart
                  className={`w-5 h-5 ${favorite ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite ? "scale-125" : ""} transition-transform`}
                />
              </button>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl leading-tight">{perfume.name}</h1>
            {perfume.reviews > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star aria-hidden="true" className="w-4 h-4 fill-gold text-gold" />
                  <span className="text-sm font-medium">{perfume.rating}</span>
                </div>
                <span className="text-sm text-zinc-500">
                  ({perfume.reviews} {t("product.reviews")})
                </span>
              </div>
            )}
            <div className="mt-3 flex items-baseline gap-2.5">
              <p className="text-gold text-2xl font-medium">{fmt(perfume.price)}</p>
              {perfume.originalPrice && (
                <p className="text-sm text-zinc-500 line-through">{fmt(perfume.originalPrice)}</p>
              )}
            </div>
          </div>

          <div className="gold-rule mt-4 mb-4" />

          <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10 pb-4 mb-6">
            <div className="flex items-start gap-2 px-3 sm:px-4">
              <Droplets className="hidden sm:block w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
                  {t("product.size")}
                </p>
                <p className="text-xs sm:text-sm font-medium truncate">
                  {selectedVariant?.sizeMl ? `${selectedVariant.sizeMl}ml` : perfume.size}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 sm:px-4">
              <CheckCircle2
                className={`hidden sm:block w-4 h-4 mt-0.5 shrink-0 ${selectedStock > 0 ? "text-green-500" : "text-red-500"}`}
              />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
                  {t("product.stock")}
                </p>
                <p
                  className={`text-xs sm:text-sm font-medium ${selectedStock > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {selectedStock > 0 ? t("product.inStock") : t("product.outOfStock")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 sm:px-4">
              <User className="hidden sm:block w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">Cins</p>
                <p className="text-xs sm:text-sm font-medium truncate">{gender}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            {premiumVariants.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gold/80 mb-3">
                  {t("product.originalPackaging")}
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {premiumVariants.map(renderVariantCard)}
                </div>
              </div>
            )}
            {gramVariants.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gold/80 mb-3">
                  {t("product.gramSale")}
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {gramVariants.map(renderVariantCard)}
                </div>
              </div>
            )}
          </div>

          {selectedStock > 0 && selectedStock <= 10 && (
            <p className="text-xs text-amber-400 mb-2">
              {selectedStock} {t("product.unitsLeft")}
            </p>
          )}
          <div className="flex gap-3 mb-5">
            <div className="flex items-center glass rounded-2xl px-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-zinc-800 rounded-xl transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(q + 1, Math.max(1, selectedStock)))}
                disabled={quantity >= selectedStock}
                className="p-3 hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                if (!selectedVariant) return;
                addToCart(perfume.id, quantity, perfume.slug, {
                  id: selectedVariant.id,
                  label: selectedVariant.label,
                  variantType: selectedVariant.variantType,
                  sizeMl: selectedVariant.sizeMl,
                  price: selectedVariant.price,
                  imageUrl: selectedVariant.imageUrl,
                });
                setPulseCart(true);
                setTimeout(() => setPulseCart(false), 180);
              }}
              disabled={!selectedVariant || selectedVariant.stock <= 0}
              className={`btn-gold flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 ${pulseCart ? "scale-105" : ""} ${!selectedVariant || selectedVariant.stock <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {t("product.addToCart")}
            </button>
          </div>

          <div className="glass rounded-2xl divide-y divide-white/10">
            <div className="flex items-start gap-3 p-3.5">
              <Truck className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Çatdırılma şərtləri</p>
                <p className="text-sm text-zinc-400">Bakı: 1-2 iş günü, regionlar: 2-4 iş günü.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5">
              <CreditCard className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Bank kartı vasitəsilə ödəniş</p>
                <p className="text-sm text-zinc-400">
                  Məhsulu təhvil alanda nağd və ya bank kartı vasitəsilə ödəniş et.
                </p>
              </div>
            </div>
            <a
              href={site.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3.5 hover:bg-emerald-700/10 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300 shrink-0" />
              <p className="text-sm font-medium text-emerald-200">WhatsApp-da bizə yaz</p>
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-6 pt-2 lg:pt-12 pb-12 space-y-8">
        <div>
          <h3 className="font-display text-2xl mb-3">{t("product.notes")}</h3>
          <div className="gold-rule mb-5" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: t("product.topNotes"), items: perfume.notes.top },
              { label: t("product.heartNotes"), items: perfume.notes.heart },
              { label: t("product.baseNotes"), items: perfume.notes.base },
            ].map((section) => (
              <div key={section.label} className="glass rounded-2xl p-4">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                  {section.label}
                </p>
                {section.items.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((note) => (
                      <span
                        key={`${section.label}-${note}`}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs ${noteChipClass(note)}`}
                      >
                        {noteToAz(note)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">-</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-2xl mb-3">{t("product.description")}</h3>
          <div className="gold-rule mb-5" />
          <p className="max-w-3xl text-sm text-zinc-400 leading-relaxed">{perfume.description}</p>
        </div>
      </div>
    </div>
  );
}
