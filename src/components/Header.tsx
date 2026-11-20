import React, { useState } from "react";
import { 
  ShieldAlert, 
  User, 
  LogOut, 
  LogIn, 
  Activity,
  ChevronDown,
  Building2,
  Lock,
  Sun,
  Moon
} from "lucide-react";
import { auth } from "../lib/firebase";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser 
} from "firebase/auth";
import { UserRole } from "../types";

interface HeaderProps {
  user: FirebaseUser | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenCart: () => void;
  cartCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isGuest?: boolean;
  onSignOutRequest?: () => void;
}

export default function Header({ 
  user, 
  currentRole, 
  onRoleChange, 
  onOpenCart, 
  cartCount, 
  theme, 
  onToggleTheme,
  isGuest = false,
  onSignOutRequest
}: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Failed to authenticate. Try another password.";
      if (err.code === "auth/email-already-in-use" || (err.message && err.message.includes("email-already-in-use"))) {
        errMsg = "This corporate email address is already registered. Please click 'Already have an account? Sign In' at the bottom of this modal to log in.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" || (err.message && err.message.includes("invalid-credential"))) {
        errMsg = "Invalid email or password. If you haven't registered yet, click 'Need a hospital account? Register' below.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Use standard pre-configured demo account or sign in
      await signInWithEmailAndPassword(auth, "krishnadigitalai@gmail.com", "Sunmedx123!");
      setShowAuthModal(false);
    } catch (err: any) {
      // If user doesn't exist, try creating it first
      try {
        await createUserWithEmailAndPassword(auth, "krishnadigitalai@gmail.com", "Sunmedx123!");
        setShowAuthModal(false);
      } catch (signUpErr: any) {
        setError("Demo registration failed. Please sign up with your own email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (isGuest && onSignOutRequest) {
        onSignOutRequest();
      } else {
        await signOut(auth);
      }
      setShowDropdown(false);
    } catch (err) {
      console.error("Sign out fail", err);
    }
  };

  return (
    <header className={`border-b h-16 px-6 flex items-center justify-between sticky top-0 z-40 shadow-md transition-colors duration-200 ${
      theme === "light" 
        ? "bg-white border-slate-200 text-slate-800" 
        : "bg-slate-900 border-slate-800 text-white"
    }`}>
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <Activity className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <span className={`font-sans font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${
            theme === "light"
              ? "from-slate-900 to-indigo-600"
              : "from-white via-slate-100 to-indigo-400"
          }`}>
            SunMedx
          </span>
          <span className={`hidden sm:inline-block text-[10px] ml-2 font-mono tracking-widest uppercase px-2 py-0.5 rounded border ${
            theme === "light"
              ? "text-indigo-600 bg-indigo-50 border-indigo-200/50"
              : "text-indigo-400 bg-indigo-950/50 border-indigo-900/40"
          }`}>
            BME portal
          </span>
        </div>
      </div>

      {/* Header Actions / User Menu */}
      <div className="flex items-center space-x-4">
        {/* Shopping Cart button trigger */}
        <button 
          onClick={onOpenCart}
          className={`relative group p-2 rounded-lg transition-all duration-200 cursor-pointer ${
            theme === "light" ? "hover:bg-slate-100 text-slate-600" : "hover:bg-slate-800 text-slate-300 hover:text-white"
          }`}
          title="View Spares Cart"
          id="cart-trigger-btn"
        >
          <span className="sr-only">Cart</span>
          <svg className={`h-6 w-6 ${theme === "light" ? "text-slate-600 group-hover:text-indigo-600" : "text-slate-300 group-hover:text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {cartCount}
            </span>
          )}
        </button>

        {/* Theme Toggle button */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-lg transition-all duration-200 focus:outline-none cursor-pointer ${
            theme === "light" 
              ? "hover:bg-slate-100 text-amber-500 hover:text-amber-600" 
              : "hover:bg-slate-800 text-indigo-405 text-slate-300 hover:text-white"
          }`}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Daytime Office Mode (High-Contrast Light)"}
          id="theme-toggle-btn"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5 text-amber-400" />
          )}
        </button>

        {/* Active Role Quick Selector */}
        <div className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-2 shrink-0 select-none border ${
          theme === "light" 
            ? "bg-slate-50 border-slate-200" 
            : "bg-slate-950/60 border-slate-800/80"
        }`}>
          <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase font-semibold">RBAC SIM:</span>
          <select 
            value={currentRole} 
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-transparent text-xs text-indigo-400 font-semibold focus:outline-none cursor-pointer border-none p-0 pr-1 select-none"
            title="Switch Simulated User Role"
          >
            <option value="Admin" className="bg-slate-900 text-slate-200">Admin (Full Control)</option>
            <option value="Technician" className="bg-slate-900 text-slate-200">Technician</option>
            <option value="Procurement" className="bg-slate-900 text-slate-200">Procurement</option>
          </select>
        </div>

        {(user || isGuest) ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center space-x-2 p-1.5 rounded-xl transition duration-150 focus:outline-none cursor-pointer ${
                theme === "light" ? "hover:bg-slate-100" : "hover:bg-slate-800"
              }`}
              id="user-profile-menu-button"
            >
              <div className="bg-indigo-550/20 text-indigo-400 border border-indigo-800/60 font-medium text-xs rounded-xl h-8 w-8 flex items-center justify-center p-1">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:flex flex-col text-left text-xs">
                <span className={`font-medium max-w-[140px] truncate ${
                  theme === "light" ? "text-slate-800" : "text-slate-200"
                }`}>{user ? user.email : "demo.guest@sunmedx.com"}</span>
                <span className="text-[10px] text-indigo-400 font-semibold font-mono tracking-wide">
                  {currentRole === "Admin" ? "Chief Administrator" : currentRole === "Technician" ? "Clinical Bioengineer" : "Supply Chain Specialist"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            </button>

            {showDropdown && (
              <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-xl py-2 z-50 text-sm border transition-all duration-150 ${
                theme === "light" 
                  ? "bg-white border-slate-200 text-slate-800 shadow-slate-200/80" 
                  : "bg-slate-900 border-slate-800 text-slate-200 shadow-black/80"
              }`}>
                <div className={`px-4 py-2 border-b ${
                  theme === "light" ? "border-slate-200" : "border-slate-800"
                }`}>
                  <div className="flex items-center space-x-2 text-indigo-500 font-semibold text-xs mb-1">
                    <Building2 className="h-3 w-3" />
                    <span>Apex Medical Center</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate font-mono">{user ? user.email : "demo.guest@sunmedx.com"}</p>
                  
                  {/* Active Role status block inside user panel */}
                  <div className={`mt-2.5 p-2 rounded-lg border text-[11px] ${
                    theme === "light" 
                      ? "bg-slate-50 border-slate-200 text-slate-600" 
                      : "bg-slate-950 border-slate-800/60"
                  }`}>
                    <span className="text-slate-500 font-mono block uppercase text-[9px] font-bold">Access Scope</span>
                    <span className={`font-bold block mt-0.5 ${
                      theme === "light" ? "text-slate-900" : "text-white"
                    }`}>{currentRole} Status Acc</span>
                    <p className={`text-[10px] leading-relaxed mt-1 ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      {currentRole === "Admin" && "Full administrative permissions: View/Edit all hubs, pricing sheets, and 5-Yr calculators."}
                      {currentRole === "Technician" && "Limited Technical access: Lodge, manage & resolve clinical service tickets. Spares & budget restricted."}
                      {currentRole === "Procurement" && "Supply line access: Full spares store catalog & checkout privileges. Service & budget restricted."}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1">
                  <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                      theme === "light" 
                        ? "text-rose-600 hover:bg-rose-50" 
                        : "text-rose-400 hover:bg-rose-950/20"
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Sign Out Enterprise</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              setError("");
              setShowAuthModal(true);
            }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/25 active:scale-95"
            id="sign-in-btn"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Auth Modal Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-indigo-950/40 p-6 border-b border-slate-800 relative">
              <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                <Lock className="h-5 w-5" />
                <span className="text-xs font-mono tracking-widest uppercase">Biomedical Engineering Gate</span>
              </div>
              <h3 className="text-xl font-bold font-sans text-white">
                {isSignUp ? "Register BME portal Account" : "Access SunMedx Dashboard"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials or launch our pre-configured administrator sandbox.
              </p>
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuth} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs p-3 rounded-xl flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@hospital.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
                >
                  {loading ? "Authorizing..." : isSignUp ? "Create BME portal Account" : "Sign In Portal"}
                </button>
              </div>

              <div className="relative my-4 flex items-center items-stretch justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <span className="relative bg-slate-900 px-3 text-xs text-slate-500 font-mono">OR</span>
              </div>

              <div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDemoLogin}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2"
                >
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  <span>One-Click Admin Demo Mode</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  Logs in instantly as <span className="text-slate-400 font-mono">krishnadigitalai@gmail.com</span>
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Need a hospital account? Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
