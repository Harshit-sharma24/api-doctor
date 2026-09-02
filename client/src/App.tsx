import { useEffect, useRef, useState } from "react";

interface KeyValue {
  key: string;
  value: string;
}

type AuthType = "none" | "bearer" | "basic";

type BodyType = "json" | "form-data" | "urlencoded";

interface FormField {
  key: string;
  value: string;
}

interface ApiResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
}

interface HistoryItem {
  _id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  responseBody: unknown;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  createdAt: string;
}

const API_BASE_URL = "https://api-doctor-swvo.onrender.com/api";
// -----------------------------------------------------------------
// Design tokens
// An "API Doctor" reads a request, runs it, and reports back a
// diagnosis. The palette and motifs lean into that: a clinical,
// legible workspace with a single teal "vital" accent, and a status
// pulse that mirrors an instrument's idle / active / result states.
// -----------------------------------------------------------------

const sansStack =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const monoStack =
  "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

const palette = {
  canvas: "#eef1f3",
  surface: "#ffffff",
  surfaceMuted: "#f6f8f9",
  border: "#dde3e7",
  borderStrong: "#c7d0d6",
  ink: "#141b21",
  inkMuted: "#5c6870",
  inkFaint: "#8a949b",
  accent: "#0f6e64",
  accentStrong: "#0b544d",
  accentSoft: "#e3f2ef",
  danger: "#b3261e",
  dangerSoft: "#fbeceb",
};

const statusPalette = (status: number) => {
  if (status >= 200 && status < 300) {
    return { fg: "#166534", bg: "#e9f7ee", ring: "#bfe3cb" };
  }
  if (status >= 300 && status < 400) {
    return { fg: "#92600a", bg: "#fdf3e0", ring: "#f0d99c" };
  }
  if (status >= 400 && status < 500) {
    return { fg: "#a3231b", bg: "#fbebea", ring: "#eec3c0" };
  }
  return { fg: "#7c1d24", bg: "#f9e9ea", ring: "#e6bcbf" };
};

const cardStyle: React.CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: "14px",
  padding: "22px",
  marginBottom: "16px",
};

const sectionHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "15px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: palette.ink,
  paddingLeft: "11px",
  borderLeft: `3px solid ${palette.accent}`,
};

const sectionHintStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  paddingLeft: "11px",
  color: palette.inkFaint,
  fontSize: "12.5px",
};

const fieldStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  border: `1px solid ${palette.border}`,
  borderRadius: "8px",
  background: palette.surface,
  color: palette.ink,
  fontSize: "13.5px",
  outline: "none",
  fontFamily: sansStack,
};

const ghostButtonStyle: React.CSSProperties = {
  border: `1px solid ${palette.borderStrong}`,
  background: palette.surfaceMuted,
  color: palette.accentStrong,
  borderRadius: "8px",
  padding: "8px 13px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  fontFamily: sansStack,
};

const removeButtonStyle: React.CSSProperties = {
  width: "38px",
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: "8px",
  cursor: "pointer",
  color: palette.danger,
  fontSize: "16px",
  lineHeight: 1,
};


const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: `1px solid ${palette.border}`,
  borderRadius: "8px",
  background: palette.surface,
  color: palette.ink,
  fontSize: "13.5px",
  fontFamily: sansStack,
  cursor: "pointer",
};

function App() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");

  const [params, setParams] = useState<KeyValue[]>([
    { key: "", value: "" },
  ]);

  const [headers, setHeaders] = useState<KeyValue[]>([
    { key: "", value: "" },
  ]);

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Authentication
  const [authType, setAuthType] = useState<AuthType>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");

  // Body type
  const [bodyType, setBodyType] = useState<BodyType>("json");

  // Form data
  const [formData, setFormData] = useState<FormField[]>([
    { key: "", value: "" },
  ]);

  // Request timeout
  const [timeout, setTimeoutValue] = useState("30000");

  const responseRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------------
  // Fetch Request History
  // -----------------------------------

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_BASE_URL}/history`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch history");
      }

      setHistory(data.history || []);
    } catch (err) {
      console.error("History error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // -----------------------------------
  // Delete One History Item
  // -----------------------------------

  const deleteHistoryItem = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete history");
      }

      setHistory((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete history item."
      );
    }
  };

  // -----------------------------------
  // Clear History
  // -----------------------------------

  const clearHistory = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all request history?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to clear history");
      }

      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear history.");
    }
  };

  // -----------------------------------
  // Load History On Start
  // -----------------------------------

  useEffect(() => {
    fetchHistory();
  }, []);

  // -----------------------------------
  // Auto Scroll To Response
  // -----------------------------------

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        responseRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [result]);

  // -----------------------------------
  // Query Parameters
  // -----------------------------------

  const updateParam = (index: number, field: "key" | "value", value: string) => {
    const updated = [...params];
    updated[index][field] = value;
    setParams(updated);
  };

  const addParam = () => {
    setParams([...params, { key: "", value: "" }]);
  };

  const removeParam = (index: number) => {
    if (params.length === 1) {
      setParams([{ key: "", value: "" }]);
      return;
    }

    setParams(params.filter((_, i) => i !== index));
  };

  // -----------------------------------
  // Headers
  // -----------------------------------

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    if (headers.length === 1) {
      setHeaders([{ key: "", value: "" }]);
      return;
    }

    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateFormField = (index: number, field: "key" | "value", value: string) => {
    const updated = [...formData];

    updated[index][field] = value;

    setFormData(updated);
  };

  const addFormField = () => {
    setFormData([
      ...formData,
      {
        key: "",
        value: "",
      },
    ]);
  };

  // -----------------------------------
  // Send API Request
  // -----------------------------------

  const sendRequest = async () => {
    if (!url.trim()) {
      setError("Please enter an API URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let requestUrl = url.trim();

      // Add query parameters
      const queryParams = params.filter((param) => param.key.trim() !== "");

      if (queryParams.length > 0) {
        const searchParams = new URLSearchParams();

        queryParams.forEach((param) => {
          searchParams.append(param.key, param.value);
        });

        requestUrl +=
          (requestUrl.includes("?") ? "&" : "?") + searchParams.toString();
      }

      // Convert headers array to object
      const requestHeaders: Record<string, string> = {};

      headers
        .filter((header) => header.key.trim() !== "")
        .forEach((header) => {
          requestHeaders[header.key] = header.value;
        });

      // ----------------------------------
      // Prepare request body
      // ----------------------------------

      let parsedBody: unknown = undefined;

      if (bodyType === "json") {
        if (body.trim()) {
          try {
            parsedBody = JSON.parse(body);
          } catch {
            setError("Invalid JSON body.");
            setLoading(false);
            return;
          }

          if (!requestHeaders["Content-Type"]) {
            requestHeaders["Content-Type"] = "application/json";
          }
        }
      }

      const parsedFormData: Record<string, string> = {};

      if (bodyType === "form-data" || bodyType === "urlencoded") {
        formData
          .filter((field) => field.key.trim() !== "")
          .forEach((field) => {
            parsedFormData[field.key] = field.value;
          });
      }

      // Send request to backend
      const response = await fetch(`${API_BASE_URL}/test-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          url: requestUrl,

          headers: requestHeaders,

          body: parsedBody,

          bodyType,

          formData: parsedFormData,

          authType,

          bearerToken: authType === "bearer" ? bearerToken : undefined,

          basicUsername: authType === "basic" ? basicUsername : undefined,

          basicPassword: authType === "basic" ? basicPassword : undefined,

          timeout: Number(timeout) || 30000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }
      setResult(data.result);
      fetchHistory();

      setTimeout(() => {
        responseRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // Load Request From History
  // -----------------------------------

  const loadHistoryRequest = (item: HistoryItem) => {
    setMethod(item.method);
    setUrl(item.url);

    if (item.requestHeaders) {
      const headerEntries = Object.entries(item.requestHeaders);

      if (headerEntries.length > 0) {
        setHeaders(headerEntries.map(([key, value]) => ({ key, value })));
      } else {
        setHeaders([{ key: "", value: "" }]);
      }
    } else {
      setHeaders([{ key: "", value: "" }]);
    }

    if (item.requestBody !== undefined) {
      setBody(JSON.stringify(item.requestBody, null, 2));
    } else {
      setBody("");
    }

    setResult(null);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------------
  // Copy Response
  // -----------------------------------

 const copyResponse = async () => {
  if (!result) return;

  try {
    await navigator.clipboard.writeText(
      JSON.stringify(result.data, null, 2)
    );
  } catch {
    console.error("Failed to copy response");
  }
};
  // -----------------------------------
  // Helpers
  // -----------------------------------

  const formatResponse = (data: unknown) => {
    if (typeof data === "string") {
      return data;
    }

    return JSON.stringify(data, null, 2);
  };

  // Pulse state: mirrors an instrument's idle / running / result reading.
  const pulse = loading
    ? { color: palette.accent, label: "Running", spin: true }
    : error
    ? { color: palette.danger, label: "Error", spin: false }
    : result
    ? {
        color: statusPalette(result.status).fg,
        label: "Complete",
        spin: false,
      }
    : { color: palette.inkFaint, label: "Idle", spin: false };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.canvas,
        color: palette.ink,
        fontFamily: sansStack,
      }}
    >
      <style>{`
        @keyframes doctor-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.7); }
        }
        @keyframes doctor-reveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .doctor-pulse-dot, .doctor-reveal { animation: none !important; }
        }
        .doctor-app input::placeholder,
        .doctor-app textarea::placeholder {
          color: ${palette.inkFaint};
        }
        .doctor-app input:focus-visible,
        .doctor-app textarea:focus-visible,
        .doctor-app select:focus-visible,
        .doctor-app button:focus-visible {
          outline: 2px solid ${palette.accent};
          outline-offset: 1px;
        }
        .doctor-app button {
          transition: filter 0.12s ease, border-color 0.12s ease;
        }
        .doctor-app button:hover:not(:disabled) {
          filter: brightness(0.97);
        }
        .doctor-history-row {
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .doctor-history-row:hover {
          border-color: ${palette.borderStrong};
        }
      `}</style>

      <div
        className="doctor-app"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "44px 20px 70px",
        }}
      >
        {/* ================= HEADER ================= */}

        <header
          style={{
            marginBottom: "34px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <h1
                style={{
                  fontSize: "30px",
                  lineHeight: 1.15,
                  margin: 0,
                  letterSpacing: "-0.6px",
                  fontWeight: 800,
                }}
              >
                API Doctor
              </h1>
              <span
                style={{
                  fontFamily: monoStack,
                  fontSize: "12px",
                  color: palette.inkFaint,
                  border: `1px solid ${palette.border}`,
                  borderRadius: "6px",
                  padding: "2px 7px",
                }}
              >
                workspace
              </span>
            </div>

            <p
              style={{
                margin: 0,
                color: palette.inkMuted,
                fontSize: "14.5px",
                maxWidth: "48ch",
              }}
            >
              Send a request, read the vitals, keep a chart of everything
              you've tested.
            </p>
          </div>

          {/* Instrument readout */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "9px 14px",
              borderRadius: "999px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              fontSize: "12.5px",
              fontWeight: 700,
              color: palette.inkMuted,
            }}
          >
            <span
              className="doctor-pulse-dot"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: pulse.color,
                display: "inline-block",
                animation: pulse.spin
                  ? "doctor-pulse 1.1s ease-in-out infinite"
                  : "none",
              }}
            />
            {pulse.label}
          </div>
        </header>

        {/* ================= REQUEST CARD ================= */}

        <section style={{ ...cardStyle, padding: "18px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{
                padding: "13px 14px",
                borderRadius: "9px",
                border: `1px solid ${palette.borderStrong}`,
                background: palette.surfaceMuted,
                color: palette.accentStrong,
                fontWeight: 800,
                fontSize: "13.5px",
                fontFamily: monoStack,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendRequest();
                }
              }}
              placeholder="https://api.example.com/users"
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "13px 15px",
                borderRadius: "9px",
                border: `1px solid ${palette.border}`,
                background: palette.surface,
                color: palette.ink,
                fontSize: "13.5px",
                fontFamily: monoStack,
                outline: "none",
              }}
            />

            <button
              onClick={sendRequest}
              disabled={loading}
              style={{
                padding: "13px 24px",
                borderRadius: "9px",
                border: "none",
                background: loading ? palette.accentSoft : palette.accent,
                color: loading ? palette.accentStrong : "#fff",
                fontWeight: 800,
                fontSize: "13.5px",
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: "104px",
              }}
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        </section>

        {/* ================= PARAMETERS ================= */}

        <section style={cardStyle}>
          <div style={sectionHeadingRowStyle}>
            <div>
              <h3 style={sectionTitleStyle}>Query parameters</h3>
              <small style={sectionHintStyle}>
                Appended to the URL as a query string.
              </small>
            </div>

            <button style={ghostButtonStyle} onClick={addParam}>
              + Add
            </button>
          </div>

          {params.map((param, index) => (
            <div
              key={index}
              style={{ display: "flex", gap: "10px", marginBottom: "9px" }}
            >
              <input
                placeholder="Parameter name"
                value={param.key}
                onChange={(e) => updateParam(index, "key", e.target.value)}
                style={fieldStyle}
              />

              <input
                placeholder="Value"
                value={param.value}
                onChange={(e) => updateParam(index, "value", e.target.value)}
                style={fieldStyle}
              />

              <button
                onClick={() => removeParam(index)}
                style={removeButtonStyle}
                aria-label="Remove parameter"
              >
                ×
              </button>
            </div>
          ))}
        </section>

        {/* ================= HEADERS ================= */}

        <section style={cardStyle}>
          <div style={sectionHeadingRowStyle}>
            <div>
              <h3 style={sectionTitleStyle}>Headers</h3>
              <small style={sectionHintStyle}>
                Sent with the request — Content-Type, Authorization, etc.
              </small>
            </div>

            <button style={ghostButtonStyle} onClick={addHeader}>
              + Add
            </button>
          </div>

          {headers.map((header, index) => (
            <div
              key={index}
              style={{ display: "flex", gap: "10px", marginBottom: "9px" }}
            >
              <input
                placeholder="Header name"
                value={header.key}
                onChange={(e) => updateHeader(index, "key", e.target.value)}
                style={fieldStyle}
              />

              <input
                placeholder="Header value"
                value={header.value}
                onChange={(e) => updateHeader(index, "value", e.target.value)}
                style={fieldStyle}
              />

              <button
                onClick={() => removeHeader(index)}
                style={removeButtonStyle}
                aria-label="Remove header"
              >
                ×
              </button>
            </div>
          ))}
        </section>

        {/* ================= AUTHENTICATION ================= */}

        <section style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: "15px" }}>
            Authorization
          </h3>

          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as AuthType)}
            style={{ ...selectStyle, marginBottom: "12px" }}
          >
            <option value="none">No authentication</option>
            <option value="bearer">Bearer token</option>
            <option value="basic">Basic auth</option>
          </select>

          {authType === "bearer" && (
            <input
              type="password"
              placeholder="Enter bearer token"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                ...fieldStyle,
                boxSizing: "border-box",
              }}
            />
          )}

          {authType === "basic" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Username"
                value={basicUsername}
                onChange={(e) => setBasicUsername(e.target.value)}
                style={fieldStyle}
              />

              <input
                type="password"
                placeholder="Password"
                value={basicPassword}
                onChange={(e) => setBasicPassword(e.target.value)}
                style={fieldStyle}
              />
            </div>
          )}
        </section>

        {/* ================= TIMEOUT ================= */}

        <section style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: "15px" }}>
            Request timeout
          </h3>

          <select
            value={timeout}
            onChange={(e) => setTimeoutValue(e.target.value)}
            style={selectStyle}
          >
            <option value="5000">5 seconds</option>
            <option value="10000">10 seconds</option>
            <option value="30000">30 seconds</option>
            <option value="60000">60 seconds</option>
          </select>
        </section>

        {/* ================= BODY ================= */}

        <section style={cardStyle}>
          <div style={{ marginBottom: "14px" }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: "10px" }}>
              Request body
            </h3>

            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value as BodyType)}
              style={{ ...selectStyle, marginBottom: "10px" }}
            >
              <option value="json">JSON</option>
              <option value="form-data">Form data</option>
              <option value="urlencoded">x-www-form-urlencoded</option>
            </select>

            <small style={sectionHintStyle}>
              Used mainly with POST, PUT and PATCH requests.
            </small>
          </div>

          {bodyType === "json" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`{\n  "title": "API Doctor",\n  "body": "Testing API",\n  "userId": 1\n}`}
              rows={8}
              style={{
                width: "100%",
                padding: "14px",
                border: `1px solid ${palette.border}`,
                borderRadius: "9px",
                background: palette.surfaceMuted,
                color: palette.ink,
                fontFamily: monoStack,
                fontSize: "13px",
                lineHeight: 1.6,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          )}

          {(bodyType === "form-data" || bodyType === "urlencoded") && (
            <div>
              {formData.map((field, index) => (
                <div
                  key={index}
                  style={{ display: "flex", gap: "10px", marginBottom: "9px" }}
                >
                  <input
                    type="text"
                    placeholder="Key"
                    value={field.key}
                    onChange={(e) =>
                      updateFormField(index, "key", e.target.value)
                    }
                    style={fieldStyle}
                  />

                  <input
                    type="text"
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) =>
                      updateFormField(index, "value", e.target.value)
                    }
                    style={fieldStyle}
                  />
                </div>
              ))}

              <button style={ghostButtonStyle} onClick={addFormField}>
                + Add field
              </button>
            </div>
          )}
        </section>

        {/* ================= ERROR ================= */}

        {error && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: "18px",
              borderRadius: "10px",
              background: palette.dangerSoft,
              border: `1px solid #f0c6c3`,
              color: palette.danger,
              fontWeight: 600,
              fontSize: "13.5px",
            }}
          >
            {error}
          </div>
        )}

        {/* ================= RESPONSE ================= */}

        {result && (
          <section
            ref={responseRef}
            className="doctor-reveal"
            style={{
              ...cardStyle,
              padding: "24px",
              marginBottom: "30px",
              scrollMarginTop: "20px",
              animation: "doctor-reveal 0.28s ease-out",
            }}
          >
            {/* Response Header */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "7px",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "18px" }}>Diagnosis</h2>

                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: "999px",
                      background: statusPalette(result.status).bg,
                      color: statusPalette(result.status).fg,
                      fontFamily: monoStack,
                      fontSize: "12.5px",
                      fontWeight: 800,
                    }}
                  >
                    {result.status} {result.statusText}
                  </span>
                </div>

                <div
                  style={{
                    color: palette.inkMuted,
                    fontSize: "13px",
                    fontFamily: monoStack,
                    wordBreak: "break-all",
                  }}
                >
                  <strong style={{ color: palette.ink }}>{method}</strong>{" "}
                  {url}
                </div>
              </div>

              <button onClick={copyResponse} style={ghostButtonStyle}>
                Copy response
              </button>
            </div>

            {/* Response Stats */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  padding: "15px",
                  background: palette.surfaceMuted,
                  borderRadius: "10px",
                  border: `1px solid ${palette.border}`,
                }}
              >
                <small style={{ color: palette.inkFaint }}>Status</small>
                <div
                  style={{
                    fontWeight: 800,
                    fontFamily: monoStack,
                    color: statusPalette(result.status).fg,
                    marginTop: "5px",
                  }}
                >
                  {result.status} {result.statusText}
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  background: palette.surfaceMuted,
                  borderRadius: "10px",
                  border: `1px solid ${palette.border}`,
                }}
              >
                <small style={{ color: palette.inkFaint }}>
                  Response time
                </small>
                <div
                  style={{
                    fontWeight: 800,
                    fontFamily: monoStack,
                    marginTop: "5px",
                  }}
                >
                  {result.responseTime} ms
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  background: palette.surfaceMuted,
                  borderRadius: "10px",
                  border: `1px solid ${palette.border}`,
                }}
              >
                <small style={{ color: palette.inkFaint }}>
                  Response headers
                </small>
                <div
                  style={{
                    fontWeight: 800,
                    fontFamily: monoStack,
                    marginTop: "5px",
                  }}
                >
                  {Object.keys(result.headers).length}
                </div>
              </div>
            </div>

            {/* Response Headers */}

            <div style={{ marginBottom: "22px" }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: "10px" }}>
                Response headers
              </h3>

              <pre
                style={{
                  margin: 0,
                  padding: "16px",
                  background: palette.surfaceMuted,
                  border: `1px solid ${palette.border}`,
                  borderRadius: "9px",
                  overflowX: "auto",
                  fontFamily: monoStack,
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  color: palette.ink,
                }}
              >
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </div>

            {/* Response Body */}

            <div>
              <h3 style={{ ...sectionTitleStyle, marginBottom: "10px" }}>
                Response body
              </h3>

              <pre
                style={{
                  margin: 0,
                  padding: "18px",
                  background: "#12181f",
                  color: "#eef1f3",
                  borderRadius: "10px",
                  overflowX: "auto",
                  maxHeight: "550px",
                  overflowY: "auto",
                  fontFamily: monoStack,
                  fontSize: "12.5px",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {formatResponse(result.data)}
              </pre>
            </div>
          </section>
        )}

        {/* ================= HISTORY ================= */}

        <section
          style={{
            borderTop: `1px solid ${palette.border}`,
            paddingTop: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Chart history</h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: palette.inkMuted,
                  fontSize: "13.5px",
                }}
              >
                Your recently tested requests.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={fetchHistory} style={ghostButtonStyle}>
                Refresh
              </button>

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    padding: "8px 13px",
                    borderRadius: "8px",
                    border: `1px solid #f0c6c3`,
                    background: palette.dangerSoft,
                    color: palette.danger,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  Clear history
                </button>
              )}
            </div>
          </div>

          {historyLoading ? (
            <div
              style={{
                padding: "25px",
                textAlign: "center",
                color: palette.inkFaint,
                fontSize: "13.5px",
              }}
            >
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div
              style={{
                padding: "36px",
                textAlign: "center",
                background: palette.surfaceMuted,
                border: `1px dashed ${palette.borderStrong}`,
                borderRadius: "12px",
                color: palette.inkMuted,
                fontSize: "13.5px",
                lineHeight: 1.6,
              }}
            >
              Nothing on the chart yet.
              <br />
              Send a request above to start one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {history.map((item) => (
                <div
                  key={item._id}
                  className="doctor-history-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px",
                    background: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      minWidth: "62px",
                      textAlign: "center",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: palette.accentSoft,
                      color: palette.accentStrong,
                      fontWeight: 800,
                      fontFamily: monoStack,
                      fontSize: "11.5px",
                    }}
                  >
                    {item.method}
                  </span>

                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: monoStack,
                        fontSize: "13px",
                        color: palette.ink,
                        marginBottom: "4px",
                      }}
                    >
                      {item.url}
                    </div>

                    <small style={{ color: palette.inkFaint, fontSize: "12px" }}>
                      <span
                        style={{
                          color: statusPalette(item.status).fg,
                          fontWeight: 800,
                        }}
                      >
                        {item.status} {item.statusText}
                      </span>
                      {"   "}
                      {item.responseTime} ms
                    </small>
                  </div>

                  <div style={{ display: "flex", gap: "7px" }}>
                    <button
                      onClick={() => loadHistoryRequest(item)}
                      style={ghostButtonStyle}
                    >
                      Load
                    </button>

                    <button
                      onClick={() => deleteHistoryItem(item._id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: `1px solid #f0c6c3`,
                        background: palette.dangerSoft,
                        color: palette.danger,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "13px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= FOOTER ================= */}

        <footer
          style={{
            textAlign: "center",
            marginTop: "50px",
            paddingTop: "24px",
            borderTop: `1px solid ${palette.border}`,
            color: palette.inkFaint,
            fontSize: "12.5px",
          }}
        >
          API Doctor — test APIs, understand responses, build better.
        </footer>
      </div>
    </div>
  );
}

export default App;