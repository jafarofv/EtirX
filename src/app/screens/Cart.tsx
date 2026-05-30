import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useI18n } from "../i18n";
import { loadCatalogProducts, type CatalogProduct } from "../lib/catalog";
import { getAuthToken } from "../lib/auth";
import { syncStoredCollections } from "../lib/storage";
import { validatePromoCode } from "../lib/api";

interface CartItem {
  perfume: CatalogProduct;
  quantity: number;
}

function loadRows() {
  try {
    const raw = localStorage.getItem("cart-items");
    return (raw ? JSON.parse(raw) : []) as Array<{ id: number; quantity: number; slug?: string }>;
  } catch {
    return [];
  }
}

export function Cart() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const fmt = (v: number) => `${v.toFixed(2)} \u20BC`;

  useEffect(() => {
    (async () => {
      const products = await loadCatalogProducts();
      const byId = new Map(products.map((p) => [p.id, p] as const));
      const items = loadRows()
        .map((i) => ({ perfume: byId.get(i.id), quantity: i.quantity }))
        .filter((i): i is CartItem => Boolean(i.perfume));
      setCartItems(items);
      setPromoCode(localStorage.getItem("checkout-promo-code") ?? "");
      setPromoDiscount(0);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      "cart-items",
      JSON.stringify(cartItems.map((i) => ({ id: i.perfume.id, quantity: i.quantity, slug: i.perfume.slug })))
    );
    window.dispatchEvent(new CustomEvent("app-storage-updated"));
    void syncStoredCollections();
  }, [cartItems, hydrated]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.perfume.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping - promoDiscount;

  useEffect(() => {
    if (!hydrated) return;
    const code = promoCode.trim();
    if (!code) {
      setPromoDiscount(0);
      return;
    }
    if (!getAuthToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await validatePromoCode({ code, subtotal: subtotal.toFixed(2) });
        if (cancelled) return;
        localStorage.setItem("checkout-promo-code", result.promo.code);
        setPromoCode(result.promo.code);
        setPromoDiscount(Number(result.discount_amount));
        setPromoMsg(`${result.promo.code} ${t("cart.promoApplied")} - ${fmt(Number(result.discount_amount))}`);
        setPromoErr(null);
      } catch (err) {
        if (cancelled) return;
        localStorage.removeItem("checkout-promo-code");
        setPromoDiscount(0);
        setPromoErr(err instanceof Error ? err.message : t("checkout.submitError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, promoCode, subtotal]);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.perfume.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.perfume.id !== id));
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
          <ShoppingBag className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-xl mb-2">{t("cart.empty")}</h2>
        <p className="text-sm text-zinc-400 mb-8 text-center">{t("cart.emptySub")}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-white text-black px-8 py-3.5 rounded-2xl font-medium hover:bg-zinc-100 transition-all"
        >
          {t("cart.start")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <h1 className="text-2xl mb-1">{t("cart.title")}</h1>
        <p className="text-sm text-zinc-400">{cartItems.length} {t("cart.items")}</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.perfume.id} className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 flex gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={item.perfume.image} alt={item.perfume.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{item.perfume.name}</h3>
                  <p className="text-sm text-zinc-400 mb-2">{item.perfume.brand} · {item.perfume.size}</p>
                  <p className="text-lg font-medium">{fmt(item.perfume.price)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-zinc-800 rounded-xl px-1">
                    <button onClick={() => updateQuantity(item.perfume.id, -1)} className="p-2 hover:bg-zinc-700 rounded-lg transition-all">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.perfume.id, 1)} className="p-2 hover:bg-zinc-700 rounded-lg transition-all">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.perfume.id)} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoErr(null);
                setPromoMsg(null);
                setPromoDiscount(0);
              }}
              placeholder={t("cart.promo")}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-500"
            />
            <button
              onClick={async () => {
                setPromoErr(null);
                setPromoMsg(null);
                const code = promoCode.trim();
                if (!code) {
                  localStorage.removeItem("checkout-promo-code");
                  setPromoMsg(t("cart.promoCleared"));
                  setPromoDiscount(0);
                  return;
                }
                if (!getAuthToken()) {
                  setPromoErr(t("cart.promoLoginRequired"));
                  return;
                }
                try {
                  const result = await validatePromoCode({ code, subtotal: subtotal.toFixed(2) });
                  localStorage.setItem("checkout-promo-code", result.promo.code);
                  setPromoCode(result.promo.code);
                  setPromoDiscount(Number(result.discount_amount));
                  setPromoMsg(`${result.promo.code} ${t("cart.promoApplied")} - ${fmt(Number(result.discount_amount))}`);
                } catch (err) {
                  localStorage.removeItem("checkout-promo-code");
                  setPromoDiscount(0);
                  setPromoErr(err instanceof Error ? err.message : t("checkout.submitError"));
                }
              }}
              className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 transition-all"
            >
              {t("cart.apply")}
            </button>
          </div>
          {promoErr && <p className="mt-2 text-xs text-red-400">{promoErr}</p>}
          {promoMsg && <p className="mt-2 text-xs text-green-400">{promoMsg}</p>}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
          <h3 className="font-medium mb-4">{t("cart.summary")}</h3>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm"><span className="text-zinc-400">{t("cart.subtotal")}</span><span className="font-medium">{fmt(subtotal)}</span></div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">{t("checkout.promo")}</span>
                <span className="font-medium text-emerald-400">-{fmt(promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm"><span className="text-zinc-400">{t("cart.shipping")}</span><span className="font-medium text-zinc-400">{t("cart.shippingAtCheckout")}</span></div>
            <div className="border-t border-zinc-800 pt-3">
              <div className="flex justify-between"><span className="font-medium">{t("cart.total")}</span><span className="text-xl font-medium">{fmt(total)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-white text-black rounded-2xl py-4 font-medium hover:bg-zinc-100 transition-all"
        >
          {t("cart.checkout")}
        </button>
      </div>
    </div>
  );
}



