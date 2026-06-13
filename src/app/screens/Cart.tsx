import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useI18n } from "../i18n";
import { loadCatalogProducts, type CatalogProduct } from "../lib/catalog";
import { getAuthToken } from "../lib/auth";
import { getCartRows, syncStoredCollections } from "../lib/storage";
import { validatePromoCode } from "../lib/api";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";
import { Seo } from "../components/Seo";

interface CartItem {
  perfume: CatalogProduct;
  variant: CatalogProduct["defaultVariant"];
  quantity: number;
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
  const [repricedNote, setRepricedNote] = useState(false);
  const fmt = (v: number) => formatCurrency(v);

  useEffect(() => {
    (async () => {
      const products = await loadCatalogProducts();
      const byId = new Map(products.map((p) => [p.id, p] as const));
      const variantById = new Map(
        products.flatMap((p) => [
          ...p.variants.map((variant) => [variant.id, { perfume: p, variant }] as const),
          [p.defaultVariant.id ?? p.id, { perfume: p, variant: p.defaultVariant }] as const,
        ])
      );
      let repriced = false;
      const items = getCartRows()
        .map((i) => {
          const perfume = byId.get(i.id);
          if (!perfume) return null;
          const resolved = i.variantId ? variantById.get(i.variantId) : undefined;
          if (i.variantId && !resolved) repriced = true;
          const variant = resolved?.variant ?? perfume.defaultVariant;
          return { perfume, variant, quantity: i.quantity };
        })
        .filter((i): i is CartItem => Boolean(i?.perfume && i.variant));
      setCartItems(items);
      setRepricedNote(repriced);
      setPromoCode(localStorage.getItem("checkout-promo-code") ?? "");
      setPromoDiscount(0);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      "cart-items",
      JSON.stringify(
        cartItems.map((i) => ({
          id: i.perfume.id,
          quantity: i.quantity,
          slug: i.perfume.slug,
          variantId: i.variant.id,
          variantLabel: i.variant.label,
          variantType: i.variant.variantType,
          variantSizeMl: i.variant.sizeMl,
          variantPrice: i.variant.price,
          variantImage: i.variant.imageUrl,
        }))
      )
    );
    window.dispatchEvent(new CustomEvent("app-storage-updated"));
    void syncStoredCollections();
  }, [cartItems, hydrated]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping - promoDiscount;

  useEffect(() => {
    if (!hydrated) return;
    const code = promoCode.trim();
    if (!code) {
      setPromoDiscount(0);
      setPromoErr(null);
      return;
    }
    if (!getAuthToken()) {
      setPromoErr(t("cart.promoLoginRequired"));
      return;
    }
    let cancelled = false;
    // Debounce so we fire one request after the user stops typing, not per keystroke.
    const timer = setTimeout(() => {
      (async () => {
        try {
          const result = await validatePromoCode({ code, subtotal: subtotal.toFixed(2) });
          if (cancelled) return;
          localStorage.setItem("checkout-promo-code", result.promo.code);
          setPromoCode(result.promo.code);
          setPromoDiscount(Number(result.discount_amount));
          setPromoMsg(
            `${result.promo.code} ${t("cart.promoApplied")} - ${fmt(Number(result.discount_amount))}`
          );
          setPromoErr(null);
        } catch (err) {
          if (cancelled) return;
          localStorage.removeItem("checkout-promo-code");
          setPromoDiscount(0);
          setPromoErr(err instanceof Error ? err.message : t("checkout.submitError"));
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hydrated, promoCode, subtotal]);

  // Composite (product + variant) identity so a default/null-variant line for one
  // product cannot collide with a variant line whose variant id equals that product id.
  const lineKey = (item: CartItem) => `${item.perfume.id}-${item.variant.id ?? "default"}`;

  const updateQuantity = (key: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          lineKey(item) === key ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (key: string) => {
    setCartItems((items) => items.filter((item) => lineKey(item) !== key));
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-20 h-20 glass rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gold" />
        </div>
        <h1 className="font-display text-3xl mb-2">{t("cart.empty")}</h1>
        <p className="text-sm text-zinc-400 mb-8 text-center">{t("cart.emptySub")}</p>
        <button onClick={() => navigate("/")} className="btn-gold px-8 py-3.5 rounded-2xl">
          {t("cart.start")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <Seo title="Səbət | ƏtirX" description="Səbət səhifəsi." path="/cart" noindex />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl mb-1">{t("cart.title")}</h1>
          <p className="text-sm text-zinc-400">
            {cartItems.length} {t("cart.items")}
          </p>
        </div>

        {repricedNote && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {t("cart.repricedNotice")}
          </div>
        )}

        <div className="lg:grid lg:grid-cols-5 lg:gap-7 lg:items-start">
          {/* Items */}
          <div className="lg:col-span-3 space-y-3">
            {cartItems.map((item) => (
              <div
                key={lineKey(item)}
                className="glass premium-card rounded-2xl p-3 flex gap-3 sm:gap-4"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={item.variant.imageUrl || item.perfume.image}
                    alt=""
                    onError={onImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{item.perfume.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {item.perfume.brand} ·{" "}
                        {item.variant.variantType === "premium"
                          ? t("product.premiumPack")
                          : `${item.variant.label} ${t("product.gramSale")}`}
                      </p>
                    </div>
                    <button
                      aria-label={t("a11y.removeItem")}
                      onClick={() => removeItem(lineKey(item))}
                      className="flex-shrink-0 p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center glass rounded-lg px-0.5">
                      <button
                        aria-label={t("a11y.decreaseQty")}
                        onClick={() => updateQuantity(lineKey(item), -1)}
                        className="p-1.5 hover:bg-zinc-700 rounded-md transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        aria-label={t("a11y.increaseQty")}
                        onClick={() => updateQuantity(lineKey(item), 1)}
                        className="p-1.5 hover:bg-zinc-700 rounded-md transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-gold text-base font-medium">{fmt(item.variant.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo + summary + checkout (sticky on desktop) */}
          <div className="lg:col-span-2 mt-5 lg:mt-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="glass rounded-2xl p-4">
                <div className="flex gap-2">
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
                    aria-label={t("cart.promo")}
                    className="flex-1 min-w-0 rounded-md bg-transparent px-1 text-sm placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
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
                        const result = await validatePromoCode({
                          code,
                          subtotal: subtotal.toFixed(2),
                        });
                        localStorage.setItem("checkout-promo-code", result.promo.code);
                        setPromoCode(result.promo.code);
                        setPromoDiscount(Number(result.discount_amount));
                        setPromoMsg(
                          `${result.promo.code} ${t("cart.promoApplied")} - ${fmt(Number(result.discount_amount))}`
                        );
                      } catch (err) {
                        localStorage.removeItem("checkout-promo-code");
                        setPromoDiscount(0);
                        setPromoErr(err instanceof Error ? err.message : t("checkout.submitError"));
                      }
                    }}
                    className="btn-gold px-5 py-2.5 rounded-xl text-sm whitespace-nowrap"
                  >
                    {t("cart.apply")}
                  </button>
                </div>
                {promoErr && <p className="mt-2 text-xs text-red-400">{promoErr}</p>}
                {promoMsg && <p className="mt-2 text-xs text-green-400">{promoMsg}</p>}
              </div>

              <div className="glass rounded-2xl p-5">
                <h3 className="font-display text-xl mb-4">{t("cart.summary")}</h3>
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t("cart.subtotal")}</span>
                    <span className="font-medium">{fmt(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">{t("checkout.promo")}</span>
                      <span className="font-medium text-emerald-400">-{fmt(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t("cart.shipping")}</span>
                    <span className="font-medium text-zinc-400">
                      {t("cart.shippingAtCheckout")}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium">{t("cart.total")}</span>
                      <span className="text-gold text-2xl font-medium">{fmt(total)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!getAuthToken()) {
                      navigate("/profile", { state: { next: "/checkout", mode: "register" } });
                      return;
                    }
                    navigate("/checkout");
                  }}
                  className="btn-gold w-full rounded-xl py-3.5"
                >
                  {t("cart.checkout")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
