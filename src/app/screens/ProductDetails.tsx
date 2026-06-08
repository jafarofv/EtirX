import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Heart, Star, ShoppingBag, Minus, Plus, Truck, MessageCircle, CreditCard } from "lucide-react";
import { useI18n } from "../i18n";
import { addToCart, isFavorite, toggleFavorite } from "../lib/storage";
import { loadCatalogProductBySlug, type CatalogProduct } from "../lib/catalog";
import { Seo } from "../components/Seo";
import { noteChipClass, noteToAz } from "../lib/noteMeta";
import { WHATSAPP_URL } from "../lib/config";

export function ProductDetails() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [pulseFavorite, setPulseFavorite] = useState(false);
  const [pulseCart, setPulseCart] = useState(false);
  const [perfume, setPerfume] = useState<CatalogProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState("");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const fmt = (v: number) => `${v.toFixed(2)} \u20BC`;

  useEffect(() => {
    (async () => {
      if (!slug) {
        setPerfume(null);
        return;
      }
      const found = await loadCatalogProductBySlug(slug);
      setPerfume(found);
      setSelectedVariantId(found?.defaultVariant.id ?? found?.variants?.[0]?.id ?? null);
      setActiveImage(found?.defaultVariant.imageUrl || found?.images?.[0] || found?.image || "");
      if (found) setFavorite(isFavorite(found.id));
    })();
  }, [slug]);

  // Keep the displayed image in sync with the selected variant.
  // Must run on every render (BEFORE the early return below) so the hook order stays stable.
  useEffect(() => {
    if (!perfume) return;
    const list = perfume.variants.length > 0 ? perfume.variants : [perfume.defaultVariant];
    const selected = list.find((variant) => variant.id === selectedVariantId) ?? list[0];
    const nextImage = selected?.imageUrl || perfume.images[0] || perfume.image;
    if (nextImage) setActiveImage(nextImage);
  }, [perfume, selectedVariantId]);

  if (!perfume) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>{t("product.notFound")}</p>
      </div>
    );
  }

  const gender =
    perfume.gender === "qadin"
      ? "Qadın"
      : perfume.gender === "kisi"
        ? "Kişi"
      : "Uniseks";

  const variants = perfume.variants.length > 0 ? perfume.variants : [perfume.defaultVariant];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const gallery = perfume.images.length > 0 ? perfume.images : [perfume.image];
  const activeIndex = Math.max(0, gallery.findIndex((img) => img === activeImage));

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
      <div className="fixed top-[28px] md:top-[24px] left-0 right-0 z-10 bg-black/50 backdrop-blur-xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setFavorite(toggleFavorite(perfume.id, perfume.slug));
              setPulseFavorite(true);
              setTimeout(() => setPulseFavorite(false), 180);
            }}
            className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <Heart className={`w-5 h-5 ${favorite ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite ? "scale-125" : ""} transition-transform`} />
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-6 lg:pt-24">
        <div>
          <div
            className="aspect-square lg:aspect-square lg:max-h-[720px] bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden rounded-b-3xl lg:rounded-3xl"
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
            <img src={activeImage || perfume.image} alt={perfume.name} className="w-full h-full object-contain" />
          </div>
          {gallery.length > 1 && (
            <div className="px-4 sm:px-0 mt-3 pb-2 flex gap-2 overflow-x-auto">
              {gallery.map((img, idx) => (
                <button
                  key={`${perfume.id}-img-${idx}`}
                  onClick={() => setActiveImage(img)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border ${activeImage === img ? "border-white" : "border-zinc-700"}`}
                >
                  <img src={img} alt={`${perfume.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-black px-4 sm:px-6 lg:px-0 py-8 ${perfume.images.length > 1 ? "mt-0" : "-mt-8"} lg:mt-0 rounded-t-[40px] lg:rounded-none relative z-10`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-zinc-400 mb-1">{perfume.brand}</p>
              <h1 className="text-2xl mb-2">{perfume.name}</h1>
              {perfume.reviews > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span className="text-sm font-medium">{perfume.rating}</span>
                  </div>
                  <span className="text-sm text-zinc-500">({perfume.reviews} {t("product.reviews")})</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-medium">{fmt(perfume.price)}</p>
              {perfume.originalPrice && <p className="text-sm text-zinc-500 line-through">{fmt(perfume.originalPrice)}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="bg-zinc-900 rounded-2xl px-2.5 sm:px-4 py-3 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-0.5">{t("product.size")}</p>
              <p className="text-xs sm:text-sm font-medium">
                {selectedVariant?.sizeMl ? `${selectedVariant.sizeMl}ml` : perfume.size}
              </p>
            </div>
            <div className="bg-zinc-900 rounded-2xl px-2.5 sm:px-4 py-3 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-0.5">{t("product.stock")}</p>
              <p className={`text-xs sm:text-sm font-medium ${selectedVariant?.stock > 0 ? "text-green-500" : "text-red-500"}`}>
                {selectedVariant?.stock > 0 ? t("product.inStock") : t("product.outOfStock")}
              </p>
            </div>
            <div className="bg-zinc-900 rounded-2xl px-2.5 sm:px-4 py-3 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-0.5">Cins</p>
              <p className="text-xs sm:text-sm font-medium">{gender}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3">{t("product.saleType")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const isPremium = variant.variantType === "premium";
                return (
                  <button
                    key={variant.id ?? `${variant.label}-${variant.sizeMl}`}
                    type="button"
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      if (variant.imageUrl) setActiveImage(variant.imageUrl);
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected ? "border-white bg-white/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {isPremium ? t("product.premiumPack") : `${variant.label} ${t("product.gramSale")}`}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {isPremium ? t("product.originalPackaging") : `${variant.sizeMl ?? variant.label}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{fmt(variant.price)}</p>
                        <p className={`text-xs mt-1 ${variant.stock > 0 ? "text-green-400" : "text-red-400"}`}>
                          {variant.stock > 0 ? t("product.inStock") : t("product.outOfStock")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8 space-y-3">
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-zinc-300" />
                <p className="text-sm font-medium">Çatdırılma şərtləri</p>
              </div>
              <p className="text-sm text-zinc-400">Bakı: 1-2 iş günü, regionlar: 2-4 iş günü.</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-zinc-300" />
                <p className="text-sm font-medium">Qapıda ödəniş ilə ödə</p>
              </div>
              <p className="text-sm text-zinc-400">Məhsulu təhvil alanda nağd və ya kartla ödəniş et.</p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="block bg-emerald-700/20 rounded-2xl p-4 border border-emerald-600/40 hover:bg-emerald-700/30 transition-all"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <p className="text-sm font-medium text-emerald-200">WhatsApp-da bizə yaz</p>
              </div>
            </a>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="flex items-center bg-zinc-900 rounded-2xl border border-zinc-800 px-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-zinc-800 rounded-xl transition-all">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-zinc-800 rounded-xl transition-all">
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
              className={`flex-1 bg-white text-black rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all ${pulseCart ? "scale-105" : ""}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {t("product.addToCart")}
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3">{t("product.notes")}</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: t("product.topNotes"), items: perfume.notes.top },
                { label: t("product.heartNotes"), items: perfume.notes.heart },
                { label: t("product.baseNotes"), items: perfume.notes.base },
              ].map((section) => (
                <div key={section.label} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">{section.label}</p>
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

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">{t("product.description")}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{perfume.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}




