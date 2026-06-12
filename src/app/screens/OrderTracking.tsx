import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { formatCurrency } from "../lib/formatCurrency";
import { useI18n } from "../i18n";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const WS_BASE =
  (import.meta.env.VITE_WS_URL as string) || API_BASE.replace("/api", "").replace("http", "ws");

interface OrderStatus {
  code: string;
  status: string;
  status_display: string;
  total: string;
  created_at: string;
}

// Visual styling only — labels are routed through i18n (status.* keys).
const STATUS_STYLE: Record<string, { color: string; icon: string }> = {
  new: { color: "#e65100", icon: "📝" },
  confirmed: { color: "#1976d2", icon: "✅" },
  shipped: { color: "#0d47a1", icon: "🚚" },
  delivered: { color: "#1b5e20", icon: "🎉" },
  cancelled: { color: "#b71c1c", icon: "❌" },
};

const ORDER_STATUSES = ["new", "confirmed", "shipped", "delivered"];

export function OrderTracking() {
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";
  const [orderCode, setOrderCode] = useState(codeFromUrl);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchStatus = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/orders/by-code/?code=${encodeURIComponent(code)}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError(t("tracking.notFoundCheck"));
          } else {
            setError(t("tracking.genericError"));
          }
          setStatus(null);
          return;
        }
        const data = await res.json();
        setStatus(data);
      } catch {
        setError(t("tracking.networkError"));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const connectWebSocket = useCallback((code: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const ws = new WebSocket(`${WS_BASE}/ws/orders/${code}/`);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        setStatus((prev) => (prev ? { ...prev, ...update } : update));
      } catch {
        // ignore parse errors
      }
    };
  }, []);

  useEffect(() => {
    if (codeFromUrl) {
      fetchStatus(codeFromUrl);
      connectWebSocket(codeFromUrl);
    }
    return () => {
      wsRef.current?.close();
    };
  }, [codeFromUrl, fetchStatus, connectWebSocket]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderCode.trim()) {
      fetchStatus(orderCode.trim());
      connectWebSocket(orderCode.trim());
    }
  };

  const currentStep = status ? ORDER_STATUSES.indexOf(status.status) : -1;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-10 pb-16 text-white">
      <h1 className="font-display text-4xl mb-3">{t("tracking.heading")}</h1>
      <div className="gold-rule mb-4" />
      <p className="text-zinc-400 mb-7">{t("tracking.intro")}</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder={t("tracking.codePlaceholder")}
          aria-label={t("tracking.codeLabel")}
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
          className="premium-input flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={loading || !orderCode.trim()}
          className={`btn-gold px-6 rounded-xl whitespace-nowrap ${
            loading || !orderCode.trim() ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "..." : t("tracking.track")}
        </button>
      </form>

      {error && (
        <div className="glass rounded-xl px-4 py-3 mb-4 text-sm text-red-300 border border-red-500/30">
          {error}
        </div>
      )}

      {status && (
        <div className="glass rounded-2xl p-6">
          <div className="mb-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              {t("tracking.codeLabel")}
            </span>
            <h2 className="font-display text-2xl mt-1">{status.code}</h2>
          </div>

          {/* Live badge */}
          {wsConnected && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t("tracking.live")}
            </div>
          )}

          {/* Progress stepper */}
          <div className="flex justify-between relative my-6">
            {ORDER_STATUSES.map((s, idx) => {
              const info = STATUS_STYLE[s];
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={s} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: isActive ? info.color : "rgba(255,255,255,0.08)",
                      color: isActive ? "#fff" : "#71717a",
                      boxShadow: isCurrent ? `0 0 0 4px ${info.color}40` : "none",
                    }}
                  >
                    {isActive ? "✓" : idx + 1}
                  </div>
                  <span
                    className="text-[11px] mt-1.5 text-center"
                    style={{
                      color: isActive ? info.color : "#71717a",
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                  >
                    {t(`status.${s}`)}
                  </span>
                </div>
              );
            })}
            {/* Connecting line */}
            <div className="absolute top-[18px] left-[10%] right-[10%] h-[3px] bg-white/10 z-0" />
          </div>

          {/* Summary */}
          <div className="flex justify-between py-3 border-t border-white/10 mt-2">
            <div>
              <div className="text-xs text-zinc-500">{t("tracking.total")}</div>
              <div className="text-gold text-lg font-semibold">
                {formatCurrency(Number(status.total))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500">{t("tracking.date")}</div>
              <div className="text-sm text-zinc-300">
                {new Date(status.created_at).toLocaleDateString(language, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {status.status === "cancelled" && (
            <div className="mt-4 glass rounded-xl px-3 py-3 text-sm text-center text-red-300 border border-red-500/30">
              {t("tracking.cancelledNotice")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
