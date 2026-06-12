import { createBrowserRouter, Navigate, Outlet, useLocation, useRouteError } from "react-router";
import { getAuthToken } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Home } from "./screens/Home";
import { ProductDetails } from "./screens/ProductDetails";
import { Cart } from "./screens/Cart";
import { ChangePasswordPage, EditProfilePage, Profile } from "./screens/Profile";
import { Favorites } from "./screens/Favorites";
import { Checkout } from "./screens/Checkout";
import {
  AboutPage,
  CampaignsPage,
  CategoriesPage,
  CategoryLandingPage,
  CategoryPage,
  ContactPage,
  FAQPage,
  NotFoundPage,
  PrivacyPage,
  SearchPage,
  ShippingReturnsPage,
  ShopPage,
  TermsPage,
} from "./screens/ExtraPages";
import { OrderTracking } from "./screens/OrderTracking";

function RequireAuth() {
  const location = useLocation();
  if (!getAuthToken()) {
    return <Navigate to="/profile" replace state={{ next: location.pathname }} />;
  }
  return <Outlet />;
}

// Branded fallback for render/loader errors thrown inside a route. Without this,
// React Router shows its bare default error page instead of our themed screen.
function RouteError() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error("Route error:", error);
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl mb-2">Nəsə səhv getdi</h1>
      <p className="text-zinc-400 text-sm mb-7 max-w-sm">
        Səhifəni yükləyərkən gözlənilməz xəta baş verdi. Yenidən cəhd edin.
      </p>
      <div className="flex gap-3">
        <button onClick={() => window.location.reload()} className="btn-gold rounded-xl px-6 py-3">
          Yenidən yüklə
        </button>
        <a href="/" className="glass rounded-xl px-6 py-3 hover:border-gold transition-all">
          Ana səhifə
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: Home },
      { path: "cart", Component: Cart },
      { path: "favorites", Component: Favorites },
      { path: "profile", Component: Profile },
      {
        Component: RequireAuth,
        children: [
          { path: "profile/edit", Component: EditProfilePage },
          { path: "profile/password", Component: ChangePasswordPage },
        ],
      },
      { path: "checkout", Component: Checkout },
      { path: "product/:slug", Component: ProductDetails },
      { path: "perfumes", Component: ShopPage },
      { path: "categories", Component: CategoriesPage },
      { path: "kateqoriya/:slug", Component: CategoryLandingPage },
      { path: "category/:slug", Component: CategoryPage },
      { path: "search", Component: SearchPage },
      { path: "kampaniyalar", Component: CampaignsPage },
      { path: "haqqimizda", Component: AboutPage },
      { path: "catdirilma", Component: ShippingReturnsPage },
      { path: "faq", Component: FAQPage },
      { path: "elaqe", Component: ContactPage },
      { path: "gizlilik", Component: PrivacyPage },
      { path: "sertler", Component: TermsPage },
      { path: "sifaris-izleme", Component: OrderTracking },
    ],
  },
  { path: "*", Component: NotFoundPage },
]);
