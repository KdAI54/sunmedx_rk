import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  History, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Wrench,
  HelpCircle,
  Building2,
  Cpu
} from "lucide-react";
import { Asset } from "../types";

interface BudgetUpgradePlannerProps {
  assets: Asset[];
  defaultUsefulLife?: number;
  highEndUsefulLife?: number;
}

interface PlannerItem {
  id: string;
  name: string;
  brand: string;
  value: number;
  age: number; // in years
  usefulLife: number; // expected lifecycle in years (default 7 years for biomedical)
}

export default function BudgetUpgradePlanner({ 
  assets,
  defaultUsefulLife = 7,
  highEndUsefulLife = 10 
}: BudgetUpgradePlannerProps) {
  // Translate core Assets to PlannerItems dynamically
  const [items, setItems] = useState<PlannerItem[]>([]);
  // Projected trend visualization selector: Line, Cumulative Area, or Bar Chart
  const [chartView, setChartView] = useState<"line" | "area_cumulative" | "bar">("line");

  useEffect(() => {
    if (assets.length > 0) {
      const parsed = assets.map((asset) => {
        // Estimate asset value on typical clinical scale
        let estimatedValue = 18000;
        if (asset.name.includes("Ventilator")) estimatedValue = 42000;
        else if (asset.name.includes("Defibrillator")) estimatedValue = 9500;
        else if (asset.name.includes("C-Arm") || asset.name.includes("X-Ray")) estimatedValue = 115050;
        else if (asset.name.includes("Monitor")) estimatedValue = 5200;
        else if (asset.name.includes("Ultrasound")) estimatedValue = 88000;
        else if (asset.name.includes("Incubator")) estimatedValue = 18500;
        else if (asset.name.includes("Anesthesia")) estimatedValue = 31000;
        else if (asset.name.includes("Autoclave")) estimatedValue = 24000;

        // Estimate age based on purchase date (current time is June 2026)
        const purchaseYear = new Date(asset.purchaseDate).getFullYear();
        const age = Math.max(1, 2026 - purchaseYear);

        return {
          id: asset.id,
          name: asset.name,
          brand: asset.manufacturer,
          value: estimatedValue,
          age: age,
          usefulLife: asset.name.includes("X-Ray") || asset.name.includes("Anesthesia") ? highEndUsefulLife : defaultUsefulLife
        };
      });
      setItems(parsed);
    }
  }, [assets, defaultUsefulLife, highEndUsefulLife]);

  const handleUpdateItem = (id: string, field: keyof PlannerItem, value: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Compute 5-Year Replacement projection
  // An asset needs replacement when (age + year) >= usefulLife
  // Let's spread capital replacement requirements: if age+year == usefulLife, the full unit cost hits that year.
  const computeProjectedSpend = () => {
    const spend = [
      { name: "Y1 (2027)", Capex: 0, Cumulative: 0, count: 0 },
      { name: "Y2 (2028)", Capex: 0, Cumulative: 0, count: 0 },
      { name: "Y3 (2029)", Capex: 0, Cumulative: 0, count: 0 },
      { name: "Y4 (2030)", Capex: 0, Cumulative: 0, count: 0 },
      { name: "Y5 (2031)", Capex: 0, Cumulative: 0, count: 0 }
    ];

    items.forEach((item) => {
      const remainingLife = item.usefulLife - item.age;
      // If asset is already past usefulLife, it needs immediate replacement (Year 1)
      if (remainingLife <= 0) {
        spend[0].Capex += item.value;
        spend[0].count += 1;
      } else if (remainingLife >= 1 && remainingLife <= 5) {
        const yearIndex = Math.floor(remainingLife) - 1;
        if (spend[yearIndex]) {
          spend[yearIndex].Capex += item.value;
          spend[yearIndex].count += 1;
        }
      }
    });

    let cumulativeSum = 0;
    spend.forEach((item) => {
      cumulativeSum += item.Capex;
      item.Cumulative = cumulativeSum;
    });

    return spend;
  };

  const spendData = computeProjectedSpend();
  const total5YearSpend = spendData.reduce((sum, d) => sum + d.Capex, 0);

  // Generate customized recommendations
  const getRecommendations = () => {
    const recs: string[] = [];
    items.forEach((item) => {
      const remainingLife = item.usefulLife - item.age;
      const deprecRatio = item.age / item.usefulLife;

      if (remainingLife <= 0) {
        recs.push(`[CRITICAL] "${item.name} (${item.id})" has exceeded its useful lifecycle of ${item.usefulLife} years. Recommend urgent allocation of $${item.value.toLocaleString()} in the upcoming capital budget.`);
      } else if (remainingLife === 1) {
        recs.push(`[WARNING] "${item.name} (${item.brand} - S/N ${item.id})" will expire in 12 months. Flagged for phased depreciation reserves.`);
      } else if (deprecRatio >= 0.7) {
        recs.push(`[SOP Servicing] "${item.name}" is over 70% depreciated. Recommend AMC/CMC contract tier upgrade instead of replacement to protect remaining value.`);
      }
    });
    if (recs.length === 0) {
      recs.push("All systems are within optimal lifecycle bounds. No outstanding upgrade dispatches.");
    }
    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center space-x-2">
          <TrendingUp className="h-5.5 w-5.5 text-indigo-400" />
          <span>Biomedical Capital & Upgrade Planner</span>
        </h2>
        <p className="text-xs text-slate-400">
          Analyze lifecycle indicators, amortize capital medical machinery, and compute 5-year replacement capex structures.
        </p>
      </div>

      {/* Main interactive area: split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Asset parameter controls (7 Grid Columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Active Machinery Lifecycles</h3>
              <p className="text-[11px] text-slate-400">Adjust clinical valuation and machinery age parameters dynamically.</p>
            </div>
            <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900/40 text-indigo-400 font-mono">
              {items.length} ACTIVE
            </span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 subtle-scrollbar">
            {items.map((item) => {
              const remainingLife = item.usefulLife - item.age;
              const ratio = Math.min(100, Math.max(0, (item.age / item.usefulLife) * 100));
              
              let lifeStatusColor = "bg-emerald-500";
              if (item.age >= item.usefulLife) lifeStatusColor = "bg-rose-500 animate-pulse";
              else if (item.age / item.usefulLife >= 0.75) lifeStatusColor = "bg-amber-500";

              return (
                <div key={item.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h4 className="font-bold text-white text-xs">{item.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                        {item.brand} · ID: {item.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
                      <div>
                        <span>Est Value:</span>
                        <input
                          type="number"
                          className="bg-slate-900 border border-slate-800 text-slate-200 text-right w-16 px-1 rounded ml-1 text-[10px]"
                          value={item.value}
                          onChange={(e) => handleUpdateItem(item.id, "value", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <span>Age (Years):</span>
                        <input
                          type="number"
                          className="bg-slate-900 border border-slate-800 text-slate-200 text-right w-10 px-1 rounded ml-1 text-[10px]"
                          value={item.age}
                          min={1}
                          max={25}
                          onChange={(e) => handleUpdateItem(item.id, "age", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lifespan progress bar helper */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Age Span: {item.age} yrs / {item.usefulLife} yrs</span>
                      <span>
                        {remainingLife <= 0 
                          ? "EXPIRED Lifecycle" 
                          : `${remainingLife} years remaining`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${lifeStatusColor}`} style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Right Side: Projections (5 Grid Columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/40 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white tracking-tight">5-Year Capital Spending Reserve</h3>
              <p className="text-[11px] text-slate-450 leading-snug">Estimated spending required to replace clinical machines exceeding threshold limits.</p>
            </div>
            
            {/* Chart type switcher */}
            <div className="flex border border-slate-800 rounded-lg p-0.5 bg-slate-950 font-mono text-[9px] shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setChartView("line")}
                className={`px-2 py-1 rounded transition duration-150 cursor-pointer ${
                  chartView === "line" 
                    ? "bg-indigo-600 text-white font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Line Trend
              </button>
              <button
                type="button"
                onClick={() => setChartView("area_cumulative")}
                className={`px-2 py-1 rounded transition duration-150 cursor-pointer ${
                  chartView === "area_cumulative" 
                    ? "bg-indigo-650 text-white font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Cumulative Area
              </button>
              <button
                type="button"
                onClick={() => setChartView("bar")}
                className={`px-2 py-1 rounded transition duration-150 cursor-pointer ${
                  chartView === "bar" 
                    ? "bg-indigo-600 text-white font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Annual Bar
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block leading-none">Est. Required Reserve Budget</span>
              <span className="text-2xl font-extrabold text-indigo-400 tracking-tight leading-none font-mono">
                ${total5YearSpend.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-slate-455 text-right max-w-[120px] leading-tight font-mono">
              Total 5-Year BME portal amortization coverage
            </div>
          </div>

          {/* Recharts chart representation */}
          <div className="h-52 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "line" ? (
                <LineChart
                  data={spendData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#52525b" style={{ fontSize: "10px" }} />
                  <YAxis stroke="#52525b" style={{ fontSize: "10px" }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, "Year Capex Cost"]}
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                    labelStyle={{ color: "#71717a" }}
                    itemStyle={{ color: "#fafafa" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Capex" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }} 
                    dot={{ r: 4, strokeWidth: 2, stroke: "#4f46e5", fill: "#09090b" }}
                  />
                </LineChart>
              ) : chartView === "area_cumulative" ? (
                <AreaChart
                  data={spendData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#52525b" style={{ fontSize: "10px" }} />
                  <YAxis stroke="#52525b" style={{ fontSize: "10px" }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, "Cumulative Reserve"]}
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                    labelStyle={{ color: "#71717a" }}
                    itemStyle={{ color: "#fafafa" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Cumulative" 
                    stroke="#818cf8" 
                    fillOpacity={1} 
                    fill="url(#colorCumulative)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={spendData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#52525b" style={{ fontSize: "10px" }} />
                  <YAxis stroke="#52525b" style={{ fontSize: "10px" }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, "Capital Capex"]}
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                    labelStyle={{ color: "#71717a" }}
                    itemStyle={{ color: "#fafafa" }}
                  />
                  <Bar dataKey="Capex" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Upgrade & replacement recommendations list */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-850/70 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider block">
              Budgetary Recommendations Logs:
            </span>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 subtle-scrollbar text-[11px] leading-relaxed">
              {recommendations.map((rec, i) => {
                const isCrit = rec.includes("[CRITICAL]");
                const isWarn = rec.includes("[WARNING]");
                return (
                  <div 
                    key={i} 
                    className={`p-2 rounded-lg border flex items-start space-x-2 ${
                      isCrit 
                        ? "bg-rose-950/20 border-rose-900/40 text-rose-300" 
                        : isWarn
                        ? "bg-amber-950/20 border-amber-900/40 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-350"
                    }`}
                  >
                    {isCrit ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-450 shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-450 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span>{rec}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
