import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n";
import { createOrder, validatePromoCode } from "../lib/api";
import { getAuthToken, getMe, updateMe } from "../lib/auth";
import { loadCatalogProducts } from "../lib/catalog";
import { clearCart } from "../lib/storage";

type DeliveryMethod = {
  id: "city_courier" | "metro_drop" | "azerpost" | "pickup";
  label: string;
  eta: string;
  fee: number;
};

type PlacedOrder = {
  code: string;
  full_name: string;
  phone: string;
  address: string;
  notes: string;
  promo_code: string;
  discount_amount: string;
  payment_method: string;
  status: string;
  subtotal: string;
  shipping_fee: string;
  total: string;
  created_at: string;
  items: Array<{ product: number; product_name: string; product_image: string; quantity: number; unit_price: string }>;
};

export function Checkout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState<"info" | "success">("info");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileHadAddress, setProfileHadAddress] = useState(false);

  const deliveryMethods: DeliveryMethod[] = [
    { id: "city_courier", label: t("checkout.delivery.cityCourier"), eta: t("checkout.delivery.cityCourierEta"), fee: 0 },
    { id: "metro_drop", label: t("checkout.delivery.metroDrop"), eta: t("checkout.delivery.metroDropEta"), fee: 2 },
    { id: "azerpost", label: t("checkout.delivery.azerpost"), eta: t("checkout.delivery.azerpostEta"), fee: 3 },
    { id: "pickup", label: t("checkout.delivery.pickup"), eta: t("checkout.delivery.pickupEta"), fee: 0 },
  ];
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMethod["id"] | null>(null);
  const selectedMethod = deliveryMethods.find((m) => m.id === selectedDelivery) ?? null;
  const requiresAddress = selectedDelivery === "city_courier";

  useEffect(() => {
    let mounted = true;
    const guestRaw = localStorage.getItem("guest-checkout-info");
    const savedPromo = localStorage.getItem("checkout-promo-code");
    if (savedPromo && mounted) setPromoCode(savedPromo);
    if (guestRaw) {
      try {
        const guest = JSON.parse(guestRaw) as { fullName?: string; phone?: string; address?: string; notes?: string };
        if (mounted) {
          setFullName((prev) => prev || guest.fullName || "");
          setPhone((prev) => prev || guest.phone || "");
          setAddress((prev) => prev || guest.address || "");
          setNotes((prev) => prev || guest.notes || "");
        }
      } catch {
        // ignore guest draft parse errors
      }
    }

    (async () => {
      if (!getAuthToken()) {
        if (mounted) setIsLoggedIn(false);
        return;
      }
      try {
        const me = await getMe();
        if (!mounted) return;
        setIsLoggedIn(true);
        setProfileHadAddress(Boolean(me.address?.trim()));
        setFullName(me.full_name || "");
        setPhone(me.phone || "");
        if (me.address?.trim()) setAddress(me.address);
      } catch {
        if (mounted) setIsLoggedIn(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "guest-checkout-info",
      JSON.stringify({ fullName, phone, address, notes })
    );
  }, [fullName, phone, address, notes]);

  if (step === "success") {
    const order = placedOrder;
    const fmt = (value: string) => `${Number(value).toFixed(2)} AZN`;
    const statusLabel = order?.status ?? "new";
    const prettyStatus =
      statusLabel === "new"
        ? "Gözləyir"
        : statusLabel === "confirmed"
          ? "Təsdiqləndi"
          : statusLabel === "shipped"
            ? "Göndərildi"
            : statusLabel === "delivered"
              ? "Təslim edildi"
              : statusLabel === "cancelled"
                ? "Ləğv edildi"
                : statusLabel;
    const statusStyles: Record<string, string> = {
      new: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      confirmed: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      shipped: "bg-purple-500/10 text-purple-300 border-purple-500/20",
      delivered: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
    };
    return (
      <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[28px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl mb-1">{t("checkout.success")}</h2>
                  <p className="text-sm text-zinc-400">{t("checkout.successSub")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{t("checkout.orderCode")}</p>
                <p className="text-lg font-medium">{order?.code ? `#${order.code}` : "N/A"}</p>
                <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[statusLabel] ?? "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                  {prettyStatus}
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{t("checkout.fullName")}</p>
                  <p className="font-medium">{order?.full_name || fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{t("checkout.phone")}</p>
                  <p className="font-medium">{order?.phone || phone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{t("checkout.address")}</p>
                  <p className="font-medium leading-6">{order?.address || address}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{t("checkout.delivery")}</p>
                  <p className="font-medium">{selectedMethod?.label || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{t("checkout.orderDetails")}</p>
                  <p className="text-sm text-zinc-400">{t("checkout.codDesc")}</p>
                </div>
                {!!order?.promo_code && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">{t("checkout.promo")}</p>
                    <p className="font-medium">{order.promo_code}</p>
                  </div>
                )}
              </div>

              <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">{t("cart.summary")}</p>
                <div className="space-y-3">
                  {(order?.items ?? []).map((item) => (
                    <div key={`${item.product}-${item.product_name}`} className="flex items-center gap-3 text-sm">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-zinc-200 block truncate">{item.product_name}</span>
                          <span className="font-medium shrink-0">{fmt(item.unit_price)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 mt-4 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{t("cart.subtotal")}</span>
                    <span>{fmt(order?.subtotal || "0")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{t("cart.shipping")}</span>
                    <span>{fmt(order?.shipping_fee || "0")}</span>
                  </div>
                  {Number(order?.discount_amount || "0") > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{t("checkout.promo")}</span>
                      <span className="text-emerald-400">-{fmt(order?.discount_amount || "0")}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="font-medium">{t("cart.total")}</span>
                    <span className="text-xl font-medium">{fmt(order?.total || "0")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => navigate("/")}
                className="bg-white text-black px-8 py-3.5 rounded-2xl font-medium hover:bg-zinc-100 transition-all"
              >
                {t("checkout.continue")}
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="bg-zinc-800 text-white px-8 py-3.5 rounded-2xl font-medium hover:bg-zinc-700 transition-all"
              >
                {t("checkout.orderDetails")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">{t("checkout.title")}</h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="space-y-3 mb-4">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("checkout.fullName")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("checkout.phone")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("checkout.notes")}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
            <div className="flex gap-3">
              <input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoErr(null);
                  setPromoMsg(null);
                }}
                placeholder={t("checkout.promo")}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
              />
              <button
                type="button"
                onClick={async () => {
                  setPromoErr(null);
                  setPromoMsg(null);
                  const code = promoCode.trim();
                  if (!code) {
                    localStorage.removeItem("checkout-promo-code");
                    setPromoMsg(t("cart.promoCleared"));
                    return;
                  }
                  if (!isLoggedIn) {
                    setPromoErr(t("checkout.promoLoginRequired"));
                    return;
                  }
                  try {
                    const raw = localStorage.getItem("cart-items");
                    const parsed: Array<{ id: number; quantity: number; slug?: string }> = raw ? JSON.parse(raw) : [];
                    const catalog = await loadCatalogProducts();
                    const byId = new Map(catalog.map((p) => [p.id, p] as const));
                    const subtotal = parsed.reduce((sum, item) => {
                      const product = byId.get(item.id);
                      return product ? sum + product.price * item.quantity : sum;
                    }, 0);
                    const result = await validatePromoCode({ code, subtotal: subtotal.toFixed(2) });
                    localStorage.setItem("checkout-promo-code", result.promo.code);
                    setPromoCode(result.promo.code);
                    setPromoMsg(`${result.promo.code} ${t("cart.promoApplied")} - ${Number(result.discount_amount).toFixed(2)} \u20BC`);
                  } catch (err) {
                    localStorage.removeItem("checkout-promo-code");
                    setPromoErr(err instanceof Error ? err.message : t("checkout.submitError"));
                  }
                }}
                className="bg-white text-black px-5 py-3 rounded-2xl font-medium hover:bg-zinc-100 transition-all"
              >
                {t("cart.apply")}
              </button>
            </div>
            {promoCode.trim() && !isLoggedIn && (
              <p className="text-xs text-amber-400">{t("checkout.promoLoginHint")}</p>
            )}
            {promoErr && <p className="text-xs text-red-400">{promoErr}</p>}
            {promoMsg && <p className="text-xs text-green-400">{promoMsg}</p>}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-zinc-400" />
            <h2 className="font-medium">{t("checkout.address")}</h2>
          </div>
          {requiresAddress ? (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("checkout.addrInput")}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
          ) : (
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-3 space-y-2">
              <p className="font-medium mb-1">{t("checkout.savedAddress")}</p>
              <p className="text-sm text-zinc-400">{address || t("checkout.defaultAddress")}</p>
              <p className="text-xs text-zinc-500">{t("checkout.addressOptionalHint")}</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-zinc-400" />
            <h2 className="font-medium">{t("checkout.delivery")}</h2>
          </div>
          <div className="space-y-3">
            {deliveryMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedDelivery(method.id)}
                className={`w-full bg-zinc-900 rounded-2xl p-4 border text-left flex items-center justify-between transition-all ${
                  selectedDelivery === method.id ? "border-white" : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div>
                  <p className="font-medium mb-0.5">{method.label}</p>
                  <p className="text-sm text-zinc-400">{method.eta}</p>
                </div>
                <p className="font-medium">
                  {method.id === "city_courier"
                    ? t("checkout.delivery.cityCourierFee")
                    : method.fee === 0
                      ? t("checkout.delivery.free")
                      : `${method.fee.toFixed(2)} \u20BC`}
                </p>
              </button>
            ))}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="font-medium mb-0.5">{t("checkout.cod")}</p>
              <p className="text-sm text-zinc-400">{t("checkout.codDesc")}</p>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            setError(null);
            if (!fullName || !phone || (requiresAddress && !address)) {
              setError(requiresAddress ? t("checkout.requiredError") : t("checkout.basicRequiredError"));
              return;
            }
            if (!selectedMethod) {
              setError(t("checkout.deliveryRequiredError"));
              return;
            }
            if (promoCode.trim() && !isLoggedIn) {
              setError(t("checkout.promoLoginRequired"));
              return;
            }
            try {
              setSubmitting(true);
              const raw = localStorage.getItem("cart-items");
              const parsed: Array<{ id: number; quantity: number; slug?: string }> = raw ? JSON.parse(raw) : [];
              if (parsed.length === 0) {
                setError(t("cart.empty"));
                return;
              }
              const catalog = await loadCatalogProducts();
              const byId = new Map(catalog.map((p) => [p.id, p] as const));
              const result = await createOrder({
                full_name: fullName,
                phone,
                address: requiresAddress ? address : address || t("checkout.defaultAddress"),
                notes: promoCode.trim() ? `${notes}\nPromo: ${promoCode.trim()}`.trim() : notes,
                promo_code: promoCode.trim() || undefined,
                shipping_fee: selectedMethod.fee.toFixed(2),
                items: parsed.map((i) => ({
                  product_id: i.id,
                  product_slug: i.slug ?? byId.get(i.id)?.slug,
                  quantity: i.quantity,
                })),
              });
              if (isLoggedIn && !profileHadAddress && address.trim()) {
                await updateMe({
                  full_name: fullName.trim(),
                  phone: phone.trim(),
                  address: address.trim(),
                });
              }
              clearCart();
              localStorage.removeItem("checkout-promo-code");
              setPlacedOrder(result);
              setStep("success");
            } catch {
              setError(t("checkout.submitError"));
            } finally {
              setSubmitting(false);
            }
          }}
          className="w-full bg-white text-black rounded-2xl py-4 font-medium hover:bg-zinc-100 transition-all"
        >
          {submitting ? t("checkout.submitting") : t("checkout.place")}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}


