import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Heart, Search, Star, ShoppingBag, TrendingUp } from "lucide-react";
import { useI18n } from "../i18n";
import { addToCart, toggleFavorite } from "../lib/storage";
import { loadCatalogProducts, type CatalogProduct } from "../lib/catalog";

export function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") ?? "[]");
    } catch {
      return [];
    }
  });
  const [pulseFavorite, setPulseFavorite] = useState<number | null>(null);
  const [pulseCart, setPulseCart] = useState<number | null>(null);
  const fmt = (v: number) => `${v.toFixed(2)} \u20BC`;

  const refreshFavorites = () => {
    try {
      setFavoriteIds(JSON.parse(localStorage.getItem("favorites") ?? "[]"));
    } catch {
      setFavoriteIds([]);
    }
  };

  useEffect(() => {
    window.addEventListener("app-storage-updated", refreshFavorites as EventListener);
    return () => window.removeEventListener("app-storage-updated", refreshFavorites as EventListener);
  }, []);

  useEffect(() => {
    loadCatalogProducts().then(setProducts);
  }, []);

  const featuredPerfumes = products.slice(0, 3);
  const tabs = [
    { key: "all", label: t("home.tab.all") },
    { key: "new", label: t("home.tab.new") },
    { key: "women", label: t("home.tab.women") },
    { key: "men", label: t("home.tab.men") },
    { key: "unisex", label: t("home.tab.unisex") },
    { key: "sale", label: t("home.tab.sale") },
  ];

  const latestProductId = Math.max(...products.map((x) => x.id), 0);
  const isWomen = (p: CatalogProduct) => /women|qadin/i.test(`${p.name} ${p.description} ${p.category}`);
  const isMen = (p: CatalogProduct) => /men|kisi/i.test(`${p.name} ${p.description} ${p.category}`);
  const isUnisex = (p: CatalogProduct) => /unisex/i.test(`${p.name} ${p.description} ${p.category}`);
  const isNew = (p: CatalogProduct) => p.id >= latestProductId - 2;
  const filteredPerfumes = products.filter(
    (p) =>
      (selectedCategory === "all" ||
        (selectedCategory === "new" && isNew(p)) ||
        (selectedCategory === "women" && isWomen(p)) ||
        (selectedCategory === "men" && isMen(p)) ||
        (selectedCategory === "unisex" && isUnisex(p)) ||
        (selectedCategory === "sale" && Boolean(p.originalPrice))) &&
      (searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <div className="flex items-start justify-start mb-8">
          <div>
            <h1 className="text-3xl tracking-tight mb-1">{t("brand.name")}</h1>
            <p className="text-sm text-zinc-400">{t("home.tagline")}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder={t("home.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {tabs.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === category.key
                  ? "bg-white text-black font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
              }`}
            >
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t("home.offer.badge")}</span>
            </div>
            <h3 className="text-xl mb-1">{t("home.offer.title")}</h3>
            <p className="text-sm text-zinc-400 mb-4">{t("home.offer.desc")}</p>
            <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-100 transition-all">{t("home.offer.cta")}</button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{t("home.featured")}</h2>
          <button onClick={() => navigate("/perfumes")} className="text-sm text-zinc-400 hover:text-white transition-colors">
            {t("home.viewAll")}
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {featuredPerfumes.map((perfume) => (
            <div
              key={perfume.id}
              onClick={() => navigate(`/product/${perfume.slug}`)}
              className="min-w-[260px] sm:min-w-[280px] lg:min-w-[320px] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-all group"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden">
                <img src={perfume.image} alt={perfume.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(perfume.id);
                    setPulseFavorite(perfume.id);
                    setTimeout(() => setPulseFavorite(null), 180);
                  }}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 border border-zinc-700 flex items-center justify-center"
                >
                  <Heart className={`w-4 h-4 ${favoriteIds.includes(perfume.id) ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite === perfume.id ? "scale-125" : ""} transition-transform`} />
                </button>
                {perfume.originalPrice && <div className="absolute top-4 right-4 bg-white text-black px-3 py-1.5 rounded-full text-xs font-medium">{t("common.sale")}</div>}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span className="text-sm font-medium">{perfume.rating}</span>
                  <span className="text-xs text-zinc-500">({perfume.reviews})</span>
                </div>
                <h3 className="font-medium mb-1">{perfume.name}</h3>
                <p className="text-sm text-zinc-400 mb-3">{perfume.brand}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium">{fmt(perfume.price)}</span>
                    {perfume.originalPrice && <span className="text-sm text-zinc-500 line-through">{fmt(perfume.originalPrice)}</span>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(perfume.id, 1);
                      setPulseCart(perfume.id);
                      setTimeout(() => setPulseCart(null), 180);
                    }}
                    className={`bg-white text-black p-2.5 rounded-xl hover:bg-zinc-100 transition-all ${pulseCart === perfume.id ? "scale-110" : ""}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <h2 className="text-lg font-medium mb-4">{t("home.all")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPerfumes.map((perfume) => (
            <div
              key={perfume.id}
              onClick={() => navigate(`/product/${perfume.slug}`)}
              className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-all group"
            >
              <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden">
                <img src={perfume.image} alt={perfume.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(perfume.id);
                    setPulseFavorite(perfume.id);
                    setTimeout(() => setPulseFavorite(null), 180);
                  }}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 border border-zinc-700 flex items-center justify-center"
                >
                  <Heart className={`w-3.5 h-3.5 ${favoriteIds.includes(perfume.id) ? "fill-red-500 text-red-500" : "text-white"} ${pulseFavorite === perfume.id ? "scale-125" : ""} transition-transform`} />
                </button>
                {perfume.originalPrice && <div className="absolute top-3 right-3 bg-white text-black px-2.5 py-1 rounded-full text-[10px] font-medium">{t("common.sale")}</div>}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1 mb-1.5">
                  <Star className="w-3 h-3 fill-white text-white" />
                  <span className="text-xs font-medium">{perfume.rating}</span>
                </div>
                <h3 className="text-sm font-medium mb-1 truncate">{perfume.name}</h3>
                <p className="text-xs text-zinc-400 mb-2">{perfume.size}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{fmt(perfume.price)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(perfume.id, 1);
                      setPulseCart(perfume.id);
                      setTimeout(() => setPulseCart(null), 180);
                    }}
                    className={`bg-white text-black p-2 rounded-lg hover:bg-zinc-100 transition-all ${pulseCart === perfume.id ? "scale-110" : ""}`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





