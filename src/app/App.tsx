import { RouterProvider } from "react-router";
import { router } from "./routes";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import { SiteSettingsProvider } from "./site-settings";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SiteSettingsProvider>
          <RouterProvider router={router} />
        </SiteSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
