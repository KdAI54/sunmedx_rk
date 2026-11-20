import { 
  LayoutDashboard, 
  Wrench, 
  ShoppingBag, 
  FileCheck, 
  TrendingUp, 
  GraduationCap,
  Sparkles,
  Menu,
  ChevronLeft,
  ChevronRight,
  Lock,
  History
} from "lucide-react";
import { UserRole } from "../types";

export type SidebarTab = 
  | "dashboard" 
  | "assets" 
  | "spares" 
  | "compliance" 
  | "budget" 
  | "training"
  | "logs";

interface SidebarProps {
  currentTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
}

export default function Sidebar({ currentTab, onChangeTab, collapsed, onToggleCollapse, userRole }: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard" as SidebarTab,
      label: "Dashboard Overview",
      description: "Asset summary & metrics",
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: "assets" as SidebarTab,
      label: "Asset & Service Hub",
      description: "Medical equipment manager",
      icon: Wrench,
      badge: "10"
    },
    {
      id: "spares" as SidebarTab,
      label: "Spares Store",
      description: "Medical e-commerce",
      icon: ShoppingBag,
      badge: "8"
    },
    {
      id: "compliance" as SidebarTab,
      label: "NABH Compliance AI",
      description: "AI-powered quality auditor",
      icon: FileCheck,
      badge: "AI",
      isAi: true
    },
    {
      id: "budget" as SidebarTab,
      label: "Budget & Upgrade Planner",
      description: "5-year lifecycle calculator",
      icon: TrendingUp,
      badge: "5-Yr"
    },
    {
      id: "training" as SidebarTab,
      label: "Training & Certs",
      description: "Technician certification courses",
      icon: GraduationCap,
      badge: "4"
    },
    {
      id: "logs" as SidebarTab,
      label: "System Activity Log",
      description: "Real-time BME portal audit logs",
      icon: History,
      badge: "LIVE"
    }
  ];

  return (
    <aside 
      className={`bg-slate-950 border-r border-slate-900 text-slate-300 flex flex-col transition-all duration-300 select-none shrink-0 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Sidebar Header & Toggle */}
      <div className="h-16 border-b border-slate-900/60 px-4 flex items-center justify-between">
        {!collapsed && (
          <span className="text-xs uppercase font-mono tracking-widest text-slate-500 font-bold">
            Hospital Navigation
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition mx-auto"
          title={collapsed ? "Expand Side Menu" : "Collapse Side Menu"}
          id="sidebar-toggle-btn"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Sidebar Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          // Role-based allowance check
          let isAllowed = true;
          if (userRole === "Technician") {
            isAllowed = item.id !== "spares" && item.id !== "budget" && item.id !== "logs";
          } else if (userRole === "Procurement") {
            isAllowed = item.id !== "assets" && item.id !== "compliance" && item.id !== "budget" && item.id !== "logs";
          }

          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full group rounded-xl p-3 flex items-center text-left transition-all duration-200 relative ${
                isActive 
                  ? "bg-slate-900 text-white font-medium border border-slate-800 shadow-md shadow-indigo-500/[0.02]" 
                  : !isAllowed
                    ? "hover:bg-rose-950/10 text-slate-500 opacity-60 cursor-pointer"
                    : "hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
              }`}
              id={`sidebar-tab-${item.id}`}
            >
              <div className="flex items-center space-x-3 w-full">
                {/* Active Indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r" />
                )}

                <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-200 ${
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-900/60" 
                    : !isAllowed
                      ? "bg-slate-900 text-slate-600 border border-slate-950"
                      : "bg-slate-900/30 text-slate-500 group-hover:text-slate-300"
                }`}>
                  {isAllowed ? <Icon className="h-4 w-4 stroke-[2]" /> : <Lock className="h-4 w-4 stroke-[2] text-rose-500/80" />}
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate font-medium ${!isAllowed ? "text-slate-500 group-hover:text-rose-450 transition-colors" : ""}`}>
                        {item.label}
                      </p>
                      
                      {/* Interactive Badge display based on lock status */}
                      {item.badge && isAllowed && (
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                          item.isAi 
                            ? "bg-indigo-500 text-white animate-pulse" 
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      
                      {!isAllowed && (
                        <span className="text-[8px] font-mono font-bold tracking-wider text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded px-1.5 py-0.5 ml-1 shrink-0">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block font-sans">
                      {!isAllowed ? `Requires elevated ${item.id === "budget" ? "Admin" : item.id === "spares" ? "Procurement" : "Tech/Admin"} scope` : item.description}
                    </span>
                  </div>
                )}

                {collapsed && item.badge && isAllowed && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-mono py-px px-1 rounded bg-indigo-600 text-white font-bold scale-90">
                    {item.badge}
                  </span>
                )}
                
                {collapsed && !isAllowed && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-mono py-1 px-1 rounded bg-rose-950 text-rose-400 border border-rose-900/60 scale-90">
                    🔒
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Collapsed/Expanded bottom info bar */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80">
        {!collapsed ? (
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-900 flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-900/40 text-emerald-400 animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-300">Live Services</p>
              <span className="text-[10px] text-emerald-500 font-mono">ALL SYSTEMS ONLINE</span>
            </div>
          </div>
        ) : (
          <div className="h-4 w-4 mx-auto bg-emerald-500 rounded-full border border-black animate-pulse" title="Systems online" />
        )}
      </div>
    </aside>
  );
}
