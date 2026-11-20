import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Wrench, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  BadgeAlert,
  SlidersHorizontal,
  Building2,
  Calendar,
  Layers,
  FilePlus,
  Send,
  Sparkles
} from "lucide-react";
import { Asset, ServiceTicket, UserRole } from "../types";

interface AssetServiceHubProps {
  assets: Asset[];
  tickets: ServiceTicket[];
  onAddTicket: (ticket: Omit<ServiceTicket, "id" | "loggedAt" | "loggedBy">) => Promise<void>;
  onUpdateAssetStatus: (assetId: string, newStatus: Asset["status"]) => Promise<void>;
  userEmail: string | undefined;
  onAddAsset?: (asset: Omit<Asset, "id">) => Promise<void>;
  userRole?: UserRole;
}

export default function AssetServiceHub({ 
  assets, 
  tickets, 
  onAddTicket, 
  onUpdateAssetStatus, 
  userEmail,
  onAddAsset,
  userRole
}: AssetServiceHubProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Predictive Maintenance Threshold Setting state
  const [predictiveThreshold, setPredictiveThreshold] = useState<number>(() => {
    const stored = localStorage.getItem("bme_predictive_threshold");
    return stored ? parseInt(stored, 10) : 80;
  });

  const handleThresholdChange = (val: number) => {
    setPredictiveThreshold(val);
    localStorage.setItem("bme_predictive_threshold", val.toString());
  };

  // Predictive Alerts calculations
  const compromisedAssets = assets.filter(asset => {
    const usage = asset.usageHours || 0;
    const interval = asset.serviceInterval || 1000;
    const percent = (usage / interval) * 100;
    return percent >= predictiveThreshold;
  });

  // Service Ticket Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [ticketIssue, setTicketIssue] = useState("");
  const [ticketPriority, setTicketPriority] = useState<ServiceTicket["priority"]>("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Asset Commissioning Modal State (Admin Feeding Panel)
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetManufacturer, setAssetManufacturer] = useState("");
  const [assetDepartment, setAssetDepartment] = useState("Cardiology");
  const [assetSerialNumber, setAssetSerialNumber] = useState("");
  const [assetStatus, setAssetStatus] = useState<Asset["status"]>("Operational");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [calibrationDate, setCalibrationDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [contractType, setContractType] = useState<Asset["contractType"]>("CMC");
  const [contractExpiry, setContractExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [maintenanceCost, setMaintenanceCost] = useState(1250);
  const [location, setLocation] = useState("B-Wing, Room 402");

  // New Asset Commissioning input states
  const [assetUsageHours, setAssetUsageHours] = useState<number>(0);
  const [assetServiceInterval, setAssetServiceInterval] = useState<number>(1000);

  const departments = Array.from(new Set(assets.map(a => a.department)));
  
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === "all" || asset.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !ticketIssue.trim()) return;
    
    setSubmitting(true);
    setSuccessMsg("");

    const targetAsset = assets.find(a => a.id === selectedAssetId);
    if (!targetAsset) return;

    try {
      await onAddTicket({
        assetId: selectedAssetId,
        assetName: targetAsset.name,
        issue: ticketIssue,
        priority: ticketPriority,
        status: "Open"
      });

      // Automatically upgrade/set asset status to 'Under Maintenance' when a ticket is logged!
      await onUpdateAssetStatus(selectedAssetId, "Under Maintenance");

      setSuccessMsg(`Successfully logged compliance alert and service dispatch ticket for ${targetAsset.name}!`);
      // reset form
      setTicketIssue("");
      setTicketPriority("Medium");
      
      setTimeout(() => {
        setShowLogModal(false);
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetModel.trim() || !assetManufacturer.trim() || !assetSerialNumber.trim()) return;

    setSubmitting(true);
    setSuccessMsg("");

    try {
      if (onAddAsset) {
        await onAddAsset({
          name: assetName,
          model: assetModel,
          manufacturer: assetManufacturer,
          department: assetDepartment,
          serialNumber: assetSerialNumber,
          status: assetStatus,
          purchaseDate,
          calibrationDate,
          contractType,
          contractExpiry,
          maintenanceCost: Number(maintenanceCost) || 0,
          location,
          usageHours: Number(assetUsageHours) || 0,
          serviceInterval: Number(assetServiceInterval) || 1000
        });

        setSuccessMsg(`Successfully registered & commissioned ${assetName} (Serial: ${assetSerialNumber}) into ${assetDepartment}!`);
        
        // Reset states
        setAssetName("");
        setAssetModel("");
        setAssetManufacturer("");
        setAssetSerialNumber("");
        setAssetUsageHours(0);
        setAssetServiceInterval(1000);
        
        setTimeout(() => {
          setShowAssetModal(false);
          setSuccessMsg("");
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickCalibration = async (assetId: string) => {
    // Calibrating resets the status back to Operational and sets next year calibration
    try {
      await onUpdateAssetStatus(assetId, "Operational");
    } catch (err) {
      console.error("Failed to calibrate", err);
    }
  };

  const getStatusBadge = (status: Asset["status"]) => {
    switch (status) {
      case "Operational":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Operational</span>
          </span>
        );
      case "Under Maintenance":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-900/60 animate-pulse">
            <Wrench className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Under Servicing</span>
          </span>
        );
      case "Calibration Due":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-500 border border-amber-900/60">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Calibration Due</span>
          </span>
        );
      case "Out of Order":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-900/60 animate-pulse">
            <BadgeAlert className="h-3.5 w-3.5" />
            <span>Out of Order</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Header and Log triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight">
            Integrated Asset & Service Hub
          </h2>
          <p className="text-xs text-slate-400">
            Real-time physical asset logs, calibrator tracking, and technician dispatch boards.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {userRole === "Admin" && (
            <button
              onClick={() => setShowAssetModal(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-emerald-500/30 transition shadow-lg shadow-emerald-600/25 cursor-pointer whitespace-nowrap"
              id="commission-new-asset-btn"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Commission New Asset</span>
            </button>
          )}
          <button
            onClick={() => {
              if (assets.length > 0) {
                setSelectedAssetId(assets[0].id);
              }
              setShowLogModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl border border-indigo-500/30 transition shadow-lg shadow-indigo-600/25 cursor-pointer whitespace-nowrap"
            id="log-service-ticket-btn"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Log Service Ticket</span>
          </button>
        </div>
      </div>

      {/* Predictive Maintenance & Threshold settings panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl" id="predictive-maintenance-panel">
        <div className="bg-indigo-950/20 border-b border-slate-800/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <SlidersHorizontal className="h-4.5 w-4.5 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Predictive Maintenance & Compliance Engine</h3>
              <p className="text-[11px] text-slate-400">Trigger smart dispatch warnings when operational usage exceeds custom equipment-specific limits.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider">Predictive Status Active</span>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Slider and Configuration */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">Set Advisory Threshold</span>
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/60 rounded px-2.5 py-0.5">
                {predictiveThreshold}%
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Define the percentage of the manufacturer's recommended service interval where preventative safety procedures must be scheduled.
            </p>

            <div className="space-y-3 pt-1">
              <input 
                type="range"
                min="50"
                max="95"
                step="5"
                value={predictiveThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg outline-none"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
                <span>50% (Conservative)</span>
                <span>80% (Factory Std)</span>
                <span>95% (Maximum)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-mono">Preset Targets:</span>
              {[70, 80, 90].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleThresholdChange(preset)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition cursor-pointer border ${
                    predictiveThreshold === preset
                      ? "bg-amber-950/60 border-amber-800 text-amber-400 font-bold"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Warnings Log roll */}
          <div className="lg:col-span-7 bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between min-h-[140px]">
            {compromisedAssets.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-450 leading-none flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                    {compromisedAssets.length} Critical Alerts Exceeding Threshold
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Action mandatory</span>
                </div>

                <div className="max-h-[130px] overflow-y-auto space-y-2.5 subtle-scrollbar pr-1">
                  {compromisedAssets.map(asset => {
                    const usage = asset.usageHours || 0;
                    const interval = asset.serviceInterval || 1000;
                    const percent = Math.min(100, Math.round((usage / interval) * 100));
                    return (
                      <div key={asset.id} className="flex items-center justify-between bg-slate-900 border border-slate-850/60 p-2.5 rounded-lg">
                        <div className="space-y-0.5">
                          <p className="text-white text-xs font-semibold">{asset.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
                            <span>S/N: {asset.serialNumber}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-amber-400">{usage} hrs / {interval} hrs ({percent}%)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setTicketIssue(`Predictive Maintenance Alert: Run hours (${usage} Hrs) have exceeded the configured ${predictiveThreshold}% threshold of recommended interval (${interval} Hrs). Routine performance evaluation, valve seal diagnostics, and safety calibration are urgently required.`);
                            setTicketPriority(percent >= 100 ? "Critical" : "High");
                            setShowLogModal(true);
                          }}
                          className="bg-rose-950/50 text-rose-400 hover:bg-rose-900/40 border border-rose-900/30 text-[10px] px-2.5 py-1 rounded transition font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          <span>Dispatch Care</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-5 h-full space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">System Clinical Safety Restored</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm">
                    No active biomedical assets exceed your current {predictiveThreshold}% service window. All hardware units are performing efficiently.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Filtering Row */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Equipment name, Serial matching, or Model..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full md:w-auto flex-wrap gap-2.5 items-center">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Under Maintenance">Under Servicing</option>
            <option value="Calibration Due">Calibration Due</option>
            <option value="Out of Order">Out of Order</option>
          </select>
        </div>
      </div>

      {/* Main Asset Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto text-xs text-slate-300 subtle-scrollbar">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3 w-28">Asset ID</th>
                <th className="px-5 py-3">Equipment details</th>
                <th className="px-5 py-3">Deployment Dept</th>
                <th className="px-5 py-3">AMC/CMC contract</th>
                <th className="px-5 py-3">Calibration info</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Quick action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-950/35 transition-colors duration-150">
                    {/* ID */}
                    <td className="px-5 py-4 font-mono font-semibold text-slate-400">
                      {asset.id}
                    </td>
                    {/* Equipment Name & Brand */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-white text-sm">{asset.name}</p>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide font-mono">
                          {asset.manufacturer} · {asset.model}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] font-mono text-slate-400/85">
                        S/N: {asset.serialNumber}
                      </div>
                      
                      {/* Operational Usage progress tracker */}
                      <div className="mt-2.5 space-y-1 max-w-[200px]">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-slate-500">Service Hours</span>
                          <span className={`font-bold ${
                            (asset.usageHours || 0) >= ((asset.serviceInterval || 1000) * (predictiveThreshold / 100))
                              ? "text-amber-450"
                              : "text-slate-450"
                          }`}>
                            {asset.usageHours || 0} / {asset.serviceInterval || 1000} Hrs
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40 relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              (asset.usageHours || 0) >= ((asset.serviceInterval || 1000) * (predictiveThreshold / 100))
                                ? (asset.usageHours || 0) >= (asset.serviceInterval || 1000)
                                  ? "bg-rose-500 animate-pulse"
                                  : "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ 
                              width: `${Math.min(100, Math.round(((asset.usageHours || 0) / (asset.serviceInterval || 1000)) * 100))}%` 
                            }}
                          />
                        </div>
                        {(asset.usageHours || 0) >= ((asset.serviceInterval || 1000) * (predictiveThreshold / 100)) && (
                          <div className="flex items-center text-[9px] text-amber-500 font-mono gap-0.5 pt-0.5 animate-pulse font-bold">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Service limit triggered</span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Deployment Dept */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[150px]" title={asset.department}>
                          {asset.department}
                        </span>
                      </div>
                      <span className="text-[10px] block text-slate-500 font-mono">{asset.location}</span>
                    </td>
                    {/* AMC/CMC Tier */}
                    <td className="px-5 py-4">
                      {asset.contractType !== "None" ? (
                        <div>
                          <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            asset.contractType === "CMC" 
                              ? "bg-indigo-950 text-indigo-400 border border-indigo-900/50" 
                              : "bg-cyan-950 text-cyan-400 border border-cyan-900/50"
                          }`}>
                            {asset.contractType} COVERAGE
                          </span>
                          <span className="text-[10px] block text-slate-500 mt-1">Exp: {asset.contractExpiry}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono italic">No Coverage</span>
                      )}
                    </td>
                    {/* Calibration Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span className={asset.status === "Calibration Due" ? "text-amber-400 font-semibold" : ""}>
                          {asset.calibrationDate}
                        </span>
                      </div>
                      <span className="text-[10px] block text-slate-500 mt-1">Cost: ${asset.maintenanceCost}/Qtr</span>
                    </td>
                    {/* Status badge */}
                    <td className="px-5 py-4">
                      {getStatusBadge(asset.status)}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setShowLogModal(true);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer"
                          title="Lodge Support Alert"
                        >
                          Alert BME
                        </button>
                        {(asset.status === "Calibration Due" || asset.status === "Out of Order" || asset.status === "Under Maintenance") && (
                          <button
                            onClick={() => handleQuickCalibration(asset.id)}
                            className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                            title="Recalibrate equipment"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Validate PM</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 font-sans">
                    No matching clinical assets found. Adjust filters or search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Service Dispatch Logs panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Active Tech Dispatch Logs</h3>
            <p className="text-xs text-slate-400">Current work orders active in hospitals globally.</p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-800 py-1 px-2.5 rounded text-slate-450 border border-slate-700/50">
            {tickets.length} ACTIVE DISPATCHES
          </span>
        </div>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">{ticket.id}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase rounded px-1.5 py-0.5 ${
                      ticket.priority === "Critical" 
                        ? "bg-rose-950 text-rose-400 border border-rose-900/50" 
                        : ticket.priority === "High" 
                        ? "bg-orange-950 text-orange-400 border border-orange-900/50" 
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {ticket.priority} PRIOR
                    </span>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200 text-xs">{ticket.assetName}</h5>
                    <p className="text-slate-400 text-xs line-clamp-2 mt-1 italic">
                      "{ticket.issue}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[120px] font-mono">By: {ticket.loggedBy}</span>
                  <span className="flex items-center text-indigo-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{new Date(ticket.loggedAt).toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20 text-slate-500 text-xs font-mono">
            No active dispatches. Standard routines are running normally.
          </div>
        )}
      </div>

      {/* Service Ticket Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-indigo-950/40 p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Biomedical Operations Escalation
                </span>
                <h3 className="text-xl font-bold font-sans text-white">Log Live Service Dispatch</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">
              {successMsg && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs p-3.5 rounded-xl flex items-start space-x-2">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5 animate-pulse" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Select Affected Medical Asset
                </label>
                <select
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.manufacturer} - {asset.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Severity Priority Rating
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(["Low", "Medium", "High", "Critical"] as ServiceTicket["priority"][]).map(prio => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setTicketPriority(prio)}
                      className={`py-2 rounded-xl border font-semibold text-center transition cursor-pointer ${
                        ticketPriority === prio 
                          ? prio === "Critical"
                            ? "bg-rose-950/40 border-rose-800 text-rose-300 shadow"
                            : prio === "High"
                            ? "bg-orange-950/40 border-orange-850 text-orange-300 shadow"
                            : "bg-indigo-950/40 border-indigo-850 text-indigo-300 shadow"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Symptom & Engineering Issue Log
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe electrical leakage symptoms, suction blockages, pneumatic calibration errors, faulty displays, or power adapter failures..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Routing Alert..." : "Dispatch Technician"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Data Entry Feed / Asset Commissioning Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl my-8">
            <div className="bg-emerald-950/40 p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Corporate Administrative Operations
                </span>
                <h3 className="text-xl font-bold font-sans text-white">Commission New Clinical Asset</h3>
              </div>
              <button
                onClick={() => setShowAssetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="p-6 space-y-4">
              {successMsg && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs p-3.5 rounded-xl flex items-start space-x-2">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5 animate-pulse" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Grid 1: Equipment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Equipment/Asset Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Poliscan 3T MRI, Prisma Ventilator"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Manufacturer / Brand
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siemens Healthineers, Philips"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={assetManufacturer}
                    onChange={(e) => setAssetManufacturer(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid 2: Model and Serial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Equipment Model Name/Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ingenia-200, Classic V1"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={assetModel}
                    onChange={(e) => setAssetModel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Unique Serial Number (S/N)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-92841-B8"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={assetSerialNumber}
                    onChange={(e) => setAssetSerialNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid 3: Department and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Deployment Department
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer"
                    value={assetDepartment}
                    onChange={(e) => setAssetDepartment(e.target.value)}
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="ICU / Emergency">ICU / Emergency</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Facility Placement Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wing-B, Room 402"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid 4: Contract Cover & Core Cost */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Contract Protection Type
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as Asset["contractType"])}
                  >
                    <option value="CMC">CMC (Comprehensive)</option>
                    <option value="AMC">AMC (Annual)</option>
                    <option value="None">None (Ad-Hoc)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Contract Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={contractExpiry}
                    onChange={(e) => setContractExpiry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Quarterly Maintenance Est ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Grid 5: Status and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Establish Initial Status
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                    value={assetStatus}
                    onChange={(e) => setAssetStatus(e.target.value as Asset["status"])}
                  >
                    <option value="Operational">Operational</option>
                    <option value="Under Maintenance">Under Servicing</option>
                    <option value="Calibration Due">Calibration Due</option>
                    <option value="Out of Order">Out of Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Commission / Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Next Compliance Calibration
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={calibrationDate}
                    onChange={(e) => setCalibrationDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid 6: Run Usage Hours & Rec Service Interval */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Current Usage Accumulation (Hours)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="e.g. 500, 1200"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={assetUsageHours}
                    onChange={(e) => setAssetUsageHours(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Recommended Service Interval (Hours)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 1000, 2000"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={assetServiceInterval}
                    onChange={(e) => setAssetServiceInterval(Number(e.target.value) || 1000)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-350 px-4 py-2.5 rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Commissioning Unit..." : "Register & Feed Unit Data"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
