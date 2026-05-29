import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Heart, Star, ShoppingBag, Minus, Plus, Truck, MessageCircle, CreditCard } from "lucide-react";
import { useI18n } from "../i18n";
import { addToCart, isFavorite, toggleFavorite } from "../lib/storage";
import { loadCatalogProductBySlug, type CatalogProduct } from "../lib/catalog";

export function ProductDetails() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [pulseFavorite, setPulseFavorite] = useState(false);
  const [pulseCart, setPulseCart] = useState(false);
  const [perfume, setPerfume] = useState<CatalogProduct | null>(null);
  const fmt = (v: number) => `${v.toFixed(2)} \u20BC`;

  useEffect(() => {
    (async () => {
      if (!slug) {
        setPerfume(null);
        return;
      }
      const found = await loadCatalogProductBySlug(slug);
      setPerfume(found);
      if (found) setFavorite(isFavorite(found.id));
    })();
  }, [slug]);

  if (!perfume) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>{t("product.notFound")}</p>
      </div>
    );
  }

  const gender = /women|qadin/i.test(`${perfume.name} ${perfume.description}`)
    ? "Qadın"
    : /men|kisi/i.test(`${perfume.name} ${perfume.description}`)
      ? "Kişi"
      : "Uniseks";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setFavorite(toggleFavorite(perfume.id));
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
        <div className="aspect-[3/4] lg:aspect-[4/5] lg:max-h-[720px] bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden rounded-b-3xl lg:rounded-3xl">
          <img src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
        </div>

        <div className="bg-black px-4 sm:px-6 lg:px-0 py-8 -mt-8 lg:mt-0 rounded-t-[40px] lg:rounded-none relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-zinc-400 mb-1">{perfume.brand}</p>
              <h1 className="text-2xl mb-2">{perfume.name}</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span className="text-sm font-medium">{perfume.rating}</span>
                </div>
                <span className="text-sm text-zinc-500">({perfume.reviews} {t("product.reviews")})</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-medium">{fmt(perfume.price)}</p>
              {perfume.originalPrice && <p className="text-sm text-zinc-500 line-through">{fmt(perfume.originalPrice)}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="bg-zinc-900 rounded-2xl px-2.5 sm:px-4 py-3 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-0.5">{t("product.size")}</p>
              <p className="text-xs sm:text-sm font-medium">{perfume.size}</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl px-2.5 sm:px-4 py-3 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-0.5">{t("product.stock")}</p>
              <p className="text-xs sm:text-sm font-medium text-green-500">{t("product.inStock")}</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl px-2.5 sm:px-4 py-3 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-0.5">Cins</p>
              <p className="text-xs sm:text-sm font-medium">{gender}</p>
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
              href="https://wa.me/994000000000"
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
                addToCart(perfume.id, quantity);
                setPulseCart(true);
                setTimeout(() => setPulseCart(false), 180);
              }}
              className={`flex-1 bg-white text-black rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all ${pulseCart ? "scale-105" : ""}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {t("product.addToCart")}
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3">{t("product.notes")}</h3>
            <div className="space-y-3">
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">{t("product.topNotes")}</p>
                <p className="text-sm">{perfume.notes.top.join(", ") || "-"}</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">{t("product.heartNotes")}</p>
                <p className="text-sm">{perfume.notes.heart.join(", ") || "-"}</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">{t("product.baseNotes")}</p>
                <p className="text-sm">{perfume.notes.base.join(", ") || "-"}</p>
              </div>
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




