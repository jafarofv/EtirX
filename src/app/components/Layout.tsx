import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Home, ShoppingCart, Heart, User, Globe, Sun, Moon, Menu } from "lucide-react";
import { useI18n, type Language } from "../i18n";
import { useTheme } from "../theme";
import { getCartCount, getFavoritesCount } from "../lib/storage";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const langDesktopRef = useRef<HTMLDivElement | null>(null);
  const langMobileRef = useRef<HTMLDivElement | null>(null);
  const pagesDesktopRef = useRef<HTMLDivElement | null>(null);
  const pagesMobileRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: Heart, label: t("nav.favorites"), path: "/favorites" },
    { icon: ShoppingCart, label: t("nav.cart"), path: "/cart" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
  ];
  const langs: Language[] = ["az", "en", "ru"];
  const extraPages = [
    { to: "/shop", label: t("menu.shop") },
    { to: "/categories", label: t("menu.category") },
    { to: "/kampaniyalar", label: t("menu.campaigns") },
    { to: "/haqqimizda", label: t("menu.about") },
    { to: "/catdirilma-qaytarma", label: t("menu.shipping") },
    { to: "/faq", label: t("menu.faq") },
    { to: "/elaqe", label: t("menu.contact") },
    { to: "/gizlilik", label: t("menu.privacy") },
    { to: "/sertler", label: t("menu.terms") },
  ];
  const promoLines = [t("promo.line1"), t("promo.line2"), t("promo.line3")];
  const langFlags: Record<Language, string> = {
    az: "🇦🇿",
    en: "🇬🇧",
    ru: "🇷🇺",
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const inLangDesktop = langDesktopRef.current?.contains(target);
      const inLangMobile = langMobileRef.current?.contains(target);
      const inPagesDesktop = pagesDesktopRef.current?.contains(target);
      const inPagesMobile = pagesMobileRef.current?.contains(target);
      const inDrawer = drawerRef.current?.contains(target);
      if (!inLangDesktop && !inLangMobile) setIsLangOpen(false);
      if (!inPagesDesktop && !inPagesMobile && !inDrawer) setIsPagesOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLangOpen(false);
        setIsPagesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    setIsPagesOpen(false);
    setIsLangOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncCounts = () => {
      setCartCount(getCartCount());
      setFavoritesCount(getFavoritesCount());
    };
    syncCounts();
    window.addEventListener("app-storage-updated", syncCounts as EventListener);
    window.addEventListener("storage", syncCounts);
    return () => {
      window.removeEventListener("app-storage-updated", syncCounts as EventListener);
      window.removeEventListener("storage", syncCounts);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="w-full min-h-screen flex flex-col relative">
        <div className="promo-strip overflow-hidden border-b border-zinc-800 bg-zinc-900">
          <div className="promo-track">
            {promoLines.map((line, idx) => (
              <span key={`p1-${idx}`}>{line}</span>
            ))}
            {promoLines.map((line, idx) => (
              <span key={`p2-${idx}`}>{line}</span>
            ))}
          </div>
        </div>
        <header className="hidden md:block sticky top-[34px] z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
          <div className="w-full px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="text-lg tracking-tight"
            >
              {t("brand.name")}
            </button>
            <nav className="flex items-center gap-2">
              <div ref={langDesktopRef} className="relative mr-2">
                <button
                  onClick={() => {
                    setIsLangOpen((v) => !v);
                  }}
                  className="px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 uppercase flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-base leading-none">{langFlags[language]}</span>
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-28 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                    {langs.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-base rounded-lg ${
                          language === lang ? "bg-white text-black" : "text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {langFlags[lang]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mr-2">
                <button
                  onClick={() => {
                    setIsLangOpen(false);
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                  className="px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 flex items-center gap-2"
                >
                  {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{theme === "dark" ? "Qara" : "Ağ"}</span>
                </button>
              </div>
              <div ref={pagesDesktopRef} className="relative mr-3">
                <button
                  onClick={() => {
                    setIsPagesOpen((v) => !v);
                    setIsLangOpen(false);
                  }}
                  className="px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 flex items-center gap-2"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
              </div>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const badge = item.path === "/cart" ? cartCount : item.path === "/favorites" ? favoritesCount : 0;
                return (
                  <button
                    key={`desktop-${item.path}`}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-white text-black font-medium"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span className="relative inline-flex">
                      <item.icon className="w-4 h-4" />
                      {badge > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4">
                          {badge}
                        </span>
                      )}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="md:hidden sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
            <div className="px-4 py-2.5 flex items-center justify-end gap-2">
              <div ref={langMobileRef} className="relative">
                <button
                  onClick={() => {
                    setIsLangOpen((v) => !v);
                  }}
                  className="px-3 py-1.5 text-base rounded-lg border border-zinc-700 bg-zinc-900 flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {langFlags[language]}
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-24 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                    {langs.map((lang) => (
                      <button
                        key={`m-${lang}`}
                        onClick={() => {
                          setLanguage(lang);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-base rounded-lg ${
                          language === lang ? "bg-white text-black" : "text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {langFlags[lang]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => {
                    setIsLangOpen(false);
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-900 flex items-center gap-2"
                >
                  {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{theme === "dark" ? "Qara" : "Ağ"}</span>
                </button>
              </div>
              <div ref={pagesMobileRef} className="relative">
                <button
                  onClick={() => {
                    setIsPagesOpen((v) => !v);
                    setIsLangOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-900 flex items-center gap-2"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <Outlet />
        </div>

      {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const badge = item.path === "/cart" ? cartCount : item.path === "/favorites" ? favoritesCount : 0;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 relative"
                >
                  <div className={`p-2.5 rounded-2xl transition-all relative ${
                    isActive
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] transition-all ${
                    isActive ? "text-white font-medium" : "text-zinc-500"
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
        {isPagesOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 transition-opacity"
              onClick={() => setIsPagesOpen(false)}
            />
            <aside
              ref={drawerRef}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm z-[60] bg-zinc-950 border-l border-zinc-800 transition-transform duration-300 translate-x-0"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <p className="font-medium">{t("menu.title")}</p>
                <button
                  onClick={() => setIsPagesOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-900"
                >
                  {t("menu.close")}
                </button>
              </div>
              <div className="p-3 space-y-1 overflow-y-auto h-[calc(100%-57px)]">
                {extraPages.map((page) => (
                  <Link
                    key={`drawer-${page.to}`}
                    to={page.to}
                    onClick={() => setIsPagesOpen(false)}
                    className="block px-3 py-3 text-sm rounded-lg text-zinc-200 hover:bg-zinc-800"
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
