import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  Activity,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Lock,
  ShoppingCart,
  User,
  Users,
  Wrench,
  BookOpen,
  FileText,
  Star,
  Check,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Info,
  Calendar,
  CreditCard,
  Building,
  Sliders,
  Laptop
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { UserRole } from "../types";

interface LoginPageProps {
  onExploreAsGuest: (selectedRole?: UserRole) => void;
  theme: "dark" | "light";
}

// Defining static product catalogue modeled on HTML content
interface Product {
  id: number;
  name: string;
  cat: "instrument" | "digital" | "guide";
  emoji: string;
  bg: string;
  price: number;
  originalPrice?: number;
  badge: "popular" | "new" | "sale" | null;
  desc: string;
  features: string[];
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Portable Pulse Oximeter",
    cat: "instrument",
    emoji: "❤️‍🔥",
    bg: "from-amber-500/10 to-orange-500/5 border-amber-500/20",
    price: 850,
    badge: "popular",
    desc: "Fingertip pulse oximeter for SpO2 and heart rate monitoring. Medical-grade, suitable for clinical and home use.",
    features: ["SpO2 + heart rate display", "OLED display, high visibility", "Auto power-off", "CE marked, medical grade", "Batteries included"]
  },
  {
    id: 2,
    name: "Ventilator Operations Manual",
    cat: "digital",
    emoji: "📖",
    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
    price: 299,
    badge: "new",
    desc: "Comprehensive digital manual covering ICU ventilator modes, alarm management, and clinical protocols. Ideal for training programmes.",
    features: ["150+ pages, fully illustrated", "Modes: VC, PC, SIMV, PSV", "Alarm troubleshooting guide", "Clinical case examples", "PDF, instant download"]
  },
  {
    id: 3,
    name: "Biomedical Calibration Toolkit",
    cat: "instrument",
    emoji: "🔧",
    bg: "from-rose-500/10 to-orange-500/5 border-rose-500/20",
    price: 2200,
    originalPrice: 2800,
    badge: "sale",
    desc: "Professional calibration and maintenance toolkit for biomedical technicians — covers electrical safety testing and performance verification.",
    features: ["Electrical safety tester", "Pressure gauge set", "Temperature probe", "Calibration logbook", "Carrying case included"]
  },
  {
    id: 4,
    name: "Medical Device Maintenance Guide",
    cat: "guide",
    emoji: "📋",
    bg: "from-indigo-500/10 to-violet-500/5 border-indigo-500/20",
    price: 199,
    badge: null,
    desc: "Step-by-step preventive maintenance protocols for 30+ common medical devices used in Indian hospitals and clinics.",
    features: ["30 device PM schedules", "Illustrated procedures", "Spare parts reference", "Compliance checklist", "Hindi & English"]
  },
  {
    id: 5,
    name: "Biomedical Technician Handbook",
    cat: "guide",
    emoji: "📚",
    bg: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
    price: 349,
    badge: null,
    desc: "Complete reference handbook for biomedical engineering technicians covering theory, regulations, and best practices for the Indian healthcare context.",
    features: ["400+ pages reference", "Covers CDSCO regulations", "Medical gas systems", "IT systems in hospitals", "NABH compliance guide"]
  },
  {
    id: 6,
    name: "Digital SpO2 & ECG Monitor",
    cat: "instrument",
    emoji: "🫀",
    bg: "from-orange-500/10 to-red-500/5 border-orange-500/20",
    price: 4500,
    badge: "new",
    desc: "Compact bedside monitor for ECG, SpO2, and NIBP — suitable for ward monitoring and training demonstrations.",
    features: ["3-in-1: ECG, SpO2, NIBP", "7-inch colour display", "Data storage & export", "Alarm configuration", "1-year warranty"]
  }
];

interface CartItem {
  product: Product;
  quantity: number;
}

export default function LoginPage({ onExploreAsGuest, theme }: LoginPageProps) {
  // Authentication states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showPortalModal, setShowPortalModal] = useState(false);

  // Shop & cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "instrument" | "digital" | "guide">("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Detail modals states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<{
    name: string;
    emoji: string;
    desc: string;
    price: string;
    period: string;
    features: string[];
  } | null>(null);

  // Checkout flows states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutSource, setCheckoutSource] = useState<"cart" | "service">("cart");
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    org: "",
    service: "",
    message: "",
    newsletter: false
  });

  // Global toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Seed default user document for Google sign-in to allow role config without losing settings
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "Admin", // Default role
        updatedAt: new Date().toISOString(),
        authProvider: "google"
      }, { merge: true });

      setInfoMsg(`Welcome, ${user.displayName || "Clinical Operator"}! Launching clinical hub...`);
      showToast(`Welcome ${user.displayName || "Operator"}!`);
    } catch (err: any) {
      console.warn("Google authentication warning:", err);
      let errMsg = "Google single sign-on was canceled or blocked.";
      if (err.code === "auth/popup-blocked") {
        errMsg = "Google login popup was blocked by your browser. Please enable popups or tap Guest Access below.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Single Sign-on tab closed before completion.";
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    showToast(`✓ "${product.name}" added to cart`);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast("Item removed from cart");
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  // Checkout fields formatting
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)} / ${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.firstName || !checkoutForm.email) {
      showToast("⚠️ Standard booking requires at least Name & Email");
      return;
    }
    setShowCheckoutModal(false);
    if (checkoutSource === "cart") {
      setCart([]);
    }
    showToast("✅ Order Confirmed! Diagnostic transaction details dispatched to your email.");
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.firstName || !contactForm.email) {
      showToast("⚠️ Core inquiry requires Name and corporate Email");
      return;
    }
    showToast("✅ Message received! We will contact your hospital within 24 hours.");
    setContactForm({
      firstName: "",
      lastName: "",
      email: "",
      org: "",
      service: "",
      message: "",
      newsletter: false
    });
  };

  return (
    <div className={`min-h-screen font-sans antialiased text-slate-100 bg-[#1A1A2E] selection:bg-orange-600/35 relative overflow-x-hidden`} id="landing-root">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[700px] rounded-full bg-gradient-to-br from-orange-600/10 to-transparent blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[600px] rounded-full bg-gradient-to-tl from-emerald-600/5 to-transparent blur-[150px]" />
        <div className="absolute top-[35%] right-[20%] w-[400px] h-[400px] rounded-full bg-red-650/5 blur-[120px]" />
      </div>

      {/* ── STICKY NAVIGATION BAR ── */}
      <nav className="sticky top-0 z-50 bg-[#1A1A2E]/90 backdrop-blur-xl border-b-2 border-[#FF6B00] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Mark - Rising Sun Arc + Medical Cross Overlay */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-red-650 shadow-lg shadow-orange-600/20 border border-orange-500/45 shrink-0 transition group-hover:scale-105">
              <Activity className="h-5.5 w-5.5 text-white animate-pulse" />
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 border border-[#1A1A2E] rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg text-[#FF9A3C] tracking-tight leading-none">
                SunMedx
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-1">
                Biomedical • R K Enterprises
              </span>
            </div>
          </a>

          {/* Quick Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold">
            <a href="#about" className="text-slate-350 hover:text-[#FF9A3C] transition">About Us</a>
            <a href="#projects" className="text-slate-350 hover:text-[#FF9A3C] transition">Deployments</a>
            <a href="#services" className="text-slate-350 hover:text-[#FF9A3C] transition">Training & Services</a>
            <a href="#shop" className="text-slate-350 hover:text-[#FF9A3C] transition">Medical Shop</a>
            <a href="#contact" className="text-slate-350 hover:text-[#FF9A3C] transition">Inquiries</a>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 border border-slate-800 hover:border-[#FF9A3C] text-slate-300 hover:text-[#FF9A3C] rounded-xl cursor-pointer transition shadow"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B00] text-white font-mono font-bold text-[9px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-lg border border-[#1A1A2E] animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Main Portal Database Sign-In Button */}
            <button
              onClick={() => setShowPortalModal(true)}
              className="bg-gradient-to-r from-red-600 via-[#FF6B00] to-amber-500 hover:opacity-95 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-display font-bold text-xs sm:text-xs tracking-wide shadow-lg shadow-orange-650/25 transition cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Biomedical Database Portal</span>
            </button>
          </div>

        </div>
      </nav>

      {/* ── HERO HERO HERO ── */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900 bg-gradient-to-b from-[#1A1A2E] via-[#0E1F35] to-[#120B1D]">
        
        {/* Vector Watermark & Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-25" />
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] text-[18rem] text-slate-500 opacity-2 select-none pointer-events-none font-display font-extrabold flex justify-center items-center">
          ✚
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left pitch text */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#FF9A3C] shadow shadow-orange-500 animate-ping" />
                <span className="font-mono text-[10px] tracking-widest text-[#FFD08A] font-bold uppercase leading-none">
                  Biomedical Engineering · R K Enterprises · India
                </span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
                <span className="bg-gradient-to-r from-red-500 via-[#FF6B00] to-[#FF9A3C] bg-clip-text text-transparent">Consulting</span><br />
                <span>for Healthcare</span><br />
                <span className="bg-gradient-to-r from-[#FF9A3C] via-[#FFD08A] to-white bg-clip-text text-transparent">Success.</span>
              </h1>
              
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                SunMedx provides exceptional biomedical engineering solutions — high-performance medical instruments, ventilator systems support, practical clinical workshops, and expert NABH/ISO consultancy — facilitating better hospital practices across India.
              </p>

              <div className="flex flex-wrap gap-3.5 pt-2">
                <a 
                  href="#services" 
                  className="bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:opacity-95 text-white font-display font-bold text-xs tracking-wider px-6 py-3.5 rounded-xl transition shadow-lg shadow-orange-550/25 flex items-center gap-1.5"
                >
                  Our Services
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a 
                  href="#about" 
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 font-semibold text-xs tracking-wide px-6 py-3.5 rounded-xl transition"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right Dashboard Widget Preview */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6.5 shadow-2.5xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B00] to-[#FF9A3C]" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-[#FF9A3C] uppercase tracking-wider font-bold">
                      Live Telemetry Dashboard
                    </div>
                    <h3 className="font-display font-bold text-base text-white">SunMedx Digital Signal</h3>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full uppercase leading-none">
                    Active Feed
                  </span>
                </div>

                {/* Electrocardiogram wave pattern */}
                <div className="h-16 flex items-center py-2">
                  <svg className="w-full h-full text-[#FF6B00]" viewBox="0 0 420 44" fill="none">
                    <defs>
                      <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C0392B" />
                        <stop offset="40%" stopColor="#FF6B00" />
                        <stop offset="70%" stopColor="#FF9A3C" />
                        <stop offset="100%" stopColor="#FFD08A" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,28 L35,28 L50,28 L55,8 L60,38 L65,8 L72,28 L110,28 L125,28 L130,10 L135,36 L140,10 L147,28 L185,28 L200,28 L205,8 L210,38 L215,8 L222,28 L260,28 L275,28 L280,10 L285,36 L290,10 L297,28 L340,28 L355,28 L360,8 L365,38 L370,8 L377,28 L420,28"
                      stroke="url(#ecgGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Quick features tags */}
                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="bg-slate-950 border border-slate-850 p-2 text-center rounded-xl">
                    <span className="font-display font-extrabold text-[#FF9A3C] text-lg block leading-none">10+</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase leading-none mt-1.5 block">Years Exp.</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2 text-center rounded-xl">
                    <span className="font-display font-extrabold text-[#FF9A3C] text-lg block leading-none">200+</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase leading-none mt-1.5 block">Hospitals</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2 text-center rounded-xl">
                    <span className="font-display font-extrabold text-[#FF9A3C] text-lg block leading-none">50+</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase leading-none mt-1.5 block">Devices</span>
                  </div>
                </div>
              </div>

              {/* Mini tag pills */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-400">
                <span className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg">🫁 Ventilator Training</span>
                <span className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg">🔧 Calibration Lab</span>
                <span className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg">📋 NABH Compliance</span>
                <span className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg">🏥 AMC Support</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ROTATING MARQUEE STRIP ── */}
      <div className="bg-[#FF6B00] py-4 overflow-hidden select-none border-y border-[#FF9A3C] relative z-10">
        <div className="flex whitespace-nowrap animate-marquee">
          {["Ventilator Training", "Biomedical Consultancy", "Instrument Workshop", "R K Enterprises · India", "Medical Device Support", "Healthcare Technology", "AMC Services"].map((text, idx) => (
            <React.Fragment key={idx}>
              <span className="font-display font-extrabold text-[11px] text-white uppercase tracking-widest px-8">
                {text}
              </span>
              <span className="text-white/40 font-bold">✦</span>
            </React.Fragment>
          ))}
          {/* Repeating for seamless scrolling */}
          {["Ventilator Training", "Biomedical Consultancy", "Instrument Workshop", "R K Enterprises · India", "Medical Device Support", "Healthcare Technology", "AMC Services"].map((text, idx) => (
            <React.Fragment key={`repeat-${idx}`}>
              <span className="font-display font-extrabold text-[11px] text-white uppercase tracking-widest px-8">
                {text}
              </span>
              <span className="text-white/40 font-bold">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── ABOUT / WHO WE ARE SECTION ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" id="about">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Text pillar */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex items-center gap-2">
              <span className="w-6 h-[2px] bg-gradient-to-r from-red-500 to-[#FF6B00]" />
              <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#FF6B00]">
                Who We Are
              </span>
            </div>
            
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight">
              Our Commitment to Care
            </h2>

            <p className="text-slate-350 text-sm leading-relaxed">
              SunMedx is a leading biomedical engineering brand operating under <strong>R K Enterprises</strong> in India. We supply world-class medical instruments including ventilator solutions, support packages, and strategic technical consultancy to healthcare facilities, dramatically improving operational accuracy.
            </p>

            <p className="text-slate-350 text-sm leading-relaxed">
              Founded by recognized biomedical specialists, we are committed to elevating patient safety through authorized hands-on training for ventilator operation and clinical equipment lifecycle governance.
            </p>

            <p className="text-slate-350 text-sm leading-relaxed">
              From district clinics to multi-specialty regional hubs, our solutions bridge the gap between complex software systems and everyday healthcare tasks.
            </p>

            {/* Banner Statement */}
            <div className="p-6 bg-slate-900 border-l-4 border-[#FF6B00] rounded-2xl relative overflow-hidden text-left mt-4 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#FF9A3C] uppercase block mb-1">
                Our Corporate Mission
              </span>
              <p className="text-[#FFD08A] font-display font-bold text-sm tracking-tight leading-snug">
                To make world-class biomedical engineering expertise accessible to every healthcare facility across India — through reliable instruments, practical training, and trusted consultancy.
              </p>
            </div>
          </div>

          {/* Quick Pillar Cards */}
          <div className="lg:col-span-5 flex flex-col gap-4 text-left">
            {[
              {
                icon: "🫁",
                title: "Ventilator Solutions",
                desc: "Supply, installation, and expert maintenance of ICU ventilators across private & public facilities."
              },
              {
                icon: "🔬",
                title: "Medical Instrument Services",
                desc: "Calibration, preventive maintenance, and authorized sourcing of clinical equipment."
              },
              {
                icon: "🎓",
                title: "Professional Training",
                desc: "Certified hands-on workshops for staff nurses, residents, and biomedical engineers."
              },
              {
                icon: "📋",
                title: "Healthcare Consultancy",
                desc: "Strategic department deployment planning, CDSCO/NABH audits, and procurement reviews."
              }
            ].map((p, index) => (
              <div 
                key={index}
                className="bg-slate-900/40 border border-slate-800 hover:border-[#FF9A3C] rounded-2xl p-5 flex gap-4 items-start transition duration-200"
              >
                <span className="text-2xl pt-1">{p.icon}</span>
                <div className="space-y-0.5">
                  <h4 className="font-display font-bold text-sm text-white">{p.title}</h4>
                  <p className="text-xs text-slate-400 leading-normal">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── PROJECTS / DEPLOYMENTS SECTION ── */}
      <section className="py-24 border-t border-b border-slate-900 bg-[#120B1D]" id="projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          
          <div className="space-y-2 mb-12">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#FF9A3C]">
              Our Projects
            </span>
            <h2 className="font-display font-black text-3xl text-white tracking-tight leading-none">
              Deployments & Case Histories
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Explore our wide clinical engineering footprint mapped across government hospitals and private healthcare chains in India.
            </p>
          </div>

          {/* Portfolio grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            
            {/* Wide card */}
            <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow hover:border-orange-500/30 transition flex flex-col justify-between">
              <div className="h-44 bg-gradient-to-br from-[#1A0500] to-[#3D1200] flex items-center justify-center text-4xl relative">
                🫁
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>
              <div className="p-5 space-y-1">
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#FF9A3C]">ICU · Government District</span>
                <h3 className="font-display font-medium text-sm text-white">ICU Ventilator Fleet Deployment</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Supplied, commissioned, and supported 40+ ICU ventilator machines for district government Hospital systems combined with ongoing certification training for critical care staff.
                </p>
              </div>
            </div>

            {/* regular card */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow hover:border-orange-500/30 transition flex flex-col justify-between">
              <div className="h-44 bg-gradient-to-br from-[#0D1A0A] to-[#1A3010] flex items-center justify-center text-4xl relative">
                🔬
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>
              <div className="p-5 space-y-1">
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#FF9A3C]">Diagnostics · Clinic</span>
                <h3 className="font-display font-medium text-sm text-white">Equipment Calibration Audit</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Executed full clinical audits and calibration checks for 120+ diagnostics instruments across a multi-clinic regional provider.
                </p>
              </div>
            </div>

            {/* Three cards row */}
            {[
              {
                emoji: "🏥",
                bg: "from-[#1A0A00] to-[#2D1800]",
                tag: "Consultancy · Healthcare Center",
                title: "Hospital Biomedical Department Setup",
                desc: "A-Z setup including device sourcing, floorplan compliance audits, and staff onboarding schedules for 200-bed multispecialty site."
              },
              {
                emoji: "🎓",
                bg: "from-[#0A0A1A] to-[#1A1030]",
                tag: "Training · Regional Hub",
                title: "Certified Ventilator Training",
                desc: "Certified hands-on training for 300+ working nurse operators and senior biomedical technicians across 3 Indian states."
              },
              {
                emoji: "⚙️",
                bg: "from-[#001010] to-[#002828]",
                tag: "Maintenance · AMC Contracts",
                title: "Preventive AMC Services",
                desc: "Managed active Annual Maintenance Contracts for 50+ local centers with guaranteed 24hr response metrics."
              }
            ].map((proj, idx) => (
              <div 
                key={idx}
                className="lg:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow hover:border-orange-500/30 transition flex flex-col justify-between"
              >
                <div className={`h-40 bg-gradient-to-br ${proj.bg} flex items-center justify-center text-3xl relative`}>
                  {proj.emoji}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                </div>
                <div className="p-5 space-y-1 text-left">
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#FF9A3C]">{proj.tag}</span>
                  <h3 className="font-display font-medium text-sm text-white">{proj.title}</h3>
                  <p className="text-xs text-slate-400 leading-normal">{proj.desc}</p>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ── SERVICES & BOOKING SECTION ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" id="services">
        <div className="text-left mb-12">
          <div className="flex items-center gap-2">
            <span className="w-6 h-[2px] bg-[#FF6B00]" />
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#FF6B00]">
              Services Catalog
            </span>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tight mt-1">
            Biomedical Engineering Workshops
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Choose from strategic consulting courses or request localized technical audits. Fully accredited by biomedical associations.
          </p>
        </div>

        {/* Services mapping */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Ventilator Training",
              emoji: "🫁",
              desc: "Hands-on practical training on ICU ventilator operation, troubleshooting, and safety protocols for clinical and biomedical staff.",
              price: "₹150",
              period: "per participant · certificate provided",
              features: [
                "Ventilator modes & settings",
                "Alarm management",
                "Patient circuit setup",
                "Troubleshooting basics",
                "Certificate of completion"
              ]
            },
            {
              name: "Instrument Workshop",
              emoji: "🔧",
              badge: "Most Booked",
              desc: "A practical workshop covering medical instrument calibration, preventive maintenance, and biomedical safety standards for technicians.",
              price: "₹100",
              period: "per participant · group discounts available",
              features: [
                "Instrument calibration techniques",
                "Preventive maintenance protocols",
                "Electrical safety in medical devices",
                "Documentation & compliance",
                "Hands-on lab sessions"
              ]
            },
            {
              name: "Biomedical Consultancy",
              emoji: "📋",
              desc: "Expert consultancy for hospitals and healthcare facilities on biomedical equipment procurement, department setup, and compliance.",
              price: "₹200",
              period: "per session · custom packages available",
              features: [
                "Equipment needs assessment",
                "Procurement guidance",
                "Regulatory compliance review",
                "AMC planning & vendor evaluation",
                "Written consultancy report"
              ]
            }
          ].map((svc, index) => (
            <div 
              key={index}
              className={`bg-slate-900 border ${
                svc.badge ? "border-[#FF6B00] shadow-xl shadow-orange-650/5 relative" : "border-slate-800"
              } rounded-3xl p-6.5 text-left flex flex-col justify-between`}
            >
              {svc.badge && (
                <span className="absolute top-[-10px] left-8 bg-gradient-to-r from-red-650 to-[#FF6B00] text-white tracking-widest text-[9px] font-bold px-3 py-1 rounded-full uppercase leading-none shadow">
                  {svc.badge}
                </span>
              )}

              <div className="space-y-4">
                <span className="text-3xl block">{svc.emoji}</span>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">{svc.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">{svc.desc}</p>
                </div>

                <div className="pt-2">
                  <span className="font-display font-black text-2.5xl bg-gradient-to-r from-[#FF6B00] to-[#FF9A3C] bg-clip-text text-transparent block">
                    {svc.price}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block uppercase">{svc.period}</span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-850 text-xs text-slate-300">
                  {svc.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-[#FF6B00] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedService(svc);
                }}
                className={`w-full mt-6 py-3 rounded-xl font-display font-bold text-xs tracking-wider border-2 cursor-pointer transition ${
                  svc.badge 
                    ? "bg-gradient-to-r from-[#FF6B00] to-orange-500 border-transparent text-white shadow-lg"
                    : "border-[#FF6B00] text-[#FF9A3C] hover:bg-[#FF6B00]/10"
                }`}
              >
                Book Now →
              </button>

            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS SHOP WITH TABS ── */}
      <section className="py-24 border-t border-slate-900 bg-[#FFF4E6]/5" id="shop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-left mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#FF6B00]">
                Shop Products
              </span>
              <h2 className="font-display font-black text-3xl text-white tracking-tight">
                Medical Products & Resources
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Sourced certified instruments, official training manuals, and checklists for healthcare experts.
              </p>
            </div>

            {/* Category selection tabs */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold select-none leading-none">
              {(["all", "instrument", "digital", "guide"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-full transition cursor-pointer text-[11px] font-bold uppercase tracking-wide border ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-[#FF6B00] to-orange-500 border-transparent text-white shadow-md shadow-orange-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat === "all" ? "All Products" : cat === "instrument" ? "Instruments" : cat === "digital" ? "Digital" : "Manual Guides"}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.filter(p => selectedCategory === "all" || p.cat === selectedCategory).map((prod) => (
              <div
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 hover:border-orange-500/35 transition duration-200 cursor-pointer text-left flex flex-col justify-between group"
              >
                <div>
                  {/* Photo area */}
                  <div className={`h-40 bg-gradient-to-br ${prod.bg} rounded-2xl flex items-center justify-center text-4.5xl relative border mb-4`}>
                    {prod.emoji}
                    {prod.badge && (
                      <span className={`absolute top-3.5 right-3.5 text-[8.5px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full uppercase leading-none ${
                        prod.badge === "new" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : prod.badge === "sale" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      }`}>
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-500">
                      {prod.cat}
                    </span>
                    <h3 className="font-display font-bold text-[#FFD08A] text-sm group-hover:text-white transition">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                      {prod.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-850/50">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-extrabold text-[#FF9A3C] text-base">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-[10px] text-slate-500 line-through">
                        ₹{prod.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(prod, e)}
                    className="bg-slate-950 hover:bg-orange-600 hover:text-white border border-slate-800 hover:border-transparent text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Add Component
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left" id="testimonials">
        <div className="space-y-1.5 mb-12">
          <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#FF6B00]">
            User Reviews
          </span>
          <h2 className="font-display font-black text-3xl text-white tracking-tight leading-none">
            What Healthcare Professionals Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              stars: 5,
              text: '"The ventilator training modules provided by SunMedx was extremely thorough. Our critical ICU team is now highly confident navigating complex respiratory modes. Essential training for critical care hubs."',
              author: "Dr. Ramesh Kumar",
              role: "ICU Head, Regional General Hospital",
              initials: "DR",
              grad: "from-red-500 to-orange-500"
            },
            {
              stars: 5,
              text: '"R K Enterprises handled our total critical-device departmental structure setup from blueprint. Their consultancy reviews on procurement and standards saved significant costs during regulatory audits."',
              author: "Anjali Patel",
              role: "Operations Director, Multi-specialty Clinic",
              initials: "AP",
              grad: "from-orange-500 to-amber-500"
            },
            {
              stars: 5,
              text: '"The calibration verification tools and preventive workshops they hosted brought practical diagnostic knowledge to our technicians. Their quality is absolutely state-of-the-art."',
              author: "Suresh K.",
              role: "Chief Biomedical Technologist",
              initials: "SK",
              grad: "from-amber-500 to-yellow-500"
            }
          ].map((test, index) => (
            <div 
              key={index}
              className="bg-slate-900/60 border border-slate-800 border-t-4 border-t-[#FF6B00] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-0.5 text-xs text-orange-500 mb-4">
                  {Array.from({ length: test.stars }).map((_, sIdx) => (
                    <Star key={sIdx} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-xs sm:text-xs leading-relaxed italic mb-6">
                  {test.text}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${test.grad} text-white font-black text-xs flex items-center justify-center shrink-0 shadow`}>
                  {test.initials}
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-xs text-white">{test.author}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT INQUIRY SECTION ── */}
      <section className="py-24 border-t border-slate-900 bg-[#120B1D]" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left pitch */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#FF9A3C]">
                Get in Touch
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none">
                Connect with SunMedx
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Connect our clinical team to organize local hospital audits, schedule certified ventilators classroom bookings, or request detailed product quotation rosters. Serve healthcare nationwide.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex gap-3.5 items-start">
                  <span className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[#FF9A3C]">
                    <Phone className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 block leading-none">Phone Hotline</span>
                    <span className="text-sm font-semibold text-white mt-1 block">+91 123-456-7890</span>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[#FF9A3C]">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 block leading-none">Corporate Email</span>
                    <span className="text-sm font-semibold text-white mt-1 block">info@sunmedx.com</span>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[#FF9A3C]">
                    <MapPin className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500 block leading-none">Headquarters</span>
                    <span className="text-sm font-semibold text-white mt-1 block">India — Serving healthcare providers nationwide</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6.5 sm:p-8 backdrop-blur-xl">
              <h3 className="font-display font-bold text-lg text-white">Send Us a Message</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">Our clinical engineering executives reply within 24 hours.</p>

              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-slate-400 uppercase tracking-wide text-[10px]">First Name</label>
                    <input 
                      type="text"
                      placeholder="Ramesh"
                      value={contactForm.firstName}
                      onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-slate-400 uppercase tracking-wide text-[10px]">Last Name</label>
                    <input 
                      type="text"
                      placeholder="Kumar"
                      value={contactForm.lastName}
                      onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px] block">Corporate Email *</label>
                  <input 
                    type="email"
                    required
                    placeholder="you@hospital.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px] block">Organisation / Hospital Center</label>
                  <input 
                    type="text"
                    placeholder="Grand Apollo Diagnostics, Pune"
                    value={contactForm.org}
                    onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px] block">Service of Interest</label>
                  <select 
                    value={contactForm.service}
                    onChange={(e) => setContactForm({ ...contactForm, service: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-slate-300 focus:outline-none focus:border-[#FF6B00] transition cursor-pointer font-semibold"
                  >
                    <option value="">Select interest catalog...</option>
                    <option value="Ventilator Training">ICU Ventilator Training</option>
                    <option value="Instrument Workshop">Calibration Instrument Workshop</option>
                    <option value="Biomedical Consultancy">Strategic BME Consultancy</option>
                    <option value="Product Sourcing">Medical Devices Sourcing</option>
                    <option value="AMC Contracts">Annual Maintenance Contracts</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px] block">Detailed Message</label>
                  <textarea 
                    rows={3}
                    placeholder="Tell us about your facility's requirements..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition resize-none font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 text-left text-[11px] text-slate-400">
                  <input 
                    type="checkbox"
                    id="newsletter-chk"
                    checked={contactForm.newsletter}
                    onChange={(e) => setContactForm({ ...contactForm, newsletter: e.target.checked })}
                    className="accent-[#FF6B00] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="newsletter-chk" className="cursor-pointer select-none leading-normal">
                    Subscribe our news-flash for critical updates and upcoming ventilator training program slots
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 via-[#FF6B00] to-orange-500 hover:opacity-95 text-white font-display font-extrabold text-xs tracking-widest uppercase rounded-xl transition cursor-pointer shadow-lg active:scale-95 mt-4"
                >
                  Send Corporate Enquiry →
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER SIGNATURES ── */}
      <footer className="bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 text-left">
          
          <div className="lg:col-span-5 space-y-4">
            <a href="#" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm">
                ✚
              </div>
              <span className="font-display font-extrabold text-white text-base">SunMedx</span>
            </a>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Exceptional biomedical engineering solutions, medical device calibration, ventilator certification support, and expert hospital consultancy. Operating as an official brand under <strong>R K Enterprises, India</strong>.
            </p>
          </div>

          <div className="lg:col-span-2.5 space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#about" className="hover:text-white transition">About Us</a></li>
              <li><a href="#projects" className="hover:text-white transition">Deployments</a></li>
              <li><a href="#testimonials" className="hover:text-white transition">Reviews</a></li>
              <li><a href="#contact" className="hover:text-white transition">Inquiries</a></li>
            </ul>
          </div>

          <div className="lg:col-span-2.5 space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#services" className="hover:text-white transition">Ventilator Training</a></li>
              <li><a href="#services" className="hover:text-white transition">Calibration Class</a></li>
              <li><a href="#services" className="hover:text-white transition">Strategic Advisors</a></li>
              <li><a href="#shop" className="hover:text-white transition">Equipment Store</a></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white transition">Refund Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Compliance Specs</a></li>
            </ul>
          </div>

        </div>

        <div className="bg-slate-950/40 py-6 border-t border-slate-900/60 font-mono text-[9.5px] text-slate-600 sm:font-bold">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span>© 2026 SUNMEDX • R K ENTERPRISES • INDIA. ALL CLINICAL DOCUMENTATION SECURELY CO-SIGNED.</span>
            <div className="flex gap-4">
              <span className="hover:text-white transition cursor-pointer">CDSCO Approved</span>
              <span className="hover:text-white transition cursor-pointer">ISO 13485</span>
              <span className="hover:text-white transition cursor-pointer">NABH Certified</span>
            </div>
          </div>
        </div>
      </footer>


      {/* ══ INTERACTIVE PORTAL ACCESS DIALOG DRWER (MODAL) ══ */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowPortalModal(false)} 
          />
          
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-7 max-w-sm sm:max-w-md w-full relative overflow-hidden z-10 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-650 via-[#FF6B00] to-amber-400" />
            
            <button 
              onClick={() => setShowPortalModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-lg transition"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-5 text-center pt-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF9A3C] flex items-center justify-center shadow">
                <Lock className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-black text-xl text-white">Biomedical Portal Entry</h3>
                <p className="text-slate-400 text-[11px] leading-relaxed max-w-sm mx-auto">
                  Sign in with unified corporate Google SSO credentials to log medical asset inventories, raise helpdesk support logs, or evaluate audit policies.
                </p>
              </div>

              {/* Real SSO Google single sign on */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-3 cursor-pointer bg-white hover:bg-slate-50 text-slate-900 transition-all border border-slate-200 shadow-xl disabled:opacity-50 active:scale-98"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.053h3.87c2.27-2.09 3.57-5.17 3.57-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.053c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.31v3.16C3.29 21.35 7.37 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.24 14.187C5 13.387 4.87 12.537 4.87 11.687s.13-1.7.37-2.5v-3.16H1.31C.47 7.737 0 9.657 0 11.687s.47 3.95 1.31 5.66l3.93-3.16z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.37 0 3.29 2.65 1.31 6.027l3.93 3.16c.95-2.88 3.61-5.01 6.76-5.01z"
                    />
                  </svg>
                )}
                <span className="font-bold">Google Enterprise SSO</span>
              </button>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl text-left text-[11px] text-rose-300 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-450" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-left text-[11px] text-emerald-300 flex gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="leading-relaxed">{infoMsg}</span>
                </div>
              )}

              {/* DEMO SANDBOX CREDENTIALS OR GUEST ROLES SIMULATORS */}
              <div className="pt-5 border-t border-slate-800/80">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-3 font-semibold">
                  Sandbox Trial Access & Guest Roles
                </span>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setShowPortalModal(false);
                      onExploreAsGuest("Admin");
                    }}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 p-2 text-slate-300 hover:text-white rounded-lg border border-slate-850 transition leading-none py-2.5 font-semibold text-[10px]"
                  >
                    Guest Admin
                  </button>
                  <button
                    onClick={() => {
                      setShowPortalModal(false);
                      onExploreAsGuest("Technician");
                    }}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 p-2 text-slate-300 hover:text-white rounded-lg border border-slate-850 transition leading-none py-2.5 font-semibold text-[10px]"
                  >
                    Tech Specialist
                  </button>
                  <button
                    onClick={() => {
                      setShowPortalModal(false);
                      onExploreAsGuest("Procurement");
                    }}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 p-2 text-slate-300 hover:text-white rounded-lg border border-slate-850 transition leading-none py-2.5 font-semibold text-[10px]"
                  >
                    Supply Officer
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}


      {/* ══ SLIDING SHOPPING CART DRAWER ══ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-[#1A1A2E] border-l border-slate-800 flex flex-col shadow-2xl">
              
              {/* Cart Head */}
              <div className="p-6 bg-slate-900 border-b-2 border-[#FF6B00] flex justify-between items-center">
                <span className="font-display font-bold text-lg text-white">Your Shopping Cart</span>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <ShoppingCart className="h-10 w-10 text-slate-650" />
                    <p className="text-slate-400 text-xs">Your cart is currently empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs font-mono text-[#FF9A3C] font-bold hover:underline"
                    >
                      Browse Biomedical Bookstore
                    </button>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex gap-3.5 items-start relative group"
                    >
                      <span className="text-2.5xl p-2 bg-slate-950 border border-slate-850 rounded-xl leading-none">
                        {item.product.emoji}
                      </span>
                      
                      <div className="flex-1 space-y-1 text-left">
                        <h4 className="font-display font-bold text-[#FFD08A] text-xs">
                          {item.product.name}
                        </h4>
                        <p className="font-display font-medium text-xs text-white">
                          ₹{item.product.price.toLocaleString("en-IN")}
                        </p>

                        <div className="flex items-center gap-2 pt-2 select-none">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-850"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs w-6 text-center font-bold text-white">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-850"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 rounded transition absolute right-3 top-3"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 bg-slate-900 border-t border-slate-850 space-y-5">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-400">Total Subtotal</span>
                    <span className="font-display font-black text-xl text-[#FF9A3C]">
                      ₹{getSubtotal().toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutSource("cart");
                      setShowCheckoutModal(true);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-red-650 to-[#FF6B00] hover:opacity-95 text-white font-display font-extrabold text-xs tracking-wider rounded-xl shadow-lg transition uppercase cursor-pointer"
                  >
                    Proceed to Booking Checkout →
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


      {/* ══ PRODUCT DETAILS VIEW MODAL ══ */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />
          
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6.5 max-w-md w-full relative overflow-hidden z-10 shadow-2xl">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-lg transition"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-4 text-left">
              <span className={`text-5xl block p-3 w-max bg-gradient-to-br ${selectedProduct.bg} rounded-2xl border`}>
                {selectedProduct.emoji}
              </span>

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-500 block leading-none">
                  {selectedProduct.cat} reference
                </span>
                <h3 className="font-display font-black text-xl text-[#FFD08A]">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-350 leading-relaxed pt-1">
                  {selectedProduct.desc}
                </p>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="font-display font-black text-2.5xl text-white">
                  ₹{selectedProduct.price.toLocaleString("en-IN")}
                </span>
                {selectedProduct.originalPrice && (
                  <span className="text-[#FF6B00]/40 font-mono line-through text-xs">
                    ₹{selectedProduct.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-850">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Box Specifications / Features
                </span>
                <ul className="space-y-2 text-xs text-slate-300 font-semibold">
                  {selectedProduct.features.map((feat, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-[#FF9A3C] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-3 bg-[#FF6B00] hover:bg-orange-500 text-white font-display font-bold text-xs tracking-wider rounded-xl transition shadow cursor-pointer active:scale-95"
                >
                  Add Component to Cart
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-3 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl transition border border-slate-850"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* ══ SERVICE BOOKING DIALOG MODAL ══ */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedService(null)} />
          
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6.5 max-w-md w-full relative overflow-hidden z-10 shadow-2xl">
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-lg transition"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-4 text-left font-semibold">
              <span className="text-4.5xl block">{selectedService.emoji}</span>
              
              <div>
                <h3 className="font-display font-black text-xl text-[#FFD08A]">
                  {selectedService.name}
                </h3>
                <p className="text-xs text-slate-400 leading-normal mt-1 font-medium">
                  {selectedService.desc}
                </p>
              </div>

              <div className="pt-2">
                <span className="font-display font-black text-2.5xl text-white block">
                  {selectedService.price}
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">{selectedService.period}</span>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-850 text-xs text-slate-350">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase">Included Modules</span>
                <ul className="space-y-2">
                  {selectedService.features.map((feat, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  setCheckoutSource("service");
                  setShowCheckoutModal(true);
                  setSelectedService(null);
                }}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-red-650 to-[#FF6B00] text-white font-display font-bold text-xs tracking-wider rounded-xl shadow transition cursor-pointer active:scale-95"
              >
                Confirm Booking & Check out →
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ══ INTEGRATED CHECKOUT DIALOG (MODAL) ══ */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowCheckoutModal(false)} />
          
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6.5 sm:p-8 max-w-lg w-full relative overflow-hidden z-10 shadow-2.5xl max-h-[90vh] overflow-y-auto subtle-scrollbar">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-lg transition"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-display font-black text-xl text-white text-left mb-6">
              Complete Diagnostic Sourcing
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs font-semibold text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px]">First Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ramesh"
                    value={checkoutForm.firstName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px]">Last Name</label>
                  <input 
                    type="text"
                    placeholder="Kumar"
                    value={checkoutForm.lastName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block">Corporate Email *</label>
                <input 
                  type="email"
                  required
                  placeholder="you@hospital.com"
                  value={checkoutForm.email}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block">WhatsApp / Billing Mobile</label>
                <input 
                  type="text"
                  placeholder="+91 98765 43210"
                  value={checkoutForm.phone}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium"
                />
              </div>

              {/* Indian payment gateway gateway message */}
              <div className="bg-orange-500/10 border border-orange-500/20 text-[#FFD08A] rounded-xl p-3.5 flex gap-2 items-start leading-normal text-[11px]">
                <Info className="h-4.5 w-4.5 shrink-0 text-[#FF9A3C] mt-0.5" />
                <span>
                  Razorpay & Stripe sandbox active. Test mock payments using common card configurations inside SunMedx India.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block">Credit / Debit Card</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-500">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <input 
                    type="text"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={checkoutForm.cardNumber}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, cardNumber: formatCardNumber(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 pl-10 pr-3 py-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px]">Expiry</label>
                  <input 
                    type="text"
                    maxLength={7}
                    placeholder="MM / YY"
                    value={checkoutForm.expiry}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, expiry: formatExpiry(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wide text-[10px]">CVV</label>
                  <input 
                    type="password"
                    maxLength={3}
                    placeholder="123"
                    value={checkoutForm.cvv}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value.replace(/[^0-9]/g, "") })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] transition font-medium font-mono"
                  />
                </div>
              </div>

              {/* Order summary block */}
              <div className="p-4 bg-orange-900/10 border border-orange-500/10 rounded-xl space-y-1 text-slate-300 font-medium">
                <div className="flex justify-between">
                  <span>Category Catalog</span>
                  <span className="text-[#FFD08A]">{checkoutSource === "cart" ? "Consumable Inventory" : "Certified Training Class"}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-850 font-bold text-white">
                  <span>Prereq Subtotal</span>
                  <span className="text-[#FF9A3C]">
                    {checkoutSource === "cart" ? `₹${getSubtotal().toLocaleString("en-IN")}` : "₹150"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-red-650 via-[#FF6B00] to-orange-500 hover:opacity-95 text-white font-display font-extrabold text-[#1A1A2E] text-xs tracking-widest uppercase rounded-xl transition cursor-pointer shadow-lg active:scale-95"
              >
                Secure Deposit & Pay
              </button>
              
              <p className="text-center text-[9px] text-slate-500 tracking-wider uppercase block">
                🔒 Secure checkout • SMS & WhatsApp billing confirmation sent instantly
              </p>
            </form>
          </div>
        </div>
      )}


      {/* ── CENTRAL FLOATING HEALING TOAST ── */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A2E] border-t-2 border-[#FF6B00] text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 transform translate-y-0 text-xs font-semibold tracking-wide animate-slideUp">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
