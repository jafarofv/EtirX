import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { formatCurrency } from "../lib/formatCurrency";
import { useI18n } from "../i18n";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const WS_BASE =
  (import.meta.env.VITE_WS_URL as string) ||
  API_BASE.replace("/api", "").replace("http", "ws");

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
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#2d1b4e" }}>
        {t("tracking.heading")}
      </h1>
      <p style={{ color: "#666", marginBottom: 24 }}>{t("tracking.intro")}</p>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: 8, marginBottom: 32 }}
      >
        <input
          type="text"
          placeholder={t("tracking.codePlaceholder")}
          aria-label={t("tracking.codeLabel")}
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 16,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !orderCode.trim()}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, #2d1b4e, #6b1d5e)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : t("tracking.track")}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            background: "#fff0f0",
            color: "#b71c1c",
            marginBottom: 16,
            border: "1px solid #ffcdd2",
          }}
        >
          {error}
        </div>
      )}

      {status && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #eee",
            padding: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: "#888", fontSize: 14 }}>{t("tracking.codeLabel")}</span>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700 }}>
              {status.code}
            </h2>
          </div>

          {/* Live badge */}
          {wsConnected && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#e8f5e9",
                color: "#1b5e20",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#1b5e20",
                  animation: "pulse 2s infinite",
                }}
              />
              {t("tracking.live")}
            </div>
          )}

          {/* Progress stepper */}
          <div style={{ display: "flex", justifyContent: "space-between", margin: "24px 0", position: "relative" }}>
            {ORDER_STATUSES.map((s, idx) => {
              const info = STATUS_STYLE[s];
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: isActive ? info.color : "#e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: isActive ? "#fff" : "#999",
                      fontWeight: "bold",
                      transition: "all 0.3s",
                      boxShadow: isCurrent ? `0 0 0 4px ${info.color}40` : "none",
                    }}
                  >
                    {isActive ? "✓" : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: isActive ? info.color : "#aaa",
                      fontWeight: isCurrent ? 700 : 400,
                      textAlign: "center",
                    }}
                  >
                    {t(`status.${s}`)}
                  </span>
                </div>
              );
            })}
            {/* Connecting line */}
            <div
              style={{
                position: "absolute",
                top: 18,
                left: "10%",
                right: "10%",
                height: 3,
                background: "#e0e0e0",
                zIndex: 0,
              }}
            />
          </div>

          {/* Summary */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderTop: "1px solid #eee",
              marginTop: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>{t("tracking.total")}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#6b1d5e" }}>
                {formatCurrency(Number(status.total))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#888" }}>{t("tracking.date")}</div>
              <div style={{ fontSize: 14 }}>
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
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: "#fff0f0",
                color: "#b71c1c",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {t("tracking.cancelledNotice")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
