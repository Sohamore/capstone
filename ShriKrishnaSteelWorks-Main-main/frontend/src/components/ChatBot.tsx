import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "../chatbot-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "model";
  text: string;
  timestamp: string;
  isError?: boolean;
  confidence?: number;   // AI confidence 0-1
  intent?: string;       // detected intent
  sentiment?: string;    // detected sentiment
  suggestions?: string[]; // AI-generated follow-up suggestions
}

// ─── Speech Recognition Types ───────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  new (): SpeechRecognition;
};

// ─── ═══════════════════════════════════════════════════════════════════════════
//     CLIENT-SIDE ML ENGINE — Intent Detection + Sentiment Analysis + NLP
// ════════════════════════════════════════════════════════════════════════════════

// Intent graph — maps intents to follow-up suggestions (topic transition model)
const INTENT_SUGGESTION_MAP: Record<string, string[]> = {
  pricing: ["What is the minimum order quantity?", "Do you offer bulk discounts?", "What are the payment options?"],
  products: ["What are your steel grades?", "Can you cut steel to custom sizes?", "Do you provide IS-certified steel?"],
  tmt: ["What is the pricing for TMT bars?", "What is the delivery time?", "Do you provide IS-certified steel?"],
  delivery: ["What are the payment options?", "How do I track my order?", "What is the minimum order quantity?"],
  order: ["What is the delivery time?", "What are the payment options?", "How do I track my order?"],
  contact: ["How to place an order?", "What services do you offer?", "What TMT bars do you sell?"],
  quality: ["What TMT bars do you sell?", "What is the pricing for TMT bars?", "What are your steel grades?"],
  bulk: ["What are the payment options?", "What is the delivery time?", "What is the minimum order quantity?"],
  services: ["Can you cut steel to custom sizes?", "What is the pricing for TMT bars?", "What is the delivery time?"],
  general: ["How to place an order?", "What TMT bars do you sell?", "What are the payment options?"],
};

// TF-IDF style intent classifier
const INTENT_KEYWORDS: Array<{ intent: string; terms: Array<[string, number]> }> = [
  { intent: "pricing", terms: [["price", 2], ["rate", 2], ["cost", 2], ["rupee", 3], ["₹", 3], ["per ton", 3], ["per kg", 3], ["how much", 2], ["expensive", 1], ["cheap", 1]] },
  { intent: "tmt", terms: [["tmt", 3], ["fe-500", 3], ["fe-550", 3], ["fe-415", 3], ["rebar", 2], ["bar", 1], ["reinforcement", 2], ["12mm", 2], ["16mm", 2]] },
  { intent: "delivery", terms: [["delivery", 3], ["deliver", 2], ["shipping", 2], ["dispatch", 2], ["when", 1], ["timeline", 2], ["how long", 2], ["days", 1]] },
  { intent: "order", terms: [["order", 3], ["buy", 2], ["purchase", 2], ["place order", 3], ["ordering", 2], ["cart", 2], ["checkout", 2]] },
  { intent: "products", terms: [["product", 2], ["catalog", 2], ["pipe", 2], ["angle", 2], ["channel", 2], ["sheet", 2], ["plate", 2], ["wire", 2], ["beam", 2]] },
  { intent: "bulk", terms: [["bulk", 3], ["wholesale", 3], ["b2b", 3], ["contractor", 2], ["builder", 2], ["large order", 3], ["10 ton", 2], ["business", 1]] },
  { intent: "quality", terms: [["quality", 2], ["certified", 2], ["is standard", 3], ["mtr", 2], ["test report", 2], ["is 1786", 3], ["grade", 1]] },
  { intent: "contact", terms: [["contact", 2], ["reach", 2], ["phone", 2], ["whatsapp", 2], ["email", 2], ["support", 2], ["call", 1]] },
  { intent: "services", terms: [["service", 2], ["cutting", 2], ["bend", 2], ["custom", 1], ["fabrication", 2], ["consultation", 2]] },
];

/** Classify user intent with confidence score 0–1 */
function classifyIntent(text: string): { intent: string; confidence: number } {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  let totalWeight = 0;

  for (const { intent, terms } of INTENT_KEYWORDS) {
    let score = 0;
    for (const [term, weight] of terms) {
      if (lower.includes(term)) score += weight;
    }
    if (score > 0) { scores[intent] = score; totalWeight += score; }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { intent: "general", confidence: 0.3 };

  const [topIntent, topScore] = sorted[0];
  const confidence = Math.min(0.95, 0.4 + (topScore / (totalWeight * 0.8)) * 0.55);
  return { intent: topIntent, confidence };
}

// ─── Sentiment Analysis Engine ────────────────────────────────────────────────
const SENTIMENT_LEXICON: Record<string, number> = {
  // Negative
  angry: -2, frustrated: -2, terrible: -2, horrible: -2, worst: -2, useless: -2,
  bad: -1, poor: -1, slow: -1, expensive: -1, wrong: -1, issue: -1, problem: -1, error: -1,
  hate: -2, "not working": -2, failed: -1, disappointed: -1,
  // Neutral
  okay: 0, fine: 0, normal: 0, average: 0,
  // Positive
  good: 1, great: 1, thanks: 1, thank: 1, helpful: 1, excellent: 1, fast: 1,
  amazing: 2, awesome: 2, perfect: 2, love: 2, wonderful: 2,
};

type Sentiment = "positive" | "neutral" | "negative" | "urgent";

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let score = 0;
  for (const [word, val] of Object.entries(SENTIMENT_LEXICON)) {
    if (lower.includes(word)) score += val;
  }
  // Urgency signals
  if (/urgent|asap|immediately|emergency|right now|today|NOW/i.test(text)) return "urgent";
  if (score >= 1) return "positive";
  if (score <= -1) return "negative";
  return "neutral";
}

// ─── Autocomplete suggestions engine ─────────────────────────────────────────
const QUESTION_BANK = [
  "How to place an order?",
  "What TMT bars do you sell?",
  "What are your steel grades?",
  "What is the delivery time?",
  "What are the payment options?",
  "What is the minimum order quantity?",
  "Do you offer bulk discounts?",
  "How do I track my order?",
  "What services do you offer?",
  "What is the pricing for TMT bars?",
  "Do you sell MS pipes?",
  "Can you cut steel to custom sizes?",
  "Do you provide IS-certified steel?",
  "What is your return policy?",
  "How do I contact you?",
  "What is Fe-500D?",
  "What brands do you stock?",
  "How do I register on the website?",
  "Is same-day delivery available?",
  "What is the GST rate on steel?",
];

/** Returns top-k autocomplete suggestions for partial input */
function getAutocompleteSuggestions(input: string, k = 4): string[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  const scored = QUESTION_BANK.map(q => {
    const ql = q.toLowerCase();
    let score = 0;
    // Exact prefix
    if (ql.startsWith(lower)) score += 10;
    // Contains all words
    const words = lower.split(/\s+/).filter(Boolean);
    for (const w of words) { if (ql.includes(w)) score += 2; }
    // Character overlap
    score += lower.split("").filter(c => ql.includes(c)).length * 0.1;
    return { q, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(x => x.q);
}

// ─── Pre-built price trend simulation (ML-style moving average) ───────────────
const PRICE_TREND_DATA = {
  tmt: [62000, 61500, 63000, 64500, 63800, 65000, 64200, 66000, 65500, 67000, 66500, 68000],
  pipes: [72000, 71000, 73500, 75000, 74200, 76000, 75800, 77500, 76000, 78000, 77500, 79000],
  labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
};

function computeMovingAverage(data: number[], window = 3): number[] {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  });
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "skw_chat_history";

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(msgs.slice(-50)));
  } catch { /* Storage full */ }
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(74,144,217,0.12);padding:0.1em 0.35em;border-radius:3px;font-size:0.88em;'>$1</code>")
    .replace(/^[-•·] (.+)/gm, '<span style="display:block;padding-left:0.5em">· $1</span>')
    .replace(/\n/g, "<br />");
}

function fmt(iso: string) {
  try { return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

// ─── Sentiment → bot empathy prefix ──────────────────────────────────────────
function getSentimentPrefix(sentiment: Sentiment): string {
  if (sentiment === "negative") return "I understand your concern. Let me help you right away.\n\n";
  if (sentiment === "urgent") return "Understood — treating this as **urgent**. Here's what you need:\n\n";
  if (sentiment === "positive") return "";
  return "";
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
  </svg>
);
const MicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
  </svg>
);
const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
);
const ChatIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CloseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const BotIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11V6" />
    <circle cx="12" cy="4" r="2" /><path d="M8 15h.01M16 15h.01" />
  </svg>
);
const UserIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const QIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);
const CopyIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const TrendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
);
const BrainIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.84A2.5 2.5 0 0 1 9.5 2" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.84A2.5 2.5 0 0 0 14.5 2" />
  </svg>
);

// ─── Mini Sparkline chart (SVG-based) ────────────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const W = 200, H = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").at(-1)!.split(",")[0]} cy={pts.split(" ").at(-1)!.split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// ─── Price Trend Panel ────────────────────────────────────────────────────────
function PriceTrendPanel() {
  const tmtMA = useMemo(() => computeMovingAverage(PRICE_TREND_DATA.tmt, 3), []);
  const pipeMA = useMemo(() => computeMovingAverage(PRICE_TREND_DATA.pipes, 3), []);
  const tmtDir = PRICE_TREND_DATA.tmt.at(-1)! > PRICE_TREND_DATA.tmt.at(-2)! ? "▲" : "▼";
  const pipeDir = PRICE_TREND_DATA.pipes.at(-1)! > PRICE_TREND_DATA.pipes.at(-2)! ? "▲" : "▼";

  return (
    <div className="skw-trend-panel" id="skw-trend-panel">
      <div className="skw-qbank-title" style={{ marginBottom: 0 }}>📈 AI Price Trend Analysis</div>
      <div className="skw-trend-subtitle">3-month moving average · indicative only</div>

      <div className="skw-trend-card">
        <div className="skw-trend-label">TMT Bars <span className={tmtDir === "▲" ? "skw-trend-up" : "skw-trend-down"}>{tmtDir} trend</span></div>
        <MiniSparkline data={tmtMA} color="#4A90D9" />
        <div className="skw-trend-value">₹{(PRICE_TREND_DATA.tmt.at(-1)! / 1000).toFixed(1)}K / MT</div>
      </div>

      <div className="skw-trend-card">
        <div className="skw-trend-label">MS Pipes <span className={pipeDir === "▲" ? "skw-trend-up" : "skw-trend-down"}>{pipeDir} trend</span></div>
        <MiniSparkline data={pipeMA} color="#E8B84B" />
        <div className="skw-trend-value">₹{(PRICE_TREND_DATA.pipes.at(-1)! / 1000).toFixed(1)}K / MT</div>
      </div>

      <div className="skw-trend-note">AI analysis uses 12-month historical data &amp; moving average smoothing.</div>
    </div>
  );
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence, intent }: { confidence: number; intent: string }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 75 ? "#4ADE80" : pct >= 50 ? "#E8B84B" : "#F87171";
  return (
    <span className="skw-confidence-badge" style={{ color }} title={`AI intent: ${intent} · confidence: ${pct}%`}>
      <BrainIcon /> {pct}%
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showUnread, setShowUnread] = useState(() => loadHistory().length === 0);
  const [showQBank, setShowQBank] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recogRef = useRef<SpeechRecognition | null>(null);

  const API_URL = import.meta.env.DEV
    ? "http://127.0.0.1:5000"
    : (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

  // ── Persist ─────────────────────────────────────────────────────────────────
  useEffect(() => { saveHistory(messages); }, [messages]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  // ── Auto-resize textarea ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "38px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  // ── Autocomplete as user types ───────────────────────────────────────────────
  useEffect(() => {
    if (!input.trim() || input.length < 2) {
      setAutocomplete([]);
      setShowAutocomplete(false);
      return;
    }
    const suggestions = getAutocompleteSuggestions(input, 4);
    setAutocomplete(suggestions);
    setShowAutocomplete(suggestions.length > 0);
  }, [input]);

  // ── Open / Close ─────────────────────────────────────────────────────────────
  const open = () => { setIsOpen(true); setShowUnread(false); };
  const close = () => {
    setIsClosing(true);
    setTimeout(() => { setIsOpen(false); setIsClosing(false); setShowQBank(false); setShowTrend(false); }, 220);
  };

  // ── Clear chat ───────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]); localStorage.removeItem(LS_KEY); setShowUnread(true);
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    setShowQBank(false);
    setShowTrend(false);
    setShowAutocomplete(false);

    // ── Client-side AI analysis ──────────────────────────────────────────────
    const { intent, confidence } = classifyIntent(text);
    const sentiment = detectSentiment(text);
    const empathyPrefix = getSentimentPrefix(sentiment);

    const userMsg: Message = {
      role: "user",
      text,
      timestamp: new Date().toISOString(),
      intent,
      sentiment,
      confidence,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, text: m.text })),
          meta: { intent, sentiment, confidence },
        }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error("Server is not reachable. Is the backend running on port 5000?");
      }

      const data = await res.json();
      const rawReply = data.reply || "No response received. Please try again.";
      const reply = empathyPrefix + rawReply;

      // Generate AI follow-up suggestions based on intent
      const suggestions = INTENT_SUGGESTION_MAP[intent] || INTENT_SUGGESTION_MAP["general"];

      setMessages(prev => [...prev, {
        role: "model",
        text: reply,
        timestamp: new Date().toISOString(),
        isError: !res.ok,
        intent,
        confidence,
        suggestions,
      }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection error.";
      const suggestions = INTENT_SUGGESTION_MAP["contact"];
      setMessages(prev => [...prev, {
        role: "model",
        text: `Connection issue: ${msg}\n\nPlease ensure the backend server is running, or visit our **Contact page** for direct assistance.`,
        timestamp: new Date().toISOString(),
        isError: true,
        suggestions,
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, isLoading, messages, API_URL]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") setShowAutocomplete(false);
  };

  // ── Copy ──────────────────────────────────────────────────────────────────────
  const copyMsg = async (text: string, idx: number) => {
    try { await navigator.clipboard.writeText(text); setCopied(idx); setTimeout(() => setCopied(null), 1800); }
    catch { /* skip */ }
  };

  // ── Voice input ──────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }
    if (isListening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    r.onresult = (e: SpeechRecognitionEvent) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = r.onend = () => setIsListening(false);
    r.start();
    recogRef.current = r;
    setIsListening(true);
  };

  // ── Sentiment indicator ───────────────────────────────────────────────────────
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  const currentSentiment = lastUserMsg?.sentiment as Sentiment | undefined;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── FAB ── */}
      <button
        id="skw-chat-fab"
        className={`skw-chat-fab${isOpen ? " open" : ""}`}
        onClick={isOpen ? close : open}
        title={isOpen ? "Close chat" : "Chat with KrishnaBot AI"}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        style={!isOpen ? { padding: 0, overflow: "hidden" } : {}}
      >
        {isOpen ? <CloseIcon /> : <img src="/src/assets/SK-logo-new.jpg" alt="Chat" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {showUnread && !isOpen && <span className="skw-chat-unread" />}
      </button>

      {/* ── Panel ── */}
      {isOpen && (
        <div
          id="skw-chat-panel"
          className={`skw-chat-panel${isClosing ? " closing" : ""}`}
          role="dialog"
          aria-label="Chat window"
        >
          {/* ── Header ── */}
          <div className="skw-chat-header">
            <div className="skw-chat-header-icon"><BotIcon /></div>
            <div className="skw-chat-header-info">
              <div className="skw-chat-header-name">KrishnaBot <span className="skw-ai-badge">AI</span></div>
              <div className="skw-chat-header-status">
                <span className="skw-status-dot" />
                Online · ML-Powered Steel Expert
              </div>
            </div>
            <div className="skw-chat-header-btns">
              {/* Price Trend */}
              <button
                className={`skw-chat-hbtn${showTrend ? " active" : ""}`}
                onClick={() => { setShowTrend(t => !t); setShowQBank(false); }}
                title="AI Price Trends"
                aria-label="Show price trend analysis"
                id="skw-trend-btn"
                style={showTrend ? { borderColor: "rgba(232,184,75,0.6)", color: "#E8B84B" } : {}}
              >
                <TrendIcon />
              </button>
              {/* Question bank */}
              <button
                className={`skw-chat-hbtn${showQBank ? " active" : ""}`}
                onClick={() => { setShowQBank(q => !q); setShowTrend(false); }}
                title="Question bank"
                aria-label="Show question bank"
                id="skw-qbank-btn"
                style={showQBank ? { borderColor: "rgba(74,144,217,0.6)", color: "#4A90D9" } : {}}
              >
                <QIcon />
              </button>
              <button className="skw-chat-hbtn" onClick={clearChat} title="Clear conversation" aria-label="Clear chat" id="skw-chat-clear">
                <TrashIcon />
              </button>
              <button className="skw-chat-hbtn" onClick={close} title="Close" aria-label="Close chat" id="skw-chat-close">
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* ── Sentiment awareness bar ── */}
          {currentSentiment && currentSentiment !== "neutral" && currentSentiment !== "positive" && (
            <div className={`skw-sentiment-bar skw-sentiment-${currentSentiment}`}>
              {currentSentiment === "negative" && "😔 I sense frustration — I'll prioritize helping you."}
              {currentSentiment === "urgent" && "⚡ Urgent request detected — fast-tracking your query."}
            </div>
          )}

          {/* ── Price Trend Panel ── */}
          {showTrend && <PriceTrendPanel />}

          {/* ── Question Bank Panel ── */}
          {showQBank && !showTrend && (
            <div className="skw-qbank-panel" id="skw-qbank-panel">
              <div className="skw-qbank-title">Common Questions</div>
              <div className="skw-qbank-list">
                {QUESTION_BANK.slice(0, 15).map((q, i) => (
                  <button key={i} className="skw-qbank-item" id={`skw-qbank-${i}`}
                    onClick={() => { send(q); setShowQBank(false); }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          {!showQBank && !showTrend && (
            <div className="skw-chat-messages" id="skw-chat-messages">
              {messages.length === 0 ? (
                <div className="skw-chat-welcome">
                  <div className="skw-chat-welcome-icon"><BotIcon /></div>
                  <h4>KrishnaBot AI <span className="skw-ai-badge" style={{ fontSize: "0.7rem" }}>ML</span></h4>
                  <p>Powered by <strong>Intent Detection</strong>, <strong>Sentiment Analysis</strong> &amp; <strong>Gemini AI</strong>. Ask about steel products, pricing, delivery, or orders.</p>
                  <div className="skw-welcome-chips">
                    {["TMT Bars", "Price Trends", "Place Order", "Delivery Time"].map(chip => (
                      <button key={chip} className="skw-welcome-chip"
                        onClick={() => send(chip)}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`skw-chat-row ${msg.role === "user" ? "user" : "bot"}`}>
                    <div className="skw-chat-row-avatar">
                      {msg.role === "user" ? <UserIcon /> : <BotIcon />}
                    </div>
                    <div className="skw-chat-bubble-wrap">
                      <div
                        className={`skw-chat-bubble${msg.isError ? " error" : ""}`}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span className="skw-bubble-time">{fmt(msg.timestamp)}</span>
                        {/* AI Confidence badge for model messages */}
                        {msg.role === "model" && msg.confidence !== undefined && (
                          <ConfidenceBadge confidence={msg.confidence} intent={msg.intent || "general"} />
                        )}
                        {msg.role === "model" && (
                          <button className="skw-bubble-copy-inline" onClick={() => copyMsg(msg.text, i)} title="Copy" id={`skw-copy-${i}`}>
                            {copied === i ? "✓" : <CopyIcon />}
                          </button>
                        )}
                      </div>
                      {/* AI-generated follow-up suggestions */}
                      {msg.role === "model" && msg.suggestions && i === messages.length - 1 && (
                        <div className="skw-followup-chips">
                          {msg.suggestions.map((s, si) => (
                            <button key={si} className="skw-followup-chip"
                              id={`skw-followup-${i}-${si}`}
                              onClick={() => send(s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {isLoading && (
                <div className="skw-chat-typing">
                  <div className="skw-chat-row-avatar" style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "linear-gradient(135deg,#4A90D9,#5BA3EE)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", flexShrink: 0, marginTop: "auto"
                  }}><BotIcon /></div>
                  <div className="skw-chat-typing-bubble">
                    <div className="skw-tdot" /><div className="skw-tdot" /><div className="skw-tdot" />
                    <span className="skw-typing-label">AI thinking...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {/* ── Input area ── */}
          <div className="skw-chat-input-area">
            {/* Autocomplete dropdown */}
            {showAutocomplete && autocomplete.length > 0 && (
              <div className="skw-autocomplete" id="skw-autocomplete">
                <div className="skw-autocomplete-label">💡 Suggestions</div>
                {autocomplete.map((s, i) => (
                  <button key={i} className="skw-autocomplete-item" id={`skw-autocomplete-${i}`}
                    onClick={() => { setInput(s); setShowAutocomplete(false); textareaRef.current?.focus(); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="skw-chat-input-row" id="skw-chat-input-row">
              <button
                className={`skw-chat-mic${isListening ? " listening" : ""}`}
                onClick={toggleVoice}
                title={isListening ? "Stop listening" : "Voice input"}
                aria-label="Voice input"
                id="skw-chat-mic"
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </button>
              <textarea
                ref={textareaRef}
                id="skw-chat-input"
                className="skw-chat-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                placeholder={isListening ? "Listening..." : "Ask about steel, orders, delivery..."}
                rows={1}
                disabled={isLoading}
                aria-label="Type your message"
              />
              <button
                className="skw-chat-send"
                onClick={() => send()}
                disabled={isLoading || !input.trim()}
                title="Send"
                aria-label="Send message"
                id="skw-chat-send"
              >
                <SendIcon />
              </button>
            </div>
            {/* AI indicator footer */}
            <div className="skw-input-footer">
              <span className="skw-input-footer-text">
                <BrainIcon /> Intent detection · Sentiment analysis · Gemini AI
              </span>
              {currentSentiment === "urgent" && <span style={{ color: "#F87171", fontSize: "0.6rem" }}>⚡ Urgent mode</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
