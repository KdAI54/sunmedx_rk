import React, { useState, useEffect } from "react";
import { Asset, SparePart, ServiceTicket, Course, CartItem, UserRole, PortalUser } from "./types";
import { getPortalSession, clearPortalSession } from "./lib/auth";
import { initialAssets, initialSpares, initialCourses } from "./data";

// Subcomponents
import Header from "./components/Header";
import Sidebar, { SidebarTab } from "./components/Sidebar";
import DashboardOverview from "./components/DashboardOverview";
import AssetServiceHub from "./components/AssetServiceHub";
import SparesStore from "./components/SparesStore";
import NabhCompliance from "./components/NabhCompliance";
import BudgetUpgradePlanner from "./components/BudgetUpgradePlanner";
import TrainingCertifications from "./components/TrainingCertifications";
import SystemActivityLogComp from "./components/SystemActivityLog";
import LoginPage from "./components/LoginPage";

import { ShieldAlert } from "lucide-react";

const PORTAL_ASSETS_KEY = "sunmedx_portal_assets";
const PORTAL_SPARES_KEY = "sunmedx_portal_spares";
const PORTAL_TICKETS_KEY = "sunmedx_portal_tickets";
const PORTAL_COURSES_KEY = "sunmedx_portal_courses";
const PORTAL_LOGS_KEY = "sunmedx_portal_logs";

export default function App() {
  const [user, setUser] = useState<PortalUser | null>(() => getPortalSession());

  // Core Data Collections
  const [assets, setAssets] = useState<Asset[]>([]);
  const [spares, setSpares] = useState<SparePart[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  // App UI Navigation State
  const [currentTab, setCurrentTab] = useState<SidebarTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Theme Switching State for Office Mode
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };
  
  // Enrolled Courses States
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  // Admin Core Configuration Settings (including GitHub Publishing instead of Firebase Hosting)
  const [settings, setSettings] = useState(() => {
    const defaults = {
      defaultUsefulLife: 7,
      highEndUsefulLife: 10,
      maintenanceAlertThreshold: 1000,
      calibrationIntervalMonths: 6,
      storeMarkupPercent: 0,
      qualityAuditStandard: "NABH 5th Edition (FMS)",
      publishingProvider: "github" as "github" | "firebase",
      githubOwner: "krishnadigitalai",
      githubRepo: "sunmedx-bme-portal",
      githubBranch: "main",
      githubCustomDomain: "",
      apiBaseUrl: ""
    };
    try {
      const saved = localStorage.getItem("sunmedx_admin_settings");
      if (saved) {
        return { ...defaults, ...JSON.parse(saved), publishingProvider: "github" as const };
      }
    } catch (e) {
      console.warn("Could not deserialize saved settings", e);
    }
    return defaults;
  });

  const handleUpdateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem("sunmedx_admin_settings", JSON.stringify(newSettings));
  };

  // 1. Portal Role synchronization
  const [userRole, setUserRole] = useState<UserRole>(() => getPortalSession()?.role || "Admin");

  useEffect(() => {
    if (user?.role) {
      setUserRole(user.role);
    } else {
      setUserRole("Admin");
    }
  }, [user]);

  // Tab allowance validator
  const checkIsTabAllowed = (role: UserRole, tab: SidebarTab): boolean => {
    if (role === "Admin") return true;
    if (role === "Technician") {
      return tab !== "spares" && tab !== "budget" && tab !== "logs";
    }
    if (role === "Procurement") {
      return tab !== "assets" && tab !== "compliance" && tab !== "budget" && tab !== "logs";
    }
    return true;
  };

  // Swaps simulated role in UI state
  const handleRoleChange = async (newRole: UserRole) => {
    setUserRole(newRole);

    // Move away from tab if newly unauthorized
    const allowed = checkIsTabAllowed(newRole, currentTab);
    if (!allowed) {
      setCurrentTab("dashboard");
    }
  };

  // 2. Portal dataset initialization (seeded from local defaults)
  useEffect(() => {
    try {
      const savedAssets = localStorage.getItem(PORTAL_ASSETS_KEY) || localStorage.getItem("sunmedx_guest_assets");
      const parsedAssets = savedAssets ? JSON.parse(savedAssets) : initialAssets;
      setAssets(Array.isArray(parsedAssets) && parsedAssets.length > 0 ? parsedAssets : initialAssets);

      const savedSpares = localStorage.getItem(PORTAL_SPARES_KEY) || localStorage.getItem("sunmedx_guest_spares");
      const parsedSpares = savedSpares ? JSON.parse(savedSpares) : initialSpares;
      setSpares(Array.isArray(parsedSpares) && parsedSpares.length > 0 ? parsedSpares : initialSpares);

      const savedTickets = localStorage.getItem(PORTAL_TICKETS_KEY) || localStorage.getItem("sunmedx_guest_tickets");
      setTickets(savedTickets ? JSON.parse(savedTickets) : []);

      const savedCourses = localStorage.getItem(PORTAL_COURSES_KEY) || localStorage.getItem("sunmedx_guest_courses");
      const parsedCourses = savedCourses ? JSON.parse(savedCourses) : initialCourses;
      setCourses(Array.isArray(parsedCourses) && parsedCourses.length > 0 ? parsedCourses : initialCourses);
    } catch (err) {
      console.warn("Portal cache load failed, restoring defaults:", err);
      setAssets(initialAssets);
      setSpares(initialSpares);
      setTickets([]);
      setCourses(initialCourses);
    }
  }, [user]);

  // Helper to append activity log entry to localStorage
  const appendPortalLog = (
    type: "asset" | "ticket" | "procurement",
    action: string,
    details: string,
    targetId: string,
    targetName: string
  ) => {
    try {
      const existing = JSON.parse(
        localStorage.getItem(PORTAL_LOGS_KEY) || localStorage.getItem("sunmedx_guest_logs") || "[]"
      );
      const newEntry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        action,
        details,
        targetId,
        targetName,
        userEmail: user?.email || "operator@sunmedx.com",
        userRole,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(PORTAL_LOGS_KEY, JSON.stringify([newEntry, ...existing].slice(0, 100)));
    } catch (err) {
      console.warn("Failed saving portal log:", err);
    }
  };

  // 3. Service Ticket Dispatch Trigger
  const handleAddTicket = async (ticketData: Omit<ServiceTicket, "id" | "loggedAt" | "loggedBy">) => {
    const operatorEmail = user?.email || "operator@sunmedx.com";
    const nowIso = new Date().toISOString();

    const newTicket: ServiceTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      ...ticketData,
      loggedBy: operatorEmail,
      loggedAt: nowIso
    };
    setTickets((prev) => {
      const next = [newTicket, ...prev];
      localStorage.setItem(PORTAL_TICKETS_KEY, JSON.stringify(next));
      return next;
    });
    appendPortalLog(
      "ticket",
      "New Service Ticket Logged",
      `Created ${ticketData.priority} priority ticket for ${ticketData.assetName}: "${ticketData.issue}".`,
      ticketData.assetId,
      ticketData.assetName
    );
  };

  // 4. Asset Status updater
  const handleUpdateAssetStatus = async (assetId: string, newStatus: Asset["status"]) => {
    const targetAsset = assets.find((a) => a.id === assetId);
    const assetName = targetAsset ? targetAsset.name : "Medical Asset";

    setAssets((prev) => {
      const next = prev.map((asset) => (asset.id === assetId ? { ...asset, status: newStatus } : asset));
      localStorage.setItem(PORTAL_ASSETS_KEY, JSON.stringify(next));
      return next;
    });
    appendPortalLog(
      "asset",
      "Asset Status Changed",
      `Active status of ${assetName} was updated to "${newStatus}".`,
      assetId,
      assetName
    );
  };

  // 4b. Admin Asset Registration/Data Entry
  const handleAddAsset = async (assetData: Omit<Asset, "id">) => {
    const customId = `AST-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAsset: Asset = { id: customId, ...assetData };

    setAssets((prev) => {
      const next = [...prev, newAsset];
      localStorage.setItem(PORTAL_ASSETS_KEY, JSON.stringify(next));
      return next;
    });
    appendPortalLog(
      "asset",
      "New Asset Commissioned",
      `Admin registered new corporate asset: ${assetData.name} (${assetData.manufacturer} ${assetData.model}) to ${assetData.department}.`,
      customId,
      assetData.name
    );
  };

  // 5. Commerce state: Add to Cart
  const handleAddToCart = (part: SparePart, quantity: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === part.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === part.id
            ? { ...item, quantity: Math.min(part.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prevCart, { id: part.id, product: part, quantity }];
    });
    setIsCartOpen(true);
  };

  // 6. Commerce state: Update quantity
  const handleUpdateCartQty = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // 7. Commerce state: Remove item
  const handleRemoveFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // 8. Commerce state: BME portal Checkout subtraction
  const handleCheckout = async () => {
    const checkedOutCart = [...cart];

    setSpares((prevSpares) => {
      const next = prevSpares.map((spare) => {
        const item = checkedOutCart.find((i) => i.id === spare.id);
        return item ? { ...spare, stock: Math.max(0, spare.stock - item.quantity) } : spare;
      });
      localStorage.setItem(PORTAL_SPARES_KEY, JSON.stringify(next));
      return next;
    });
    setCart([]);

    checkedOutCart.forEach((item) => {
      appendPortalLog(
        "procurement",
        "E-Commerce Checkout Completed",
        `Checked out ${item.quantity} unit(s) of compatible spare: ${item.product.name}. Stock updated to ${Math.max(0, item.product.stock - item.quantity)}.`,
        item.id,
        item.product.name
      );
    });
  };

  // 9. Course Enroll action
  const handleEnrollCourse = (courseId: string) => {
    if (!enrolledCourseIds.includes(courseId)) {
      setEnrolledCourseIds((prev) => [...prev, courseId]);
    }
  };

  // 9b. Dynamic AI Course Generation creation
  const handleAddCourse = async (courseData: Omit<Course, "id">) => {
    const customId = `CRS-${Math.floor(10000 + Math.random() * 90000)}`;
    const newCourse: Course = { id: customId, ...courseData };

    setCourses((prev) => {
      const next = [...prev, newCourse];
      localStorage.setItem(PORTAL_COURSES_KEY, JSON.stringify(next));
      return next;
    });
    appendPortalLog(
      "procurement",
      "Academy Course Generated",
      `Generated dynamic accreditation program: ${courseData.title} (${courseData.code}) focusing on target: ${courseData.level} skills.`,
      customId,
      courseData.title
    );
  };

  // Active view router based on Sidebar tab selection
  const renderMainContent = () => {
    // Intercept with secure lock screen if user attempts to bypass navigation and access a restricted tab
    const allowed = checkIsTabAllowed(userRole, currentTab);
    if (!allowed) {
      let suggestedRole: UserRole = "Admin";
      let restrictionDesc = "This portal module contains secure information or action scopes.";

      if (currentTab === "spares") {
        suggestedRole = "Procurement";
        restrictionDesc = "The e-commerce and spares procurement portal is reserved for Procurement managers and hospital system administrators.";
      } else if (currentTab === "budget") {
        suggestedRole = "Admin";
        restrictionDesc = "The 5-Year Capital Budget and life-expectancy replacement planner is exclusively reserved for Chief Administrators and clinical directors.";
      } else if (currentTab === "assets" || currentTab === "compliance") {
        suggestedRole = "Technician";
        restrictionDesc = "Active medical asset controls, calibration check-sheets, and quality compliance tools are reserved for Technicians and bioengineers.";
      } else if (currentTab === "logs") {
        suggestedRole = "Admin";
        restrictionDesc = "The real-time System Activity Log and internal bio-engineering audit trail is exclusively reserved for hospital Chief Administrators & IT Security Officers.";
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 max-w-xl mx-auto text-center select-none animate-fade-in bg-slate-900/40 border border-slate-900 rounded-3xl p-8 mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-rose-500/10 h-16 w-16 rounded-full blur-xl animate-pulse mx-auto" />
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-rose-500 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </div>
          
          <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 bg-rose-950/40 border border-rose-900/30 px-3 py-1 rounded-full uppercase">
            SECURE RBAC GATEWAY · RESTRICTED
          </span>

          <h3 className="text-xl font-bold font-sans text-white mt-4 tracking-tight">
            Elevated Scope Required
          </h3>
          
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
            {restrictionDesc} You are current browsing standard BME portal files as a <span className="text-indigo-400 font-mono font-bold">{userRole}</span>.
          </p>

          <div className="mt-8 bg-slate-950/70 border border-slate-900 p-4 rounded-2xl w-full text-left space-y-3">
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider text-center font-bold">
              Credentials Elevator Simulator
            </p>
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Change the active scope using the headers' dropdown, or simulate the authorized role directly below to view contents.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={() => handleRoleChange(suggestedRole)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl transition duration-150 text-center cursor-pointer font-sans"
              >
                Simulate {suggestedRole} Role
              </button>
              {suggestedRole !== "Admin" && (
                <button
                  onClick={() => handleRoleChange("Admin")}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs px-3.5 py-2.5 rounded-xl transition duration-150 text-center cursor-pointer font-sans"
                >
                  Simulate Admin Role
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardOverview 
            assets={assets} 
            onChangeTab={setCurrentTab} 
            userEmail={user?.email || undefined}
            userRole={userRole}
          />
        );
      case "assets":
        return (
          <AssetServiceHub 
            assets={assets} 
            tickets={tickets}
            onAddTicket={handleAddTicket}
            onUpdateAssetStatus={handleUpdateAssetStatus}
            userEmail={user?.email || undefined}
            onAddAsset={handleAddAsset}
            userRole={userRole}
          />
        );
      case "spares":
        return (
          <SparesStore 
            spares={spares}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckout}
            isCartOpen={isCartOpen}
            onCloseCart={() => setIsCartOpen(false)}
            markupPercent={settings.storeMarkupPercent}
          />
        );
      case "compliance":
        return (
          <NabhCompliance 
            userEmail={user?.email || undefined}
            qualityStandard={settings.qualityAuditStandard}
            apiBaseUrl={settings.apiBaseUrl}
          />
        );
      case "budget":
        return (
          <BudgetUpgradePlanner 
            assets={assets}
            defaultUsefulLife={settings.defaultUsefulLife}
            highEndUsefulLife={settings.highEndUsefulLife}
          />
        );
      case "training":
        return (
          <TrainingCertifications 
            courses={courses}
            enrolledCourseIds={enrolledCourseIds}
            onEnroll={handleEnrollCourse}
            userEmail={user?.email || undefined}
            onAddCourse={handleAddCourse}
            userRole={userRole}
            apiBaseUrl={settings.apiBaseUrl}
          />
        );
      case "logs":
        return (
          <SystemActivityLogComp 
            userRole={userRole}
            userEmail={user?.email || undefined}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            assets={assets}
            tickets={tickets}
            spares={spares}
            onRoleChange={setUserRole}
          />
        );
      default:
        return (
          <div className="text-center py-20 text-slate-500 text-xs">
            Module selection uninitialized.
          </div>
        );
    }
  };

  // Render standalone landing/sign-in page if unauthenticated
  if (!user) {
    return (
      <LoginPage
        theme={theme}
        onAuthSuccess={(portalUser) => {
          setUser(portalUser);
          setUserRole(portalUser.role);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
      theme === "light" 
        ? "light-theme bg-white text-slate-800" 
        : "bg-slate-950 text-slate-200"
    }`}>
      
      {/* 1. Global Header */}
      <Header 
        user={user} 
        currentRole={userRole}
        onRoleChange={handleRoleChange}
        onOpenCart={() => setIsCartOpen(true)} 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onAuthSuccess={(portalUser) => {
          setUser(portalUser);
          setUserRole(portalUser.role);
        }}
        onSignOutRequest={() => {
          clearPortalSession();
          setUser(null);
        }}
      />

      {/* 2. Main Dashboard panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* 2a. Collapsible Sidebar */}
        <Sidebar 
          currentTab={currentTab} 
          onChangeTab={setCurrentTab} 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={userRole}
        />

        {/* 2b. Scrollable Central Area view */}
        <main className={`flex-1 overflow-y-auto px-6 py-5 subtle-scrollbar transition-colors duration-200 ${
          theme === "light"
            ? "bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/50"
            : "bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60"
        }`}>
          {renderMainContent()}
        </main>

      </div>
    </div>
  );
}
