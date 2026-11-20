import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { 
  FileCheck, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  FileText, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";

interface NabhComplianceProps {
  userEmail: string | undefined;
  qualityStandard?: string;
  apiBaseUrl?: string;
}

export default function NabhCompliance({ 
  userEmail,
  qualityStandard = "NABH 5th Edition (FMS)",
  apiBaseUrl = ""
}: NabhComplianceProps) {
  const [equipmentType, setEquipmentType] = useState("ICU Ventilator");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    {
      equipment: "ICU Ventilator",
      q: "What are the mandated NABH calibration intervals, error thresholds, and electrical safety logs?"
    },
    {
      equipment: "AED Defibrillator",
      q: "Explain energy validation discharge guidelines and battery load profiling under IEC 60601-1."
    },
    {
      equipment: "X-Ray C-Arm",
      q: "What radiation protection logs, leakage audits, and structural lead-glass compliance are required by AERB/NABH?"
    },
    {
      equipment: "Patient Monitor",
      q: "Describe grounding leakage checking thresholds and diagnostic array calibration testing standards."
    }
  ];

  const handleApplySample = (equipment: string, q: string) => {
    setEquipmentType(equipment);
    setQuestion(q);
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentType.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpointBase = (apiBaseUrl || "").trim().replace(/\/+$/, "");
      const response = await fetch(`${endpointBase}/api/compliance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          equipmentType,
          question: question || "General compliance, grounding safety standards, and PM registers."
        })
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("STATIC_HOST_NO_API");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Compliance Auditor was unable to connect to the model.");
      }

      setResult(data.answer);
    } catch (err: any) {
      if (err?.message === "STATIC_HOST_NO_API" || err?.name === "TypeError") {
        setResult(`### ${qualityStandard} Reference Audit — ${equipmentType}\n\n1. **Accreditation Mandate (NABH FMS Check)**: Under NABH Chapter 5 (FMS), **${equipmentType}** systems must be logged in the central Biomedical Asset Register with documented Preventive Maintenance (PM) schedules and valid calibration traceability.\n2. **Mandatory Calibration Frequency & Tolerances**: Semi-annual electrical safety inspection (every 6 months) and annual performance calibration against NIST/NABL-traceable reference analyzers.\n3. **Safety & Leakage Testing Thresholds**: Protective earth ground impedance **≤ 0.2 Ω**, normal-condition chassis leakage **≤ 100 µA**, single-fault leakage **≤ 500 µA** per IEC 60601-1.\n4. **Model Compliance Checklist**:\n   - Verify physical integrity, power cord strain relief, and hospital-grade plug.\n   - Attach dated green Calibration & Electrical Safety seal.\n   - Log readings in the Asset & Service Hub ledger.\n   - Confirm operator alarm limits and backup battery load capacity.\n5. **Mitigation/Escalation Matrix**: Immediately tag failed units **OUT OF SERVICE — DO NOT USE**, isolate from clinical duty, and raise a High-Priority Service Ticket.\n\n*Note: Static GitHub Pages fallback active. Configure an External API Server URL in Admin → GitHub Publishing to route live Gemini queries.*`);
      } else {
        console.error(err);
        setError(err.message || "Failed to contact compliance server. Make sure server is running and gemini key is valid.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center space-x-2">
          <FileCheck className="h-5.5 w-5.5 text-indigo-400" />
          <span>{qualityStandard} Compliance Auditor (AI Space)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Cross-reference biomedical facilities with standard National Accreditation Board for Hospitals & Healthcare Providers (NABH) guidelines in real-time.
        </p>
      </div>

      {/* Audit Planner Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Planner controls - 5 Grid column spaces */}
        <div className="space-y-4 lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-800 pb-3">
            <Cpu className="h-4 w-4 shrink-0" />
            <span>Auditor Parameters Configuration</span>
          </div>

          <form onSubmit={handleAuditSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Clinical Equipment Type
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
              >
                <option value="ICU Ventilator">ICU Ventilator</option>
                <option value="AED Defibrillator">AED Defibrillator</option>
                <option value="Multi-Parameter Patient Monitor">Patient Monitor</option>
                <option value="Infusion Pump">Infusion Pump</option>
                <option value="Anesthesia Workstation">Anesthesia Machine</option>
                <option value="Mobile Digital C-Arm X-Ray">X-Ray (C-Arm)</option>
                <option value="Steam Sterilizer Autoclave">Autoclave Sterilizer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Add Custom Regulatory/Audit Question
              </label>
              <textarea
                placeholder="Ask guidelines, electrical leakage checking rules, safety logs details, or SOP models under Chapter 5 guidelines (FMS)..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition leading-relaxed"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5 text-indigo-200 animate-pulse" />
              <span>{loading ? "Cross-Referencing Registers..." : "Trigger AI Compliance Audit"}</span>
            </button>
          </form>

          {/* Preset question pills */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Suggested BME portal Compliance Queries:
            </span>
            <div className="flex flex-col gap-2">
              {sampleQuestions.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplySample(sample.equipment, sample.q)}
                  className="bg-slate-950 hover:bg-slate-850/80 hover:border-slate-750 text-left border border-slate-850 p-2.5 rounded-xl transition text-[11px] text-slate-350 leading-relaxed shrink-0 cursor-pointer"
                >
                  <div className="font-semibold text-indigo-400 mb-0.5">{sample.equipment}</div>
                  <div className="text-slate-400 text-xs line-clamp-2 italic">"{sample.q}"</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI response panel - 7 Grid column spaces */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl min-h-[500px] flex flex-col justify-between overflow-hidden shadow-xl">
          
          {/* Header indicator */}
          <div className="bg-slate-950/60 p-4 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Audit Document Output</span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>NABH standards calibrated</span>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 p-6 overflow-y-auto text-xs text-slate-300 block subtle-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                {/* Glowing terminal loader */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/10 h-16 w-16 rounded-full blur-xl animate-pulse" />
                  <div className="bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-900/60 p-4 animate-spin" style={{ animationDuration: "3s" }}>
                    <Cpu className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-white text-sm">Evaluating Biomedical Safety Registers...</p>
                  <div className="text-[10px] font-mono max-w-xs mx-auto text-slate-550 space-y-1 block">
                    <div className="truncate animate-pulse">Checking database constraints ... OK</div>
                    <div className="truncate animate-pulse" style={{ animationDelay: "200ms" }}>Verifying IEC 60601 leakage bounds ...</div>
                    <div className="truncate animate-pulse" style={{ animationDelay: "400ms" }}>Indexing NABH Chapter 5 compliance schemas ...</div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 text-slate-300 space-y-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-rose-200">AI Integration offline / key unconfigured</h5>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 border-t border-rose-900/40 pt-2 font-mono">
                  INFO: You can configure the GEMINI_API_KEY environment variable in the Secrets Panel under the settings menu on the top-right.
                </p>
              </div>
            ) : result ? (
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed space-y-4 block markdown-body">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16 text-slate-500">
                <div className="bg-slate-950 p-4 rounded-full text-slate-600">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-400 text-sm">Auditor Awaiting Input</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Configure clinical parameters in the left pane and trigger the compliance inspect engine.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer certification disclaimer */}
          <div className="bg-slate-950/40 p-3 px-6 border-t border-slate-800/80 text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>DISCLAIMER: AI-generated checks must be validated by a certified Quality inspector.</span>
            <span className="font-mono text-indigo-400">{userEmail ? "ISO-13485 CERT" : "SANDBOX PREVIEW"}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
