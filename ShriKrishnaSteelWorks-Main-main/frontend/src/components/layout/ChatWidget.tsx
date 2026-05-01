import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import logoNew from "../../assets/SK-logo-new.jpg";

const API = "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FaqItem { id: string; topic: string; icon: string; }
interface Suggestion { id: string; topic: string; icon: string; }
interface ChatAction { label: string; link: string; }

type MsgType = "bot" | "user" | "faq-menu" | "suggestions";

interface Message {
  id: number;
  type: MsgType;
  text?: string;
  faqItems?: FaqItem[];        // for faq-menu type
  suggestions?: Suggestion[];  // for suggestions type
  action?: ChatAction | null;
  timestamp: Date;
}

// ─── Inline Styles ────────────────────────────────────────────────────────────
const CSS = `
  /* Floating button */
  .kb-btn {
    position: fixed; bottom: 26px; right: 26px; z-index: 10001;
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(145deg, #E8B84B, #b8880e);
    border: 2.5px solid rgba(255,255,255,0.15);
    box-shadow: 0 0 0 0 rgba(232,184,75,0.4), 0 10px 36px rgba(232,184,75,0.35);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: transform 0.25s, box-shadow 0.25s;
    animation: kbPulse 3.2s ease-in-out infinite;
  }
  @keyframes kbPulse {
    0%,100%{box-shadow:0 0 0 0 rgba(232,184,75,0.35), 0 10px 36px rgba(232,184,75,0.35);}
    50%{box-shadow:0 0 0 14px rgba(232,184,75,0), 0 14px 44px rgba(232,184,75,0.5);}
  }
  .kb-btn:hover { transform: scale(1.1) translateY(-3px); animation: none; box-shadow: 0 16px 48px rgba(232,184,75,0.52); }
  .kb-btn img { width: 42px; height: 42px; border-radius: 50%; object-fit: contain; }
  .kb-badge {
    position: absolute; top: -3px; right: -3px;
    background: #e74c3c; color: #fff; border: 2px solid #020b16;
    min-width: 20px; height: 20px; border-radius: 100px;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center; padding: 0 3px;
    animation: pop 0.35s cubic-bezier(.17,.67,.44,1.4);
  }
  @keyframes pop { from{transform:scale(0)} to{transform:scale(1)} }

  /* Chat window */
  .kb-win {
    position: fixed; bottom: 102px; right: 26px; z-index: 10001;
    width: 384px; max-width: calc(100vw - 28px);
    height: 580px; max-height: calc(100vh - 116px);
    background: #060f1e;
    border: 1px solid rgba(74,144,217,0.18);
    border-radius: 20px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
    animation: winIn 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes winIn { from{opacity:0;transform:translateY(28px) scale(0.95)} to{opacity:1;transform:none} }
  .kb-win.kb-min { height: 66px; }

  /* Header */
  .kb-header {
    flex-shrink: 0; padding: 0.85rem 1rem;
    background: linear-gradient(135deg, #091a2e, #060f1e);
    border-bottom: 1px solid rgba(74,144,217,0.16);
    display: flex; align-items: center; gap: 0.8rem;
    position: relative; overflow: hidden;
  }
  .kb-header::after {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, #4A90D9, #E8B84B, #4A90D9);
    background-size: 200%; animation: hs 4s linear infinite;
  }
  @keyframes hs{ from{background-position:-200%} to{background-position:200%} }
  .kb-avatar { width:40px; height:40px; border-radius:50%; border:2px solid #E8B84B; object-fit:contain; flex-shrink:0; background:rgba(232,184,75,0.08); }
  .kb-hinfo { flex:1; min-width:0; }
  .kb-hname { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:1rem; color:#E8B84B; line-height:1.2; }
  .kb-hstatus { display:flex; align-items:center; gap:0.3rem; font-size:0.7rem; color:rgba(220,232,245,0.48); margin-top:1px; }
  .kb-hdot { width:6px; height:6px; border-radius:50%; background:#2ecc71; animation:dp 2s ease-in-out infinite; flex-shrink:0; }
  @keyframes dp{0%,100%{opacity:1}50%{opacity:0.35}}
  .kb-hbtns { display:flex; gap:0.35rem; }
  .kb-hb {
    width:30px; height:30px; border-radius:8px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07);
    color:rgba(220,232,245,0.5); cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:0.78rem;
    transition:all 0.18s;
  }
  .kb-hb:hover { background:rgba(255,255,255,0.1); color:#dce8f5; }

  /* Body */
  .kb-body {
    flex:1; overflow-y:auto; padding:1rem;
    display:flex; flex-direction:column; gap:0.8rem;
    scroll-behavior:smooth;
  }
  .kb-body::-webkit-scrollbar{ width:3px; }
  .kb-body::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.07); border-radius:3px; }

  /* Bot message bubble */
  .kb-bot-row { display:flex; flex-direction:column; align-items:flex-start; gap:0.15rem; }
  .kb-user-row { display:flex; flex-direction:column; align-items:flex-end; gap:0.15rem; }

  .kb-bubble {
    max-width:80%; padding:0.72rem 0.95rem; border-radius:14px;
    font-size:0.865rem; line-height:1.6;
    animation: bi 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes bi { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:none} }
  .kb-bubble.kb-bot { background:rgba(255,255,255,0.057); color:#dce8f5; border-bottom-left-radius:3px; border:1px solid rgba(255,255,255,0.06); }
  .kb-bubble.kb-user { background:linear-gradient(135deg,#1c5499,#4A90D9); color:#fff; border-bottom-right-radius:3px; }
  .kb-time { font-size:0.63rem; color:rgba(220,232,245,0.22); padding:0 0.2rem; }

  /* ─── FAQ Menu Cards (shown in body initially) ─── */
  .kb-faq-menu {
    display:flex; flex-direction:column; gap:0.42rem;
    animation: bi 0.4s 0.1s both;
  }
  .kb-faq-label {
    font-family:'Rajdhani',sans-serif; font-size:0.7rem; font-weight:700;
    letter-spacing:0.14em; text-transform:uppercase;
    color:rgba(232,184,75,0.65); margin-bottom:0.25rem;
  }
  .kb-faq-card {
    display:flex; align-items:center; gap:0.7rem;
    background:rgba(74,144,217,0.06); border:1px solid rgba(74,144,217,0.18);
    border-radius:12px; padding:0.62rem 1rem;
    cursor:pointer; color:#dce8f5; font-size:0.87rem;
    font-family:'Inter',sans-serif;
    transition:all 0.2s; text-align:left; width:100%;
  }
  .kb-faq-card:hover {
    background:rgba(232,184,75,0.09);
    border-color:rgba(232,184,75,0.3);
    color:#E8B84B; transform:translateX(4px);
  }
  .kb-faq-card .kb-ficon { font-size:1.1rem; flex-shrink:0; width:24px; text-align:center; }
  .kb-faq-card .kb-farrow { margin-left:auto; color:rgba(232,184,75,0.45); font-size:0.8rem; flex-shrink:0; }

  /* ─── Suggestions after answer ─── */
  .kb-sug-wrap {
    display:flex; flex-direction:column; gap:0.35rem;
    animation: bi 0.35s 0.15s both;
  }
  .kb-sug-label {
    font-family:'Rajdhani',sans-serif; font-size:0.68rem; font-weight:700;
    letter-spacing:0.12em; text-transform:uppercase;
    color:rgba(220,232,245,0.35);
  }
  .kb-sug-pills { display:flex; flex-wrap:wrap; gap:0.38rem; }
  .kb-sug-btn {
    display:flex; align-items:center; gap:0.3rem;
    background:rgba(232,184,75,0.07); border:1px solid rgba(232,184,75,0.25);
    color:#E8B84B; padding:0.3rem 0.8rem; border-radius:100px;
    font-size:0.775rem; font-family:'Rajdhani',sans-serif; font-weight:600; letter-spacing:0.02em;
    cursor:pointer; transition:all 0.2s;
  }
  .kb-sug-btn:hover { background:rgba(232,184,75,0.18); border-color:#E8B84B; color:#fff; transform:translateY(-1.5px); }

  /* Action link */
  .kb-action {
    display:inline-flex; align-items:center; gap:0.4rem; margin-top:0.4rem;
    background:linear-gradient(135deg,#E8B84B,#c98a0a); color:#020b16;
    padding:0.55rem 1.15rem; border-radius:10px;
    font-family:'Rajdhani',sans-serif; font-weight:700; font-size:0.875rem;
    text-decoration:none; transition:all 0.2s; animation: bi 0.4s;
  }
  .kb-action:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(232,184,75,0.3); }

  /* Typing */
  .kb-typing {
    display:flex; align-items:center; gap:4px;
    padding:0.65rem 1rem; background:rgba(255,255,255,0.055);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:14px; border-bottom-left-radius:3px;
    width:fit-content; animation:bi 0.3s;
  }
  .kb-td { width:7px; height:7px; border-radius:50%; background:rgba(220,232,245,0.45); animation:kbt 1.4s infinite; }
  .kb-td:nth-child(2){animation-delay:.18s} .kb-td:nth-child(3){animation-delay:.36s}
  @keyframes kbt{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}

  /* "Back to menu" link */
  .kb-back-btn {
    display:inline-flex; align-items:center; gap:0.35rem;
    font-size:0.73rem; color:rgba(74,144,217,0.7);
    background:none; border:none; cursor:pointer; padding:0; margin-top:0.3rem;
    font-family:'Rajdhani',sans-serif; font-weight:600; letter-spacing:0.04em;
    transition:color 0.2s;
  }
  .kb-back-btn:hover { color:#4A90D9; }

  /* Divider */
  .kb-divider {
    display:flex; align-items:center; gap:0.6rem;
    font-size:0.65rem; color:rgba(220,232,245,0.2);
    font-family:'Rajdhani',sans-serif; letter-spacing:0.1em; text-transform:uppercase;
  }
  .kb-divider::before,.kb-divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); }

  /* Input area */
  .kb-input-area {
    flex-shrink:0; padding:0.8rem;
    border-top:1px solid rgba(74,144,217,0.14);
    background:rgba(0,0,0,0.22);
    display:flex; gap:0.45rem; align-items:center;
  }
  .kb-inp {
    flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
    color:#dce8f5; padding:0.72rem 1rem; border-radius:24px;
    outline:none; font-family:'Inter',sans-serif; font-size:0.875rem;
    transition:border-color 0.2s;
  }
  .kb-inp::placeholder { color:rgba(220,232,245,0.26); }
  .kb-inp:focus { border-color:rgba(74,144,217,0.42); background:rgba(74,144,217,0.03); }
  .kb-send {
    width:42px; height:42px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,#1c5499,#4A90D9); color:#fff; border:none;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 14px rgba(74,144,217,0.28);
    transition:all 0.2s;
  }
  .kb-send:hover { transform:scale(1.08); box-shadow:0 6px 22px rgba(74,144,217,0.44); }
  .kb-send:disabled { opacity:0.38; cursor:not-allowed; transform:none; box-shadow:none; }

  /* Footer */
  .kb-footer {
    text-align:center; font-size:0.63rem; padding:0.35rem;
    color:rgba(220,232,245,0.18); font-family:'Rajdhani',sans-serif; letter-spacing:0.04em; flex-shrink:0;
  }

  @media(max-width:480px){
    .kb-win{ right:8px; width:calc(100vw - 16px); }
    .kb-btn{ right:12px; bottom:16px; }
  }
`;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mid = useRef(0);

  const nextId = () => ++mid.current;
  const ts = () => new Date();
  const fmt = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── Fetch FAQ list ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/chatbot/faqs`)
      .then(r => r.json())
      .then((data: FaqItem[]) => {
        if (!Array.isArray(data)) return;
        setFaqs(data);
        // Initial state: welcome + FAQ menu in body
        setMessages([
          { id: nextId(), type: "bot", text: "👋 Hello! I'm **Krishna**, your ShriKrishna SteelWorks assistant.\n\nSelect a topic below or type your question:", timestamp: ts() },
          { id: nextId(), type: "faq-menu", faqItems: data, timestamp: ts() },
        ]);
      })
      .catch(() => {
        setMessages([
          { id: nextId(), type: "bot", text: "👋 Hi! I'm your ShriKrishna assistant. How can I help you today?\n\nType your question below.", timestamp: ts() },
        ]);
      });
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Unread counter ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      const botReplies = messages.filter(m => m.type === "bot" && m.id > 2).length;
      setUnreadCount(botReplies);
    } else {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // ── Format markdown-ish text ────────────────────────────────────────────────
  const renderText = (text: string) => {
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1
        ? <strong key={i}>{part}</strong>
        : part.split("\n").map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))
    );
  };

  // ── Show menu again ─────────────────────────────────────────────────────────
  const showMenu = useCallback(() => {
    if (faqs.length === 0) return;
    setMessages(prev => [
      ...prev,
      { id: nextId(), type: "bot", text: "Here are the topics I can help you with:", timestamp: ts() },
      { id: nextId(), type: "faq-menu", faqItems: faqs, timestamp: ts() },
    ]);
    setUsedIds([]); // reset used topics when menu re-shown
  }, [faqs]);

  // ── Main query sender ────────────────────────────────────────────────────────
  const sendQuery = useCallback(async (query: string, displayText?: string) => {
    const trimmed = query.trim();
    if (!trimmed || isTyping) return;

    // 1. Add user message
    setMessages(prev => [
      ...prev,
      { id: nextId(), type: "user", text: displayText || trimmed, timestamp: ts() },
    ]);
    setInput("");
    setIsTyping(true);

    // 2. Call backend
    try {
      const res = await fetch(`${API}/api/chatbot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, usedIds }),
      });
      const data = await res.json();

      // Track used topics
      const newUsed = [...usedIds];
      if (data.matchedId) newUsed.push(data.matchedId);
      if (data.suggested) data.suggested.forEach((s: Suggestion) => newUsed.push(s.id));
      setUsedIds([...new Set(newUsed)]);

      setIsTyping(false);

      // 3. Add bot answer
      setMessages(prev => [
        ...prev,
        { id: nextId(), type: "bot", text: data.answer || "I couldn't find an answer for that. Please contact our team.", timestamp: ts(), action: data.action || null },
      ]);

      // 4. Add suggestions block (separate message node for cleaner UI)
      if (data.suggested && data.suggested.length > 0) {
        setMessages(prev => [
          ...prev,
          { id: nextId(), type: "suggestions", suggestions: data.suggested, timestamp: ts() },
        ]);
      }

      if (!isOpen) setUnreadCount(c => c + 1);
    } catch {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: nextId(), type: "bot", text: "Connection error. Please try again or contact us directly.", timestamp: ts(), action: { label: "Contact Us", link: "/contact" } },
      ]);
    }
  }, [isTyping, usedIds, isOpen]);

  const handleFaqClick = (faq: FaqItem) => sendQuery(faq.id, `${faq.icon} ${faq.topic}`);
  const handleSugClick = (sug: Suggestion) => sendQuery(sug.id, `${sug.icon} ${sug.topic}`);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ── Floating Button ── */}
      {!isOpen && (
        <div style={{ position: "fixed", bottom: "26px", right: "26px", zIndex: 10001 }}>
          <button className="kb-btn" onClick={() => setIsOpen(true)} aria-label="Open Chat">
            <img src={logoNew} alt="ShriKrishna" style={{ borderRadius: "50%" }} />
          </button>
          {unreadCount > 0 && <div className="kb-badge">{unreadCount}</div>}
        </div>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className={`kb-win ${isMinimized ? "kb-min" : ""}`}>

          {/* Header */}
          <div className="kb-header">
            <img src={logoNew} alt="SK" className="kb-avatar" style={{ borderRadius: "50%", objectFit: "cover" }} />
            <div className="kb-hinfo">
              <div className="kb-hname">Krishna · Steel Assistant</div>
              <div className="kb-hstatus">
                <span className="kb-hdot" /> Online · DB-powered · ShriKrishna SteelWorks
              </div>
            </div>
            <div className="kb-hbtns">
              <button className="kb-hb" title="Show FAQ Menu" onClick={showMenu}>☰</button>
              <button className="kb-hb" title={isMinimized ? "Expand" : "Minimize"} onClick={() => setIsMinimized(p => !p)}>
                {isMinimized ? "▲" : "▂"}
              </button>
              <button className="kb-hb" title="Close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Body */}
              <div className="kb-body" ref={bodyRef}>
                {messages.map((msg) => {

                  /* ── Bot bubble ── */
                  if (msg.type === "bot") return (
                    <div key={msg.id} className="kb-bot-row">
                      <div className="kb-bubble kb-bot">{renderText(msg.text || "")}</div>
                      {msg.action && (
                        <Link to={msg.action.link} className="kb-action" onClick={() => setIsOpen(false)}>
                          {msg.action.label} →
                        </Link>
                      )}
                      <div className="kb-time">{fmt(msg.timestamp)}</div>
                    </div>
                  );

                  /* ── User bubble ── */
                  if (msg.type === "user") return (
                    <div key={msg.id} className="kb-user-row">
                      <div className="kb-bubble kb-user">{msg.text}</div>
                      <div className="kb-time">{fmt(msg.timestamp)}</div>
                    </div>
                  );

                  /* ── FAQ Menu (initial + re-shown) ── */
                  if (msg.type === "faq-menu" && msg.faqItems) return (
                    <div key={msg.id} className="kb-faq-menu">
                      <div className="kb-faq-label">📋 Select a topic</div>
                      {msg.faqItems.map(faq => (
                        <button key={faq.id} className="kb-faq-card" onClick={() => handleFaqClick(faq)}>
                          <span className="kb-ficon">{faq.icon}</span>
                          {faq.topic}
                          <span className="kb-farrow">›</span>
                        </button>
                      ))}
                    </div>
                  );

                  /* ── Suggestions after answer ── */
                  if (msg.type === "suggestions" && msg.suggestions) return (
                    <div key={msg.id} className="kb-sug-wrap">
                      <div className="kb-sug-label">🔗 Related topics</div>
                      <div className="kb-sug-pills">
                        {msg.suggestions.map(s => (
                          <button key={s.id} className="kb-sug-btn" onClick={() => handleSugClick(s)}>
                            {s.icon} {s.topic}
                          </button>
                        ))}
                        <button className="kb-back-btn" onClick={showMenu}>
                          ← All topics
                        </button>
                      </div>
                    </div>
                  );

                  return null;
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="kb-bot-row">
                    <div className="kb-typing">
                      <span className="kb-td"/><span className="kb-td"/><span className="kb-td"/>
                    </div>
                  </div>
                )}

                <div />
              </div>

              {/* Input */}
              <div className="kb-input-area">
                <input
                  ref={inputRef}
                  className="kb-inp"
                  type="text"
                  placeholder="Type your question or select a topic above…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendQuery(input)}
                  disabled={isTyping}
                />
                <button
                  className="kb-send"
                  onClick={() => sendQuery(input)}
                  disabled={isTyping || !input.trim()}
                  aria-label="Send"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>

              <div className="kb-footer">ShriKrishna SteelWorks · Powered by live database</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
