import { useMemo, useState } from "react";
import { User, Mail, Lock, LogOut, Shield, Phone } from "lucide-react";
import { useI18n } from "../i18n";

type AuthUser = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("auth-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function Profile() {
  const { t } = useI18n();
  const [storedUser, setStoredUser] = useState<AuthUser | null>(() => getStoredUser());
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLoggedIn = Boolean(localStorage.getItem("auth-session") && storedUser);
  const title = useMemo(() => (isLoggedIn ? t("profile.myAccount") : t("profile.loginRegister")), [isLoggedIn, t]);

  const onRegister = () => {
    setError(null);
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

    const user: AuthUser = { fullName, email, phone, password };
    localStorage.setItem("auth-user", JSON.stringify(user));
    localStorage.setItem("auth-session", email);
    setStoredUser(user);
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

  const onLogin = () => {
    setError(null);
    const user = getStoredUser();
    if (!user) {
      setError(t("profile.noUser"));
      return;
    }
    if (user.email !== email || user.password !== password) {
      setError(t("profile.badLogin"));
      return;
    }
    localStorage.setItem("auth-session", user.email);
    setStoredUser(user);
    setEmail("");
    setPassword("");
  };

  const onLogout = () => {
    localStorage.removeItem("auth-session");
    setStoredUser(getStoredUser());
  };

  if (isLoggedIn && storedUser) {
    return (
      <div className="min-h-screen bg-black text-white pb-8 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <h1 className="text-2xl mb-6">{title}</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <p className="font-medium">{storedUser.fullName}</p>
              <p className="text-sm text-zinc-400">{storedUser.email}</p>
              <p className="text-xs text-zinc-500">{storedUser.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-800/60 rounded-xl p-3">{t("profile.codEnabled")}</div>
            <div className="bg-zinc-800/60 rounded-xl p-3">{t("profile.notificationsEnabled")}</div>
          </div>
        </div>

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
            {fieldErrors.fullName && <p className="text-red-400 text-xs">{fieldErrors.fullName}</p>}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("profile.email")} type="email" className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.email ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            {fieldErrors.email && <p className="text-red-400 text-xs">{fieldErrors.email}</p>}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("profile.phone")} className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.phone ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            {fieldErrors.phone && <p className="text-red-400 text-xs">{fieldErrors.phone}</p>}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("profile.password")} type="password" className={`w-full bg-zinc-800 border rounded-xl py-3 pl-10 pr-3 ${fieldErrors.password ? "border-red-500" : "border-zinc-700"}`} />
            </div>
            {fieldErrors.password && <p className="text-red-400 text-xs">{fieldErrors.password}</p>}
            <button onClick={onRegister} className="w-full bg-white text-black rounded-xl py-3">{t("profile.createAccount")}</button>
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
            <button onClick={onLogin} className="w-full bg-white text-black rounded-xl py-3">{t("profile.login")}</button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <div className="mt-5 text-xs text-zinc-500 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t("profile.demoInfo")}
        </div>
      </div>
    </div>
  );
}
