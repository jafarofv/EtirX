import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n";
import { createOrder } from "../lib/api";

export function Checkout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState<"info" | "success">("info");
  const [orderCode, setOrderCode] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="font-medium mb-0.5">{t("checkout.standard")}</p>
                <p className="text-sm text-zinc-400">{t("checkout.deliveryEta")}</p>
              </div>
              <p className="font-medium">4.99 ₼</p>
            </div>
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
            try {
              setSubmitting(true);
              const raw = localStorage.getItem("cart-items");
              const parsed: Array<{ id: number; quantity: number }> = raw ? JSON.parse(raw) : [];
              const result = await createOrder({
                full_name: fullName,
                phone,
                address,
                notes,
                shipping_fee: "4.99",
                items: parsed.map((i) => ({ product_id: i.id, quantity: i.quantity })),
              });
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
