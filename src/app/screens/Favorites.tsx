import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { perfumes } from "../data/perfumes";
import { useI18n } from "../i18n";
import { addToCart } from "../lib/storage";

function loadFavorites() {
  try {
    const raw = localStorage.getItem("favorites");
    const ids: number[] = raw ? JSON.parse(raw) : [];

    const isOldDemoSeed = ids.length === 3 && ids.includes(1) && ids.includes(2) && ids.includes(5);
    if (isOldDemoSeed) {
      localStorage.setItem("favorites", "[]");
      return [];
    }

    return perfumes.filter((p) => ids.includes(p.id));
  } catch {
    return [];
  }
}

export function Favorites() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const fmt = (v: number) => `${v.toFixed(2)} ₼`;

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites.map((f) => f.id)));
    window.dispatchEvent(new CustomEvent("app-storage-updated"));
  }, [favorites]);

  const removeFavorite = (id: number) => {
    setFavorites((favs) => favs.filter((p) => p.id !== id));
  };

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
          <Heart className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-xl mb-2">{t("favorites.empty")}</h2>
        <p className="text-sm text-zinc-400 mb-8 text-center">{t("favorites.explore")}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-white text-black px-8 py-3.5 rounded-2xl font-medium hover:bg-zinc-100 transition-all"
        >
          {t("favorites.explore")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <h1 className="text-2xl mb-1">{t("favorites.title")}</h1>
        <p className="text-sm text-zinc-400">{favorites.length} {t("shop.count")}</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {favorites.map((perfume) => (
            <div key={perfume.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 group">
              <div onClick={() => navigate(`/product/${perfume.id}`)} className="cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden">
                  <img src={perfume.image} alt={perfume.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(perfume.id);
                    }}
                    className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all border border-zinc-700"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                  {perfume.originalPrice && (
                    <div className="absolute top-3 left-3 bg-white text-black px-2.5 py-1 rounded-full text-[10px] font-medium">{t("common.sale")}</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Star className="w-3 h-3 fill-white text-white" />
                    <span className="text-xs font-medium">{perfume.rating}</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1 truncate">{perfume.name}</h3>
                  <p className="text-xs text-zinc-400 mb-2">{perfume.size}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{fmt(perfume.price)}</span>
                      {perfume.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through ml-1.5">{fmt(perfume.originalPrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(perfume.id, 1);
                      }}
                      className="bg-white text-black p-2 rounded-lg hover:bg-zinc-100 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
