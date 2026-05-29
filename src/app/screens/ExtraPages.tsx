import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { perfumes } from "../data/perfumes";
import { getProducts, sendContact, type ApiProduct } from "../lib/api";
import { useI18n } from "../i18n";

function ProductGrid({ items }: { items: ApiProduct[] }) {
  const { t } = useI18n();
  const fmt = (v: string | number) => `${Number(v).toFixed(2)} \u20BC`;

  if (items.length === 0) {
    return <p className="text-zinc-400">{t("shop.noProducts")}</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((p) => (
        <Link
          key={p.id}
          to={`/product/${p.slug}`}
          className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all"
        >
          <div className="aspect-[4/5] overflow-hidden">
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-3">
            <p className="text-sm text-zinc-400">{p.brand}</p>
            <h3 className="font-medium text-sm truncate">{p.name}</h3>
            <p className="mt-1 font-medium">{fmt(p.price)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PageWrap({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10">
      <h1 className="text-3xl mb-2">{title}</h1>
      {subtitle && <p className="text-zinc-400 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}

function toApiProductFromLocal() {
  return perfumes.map((p) => ({
    id: p.id,
    name: p.name,
    slug: String(p.id),
    brand: p.brand,
    description: p.description,
    price: String(p.price),
    old_price: p.originalPrice ? String(p.originalPrice) : null,
    stock: p.inStock ? 10 : 0,
    image_url: p.image,
    is_active: true,
    category: { id: 0, name: p.category, slug: p.category.toLowerCase() },
  }));
}

export function ShopPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        setItems(data);
      } catch {
        setError(t("shop.fallback"));
        setItems(toApiProductFromLocal());
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const brands = useMemo(() => Array.from(new Set(items.map((i) => i.brand))).filter(Boolean), [items]);

  const visibleItems = useMemo(() => {
    return items
      .filter((i) => (brand === "all" ? true : i.brand === brand))
      .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.brand.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "priceAsc") return Number(a.price) - Number(b.price);
        if (sortBy === "priceDesc") return Number(b.price) - Number(a.price);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.id - a.id;
      });
  }, [items, brand, query, sortBy]);

  return (
    <PageWrap title={t("shop.title")} subtitle={`${visibleItems.length} ${t("shop.count")}`}>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("shop.search")}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm">
          <option value="all">{t("shop.allBrands")}</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm">
          <option value="newest">{t("shop.sort.newest")}</option>
          <option value="priceAsc">{t("shop.sort.priceAsc")}</option>
          <option value="priceDesc">{t("shop.sort.priceDesc")}</option>
          <option value="name">{t("shop.sort.name")}</option>
        </select>
      </div>
      {loading ? <p className="text-zinc-400">{t("shop.loading")}</p> : <ProductGrid items={visibleItems} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function CategoriesPage() {
  const { t } = useI18n();

  const categories = [
    { name: "Oriental", slug: "oriental", desc: "Şərq notları, oud və amber akordları" },
    { name: "Woody", slug: "woody", desc: "Ağac notları və dərin, qalıcı qoxular" },
    { name: "Floral", slug: "floral", desc: "Çiçək notları ilə zərif və yumşaq ətirlər" },
    { name: "Fresh", slug: "fresh", desc: "Təravətli, yüngül və gündəlik istifadə üçün" },
    { name: "Citrus", slug: "fresh", desc: "Sitrus əsaslı canlandırıcı kompozisiyalar" },
    { name: "Amber", slug: "oriental", desc: "İsti və cazibədar amber ailəsi" },
    { name: "Musk", slug: "woody", desc: "Musk əsaslı hamar və təmiz qoxular" },
    { name: "Luxury", slug: "oriental", desc: "Premium və seçilmiş niş kolleksiya" },
    { name: "Night", slug: "woody", desc: "Axşam tədbirləri üçün daha intensiv ətirlər" },
    { name: "Daily", slug: "fresh", desc: "Gündəlik istifadə üçün balanslı seçimlər" },
    { name: "Office", slug: "fresh", desc: "Ofis mühiti üçün yüngül və zərif notlar" },
    { name: "Gift", slug: "floral", desc: "Hədiyyə üçün populyar və sevilən seçimlər" },
  ];

  return (
    <PageWrap title={t("categories.title")} subtitle={t("categories.subtitle")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Link key={`${c.name}-${c.slug}`} to={`/category/${c.slug}`} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-all">
            <h3 className="text-lg font-medium mb-1">{c.name}</h3>
            <p className="text-sm text-zinc-400">{c.desc}</p>
          </Link>
        ))}
      </div>
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
        const name = (slug ?? "").toLowerCase();
        setItems(toApiProductFromLocal().filter((p) => p.category.slug === name));
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, t]);

  return (
    <PageWrap title={`${t("category.title")}: ${slug ?? ""}`} subtitle={`${items.length} ${t("shop.count")}`}>
      {loading ? <p className="text-zinc-400">{t("shop.loading")}</p> : <ProductGrid items={items} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function SearchPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts({ q });
        setItems(data);
      } catch {
        setError(t("shop.fallback"));
        setItems(
          toApiProductFromLocal().filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [q, t]);

  const visibleItems = categoryFilter === "all" ? items : items.filter((item) => item.category.slug === categoryFilter);

  return (
    <PageWrap title={`${t("search.title")}: ${params.get("q") ?? ""}`} subtitle={`${visibleItems.length} ${t("search.results")}`}>
      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">{t("search.allCategories")}</option>
          <option value="oriental">Oriental</option>
          <option value="woody">Woody</option>
          <option value="floral">Floral</option>
          <option value="fresh">Fresh</option>
        </select>
      </div>
      {loading ? <p className="text-zinc-400">{t("shop.loading")}</p> : <ProductGrid items={visibleItems} />}
      {error && <p className="text-amber-400 mt-4">{error}</p>}
    </PageWrap>
  );
}

export function CampaignsPage() {
  const { t } = useI18n();
  return (
    <PageWrap title={t("campaigns.title")} subtitle={t("campaigns.subtitle")}>
      <div className="space-y-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-lg font-medium">YENI30</p>
          <p className="text-zinc-400">{t("campaigns.code1")}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-lg font-medium">FREEDELIVERY</p>
          <p className="text-zinc-400">{t("campaigns.code2")}</p>
        </div>
      </div>
    </PageWrap>
  );
}

export function AboutPage() {
  const { t } = useI18n();
  return (
    <PageWrap title={t("about.title")} subtitle={t("about.subtitle")}>
      <p className="text-zinc-300 max-w-3xl">{t("about.body")}</p>
    </PageWrap>
  );
}

export function ShippingReturnsPage() {
  const { t } = useI18n();
  return (
    <PageWrap title={t("shipret.title")} subtitle={t("shipret.subtitle")}>
      <div className="space-y-4 text-zinc-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-white text-lg mb-3">🚚 Çatdırılma və Ödəniş</h3>
          <ul className="space-y-2">
            <li>• Şəhər daxili çatdırılma — Yango, Bolt və s.</li>
            <li>• AzerPoçt ilə göndəriş — 3 \u20BC</li>
            <li>• N.Nərimanov və Gənclik metrosuna çatdırılma — 2 \u20BC</li>
            <li>• Depodan təhvil alma — Pulsuz</li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h4 className="text-white mb-2">📍 Ünvan:</h4>
          <p>Fəxrəddin Musayev küçəsi, Adore Plaza</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h4 className="text-white mb-2">💳 Ödəniş</h4>
          <p>Ödəniş məhsul çatdırıldıqda edilir.</p>
          <p>Nağd və ya kartdan-karta ödəniş mümkündür.</p>
        </div>
      </div>
    </PageWrap>
  );
}

export function FAQPage() {
  const { t } = useI18n();
  return (
    <PageWrap title={t("faq.title")} subtitle={t("faq.subtitle")}>
      <div className="space-y-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><strong>{t("faq.q1")}</strong><p className="text-zinc-400 mt-1">{t("faq.a1")}</p></div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><strong>{t("faq.q2")}</strong><p className="text-zinc-400 mt-1">{t("faq.a2")}</p></div>
      </div>
    </PageWrap>
  );
}

export function ContactPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <PageWrap title={t("contact.title")} subtitle={t("contact.subtitle")}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const formData = new FormData(e.currentTarget);
          try {
            await sendContact({
              name: String(formData.get("name") ?? ""),
              email: String(formData.get("email") ?? ""),
              message: String(formData.get("message") ?? ""),
            });
            setSent(true);
            e.currentTarget.reset();
          } catch {
            setError(t("contact.error"));
          } finally {
            setLoading(false);
          }
        }}
        className="max-w-2xl space-y-3"
      >
        <input name="name" required placeholder={t("contact.name")} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3" />
        <input name="email" required type="email" placeholder={t("contact.email")} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3" />
        <textarea name="message" required placeholder={t("contact.message")} rows={5} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3" />
        <button className="bg-white text-black px-5 py-2.5 rounded-xl" disabled={loading}>
          {loading ? t("contact.sending") : t("contact.send")}
        </button>
      </form>
      {sent && <p className="mt-4 text-green-400">{t("contact.success")}</p>}
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </PageWrap>
  );
}

export function PrivacyPage() {
  const { t } = useI18n();
  return (
    <PageWrap title={t("privacy.title")} subtitle={t("privacy.subtitle")}>
      <p className="text-zinc-300 max-w-3xl">{t("privacy.body")}</p>
    </PageWrap>
  );
}

export function TermsPage() {
  const { t } = useI18n();
  return (
    <PageWrap title={t("terms.title")} subtitle={t("terms.subtitle")}>
      <p className="text-zinc-300 max-w-3xl">{t("terms.body")}</p>
    </PageWrap>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl mb-3">404</h1>
        <p className="text-zinc-400 mb-6">{t("notFound.text")}</p>
        <Link to="/" className="bg-white text-black px-5 py-2.5 rounded-xl">{t("notFound.home")}</Link>
      </div>
    </div>
  );
}




