import React, { useState, useEffect } from "react";
import { SystemActivityLog, UserRole, SunmedxCompanyInfo } from "../types";
import { DEFAULT_COMPANY_INFO } from "../lib/companyInfo";
import { 
  History, 
  Filter, 
  Search, 
  Wrench, 
  ShoppingBag, 
  Layers, 
  Play, 
  Trash2, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Database,
  CheckCircle,
  AlertTriangle,
  User,
  Activity,
  Sliders,
  Shield,
  FileCheck,
  Check,
  Lock,
  Plus,
  GitBranch,
  Globe,
  Copy,
  Download,
  ExternalLink,
  Terminal,
  Server,
  Building2,
  RotateCcw,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface SystemActivityLogProps {
  userRole: UserRole;
  userEmail: string | undefined;
  settings: {
    defaultUsefulLife: number;
    highEndUsefulLife: number;
    maintenanceAlertThreshold: number;
    calibrationIntervalMonths: number;
    storeMarkupPercent: number;
    qualityAuditStandard: string;
    publishingProvider?: "github" | "firebase";
    githubOwner?: string;
    githubRepo?: string;
    githubBranch?: string;
    githubCustomDomain?: string;
    apiBaseUrl?: string;
  };
  onUpdateSettings: (settings: any) => void;
  companyInfo?: SunmedxCompanyInfo;
  onUpdateCompanyInfo?: (info: SunmedxCompanyInfo) => void;
  onResetCompanyInfo?: () => void;
  assets?: any[];
  tickets?: any[];
  spares?: any[];
  onRoleChange?: (role: UserRole) => void;
}

export default function SystemActivityLogComp({ 
  userRole, 
  userEmail,
  settings,
  onUpdateSettings,
  companyInfo = DEFAULT_COMPANY_INFO,
  onUpdateCompanyInfo,
  onResetCompanyInfo,
  assets = [],
  tickets = [],
  spares = [],
  onRoleChange
}: SystemActivityLogProps) {
  const [logs, setLogs] = useState<SystemActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "asset" | "ticket" | "procurement">("all");
  const [filterRole, setFilterRole] = useState<"all" | "Admin" | "Technician" | "Procurement">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  
  // Tab control: "logs" | "policies" | "company" | "publishing" | "sandbox" | "roles"
  const [activeTab, setActiveTab] = useState<"logs" | "policies" | "company" | "publishing" | "sandbox" | "roles">("logs");
  const [tempSettings, setTempSettings] = useState({ ...settings });
  const [tempCompanyInfo, setTempCompanyInfo] = useState<SunmedxCompanyInfo>({ ...companyInfo });
  const [companySuccessMessage, setCompanySuccessMessage] = useState("");
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");
  const [publishingSuccessMessage, setPublishingSuccessMessage] = useState("");
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [sandboxSuccessMessage, setSandboxSuccessMessage] = useState("");

  // Sync temp settings & company info state when core props change
  useEffect(() => {
    setTempSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    setTempCompanyInfo({ ...companyInfo });
  }, [companyInfo]);

  const LOGS_STORAGE_KEY = "sunmedx_portal_logs";

  const appendLocalLogEntry = (entry: Omit<SystemActivityLog, "id">) => {
    const newLog: SystemActivityLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...entry
    };
    setLogs((prev) => {
      const next = [newLog, ...prev].slice(0, 100);
      try {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save portal log:", e);
      }
      return next;
    });
  };

  // Load portal activity logs from localStorage (seeded with initial audit trail if empty)
  useEffect(() => {
    setLoading(true);
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY) || localStorage.getItem("sunmedx_guest_logs");
      if (saved) {
        setLogs(JSON.parse(saved));
      } else {
        const seededLogs: SystemActivityLog[] = [
          {
            id: "LOG-INIT-1",
            type: "asset",
            action: "Asset Status Changed",
            details: "MRI Scanner 3T status was verified as Operational.",
            targetId: "AST-4401",
            targetName: "MRI Scanner 3T",
            userEmail: userEmail || "admin@sunmedx.com",
            userRole: "Admin",
            timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString()
          },
          {
            id: "LOG-INIT-2",
            type: "ticket",
            action: "New Service Ticket Logged",
            details: "Reported calibration drift in Patient Monitor S12.",
            targetId: "TCK-8820",
            targetName: "Patient Monitor S12",
            userEmail: "bio.tech1@sunmedx.com",
            userRole: "Technician",
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "LOG-INIT-3",
            type: "procurement",
            action: "E-Commerce Checkout Completed",
            details: "Checked out 4 units of AED Lithium Battery Pack.",
            targetId: "SPR-9092",
            targetName: "AED Lithium Battery Pack",
            userEmail: "sc.procure@sunmedx.com",
            userRole: "Procurement",
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
          }
        ];
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(seededLogs));
        setLogs(seededLogs);
      }
    } catch (e) {
      setLogs([]);
    }
    setLoading(false);
  }, [userEmail]);

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === "all" || log.type === filterType;
    const matchesRole = filterRole === "all" || log.userRole === filterRole;
    
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      (log.action || "").toLowerCase().includes(queryLower) ||
      (log.details || "").toLowerCase().includes(queryLower) ||
      (log.targetName || "").toLowerCase().includes(queryLower) ||
      (log.targetId || "").toLowerCase().includes(queryLower) ||
      (log.userEmail || "").toLowerCase().includes(queryLower);

    return matchesType && matchesRole && matchesSearch;
  });

  // Calculate Metrics
  const totalCount = logs.length;
  const assetCount = logs.filter(l => l.type === "asset").length;
  const ticketCount = logs.filter(l => l.type === "ticket").length;
  const procurementCount = logs.filter(l => l.type === "procurement").length;

  // Real-time operator calculation
  const actorMap: Record<string, number> = {};
  logs.forEach(l => {
    if (l.userEmail) {
      actorMap[l.userEmail] = (actorMap[l.userEmail] || 0) + 1;
    }
  });
  let mostActiveActor = "No logs yet";
  let maxCount = 0;
  Object.entries(actorMap).forEach(([email, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveActor = email;
    }
  });

  // Trigger quick manual log simulation
  const simulateLog = async (type: "asset" | "ticket" | "procurement") => {
    setIsSimulating(type);
    const nowStr = new Date().toISOString();
    let logPayload: Omit<SystemActivityLog, "id">;

    if (type === "asset") {
      const sampleAssets = [
        { name: "MRI Scanner 3T", id: "AST-4401" },
        { name: "Patient Monitor S12", id: "AST-9021" },
        { name: "ECG Machine Mac5", id: "AST-1082" },
        { name: "AED Defibrillator Unit", id: "AST-7756" }
      ];
      const selected = sampleAssets[Math.floor(Math.random() * sampleAssets.length)];
      const statuses = ["Operational", "Under Maintenance", "Calibration Due", "Out of Order"] as const;
      const targetStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      logPayload = {
        type: "asset",
        action: "Simulated Calibration Check",
        details: `Ran automated drift calibration check on ${selected.name} (${selected.id}). Operating status registered as: "${targetStatus}".`,
        targetId: selected.id,
        targetName: selected.name,
        userEmail: userEmail || "simulated.admin@sunmedx.com",
        userRole: userRole,
        timestamp: nowStr
      };
    } else if (type === "ticket") {
      const sampleTickets = [
        { name: "Anesthesia Workstation", id: "AST-5100", issue: "Ventilator tidal volume alarm fault" },
        { name: "Syringe Pump SP-22", id: "AST-3304", issue: "Battery power depletion indicator error" },
        { name: "Infusion Unit Neo", id: "AST-6601", issue: "In-line bubble sensor sensitivity fault" }
      ];
      const selected = sampleTickets[Math.floor(Math.random() * sampleTickets.length)];
      
      logPayload = {
        type: "ticket",
        action: "Simulated Ticket Dispatch",
        details: `Automatically generated helpdesk ticket: "${selected.issue}" for unit ${selected.name} (${selected.id}).`,
        targetId: selected.id,
        targetName: selected.name,
        userEmail: "iot-gateway@sunmedx-clinical.com",
        userRole: "Technician",
        timestamp: nowStr
      };
    } else {
      const sampleSpares = [
        { name: "AED Replacement Lithium Cell", id: "SPR-9092" },
        { name: "Reusable ECG Chest Bulb", id: "SPR-1100" },
        { name: "SpO2 Finger Clip Sensor Pediatric", id: "SPR-5501" }
      ];
      const selected = sampleSpares[Math.floor(Math.random() * sampleSpares.length)];
      
      logPayload = {
        type: "procurement",
        action: "Simulated Spare Dispatch",
        details: `Transferred spare component ${selected.name} (${selected.id}) from primary inventory vault to Biomedical Hub B.`,
        targetId: selected.id,
        targetName: selected.name,
        userEmail: userEmail || "simulated.procurement@sunmedx.com",
        userRole: "Procurement",
        timestamp: nowStr
      };
    }

    try {
      appendLocalLogEntry(logPayload);
    } finally {
      setIsSimulating(null);
    }
  };

  // Inject Critical Ventilator Failure Log
  const triggerTelemetryFailureSimulation = async () => {
    setIsSimulating("telemetry");
    const nowStr = new Date().toISOString();
    const logPayload: Omit<SystemActivityLog, "id"> = {
      type: "ticket",
      action: "CRITICAL TELEMETRY FAULT",
      details: `WARNING: Real-time telemetry feed reported catastrophic failure on ICU Ventilator #AST-9021. Peak Airway Pressure exceeded 40 cmH2O. Service dispatched.`,
      targetId: "AST-9021",
      targetName: "ICU Ventilator #4",
      userEmail: "telemetry.monitor@sunmedx.com",
      userRole: "Technician",
      timestamp: nowStr
    };

    try {
      appendLocalLogEntry(logPayload);
      setSandboxSuccessMessage("Catastrophic ventilator telemetry alert injected successfully!");
      setTimeout(() => setSandboxSuccessMessage(""), 5000);
    } finally {
      setIsSimulating(null);
    }
  };

  // Safe Wipe of Logs
  const clearLogs = async () => {
    if (!window.confirm("Are you sure you want to permanently clear the audit logs? This action is irreversible.")) return;
    const initLog: SystemActivityLog = {
      id: `LOG-${Date.now()}`,
      type: "asset",
      action: "Audit Trail Initialized",
      details: "Administrative policy initialized. All historic clinical ledger entries flushed safely by chief administrator.",
      targetId: "SYS-INIT",
      targetName: "Governance Ledger",
      userEmail: userEmail || "admin@sunmedx.com",
      userRole: "Admin",
      timestamp: new Date().toISOString()
    };
    setLogs([initLog]);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([initLog]));
  };

  // Seed default clinical registries to logs
  const handleBulkRestoreDemoLogs = async () => {
    setLoading(true);
    const testLogs: Omit<SystemActivityLog, "id">[] = [
      {
        type: "asset",
        action: "Asset Registered",
        details: "Biomedical engineering added new ICU Ventilator (Model: V-800, Brand: Siemens) with recommended service interval of 1200 hours.",
        targetId: "AST-9210",
        targetName: "Siemens V-800 Ventilator",
        userEmail: "admin@sunmedx.com",
        userRole: "Admin",
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        type: "ticket",
        action: "Calibration Logged",
        details: "Defibrillator energy discharge validation completed. Calibrated successfully up to 360 Joules. Divergence drift within 1.2%.",
        targetId: "AST-8820",
        targetName: "Philips AED Defibrillator",
        userEmail: "engineer.jones@sunmedx.com",
        userRole: "Technician",
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        type: "procurement",
        action: "Inventory Restocked",
        details: "Hospital procurement ordered 25x pediatric SpO2 clip probes. Sourced directly via BME portal approved vendor channel.",
        targetId: "SPR-5501",
        targetName: "Pediatric SpO2 Clip Probes",
        userEmail: "procurement@sunmedx.com",
        userRole: "Procurement",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
      }
    ];

    testLogs.forEach(appendLocalLogEntry);
    setSandboxSuccessMessage("Demo clinical trails loaded into local portal database!");
    setTimeout(() => setSandboxSuccessMessage(""), 5000);
    setLoading(false);
  };

  // Save Settings Changes
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);

    const logEntry: Omit<SystemActivityLog, "id"> = {
      type: "asset",
      action: "Policy Parameter Tweak",
      details: `Chief Administrator adjusted hospital system rules: Lifespan=${tempSettings.defaultUsefulLife}yr, Store Markup=${tempSettings.storeMarkupPercent}%, Calib=${tempSettings.calibrationIntervalMonths}mo, Standard=${tempSettings.qualityAuditStandard}.`,
      targetId: "POLICY-CTRL",
      targetName: "Global Policy Center",
      userEmail: userEmail || "admin@sunmedx.com",
      userRole: "Admin",
      timestamp: new Date().toISOString()
    };

    appendLocalLogEntry(logEntry);
    setSettingsSuccessMessage("Clinical system parameters and BME policies updated successfully!");
    setTimeout(() => {
      setSettingsSuccessMessage("");
    }, 4000);
  };

  // Save SunMedx Company Info edits
  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCompanyInfo) {
      onUpdateCompanyInfo(tempCompanyInfo);
    }

    appendLocalLogEntry({
      type: "asset",
      action: "SunMedx Company Info Updated",
      details: `Super Admin updated public brand & contact profile (${tempCompanyInfo.companyName} · ${tempCompanyInfo.corporateEmail} · ${tempCompanyInfo.phoneHotline}).`,
      targetId: "COMPANY-PROFILE",
      targetName: tempCompanyInfo.companyName || "SunMedx",
      userEmail: userEmail || "admin@sunmedx.com",
      userRole: "Admin",
      timestamp: new Date().toISOString()
    });

    setCompanySuccessMessage("SunMedx company profile published to Home Page & Portal!");
    setTimeout(() => {
      setCompanySuccessMessage("");
    }, 4000);
  };

  const handleResetCompanyProfile = () => {
    if (onResetCompanyInfo) {
      onResetCompanyInfo();
    }
    setTempCompanyInfo({ ...DEFAULT_COMPANY_INFO });
    setCompanySuccessMessage("SunMedx company profile restored to defaults.");
    setTimeout(() => {
      setCompanySuccessMessage("");
    }, 4000);
  };

  // Computed GitHub Publishing Metadata & Workflow YAML
  const cleanOwner = (tempSettings.githubOwner || "krishnadigitalai").trim();
  const cleanRepo = (tempSettings.githubRepo || "sunmedx-bme-portal").trim();
  const cleanBranch = (tempSettings.githubBranch || "main").trim();
  const cleanDomain = (tempSettings.githubCustomDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const githubRepoUrl = `https://github.com/${cleanOwner}/${cleanRepo}`;
  const githubPagesUrl = cleanDomain
    ? `https://${cleanDomain}`
    : `https://${cleanOwner}.github.io/${cleanRepo}/`;

  const generatedWorkflowYaml = `name: Publish SunMedx to GitHub Pages

on:
  push:
    branches: ["${cleanBranch}"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Setup GitHub Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: Build static bundle for GitHub Pages
        env:
          VITE_BASE_PATH: \${{ steps.pages.outputs.base_path }}/
        run: npm run build:github

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  const handleSavePublishingSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...tempSettings,
      publishingProvider: "github" as const,
      githubOwner: cleanOwner,
      githubRepo: cleanRepo,
      githubBranch: cleanBranch,
      githubCustomDomain: cleanDomain,
      apiBaseUrl: (tempSettings.apiBaseUrl || "").trim().replace(/\/+$/, "")
    };
    setTempSettings(updated);
    onUpdateSettings(updated);

    const pubLog: Omit<SystemActivityLog, "id"> = {
      type: "asset",
      action: "GitHub Publishing Configured",
      details: `Publishing target set to GitHub Pages (${cleanOwner}/${cleanRepo}@${cleanBranch}) replacing Firebase Hosting.`,
      targetId: "GH-PAGES",
      targetName: `${cleanOwner}/${cleanRepo}`,
      userEmail: userEmail || "admin@sunmedx.com",
      userRole: "Admin",
      timestamp: new Date().toISOString()
    };

    appendLocalLogEntry(pubLog);
    setPublishingSuccessMessage("GitHub Pages publishing settings saved (Firebase Hosting disabled).");
    setTimeout(() => {
      setPublishingSuccessMessage("");
    }, 4500);
  };

  const handleCopyWorkflow = async () => {
    try {
      await navigator.clipboard.writeText(generatedWorkflowYaml);
      setCopiedWorkflow(true);
      setTimeout(() => setCopiedWorkflow(false), 2500);
    } catch (err) {
      console.error("Failed to copy workflow YAML:", err);
    }
  };

  const handleDownloadWorkflow = () => {
    const blob = new Blob([generatedWorkflowYaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deploy.yml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-300">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/95 to-slate-950 border border-indigo-950/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <History className="h-5 w-5 animate-spin-slow" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Admin & System Control Panel
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Configure global clinical lifespans, manage the Firestore ledger records, simulate workflow scenarios, and switch between role models.
          </p>
        </div>

        {/* Global Policy Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex items-center space-x-2.5">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <div className="text-left">
            <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold leading-none">Active standard</span>
            <span className="text-xs text-indigo-200 font-bold font-sans">{settings.qualityAuditStandard}</span>
          </div>
        </div>
      </div>

      {/* Role Restriction Check (Must be Admin to write/manipulate these) */}
      {userRole !== "Admin" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-900/40 text-amber-500 flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">Administrative Clearance Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            You are currently authorized as a <span className="text-amber-400 font-bold uppercase">{userRole}</span>. Global system parameter modifications and database control is reserved for **Clinical Administrators**.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onRoleChange) onRoleChange("Admin");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Simulate Chief Administrator Role
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Admin Workspace Tabs */}
          <div className="flex border-b border-slate-800 overflow-x-auto subtle-scrollbar gap-1.5 pb-px">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2.5 border-b-2 text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === "logs"
                  ? "border-indigo-500 text-white bg-slate-900/40 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="h-4 w-4 text-indigo-400" />
              <span>Real-Time Audit Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`px-4 py-2.5 border-b-2 text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === "policies"
                  ? "border-indigo-500 text-white bg-slate-900/40 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Policy Parameters & Costings</span>
            </button>
            <button
              onClick={() => setActiveTab("company")}
              className={`px-4 py-2.5 border-b-2 text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === "company"
                  ? "border-indigo-500 text-white bg-slate-900/40 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
              id="admin-tab-company-info"
            >
              <Building2 className="h-4 w-4 text-orange-400" />
              <span>SunMedx Company Info</span>
            </button>
            <button
              onClick={() => setActiveTab("publishing")}
              className={`px-4 py-2.5 border-b-2 text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === "publishing"
                  ? "border-indigo-500 text-white bg-slate-900/40 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitBranch className="h-4 w-4 text-sky-400" />
              <span>GitHub Publishing</span>
            </button>
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`px-4 py-2.5 border-b-2 text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === "sandbox"
                  ? "border-indigo-500 text-white bg-slate-900/40 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database className="h-4 w-4 text-purple-400" />
              <span>Database Sync Sandbox</span>
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`px-4 py-2.5 border-b-2 text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === "roles"
                  ? "border-indigo-500 text-white bg-slate-900/40 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4 text-pink-400" />
              <span>Personnel Roles Simulator</span>
            </button>
          </div>

          {/* 3. Tab Content Delivery */}

          {/* TAB 1: AUDIT LEDGER */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              {/* Metric Counts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="absolute top-4 right-4 text-indigo-500 opacity-20">
                    <Database className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Total Stored Log Entries</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <h3 className="text-3xl font-extrabold text-white font-mono">{loading ? "..." : totalCount}</h3>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide animate-pulse">
                      Live Feed
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Maximum cap of 100 historical queries</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="absolute top-4 right-4 text-emerald-500 opacity-20">
                    <Activity className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Asset Modifications</p>
                  <h3 className="text-3xl font-extrabold text-white font-mono mt-2">{loading ? "..." : assetCount}</h3>
                  <p className="text-[10px] text-slate-500 mt-2">Status updates & calibration drift records</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="absolute top-4 right-4 text-amber-500 opacity-20">
                    <Wrench className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Helpdesk Tickets Logged</p>
                  <h3 className="text-3xl font-extrabold text-white font-mono mt-2">{loading ? "..." : ticketCount}</h3>
                  <p className="text-[10px] text-slate-500 mt-2">Staff safety alerts & parts replacement</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-pink-500 opacity-20">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Operator</p>
                  <h3 className="text-sm font-bold text-white truncate mt-2.5 max-w-full" title={mostActiveActor}>
                    {loading ? "..." : mostActiveActor}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-2">Most active email trigger client</p>
                </div>
              </div>

              {/* Simulation Strip */}
              <div className="bg-slate-900/40 border border-slate-850 p-4.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-left">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-900/40 rounded-xl">
                    <Sliders className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">Simulate Live Activity Events</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Force immediate document writes into Firestore database logs to demonstrate zero-delay reactive stream updates.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => simulateLog("asset")}
                    disabled={isSimulating !== null}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className={`h-3 w-3 ${isSimulating === "asset" ? "animate-spin text-emerald-400" : ""}`} />
                    <span>+ Asset Calibration</span>
                  </button>
                  <button
                    onClick={() => simulateLog("ticket")}
                    disabled={isSimulating !== null}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-250 text-xs px-3.5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className={`h-3 w-3 text-amber-500 ${isSimulating === "ticket" ? "animate-spin text-amber-400" : ""}`} />
                    <span>+ Safety Dispatch</span>
                  </button>
                  <button
                    onClick={() => simulateLog("procurement")}
                    disabled={isSimulating !== null}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-250 text-xs px-3.5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className={`h-3 w-3 text-pink-500 ${isSimulating === "procurement" ? "animate-spin text-pink-400" : ""}`} />
                    <span>+ Spares Order</span>
                  </button>
                </div>
              </div>

              {/* Filters & Ledger Table */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch">
                  {/* Ledger Search bar */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Search className="h-4 w-4" />
                    </span>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search audit trail by operator, description details, target category..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-xs pl-10 pr-4 py-2.5 rounded-xl transition outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 leading-none">
                    {/* Filter Category */}
                    <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl">
                      <Filter className="h-3 w-3 text-slate-500" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-transparent text-[11px] text-slate-350 border-none outline-none focus:ring-0 cursor-pointer pr-4 font-semibold"
                      >
                        <option value="all" className="bg-slate-950">Category: All</option>
                        <option value="asset" className="bg-slate-950">Asset mutations</option>
                        <option value="ticket" className="bg-slate-950">Helpdesk Tickets</option>
                        <option value="procurement" className="bg-slate-950">Store Procurements</option>
                      </select>
                    </div>

                    {/* Filter Actor Role */}
                    <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl">
                      <Users className="h-3 w-3 text-slate-500" />
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value as any)}
                        className="bg-transparent text-[11px] text-slate-350 border-none outline-none focus:ring-0 cursor-pointer pr-4 font-semibold"
                      >
                        <option value="all" className="bg-slate-950">Roles: All</option>
                        <option value="Admin" className="bg-slate-950">Chief Admin</option>
                        <option value="Technician" className="bg-slate-950">Bioengineer (Tech)</option>
                        <option value="Procurement" className="bg-slate-950">Supply Officer</option>
                      </select>
                    </div>

                    {/* Wipe Logs Button */}
                    <button 
                      onClick={clearLogs}
                      className="flex items-center space-x-1 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-300 font-bold text-[11px] px-3.5 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Purge Ledger</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3.5">
                    <Activity className="h-8 w-8 text-indigo-500 animate-spin" />
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest leading-none">Connecting security pipeline feed...</span>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <p className="text-xs text-slate-400">No security audit logs found matching selected constraints.</p>
                    <button
                      onClick={handleBulkRestoreDemoLogs}
                      className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer"
                    >
                      Inject demo registers sequence
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="bg-slate-900/70 border-b border-slate-850 text-slate-400 font-mono text-[9px] font-bold uppercase tracking-widest text-left">
                          <th className="px-5 py-3">Timestamp (UTC)</th>
                          <th className="px-5 py-3">Operator / Client</th>
                          <th className="px-5 py-3">Logged Security Trail Detials</th>
                          <th className="px-5 py-3 text-right">Target Asset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-350 font-sans text-xs">
                        {filteredLogs.map((log) => {
                          const logTime = new Date(log.timestamp);
                          const formattedTime = logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          const formattedDate = logTime.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });

                          let typeBadgeClass = "";
                          let TypeIcon = Layers;
                          if (log.type === "asset") {
                            typeBadgeClass = "text-emerald-400 bg-emerald-950/40 border border-emerald-900/60";
                            TypeIcon = Activity;
                          } else if (log.type === "ticket") {
                            typeBadgeClass = "text-amber-400 bg-amber-950/40 border border-amber-900/60";
                            TypeIcon = Wrench;
                          } else {
                            typeBadgeClass = "text-pink-400 bg-pink-950/40 border border-pink-900/60";
                            TypeIcon = ShoppingBag;
                          }

                          let roleTagClass = "text-slate-400 bg-slate-900 border border-slate-800";
                          if (log.userRole === "Admin") {
                            roleTagClass = "text-indigo-400 bg-indigo-950/30 border border-indigo-900/40";
                          } else if (log.userRole === "Technician") {
                            roleTagClass = "text-amber-400 bg-amber-950/20 border border-amber-900/30";
                          } else if (log.userRole === "Procurement") {
                            roleTagClass = "text-emerald-300 bg-emerald-950/20 border border-emerald-900/30";
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-900/30 transition duration-75 group">
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-mono text-[11px] font-bold text-white leading-none">{formattedTime}</span>
                                  <span className="text-[9px] text-slate-500 font-mono mt-1 leading-none">{formattedDate}</span>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="flex flex-col space-y-1">
                                  <div>
                                    <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${roleTagClass}`}>
                                      {log.userRole}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[150px]" title={log.userEmail}>
                                    {log.userEmail}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className={`p-0.5 rounded text-[10px] ${typeBadgeClass}`}>
                                      <TypeIcon className="h-3 w-3" />
                                    </span>
                                    <span className="font-bold text-slate-200 tracking-tight text-xs group-hover:text-indigo-400 transition-colors">
                                      {log.action}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-[11px] leading-relaxed max-w-xl">
                                    {log.details}
                                  </p>
                                </div>
                              </td>

                              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                {log.targetId ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-white text-xs font-semibold leading-none">{log.targetName}</span>
                                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/30 px-1.5 py-0.5 rounded mt-1.5 font-bold leading-none">
                                      {log.targetId}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-650 font-mono text-[10px]">global_broad</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: POLICIES CONFIGURATION */}
          {activeTab === "policies" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form panel - 7 columns */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
                  <Sliders className="h-4 w-4" />
                  <span>Clinical Infrastructure Settings</span>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5">
                  {/* Quality Audit Standard selector */}
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Regulatory Standard compliance
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">Adjusts compliance terminology and AI regulatory reference frameworks.</p>
                    <select
                      value={tempSettings.qualityAuditStandard}
                      onChange={(e) => setTempSettings({ ...tempSettings, qualityAuditStandard: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="NABH 5th Edition (FMS)">NABH 5th Edition (Chapter 5 - Facility Management & Safety)</option>
                      <option value="JCI Accreditation Clinic">Joint Commission International (JCI Accreditation Standards)</option>
                      <option value="ISO 13485 Standards">ISO 13485:2016 (Quality Systems for Medical Devices)</option>
                      <option value="NEMA Regulatory Core">NEMA Standards / FDA Medical Equipment Registers</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Default lifespan slider */}
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Default Lifespan (Standard): {tempSettings.defaultUsefulLife} Years
                      </label>
                      <input 
                        type="range"
                        min={3}
                        max={12}
                        value={tempSettings.defaultUsefulLife}
                        onChange={(e) => setTempSettings({ ...tempSettings, defaultUsefulLife: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-550 block font-mono">Governs general biomedical equipment.</span>
                    </div>

                    {/* High-value core lifespan slider */}
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        High-End Lifespan (Core): {tempSettings.highEndUsefulLife} Years
                      </label>
                      <input 
                        type="range"
                        min={6}
                        max={18}
                        value={tempSettings.highEndUsefulLife}
                        onChange={(e) => setTempSettings({ ...tempSettings, highEndUsefulLife: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-550 block font-mono">MRI, X-Ray C-Arm, Anesthesia workstations.</span>
                    </div>
                  </div>

                  <hr className="border-slate-850" />

                  {/* Pricing markups / discount control */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Spare Parts Price Multiplier Settings: {tempSettings.storeMarkupPercent >= 0 ? `+${tempSettings.storeMarkupPercent}% Markup` : `${tempSettings.storeMarkupPercent}% Discount`}
                      </label>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/30 px-1.5 py-0.5 rounded">
                        ({(1 + tempSettings.storeMarkupPercent / 100).toFixed(2)}x)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-1.5">Influences unit price listings on the Spares & Consumables Store for facility cost-containment programs.</p>
                    <input 
                      type="range"
                      min={-20}
                      max={40}
                      step={5}
                      value={tempSettings.storeMarkupPercent}
                      onChange={(e) => setTempSettings({ ...tempSettings, storeMarkupPercent: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>-20% Tier Limit (SOP Discount)</span>
                      <span>0% (Regular Prorated)</span>
                      <span>+40% Tier Limit (Premium Markup)</span>
                    </div>
                  </div>

                  {/* Calibration Warn Period & High Alert Threshold */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Calibration Period (Months)
                      </label>
                      <select
                        value={tempSettings.calibrationIntervalMonths}
                        onChange={(e) => setTempSettings({ ...tempSettings, calibrationIntervalMonths: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value={3}>3 Months Frequency</option>
                        <option value={6}>6 Months Frequency (Standard)</option>
                        <option value={12}>12 Months Frequency (Extended)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Expense Alert Threshold (USD)
                      </label>
                      <input 
                        type="number" 
                        min={100}
                        max={10000}
                        step={100}
                        value={tempSettings.maintenanceAlertThreshold}
                        onChange={(e) => setTempSettings({ ...tempSettings, maintenanceAlertThreshold: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Submit Button & Alert Message */}
                  <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                    {settingsSuccessMessage ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                        <Check className="h-4 w-4" />
                        <span>{settingsSuccessMessage}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Settings save commits immediately into local store.</span>
                    )}

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Commit Policy Adjustments</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Policy Explanation Panel - 5 columns */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
                    <Shield className="h-4 w-4" />
                    <span>Policy Impact Vector</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Customized parameters established in this administrative workspace dynamically synchronize values across multiple clinical modules:
                  </p>

                  <div className="space-y-3 pt-1">
                    {/* Impact Vector 1 */}
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 group-hover:bg-indigo-600/10 shrink-0">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">5-Year Budget Planners</h5>
                        <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">
                          Calculations in the projected spend chart will automatically parse life thresholds using your custom limits (<span className="text-white">{tempSettings.defaultUsefulLife}yr / {tempSettings.highEndUsefulLife}yr</span>).
                        </p>
                      </div>
                    </div>

                    {/* Impact Vector 2 */}
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-950/40 text-emerald-400 shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Spares Catalog Pricing</h5>
                        <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">
                          Spares list items prices are multiplied by <span className="text-white">{(1 + tempSettings.storeMarkupPercent/100).toFixed(2)}x</span> for procurement constraints simulation.
                        </p>
                      </div>
                    </div>

                    {/* Impact Vector 3 */}
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 rounded-lg bg-yellow-950/40 border border-yellow-900/40 text-yellow-500 shrink-0">
                        <FileCheck className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Compliance Auditor Focus</h5>
                        <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal">
                          The AI regulatory Auditor targets checks against <span className="text-white">"{tempSettings.qualityAuditStandard}"</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2B: GITHUB PUBLISHING SETTINGS (REPLACES FIREBASE HOSTING) */}
          {activeTab === "publishing" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: GitHub Publishing Configuration Form */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-sky-400 font-mono text-[10px] uppercase font-bold tracking-widest">
                    <GitBranch className="h-4 w-4" />
                    <span>GitHub Pages Publishing Settings</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                    GitHub Active (Firebase Hosting Off)
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-start space-x-3">
                  <Globe className="h-4.5 w-4.5 text-sky-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">
                      Publishing Target: GitHub Pages via GitHub Actions
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Static web publishing is configured through <span className="text-sky-300 font-mono">.github/workflows/deploy.yml</span> and <span className="text-sky-300 font-mono">npm run build:github</span> instead of Firebase Hosting.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSavePublishingSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                        GitHub Username / Org
                      </label>
                      <input
                        type="text"
                        required
                        value={tempSettings.githubOwner || ""}
                        onChange={(e) => setTempSettings({ ...tempSettings, githubOwner: e.target.value })}
                        placeholder="e.g. krishnadigitalai"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                        Repository Name
                      </label>
                      <input
                        type="text"
                        required
                        value={tempSettings.githubRepo || ""}
                        onChange={(e) => setTempSettings({ ...tempSettings, githubRepo: e.target.value })}
                        placeholder="e.g. sunmedx-bme-portal"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                        Publish Branch
                      </label>
                      <input
                        type="text"
                        required
                        value={tempSettings.githubBranch || "main"}
                        onChange={(e) => setTempSettings({ ...tempSettings, githubBranch: e.target.value })}
                        placeholder="main"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                        Custom Domain (Optional CNAME)
                      </label>
                      <input
                        type="text"
                        value={tempSettings.githubCustomDomain || ""}
                        onChange={(e) => setTempSettings({ ...tempSettings, githubCustomDomain: e.target.value })}
                        placeholder="portal.hospital.org"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center space-x-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      <Server className="h-3.5 w-3.5 text-indigo-400" />
                      <span>External API Server URL (Optional for AI Routes)</span>
                    </label>
                    <input
                      type="url"
                      value={tempSettings.apiBaseUrl || ""}
                      onChange={(e) => setTempSettings({ ...tempSettings, apiBaseUrl: e.target.value })}
                      placeholder="https://api.your-sunmedx-backend.com (leave empty for local/fallback)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      GitHub Pages hosts static files only. Leave blank to use built-in static AI fallbacks on GitHub Pages, or point to your Node/Express API host.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                    {publishingSuccessMessage ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Check className="h-4 w-4 shrink-0" />
                        <span>{publishingSuccessMessage}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        Updates GitHub publishing target in local store.
                      </span>
                    )}

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save GitHub Settings</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Endpoints, Workflow Preview & Steps */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2 text-sky-400 font-mono text-[10px] uppercase font-bold tracking-widest">
                      <Terminal className="h-4 w-4" />
                      <span>Active GitHub Deployment Endpoints</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono uppercase text-slate-500 block">GitHub Repository</span>
                        <span className="font-mono text-slate-200 truncate block">{githubRepoUrl}</span>
                      </div>
                      <a
                        href={githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 shrink-0 transition"
                        title="Open GitHub Repository"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono uppercase text-slate-500 block">Published GitHub Pages URL</span>
                        <span className="font-mono text-emerald-400 truncate block">{githubPagesUrl}</span>
                      </div>
                      <a
                        href={githubPagesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 shrink-0 transition"
                        title="Open GitHub Pages URL"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                        .github/workflows/deploy.yml
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleCopyWorkflow}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition cursor-pointer"
                        >
                          {copiedWorkflow ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedWorkflow ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadWorkflow}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-[11px] text-sky-300 transition cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download YAML</span>
                        </button>
                      </div>
                    </div>

                    <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-52 subtle-scrollbar leading-relaxed">
                      {generatedWorkflowYaml}
                    </pre>
                  </div>

                  <div className="border border-sky-950/50 bg-sky-950/10 rounded-2xl p-3.5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-sky-400 font-bold block">
                      GitHub Pages Activation Checklist
                    </span>
                    <ol className="text-[10.5px] text-slate-400 space-y-1 list-decimal pl-4 leading-relaxed">
                      <li>Push this repository to GitHub on branch <span className="text-white font-mono">{cleanBranch}</span>.</li>
                      <li>In GitHub Repo <span className="text-white">Settings → Pages</span>, set <span className="text-sky-300">Source: GitHub Actions</span>.</li>
                      <li>Every push to <span className="text-white font-mono">{cleanBranch}</span> triggers <span className="text-white font-mono">npm run build:github</span> and publishes to GitHub Pages.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE SYNC SANDBOX */}
          {activeTab === "sandbox" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Controls panel */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
                  <Database className="h-4 w-4" />
                  <span>Interactive Sync Playground</span>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-normal">
                    The database sandbox gives you total control to test Firestore synchronization in real-time, trigger simulation states, and audit response triggers.
                  </p>

                  {sandboxSuccessMessage && (
                    <div className="bg-emerald-950/50 border border-emerald-900/60 text-emerald-300 rounded-xl p-3.5 text-xs font-semibold flex items-center space-x-2 animate-pulse">
                      <CheckCircle className="h-4 w-4" />
                      <span>{sandboxSuccessMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Sandbox tool 1 */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
                      <div>
                        <h4 className="text-xs font-bold text-white">Seed Standard Log Sequence</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          Writes a sequence of high-quality sample clinical logs (calibrations, audits, purchase) into Firestore database in a single transaction.
                        </p>
                      </div>
                      <button
                        onClick={handleBulkRestoreDemoLogs}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Seed Firestore Demo</span>
                      </button>
                    </div>

                    {/* Sandbox tool 2 */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-3.5">
                      <div>
                        <h4 className="text-xs font-bold text-white">Inject Telemetry Failure</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          Simulate an automated IoT telemetry hardware failure report on an active ICU ventilator to test helpdesk alerts.
                        </p>
                      </div>
                      <button
                        onClick={triggerTelemetryFailureSimulation}
                        disabled={isSimulating !== null}
                        className="w-full bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-300 font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Inject Telemetry Alert</span>
                      </button>
                    </div>
                  </div>

                  <hr className="border-slate-850" />

                  {/* Purges ledger logs */}
                  <div className="bg-slate-950/40 p-4 border border-rose-950/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Clear Store Records</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                        Irreversibly flushes all documents inside the activity logs collection. Useful for cleaning up evaluation workspaces.
                      </p>
                    </div>
                    <button
                      onClick={clearLogs}
                      className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/40 text-rose-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Clear Audit Collection
                    </button>
                  </div>
                </div>
              </div>

              {/* Ledger state counts - 5 columns */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
                  <Activity className="h-4 w-4" />
                  <span>Real-time Active Registry States</span>
                </div>

                <div className="space-y-3">
                  {/* Sync Row 1 */}
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-xl p-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/20 rounded-lg">
                        <Activity className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-slate-350">Clinical Equipment</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 border border-slate-800 rounded">
                      {assets.length} items
                    </span>
                  </div>

                  {/* Sync Row 2 */}
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-xl p-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 bg-amber-950/20 text-amber-500 border border-amber-900/20 rounded-lg">
                        <Wrench className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-slate-350">Helpdesk Tickets</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 border border-slate-800 rounded">
                      {tickets.length} items
                    </span>
                  </div>

                  {/* Sync Row 3 */}
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-850 rounded-xl p-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 bg-pink-950/20 text-pink-400 border border-pink-900/20 rounded-lg">
                        <ShoppingBag className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-slate-350">Spare Catalog Size</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2.5 py-1 border border-slate-800 rounded">
                      {spares.length} items
                    </span>
                  </div>
                </div>

                <div className="border border-indigo-950/35 bg-indigo-950/10 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-indigo-400 font-bold block">Zero-latency Invariant</span>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Active changes to clinical assets, service orders, or e-commerce spares instantly execute triggers updating Firestore collections, which reactively dispatch to all clients.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERSONNEL ROLES SIMULATOR */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl max-w-4xl mx-auto">
                <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
                  <Users className="h-4 w-4" />
                  <span>Personnel Role Access Model</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Establish role models or switch identities in real-time to preview precisely what permissions and user interfaces are exposed under hospital compliance guidelines.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Role 1 */}
                  <div className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition ${
                    userRole === "Admin"
                      ? "bg-slate-950 border-indigo-500/60 shadow-lg shadow-indigo-600/5"
                      : "bg-slate-950/30 border-slate-850 hover:border-slate-800"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-indigo-950 text-indigo-400 border border-indigo-900/60 rounded">
                          Chief Administrator
                        </span>
                        {userRole === "Admin" && (
                          <span className="p-1 bg-emerald-500/10 border border-emerald-900/30 text-emerald-400 rounded-full">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs mt-3">Governance & Policies</h4>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-normal">
                        Elevated scope allows full write access on regulatory standards, lifespan, spares price policies, global calibration configurations, and seeder sandboxes.
                      </p>
                    </div>

                    <button
                      onClick={() => onRoleChange && onRoleChange("Admin")}
                      className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        userRole === "Admin"
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {userRole === "Admin" ? "Active Model" : "Assume Identity"}
                    </button>
                  </div>

                  {/* Role 2 */}
                  <div className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition ${
                    (userRole as any) === "Technician"
                      ? "bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-600/5"
                      : "bg-slate-950/30 border-slate-850 hover:border-slate-800"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-amber-950 text-amber-500 border border-amber-900/60 rounded">
                          Clinical Bioengineer
                        </span>
                        {(userRole as any) === "Technician" && (
                          <span className="p-1 bg-emerald-500/10 border border-emerald-900/30 text-emerald-400 rounded-full">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs mt-3">Helpdesk Operations</h4>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-normal">
                        Handles calibrations, logs, ticket dispatch adjustments, and status changes. Administrative controls are locked.
                      </p>
                    </div>

                    <button
                      onClick={() => onRoleChange && onRoleChange("Technician")}
                      className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        (userRole as any) === "Technician"
                          ? "bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {(userRole as any) === "Technician" ? "Active Model" : "Assume Identity"}
                    </button>
                  </div>

                  {/* Role 3 */}
                  <div className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition ${
                    (userRole as any) === "Procurement"
                      ? "bg-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-600/5"
                      : "bg-slate-950/30 border-slate-850 hover:border-slate-800"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-emerald-950 text-emerald-400 border border-emerald-900/60 rounded">
                          Supply Officer
                        </span>
                        {(userRole as any) === "Procurement" && (
                          <span className="p-1 bg-emerald-500/10 border border-emerald-900/30 text-emerald-400 rounded-full">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs mt-3">Procurements & Spares</h4>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-normal">
                        Fulfill purchases, review cart invoices, and stock up probes. Blocked from helpdesk dispatches and administrative configuration.
                      </p>
                    </div>

                    <button
                      onClick={() => onRoleChange && onRoleChange("Procurement")}
                      className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        (userRole as any) === "Procurement"
                          ? "bg-emerald-600 hover:bg-emerald-550 text-white font-bold"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {(userRole as any) === "Procurement" ? "Active Model" : "Assume Identity"}
                    </button>
                  </div>
                </div>

                <div className="border border-slate-800 bg-slate-950 p-4 rounded-2xl text-[11px] text-slate-400 leading-relaxed">
                  <div className="font-bold text-white mb-1">Active Scope Permissions Matrix:</div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 list-disc pl-4 font-mono text-[10px]">
                    <li>Clinical Assets List: <span className="text-emerald-400">READ-WRITE</span> (All roles)</li>
                    <li>Service Helpdesk Dispatch: <span className="text-emerald-400">WRITE</span> (Admin, Technician only)</li>
                    <li>Spares Cart Purchase: <span className="text-emerald-400">WRITE</span> (Admin, Procurement only)</li>
                    <li>Governance Parameter Settings: <span className="text-emerald-400">WRITE</span> (Admin only)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUNMEDX COMPANY INFO EDITOR */}
          {activeTab === "company" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              {/* Editor Form - 7 Columns */}
              <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">SunMedx Company Info Editor</h3>
                      <p className="text-[10.5px] text-slate-400">
                        Edit brand details, mission copy, impact stats, and contact information displayed on the Home Page & Portal.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCompanyProfile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 transition cursor-pointer shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Company / Brand Name
                      </label>
                      <input
                        type="text"
                        required
                        value={tempCompanyInfo.companyName}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, companyName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Sub-Brand / Parent Tagline
                      </label>
                      <input
                        type="text"
                        required
                        value={tempCompanyInfo.companyTagline}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, companyTagline: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Hero Banner Badge
                      </label>
                      <input
                        type="text"
                        value={tempCompanyInfo.heroBadgeText}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, heroBadgeText: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Portal Facility / Hospital Name
                      </label>
                      <input
                        type="text"
                        value={tempCompanyInfo.portalFacilityName}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, portalFacilityName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      Hero Summary Description
                    </label>
                    <textarea
                      rows={2}
                      value={tempCompanyInfo.heroDescription}
                      onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, heroDescription: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      About Company Overview
                    </label>
                    <textarea
                      rows={2}
                      value={tempCompanyInfo.aboutDescription}
                      onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, aboutDescription: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      Corporate Mission Statement
                    </label>
                    <textarea
                      rows={2}
                      value={tempCompanyInfo.missionStatement}
                      onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, missionStatement: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Years Exp.
                      </label>
                      <input
                        type="text"
                        value={tempCompanyInfo.yearsExperience}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, yearsExperience: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Hospitals
                      </label>
                      <input
                        type="text"
                        value={tempCompanyInfo.hospitalsServed}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, hospitalsServed: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Devices
                      </label>
                      <input
                        type="text"
                        value={tempCompanyInfo.devicesSupported}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, devicesSupported: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Phone Hotline
                      </label>
                      <input
                        type="text"
                        value={tempCompanyInfo.phoneHotline}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, phoneHotline: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        value={tempCompanyInfo.corporateEmail}
                        onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, corporateEmail: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      Headquarters / Service Region
                    </label>
                    <input
                      type="text"
                      value={tempCompanyInfo.headquarters}
                      onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, headquarters: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      Footer Legal Notice
                    </label>
                    <input
                      type="text"
                      value={tempCompanyInfo.footerNotice}
                      onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, footerNotice: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                    {companySuccessMessage ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                        <Check className="h-4 w-4" />
                        <span>{companySuccessMessage}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        Updates sync immediately with the Home Page and Header brand card.
                      </span>
                    )}

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      id="save-company-info-btn"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save & Publish Company Info</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Preview Column - 5 Columns */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-orange-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
                    <Globe className="h-4 w-4" />
                    <span>Live Home Page Brand Preview</span>
                  </div>

                  <div className="bg-[#1A1A2E] border border-slate-800 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-[#FF6B00] to-red-600 border border-orange-500/45 shrink-0">
                        <Activity className="h-4.5 w-4.5 text-white" />
                        <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-400 border border-[#1A1A2E] rounded-full" />
                      </div>
                      <div>
                        <div className="font-display font-extrabold text-sm text-[#FF9A3C] leading-none">
                          {tempCompanyInfo.companyName || "SunMedx"}
                        </div>
                        <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mt-1">
                          {tempCompanyInfo.companyTagline}
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF9A3C]" />
                      <span className="font-mono text-[9px] text-[#FFD08A] font-bold uppercase">
                        {tempCompanyInfo.heroBadgeText}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {tempCompanyInfo.heroDescription}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950 border border-slate-850 p-2 text-center rounded-xl">
                        <span className="font-display font-extrabold text-[#FF9A3C] text-sm block">{tempCompanyInfo.yearsExperience}</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Years Exp.</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-850 p-2 text-center rounded-xl">
                        <span className="font-display font-extrabold text-[#FF9A3C] text-sm block">{tempCompanyInfo.hospitalsServed}</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Hospitals</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-850 p-2 text-center rounded-xl">
                        <span className="font-display font-extrabold text-[#FF9A3C] text-sm block">{tempCompanyInfo.devicesSupported}</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Devices</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border-l-4 border-[#FF6B00] rounded-xl text-[10.5px] text-[#FFD08A] leading-snug">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-[#FF9A3C] block mb-1">Mission</span>
                      {tempCompanyInfo.missionStatement}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-[#FF9A3C]" />
                        <span>{tempCompanyInfo.phoneHotline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#FF9A3C]" />
                        <span>{tempCompanyInfo.corporateEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#FF9A3C]" />
                        <span>{tempCompanyInfo.headquarters}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
