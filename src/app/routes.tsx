import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
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
