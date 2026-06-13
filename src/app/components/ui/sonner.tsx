import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "../../theme";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(18,18,22,0.95)",
          "--normal-text": "#f3f3f4",
          "--normal-border": "rgba(255,255,255,0.12)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
