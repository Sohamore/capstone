import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroVideo from "../assets/videos/hero-bg.mp4";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  icon: string;
  image: string;
  details: {
    grades: string[];
    sizes: string;
    applications: string[];
    minOrder: string;
    delivery: string;
  };
}

interface Project {
  id: number;
  name: string;
  location: string;
  budget: string;
  progress: number;
  status: "Ongoing" | "Completed";
  workers: number;
  startDate: string;
  targetDate: string;
  contract: string;
  materials: string[];
  images: string[];
  description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "TMT Steel Bars",
    category: "Structural",
    description: "Fe500 & Fe550 grade high-strength bars for seismic zones. Superior bonding with concrete.",
    price: "₹62,000 / MT",
    icon: "▬",
    image: "https://images.unsplash.com/photo-1504611695225-7012bf38cb7a?w=600&q=80",
    details: {
      grades: ["Fe415", "Fe500", "Fe500D", "Fe550", "Fe550D"],
      sizes: "8mm – 40mm diameter",
      applications: ["Residential Buildings", "Bridges", "Dams", "Industrial Structures"],
      minOrder: "5 MT",
      delivery: "3–7 working days",
    },
  },
  {
    id: 2,
    name: "Steel Plates & Sheets",
    category: "Flat Products",
    description: "IS 2062 grade mild steel plates. Custom thickness 3mm–50mm available for industrial use.",
    price: "₹71,000 / MT",
    icon: "◼",
    image: "https://images.unsplash.com/photo-1531496681163-da50b7d8e2cd?w=600&q=80",
    details: {
      grades: ["IS 2062 E250", "IS 2062 E350", "IS 8500"],
      sizes: "3mm – 50mm thickness, up to 3000mm width",
      applications: ["Pressure Vessels", "Shipbuilding", "Heavy Fabrication", "Machine Parts"],
      minOrder: "2 MT",
      delivery: "5–10 working days",
    },
  },
  {
    id: 3,
    name: "Structural Sections",
    category: "Profiles",
    description: "ISA angles, ISMB beams, ISMC channels. Precision-rolled for heavy engineering projects.",
    price: "₹67,500 / MT",
    icon: "◣",
    image: "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=600&q=80",
    details: {
      grades: ["IS 2062 E250", "IS 2062 E350"],
      sizes: "25×25mm – 200×200mm (Angles), 100mm – 600mm (Beams)",
      applications: ["Steel Frames", "Trusses", "Columns", "Industrial Sheds"],
      minOrder: "3 MT",
      delivery: "4–8 working days",
    },
  },
  {
    id: 4,
    name: "Pipes & Hollow Sections",
    category: "Tubular",
    description: "ERW and seamless pipes for fluid transport and structural applications. All sizes in stock.",
    price: "₹78,000 / MT",
    icon: "○",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80",
    details: {
      grades: ["IS 1239", "IS 3589", "API 5L"],
      sizes: "15mm – 600mm NB",
      applications: ["Water Supply", "Oil & Gas", "Structural Columns", "Fencing"],
      minOrder: "2 MT",
      delivery: "5–12 working days",
    },
  },
  {
    id: 5,
    name: "Custom Fabrication",
    category: "Bespoke",
    description: "CAD/CAM precision cutting, bending, welding. Upload your DWG file for instant quotation.",
    price: "Get Quote",
    icon: "⬡",
    image: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=600&q=80",
    details: {
      grades: ["As Per Specification", "IS 2062", "Custom Alloys"],
      sizes: "As per drawing / specification",
      applications: ["Industrial Machinery", "Plant Structures", "Custom Components", "OEM Parts"],
      minOrder: "Project-based",
      delivery: "As per project scope",
    },
  },
  {
    id: 6,
    name: "Ready-Made Components",
    category: "Pre-built",
    description: "Steel gratings, chequered plates, expanded mesh — ready for immediate dispatch.",
    price: "₹54,000 / MT",
    icon: "⊞",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    details: {
      grades: ["IS 2062", "IS 1977"],
      sizes: "Standard sizes available, custom on request",
      applications: ["Flooring", "Walkways", "Safety Barriers", "Ventilation"],
      minOrder: "1 MT",
      delivery: "2–5 working days",
    },
  },
  {
    id: 7,
    name: "Steel Furniture Works",
    category: "Steel Furniture Works",
    description: "Heavy-duty steel chairs, tables, industrial racks & storage solutions. Powder-coated finish available.",
    price: "Get Quote",
    icon: "🪑",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    details: {
      grades: ["IS 2062", "CRCA Sheet"],
      sizes: "Standard & custom dimensions",
      applications: ["Office Spaces", "Warehouses", "Factories", "Retail Showrooms"],
      minOrder: "10 pieces",
      delivery: "7–14 working days",
    },
  },
  {
    id: 8,
    name: "Commercial Building Structures",
    category: "Commercial Building Structures",
    description: "Pre-engineered steel structures, factory sheds, warehouse frames and commercial roofing systems.",
    price: "Get Quote",
    icon: "🏗️",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    details: {
      grades: ["IS 2062 E250", "IS 2062 E350"],
      sizes: "As per project scope",
      applications: ["Warehouses", "Factory Sheds", "Commercial Complexes", "Aircraft Hangars"],
      minOrder: "Project-based",
      delivery: "As per project schedule",
    },
  },
  {
    id: 9,
    name: "SS Railing Systems",
    category: "SS Railing",
    description: "Stainless steel 304/316 grade railings for staircases, balconies, and terraces. Mirror/satin finish.",
    price: "Get Quote",
    icon: "🔩",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    details: {
      grades: ["SS 304", "SS 316", "SS 202"],
      sizes: "38mm – 76mm dia tubes, custom heights",
      applications: ["Staircases", "Balconies", "Swimming Pool Edges", "Commercial Interiors"],
      minOrder: "10 running metres",
      delivery: "5–10 working days",
    },
  },
  {
    id: 10,
    name: "Kitchen Trolleys",
    category: "Kitchen Trolleys",
    description: "SS 304 grade commercial kitchen trolleys, work tables and mobile carts for hotels & restaurants.",
    price: "Get Quote",
    icon: "🛒",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    details: {
      grades: ["SS 304", "SS 316"],
      sizes: "600×400 to 1800×600mm",
      applications: ["Hotel Kitchens", "Restaurants", "Catering Facilities", "Food Courts"],
      minOrder: "5 pieces",
      delivery: "7–12 working days",
    },
  },
  {
    id: 11,
    name: "Hotel Steel Furniture",
    category: "Hotel Furnitures",
    description: "Premium powder-coated steel furniture for hotels — beds, wardrobes, luggage racks & lobby chairs.",
    price: "Get Quote",
    icon: "🏨",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    details: {
      grades: ["IS 2062", "CRCA", "GP Sheet"],
      sizes: "As per design specification",
      applications: ["Hotel Rooms", "Lobbies", "Banquet Halls", "Resorts"],
      minOrder: "20 pieces",
      delivery: "10–21 working days",
    },
  },
  {
    id: 12,
    name: "Food Processing Machines",
    category: "Food Processing Machines",
    description: "FSSAI-compliant SS 316 food-grade processing machines: grinders, conveyor belts, storage tanks.",
    price: "Get Quote",
    icon: "⚙️",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80",
    details: {
      grades: ["SS 316L", "SS 304"],
      sizes: "As per capacity requirements",
      applications: ["Dairy Plants", "Food Processing Units", "Pharma Plants", "Beverage Industry"],
      minOrder: "1 unit",
      delivery: "15–30 working days",
    },
  },
  {
    id: 13,
    name: "Park Instruments & Outdoor Structures",
    category: "Park Instruments",
    description: "Galvanised steel playground equipment, park benches, outdoor gym instruments & shade structures.",
    price: "Get Quote",
    icon: "🌿",
    image: "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=600&q=80",
    details: {
      grades: ["IS 2062", "GI Coated"],
      sizes: "As per IS 15567 playground standards",
      applications: ["Public Parks", "School Playgrounds", "Housing Societies", "Municipal Areas"],
      minOrder: "1 set",
      delivery: "10–20 working days",
    },
  },
];

const PROJECTS: Project[] = [
  {
    id: 1,
    name: "Nagpur Industrial Warehouse Complex",
    location: "Nagpur, Maharashtra",
    budget: "₹4.2 Cr",
    progress: 74,
    status: "Ongoing",
    workers: 128,
    startDate: "Jan 2024",
    targetDate: "Aug 2025",
    contract: "Nagpur Industrial Corp Ltd.",
    materials: ["TMT Fe500D – 180 MT", "Steel Plates IS2062 – 45 MT", "Structural Sections – 90 MT"],
    images: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
      "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80",
      "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&q=80",
    ],
    description: "Large-scale industrial warehouse development with 12 bays, covering 2.4 lakh sq ft. Complete structural steel fabrication and erection by ShriKrishnaSteelWorks.",
  },
  {
    id: 2,
    name: "Pune Metro Rail Station Structure",
    location: "Pune, Maharashtra",
    budget: "₹9.8 Cr",
    progress: 91,
    status: "Ongoing",
    workers: 342,
    startDate: "Mar 2023",
    targetDate: "Dec 2024",
    contract: "Pune Metro Rail Corporation",
    materials: ["ISMB Beams – 320 MT", "TMT Fe550D – 210 MT", "Custom Fabrication – 95 MT"],
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80",
    ],
    description: "Structural steel supply and fabrication for 3 metro stations on the Pune Metro Line 2. Includes canopy structures, platform framing, and station roofing.",
  },
  {
    id: 3,
    name: "Aurangabad Pharma Plant Fabrication",
    location: "Aurangabad, Maharashtra",
    budget: "₹2.1 Cr",
    progress: 100,
    status: "Completed",
    workers: 87,
    startDate: "Sep 2022",
    targetDate: "Apr 2023",
    contract: "Aurangabad BioPharm Pvt. Ltd.",
    materials: ["SS 316L Pipes – 30 MT", "Steel Plates – 22 MT", "Custom SS Components – 18 MT"],
    images: [
      "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800&q=80",
      "https://images.unsplash.com/photo-1565016791693-3b8bd09aa3cd?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    description: "Complete structural and process steel fabrication for a pharmaceutical manufacturing facility. Delivered ahead of schedule with zero quality rejections.",
  },
];

const STATS = [
  { label: "Projects Delivered", value: 200, suffix: "+", icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' },
  { label: "MT Steel Processed", value: 180000, displayValue: "1.8L", suffix: "+", icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/><path d="M20 6a2 2 0 0 0-2-2h-2.5a2 2 0 0 0-1.6.8L8 12.8a2 2 0 0 0-.8 1.6V20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"/><path d="M6 18h.01"/><path d="M10 18h.01"/></svg>' },
  { label: "Years of Experience", value: 18, suffix: "+", icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>' },
  { label: "Happy Clients", value: 400, suffix: "+", icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 2l-4 4m0-4l4 4"/></svg>' },
];

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedStat({ stat, inView }: { stat: typeof STATS[0] & { displayValue?: string }; inView: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const target = stat.value;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, stat.value]);

  const display = stat.displayValue
    ? stat.displayValue
    : count >= 1000
    ? (count / 1000).toFixed(0) + "K"
    : count.toString();

  return (
    <div className="skw-stat-box">
      <div className="skw-stat-icon" dangerouslySetInnerHTML={{ __html: stat.icon }} />
      <div className="skw-stat-number">{inView ? display : "0"}{stat.suffix}</div>
      <div className="skw-stat-label">{stat.label}</div>
      <div className="skw-stat-shimmer" />
    </div>
  );
}

// ─── FAQ State ───────────────────────────────────────────────────────────────
const SLIDER_IMAGES = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80",
  "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=900&q=80",
  "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=900&q=80",
  "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=900&q=80",
];

function ImageSlider() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % SLIDER_IMAGES.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="skw-slider">
      {SLIDER_IMAGES.map((src, i) => (
        <img key={i} src={src} alt="" className={`skw-slide ${i === current ? "skw-slide-active" : ""}`} />
      ))}
      <div className="skw-slider-dots">
        {SLIDER_IMAGES.map((_, i) => (
          <button key={i} className={`skw-dot-btn ${i === current ? "skw-dot-active" : ""}`} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [showCustomize, setShowCustomize] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [form, setForm] = useState({ length: "", thickness: "", grade: "", quantity: "", notes: "" });

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const handleSubmitCustomize = () => setShowLoginPrompt(true);

  return (
    <div className="skw-modal-overlay" onClick={onClose}>
      <div className="skw-modal" onClick={e => e.stopPropagation()}>
        <button className="skw-modal-close" onClick={onClose}>✕</button>

        {!showCustomize ? (
          <>
            <div className="skw-modal-img-wrap">
              <img src={product.image} alt={product.name} className="skw-modal-img" />
              <span className="skw-modal-cat">{product.category}</span>
            </div>
            <div className="skw-modal-body">
              <h2 className="skw-modal-title">{product.name}</h2>
              <p className="skw-modal-desc">{product.description}</p>
              <div className="skw-modal-grid">
                <div className="skw-modal-info">
                  <div className="skw-info-label">Available Grades</div>
                  <div className="skw-info-tags">
                    {product.details.grades.map(g => <span key={g} className="skw-tag">{g}</span>)}
                  </div>
                </div>
                <div className="skw-modal-info">
                  <div className="skw-info-label">Size Range</div>
                  <div className="skw-info-val">{product.details.sizes}</div>
                </div>
                <div className="skw-modal-info">
                  <div className="skw-info-label">Applications</div>
                  <div className="skw-info-tags">
                    {product.details.applications.map(a => <span key={a} className="skw-tag skw-tag-green">{a}</span>)}
                  </div>
                </div>
                <div className="skw-modal-info">
                  <div className="skw-info-label">Min. Order</div>
                  <div className="skw-info-val">{product.details.minOrder}</div>
                </div>
                <div className="skw-modal-info">
                  <div className="skw-info-label">Delivery</div>
                  <div className="skw-info-val">{product.details.delivery}</div>
                </div>
                <div className="skw-modal-info">
                  <div className="skw-info-label">Base Price</div>
                  <div className="skw-info-val skw-price-big">{product.price}</div>
                </div>
              </div>
              <div className="skw-modal-actions">
                <button className="skw-btn-primary" onClick={() => setShowCustomize(true)}>
                  ⚙️ Customize & Order
                </button>
                <Link to="/contact" className="skw-btn-ghost" onClick={onClose}>📋 Get Quotation</Link>
              </div>
            </div>
          </>
        ) : showLoginPrompt ? (
          <div className="skw-login-prompt">
            <div className="skw-login-icon">🔐</div>
            <h3 className="skw-login-title">Login Required</h3>
            <p className="skw-login-sub">Please login or create an account to submit a customization request.</p>
            <div className="skw-login-btns">
              <Link to="/login" className="skw-btn-primary" onClick={onClose}>Login / Sign Up</Link>
              <button className="skw-btn-outline-sm" onClick={() => { setShowLoginPrompt(false); setShowCustomize(false); }}>Browse as Guest</button>
            </div>
          </div>
        ) : (
          <div className="skw-customize-form">
            <button className="skw-back-btn" onClick={() => setShowCustomize(false)}>← Back</button>
            <h3 className="skw-form-title">⚙️ Customize: {product.name}</h3>
            <div className="skw-form-grid">
              <div className="skw-form-group">
                <label>Length (mm)</label>
                <input placeholder="e.g. 6000" value={form.length} onChange={e => setForm({ ...form, length: e.target.value })} className="skw-input" />
              </div>
              <div className="skw-form-group">
                <label>Thickness / Diameter (mm)</label>
                <input placeholder="e.g. 16" value={form.thickness} onChange={e => setForm({ ...form, thickness: e.target.value })} className="skw-input" />
              </div>
              <div className="skw-form-group">
                <label>Grade</label>
                <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="skw-input">
                  <option value="">Select Grade</option>
                  {product.details.grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="skw-form-group">
                <label>Quantity (MT)</label>
                <input placeholder="e.g. 10" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="skw-input" />
              </div>
            </div>
            <div className="skw-form-group skw-full">
              <label>Special Notes / Upload Drawing</label>
              <textarea placeholder="Describe your requirements or mention if you have a DWG file to upload..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="skw-input skw-textarea" />
            </div>
            <button className="skw-btn-primary skw-submit-btn" onClick={handleSubmitCustomize}>
              Submit Customization Request →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Project Detail Modal ─────────────────────────────────────────────────────
function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div className="skw-modal-overlay" onClick={onClose}>
      <div className="skw-modal skw-modal-wide" onClick={e => e.stopPropagation()}>
        <button className="skw-modal-close" onClick={onClose}>✕</button>

        {/* Image gallery */}
        <div className="skw-proj-gallery">
          <img src={project.images[imgIdx]} alt={project.name} className="skw-proj-main-img" />
          <div className="skw-proj-thumbs">
            {project.images.map((img, i) => (
              <img key={i} src={img} alt="" className={`skw-proj-thumb ${i === imgIdx ? "skw-thumb-active" : ""}`} onClick={() => setImgIdx(i)} />
            ))}
          </div>
          <span className={`skw-project-badge ${project.status === "Completed" ? "skw-badge-done" : "skw-badge-active"}`} style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 2 }}>
            {project.status === "Completed" ? "✓ Completed" : "● Ongoing"}
          </span>
        </div>

        <div className="skw-modal-body">
          <h2 className="skw-modal-title">{project.name}</h2>
          <p className="skw-modal-desc">{project.description}</p>
          <div className="skw-modal-grid">
            <div className="skw-modal-info"><div className="skw-info-label">Location</div><div className="skw-info-val">📍 {project.location}</div></div>
            <div className="skw-modal-info"><div className="skw-info-label">Budget</div><div className="skw-info-val skw-price-big">💰 {project.budget}</div></div>
            <div className="skw-modal-info"><div className="skw-info-label">Start Date</div><div className="skw-info-val">📅 {project.startDate}</div></div>
            <div className="skw-modal-info"><div className="skw-info-label">Target Date</div><div className="skw-info-val">🎯 {project.targetDate}</div></div>
            <div className="skw-modal-info"><div className="skw-info-label">Workers Deployed</div><div className="skw-info-val">👷 {project.workers}</div></div>
            <div className="skw-modal-info"><div className="skw-info-label">Contract By</div><div className="skw-info-val">{project.contract}</div></div>
          </div>
          <div className="skw-modal-info skw-full-info">
            <div className="skw-info-label">Materials Required</div>
            <div className="skw-info-tags">
              {project.materials.map(m => <span key={m} className="skw-tag">{m}</span>)}
            </div>
          </div>
          <div className="skw-progress-section" style={{ marginTop: "1.5rem" }}>
            <div className="skw-progress-label"><span>Overall Progress</span><span>{project.progress}%</span></div>
            <div className="skw-progress-track">
              <div className="skw-progress-fill" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────
function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: "Hello! I'm KrishnaBot 🤖 Ask me about products, pricing, or projects!" }]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const FAQS: Record<string, string> = {
    product: "We offer TMT bars, steel plates, pipes, structural sections & custom fabrication. Visit our Products page for details.",
    price: "TMT bars start at ₹62,000/MT. Contact us for bulk B2B pricing.",
    project: "We handle industrial, commercial & residential projects across Maharashtra.",
    delivery: "We offer company-arranged delivery and warehouse pickup.",
    quote: "Request a custom quotation on our Products or Projects page after logging in.",
    contact: "Fill the form on our Contact page. We respond within 24 hours.",
    bis: "Yes, all our steel products are BIS certified.",
    iso: "We are ISO 9001:2015 certified for quality management.",
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const lower = input.toLowerCase();
    let reply = "I'm not sure about that. Please contact our team directly for specific queries.";
    for (const [key, val] of Object.entries(FAQS)) {
      if (lower.includes(key)) { reply = val; break; }
    }
    setMessages(p => [...p, { from: "user", text: input }, { from: "bot", text: reply }]);
    setInput("");
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="skw-chat-fab" aria-label="Chat">
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
      </button>
      {open && (
        <div className="skw-chat-panel">
          <div className="skw-chat-header">
            <div className="skw-chat-avatar">K</div>
            <div><div className="skw-chat-title">KrishnaBot</div><div className="skw-chat-status">● Online</div></div>
          </div>
          <div className="skw-chat-messages">
            {messages.map((m, i) => <div key={i} className={`skw-chat-bubble ${m.from === "user" ? "skw-chat-user" : "skw-chat-bot"}`}>{m.text}</div>)}
            <div ref={messagesEndRef} />
          </div>
          <div className="skw-chat-input-row">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask about products, pricing…" className="skw-chat-input" />
            <button onClick={handleSend} className="skw-chat-send">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const { isAdmin } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: howRef, inView: howInView } = useInView(0.15);
  const videoRef = useRef<HTMLVideoElement>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Process steps animation
  const HOW_STEPS = [
    { step: "01", title: "Browse & Select", desc: "Explore our product catalog and filter by category, grade, and size.", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' },
    { step: "02", title: "Customise & Quote", desc: "Configure dimensions, upload drawings, and receive an instant or quoted price.", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1v6m0 0v6m0-6h6m-6 0H6"/><path d="M3 12h6m6 0h6"/><path d="M12 3v6m0 6v6m0-6h6m-6 0H6"/></svg>' },
    { step: "03", title: "Order & Pay", desc: "Place your order with advance payment or schedule offline settlement.", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
    { step: "04", title: "Track & Receive", desc: "Real-time order tracking from production to delivery at your site.", icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"/><path d="M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2H8V5Z"/><path d="M14 11h-4"/><path d="M18 11h-2"/><path d="M10 15h4"/><path d="M18 15h-2"/></svg>' },
  ];

  return (
    <div className="skw-home">

      {/* ══ HERO with Video Background ══ */}
      <section className="skw-hero">
        {/* Video BG — replace src with your actual video path */}
        <video
          ref={videoRef}
          className="skw-hero-video"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1581092334245-5f2a29bfa5a1?w=1400&q=80"
        >
          {/* 
            ───────────────────────────────────────────────────────────
            PLACE YOUR VIDEO HERE:
            Save your video as: src/assets/videos/hero-bg.mp4
            Then change the src below to: /src/assets/videos/hero-bg.mp4
            ───────────────────────────────────────────────────────────
          */}
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="skw-hero-overlay" />
        <div className="skw-grid-lines" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skw-grid-col" />)}
        </div>
        <div className="skw-hero-content">
          <div className="skw-hero-badge"><span className="skw-pulse-dot" />Maharashtra's Premier Steel Company</div>
          <h1 className="skw-hero-title">
            <span className="skw-hero-line">Forging</span>
            <span className="skw-hero-line skw-accent-text">Industrial</span>
            <span className="skw-hero-line">Strength</span>
          </h1>
          <p className="skw-hero-sub">18+ years of precision steel manufacturing, fabrication & project execution across Maharashtra.</p>
          <div className="skw-hero-ctas">
            <Link to="/products" className="skw-btn-primary">Explore Products <span>→</span></Link>
            <Link to="/projects" className="skw-btn-outline">View Projects</Link>
            <Link to="/contact" className="skw-btn-ghost">Get a Quote</Link>
          </div>
        </div>
      </section>

      {/* ══ ABOUT with Slider + Cert Logos ══ */}
      <section className="skw-about-strip">
        <div className="skw-about-inner">
          <div className="skw-about-text">
            <div className="skw-section-tag">About Us</div>
            <h2 className="skw-section-heading">Built on Steel.<br />Driven by Precision.</h2>
            <p className="skw-about-body">
              ShriKrishnaSteelWorks has been the backbone of Maharashtra's construction and industrial sector since 2006. 
              We supply premium TMT bars, structural steel, custom fabrications, and manage end-to-end project execution 
              for B2B contractors and individual clients alike.
            </p>
            <ul className="skw-about-list">
              <li>✦ BIS-certified steel products</li>
              <li>✦ ISO 9001:2015 quality management</li>
              <li>✦ Custom CAD/CAM fabrication</li>
              <li>✦ Pan-Maharashtra delivery network</li>
            </ul>

            {/* Certification logos */}
            <div className="skw-cert-row">
              {/*
                ─────────────────────────────────────────────────────
                HOW TO ADD YOUR LOGOS:
                1. Download BIS logo from: https://bis.gov.in
                2. Download ISO logo from your certification body
                3. Save them as:
                   src/assets/logos/bis-logo.png
                   src/assets/logos/iso-logo.png
                4. Replace the src values below accordingly
                ─────────────────────────────────────────────────────
              */}
              <div className="skw-cert-badge">
                <div className="skw-cert-placeholder">
                  {/* Replace with: <img src="/src/assets/logos/bis-logo.png" alt="BIS Certified" /> */}
                  <span className="skw-cert-text">BIS</span>
                  <span className="skw-cert-sub">IS Mark Certified</span>
                </div>
              </div>
              <div className="skw-cert-badge">
                <div className="skw-cert-placeholder">
                  {/* Replace with: <img src="/src/assets/logos/iso-logo.png" alt="ISO 9001" /> */}
                  <span className="skw-cert-text">ISO</span>
                  <span className="skw-cert-sub">9001:2015 Certified</span>
                </div>
              </div>
              <div className="skw-cert-badge">
                <div className="skw-cert-placeholder">
                  <span className="skw-cert-text">GST</span>
                  <span className="skw-cert-sub">Registered</span>
                </div>
              </div>
            </div>

            <Link to="/about" className="skw-btn-primary" style={{ display: "inline-flex", marginTop: "2rem", gap: "0.5rem" }}>
              Our Full Story <span>→</span>
            </Link>
          </div>

          {/* Image Slider */}
          <div className="skw-about-visual">
            <ImageSlider />
            <div className="skw-about-stats-overlay">
              <div className="skw-overlay-stat"><span className="skw-ov-num">24</span><span className="skw-ov-label">Active Projects</span></div>
              <div className="skw-overlay-stat"><span className="skw-ov-num">500 MT</span><span className="skw-ov-label">Daily Capacity</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS ══ */}
      <section className="skw-products-section">
        <div className="skw-section-header">
          <div className="skw-section-tag">Product Catalog</div>
          <h2 className="skw-section-heading">Industrial-Grade Steel Products</h2>
          <p className="skw-section-sub">From TMT bars to custom fabrication — every grade, every size, delivered to site.</p>
        </div>
        <div className="skw-products-grid">
          {PRODUCTS.slice(0, 6).map((p, i) => (
            <div key={p.id} className="skw-product-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="skw-product-img-wrap">
                <img src={p.image} alt={p.name} className="skw-product-img" />
                <div className="skw-product-img-overlay" />
                <span className="skw-product-cat-badge">{p.category}</span>
              </div>
              <div className="skw-product-body">
                <div className="skw-product-icon-row">
                  <span className="skw-product-icon">{p.icon}</span>
                  <h3 className="skw-product-name">{p.name}</h3>
                </div>
                <p className="skw-product-desc">{p.description}</p>
                <div className="skw-product-footer">
                  <span className="skw-product-price">{p.price}</span>
                  <div className="skw-product-actions">
                    {/* Customize gear icon */}
                    <button className="skw-gear-btn" title="Customize" onClick={() => setSelectedProduct(p)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                      </svg>
                    </button>
                    {/* Details */}
                    <button className="skw-product-cta" onClick={() => setSelectedProduct(p)}>Details →</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="skw-products-cta">
          <Link to="/products" className="skw-btn-primary skw-btn-view-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            View All Products
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* ══ PROJECTS — Admin only ══ */}
      {isAdmin && (
      <section className="skw-projects-section">
        <div className="skw-section-header skw-dark-header">
          <div className="skw-section-tag skw-tag-light">Live Projects</div>
          <h2 className="skw-section-heading skw-heading-light">Projects Across Maharashtra</h2>
          <p className="skw-section-sub skw-sub-light">Track our active and completed projects in real time.</p>
        </div>
        <div className="skw-projects-grid">
          {PROJECTS.map((proj, i) => (
            <div key={proj.id} className="skw-project-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="skw-proj-img-wrap">
                <img src={proj.images[0]} alt={proj.name} className="skw-proj-card-img" />
                <div className="skw-proj-img-overlay" />
                <span className={`skw-project-badge ${proj.status === "Completed" ? "skw-badge-done" : "skw-badge-active"}`}>
                  {proj.status === "Completed" ? "✓ Completed" : "● Ongoing"}
                </span>
              </div>
              <div className="skw-proj-body">
                <h3 className="skw-project-name">{proj.name}</h3>
                <div className="skw-project-meta">
                  <span>📍 {proj.location}</span>
                  <span>💰 {proj.budget}</span>
                  <span>👷 {proj.workers} workers</span>
                </div>
                <div className="skw-progress-section">
                  <div className="skw-progress-label"><span>Progress</span><span>{proj.progress}%</span></div>
                  <div className="skw-progress-track">
                    <div className="skw-progress-fill" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>
                <button className="skw-project-link" onClick={() => setSelectedProject(proj)}>View Details →</button>
              </div>
            </div>
          ))}
        </div>
        <div className="skw-projects-cta">
          <Link to="/projects" className="skw-btn-outline-light">Explore All Projects on Map</Link>
        </div>
      </section>
      )}

      {/* ══ HOW IT WORKS — Animated Process ══ */}
      <section className="skw-how-section" ref={howRef}>
        <div className="skw-section-header">
          <div className="skw-section-tag">Process</div>
          <h2 className="skw-section-heading">How It Works</h2>
          <p className="skw-section-sub">Simple, transparent process from inquiry to delivery.</p>
        </div>
        <div className="skw-how-container">
          {/* Animated connector line */}
          <div className={`skw-how-line ${howInView ? "skw-line-grow" : ""}`} />
          <div className="skw-how-steps">
            {HOW_STEPS.map((s, i) => (
              <div
                key={s.step}
                className={`skw-how-card ${howInView ? "skw-how-visible" : ""}`}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="skw-how-node">
                  <span className="skw-how-icon" dangerouslySetInnerHTML={{ __html: s.icon }} />
                </div>
                <div className="skw-how-step">{s.step}</div>
                <h3 className="skw-how-title">{s.title}</h3>
                <p className="skw-how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="skw-testimonials">
        <div className="skw-section-header skw-dark-header">
          <div className="skw-section-tag skw-tag-light">Client Reviews</div>
          <h2 className="skw-section-heading skw-heading-light">Trusted by Builders</h2>
        </div>
        <div className="skw-reviews-grid">
          {[
            { name: "Rajesh Patil", role: "Civil Contractor, Pune", review: "Best quality TMT bars in Maharashtra. Delivery was on time and the material passed all QC checks on site. Their technical support is outstanding!", stars: 5 },
            { name: "Anita Sharma", role: "Project Manager, Nagpur", review: "Handled our warehouse fabrication project end-to-end. Professional team and transparent pricing. Completed 2 weeks ahead of schedule!", stars: 5 },
            { name: "Suresh Mehta", role: "B2B Client, Mumbai", review: "Custom steel components delivered exactly as per DWG specifications. Will definitely order again. Their quality control is impeccable.", stars: 4.5 },
            { name: "Vikram Singh", role: "Industrial Engineer, Thane", review: "Outstanding structural steel sections for our factory expansion. The precision cutting and welding work exceeded our expectations. Highly recommended!", stars: 5 },
            { name: "Priya Desai", role: "Architect, Nashik", review: "From concept to completion, ShriKrishnaSteelWorks delivered exceptional results. Their custom fabrication capabilities are world-class.", stars: 4 },
            { name: "Arun Kumar", role: "Construction Manager, Aurangabad", review: "Reliable steel supply partner for the past 3 years. Never missed a deadline, always exceeded quality standards. Simply the best in Maharashtra!", stars: 5 },
          ].map((r, i) => (
            <div key={i} className="skw-review-card">
              <div className="skw-review-stars">
                {"★".repeat(Math.floor(r.stars))}
                {r.stars % 1 !== 0 ? "☆" : ""}
                {"☆".repeat(5 - Math.ceil(r.stars))}
              </div>
              <div className="skw-review-quote">"</div>
              <p className="skw-review-text">{r.review}</p>
              <div className="skw-review-author">
                <div className="skw-review-avatar">
                  <span>{r.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div><div className="skw-review-name">{r.name}</div><div className="skw-review-role">{r.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section className="skw-services-section">
        <div className="skw-section-header">
          <div className="skw-section-tag">Our Services</div>
          <h2 className="skw-section-heading">Complete Steel Solutions</h2>
          <p className="skw-section-sub">From raw materials to finished structures — we handle every aspect of your steel requirements.</p>
        </div>
        <div className="skw-services-grid">
          {[
            {
              icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
              title: "Manufacturing & Supply",
              desc: "Large-scale production of TMT bars, structural sections, and steel plates with BIS certification.",
              features: ["500 MT daily capacity", "Multiple grades available", "Custom sizes & lengths", "BIS certified quality"]
            },
            {
              icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a1 1 0 0 0 0-1.4l-1.59-1.59a1 1 0 0 0-1.41 0L14.7 6.3Z"/><path d="M17 7l-5.5 5.5"/><path d="M7 7l-4.5 4.5"/><path d="M17 7l-4.5 4.5"/><path d="M7 7l5.5 5.5"/><circle cx="12" cy="12" r="1"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>',
              title: "Custom Fabrication",
              desc: "CAD/CAM precision cutting, bending, welding, and assembly for industrial and commercial projects.",
              features: ["DWG file processing", "CNC machining", "Quality inspection", "On-site assembly"]
            },
            {
              icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/></svg>',
              title: "Logistics & Delivery",
              desc: "Pan-Maharashtra delivery network with real-time tracking and warehouse pickup options.",
              features: ["GPS tracking", "Insurance coverage", "Flexible scheduling", "Pan-India delivery"]
            },
            {
              icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h6"/><path d="M9 12l-3 3 3 3"/></svg>',
              title: "Project Management",
              desc: "End-to-end project execution from design consultation to on-site installation and handover.",
              features: ["Site supervision", "Progress monitoring", "Quality assurance", "Timeline management"]
            },
            {
              icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
              title: "Technical Support",
              desc: "Expert engineering consultation, material selection guidance, and post-sales technical assistance.",
              features: ["Design consultation", "Load calculations", "Maintenance support", "24/7 helpline"]
            },
            {
              icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="7" cy="15" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="17" cy="15" r="1"/></svg>',
              title: "Financial Solutions",
              desc: "Flexible payment terms, bulk discounts, and credit facilities for B2B clients.",
              features: ["Credit terms available", "Bulk pricing", "Payment plans", "Tax benefits"]
            }
          ].map((service, i) => (
            <div key={i} className="skw-service-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div
                className="skw-service-icon"
                dangerouslySetInnerHTML={{ __html: service.icon }}
              />
              <h3 className="skw-service-title">{service.title}</h3>
              <p className="skw-service-desc">{service.desc}</p>
              <ul className="skw-service-features">
                {service.features.map((feature, j) => (
                  <li key={j}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="skw-faq-section skw-testimonials">
        <div className="skw-section-header skw-dark-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="skw-section-tag skw-tag-light">FAQ</div>
          <h2 className="skw-section-heading skw-heading-light">Frequently Asked Questions</h2>
          <p className="skw-section-sub" style={{ color: '#d1e3ff' }}>Precision-engineered answers for your industrial requirements.</p>
        </div>

        <div className="skw-faq-container">
          <div className="skw-faq-grid">
            {[
              {
                question: "What certified steel grades do you maintain?",
                answer: "We supply <span style='color:#f1c40f; font-weight:500'>IS 2062 (E250/E350)</span> and <span style='color:#f1c40f; font-weight:500'>Fe500D</span> TMT bars. Every delivery includes a 100% authentic Manufacturer's Test Certificate (MTC)."
              },
              {
                question: "Can you handle custom fabrication from blueprints?",
                answer: "Our facility features <span style='color:#f1c40f; font-weight:500'>CNC Laser Cutting</span> and robotic welding. Upload your DWG/DXF blueprints for a technical review within 24 hours."
              },
              {
                question: "What are your Minimum Order Quantities (MOQ)?",
                answer: "We accommodate both bulk and medium projects: <br/>• TMT Bars: 5 MT <br/>• Structural Sections: 3 MT <br/>• Custom Work: 1 MT."
              },
              {
                question: "How do you manage logistics and timelines?",
                answer: "Standard stock dispatches in <span style='color:#eab308; font-weight:700'>3-5 days</span>. Custom fabrication ranges from 2-4 weeks with real-time GPS tracking enabled."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className={`skw-faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="skw-faq-question">
                  <h4>{faq.question}</h4>
                  <div className={`skw-faq-icon ${openFaq === i ? 'skw-faq-a-icon' : ''}`}>
                    <span>{openFaq === i ? '−' : '+'}</span>
                  </div>
                </div>

                <div className={`skw-faq-answer ${openFaq === i ? 'active' : ''}`}>
                  <div className="skw-faq-content">
                    <p dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="skw-cta-banner">
        <div className="skw-cta-inner">
          <h2 className="skw-cta-heading">Ready to Build Something Great?</h2>
          <p className="skw-cta-sub">Get a free project consultation or customise your steel order today.</p>
          <div className="skw-cta-btns">
            <Link to="/contact" className="skw-btn-white">Contact Us</Link>
            <Link to="/products" className="skw-btn-outline-white">Browse Products</Link>
          </div>
        </div>
        <div className="skw-cta-deco" aria-hidden="true">STEEL</div>
      </section>

      {/* Modals */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}

      {/* Chatbot */}
      <ChatBot />
    </div>
  );
}
