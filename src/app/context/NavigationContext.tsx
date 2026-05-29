import { createContext, useContext, useState, ReactNode } from "react";

interface NavigationContextType {
  currentRoute: string;
  params: Record<string, string>;
  navigate: (path: string, params?: Record<string, string>) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState("/");
  const [params, setParams] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>(["/"])

  const navigate = (path: string, newParams?: Record<string, string>) => {
    setCurrentRoute(path);
    setParams(newParams || {});
    setHistory((prev) => [...prev, path]);
  };

  const goBack = () => {
    setHistory((prev) => {
      if (prev.length > 1) {
        const newHistory = prev.slice(0, -1);
        setCurrentRoute(newHistory[newHistory.length - 1]);
        return newHistory;
      }
      return prev;
    });
  };

  return (
    <NavigationContext.Provider
      value={{ currentRoute, params, navigate, goBack }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
