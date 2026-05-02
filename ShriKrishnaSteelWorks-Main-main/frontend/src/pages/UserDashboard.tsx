// src/pages/UserDashboard.tsx — Professional SaaS Dashboard
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/firebase";
import { getUser, getUserOrders, updateUser, getUserInquiries, getUserProjectsByEmail } from "../services/api";
import type { MongoUser, MongoOrder, MongoInquiry, MongoProject } from "../services/api";

type Tab = "overview" | "orders" | "projects" | "quotations" | "profile" | "settings";
type EditForm = {
  name: string; phone: string; company: string;
  street: string; city: string; state: string; pincode: string;
};

const S: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Delivered:  { color:"#22C55E", bg:"#052814", border:"#16502e", label:"Delivered"  },
  Processing: { color:"#60A5FA", bg:"#061728", border:"#1a4166", label:"Processing" },
  Shipped:    { color:"#A78BFA", bg:"#130c26", border:"#3b2d6e", label:"Shipped"    },
  Pending:    { color:"#F59E0B", bg:"#1a1105", border:"#5a3d08", label:"Pending"    },
  Cancelled:  { color:"#6B7280", bg:"#111318", border:"#2d3139", label:"Cancelled"  },
};

const STAGES = [
  { label:"Placed",     icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label:"Confirmed",  icon:"M5 13l4 4L19 7" },
  { label:"Processing", icon:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { label:"Ready",      icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label:"Shipped",    icon:"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8m-9 4v5m4-5v5" },
  { label:"Delivered",  icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
];

const STAGE_IDX: Record<string, number> = {
  Pending:0, Processing:2, Shipped:4, Delivered:5, Cancelled:-1,
};

const MOCK_QUOTES = [
  { id:"QT-2025-001", product:"TMT Steel Bars Fe-500 (12mm) — 5 MT Bulk Order", qty:"5 MT",   date:"Mar 10, 2025", status:"Approved", amount:"₹2,10,000" },
  { id:"QT-2025-002", product:"Custom MS Sliding Gate (14×7 ft) with Decorative Grill",    qty:"1 unit",  date:"Mar 22, 2025", status:"Pending",  amount:"Awaiting"  },
  { id:"QT-2025-003", product:"SS 304 Balcony Railing — 30 Running Metres",       qty:"30 RMT", date:"Apr 01, 2025", status:"Review",   amount:"₹54,000"   },
  { id:"QT-2025-004", product:"Pre-Engineered Steel Warehouse Structure (3000 sqft)", qty:"1 project", date:"Apr 08, 2025", status:"Approved", amount:"₹9,40,000" },
];
const QS: Record<string, { color:string; bg:string; border:string }> = {
  Approved: { color:"#22C55E", bg:"#052814", border:"#16502e" },
  Pending:  { color:"#F59E0B", bg:"#1a1105", border:"#5a3d08" },
  Review:   { color:"#60A5FA", bg:"#061728", border:"#1a4166" },
  Reviewed: { color:"#60A5FA", bg:"#061728", border:"#1a4166" },
  Responded:{ color:"#A78BFA", bg:"#130c26", border:"#3b2d6e" },
  Rejected: { color:"#F87171", bg:"#1a0808", border:"#5a2020" },
};

// ── Mock Orders (demo data — shown alongside real DB orders) ─────────────────
const MOCK_ORDERS: MongoOrder[] = [
  {
    _id:"mock-001", orderId:"SKW-2025-001", firebaseUid:"mock-uid", status:"Delivered",
    product:"TMT Steel Bar Fe-500 (12mm) — 3 MT",
    amount:"₹1,26,000", quantity:"3 MT",
    notes:"Delivered to MIDC warehouse, all bars inspected",
    isCustomized:false,
    deliveryAddress:{ street:"Plot 12, MIDC", city:"Nagpur", state:"Maharashtra", pincode:"440016" },
    createdAt:"2025-01-20T10:30:00Z",
  },
  {
    _id:"mock-002", orderId:"SKW-2025-002", firebaseUid:"mock-uid", status:"Shipped",
    product:"MS Square Hollow Section Pipe (40×40mm, 3mm)",
    amount:"₹38,500", quantity:"50 pcs",
    notes:"Dispatched via company vehicle, ETA 2 days",
    isCustomized:false,
    deliveryAddress:{ street:"Survey No. 48", city:"Wardha", state:"Maharashtra", pincode:"442001" },
    createdAt:"2025-02-14T09:15:00Z",
  },
  {
    _id:"mock-003", orderId:"SKW-2025-003", firebaseUid:"mock-uid", status:"Processing",
    product:"Custom SS 304 Staircase Railing — 18 RMT",
    amount:"₹54,000", quantity:"18 RMT",
    notes:"Design approved. Fabrication in progress at workshop.",
    isCustomized:true,
    deliveryAddress:{ street:"Dharampeth Extension", city:"Nagpur", state:"Maharashtra", pincode:"440010" },
    createdAt:"2025-03-05T11:00:00Z",
  },
  {
    _id:"mock-004", orderId:"SKW-2025-004", firebaseUid:"mock-uid", status:"Pending",
    product:"MS Angle Iron 50×50×6mm — 2 MT",
    amount:"₹82,000", quantity:"2 MT",
    notes:"Awaiting payment confirmation",
    isCustomized:false,
    deliveryAddress:{ street:"Hingna Road", city:"Nagpur", state:"Maharashtra", pincode:"440019" },
    createdAt:"2025-04-01T08:00:00Z",
  },
  {
    _id:"mock-005", orderId:"SKW-2024-089", firebaseUid:"mock-uid", status:"Delivered",
    product:"Pre-fab Industrial Shed Purlin Set (C-150)",
    amount:"₹2,35,000", quantity:"1 set",
    notes:"Complete purlin set with bolts. Site installation included.",
    isCustomized:true,
    deliveryAddress:{ street:"Butibori MIDC", city:"Nagpur", state:"Maharashtra", pincode:"441108" },
    createdAt:"2024-11-28T14:00:00Z",
  },
];

// ── Mock profile (shown when backend is offline) ──────────────────────────────
const MOCK_PROFILE = {
  name:"Rajesh Sharma", email:"rajesh@abcconstructions.com", phone:"+91 98765 43210",
  company:"ABC Constructions Pvt. Ltd.",
  address:{ street:"Plot 12, MIDC Industrial Area", city:"Nagpur", state:"Maharashtra", pincode:"440016" },
  photoURL:"",
};

// ── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
  @keyframes barFill  { from{width:0} to{width:var(--w)} }
  @keyframes pulse2   { 0%,100%{opacity:1} 50%{opacity:.5} }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  .ud {
    font-family:'Inter',system-ui,sans-serif;
    min-height:100vh;
    background:#080C14;
    color:#CBD5E1;
    padding-top:72px;
    font-size:14px;
    line-height:1.6;
  }

  /* ─ Layout ─ */
  .ud-wrap {
    display:grid;
    grid-template-columns:232px 1fr;
    max-width:1300px;
    margin:0 auto;
    padding:32px 20px 64px;
    gap:24px;
    align-items:start;
  }

  /* ─ Sidebar ─ */
  .ud-side { display:flex; flex-direction:column; gap:6px; position:sticky; top:90px; }

  .ud-side-profile {
    padding:20px 16px 16px;
    margin-bottom:8px;
  }
  .ud-avatar-wrap {
    width:52px; height:52px; border-radius:14px;
    background:linear-gradient(135deg,#1e3a5f,#2563eb22);
    border:1px solid #1e3a5f;
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:18px; color:#60A5FA;
    overflow:hidden; margin-bottom:10px;
  }
  .ud-avatar-wrap img { width:100%; height:100%; object-fit:cover; }
  .ud-side-name  { font-weight:600; font-size:14px; color:#F1F5F9; margin-bottom:2px; }
  .ud-side-email { font-size:11px; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ud-side-chip  {
    display:inline-flex; align-items:center; gap:5px; margin-top:8px;
    background:#0D1B2E; border:1px solid #1e3a5f;
    color:#60A5FA; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:500;
  }

  .ud-nav-sep { height:1px; background:#131B2E; margin:4px 0 8px; }
  .ud-nav-label {
    font-size:10px; font-weight:600; color:#334155; letter-spacing:.08em;
    text-transform:uppercase; padding:0 12px; margin-bottom:4px;
  }

  .ud-nav-btn {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:8px;
    background:transparent; border:none;
    color:#64748B; font-size:13.5px; font-weight:500;
    cursor:pointer; text-align:left; width:100%;
    transition:background .15s, color .15s;
    font-family:'Inter',sans-serif;
    position:relative;
  }
  .ud-nav-btn:hover { background:#0D1420; color:#94A3B8; }
  .ud-nav-btn.on {
    background:#0D1B2E; color:#60A5FA;
    border-left: 2px solid #2563EB;
    padding-left:10px;
  }
  .ud-nav-icon {
    width:30px; height:30px; border-radius:7px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .ud-nav-btn.on .ud-nav-icon { background:#1e3a5f22; }
  .ud-nav-badge {
    margin-left:auto; background:#1e3050; color:#60A5FA;
    border-radius:5px; padding:1px 7px; font-size:10px; font-weight:600;
    border:1px solid #1e3a5f;
  }

  .ud-quick-link {
    display:flex; align-items:center; gap:9px;
    padding:8px 12px; border-radius:8px; color:#475569;
    text-decoration:none; font-size:13px; font-weight:500;
    transition:background .15s, color .15s;
  }
  .ud-quick-link:hover { background:#0D1420; color:#94A3B8; }

  .ud-logout-btn {
    display:flex; align-items:center; gap:9px; padding:9px 12px;
    border-radius:8px; color:#EF4444; font-size:13px; font-weight:500;
    background:transparent; border:none; cursor:pointer; width:100%; text-align:left;
    transition:background .15s; font-family:'Inter',sans-serif; margin-top:4px;
  }
  .ud-logout-btn:hover { background:#1a0a0a; }

  /* ─ Main ─ */
  .ud-main { display:flex; flex-direction:column; gap:20px; min-width:0; }

  /* Page heading */
  .ud-ph { animation:fadeUp .35s ease both; }
  .ud-ph-title { font-size:22px; font-weight:700; color:#F1F5F9; margin-bottom:3px; letter-spacing:-.3px; }
  .ud-ph-sub   { font-size:13px; color:#475569; }

  /* Card */
  .ud-card {
    background:#0C1221;
    border:1px solid #131E35;
    border-radius:14px;
    padding:22px;
    animation:fadeUp .35s ease both;
  }
  .ud-card-title {
    font-size:13px; font-weight:600; color:#94A3B8;
    text-transform:uppercase; letter-spacing:.06em;
    margin-bottom:18px; display:flex; align-items:center; gap:8px;
  }
  .ud-card-title-action {
    margin-left:auto; font-size:12px; font-weight:600; color:#3B82F6;
    background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif;
    text-transform:none; letter-spacing:0; transition:color .15s;
  }
  .ud-card-title-action:hover { color:#60A5FA; }

  /* ─ Stat cards ─ */
  .ud-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; animation:fadeUp .3s ease both; }
  .ud-stat {
    background:#0C1221; border:1px solid #131E35; border-radius:14px;
    padding:20px; transition:border-color .2s, transform .2s; cursor:default;
  }
  .ud-stat:hover { border-color:#1e3a5f; transform:translateY(-2px); }
  .ud-stat-icon {
    width:38px; height:38px; border-radius:10px;
    display:flex; align-items:center; justify-content:center; margin-bottom:14px;
  }
  .ud-stat-val   { font-size:26px; font-weight:700; color:#F1F5F9; letter-spacing:-.5px; line-height:1; }
  .ud-stat-label { font-size:12px; color:#475569; margin-top:4px; }

  /* ─ Activity list ─ */
  .ud-activity { display:flex; flex-direction:column; }
  .ud-act-row {
    display:flex; align-items:flex-start; gap:12px; padding:13px 0;
    border-bottom:1px solid #0F1729;
  }
  .ud-act-row:last-child { border-bottom:none; }
  .ud-act-dot {
    width:34px; height:34px; border-radius:9px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
  }
  .ud-act-body { flex:1; min-width:0; }
  .ud-act-title { font-size:13.5px; font-weight:500; color:#CBD5E1; margin-bottom:2px; }
  .ud-act-time  { font-size:11.5px; color:#475569; }

  /* ─ Banner / CTA ─ */
  .ud-banner {
    background:linear-gradient(135deg,#0D1B2E,#0a1525);
    border:1px solid #1e3a5f; border-radius:14px;
    padding:20px 22px;
    display:flex; align-items:center; gap:16px;
    animation:fadeUp .35s ease both;
  }
  .ud-banner-icon { font-size:28px; flex-shrink:0; }
  .ud-banner-text { flex:1; }
  .ud-banner-title { font-size:15px; font-weight:600; color:#F1F5F9; margin-bottom:3px; }
  .ud-banner-desc  { font-size:12.5px; color:#4B6080; }
  .ud-banner-btn {
    background:#2563EB; color:#fff; border:none;
    padding:9px 20px; border-radius:8px; font-size:13px; font-weight:600;
    cursor:pointer; white-space:nowrap; text-decoration:none;
    display:inline-block; transition:background .15s; font-family:'Inter',sans-serif;
  }
  .ud-banner-btn:hover { background:#1D4ED8; }

  /* ─ Order list ─ */
  .ud-ord-list { display:flex; flex-direction:column; gap:10px; }
  .ud-ord {
    background:#080D18; border:1px solid #131E35; border-radius:12px;
    overflow:hidden; transition:border-color .2s;
  }
  .ud-ord:hover { border-color:#1e3a5f; }
  .ud-ord-hd {
    display:flex; align-items:center; gap:12px;
    padding:14px 16px; cursor:pointer;
  }
  .ud-ord-ico {
    width:44px; height:44px; border-radius:10px;
    background:#0D1421; border:1px solid #131E35;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .ud-ord-info { flex:1; min-width:0; }
  .ud-ord-name { font-size:13.5px; font-weight:600; color:#E2E8F0; margin-bottom:3px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ud-ord-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .ud-ord-id   { font-size:11px; color:#334155; font-family:monospace; }
  .ud-ord-amt  { font-size:12px; font-weight:600; color:#60A5FA; }
  .ud-ord-date { font-size:11px; color:#334155; }
  .ud-status-pill {
    font-size:10.5px; font-weight:600; padding:3px 10px; border-radius:6px; border:1px solid; flex-shrink:0;
  }
  .ud-chevron { color:#2D3F55; font-size:18px; transition:transform .25s; flex-shrink:0; }
  .ud-chevron.open { transform:rotate(90deg); }

  /* Order expanded */
  .ud-ord-body { padding:0 16px 18px; border-top:1px solid #0F1729; }
  .ud-tracker { padding-top:18px; }
  .ud-tracker-lbl { font-size:11px; font-weight:600; color:#334155; text-transform:uppercase; letter-spacing:.07em; margin-bottom:14px; }
  .ud-stages { display:flex; overflow-x:auto; padding-bottom:4px; }
  .ud-stage  { display:flex; flex-direction:column; align-items:center; flex:1; min-width:80px; position:relative; }
  .ud-stage:not(:last-child)::after {
    content:''; position:absolute; top:14px; left:50%; width:100%; height:2px;
    background:#131E35; z-index:0;
  }
  .ud-stage.done:not(:last-child)::after { background:#1D4ED8; }
  .ud-stage-dot {
    width:28px; height:28px; border-radius:50%; z-index:1; position:relative;
    border:2px solid #131E35; background:#080D18;
    display:flex; align-items:center; justify-content:center;
    transition:all .3s;
  }
  .ud-stage.done .ud-stage-dot  { background:#2563EB; border-color:#2563EB; }
  .ud-stage.cur  .ud-stage-dot  { background:#0D1B2E; border-color:#3B82F6; animation:pulse2 1.5s infinite; }
  .ud-stage-lbl { font-size:10px; color:#334155; margin-top:5px; text-align:center; }
  .ud-stage.done .ud-stage-lbl,
  .ud-stage.cur  .ud-stage-lbl  { color:#60A5FA; }

  .ud-ord-chips { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; }
  .ud-chip { background:#080D18; border:1px solid #0F1729; border-radius:9px; padding:10px 12px; }
  .ud-chip-lbl { font-size:10px; color:#334155; text-transform:uppercase; letter-spacing:.05em; margin-bottom:3px; }
  .ud-chip-val { font-size:13px; color:#CBD5E1; font-weight:500; }

  /* ─ Quotations ─ */
  .ud-quotes { display:flex; flex-direction:column; gap:8px; }
  .ud-quote-row {
    background:#080D18; border:1px solid #131E35; border-radius:11px;
    padding:14px 16px; display:flex; align-items:center; gap:13px;
    transition:border-color .2s;
  }
  .ud-quote-row:hover { border-color:#1e3a5f; }
  .ud-quote-ico { width:40px; height:40px; border-radius:10px; background:#0D1421;
    border:1px solid #131E35; display:flex; align-items:center; justify-content:center;
    font-size:18px; flex-shrink:0; }
  .ud-quote-info { flex:1; min-width:0; }
  .ud-quote-name { font-size:13.5px; font-weight:500; color:#E2E8F0; margin-bottom:3px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ud-quote-meta { font-size:11.5px; color:#334155; }
  .ud-quote-right { text-align:right; flex-shrink:0; }
  .ud-quote-amt  { font-size:13.5px; font-weight:600; color:#F1F5F9; margin-bottom:6px; }

  /* ─ Profile ─ */
  .ud-prof-grid { display:grid; grid-template-columns:280px 1fr; gap:18px; }
  .ud-prof-left {
    background:#0C1221; border:1px solid #131E35; border-radius:14px; padding:24px;
    display:flex; flex-direction:column; align-items:center; text-align:center;
  }
  .ud-prof-avatar {
    width:80px; height:80px; border-radius:18px;
    background:linear-gradient(135deg,#1e3a5f,#0d1b2e); border:1px solid #1e3a5f;
    display:flex; align-items:center; justify-content:center;
    font-size:28px; font-weight:700; color:#60A5FA;
    overflow:hidden; margin:0 auto 14px;
  }
  .ud-prof-avatar img { width:100%; height:100%; object-fit:cover; }
  .ud-prof-name  { font-size:17px; font-weight:700; color:#F1F5F9; margin-bottom:4px; }
  .ud-prof-email { font-size:12px; color:#475569; margin-bottom:12px; }

  .ud-field-list { display:flex; flex-direction:column; gap:8px; margin-top:16px; width:100%; text-align:left; }
  .ud-field {
    background:#080D18; border:1px solid #0F1729; border-radius:9px;
    padding:10px 12px; display:flex; align-items:center; gap:10px;
  }
  .ud-field-lbl { font-size:10px; color:#334155; text-transform:uppercase; letter-spacing:.05em; margin-bottom:2px; }
  .ud-field-val { font-size:13px; color:#CBD5E1; font-weight:500; }

  .ud-prof-right {
    background:#0C1221; border:1px solid #131E35; border-radius:14px; padding:24px;
  }
  .ud-prof-right-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .ud-prof-right-title { font-size:15px; font-weight:600; color:#F1F5F9; }
  .ud-edit-btn {
    background:#0D1B2E; border:1px solid #1e3a5f; color:#60A5FA;
    padding:6px 14px; border-radius:7px; font-size:12px; font-weight:600;
    cursor:pointer; font-family:'Inter',sans-serif; transition:background .15s;
  }
  .ud-edit-btn:hover { background:#1e3050; }

  .ud-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .ud-form-field { display:flex; flex-direction:column; gap:5px; }
  .ud-form-field.full { grid-column:1/-1; }
  .ud-form-label { font-size:11px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.05em; }
  .ud-form-input {
    background:#080D18; border:1px solid #131E35; border-radius:8px;
    padding:9px 12px; color:#F1F5F9; font-size:13.5px;
    font-family:'Inter',sans-serif; outline:none; transition:border-color .2s;
  }
  .ud-form-input:focus { border-color:#2563EB; }
  .ud-form-actions { display:flex; gap:10px; margin-top:4px; grid-column:1/-1; }
  .ud-btn-primary {
    background:#2563EB; color:#fff; border:none;
    padding:9px 22px; border-radius:8px; font-size:13px; font-weight:600;
    cursor:pointer; transition:background .15s; font-family:'Inter',sans-serif;
  }
  .ud-btn-primary:hover { background:#1D4ED8; }
  .ud-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .ud-btn-ghost {
    background:#0D1421; border:1px solid #131E35; color:#475569;
    padding:9px 18px; border-radius:8px; font-size:13px; cursor:pointer;
    font-family:'Inter',sans-serif; transition:background .15s;
  }
  .ud-btn-ghost:hover { background:#131E35; }

  /* ─ Settings ─ */
  .ud-set-section { margin-bottom:22px; }
  .ud-set-label { font-size:11px; font-weight:600; color:#334155; text-transform:uppercase; letter-spacing:.07em; margin-bottom:10px; }
  .ud-set-row {
    display:flex; align-items:center; gap:13px; padding:14px 16px;
    background:#080D18; border:1px solid #131E35; border-radius:11px;
    margin-bottom:7px; transition:border-color .2s;
  }
  .ud-set-row:hover { border-color:#1e3a5f; }
  .ud-set-icon { width:36px; height:36px; border-radius:9px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; }
  .ud-set-info { flex:1; }
  .ud-set-title { font-size:13.5px; font-weight:500; color:#E2E8F0; margin-bottom:1px; }
  .ud-set-desc  { font-size:12px; color:#475569; }
  .ud-toggle {
    width:40px; height:22px; border-radius:999px; cursor:pointer; border:none;
    position:relative; transition:background .2s; flex-shrink:0;
  }
  .ud-toggle.on  { background:#2563EB; }
  .ud-toggle.off { background:#1a2438; }
  .ud-toggle-thumb { position:absolute; top:2px; width:18px; height:18px; border-radius:50%;
    background:#fff; transition:left .2s; }
  .ud-toggle.on  .ud-toggle-thumb { left:20px; }
  .ud-toggle.off .ud-toggle-thumb { left:2px;  }

  .ud-danger {
    background:#0D0A0A; border:1px solid #2D1515; border-radius:12px; padding:18px;
  }
  .ud-danger-title { font-size:14px; font-weight:600; color:#EF4444; margin-bottom:5px; }
  .ud-danger-desc  { font-size:13px; color:#475569; margin-bottom:14px; }
  .ud-btn-danger {
    background:#1A0808; border:1px solid #3D1515; color:#EF4444;
    padding:9px 20px; border-radius:8px; font-size:13px; font-weight:600;
    cursor:pointer; transition:background .15s; font-family:'Inter',sans-serif;
  }
  .ud-btn-danger:hover { background:#2A1010; }

  /* ─ Empty state ─ */
  .ud-empty { text-align:center; padding:40px 20px; }
  .ud-empty-title { font-size:15px; font-weight:600; color:#334155; margin-bottom:6px; }
  .ud-empty-sub   { font-size:13px; color:#2D3F55; margin-bottom:18px; }
  .ud-empty-link  {
    display:inline-block; background:#0D1B2E; border:1px solid #1e3a5f;
    color:#60A5FA; padding:8px 18px; border-radius:8px; font-size:13px;
    font-weight:600; text-decoration:none; transition:background .15s;
  }
  .ud-empty-link:hover { background:#1e3050; }

  /* ─ Toast ─ */
  .ud-toast {
    position:fixed; top:84px; right:20px; z-index:9999;
    padding:12px 18px; border-radius:10px; font-size:13px; font-weight:600;
    border:1px solid; backdrop-filter:blur(16px);
    display:flex; align-items:center; gap:8px;
    animation:slideIn .25s ease;
  }

  /* ─ Loader ─ */
  .ud-loader { display:flex; align-items:center; justify-content:center;
    min-height:80vh; flex-direction:column; gap:12px; }
  .ud-spin { width:36px; height:36px; border:2px solid #131E35;
    border-top:2px solid #2563EB; border-radius:50%; animation:spin .7s linear infinite; }

  /* ─ Scrollbar ─ */
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#1e2d45; border-radius:999px; }

  /* ─ Responsive ─ */
  @media(max-width:920px) {
    .ud-wrap { grid-template-columns:1fr; }
    .ud-stats { grid-template-columns:1fr 1fr; }
    .ud-prof-grid { grid-template-columns:1fr; }
    .ud-side { position:static; }
  }
  @media(max-width:560px) {
    .ud-stats { grid-template-columns:1fr; }
    .ud-form-grid { grid-template-columns:1fr; }
    .ud-ord-chips { grid-template-columns:1fr; }
  }
`;

// ── OrderItem ─────────────────────────────────────────────────────────────────
function OrderItem({ order, expanded, onToggle }: { order:MongoOrder; expanded:boolean; onToggle:()=>void }) {
  const st = S[order.status] ?? S.Pending;
  const si = STAGE_IDX[order.status] ?? 0;
  return (
    <div className="ud-ord">
      <div className="ud-ord-hd" onClick={onToggle}>
        <div className="ud-ord-ico">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <div className="ud-ord-info">
          <div className="ud-ord-name">{order.product}</div>
          <div className="ud-ord-meta">
            <span className="ud-ord-id">{order.orderId}</span>
            <span className="ud-ord-amt">{order.amount}</span>
            <span className="ud-ord-date">{new Date(order.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"})}</span>
          </div>
        </div>
        <span className="ud-status-pill" style={{color:st.color,background:st.bg,borderColor:st.border}}>{st.label}</span>
        <svg className={`ud-chevron ${expanded?"open":""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      {expanded && order.status !== "Cancelled" && (
        <div className="ud-ord-body">
          <div className="ud-tracker">
            <div className="ud-tracker-lbl">Delivery Progress</div>
            <div className="ud-stages">
              {STAGES.map((s,i) => {
                const cls = i < si ? "done" : i === si ? "cur" : "";
                return (
                  <div key={s.label} className={`ud-stage ${cls}`}>
                    <div className="ud-stage-dot">
                      {i <= si && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={i < si ? "#fff" : "#3B82F6"} strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div className="ud-stage-lbl">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="ud-ord-chips">
            {[
              ["Quantity", order.quantity||"—"],
              ["Delivery", order.deliveryAddress ? `${order.deliveryAddress.city}, ${order.deliveryAddress.state}` : "—"],
              ["Ordered",  new Date(order.createdAt).toLocaleDateString("en-IN")],
              ["Notes",    order.notes||"None"],
            ].map(([l,v]) => (
              <div key={l} className="ud-chip">
                <div className="ud-chip-lbl">{l}</div>
                <div className="ud-chip-val">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab,   setTab]   = useState<Tab>("overview");
  const [mu,    setMU]    = useState<MongoUser|null>(null);
  const [ords,  setOrds]  = useState<MongoOrder[]>([]);
  const [inquiries, setInquiries] = useState<MongoInquiry[]>([]);
  const [projects, setProjects] = useState<MongoProject[]>([]);
  const [load,  setLoad]  = useState(true);
  const [exp,   setExp]   = useState<string|null>(null);
  const [toast, setToast] = useState("");
  const [edit,  setEdit]  = useState(false);
  const [save,  setSave]  = useState(false);
  const [sett,  setSett]  = useState({ emailNotify:true, smsNotify:false, orderUpdates:true, newsletter:false });
  const [form,  setForm]  = useState<EditForm>({name:"",phone:"",company:"",street:"",city:"",state:"",pincode:""});

  useEffect(() => {
    const h = location.hash.replace("#","") as Tab;
    if(["overview","orders","quotations","profile","settings"].includes(h)) setTab(h);
  },[location.hash]);

  useEffect(() => {
    if(!user?.uid) return;
    setLoad(true);
    getUser(user.uid).then(u => {
      setMU(u);
      setForm({name:u.name, phone:u.phone, company:u.company,
        street:u.address?.street||"", city:u.address?.city||"",
        state:u.address?.state||"", pincode:u.address?.pincode||""});
    }).catch(()=>{
      // Backend offline — pre-fill form with mock profile so UX is not broken
      setForm({
        name:MOCK_PROFILE.name, phone:MOCK_PROFILE.phone, company:MOCK_PROFILE.company,
        street:MOCK_PROFILE.address.street, city:MOCK_PROFILE.address.city,
        state:MOCK_PROFILE.address.state, pincode:MOCK_PROFILE.address.pincode,
      });
    }).finally(()=>setLoad(false));
    getUserOrders(user.uid).then(setOrds).catch(()=>{});
    getUserInquiries(user.uid).then(setInquiries).catch(()=>{});
    if (user.email) {
      getUserProjectsByEmail(user.email).then(setProjects).catch(()=>{});
    }
  },[user?.uid]);

  const toast$ = (m:string)=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  const goTab  = (t:Tab)   =>{setTab(t);navigate(`/dashboard#${t}`,{replace:true});};
  const logout = async ()  =>{await logOut();navigate("/");};

  const saveProfile = async ()=>{
    if(!user?.uid) return; setSave(true);
    try {
      const u = await updateUser(user.uid,{name:form.name,phone:form.phone,company:form.company,
        address:{street:form.street,city:form.city,state:form.state,pincode:form.pincode}});
      setMU(u); setEdit(false); toast$("✅ Profile saved");
    } catch { toast$("❌ Save failed"); } finally { setSave(false); }
  };

  // Merge real DB orders with mock demo orders (deduplicate by _id)
  const allOrds = [
    ...ords,
    ...MOCK_ORDERS.filter(m => !ords.find(o => o.orderId === m.orderId)),
  ];

  // Use real profile if loaded, otherwise show mock
  const displayMu = mu ?? (MOCK_PROFILE as unknown as MongoUser);

  const name  = displayMu?.name     ?? profile?.name    ?? user?.displayName ?? "User";
  const email = displayMu?.email    ?? user?.email       ?? "";
  const photo = displayMu?.photoURL ?? user?.photoURL    ?? "";
  const inits = name.split(" ").map((n:string)=>n[0]).join("").toUpperCase().slice(0,2);
  const deld  = allOrds.filter(o=>o.status==="Delivered").length;
  const actv  = allOrds.filter(o=>["Processing","Shipped","Pending"].includes(o.status)).length;

  const TABS = [
    {id:"overview"   as Tab, label:"Overview",     icon:"▣"},
    {id:"orders"     as Tab, label:"Orders",       icon:"⊞", badge:allOrds.length},
    {id:"projects"   as Tab, label:"Projects",     icon:"🏗", badge:projects.length},
    {id:"quotations" as Tab, label:"Quotations",   icon:"☰", badge:inquiries.length},
    {id:"profile"    as Tab, label:"Profile",      icon:"◯"},
    {id:"settings"   as Tab, label:"Settings",     icon:"◎"},
  ];

  const HDR:{[K in Tab]:{title:string;sub:string}} = {
    overview:  {title:`Good to see you, ${name.split(" ")[0]}`,  sub:"Here's everything about your account at a glance"},
    orders:    {title:"Your Orders",      sub:"Real-time order status and delivery tracking"},
    projects:  {title:"My Projects",      sub:"Track your ongoing steel projects and locations"},
    quotations:{title:"Quotation Requests", sub:"Track submitted quotes and their approvals"},
    profile:   {title:"My Profile",      sub:"Update your personal and delivery information"},
    settings:  {title:"Settings",        sub:"Manage notifications, preferences and security"},
  };

  if(load) return <><style>{CSS}</style><div className="ud"><div className="ud-loader"><div className="ud-spin"/><p style={{color:"#334155",fontSize:"13px"}}>Loading…</p></div></div></>;

  return (
    <>
      <style>{CSS}</style>
      <div className="ud">
        {toast && (
          <div className="ud-toast" style={{
            background: toast.startsWith("✅") ? "#04120A" : "#120404",
            borderColor: toast.startsWith("✅") ? "#16502e" : "#501616",
            color: toast.startsWith("✅") ? "#22C55E" : "#EF4444",
          }}>{toast}</div>
        )}

        <div className="ud-wrap">
          {/* ── SIDEBAR ── */}
          <aside className="ud-side">
            <div className="ud-side-profile">
              <div className="ud-avatar-wrap">
                {photo ? <img src={photo} alt={name}/> : inits}
              </div>
              <div className="ud-side-name">{name}</div>
              <div className="ud-side-email">{email}</div>
              <div className="ud-side-chip">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#60A5FA"><circle cx="12" cy="12" r="10"/></svg>
                Customer
              </div>
            </div>

            <div className="ud-nav-sep"/>
            <div className="ud-nav-label">Dashboard</div>

            {TABS.map(t=>(
              <button key={t.id} className={`ud-nav-btn ${tab===t.id?"on":""}`} onClick={()=>goTab(t.id)}>
                <div className="ud-nav-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {t.id==="overview"   && <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}
                    {t.id==="orders"     && <><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></>}
                    {t.id==="projects"   && <><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 7h6M9 11h6M9 15h6"/></>}
                    {t.id==="quotations" && <><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></>}
                    {t.id==="profile"    && <><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></>}
                    {t.id==="settings"   && <><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0..."/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </div>
                {t.label}
                {t.badge ? <span className="ud-nav-badge">{t.badge}</span> : null}
              </button>
            ))}

            <div className="ud-nav-sep"/>
            <div className="ud-nav-label">Quick</div>
            {[
              {label:"Browse Products", to:"/products"},
              {label:"Request Quote",   to:"/contact"},
              {label:"Contact Support", to:"/contact"},
            ].map(a=>(
              <Link key={a.label} to={a.to} className="ud-quick-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17l9.2-9.2M17 17V7H7"/>
                </svg>
                {a.label}
              </Link>
            ))}

            <div className="ud-nav-sep"/>
            <button className="ud-logout-btn" onClick={logout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sign Out
            </button>
          </aside>

          {/* ── MAIN ── */}
          <main className="ud-main">
            <div className="ud-ph">
              <h1 className="ud-ph-title">{HDR[tab].title}</h1>
              <p className="ud-ph-sub">{HDR[tab].sub}</p>
            </div>

            {/* OVERVIEW */}
            {tab==="overview" && (
              <>
                <div className="ud-stats">
                  {[
                    {label:"Total Orders", val:allOrds.length, color:"#3B82F6", bg:"#0D1B2E"},
                    {label:"Delivered",    val:deld,        color:"#22C55E", bg:"#05140D"},
                    {label:"Active",       val:actv,        color:"#F59E0B", bg:"#1A1005"},
                  ].map(s=>(
                    <div className="ud-stat" key={s.label}>
                      <div className="ud-stat-icon" style={{background:s.bg+66}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="ud-stat-val" style={{color:s.color}}>{s.val}</div>
                      <div className="ud-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="ud-banner">
                  <div className="ud-banner-icon">📋</div>
                  <div className="ud-banner-text">
                    <div className="ud-banner-title">Need custom steel pricing?</div>
                    <div className="ud-banner-desc">Submit a quotation request and receive a detailed proposal within 24 hrs.</div>
                  </div>
                  <Link to="/contact" className="ud-banner-btn">Request Quote</Link>
                </div>

                <div className="ud-card">
                  <div className="ud-card-title">
                    Recent Orders
                    <button className="ud-card-title-action" onClick={()=>goTab("orders")}>View all →</button>
                  </div>
                  {ords.length===0
                    ? <div className="ud-empty">
                        <div className="ud-empty-title">No orders yet</div>
                        <div className="ud-empty-sub">Browse our catalog and submit your first quotation.</div>
                        <Link to="/products" className="ud-empty-link">Browse Products</Link>
                      </div>
                  : <div className="ud-ord-list">{allOrds.slice(0,3).map(o=>(
                      <OrderItem key={o._id} order={o} expanded={exp===o._id} onToggle={()=>setExp(exp===o._id?null:o._id)}/>
                    ))}</div>
                  }
                </div>

                <div className="ud-card">
                  <div className="ud-card-title">Recent Activity</div>
                  <div className="ud-activity">
                    {[
                      {icon:"🔩",title:"Browsed TMT Steel Bar Fe-500 products",    time:"Today, 9:40 AM",    bg:"#0D1B2E"},
                      {icon:"📋",title:"Submitted quotation — SS Balcony Railing",  time:"Yesterday, 3:10 PM",bg:"#0D1421"},
                      {icon:"✅",title:"Order SKW-2025-001 delivered",              time:"20 Jan 2025",       bg:"#05140D"},
                      {icon:"✏",title:"Updated delivery address",                  time:"14 Jan 2025",       bg:"#0D1421"},
                    ].map((a,i)=>(
                      <div key={i} className="ud-act-row">
                        <div className="ud-act-dot" style={{background:a.bg}}>{a.icon}</div>
                        <div className="ud-act-body">
                          <div className="ud-act-title">{a.title}</div>
                          <div className="ud-act-time">{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ORDERS */}
            {tab==="orders" && (
              <div className="ud-card">
                <div className="ud-card-title">All Orders ({allOrds.length})</div>
                <div className="ud-ord-list">{allOrds.map(o=>(
                    <OrderItem key={o._id} order={o} expanded={exp===o._id} onToggle={()=>setExp(exp===o._id?null:o._id)}/>
                  ))}</div>
              </div>
            )}

            {/* PROJECTS */}
            {tab==="projects" && (
              <div className="ud-card">
                <div className="ud-card-title">My Assigned Projects ({projects.length})</div>
                {projects.length === 0 ? (
                  <div className="ud-empty">
                    <div className="ud-empty-title">No projects assigned</div>
                    <div className="ud-empty-sub">Admins will assign projects to you via your email address.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {projects.map(p => (
                      <div key={p._id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "bold", color: "#fff", marginBottom: "4px" }}>{p.title}</div>
                            <div style={{ fontSize: "13px", color: "#888" }}>
                              {p.location}, {p.district}
                            </div>
                            <div style={{ fontSize: "12px", color: "#60A5FA", marginTop: "8px" }}>
                              Assigned to: {p.client}
                            </div>
                          </div>
                          <span className="ud-status-pill" style={{ background: "rgba(96,165,250,.1)", color: "#60A5FA", border: "1px solid rgba(96,165,250,.3)" }}>
                            {p.status}
                          </span>
                        </div>
                        {p.latitude && p.longitude && (
                          <div style={{ marginTop: "16px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
                            <iframe 
                              width="100%" 
                              height="250" 
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude-0.02},${p.latitude-0.02},${p.longitude+0.02},${p.latitude+0.02}&layer=mapnik&marker=${p.latitude},${p.longitude}`} 
                              style={{ border: 0, display: "block" }} 
                            />
                            <div style={{ background: "rgba(0,0,0,.5)", padding: "8px 12px", fontSize: "11px", color: "#888" }}>
                              Interactive Site Location Map
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* QUOTATIONS */}
            {tab==="quotations" && (
              <>
                <div className="ud-banner">
                  <div className="ud-banner-icon">💬</div>
                  <div className="ud-banner-text">
                    <div className="ud-banner-title">Submit a new quotation</div>
                    <div className="ud-banner-desc">Describe your requirements and our team will respond within 24 hours.</div>
                  </div>
                  <Link to="/contact" className="ud-banner-btn">New Request</Link>
                </div>
                <div className="ud-card">
                  <div className="ud-card-title">All Quotations ({inquiries.length})</div>
                  {inquiries.length === 0 ? (
                    <div className="ud-empty">
                      <div className="ud-empty-title">No quotations yet</div>
                      <div className="ud-empty-sub">Submit an inquiry to receive custom quotes.</div>
                      <Link to="/contact" className="ud-empty-link">Request Quote</Link>
                    </div>
                  ) : (
                    <div className="ud-quotes">
                      {inquiries.map(q=>{
                        const qs=QS[q.status]??QS.Pending;
                        const title = q.type === "customization" 
                          ? `Customization: ${q.productDetails?.productName || "Product"}`
                          : (q.projectType ? `Project: ${q.projectType}` : "Inquiry");
                        return (
                          <div key={q._id} className="ud-quote-row">
                            <div className="ud-quote-ico">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                            </div>
                            <div className="ud-quote-info">
                              <div className="ud-quote-name">{title}</div>
                              <div className="ud-quote-meta">
                                SKW-{q._id.slice(-6).toUpperCase()} · {q.quantity || "—"} · {new Date(q.createdAt).toLocaleDateString("en-IN")}
                              </div>
                            </div>
                            <div className="ud-quote-right">
                              <div className="ud-quote-amt">{q.adminResponse ? "Responded" : "Awaiting Quote"}</div>
                              <span className="ud-status-pill" style={{color:qs.color,background:qs.bg,borderColor:qs.border}}>{q.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* PROFILE */}
            {tab==="profile" && (
              <div className="ud-prof-grid">
                <div className="ud-prof-left">
                  <div className="ud-prof-avatar">
                    {photo ? <img src={photo} alt={name}/> : inits}
                  </div>
                  <div className="ud-prof-name">{name}</div>
                  <div className="ud-prof-email">{email}</div>
                  <div className="ud-side-chip" style={{margin:"8px 0 0"}}>✦ Customer</div>
                  <div className="ud-field-list">
                    {[
                      {label:"Phone",   val:displayMu?.phone||"Not set"},
                      {label:"Company", val:displayMu?.company||"Not set"},
                      {label:"City",    val:displayMu?.address?.city||"Not set"},
                      {label:"State",   val:displayMu?.address?.state||"Not set"},
                    ].map(f=>(
                      <div key={f.label} className="ud-field">
                        <div>
                          <div className="ud-field-lbl">{f.label}</div>
                          <div className="ud-field-val">{f.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ud-prof-right">
                  <div className="ud-prof-right-hdr">
                    <div className="ud-prof-right-title">Personal Information</div>
                    {!edit && <button className="ud-edit-btn" onClick={()=>setEdit(true)}>Edit Profile</button>}
                  </div>
                  {edit ? (
                    <div className="ud-form-grid">
                      {[
                        {label:"Full Name",  key:"name",    ph:"Rajesh Sharma",           full:false},
                        {label:"Phone",      key:"phone",   ph:"9876543210",              full:false},
                        {label:"Company",    key:"company", ph:"ABC Constructions",       full:false},
                        {label:"Street",     key:"street",  ph:"Plot 12, MIDC Nagpur",    full:true},
                        {label:"City",       key:"city",    ph:"Nagpur",                  full:false},
                        {label:"State",      key:"state",   ph:"Maharashtra",             full:false},
                        {label:"Pincode",    key:"pincode", ph:"440016",                  full:false},
                      ].map(f=>(
                        <div key={f.key} className={`ud-form-field${f.full?" full":""}`}>
                          <label className="ud-form-label">{f.label}</label>
                          <input className="ud-form-input" placeholder={f.ph}
                            value={(form as Record<string,string>)[f.key]}
                            onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>
                        </div>
                      ))}
                      <div className="ud-form-actions">
                        <button className="ud-btn-primary" onClick={saveProfile} disabled={save}>{save?"Saving…":"Save Changes"}</button>
                        <button className="ud-btn-ghost" onClick={()=>setEdit(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ud-field-list">
                      {[
                        {label:"Full Name",    val:displayMu?.name||"—"},
                        {label:"Phone",        val:displayMu?.phone||"Not set"},
                        {label:"Company",      val:displayMu?.company||"Not set"},
                        {label:"Street",       val:displayMu?.address?.street||"Not set"},
                        {label:"City",         val:displayMu?.address?.city||"Not set"},
                        {label:"State",        val:displayMu?.address?.state||"Not set"},
                        {label:"Pincode",      val:displayMu?.address?.pincode||"Not set"},
                      ].map(f=>(
                        <div key={f.label} className="ud-field">
                          <div>
                            <div className="ud-field-lbl">{f.label}</div>
                            <div className="ud-field-val">{f.val}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {tab==="settings" && (
              <div className="ud-card">
                <div className="ud-card-title">Preferences & Security</div>

                <div className="ud-set-section">
                  <div className="ud-set-label">Notifications</div>
                  {(["emailNotify","smsNotify","orderUpdates","newsletter"] as const).map(k=>{
                    const INFO:{[key:string]:{title:string;desc:string;bg:string}} = {
                      emailNotify:  {title:"Email Notifications",  desc:"Order confirmations and shipping updates",  bg:"#0D1B2E"},
                      smsNotify:    {title:"SMS Alerts",            desc:"Delivery status via text message",          bg:"#05140D"},
                      orderUpdates: {title:"Order Status Updates",  desc:"Real-time status changes",                 bg:"#1A1005"},
                      newsletter:   {title:"Newsletter",            desc:"Products, offers and industry news",        bg:"#130c26"},
                    };
                    const i = INFO[k];
                    return (
                      <div key={k} className="ud-set-row">
                        <div className="ud-set-icon" style={{background:i.bg}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5">
                            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                          </svg>
                        </div>
                        <div className="ud-set-info">
                          <div className="ud-set-title">{i.title}</div>
                          <div className="ud-set-desc">{i.desc}</div>
                        </div>
                        <button className={`ud-toggle ${sett[k]?"on":"off"}`}
                          onClick={()=>setSett(p=>({...p,[k]:!p[k]}))}>
                          <div className="ud-toggle-thumb"/>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="ud-set-section">
                  <div className="ud-set-label">Security</div>
                  <div className="ud-set-row">
                    <div className="ud-set-icon" style={{background:"#1A1005"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </div>
                    <div className="ud-set-info">
                      <div className="ud-set-title">Password</div>
                      <div className="ud-set-desc">Reset via email link</div>
                    </div>
                    <Link to="/login" style={{background:"#0D1421",border:"1px solid #131E35",color:"#60A5FA",
                      padding:"6px 14px",borderRadius:"7px",fontSize:"12px",fontWeight:600,textDecoration:"none"}}>
                      Reset
                    </Link>
                  </div>
                </div>

                <div className="ud-danger">
                  <div className="ud-danger-title">Danger Zone</div>
                  <div className="ud-danger-desc">This will end your current session and clear all local data.</div>
                  <button className="ud-btn-danger" onClick={logout}>Sign Out</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
