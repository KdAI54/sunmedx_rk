import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle 
} from "lucide-react";
import { Asset, UserRole } from "../types";

interface DashboardOverviewProps {
  assets: Asset[];
  onChangeTab: (tab: "dashboard" | "assets" | "spares" | "compliance" | "budget" | "training") => void;
  userEmail: string | undefined;
  userRole: UserRole;
}

export default function DashboardOverview({ assets, onChangeTab, userEmail, userRole }: DashboardOverviewProps) {
  // 1. Calculations based on active medical assets
  const totalAssets = assets.length;
  const pendingCalibrations = assets.filter(a => a.status === "Calibration Due" || a.status === "Out of Order").length;
  const activeContracts = assets.filter(a => a.contractType === "AMC" || a.contractType === "CMC").length;
  
  const totalMaintenanceQuarterly = assets.reduce((sum, a) => sum + a.maintenanceCost, 0);

  // Group maintenance cost by department for the pie chart
  const deptCostMap: Record<string, number> = {};
  assets.forEach(a => {
    const dept = a.department || "General";
    deptCostMap[dept] = (deptCostMap[dept] || 0) + a.maintenanceCost;
  });

  const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"];
  const departmentPieData = Object.entries(deptCostMap).map(([name, value]) => ({
    name,
    value
  }));

  // Standard spend trend over recent quarters (styled beautifully for Recharts)
  const maintenanceTrendsData = [
    { quarter: "Q1-25", "SOP Preventative": 12000, "Emergency Repair": 4800, Total: 16800 },
    { quarter: "Q2-25", "SOP Preventative": 13800, "Emergency Repair": 5500, Total: 19300 },
    { quarter: "Q3-25", "SOP Preventative": 14500, "Emergency Repair": 7200, Total: 21700 },
    { quarter: "Q4-25", "SOP Preventative": 16000, "Emergency Repair": 3900, Total: 19900 },
    { quarter: "Q1-26", "SOP Preventative": totalMaintenanceQuarterly * 0.7, "Emergency Repair": totalMaintenanceQuarterly * 0.3, Total: totalMaintenanceQuarterly }
  ];

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Welcome Hero / Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 bg-indigo-600/10 h-64 w-64 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10 space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">enterprise Medical dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome to SunMedx, BME portal
          </h2>
          <p className="text-sm text-slate-400 max-w-xl">
            {userEmail 
              ? `Authorized access granted for ${userEmail}. Monitoring hospital clinical assets and accreditation requirements.` 
              : "Demo mode active. Access restricted to preview. Sign in to edit records, lodge live support tickets, or order parts."}
          </p>
        </div>
        <div className="z-10 shrink-0">
          <button 
            onClick={() => onChangeTab("compliance")}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl border border-indigo-500/30 flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <Activity className="h-4 w-4 shrink-0 animate-pulse text-indigo-200" />
            <span>Launch NABH Audit AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Numerical Metrics Cards (Bento style grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4 relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
          <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-900/40 text-indigo-400">
            <Activity className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-mono">Total Clinical Assets</span>
            <p className="text-3xl font-extrabold text-white leading-tight font-mono">{totalAssets}</p>
            <span className="text-[10px] text-emerald-500 flex items-center font-medium">
              <TrendingUp className="h-3 w-3 mr-1" /> 100% Accounted
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-900/40 text-amber-500">
            <Calendar className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-mono">Pending Calibration</span>
            <p className="text-3xl font-extrabold text-white leading-tight font-mono">{pendingCalibrations}</p>
            <span className={`text-[10px] flex items-center font-medium ${pendingCalibrations > 0 ? "text-amber-500" : "text-emerald-500"}`}>
              {pendingCalibrations > 0 ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
              {pendingCalibrations > 0 ? "Requires technician dispatch" : "All devices certified"}
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-900/40 text-emerald-400">
            <ShieldCheck className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-mono">Active AMC / CMC</span>
            <p className="text-3xl font-extrabold text-white leading-tight font-mono">{activeContracts}</p>
            <span className="text-[10px] text-slate-400 font-medium">
              Contracts active this fiscal
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
          <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-900/40 text-cyan-400">
            <DollarSign className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-mono">Quarterly Maintenance Spend</span>
            <p className="text-3xl font-extrabold text-white leading-tight font-mono">
              ${totalMaintenanceQuarterly.toLocaleString()}
            </p>
            <span className="text-[10px] text-cyan-400 font-mono">
              Active medical parts & servicing
            </span>
          </div>
        </div>
      </div>

      {/* Analytics & Recharts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spend Line Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-8 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Maintenance Spending Trends</h3>
              <p className="text-xs text-slate-400">Comparing routine preventive PM vs emergency downtime calibration</p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-2 bg-indigo-950 text-indigo-400 rounded border border-indigo-900/50">
              Biomedical Budget
            </span>
          </div>

          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={maintenanceTrendsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="quarter" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} 
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Legend />
                <Area type="monotone" dataKey="SOP Preventative" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPM)" />
                <Area type="monotone" dataKey="Emergency Repair" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorEmergency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Allocation Pie */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-4 flex flex-col h-[340px]">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Servicing Cost Allocation</h3>
            <p className="text-xs text-slate-400">Total quarterly spend shared by clinical department</p>
          </div>

          {departmentPieData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative mt-2">
              <div className="w-full h-[180px] text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {departmentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value}`, "Maintenance Cost"]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends */}
              <div className="w-full max-h-[100px] overflow-y-auto px-2 mt-1 subtle-scrollbar text-[10px] space-y-1">
                {departmentPieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-slate-400">
                    <div className="flex items-center space-x-1.5 truncate mr-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-semibold shrink-0">
                      ${entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs text-center flex-1 flex items-center justify-center">No cost allocation data.</p>
          )}
        </div>
      </div>

      {/* Equipment Status Summary banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick action: Store */}
        <div 
          onClick={() => onChangeTab("spares")}
          className={`p-5 rounded-2xl bg-slate-900 border ${userRole === "Technician" ? "border-rose-900/40 hover:border-rose-800" : "border-slate-800 hover:border-slate-700"} cursor-pointer flex items-center justify-between group transition duration-200`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Procure Spares & Consumables</h4>
              {userRole === "Technician" && (
                <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded px-1.5 py-0.5">
                  🔒 LOCKED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Order replacements parts, ECG probes, AED lithium batteries directly.</p>
          </div>
          <div className="bg-slate-800 p-2 rounded-lg text-slate-400 group-hover:text-white transition">
            ➔
          </div>
        </div>

        {/* Quick action: Budget Planner */}
        <div 
          onClick={() => onChangeTab("budget")}
          className={`p-5 rounded-2xl bg-slate-900 border ${userRole !== "Admin" ? "border-rose-900/40 hover:border-rose-800" : "border-slate-800 hover:border-slate-700"} cursor-pointer flex items-center justify-between group transition duration-200`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Smart Equipment Replacement Calculator</h4>
              {userRole !== "Admin" && (
                <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded px-1.5 py-0.5">
                  🔒 ADMIN ONLY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Evaluate dynamic life expectancies, amortization cycles, and budget schedules.</p>
          </div>
          <div className="bg-slate-800 p-2 rounded-lg text-slate-400 group-hover:text-white transition">
            ➔
          </div>
        </div>
      </div>
    </div>
  );
}
