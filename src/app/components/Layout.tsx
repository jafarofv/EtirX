import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Home,
  ShoppingCart,
  Heart,
  User,
  Globe,
  Sun,
  Moon,
  Menu,
  MessageCircle,
  Instagram,
  Star,
  ChevronRight,
} from "lucide-react";
import { useI18n, type Language } from "../i18n";
import { useTheme } from "../theme";
import { getCartCount, getFavoritesCount } from "../lib/storage";
import { getTestimonials, type ApiTestimonial } from "../lib/api";
import { useSiteSettings } from "../site-settings";
import { Seo } from "./Seo";

// Shown if the API is unreachable or returns no rows, so the storefront still
// renders social proof. The same three reviews are seeded into the DB, so once
// the API responds these are replaced by the admin-managed copies.
const FALLBACK_REVIEWS: ApiTestimonial[] = [
  {
    id: -1,
    name: "Aysel M.",
    handle: "@aysel_m",
    time: "2 saat əvvəl",
    rating: 5,
    text: "Qoxu həqiqətən premium hiss verir. Qablaşdırma və çatdırılma da çox səliqəli idi.",
  },
  {
    id: -2,
    name: "Rəşad K.",
    handle: "@rashadk",
    time: "Dünən",
    rating: 5,
    text: "Sifariş prosesi rahat oldu, WhatsApp-da tez cavab verdilər. Ətir seçimi də çox yaxşıdır.",
  },
  {
    id: -3,
    name: "Lalə N.",
    handle: "@lale_n",
    time: "3 gün əvvəl",
    rating: 5,
    text: "Ətir təsviri ilə gələn məhsul tam uyğun idi. Xüsusi notlar da dəqiq yazılıb, çox faydalıdır.",
  },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const site = useSiteSettings();
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
    { to: "/perfumes", label: t("menu.shop") },
    { to: "/categories", label: t("menu.category") },
    { to: "/kampaniyalar", label: t("menu.campaigns") },
    { to: "/haqqimizda", label: t("menu.about") },
    { to: "/catdirilma", label: t("menu.shipping") },
    { to: "/faq", label: t("menu.faq") },
    { to: "/elaqe", label: t("menu.contact") },
    { to: "/gizlilik", label: t("menu.privacy") },
    { to: "/sertler", label: t("menu.terms") },
  ];
  const promoLines = [site.banner_text || t("promo.line1"), t("promo.line2"), t("promo.line3")];
  const socialLinks = [
    { href: site.whatsappUrl, label: "WhatsApp", kind: "whatsapp" },
    { href: site.instagram_url, label: "Instagram", kind: "instagram" },
    { href: site.tiktok_url, label: "TikTok", kind: "tiktok" },
  ].filter((link) => link.href);
  const showReviews = location.pathname === "/" || location.pathname.startsWith("/product/");
  const [reviews, setReviews] = useState<ApiTestimonial[]>(FALLBACK_REVIEWS);
  const langFlags: Record<Language, string> = {
    az: "\uD83C\uDDE6\uD83C\uDDFF",
    en: "\uD83C\uDDEC\uD83C\uDDE7",
    ru: "\uD83C\uDDF7\uD83C\uDDFA",
  };
  const logoSrc = theme === "light" ? "/logo-light.png" : "/logo-dark.png";

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

  useEffect(() => {
    let active = true;
    getTestimonials()
      .then((data) => {
        if (active && data.length > 0) setReviews(data);
      })
      .catch(() => {
        // keep FALLBACK_REVIEWS on failure
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <Seo
        title="ƏtirX | Premium Ətir Mağazası"
        description="ƏtirX-də premium qadın, kişi və uniseks ətirləri notlara görə axtarın, seçin və qapıda ödənişlə sifariş edin."
        path={`${location.pathname}${location.search}`}
        lang={language}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "ƏtirX",
            url: typeof window !== "undefined" ? window.location.origin : "",
            logo: typeof window !== "undefined" ? `${window.location.origin}/logo-dark.png` : "",
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "ƏtirX",
            url: typeof window !== "undefined" ? window.location.origin : "",
            potentialAction: {
              "@type": "SearchAction",
              target: `${typeof window !== "undefined" ? window.location.origin : ""}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      <div className="w-full min-h-screen flex flex-col relative">
        <div className="sticky top-0 z-30">
          <div className="promo-strip">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="promo-badge shrink-0">ETIRX10</span>
                <div className="min-w-0">
                  <p className="truncate text-sm sm:text-[15px] font-semibold tracking-wide text-white">
                    {site.banner_text || promoLines[0]}
                  </p>
                  <p className="truncate text-[11px] sm:text-xs text-white/70">{promoLines[2]}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="promo-chip">{promoLines[1]}</span>
                <span className="promo-chip">{t("promo.line3")}</span>
              </div>
            </div>
          </div>
          <header className="md:hidden border-b border-white/5 bg-black/70 backdrop-blur-xl">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center"
                aria-label="EtirX home"
              >
                <img src={logoSrc} alt="EtirX" className="h-12 w-12 object-cover" />
              </button>
              <div className="flex items-center gap-2">
                <div ref={langMobileRef} className="relative">
                  <button
                    onClick={() => {
                      setIsLangOpen((v) => !v);
                    }}
                    aria-label={t("a11y.language")}
                    className="px-3 py-1.5 text-base rounded-lg glass hover:border-gold flex items-center gap-2"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {langFlags[language]}
                  </button>
                  {isLangOpen && (
                    <div className="absolute right-0 mt-2 w-24 rounded-xl glass hover:border-gold p-1">
                      {langs.map((lang) => (
                        <button
                          key={`m-${lang}`}
                          onClick={() => {
                            setLanguage(lang);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-base rounded-lg ${
                            language === lang
                              ? "bg-gold text-[#1a1206]"
                              : "text-zinc-300 hover:bg-zinc-800"
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
                    className="px-3 py-1.5 text-xs rounded-lg glass hover:border-gold flex items-center gap-2"
                  >
                    {theme === "dark" ? (
                      <Moon className="w-3.5 h-3.5" />
                    ) : (
                      <Sun className="w-3.5 h-3.5" />
                    )}
                    <span>{theme === "dark" ? "Qara" : "Ağ"}</span>
                  </button>
                </div>
                <div ref={pagesMobileRef} className="relative">
                  <button
                    onClick={() => {
                      setIsPagesOpen((v) => !v);
                      setIsLangOpen(false);
                    }}
                    aria-label={t("a11y.menu")}
                    className="px-3 py-1.5 text-xs rounded-lg glass hover:border-gold flex items-center gap-2"
                  >
                    <Menu className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </header>
        </div>
        <header className="hidden md:block sticky top-[56px] z-20 border-b border-white/5 bg-black/70 backdrop-blur-xl">
          <div className="w-full px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center"
              aria-label="EtirX home"
            >
              <img src={logoSrc} alt="EtirX" className="h-14 w-14 object-cover" />
            </button>
            <nav className="flex items-center gap-2">
              <div ref={langDesktopRef} className="relative mr-2">
                <button
                  onClick={() => {
                    setIsLangOpen((v) => !v);
                  }}
                  aria-label={t("a11y.language")}
                  className="px-3 py-2 text-xs rounded-xl glass hover:border-gold uppercase flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-base leading-none">{langFlags[language]}</span>
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-28 rounded-xl glass hover:border-gold p-1">
                    {langs.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-base rounded-lg ${
                          language === lang
                            ? "bg-gold text-[#1a1206]"
                            : "text-zinc-300 hover:bg-zinc-800"
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
                  className="px-3 py-2 text-xs rounded-xl glass hover:border-gold flex items-center gap-2"
                >
                  {theme === "dark" ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                  <span>{theme === "dark" ? "Qara" : "Ağ"}</span>
                </button>
              </div>
              <div ref={pagesDesktopRef} className="relative mr-3">
                <button
                  onClick={() => {
                    setIsPagesOpen((v) => !v);
                    setIsLangOpen(false);
                  }}
                  aria-label={t("a11y.menu")}
                  className="px-3 py-2 text-xs rounded-xl glass hover:border-gold flex items-center gap-2"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
              </div>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const badge =
                  item.path === "/cart"
                    ? cartCount
                    : item.path === "/favorites"
                      ? favoritesCount
                      : 0;
                return (
                  <button
                    key={`desktop-${item.path}`}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-gold text-[#1a1206] font-medium"
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
          <Outlet />
          {showReviews && (
            <section className="px-4 sm:px-6 lg:px-8 py-10 md:py-14">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">
                      {t("reviews.badge")}
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl">{t("reviews.title")}</h2>
                    <p className="text-sm text-zinc-400 mt-2">{t("reviews.subtitle")}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {reviews.map((review, index) => (
                    <article
                      key={review.id}
                      className={`glass premium-card rounded-[28px] p-5 ${
                        index === 1 ? "md:-translate-y-3" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gold text-[#1a1206] flex items-center justify-center font-semibold">
                          {review.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium leading-tight">{review.name}</p>
                              <p className="text-xs text-zinc-500">{review.handle}</p>
                            </div>
                            <div className="flex items-center gap-1 text-gold shrink-0">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star
                                  key={`${review.id}-${i}`}
                                  aria-hidden="true"
                                  className="w-3.5 h-3.5 fill-current"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-1 -top-2 text-3xl text-zinc-800">"</span>
                        <p className="relative text-sm text-zinc-300 leading-7 pl-4">
                          {review.text}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                        <span>{review.time}</span>
                        <span className="px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/80">
                          Nümunə
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
          <footer className="site-footer border-t border-zinc-800 bg-zinc-950 px-4 sm:px-6 lg:px-8 py-10 md:py-12">
            <div className="grid gap-8 md:grid-cols-[1.1fr_1.4fr_1fr]">
              <div>
                <Link to="/" className="inline-flex items-center gap-3 mb-4">
                  <img src={logoSrc} alt="EtirX" className="h-12 w-12 object-cover" />
                  <span className="font-display text-2xl">{t("brand.name")}</span>
                </Link>
                <p className="text-sm text-zinc-400 leading-6 max-w-sm">{t("footer.about")}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">{t("footer.pages")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {t("nav.home")}
                  </Link>
                  <Link
                    to="/favorites"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {t("nav.favorites")}
                  </Link>
                  <Link
                    to="/cart"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {t("nav.cart")}
                  </Link>
                  <Link
                    to="/profile"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {t("nav.profile")}
                  </Link>
                  {extraPages.map((page) => (
                    <Link
                      key={`footer-${page.to}`}
                      to={page.to}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {page.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">{t("footer.follow")}</h3>
                <div className="flex gap-2">
                  {socialLinks.map((item) => {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:border-gold transition-all"
                      >
                        {item.kind === "whatsapp" && (
                          <MessageCircle className="w-5 h-5 text-emerald-400" />
                        )}
                        {item.kind === "instagram" && (
                          <Instagram className="w-5 h-5 text-pink-300" />
                        )}
                        {item.kind === "tiktok" && (
                          <span className="text-sm font-semibold text-white">♪</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-zinc-500">
              <p>© 2026 EtirX. {t("footer.rights")}</p>
              <p className="text-zinc-400">{t("footer.slogan")}</p>
            </div>
          </footer>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/80 backdrop-blur-xl border-t border-white/5 px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const badge =
                item.path === "/cart" ? cartCount : item.path === "/favorites" ? favoritesCount : 0;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 relative"
                >
                  <div
                    className={`p-2.5 rounded-2xl transition-all relative ${
                      isActive ? "bg-gold text-[#1a1206]" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] transition-all ${
                      isActive ? "text-white font-medium" : "text-zinc-500"
                    }`}
                  >
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
              className="menu-drawer fixed top-0 right-0 h-full w-[85%] max-w-sm z-[60] bg-zinc-950 border-l border-zinc-800 transition-transform duration-300 translate-x-0"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <p className="font-medium">{t("menu.title")}</p>
                <button
                  onClick={() => setIsPagesOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg glass hover:border-gold"
                >
                  {t("menu.close")}
                </button>
              </div>
              <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-57px)]">
                {extraPages.map((page) => (
                  <Link
                    key={`drawer-${page.to}`}
                    to={page.to}
                    onClick={() => setIsPagesOpen(false)}
                    className="group flex items-center justify-between px-3.5 py-3 text-sm rounded-xl text-zinc-200 glass hover:border-gold transition-all"
                  >
                    <span className="font-medium tracking-wide">{page.label}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
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
