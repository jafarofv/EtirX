import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { User, Mail, Lock, LogOut, Shield, Phone, ChevronRight, ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n";
import {
  changePassword,
  getMe,
  getMyOrders,
  loginAuth,
  logoutAuth,
  registerAuth,
  updateMe,
  type AuthUser,
  type UserOrder,
} from "../lib/auth";
import { syncStoredCollections, hydrateCollectionsFromServer } from "../lib/storage";
import { orderStatusLabel, orderStatusStyle } from "../lib/orderStatus";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";
import { Seo } from "../components/Seo";

function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);

  const loadOrders = async () => {
    try {
      setOrders(await getMyOrders());
    } catch {
      setOrders([]);
    }
  };

  const refresh = async () => {
    try {
      const me = await getMe();
      setUser(me);
      await loadOrders();
    } catch {
      setUser(null);
      setOrders([]);
    }
  };

  return { user, setUser, orders, setOrders, loadOrders, refresh };
}

export function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { user, setUser, orders, loadOrders, refresh } = useAuthState();

  const [mode, setMode] = useState<"login" | "register">(
    location.state &&
      typeof location.state === "object" &&
      "mode" in location.state &&
      location.state.mode === "register"
      ? "register"
      : "login"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const nextPath =
    location.state &&
    typeof location.state === "object" &&
    "next" in location.state &&
    typeof location.state.next === "string"
      ? location.state.next
      : null;

  useEffect(() => {
    refresh();
  }, []);

  const isLoggedIn = Boolean(user);
  const title = useMemo(
    () => (isLoggedIn ? t("profile.myAccount") : t("profile.loginRegister")),
    [isLoggedIn, t]
  );
  const fmt = (value: string) => formatCurrency(Number(value));

  const onRegister = async () => {
    setError(null);
    setSuccess(null);
    const errs: Record<string, string> = {};
    if (!/^[\p{L}\p{N} .'-]{2,60}$/u.test(fullName.trim())) errs.fullName = t("profile.nameErr");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = t("profile.emailErr");
    if (!/^\+?[0-9]{9,15}$/.test(phone.trim())) errs.phone = t("profile.phoneErr");
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) errs.password = t("profile.passErr");
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(t("profile.fixErr"));
      return;
    }

    try {
      setLoading(true);
      const created = await registerAuth({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      setUser(created);
      setPassword("");
      setSuccess(t("profile.accountCreated"));
      await hydrateCollectionsFromServer();
      await syncStoredCollections();
      await loadOrders();
      if (nextPath) navigate(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    setError(null);
    setSuccess(null);
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = t("profile.emailErr");
    if (!password) errs.password = t("profile.passwordRequired");
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError(t("profile.fixErr"));
      return;
    }
    try {
      setLoading(true);
      const logged = await loginAuth({ email: email.trim().toLowerCase(), password });
      setUser(logged);
      setPassword("");
      setSuccess(t("profile.loginSuccess"));
      await hydrateCollectionsFromServer();
      await syncStoredCollections();
      await loadOrders();
      if (nextPath) navigate(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.badLogin"));
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await logoutAuth();
    setUser(null);
    setSuccess(null);
  };

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <Seo
          title="Profil | ƏtirX"
          description="İstifadəçi profil səhifəsi."
          path="/profile"
          noindex
        />
        <h1 className="font-display text-4xl mb-6">{title}</h1>

        <div className="glass rounded-3xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full glass flex items-center justify-center">
              <User className="w-7 h-7 text-gold" />
            </div>
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="text-xs text-zinc-500">{user.phone}</p>
              <p className="text-xs text-zinc-500">{user.address || t("profile.addressNotSet")}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-2 mb-4">
          <button
            onClick={() => navigate("/profile/edit")}
            className="w-full px-4 py-3 rounded-2xl hover:bg-zinc-800 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" /> {t("profile.editProfile")}
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
          <button
            onClick={() => navigate("/profile/password")}
            className="w-full px-4 py-3 rounded-2xl hover:bg-zinc-800 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> {t("profile.changePassword")}
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="glass rounded-3xl p-6 mb-6">
          <h2 className="font-display text-2xl mb-3">{t("profile.myOrders")}</h2>
          <div className="space-y-4">
            {orders.length === 0 && (
              <p className="text-sm text-zinc-500">{t("profile.noOrders")}</p>
            )}
            {orders.map((o) => (
              <div key={o.code} className="glass rounded-[20px] p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-sm text-zinc-500">#{o.code}</span>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${orderStatusStyle(o.status)}`}
                      >
                        {orderStatusLabel(o.status)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">
                      {t("profile.total")}
                    </p>
                    <p className="text-gold text-xl font-medium">{fmt(o.total)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 overflow-hidden">
                  {o.items.slice(0, 3).map((item) => (
                    <div
                      key={`${o.code}-${item.product}`}
                      className="w-12 h-12 rounded-xl overflow-hidden glass shrink-0"
                    >
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        onError={onImageError}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {o.items.length > 3 && (
                    <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-xs text-zinc-300 shrink-0">
                      +{o.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {o.items.map((item) => (
                    <div
                      key={`${o.code}-${item.product}-${item.variant_label || "variant"}-${item.unit_price}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-zinc-300 truncate">
                        {item.product_name}
                        {item.variant_label ? (
                          <span className="text-zinc-500"> • {item.variant_label}</span>
                        ) : null}
                        <span className="text-zinc-500"> x{item.quantity}</span>
                      </span>
                      <span className="text-zinc-400">{fmt(item.unit_price)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800 text-sm">
                  <div className="bg-zinc-900/60 rounded-xl p-3">
                    <p className="text-zinc-500 text-xs mb-1">Status</p>
                    <p className="font-medium">{orderStatusLabel(o.status)}</p>
                  </div>
                  <div className="bg-zinc-900/60 rounded-xl p-3">
                    <p className="text-zinc-500 text-xs mb-1">{t("cart.shipping")}</p>
                    <p className="font-medium">{fmt(o.shipping_fee)}</p>
                  </div>
                  {!!o.promo_code && (
                    <div className="bg-zinc-900/60 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs mb-1">{t("checkout.promo")}</p>
                      <p className="font-medium">{o.promo_code}</p>
                    </div>
                  )}
                  {Number(o.discount_amount || "0") > 0 && (
                    <div className="bg-zinc-900/60 rounded-xl p-3">
                      <p className="text-zinc-500 text-xs mb-1">Endirim</p>
                      <p className="font-medium text-emerald-400">-{fmt(o.discount_amount)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {success && <p className="text-green-400 text-sm mb-4">{success}</p>}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={onLogout}
          className="w-full glass hover:bg-red-950/40 hover:border-red-900 rounded-2xl p-4 flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span className="text-red-500">{t("profile.logout")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
      <Seo
        title="Giriş / Qeydiyyat | ƏtirX"
        description="İstifadəçi girişi və qeydiyyat."
        path="/profile"
        noindex
      />
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-full glass flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-gold" />
          </div>
          <h1 className="font-display text-3xl">{title}</h1>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="grid grid-cols-2 gap-1 p-1 glass rounded-2xl mb-5">
            <button
              onClick={() => setMode("login")}
              className={`py-2.5 rounded-xl text-sm transition-all ${mode === "login" ? "bg-gold text-[#1a1206] font-semibold" : "text-zinc-300 hover:text-white"}`}
            >
              {t("profile.login")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`py-2.5 rounded-xl text-sm transition-all ${mode === "register" ? "bg-gold text-[#1a1206] font-semibold" : "text-zinc-300 hover:text-white"}`}
            >
              {t("profile.register")}
            </button>
          </div>

          {mode === "register" && (
            <div className="space-y-2.5">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("profile.fullName")}
                  aria-label={t("profile.fullName")}
                  className={`w-full glass premium-input rounded-xl py-2.5 pl-10 pr-3 ${fieldErrors.fullName ? "border-red-500" : ""}`}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("profile.email")}
                  aria-label={t("profile.email")}
                  type="email"
                  className={`w-full glass premium-input rounded-xl py-2.5 pl-10 pr-3 ${fieldErrors.email ? "border-red-500" : "border-zinc-700"}`}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("profile.phone")}
                  aria-label={t("profile.phone")}
                  className={`w-full glass premium-input rounded-xl py-2.5 pl-10 pr-3 ${fieldErrors.phone ? "border-red-500" : "border-zinc-700"}`}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("profile.password")}
                  aria-label={t("profile.password")}
                  type="password"
                  className={`w-full glass premium-input rounded-xl py-2.5 pl-10 pr-3 ${fieldErrors.password ? "border-red-500" : "border-zinc-700"}`}
                />
              </div>
              <button
                disabled={loading}
                onClick={onRegister}
                className="btn-gold w-full rounded-xl py-3 mt-1"
              >
                {loading ? "..." : t("profile.createAccount")}
              </button>
            </div>
          )}

          {mode === "login" && (
            <div className="space-y-2.5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("profile.email")}
                  aria-label={t("profile.email")}
                  type="email"
                  className={`w-full glass premium-input rounded-xl py-2.5 pl-10 pr-3 ${fieldErrors.email ? "border-red-500" : "border-zinc-700"}`}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("profile.password")}
                  aria-label={t("profile.password")}
                  type="password"
                  className={`w-full glass premium-input rounded-xl py-2.5 pl-10 pr-3 ${fieldErrors.password ? "border-red-500" : "border-zinc-700"}`}
                />
              </div>
              <button
                disabled={loading}
                onClick={onLogin}
                className="btn-gold w-full rounded-xl py-3 mt-1"
              >
                {loading ? "..." : t("profile.login")}
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          {success && <p className="text-green-400 text-sm mt-3">{success}</p>}

          <div className="mt-5 pt-4 border-t border-white/10 text-xs text-zinc-500 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            {t("profile.authEnabled")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditProfilePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setFullName(me.full_name);
        setPhone(me.phone);
        setAddress(me.address ?? "");
      } catch {
        setErr(t("profile.loadFailed"));
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [navigate, t]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <Seo
        title="Profili redaktə et | ƏtirX"
        description="Profil məlumatlarını yenilə."
        path="/profile/edit"
        noindex
      />
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-gold transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-4xl">{t("profile.editTitle")}</h1>
      </div>

      <div className="glass rounded-3xl p-6 space-y-3">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full glass premium-input rounded-xl py-3 px-3"
          placeholder={t("profile.fullName")}
          aria-label={t("profile.fullName")}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full glass premium-input rounded-xl py-3 px-3"
          placeholder={t("profile.phone")}
          aria-label={t("profile.phone")}
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full glass premium-input rounded-xl py-3 px-3"
          rows={4}
          placeholder={t("profile.address")}
          aria-label={t("profile.address")}
        />
        <button
          disabled={loading}
          onClick={async () => {
            setErr(null);
            setMsg(null);
            try {
              setLoading(true);
              await updateMe({
                full_name: fullName.trim(),
                phone: phone.trim(),
                address: address.trim(),
              });
              setMsg(t("profile.updated"));
            } catch (e) {
              setErr(e instanceof Error ? e.message : t("profile.updateFailed"));
            } finally {
              setLoading(false);
            }
          }}
          className="btn-gold w-full rounded-xl py-3"
        >
          {loading ? "..." : t("profile.save")}
        </button>
        {msg && <p className="text-green-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    </div>
  );
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <Seo
        title="Şifrəni dəyiş | ƏtirX"
        description="Hesab şifrəsini yenilə."
        path="/profile/password"
        noindex
      />
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-gold transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-4xl">{t("profile.passwordTitle")}</h1>
      </div>

      <div className="glass rounded-3xl p-6 space-y-3">
        <input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          type="password"
          className="w-full glass premium-input rounded-xl py-3 px-3"
          placeholder={t("profile.currentPassword")}
          aria-label={t("profile.currentPassword")}
        />
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          className="w-full glass premium-input rounded-xl py-3 px-3"
          placeholder={t("profile.newPassword")}
          aria-label={t("profile.newPassword")}
        />
        <button
          disabled={loading}
          onClick={async () => {
            setErr(null);
            setMsg(null);
            try {
              setLoading(true);
              await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
              });
              setCurrentPassword("");
              setNewPassword("");
              setMsg(t("profile.passwordUpdated"));
            } catch (e) {
              setErr(e instanceof Error ? e.message : t("profile.passwordUpdateFailed"));
            } finally {
              setLoading(false);
            }
          }}
          className="btn-gold w-full rounded-xl py-3"
        >
          {loading ? "..." : t("profile.updatePasswordBtn")}
        </button>
        {msg && <p className="text-green-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    </div>
  );
}
