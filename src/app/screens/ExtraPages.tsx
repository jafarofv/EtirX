import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ExternalLink, Instagram, MapPin, MessageCircle } from "lucide-react";
import {
  FALLBACK_DELIVERY_METHODS,
  getCampaigns,
  getCategories,
  getDeliveryMethods,
  getProducts,
  getStaticPage,
  type ApiCampaign,
  type ApiCategory,
  type ApiDeliveryMethod,
  type ApiProduct,
  type ApiStaticPage,
} from "../lib/api";
import { useSiteSettings } from "../site-settings";
import { formatCurrency } from "../lib/formatCurrency";
import { onImageError } from "../lib/imageFallback";
import { useI18n } from "../i18n";
import { Seo } from "../components/Seo";
import { ProductGridSkeleton } from "../components/ProductGridSkeleton";

function ProductGrid({ items }: { items: ApiProduct[] }) {
  const { t } = useI18n();
  const fmt = (v: string | number) => formatCurrency(Number(v));
  const latestId = Math.max(...items.map((i) => i.id), 0);
  const hasSlug = (p: ApiProduct, slug: string) =>
    (p.categories ?? []).some((c) => c.slug === slug) || p.category?.slug === slug;
  const badgeFor = (p: ApiProduct) => {
    if (p.old_price) return t("common.sale");
    if (p.is_new_arrival || hasSlug(p, "yeni-gelenler") || p.id >= latestId - 2) return "Yeni";
    if (p.is_best_seller || hasSlug(p, "en-cox-satanlar")) return "Çox Satılan";
    return null;
  };
  const hasStock = (p: ApiProduct) =>
    (p.variants ?? []).some((variant) => variant.is_active && variant.stock > 0) || p.stock > 0;

  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl px-6 py-12 text-center">
        <p className="text-zinc-300 mb-5">{t("shop.noProducts")}</p>
        <Link to="/perfumes" className="btn-gold inline-flex rounded-xl px-5 py-2.5 text-sm">
          {t("favorites.explore")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((p) => (
        <Link
          key={p.id}
          to={`/product/${p.slug}`}
          className="glass premium-card rounded-2xl overflow-hidden"
        >
          <div className="aspect-square overflow-hidden relative">
            <img
              src={p.image_url || (p.images && p.images.length > 0 ? p.images[0] : "")}
              alt={p.name}
              onError={onImageError}
              className="zoom-img w-full h-full object-cover"
            />
            {badgeFor(p) && (
              <div className="badge-lux badge-best absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px]">
                {badgeFor(p)}
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm text-zinc-400">{p.brand}</p>
            <h3 className="font-display text-lg truncate">{p.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {p.gender === "qadin" ? "Qadın" : p.gender === "kisi" ? "Kişi" : "Uniseks"} •{" "}
              {p.volume_ml ?? 100}ml
              {!hasStock(p) && <span className="text-red-400"> • {t("product.outOfStock")}</span>}
            </p>
            <p className="mt-1 text-gold font-medium">{fmt(p.price)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PageWrap({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white pt-8 sm:pt-12 pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl mb-3">{title}</h1>
        <div className="gold-rule mb-4" />
        {subtitle && <p className="text-zinc-400 mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/**
 * Fetch the admin-managed version of a static page for the active language.
 * Returns null until loaded or when no published page exists, so each screen
 * can fall back to its built-in content.
 */
function useStaticPage(slug: string): ApiStaticPage | null {
  const { language } = useI18n();
  const [page, setPage] = useState<ApiStaticPage | null>(null);
  useEffect(() => {
    let active = true;
    getStaticPage(slug, language).then((p) => {
      if (active) setPage(p);
    });
    return () => {
      active = false;
    };
  }, [slug, language]);
  return page;
}

/** Render admin page body: blank lines split paragraphs; text only (no HTML). */
function CmsBody({ body }: { body: string }) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div className="max-w-4xl space-y-4 text-zinc-300 leading-7">
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

export function ShopPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const noteHints = ["oud", "rose", "vanilla", "amber", "musk"];

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        setItems(data);
      } catch {
        setError(t("shop.fallback"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const brands = useMemo(
    () => Array.from(new Set(items.map((i) => i.brand))).filter(Boolean),
    [items]
  );

  const visibleItems = useMemo(() => {
    return items
      .filter((i) => (brand === "all" ? true : i.brand === brand))
      .filter((i) => {
        const q = query.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.top_notes ?? "").toLowerCase().includes(q) ||
          (i.heart_notes ?? "").toLowerCase().includes(q) ||
          (i.base_notes ?? "").toLowerCase().includes(q) ||
          i.category.name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "priceAsc") return Number(a.price) - Number(b.price);
        if (sortBy === "priceDesc") return Number(b.price) - Number(a.price);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.id - a.id;
      });
  }, [items, brand, query, sortBy]);

  return (
    <PageWrap title={t("shop.title")} subtitle={`${visibleItems.length} ${t("shop.count")}`}>
      <Seo
        title="Ətirlər | ƏtirX"
        description="Marka, not və qiymətə görə premium ətirləri sıralayın və seçin."
        path="/perfumes"
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("shop.search")}
          aria-label={t("shop.search")}
          className="glass premium-input rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label={t("shop.brand")}
          className="glass premium-input rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">{t("shop.allBrands")}</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label={t("shop.sort")}
          className="glass premium-input rounded-xl px-3 py-2 text-sm"
        >
          <option value="newest">{t("shop.sort.newest")}</option>
          <option value="priceAsc">{t("shop.sort.priceAsc")}</option>
          <option value="priceDesc">{t("shop.sort.priceDesc")}</option>
          <option value="name">{t("shop.sort.name")}</option>
        </select>
      </div>
      <p className="text-xs text-zinc-500 mb-2">
        Notlara görə də axtara bilərsiniz (məs: oud, rose, vanilla)
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {noteHints.map((note) => (
          <button
            key={`shop-note-${note}`}
            onClick={() => setQuery(note)}
            className="px-2.5 py-1 rounded-full text-xs glass text-zinc-300 hover:border-gold hover:text-gold"
          >
            #{note}
          </button>
        ))}
      </div>
      {loading ? <ProductGridSkeleton /> : <ProductGrid items={visibleItems} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function CategoriesPage() {
  const { t } = useI18n();
  const categories = [
    {
      name: "Yeni Gələnlər",
      slug: "yeni-gelenler",
      desc: "Son əlavə edilən ən yeni ətir modelləri.",
    },
    { name: "Qadın", slug: "qadin", desc: "Qadınlar üçün zərif və cazibədar seçimlər." },
    { name: "Kişi", slug: "kisiler", desc: "Kişi üçün güclü və xarakterli ətirlər." },
    { name: "Uniseks", slug: "uniseks", desc: "Hər kəs üçün uyğun universal qoxular." },
    { name: "Endirim", slug: "endirim", desc: "Xüsusi endirimdə olan sərfəli seçimlər." },
    {
      name: "Ən Çox Satanlar",
      slug: "en-cox-satanlar",
      desc: "Müştərilərin ən çox seçdiyi bestseller ətirlər.",
    },
    {
      name: "Niş Ətirlər",
      slug: "nis-etirler",
      desc: "Xüsusi və fərqli qoxu sevənlər üçün premium niş kolleksiya.",
    },
    {
      name: "Gündəlik İstifadə",
      slug: "gundelik-istifade",
      desc: "Hər gün rahat istifadə üçün balanslı və yüngül seçimlər.",
    },
    {
      name: "Axşam və Tədbir",
      slug: "axsam-ve-tedbir",
      desc: "Daha intensiv, yadda qalan və təsirli axşam qoxuları.",
    },
    {
      name: "Yay Ətirləri",
      slug: "yay-etirleri",
      desc: "Təravətli, sitrus və yüngül notlarla yay ruhu.",
    },
    {
      name: "Qış Ətirləri",
      slug: "qis-etirleri",
      desc: "İsti, ədviyyəli və qalıcı notlarla qış kolleksiyası.",
    },
    {
      name: "Uzunmüddətli Qalıcılıq",
      slug: "uzunmuddetli-qaliciliq",
      desc: "Daha uzun qalan performanslı ətir seçimləri.",
    },
    {
      name: "Hədiyyəlik Setlər",
      slug: "hediyyelik-setler",
      desc: "Xüsusi günlər üçün hazır hədiyyəlik set təklifləri.",
    },
    {
      name: "Premium Seçimlər",
      slug: "premium-secimler",
      desc: "Ən yüksək segmentdən seçilmiş premium ətirlər.",
    },
  ];

  return (
    <PageWrap title={t("categories.title")} subtitle={t("categories.subtitle")}>
      <Seo
        title="Kateqoriyalar | ƏtirX"
        description="Niş, gündəlik, axşam, ofis, yay, qış və digər peşəkar ətir kateqoriyalarını kəşf edin."
        path="/categories"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to={`/kateqoriya/${c.slug}`}
            className="glass rounded-2xl p-5 hover:border-gold/50 transition-all"
          >
            <h3 className="font-display text-xl mb-1">{c.name}</h3>
            <p className="text-sm text-zinc-400">{c.desc}</p>
          </Link>
        ))}
      </div>
    </PageWrap>
  );
}

export function CategoryLandingPage() {
  const { slug } = useParams();
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const map: Record<string, { title: string; q?: string }> = {
    "yeni-gelenler": { title: "Yeni Gələnlər", q: "new" },
    qadin: { title: "Qadın", q: "women" },
    kisiler: { title: "Kişi", q: "men" },
    uniseks: { title: "Uniseks", q: "unisex" },
    endirim: { title: "Endirim", q: "sale" },
    "en-cox-satanlar": { title: "Ən Çox Satanlar", q: "best seller" },
    "nis-etirler": { title: "Niş Ətirlər", q: "niche" },
    "gundelik-istifade": { title: "Gündəlik İstifadə", q: "daily" },
    "axsam-ve-tedbir": { title: "Axşam və Tədbir", q: "evening" },
    "yay-etirleri": { title: "Yay Ətirləri", q: "summer" },
    "qis-etirleri": { title: "Qış Ətirləri", q: "winter" },
    "uzunmuddetli-qaliciliq": { title: "Uzunmüddətli Qalıcılıq", q: "long lasting" },
    "hediyyelik-setler": { title: "Hədiyyəlik Setlər", q: "gift set" },
    "premium-secimler": { title: "Premium Seçimlər", q: "premium" },
  };

  const current = map[slug ?? ""] ?? { title: "Kateqoriya" };

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts(current.q ? { q: current.q } : undefined);
        setItems(data);
      } catch {
        setError("Məhsullar yüklənmədi.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [current.q]);

  return (
    <PageWrap title={current.title} subtitle={`${items.length} məhsul`}>
      <Seo
        title={`${current.title} | ƏtirX`}
        description={`${current.title} kateqoriyasında premium ətirləri araşdırın.`}
        path={`/kateqoriya/${slug ?? ""}`}
      />
      {loading ? <ProductGridSkeleton /> : <ProductGrid items={items} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function CategoryPage() {
  const { t } = useI18n();
  const { slug } = useParams();
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts({ category: slug });
        setItems(data);
      } catch {
        setError(t("shop.fallback"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, t]);

  return (
    <PageWrap
      title={`${t("category.title")}: ${slug ?? ""}`}
      subtitle={`${items.length} ${t("shop.count")}`}
    >
      <Seo
        title={`${slug ?? ""} | Kateqoriya | ƏtirX`}
        description="Seçilmiş kateqoriyada premium ətirləri araşdırın və sifariş edin."
        path={`/category/${slug ?? ""}`}
      />
      {loading ? <ProductGridSkeleton /> : <ProductGrid items={items} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function SearchPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const noteHints = ["oud", "rose", "vanilla", "amber", "musk"];

  useEffect(() => {
    (async () => {
      try {
        setCategories(await getCategories());
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts({ q });
        setItems(data);
      } catch {
        setError(t("shop.fallback"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [q, t]);

  const visibleItems =
    categoryFilter === "all"
      ? items
      : items.filter((item) => item.category.slug === categoryFilter);

  return (
    <PageWrap
      title={`${t("search.title")}: ${params.get("q") ?? ""}`}
      subtitle={`${visibleItems.length} ${t("search.results")}`}
    >
      <Seo
        title={`Axtarış: ${params.get("q") ?? ""} | ƏtirX`}
        description="Ətir adları, marka və notlara görə nəticələr."
        path={`/search?q=${encodeURIComponent(params.get("q") ?? "")}`}
      />
      <p className="text-xs text-zinc-500 mb-2">Notlara görə də axtara bilərsiniz</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {noteHints.map((note) => (
          <Link
            key={`search-note-${note}`}
            to={`/search?q=${encodeURIComponent(note)}`}
            className="px-2.5 py-1 rounded-full text-xs glass text-zinc-300 hover:border-gold hover:text-gold"
          >
            #{note}
          </Link>
        ))}
      </div>
      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="glass premium-input rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">{t("search.allCategories")}</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? <ProductGridSkeleton /> : <ProductGrid items={visibleItems} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function CampaignsPage() {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageWrap title={t("campaigns.title")} subtitle={t("campaigns.subtitle")}>
      {loading ? (
        <p className="text-zinc-400">{t("shop.loading")}</p>
      ) : campaigns.length === 0 ? (
        <p className="text-zinc-400">Hazırda aktiv kampaniya yoxdur.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.code} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-gold">{c.code}</p>
                <span className="text-sm font-medium text-emerald-400">
                  {c.discount_type === "percent"
                    ? `-${Number(c.discount_value)}%`
                    : `-${formatCurrency(Number(c.discount_value))}`}
                </span>
              </div>
              {c.title && <p className="text-zinc-300 mt-1">{c.title}</p>}
              {c.description && <p className="text-zinc-400 text-sm mt-0.5">{c.description}</p>}
              {Number(c.min_subtotal) > 0 && (
                <p className="text-xs text-zinc-500 mt-1">
                  Minimum sifariş: {formatCurrency(Number(c.min_subtotal))}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </PageWrap>
  );
}

export function AboutPage() {
  const { t } = useI18n();
  const cms = useStaticPage("about");
  if (cms) {
    return (
      <PageWrap title={cms.title} subtitle={cms.subtitle || undefined}>
        <Seo title={`${cms.title} | ƏtirX`} description={cms.subtitle || cms.title} path="/about" />
        <CmsBody body={cms.body} />
      </PageWrap>
    );
  }
  const values = [
    "Keyfiyyət",
    "Etibar",
    "Müştəri məmnuniyyəti",
    "Sürətli xidmət",
    "Davamlı inkişaf",
    "Peşəkarlıq",
  ];

  return (
    <PageWrap title={t("about.title")}>
      <div className="max-w-4xl space-y-6 text-zinc-300 leading-7">
        <p>
          <strong className="text-white">ƏtirX</strong> olaraq inanırıq ki, ətir sadəcə bir qoxu
          deyil, insanın xarakterini, zövqünü və özünəməxsusluğunu ifadə edən görünməz imzadır. Məhz
          bu düşüncə ilə fəaliyyətə başlayaraq, müştərilərimizə dünya üzrə tanınmış və sevilən ətir
          brendlərini bir araya gətirən etibarlı alış-veriş təcrübəsi təqdim etməyi hədəfləyirik.
        </p>
        <p>
          Kolleksiyamızda kişi, qadın və uniseks kateqoriyalarında müxtəlif zövqlərə uyğun seçilmiş
          ətirlər yer alır. Klassik qoxulardan müasir və niş kompozisiyalara qədər geniş seçim
          imkanları təqdim edərək hər kəsin özünə uyğun ətri tapmasına kömək edirik.
        </p>
        <p>
          Ətir seçiminin şəxsi və xüsusi bir qərar olduğunu bilirik. Buna görə də məhsullarımızı
          diqqətlə seçir, keyfiyyətə və müştəri məmnuniyyətinə xüsusi önəm veririk. Məqsədimiz
          sadəcə məhsul satmaq deyil, hər sifarişdə müştərilərimizə yüksək xidmət və etibar hissi
          təqdim etməkdir.
        </p>
        <p>
          <strong className="text-white">ƏtirX</strong> müasir texnologiya və rahat alış-veriş
          prinsiplərini birləşdirərək sifariş prosesini mümkün qədər sadə və sürətli edir.
          Azərbaycanda istənilən bölgəyə çatdırılma və qapıda ödəniş imkanları ilə alış-verişi daha
          rahat və təhlükəsiz hala gətiririk.
        </p>
        <p>
          Bizim üçün hər bir müştəri dəyərlidir. Buna görə də xidmət keyfiyyətimizi daim inkişaf
          etdirir, yeni məhsullar əlavə edir və ən son ətir trendlərini izləyərək kolleksiyamızı
          yeniləyirik.
        </p>
        <p className="text-white font-medium">
          ƏtirX, öz üslubunu və xarakterini qoxu ilə ifadə etmək istəyənlər üçün yaradılmış premium
          ətir məkanıdır.
        </p>

        <section className="pt-2">
          <h2 className="font-display text-2xl mb-2">{t("about.missionTitle")}</h2>
          <p>
            Müştərilərimizə keyfiyyətli ətirləri əlçatan şəkildə təqdim etmək, etibarlı xidmət
            göstərmək və hər alış-verişi xoş təcrübəyə çevirmək.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">{t("about.visionTitle")}</h2>
          <p>
            Azərbaycanda ətir sevərlərin ilk seçim etdiyi, etibar və keyfiyyətlə tanınan aparıcı
            onlayn ətir platformasına çevrilmək.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-3">{t("about.valuesTitle")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {values.map((value) => (
              <div key={value} className="glass rounded-xl px-4 py-3 text-sm text-white">
                {value}
              </div>
            ))}
          </div>
        </section>

        <p className="font-display text-2xl text-gold pt-2">ƏtirX, Sənin İmzan Olan Qoxu.</p>
      </div>
    </PageWrap>
  );
}

export function ShippingReturnsPage() {
  const { t } = useI18n();
  const site = useSiteSettings();
  const [deliveryMethods, setDeliveryMethods] = useState<ApiDeliveryMethod[]>([]);

  useEffect(() => {
    let active = true;
    getDeliveryMethods()
      .then((items) => {
        const normalized =
          Array.isArray(items) && items.length > 0 ? items : FALLBACK_DELIVERY_METHODS;
        if (active) setDeliveryMethods(normalized);
      })
      .catch(() => {
        if (active) setDeliveryMethods(FALLBACK_DELIVERY_METHODS);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageWrap title={t("shipret.title")} subtitle={t("shipret.subtitle")}>
      <div className="space-y-4 text-zinc-300">
        <div className="glass rounded-2xl p-4">
          <h3 className="font-display text-xl mb-3">🚚 Çatdırılma üsulları</h3>
          <div className="space-y-3">
            {deliveryMethods.map((method) => (
              <div key={method.code} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">{method.label}</p>
                    <p className="text-sm text-zinc-400 mt-0.5">{method.eta}</p>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {method.fee_label
                      ? method.fee_label
                      : Number(method.fee) === 0
                        ? "Pulsuz"
                        : `${formatCurrency(Number(method.fee))}`}
                  </p>
                </div>
                {method.code === "city_courier" && (
                  <p className="text-sm text-zinc-500 mt-2">
                    Özünüz ödəniş edərək Bolt və ya Yango ilə çatdırılma qəbul edə bilərsiniz.
                  </p>
                )}
                {method.code === "pickup" && (
                  <p className="text-sm text-zinc-500 mt-2">
                    Depodan birbaşa təhvil alma mümkündür.
                  </p>
                )}
              </div>
            ))}
            {deliveryMethods.length === 0 && (
              <p className="text-sm text-zinc-400">Çatdırılma məlumatı yüklənmədi.</p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h4 className="font-display text-lg mb-2">📍 Depo Ünvanı:</h4>
          <p>{site.store_address}</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <h4 className="font-display text-lg mb-2">💳 Ödəniş</h4>
          <p>Ödəniş məhsul çatdırıldıqda edilir.</p>
          <p>Nağd və ya bank kartı vasitəsilə ödəniş mümkündür.</p>
        </div>
      </div>
    </PageWrap>
  );
}

export function FAQPage() {
  const { t } = useI18n();
  const cms = useStaticPage("faq");
  if (cms) {
    return (
      <PageWrap title={cms.title} subtitle={cms.subtitle || t("faq.subtitle")}>
        <Seo title={`${cms.title} | ƏtirX`} description={cms.subtitle || cms.title} path="/faq" />
        <CmsBody body={cms.body} />
      </PageWrap>
    );
  }
  const sections = [
    {
      title: t("faq.section.orders"),
      items: [
        [t("faq.order.q1"), t("faq.order.a1")],
        [t("faq.order.q2"), t("faq.order.a2")],
      ],
    },
    {
      title: t("faq.section.delivery"),
      items: [
        [t("faq.delivery.q1"), t("faq.delivery.a1")],
        [t("faq.delivery.q2"), t("faq.delivery.a2")],
      ],
    },
    {
      title: t("faq.section.payment"),
      items: [
        [t("faq.payment.q1"), t("faq.payment.a1")],
        [t("faq.payment.q2"), t("faq.payment.a2")],
      ],
    },
    {
      title: t("faq.section.products"),
      items: [
        [t("faq.products.q3"), t("faq.products.a3")],
        [t("faq.products.q2"), t("faq.products.a2")],
      ],
    },
    {
      title: t("faq.section.promo"),
      items: [[t("faq.promo.q1"), t("faq.promo.a1")]],
    },
  ];

  return (
    <PageWrap title={t("faq.title")} subtitle={t("faq.subtitle")}>
      <Seo
        title="FAQ | ƏtirX"
        description="Sifariş, çatdırılma, ödəniş və məhsullarla bağlı tez-tez verilən suallar."
        path="/faq"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [],
        }}
      />
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-2xl mb-3">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map(([question, answer]) => (
                <div key={question} className="glass rounded-2xl p-4">
                  <strong>{question}</strong>
                  <p className="text-zinc-400 mt-1">{answer}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageWrap>
  );
}

export function ContactPage() {
  const { t } = useI18n();
  const site = useSiteSettings();
  const contacts = [
    {
      icon: MessageCircle,
      title: t("contact.whatsapp"),
      text: t("contact.whatsappDesc"),
      href: site.whatsappUrl,
      action: t("contact.openWhatsapp"),
    },
    {
      icon: Instagram,
      title: t("contact.instagram"),
      text: site.instagram_handle,
      href: site.instagram_url,
      action: t("contact.openInstagram"),
    },
    {
      icon: null,
      title: t("contact.tiktok"),
      text: site.tiktok_handle,
      href: site.tiktok_url,
      action: t("contact.openTiktok"),
    },
  ].filter((contact) => contact.href);
  return (
    <PageWrap title={t("contact.title")} subtitle={t("contact.subtitle")}>
      <Seo
        title="Əlaqə | ƏtirX"
        description="WhatsApp, Instagram və TikTok üzərindən ƏtirX ilə əlaqə saxlayın."
        path="/elaqe"
      />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl glass flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl mb-1">{t("contact.storeWarehouse")}</h2>
              <p className="text-zinc-300">{site.store_address}</p>
              <p className="text-sm text-zinc-500 mt-2">{t("contact.addressHint")}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {contacts.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="glass rounded-2xl p-4 hover:border-gold/50 transition-all flex items-center justify-between gap-4"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl glass flex items-center justify-center shrink-0 text-gold">
                    {Icon ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">♪</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{item.title}</span>
                    <span className="block text-sm text-zinc-400 truncate">{item.text}</span>
                  </span>
                </span>
                <span className="text-sm text-zinc-300 flex items-center gap-1 shrink-0">
                  {item.action}
                  <ExternalLink className="w-4 h-4" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </PageWrap>
  );
}

export function PrivacyPage() {
  const { t } = useI18n();
  const cms = useStaticPage("privacy");
  if (cms) {
    return (
      <PageWrap title={cms.title} subtitle={cms.subtitle || t("privacy.subtitle")}>
        <CmsBody body={cms.body} />
      </PageWrap>
    );
  }
  const sections = [
    ["privacy.section.general", "privacy.section.generalBody"],
    ["privacy.section.data", "privacy.section.dataBody"],
    ["privacy.section.use", "privacy.section.useBody"],
    ["privacy.section.protect", "privacy.section.protectBody"],
    ["privacy.section.thirdParty", "privacy.section.thirdPartyBody"],
    ["privacy.section.contact", "privacy.section.contactBody"],
  ];

  return (
    <PageWrap title={t("privacy.title")} subtitle={t("privacy.subtitle")}>
      <div className="max-w-4xl space-y-3">
        {sections.map(([titleKey, bodyKey], index) => (
          <section key={titleKey} className="glass rounded-2xl p-4">
            <h2 className="font-display text-xl mb-2">
              {index + 1}. {t(titleKey)}
            </h2>
            <p className="text-zinc-400 leading-7">{t(bodyKey)}</p>
          </section>
        ))}
        <p className="text-white font-medium pt-3">{t("privacy.confirmation")}</p>
      </div>
    </PageWrap>
  );
}

export function TermsPage() {
  const { t } = useI18n();
  const cms = useStaticPage("terms");
  if (cms) {
    return (
      <PageWrap title={cms.title} subtitle={cms.subtitle || t("terms.subtitle")}>
        <CmsBody body={cms.body} />
      </PageWrap>
    );
  }
  const sections = [
    ["terms.section.general", "terms.section.generalBody"],
    ["terms.section.products", "terms.section.productsBody"],
    ["terms.section.format", "terms.section.formatBody"],
    ["terms.section.order", "terms.section.orderBody"],
    ["terms.section.delivery", "terms.section.deliveryBody"],
    ["terms.section.payment", "terms.section.paymentBody"],
    ["terms.section.return", "terms.section.returnBody"],
    ["terms.section.promo", "terms.section.promoBody"],
    ["terms.section.privacy", "terms.section.privacyBody"],
    ["terms.section.contact", "terms.section.contactBody"],
  ];

  return (
    <PageWrap title={t("terms.title")} subtitle={t("terms.subtitle")}>
      <div className="max-w-4xl space-y-3">
        {sections.map(([titleKey, bodyKey], index) => (
          <section key={titleKey} className="glass rounded-2xl p-4">
            <h2 className="font-display text-xl mb-2">
              {index + 1}. {t(titleKey)}
            </h2>
            <p className="text-zinc-400 leading-7">{t(bodyKey)}</p>
          </section>
        ))}
        <p className="text-white font-medium pt-3">{t("terms.confirmation")}</p>
      </div>
    </PageWrap>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl mb-3">404</h1>
        <p className="text-zinc-400 mb-6">{t("notFound.text")}</p>
        <Link to="/" className="btn-gold px-5 py-2.5 rounded-xl">
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
}
