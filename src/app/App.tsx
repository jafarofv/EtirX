import { RouterProvider } from "react-router";
import { router } from "./routes";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ThemeProvider>
  );
}
