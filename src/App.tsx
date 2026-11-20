import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  writeBatch,
  getDoc,
  setDoc
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { db, auth, seedFirestoreDatabase, logSystemActivity } from "./lib/firebase";
import { Asset, SparePart, ServiceTicket, Course, CartItem, UserRole } from "./types";
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

import { Activity, ShieldAlert, Sparkles, Building2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // User authorization / session tracking for demo/guest sandboxes
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem("sunmedx_is_guest") === "true";
  });

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

  // 1. Firebase Authentication listener & Role synchronization
  const [userRole, setUserRole] = useState<UserRole>("Admin");
  const [roleSyncedForUid, setRoleSyncedForUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRoleSyncedForUid(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch or configure user role on authentication shifts
  useEffect(() => {
    if (!user) {
      if (isGuest) {
        const savedGuestRole = localStorage.getItem("sunmedx_guest_role") as UserRole;
        if (savedGuestRole) {
          setUserRole(savedGuestRole);
          return;
        }
      }
      setUserRole("Admin");
      return;
    }

    let cancelled = false;
    const fetchUserRole = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data && data.role && !cancelled) {
            setUserRole(data.role as UserRole);
            setRoleSyncedForUid(user.uid);
            return;
          }
        }

        // Default new authenticated portal users to Admin so database seeding & admin tools work immediately
        const defaultRole: UserRole = "Admin";
        if (!cancelled) {
          setUserRole(defaultRole);
        }

        await setDoc(userDocRef, {
          email: user.email || "operator@sunmedx.com",
          role: defaultRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: user.providerData?.[0]?.providerId === "google.com" ? "google" : "email"
        });
      } catch (err) {
        console.warn("Failed to retrieve or seed Firestore role, applying local default:", err);
        if (!cancelled) {
          setUserRole("Admin");
        }
      } finally {
        if (!cancelled) {
          setRoleSyncedForUid(user.uid);
        }
      }
    };

    fetchUserRole();
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

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

  // Swaps simulated role in UI state (without mutating protected Firestore role field)
  const handleRoleChange = async (newRole: UserRole) => {
    setUserRole(newRole);
    if (isGuest) {
      localStorage.setItem("sunmedx_guest_role", newRole);
    }

    // Move away from tab if newly unauthorized
    const allowed = checkIsTabAllowed(newRole, currentTab);
    if (!allowed) {
      setCurrentTab("dashboard");
    }
  };

  // 2. Database seeding and data synchronization (Firestore when signed in, localStorage/defaults for Guest)
  useEffect(() => {
    if (!user) {
      // Guest / unauthenticated mode: load local persisted or initial dataset so portal works cleanly without Firestore permission errors
      try {
        const savedAssets = localStorage.getItem("sunmedx_guest_assets");
        setAssets(savedAssets ? JSON.parse(savedAssets) : initialAssets);

        const savedSpares = localStorage.getItem("sunmedx_guest_spares");
        setSpares(savedSpares ? JSON.parse(savedSpares) : initialSpares);

        const savedTickets = localStorage.getItem("sunmedx_guest_tickets");
        setTickets(savedTickets ? JSON.parse(savedTickets) : []);

        const savedCourses = localStorage.getItem("sunmedx_guest_courses");
        setCourses(savedCourses ? JSON.parse(savedCourses) : initialCourses);
      } catch (err) {
        console.warn("Guest cache load failed, restoring defaults:", err);
        setAssets(initialAssets);
        setSpares(initialSpares);
        setTickets([]);
        setCourses(initialCourses);
      }
      setSeeding(false);
      return;
    }

    // Wait until user profile role doc is synced before seeding/attaching authenticated listeners
    if (roleSyncedForUid !== user.uid) {
      return;
    }

    let active = true;
    const runSeeder = async () => {
      setSeeding(true);
      try {
        await seedFirestoreDatabase();
      } catch (err) {
        console.warn("Seeder skipped or failed, proceeding with listeners:", err);
      } finally {
        if (active) {
          setSeeding(false);
        }
      }
    };
    runSeeder();

    // Setup Firestore synchronization for Clinical Assets
    const unsubscribeAssets = onSnapshot(
      collection(db, "assets"),
      (snapshot) => {
        const list: Asset[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Asset);
        });
        setAssets(list.length > 0 ? list : initialAssets);
      },
      (error) => {
        console.warn("Assets Firestore access throttled or offline, loading fallback:", error);
        setAssets((prev) => (prev.length > 0 ? prev : initialAssets));
      }
    );

    // Setup Firestore synchronization for Spare Parts catalog
    const unsubscribeSpares = onSnapshot(
      collection(db, "spares"),
      (snapshot) => {
        const list: SparePart[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as SparePart);
        });
        setSpares(list.length > 0 ? list : initialSpares);
      },
      (error) => {
        console.warn("Spares Firestore access throttled or offline:", error);
        setSpares((prev) => (prev.length > 0 ? prev : initialSpares));
      }
    );

    // Setup Firestore synchronization for Technical Service logs
    const unsubscribeTickets = onSnapshot(
      collection(db, "tickets"),
      (snapshot) => {
        const list: ServiceTicket[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ServiceTicket);
        });
        list.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
        setTickets(list);
      },
      (error) => {
        console.warn("Tickets Firestore access restricted:", error);
      }
    );

    // Setup Firestore synchronization for Training Courses catalog
    const unsubscribeCourses = onSnapshot(
      collection(db, "courses"),
      (snapshot) => {
        const list: Course[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Course);
        });
        setCourses(list.length > 0 ? list : initialCourses);
      },
      (error) => {
        console.warn("Courses Firestore access throttled:", error);
        setCourses((prev) => (prev.length > 0 ? prev : initialCourses));
      }
    );

    return () => {
      active = false;
      unsubscribeAssets();
      unsubscribeSpares();
      unsubscribeTickets();
      unsubscribeCourses();
    };
  }, [user, roleSyncedForUid]);

  // Helper to append guest activity log to localStorage when unauthenticated
  const appendGuestLog = (
    type: "asset" | "ticket" | "procurement",
    action: string,
    details: string,
    targetId: string,
    targetName: string
  ) => {
    try {
      const existing = JSON.parse(localStorage.getItem("sunmedx_guest_logs") || "[]");
      const newEntry = {
        id: `LOG-${Date.now()}`,
        type,
        action,
        details,
        targetId,
        targetName,
        userEmail: "guest.admin@sunmedx.com",
        userRole,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("sunmedx_guest_logs", JSON.stringify([newEntry, ...existing].slice(0, 100)));
    } catch (err) {
      console.warn("Failed saving guest log:", err);
    }
  };

  // 3. Service Ticket Dispatch Trigger
  const handleAddTicket = async (ticketData: Omit<ServiceTicket, "id" | "loggedAt" | "loggedBy">) => {
    const operatorEmail = user ? user.email || "operator@sunmedx.com" : "guest.admin@sunmedx.com";
    const nowIso = new Date().toISOString();

    if (!user) {
      const guestTicket: ServiceTicket = {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        ...ticketData,
        loggedBy: operatorEmail,
        loggedAt: nowIso
      };
      setTickets((prev) => {
        const next = [guestTicket, ...prev];
        localStorage.setItem("sunmedx_guest_tickets", JSON.stringify(next));
        return next;
      });
      appendGuestLog("ticket", "New Service Ticket Logged", `Created ${ticketData.priority} priority ticket for ${ticketData.assetName}: "${ticketData.issue}".`, ticketData.assetId, ticketData.assetName);
      return;
    }

    try {
      const ticketRef = doc(collection(db, "tickets"));
      await setDoc(ticketRef, {
        id: ticketRef.id,
        ...ticketData,
        loggedBy: operatorEmail,
        loggedAt: nowIso
      });

      // Real-time system activity logging
      await logSystemActivity(
        "ticket",
        "New Service Ticket Logged",
        `Created ${ticketData.priority} priority ticket for ${ticketData.assetName}: "${ticketData.issue}".`,
        ticketData.assetId,
        ticketData.assetName,
        operatorEmail,
        userRole
      );
    } catch (err) {
      console.error("Failed to write ticket:", err);
      // Fallback local logging
      const fallbackTicket: ServiceTicket = {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        ...ticketData,
        loggedBy: operatorEmail,
        loggedAt: new Date().toISOString()
      };
      setTickets((prev) => [fallbackTicket, ...prev]);
    }
  };

  // 4. Asset Status updater with Firestore synchronization
  const handleUpdateAssetStatus = async (assetId: string, newStatus: Asset["status"]) => {
    const operatorEmail = user ? user.email || "operator@sunmedx.com" : "guest.admin@sunmedx.com";
    const targetAsset = assets.find(a => a.id === assetId);
    const assetName = targetAsset ? targetAsset.name : "Medical Asset";

    if (!user) {
      setAssets((prev) => {
        const next = prev.map((asset) => asset.id === assetId ? { ...asset, status: newStatus } : asset);
        localStorage.setItem("sunmedx_guest_assets", JSON.stringify(next));
        return next;
      });
      appendGuestLog("asset", "Asset Status Changed", `Active status of ${assetName} was updated to "${newStatus}".`, assetId, assetName);
      return;
    }

    try {
      const assetRef = doc(db, "assets", assetId);
      await updateDoc(assetRef, { status: newStatus });

      // Real-time system activity logging
      await logSystemActivity(
        "asset",
        "Asset Status Changed",
        `Active status of ${assetName} was updated to "${newStatus}".`,
        assetId,
        assetName,
        operatorEmail,
        userRole
      );
    } catch (err) {
      console.warn("Failed to sync status update with Firestore, applying locally:", err);
      setAssets((prev) => 
        prev.map((asset) => asset.id === assetId ? { ...asset, status: newStatus } : asset)
      );
    }
  };

  // 4b. Admin Asset Registration/Data Entry
  const handleAddAsset = async (assetData: Omit<Asset, "id">) => {
    const operatorEmail = user ? user.email || "operator@sunmedx.com" : "guest.admin@sunmedx.com";
    const customId = `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!user) {
      const guestAsset: Asset = { id: customId, ...assetData };
      setAssets((prev) => {
        const next = [...prev, guestAsset];
        localStorage.setItem("sunmedx_guest_assets", JSON.stringify(next));
        return next;
      });
      appendGuestLog("asset", "New Asset Commissioned", `Admin registered new corporate asset: ${assetData.name} (${assetData.manufacturer} ${assetData.model}) to ${assetData.department}.`, customId, assetData.name);
      return;
    }

    try {
      const assetRef = doc(db, "assets", customId);
      await setDoc(assetRef, {
        id: customId,
        ...assetData,
      });

      // Real-time system activity logging
      await logSystemActivity(
        "asset",
        "New Asset Commissioned",
        `Admin registered new corporate asset: ${assetData.name} (${assetData.manufacturer} ${assetData.model}) to ${assetData.department}.`,
        customId,
        assetData.name,
        operatorEmail,
        userRole
      );
    } catch (err) {
      console.error("Failed to add asset:", err);
      const fallbackAsset: Asset = {
        id: customId,
        ...assetData
      };
      setAssets((prev) => [...prev, fallbackAsset]);
    }
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
      prevCart.map((item) => item.id === id ? { ...item, quantity } : item)
    );
  };

  // 7. Commerce state: Remove item
  const handleRemoveFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // 8. Commerce state: BME portal Checkout subtraction directly in Database
  const handleCheckout = async () => {
    const operatorEmail = user ? user.email || "operator@sunmedx.com" : "guest.admin@sunmedx.com";
    const checkedOutCart = [...cart];

    if (!user) {
      setSpares((prevSpares) => {
        const next = prevSpares.map((spare) => {
          const item = cart.find((i) => i.id === spare.id);
          return item ? { ...spare, stock: Math.max(0, spare.stock - item.quantity) } : spare;
        });
        localStorage.setItem("sunmedx_guest_spares", JSON.stringify(next));
        return next;
      });
      setCart([]);
      checkedOutCart.forEach((item) => {
        appendGuestLog(
          "procurement",
          "E-Commerce Checkout Completed",
          `Checked out ${item.quantity} unit(s) of compatible spare: ${item.product.name}. Stock updated to ${Math.max(0, item.product.stock - item.quantity)}.`,
          item.id,
          item.product.name
        );
      });
      return;
    }

    try {
      const batch = writeBatch(db);
      
      for (const item of cart) {
        const spareRef = doc(db, "spares", item.id);
        const newStock = Math.max(0, item.product.stock - item.quantity);
        batch.update(spareRef, { stock: newStock });
      }

      await batch.commit();
      setCart([]); // Clear cart

      // Post-checkout real-time system activity logging for all purchased spares
      for (const item of checkedOutCart) {
        await logSystemActivity(
          "procurement",
          "E-Commerce Checkout Completed",
          `Checked out ${item.quantity} unit(s) of compatible spare: ${item.product.name}. Stock updated to ${Math.max(0, item.product.stock - item.quantity)}.`,
          item.id,
          item.product.name,
          operatorEmail,
          userRole
        );
      }
    } catch (err) {
      console.warn("Failed to checkout with Firestore, applying local subtraction:", err);
      setSpares((prevSpares) => 
        prevSpares.map((spare) => {
          const item = cart.find((i) => i.id === spare.id);
          if (item) {
            return { ...spare, stock: Math.max(0, spare.stock - item.quantity) };
          }
          return spare;
        })
      );
      setCart([]);
    }
  };

  // 9. Course Enroll action
  const handleEnrollCourse = (courseId: string) => {
    if (!enrolledCourseIds.includes(courseId)) {
      setEnrolledCourseIds((prev) => [...prev, courseId]);
    }
  };

  // 9b. Dynamic AI Course Generation creation
  const handleAddCourse = async (courseData: Omit<Course, "id">) => {
    const operatorEmail = user ? user.email || "operator@sunmedx.com" : "guest.admin@sunmedx.com";
    const customId = `CRS-${Math.floor(10000 + Math.random() * 90000)}`;

    if (!user) {
      const guestCourse: Course = { id: customId, ...courseData };
      setCourses((prev) => {
        const next = [...prev, guestCourse];
        localStorage.setItem("sunmedx_guest_courses", JSON.stringify(next));
        return next;
      });
      appendGuestLog("procurement", "Academy Course Generated", `Generated dynamic accreditation program: ${courseData.title} (${courseData.code}) focusing on target: ${courseData.level} skills.`, customId, courseData.title);
      return;
    }

    try {
      const courseRef = doc(db, "courses", customId);
      await setDoc(courseRef, {
        id: customId,
        ...courseData,
      });

      // Log system activity audit log
      await logSystemActivity(
        "procurement",
        "Academy Course Generated",
        `Generated dynamic accreditation program: ${courseData.title} (${courseData.code}) focusing on target: ${courseData.level} skills.`,
        customId,
        courseData.title,
        operatorEmail,
        userRole
      );
    } catch (err) {
      console.error("Failed to append dynamic course to Firestore, running fallback:", err);
      const fallbackCourse: Course = {
        id: customId,
        ...courseData
      };
      setCourses((prevCourseList) => [...prevCourseList, fallbackCourse]);
    }
  };

  // Loading Screen for Auth & Database seeding
  if (loading || seeding) {
    return (
      <div className="bg-slate-950 h-screen w-screen flex flex-col items-center justify-center text-slate-300 select-none">
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 bg-indigo-600/10 h-20 w-20 rounded-full blur-xl animate-pulse" />
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl animate-spin text-indigo-500" style={{ animationDuration: "3s" }}>
            <Activity className="h-10 w-10 stroke-[2]" />
          </div>
        </div>
        <div className="mt-6 text-center space-y-2">
          <h1 className="font-sans font-bold text-lg text-white tracking-widest uppercase">SunMedx Services</h1>
          <p className="text-xs text-indigo-400 font-mono tracking-wider">
            {seeding ? "POPULATING BIOMEDICAL FIREBASE STATE..." : "AUTHORIZING BME PORTAL CREDENTIALS..."}
          </p>
        </div>
      </div>
    );
  }

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

  // Render pristine standalone login page if unauthenticated and not in Guest evaluation mode
  if (!user && !isGuest) {
    return (
      <LoginPage 
        theme={theme}
        onExploreAsGuest={(selectedRole) => {
          setIsGuest(true);
          localStorage.setItem("sunmedx_is_guest", "true");
          const role = selectedRole || "Admin";
          setUserRole(role);
          localStorage.setItem("sunmedx_guest_role", role);
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
        isGuest={isGuest}
        onSignOutRequest={() => {
          setIsGuest(false);
          localStorage.removeItem("sunmedx_is_guest");
          localStorage.removeItem("sunmedx_guest_role");
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
