import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n";
import { createOrder } from "../lib/api";
import { getAuthToken, getMe, updateMe } from "../lib/auth";

type DeliveryMethod = {
  id: "city_courier" | "metro_drop" | "azerpost" | "pickup";
  label: string;
  eta: string;
  fee: number;
};

export function Checkout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState<"info" | "success">("info");
  const [orderCode, setOrderCode] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
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

  useEffect(() => {
    const code = promoCode.trim();
    if (!code) {
      localStorage.removeItem("checkout-promo-code");
      return;
    }
    localStorage.setItem("checkout-promo-code", code);
  }, [promoCode]);

  if (step === "success") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl mb-2">{t("checkout.success")}</h2>
        <p className="text-sm text-zinc-400 mb-2 text-center">{t("checkout.successSub")}</p>
        <p className="text-xs text-zinc-500 mb-8">{t("checkout.orderCode")} #{orderCode || "N/A"}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-white text-black px-8 py-3.5 rounded-2xl font-medium hover:bg-zinc-100 transition-all mb-3"
        >
          {t("checkout.continue")}
        </button>
        <button onClick={() => navigate("/profile")} className="text-sm text-zinc-400 hover:text-white transition-colors">
          {t("checkout.orderDetails")}
        </button>
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
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("checkout.addrInput")}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("checkout.notes")}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder={t("checkout.promo")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
            />
            {promoCode.trim() && !isLoggedIn && (
              <p className="text-xs text-amber-400">{t("checkout.promoLoginHint")}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-zinc-400" />
            <h2 className="font-medium">{t("checkout.address")}</h2>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-3">
            <p className="font-medium mb-1">{t("checkout.home")}</p>
            <p className="text-sm text-zinc-400">{address || t("checkout.defaultAddress")}</p>
          </div>
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
                <p className="font-medium">{method.fee === 0 ? t("checkout.delivery.free") : `${method.fee.toFixed(2)} \u20BC`}</p>
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
            if (!fullName || !phone || !address) {
              setError(t("checkout.requiredError"));
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
              const parsed: Array<{ id: number; quantity: number }> = raw ? JSON.parse(raw) : [];
              if (parsed.length === 0) {
                setError(t("cart.empty"));
                return;
              }
              const result = await createOrder({
                full_name: fullName,
                phone,
                address,
                notes: promoCode.trim() ? `${notes}\nPromo: ${promoCode.trim()}`.trim() : notes,
                shipping_fee: selectedMethod.fee.toFixed(2),
                items: parsed.map((i) => ({ product_id: i.id, quantity: i.quantity })),
              });
              if (isLoggedIn && !profileHadAddress && address.trim()) {
                await updateMe({
                  full_name: fullName.trim(),
                  phone: phone.trim(),
                  address: address.trim(),
                });
              }
              setOrderCode(result.code);
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


