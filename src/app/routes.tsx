import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./screens/Home";
import { ProductDetails } from "./screens/ProductDetails";
import { Cart } from "./screens/Cart";
import { Profile } from "./screens/Profile";
import { Favorites } from "./screens/Favorites";
import { Checkout } from "./screens/Checkout";
import {
  AboutPage,
  CampaignsPage,
  CategoriesPage,
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "cart", Component: Cart },
      { path: "favorites", Component: Favorites },
      { path: "profile", Component: Profile },
      { path: "checkout", Component: Checkout },
      { path: "product/:id", Component: ProductDetails },
      { path: "shop", Component: ShopPage },
      { path: "categories", Component: CategoriesPage },
      { path: "category/:slug", Component: CategoryPage },
      { path: "search", Component: SearchPage },
      { path: "kampaniyalar", Component: CampaignsPage },
      { path: "haqqimizda", Component: AboutPage },
      { path: "catdirilma-qaytarma", Component: ShippingReturnsPage },
      { path: "faq", Component: FAQPage },
      { path: "elaqe", Component: ContactPage },
      { path: "gizlilik", Component: PrivacyPage },
      { path: "sertler", Component: TermsPage },
    ],
  },
  { path: "*", Component: NotFoundPage },
]);
