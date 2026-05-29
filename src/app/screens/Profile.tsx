import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Lock, LogOut, Shield, Phone, MapPin, ChevronRight, ArrowLeft } from "lucide-react";
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
  const { t } = useI18n();
  const { user, setUser, orders, loadOrders, refresh } = useAuthState();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const isLoggedIn = Boolean(user);
  const title = useMemo(() => (isLoggedIn ? t("profile.myAccount") : t("profile.loginRegister")), [isLoggedIn, t]);

  const onRegister = async () => {
    setError(null);
    setSuccess(null);
    const errs: Record<string, string> = {};
    if (!/^[A-Za-z0-9 ]{2,60}$/.test(fullName.trim())) errs.fullName = t("profile.nameErr");
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
        address: address.trim(),
        password,
      });
      setUser(created);
      setPassword("");
      setSuccess(t("profile.accountCreated"));
      await loadOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const logged = await loginAuth({ email: email.trim().toLowerCase(), password });
      setUser(logged);
      setPassword("");
      setSuccess(t("profile.loginSuccess"));
      await loadOrders();
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
        <h1 className="text-2xl mb-6">{title}</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="text-xs text-zinc-500">{user.phone}</p>
              <p className="text-xs text-zinc-500">{user.address || t("profile.addressNotSet")}</p>
            </div>
          </div>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 mb-4">
          <button onClick={() => navigate("/profile/edit")} className="w-full px-4 py-3 rounded-2xl hover:bg-zinc-800 flex items-center justify-between">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {t("profile.editProfile")}</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
          <button onClick={() => navigate("/profile/password")} className="w-full px-4 py-3 rounded-2xl hover:bg-zinc-800 flex items-center justify-between">
            <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t("profile.changePassword")}</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
          <h2 className="text-lg mb-3">{t("profile.myOrders")}</h2>
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-sm text-zinc-500">{t("profile.noOrders")}</p>}
            {orders.map((o) => (
              <div key={o.code} className="bg-zinc-800/70 rounded-xl p-3 border border-zinc-700">
                <div className="flex items-center justify-between text-sm">
                  <span>#{o.code}</span>
                  <span className="uppercase text-zinc-400">{o.status}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                <p className="text-sm mt-1">{t("profile.total")}: {o.total} \u20BC</p>
              </div>
            ))}
          </div>
        </div>

        {success && <p className="text-green-400 text-sm mb-4">{success}</p>}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={onLogout}
          className="w-full bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-900 rounded-2xl p-4 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span className="text-red-500">{t("profile.logout")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <h1 className="text-2xl mb-6">{title}</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <div className="flex gap-2 mb-5">
          <button onClick={() => setMode("login")} className={`px-4 py-2 rounded-xl text-sm ${mode === "login" ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"}`}>
            {t("profile.login")}
          </button>
          <button onClick={() => setMode("register")} className={`px-4 py-2 rounded-xl text-sm ${mode === "register" ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"}`}>
            {t("profile.register")}
          </button>
        </div>

        {mode === "register" && (
          <div className="space-y-3 mb-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("profile.fullName")} className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.fullName ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("profile.email")} type="email" className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.email ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("profile.phone")} className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.phone ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-4 w-4 h-4 text-zinc-500" />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("profile.address")} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-3" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("profile.password")} type="password" className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.password ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            <button disabled={loading} onClick={onRegister} className="w-full bg-white text-black rounded-xl py-3">{loading ? "..." : t("profile.createAccount")}</button>
          </div>
        )}

        {mode === "login" && (
          <div className="space-y-3 mb-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("profile.email")} type="email" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-3" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("profile.password")} type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-3" />
            </div>
            <button disabled={loading} onClick={onLogin} className="w-full bg-white text-black rounded-xl py-3">{loading ? "..." : t("profile.login")}</button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-400 text-sm mt-2">{success}</p>}

        <div className="mt-5 text-xs text-zinc-500 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t("profile.authEnabled")}
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
        navigate("/profile");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl">{t("profile.editTitle")}</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-3" placeholder={t("profile.fullName")} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-3" placeholder={t("profile.phone")} />
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-3" rows={4} placeholder={t("profile.address")} />
        <button
          disabled={loading}
          onClick={async () => {
            setErr(null);
            setMsg(null);
            try {
              setLoading(true);
              await updateMe({ full_name: fullName.trim(), phone: phone.trim(), address: address.trim() });
              setMsg(t("profile.updated"));
            } catch (e) {
              setErr(e instanceof Error ? e.message : t("profile.updateFailed"));
            } finally {
              setLoading(false);
            }
          }}
          className="w-full bg-white text-black rounded-xl py-3"
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl">{t("profile.passwordTitle")}</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-3" placeholder={t("profile.currentPassword")} />
        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-3" placeholder={t("profile.newPassword")} />
        <button
          disabled={loading}
          onClick={async () => {
            setErr(null);
            setMsg(null);
            try {
              setLoading(true);
              await changePassword({ current_password: currentPassword, new_password: newPassword });
              setCurrentPassword("");
              setNewPassword("");
              setMsg(t("profile.passwordUpdated"));
            } catch (e) {
              setErr(e instanceof Error ? e.message : t("profile.passwordUpdateFailed"));
            } finally {
              setLoading(false);
            }
          }}
          className="w-full bg-white text-black rounded-xl py-3"
        >
          {loading ? "..." : t("profile.updatePasswordBtn")}
        </button>
        {msg && <p className="text-green-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    </div>
  );
}


