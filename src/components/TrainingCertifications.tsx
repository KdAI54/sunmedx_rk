import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  User, 
  Check, 
  Users, 
  BookOpen, 
  Award,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Cpu,
  Brain,
  AlertCircle,
  CheckCircle,
  Save,
  ArrowRight,
  Sparkle,
  Play,
  ChevronLeft,
  FileText,
  HelpCircle,
  Wrench
} from "lucide-react";
import { Course } from "../types";

interface TrainingCertificationsProps {
  courses: Course[];
  enrolledCourseIds: string[];
  onEnroll: (courseId: string) => void;
  userEmail: string | undefined;
  onAddCourse?: (course: Omit<Course, "id">) => Promise<void>;
  userRole?: string;
  apiBaseUrl?: string;
}

const LOADING_STEPS = [
  "Analyzing clinical compliance directives...",
  "Acquiring accredited clinical engineer credentials...",
  "Synthesizing 4-stage modular curriculums...",
  "Validating certification syllabus structures..."
];

export default function TrainingCertifications({ 
  courses, 
  enrolledCourseIds, 
  onEnroll, 
  userEmail,
  onAddCourse,
  userRole,
  apiBaseUrl = ""
}: TrainingCertificationsProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Selected module inside active course
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
  const [contentType, setContentType] = useState<"lecture" | "quiz" | "lab" | "cheatsheet">("lecture");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [contentError, setContentError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScoreSubmitted, setQuizScoreSubmitted] = useState(false);
  const [labChecks, setLabChecks] = useState<boolean[]>([]);

  // Clear sub-states on active course change
  useEffect(() => {
    setActiveModuleIndex(null);
    setGeneratedContent(null);
    setContentError("");
  }, [selectedCourse]);

  const handleSelectModule = (index: number) => {
    setActiveModuleIndex(index);
    setGeneratedContent(null);
    setContentError("");
    setQuizAnswers({});
    setQuizScoreSubmitted(false);
    setLabChecks([]);
    setActiveSlide(0);
    
    // Smooth scroll down to workspace
    setTimeout(() => {
      document.getElementById("academy-content-creation-desk")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleGenerateContent = async (type: "lecture" | "quiz" | "lab" | "cheatsheet") => {
    if (!selectedCourse || activeModuleIndex === null) return;
    
    setGeneratingContent(true);
    setContentError("");
    setGeneratedContent(null);
    setContentType(type);
    
    // Reset players
    setActiveSlide(0);
    setQuizAnswers({});
    setQuizScoreSubmitted(false);
    
    const moduleTitle = selectedCourse.modules[activeModuleIndex];
    
    try {
      const endpointBase = (apiBaseUrl || "").trim().replace(/\/+$/, "");
      const response = await fetch(`${endpointBase}/api/courses/create-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: selectedCourse.title,
          moduleTitle: moduleTitle,
          level: selectedCourse.level,
          contentType: type
        })
      });

      const contentTypeHeader = response.headers.get("content-type") || "";
      if (!response.ok || !contentTypeHeader.includes("application/json")) {
        throw new Error("STATIC_HOST_NO_API");
      }

      const data = await response.json();
      setGeneratedContent(data);
      
      if (type === "lab" && data.verificationChecklist) {
        setLabChecks(new Array(data.verificationChecklist.length).fill(false));
      }
    } catch (err: any) {
      if (err?.message === "STATIC_HOST_NO_API" || err?.name === "TypeError") {
        // Static GitHub Pages fallback content
        if (type === "lecture") {
          setGeneratedContent({
            slides: [
              {
                title: `Introduction: ${moduleTitle}`,
                bullets: [
                  "Primary operational architecture and clinical safety parameters.",
                  "NABH & IEC 60601-1 compliance frameworks and environmental requirements.",
                  "Subsystem power thresholds, sensor calibration, and telemetry alignment."
                ],
                speakerNotes: "Review primary system tolerances and safety limits before connecting test analyzers."
              },
              {
                title: "Diagnostics & Calibration Protocol",
                bullets: [
                  "Protective earth impedance verification (≤ 0.2 Ohms).",
                  "Chassis leakage current testing under normal (≤ 100 µA) and single-fault (≤ 500 µA) states.",
                  "Signal gain alignment using NIST-traceable clinical simulators."
                ],
                speakerNotes: "Log every reading directly inside the Asset & Service Hub compliance register."
              }
            ]
          });
        } else if (type === "quiz") {
          setGeneratedContent({
            questions: [
              {
                id: "Q-01",
                question: `Under IEC 60601-1, what is the maximum protective earth grounding resistance permitted during ${moduleTitle} inspection?`,
                options: ["0.1 Ohms", "0.2 Ohms", "0.5 Ohms", "1.0 Ohms"],
                correctOption: 1,
                explanation: "NABH and IEC 60601-1 specify a maximum protective earth ground resistance of 0.2 Ohms."
              },
              {
                id: "Q-02",
                question: "What is the immediate mandatory action if a biomedical unit fails electrical safety testing?",
                options: [
                  "Apply a software offset and clear alarms",
                  "Tag OUT OF SERVICE, isolate equipment, and file a critical service ticket",
                  "Schedule repair for the next quarterly cycle",
                  "Reboot and return to ICU service"
                ],
                correctOption: 1,
                explanation: "Failed units must be quarantined immediately with an OUT OF SERVICE tag to protect patient safety."
              }
            ]
          });
        } else if (type === "lab") {
          const checklist = [
            "Ground loop resistance ≤ 0.2 Ohms verified",
            "Chassis leakage ≤ 100 µA confirmed",
            "Dated calibration seal applied to chassis"
          ];
          setGeneratedContent({
            objectives: [
              `Verify operational safety parameters for ${moduleTitle}.`,
              "Perform full IEC 60601-1 electrical leakage and grounding checks.",
              "Document traceability inside the NABH audit ledger."
            ],
            toolsRequired: [
              "Biomedical Electrical Safety Analyzer (Fluke ESA615)",
              "Calibrated Digital Multimeter",
              "ESD Wrist Strap & Protective Earth Leads"
            ],
            procedureSteps: [
              {
                title: "Physical & Power Isolation Check",
                instruction: "Inspect power cords, strain reliefs, and enclosure integrity before energizing the unit."
              },
              {
                title: "Safety Analyzer Verification",
                instruction: "Measure ground resistance (≤ 0.2 Ω) and chassis leakage (≤ 100 µA) across normal and reverse polarity."
              }
            ],
            verificationChecklist: checklist
          });
          setLabChecks(new Array(checklist.length).fill(false));
        } else {
          setGeneratedContent({
            summary: `Quick field reference for ${moduleTitle} within ${selectedCourse.title}.`,
            keyThresholds: [
              "Protective Earth Impedance: ≤ 0.2 Ohms",
              "Chassis Leakage (Normal): ≤ 100 µA",
              "Chassis Leakage (Single Fault): ≤ 500 µA"
            ],
            calibrationIntervals: [
              "Electrical Safety Audit: Every 6 Months",
              "Full Performance Calibration: Every 12 Months"
            ],
            commonTroubleshooting: [
              {
                symptom: "Calibration Drift Alert",
                rootCause: "Sensor aging or reference voltage instability",
                correctiveAction: "Perform two-point calibration with certified reference simulator."
              }
            ]
          });
        }
      } else {
        console.error(err);
        setContentError(err.message || "An unexpected error occurred during asset design synthesis.");
      }
    } finally {
      setGeneratingContent(false);
    }
  };

  // AI Course Generator States
  const [showGenerator, setShowGenerator] = useState(false);
  const [concept, setConcept] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [department, setDepartment] = useState("Radiology");
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [previewCourse, setPreviewCourse] = useState<Omit<Course, "id"> | null>(null);

  // Cycle through compliance loading screens in background
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating && !previewCourse) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1800);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generating, previewCourse]);

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      setErrorMsg("Please specify an equipment concept or specialized clinical role.");
      return;
    }

    setGenerating(true);
    setPreviewCourse(null);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpointBase = (apiBaseUrl || "").trim().replace(/\/+$/, "");
      const response = await fetch(`${endpointBase}/api/courses/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, level, department })
      });

      const contentTypeHeader = response.headers.get("content-type") || "";
      if (!response.ok || !contentTypeHeader.includes("application/json")) {
        throw new Error("STATIC_HOST_NO_API");
      }

      const parsedCourse = await response.json();
      setPreviewCourse(parsedCourse);
    } catch (err: any) {
      if (err?.message === "STATIC_HOST_NO_API" || err?.name === "TypeError") {
        const cleanConcept = concept.trim();
        const prefix = department.slice(0, 3).toUpperCase() || "BME";
        const courseNum = Math.floor(300 + Math.random() * 300);
        const upcoming = new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        });
        setPreviewCourse({
          title: `Technical Accreditation: ${cleanConcept}`,
          code: `${prefix}-${courseNum}`,
          description: `Accredited ${level.toLowerCase()} clinical engineering curriculum covering maintenance protocols, diagnostics, and IEC 60601-1 safety testing for ${cleanConcept} in ${department}.`,
          duration: level === "Advanced" ? "16 Hours / 4 Intensive Sessions" : "8 Hours / 2 Training Blocks",
          instructor: "Dr. Elena Vance, CCE, Senior Clinical Systems Specialist",
          level,
          date: upcoming,
          modules: [
            `Operational Fundamentals: Core architecture of ${cleanConcept}`,
            `${level} Practical: Calibration standards & telemetry tolerances`,
            `Risk Mitigation: Critical safety routines for ${cleanConcept}`,
            `NABH Compliance Assessment: Audit documentation & sign-off`
          ]
        });
      } else {
        console.error("Failed generating course syllabus:", err);
        setErrorMsg(err.message || "An unexpected error occurred during course curriculum modeling.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!previewCourse) return;
    if (!onAddCourse) {
      setErrorMsg("Publishing action is currently restricted inside this mock container.");
      return;
    }

    setGenerating(true);
    setErrorMsg("");
    try {
      await onAddCourse(previewCourse);
      setSuccessMsg(`"${previewCourse.title}" has been registered successfully!`);
      
      // Auto reset states after a brief period
      setConcept("");
      setPreviewCourse(null);
      setTimeout(() => {
        setShowGenerator(false);
        setSuccessMsg("");
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize newly generated certification course with database.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Page Title with Interactive AI Launch Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center space-x-2">
            <GraduationCap className="h-5.5 w-5.5 text-indigo-400 font-bold" />
            <span>Biomedical Technician Academy</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enroll in accredited certifications, calibration seminars, and regulatory safety modules for senior medical engineers.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setShowGenerator(!showGenerator);
              setPreviewCourse(null);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/15 cursor-pointer border border-indigo-500/20 active:scale-95"
            id="toggle-ai-course-generator"
          >
            <Sparkles className="h-4 w-4 text-yellow-350 animate-pulse shrink-0" />
            <span>{showGenerator ? "Hide SunMedx Academy" : "SunMedx Academy"}</span>
          </button>
        </div>
      </div>

      {/* Embedded AI Course Generator Bento Card Container */}
      {showGenerator && (
        <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="bg-indigo-950 text-indigo-400 p-2 border border-indigo-900/50 rounded-xl">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider font-bold text-indigo-400 uppercase">
                  SunMedx Academy
                </span>
                <h3 className="font-bold text-sm text-white font-sans mt-0.5">Custom Clinical Syllabus Design</h3>
              </div>
            </div>
            <button
              onClick={() => {
                setShowGenerator(false);
                setPreviewCourse(null);
              }}
              className="text-slate-500 hover:text-slate-300 text-xs font-semibold px-2 py-1 bg-slate-950 rounded-lg cursor-pointer transition border border-slate-800/50"
            >
              Close Panel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Input parameters panel */}
            <form onSubmit={handleGenerateCourse} className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  1. Focus Equipment Concept / Core Technology
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3T MRI Superconductive Safety & Helium Refilling"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  disabled={generating}
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Input specific clinical models, calibration protocols, or compliance procedures.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    2. Target Skill Level
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    disabled={generating}
                  >
                    <option value="Beginner">Beginner (Safety Basic)</option>
                    <option value="Intermediate">Intermediate (Calibration Spec)</option>
                    <option value="Advanced">Advanced (Expert Auditor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    3. Main Department
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={generating}
                  >
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Emergency / ICU">Emergency / ICU</option>
                    <option value="General Clinical Ops">General Clinical Ops</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs p-3.5 rounded-xl flex items-start space-x-2">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs p-3.5 rounded-xl flex items-start space-x-2">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow shadow-indigo-650/10"
                >
                  {generating && !previewCourse ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Academy AI Staging Syllabus...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-indigo-300" />
                      <span>Formulate Syllabus Program</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Stage Preview column */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-850 p-5 rounded-2xl min-h-[290px] flex flex-col justify-between relative">
              
              {/* 1. Loading active state */}
              {generating && !previewCourse && (
                <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-500/20 h-10 blur-xl animate-pulse rounded-full" />
                    <Cpu className="h-10 w-10 text-indigo-400 animate-spin stroke-[1.5]" style={{ animationDuration: "3s" }} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest animate-pulse block">
                      Staging AI Academy Syllabus
                    </span>
                    <p className="text-xs text-slate-300 font-medium">
                      {LOADING_STEPS[loadingStep]}
                    </p>
                  </div>
                  <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-[shimmer_1.5s_infinite_ease-in-out]" style={{ width: "60%" }} />
                  </div>
                </div>
              )}

              {/* 2. Static previewCourse content staging */}
              {previewCourse ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-indigo-950/40 pb-3 mb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            {previewCourse.code}
                          </span>
                          <span className="bg-slate-900 text-slate-400 font-mono text-[9px] font-semibold px-2 py-0.5 rounded">
                            {previewCourse.level}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base leading-snug font-sans mt-1.5">
                          {previewCourse.title}
                        </h4>
                      </div>
                      <span className="text-[10px] bg-amber-950/40 border border-amber-900/30 text-amber-400 font-mono font-bold px-2 py-1 rounded">
                        Accredited
                      </span>
                    </div>

                    <p className="text-slate-350 text-xs leading-relaxed mb-4">
                      {previewCourse.description}
                    </p>

                    <div className="space-y-2">
                      <span className="text-[10px] text-indigo-450 font-bold font-mono uppercase tracking-widest block mb-2.5">
                        Modular Certification Syllabus
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {previewCourse.modules.map((mod, index) => (
                          <div key={index} className="bg-slate-900/70 border border-slate-850 p-2.5 rounded-xl flex items-start space-x-2">
                            <span className="text-indigo-400 font-mono font-bold">0{index + 1}.</span>
                            <span className="text-slate-300 font-sans font-medium line-clamp-1">{mod}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metadata & publishing control */}
                  <div className="pt-4 mt-4 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-mono font-semibold">
                      <span className="flex items-center text-slate-450">
                        <Clock className="h-3.5 w-3.5 mr-1 text-slate-500 shrink-0" />
                        {previewCourse.duration}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500 shrink-0" />
                        {previewCourse.date}
                      </span>
                      <span className="flex items-center">
                        <User className="h-3.5 w-3.5 mr-1 text-slate-500 shrink-0" />
                        {previewCourse.instructor.split(",")[0]}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 self-end">
                      <button
                        type="button"
                        onClick={() => setPreviewCourse(null)}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCourse}
                        disabled={generating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5 shrink-0" />
                        <span>Publish to Indices</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-500">
                  <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-full text-indigo-400/40">
                    <Sparkle className="h-7 w-7 text-indigo-550 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-400 text-xs">Syllabus Planner Uninitialized</h5>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Fill out the biomedical core technology concept parameter profile on the left to review the staged curriculum draft.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid containing courses list & single class modules view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Available courses lists (7 Grid Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Certified Training Program Index ({courses.length})
          </h3>

          <div className="space-y-4">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id);
              return (
                <div 
                  key={course.id} 
                  onClick={() => setSelectedCourse(course)}
                  className={`border rounded-2xl p-5 bg-slate-900 cursor-pointer hover:bg-slate-900/80 transition-all text-left ${
                    selectedCourse?.id === course.id 
                      ? "border-indigo-500 shadow-md shadow-indigo-600/[0.02]" 
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-semibold tracking-wider bg-slate-800 border border-slate-750 text-indigo-400 px-2 py-0.5 rounded uppercase">
                          {course.code}
                        </span>
                        <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                          course.level === "Advanced"
                            ? "bg-rose-950 text-rose-400 border border-rose-900/50"
                            : course.level === "Intermediate"
                            ? "bg-amber-950 text-amber-400 border border-amber-900/50"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-950/50"
                        }`}>
                          {course.level}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base font-sans mt-1.5 transition">
                        {course.title}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="shrink-0 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isEnrolled) onEnroll(course.id);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                          isEnrolled 
                            ? "bg-indigo-950/50 text-indigo-400 border border-indigo-900/60 cursor-default" 
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-600/10 active:scale-95"
                        }`}
                      >
                        {isEnrolled ? (
                          <>
                            <Check className="h-4.5 w-4.5" />
                            <span>Enrolled</span>
                          </>
                        ) : (
                          <span>Enroll Course</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                      {course.duration}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                      {course.date}
                    </span>
                    <span className="flex items-center">
                      <User className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
                      {course.instructor.split(",")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected course details/syllabus (5 Grid Columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[460px] flex flex-col justify-between">
          {selectedCourse ? (
            <>
              {/* Syllabus Header */}
              <div className="p-5 border-b border-slate-800/80 bg-slate-950/30">
                <span className="text-xs font-mono font-bold text-indigo-400 block uppercase mb-1">
                  Certification Syllabus
                </span>
                <h4 className="font-bold text-white text-base leading-tight font-sans">
                  {selectedCourse.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 font-mono italic">
                  Instructor: {selectedCourse.instructor}
                </p>
              </div>

              {/* Modules list */}
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-semibold uppercase">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    <span>Curriculum Milestones</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Click to design content</span>
                </div>

                <div className="space-y-2 text-xs">
                  {selectedCourse.modules.map((mod, index) => {
                    const isModuleActive = activeModuleIndex === index;
                    return (
                      <button 
                        key={index} 
                        type="button"
                        onClick={() => handleSelectModule(index)}
                        className={`w-full text-left bg-slate-950 border p-3.5 rounded-xl flex items-start space-x-3 transition cursor-pointer active:scale-[0.98] ${
                          isModuleActive 
                            ? "border-indigo-500 bg-indigo-950/20 shadow-md" 
                            : "border-slate-850 hover:border-slate-800"
                        }`}
                      >
                        <div className={`font-mono font-bold h-6 w-6 rounded-lg flex items-center justify-center text-[10px] border shrink-0 mt-0.5 transition ${
                          isModuleActive
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-900 text-slate-450 border-slate-800"
                        }`}>
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="space-y-0.5">
                          <h5 className={`font-semibold transition ${isModuleActive ? "text-indigo-400" : "text-slate-200"}`}>
                            {mod}
                          </h5>
                          <p className="text-[9px] text-slate-500 font-mono leading-tight">
                            {isModuleActive ? "Syllabus designer active. Scroll to workspace." : "Click to launch modular AI content creator workspace."}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Syllabus Footer enrollment triggers */}
              <div className="p-5 border-t border-slate-850 bg-slate-950/50 text-center">
                {enrolledCourseIds.includes(selectedCourse.id) ? (
                  <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold text-xs bg-indigo-950/35 border border-indigo-900/60 p-2.5 rounded-xl">
                    <ShieldCheck className="h-4.5 w-4.5 animate-pulse" />
                    <span>Technician Enrolled & Schedule Confirmed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onEnroll(selectedCourse.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/15 cursor-pointer border-indigo-500/10 active:scale-95"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Confirm Class Registration</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-mono block mt-2">
                  {userEmail ? `Authorized as ${userEmail}` : "Signing in as Guest Demo Admin"}
                </span>
              </div>
            </>
          ) : (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4 text-slate-500 py-16">
              <div className="bg-slate-950 p-4.5 rounded-full text-slate-600">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <h5 className="font-bold text-slate-400 text-sm">No Curriculum Selected</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Choose a biomedical certified training course in the catalog index panel to examine module listings.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Active Module Content Gen Desk */}
      {selectedCourse && activeModuleIndex !== null && (
        <div 
          className="bg-slate-900 border border-indigo-500/20 rounded-2xl overflow-hidden shadow-xl mt-6 font-sans scroll-mt-6"
          id="academy-content-creation-desk"
        >
          {/* Header */}
          <div className="bg-slate-950/85 border-b border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-900 text-indigo-400">
                <Cpu className="h-5 w-5 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono tracking-wider font-bold text-indigo-400 uppercase">
                    AI Content Creator Desk
                  </span>
                  <span className="bg-slate-950 text-slate-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border border-slate-850">
                    {selectedCourse.code} · Module 0{activeModuleIndex + 1}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white mt-1">
                  Active Topic: {selectedCourse.modules[activeModuleIndex]}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModuleIndex(null);
                  setGeneratedContent(null);
                }}
                className="text-slate-400 hover:text-white text-xs bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer transition active:scale-95"
              >
                Clear Workspace
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Selector Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Select Educational Asset
                </h4>
                <span className="text-[9px] text-indigo-400 font-mono animate-pulse">Design Desk Active</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "lecture",
                    label: "Lecture Slide Deck",
                    desc: "Interactive presenter slides with technical bullet reviews & speaker notes.",
                    icon: Play,
                    color: "text-blue-400 bg-blue-950/40 border-blue-900/30",
                  },
                  {
                    id: "quiz",
                    label: "Accreditation Quiz",
                    desc: "Generates clinical scenarios and practice certification exams.",
                    icon: HelpCircle,
                    color: "text-amber-400 bg-amber-950/40 border-amber-900/30",
                  },
                  {
                    id: "lab",
                    label: "Virtual Lab Guidelines",
                    desc: "Calibration checklist scripts, required biosensors, and safety audits.",
                    icon: Wrench,
                    color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/30",
                  },
                  {
                    id: "cheatsheet",
                    label: "Diagnostic Cheat-Sheet",
                    desc: "Operational voltage indices, leak limits, and troubleshooting constants.",
                    icon: FileText,
                    color: "text-pink-400 bg-pink-950/40 border-pink-900/30",
                  }
                ].map((artifact) => (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => handleGenerateContent(artifact.id as any)}
                    disabled={generatingContent}
                    className={`w-full text-left p-4 rounded-xl border transition flex items-start space-x-3.5 cursor-pointer active:scale-[0.98] ${
                      contentType === artifact.id && generatedContent
                        ? "bg-indigo-950/40 border-indigo-700/60 shadow-lg shadow-indigo-600/[0.02]"
                        : "bg-slate-950 hover:bg-slate-950/70 border-slate-850"
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${artifact.color}`}>
                      <artifact.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{artifact.label}</span>
                        {contentType === artifact.id && generatedContent && (
                          <span className="bg-indigo-900/40 text-[9px] font-mono text-indigo-400 font-bold px-1.5 py-0.2 rounded border border-indigo-800/40">
                            Loaded
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-450 leading-normal">{artifact.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Practical Guidance */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Sparkle className="h-3.5 w-3.5 text-indigo-400" />
                  Engineering Insight
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Select any design module to build or reload content. The compiler generates precise hospital accreditation guidelines tailored to raw equipment telemetry.
                </p>
              </div>
            </div>

            {/* Right Display player (8 cols) */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-2xl min-h-[380px] p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />

              {/* Generating overlay */}
              {generatingContent && (
                <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-500/20 h-10 blur-xl animate-pulse rounded-full" />
                    <Cpu className="h-10 w-10 text-indigo-400 animate-spin stroke-[1.5]" style={{ animationDuration: "2s" }} />
                  </div>
                  <div className="space-y-1 my-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest animate-pulse block">
                      Executing Academy AI Gen Engine
                    </span>
                    <h4 className="text-sm font-semibold text-white">Synthesizing clinical {contentType} curriculum logs...</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Formulating specialized calibrations, board scenarios, and performance tolerances.
                    </p>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {contentError && (
                <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 my-auto">
                  <AlertCircle className="h-9 w-9 text-rose-500" />
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">AI Synthesis Drift Detected</h4>
                  <p className="text-xs text-slate-450 max-w-md">{contentError}</p>
                </div>
              )}

              {/* Output renderer template wrapper */}
              {generatedContent ? (
                <div className="flex-1 flex flex-col justify-between">
                  
                  {/* SLIDES */}
                  {contentType === "lecture" && generatedContent.slides && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Play className="h-4 w-4 shrink-0" />
                          Interactive Lecture Slides ({activeSlide + 1} / {generatedContent.slides.length})
                        </span>
                        <span className="text-[10px] bg-slate-900 text-slate-500 font-mono px-2.5 py-0.5 rounded border border-slate-800">
                          Clinical Presentation Mode
                        </span>
                      </div>

                      <div className="flex-1 py-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                        <div className="md:col-span-7 bg-slate-900/40 border border-slate-850 p-6 rounded-xl flex flex-col justify-between relative shadow-inner">
                          <div className="space-y-4">
                            <h4 className="font-bold text-white text-base font-sans tracking-tight border-b border-indigo-950/20 pb-2 flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 bg-indigo-950 border border-indigo-900/60 rounded">
                                Slide 0{activeSlide + 1}
                              </span>
                              {generatedContent.slides[activeSlide]?.title}
                            </h4>
                            
                            <ul className="space-y-3 flex-1">
                              {generatedContent.slides[activeSlide]?.bullets.map((bullet: string, bidx: number) => (
                                <li key={bidx} className="flex items-start text-xs text-slate-300 leading-relaxed font-sans">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5 mr-2.5"></span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-6 border-t border-slate-900/60 mt-4">
                            <button
                              type="button"
                              disabled={activeSlide === 0}
                              onClick={() => setActiveSlide(prev => prev - 1)}
                              className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition active:scale-95"
                            >
                              Previous Slide
                            </button>
                            <button
                              type="button"
                              disabled={activeSlide === generatedContent.slides.length - 1}
                              onClick={() => setActiveSlide(prev => prev + 1)}
                              className="bg-indigo-650 hover:bg-indigo-650 text-white px-4.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-40 transition active:scale-95"
                            >
                              Next Slide
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-5 bg-indigo-950/10 border border-indigo-950/30 p-5 rounded-xl flex flex-col space-y-3">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-950/40 pb-2">
                            <Users className="h-3.5 w-3.5" />
                            Instructor Lecturing Notes
                          </span>
                          <p className="text-[11px] text-slate-350 leading-relaxed font-sans italic">
                            "{generatedContent.slides[activeSlide]?.speakerNotes}"
                          </p>
                          <div className="pt-2 border-t border-slate-900/50 mt-auto">
                            <span className="block text-[9px] font-mono text-slate-500">
                              SAFETY PRINCIPLE: Master these instructional components prior to performing hardware evaluations.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QUIZ */}
                  {contentType === "quiz" && generatedContent.questions && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4 shrink-0" />
                          Board Accreditation Exam Simulator
                        </span>
                        {quizScoreSubmitted ? (
                          <span className="text-[10px] bg-slate-900 text-slate-350 font-mono px-2 py-0.5 rounded border border-slate-800">
                            Exam Ledger Certified
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-950/20 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-900/30 animate-pulse">
                            Response window active
                          </span>
                        )}
                      </div>

                      <div className="max-h-[290px] overflow-y-auto space-y-5 pr-1 subtle-scrollbar flex-1">
                        {generatedContent.questions.map((q: any, qidx: number) => {
                          const selectedOption = quizAnswers[qidx];
                          const showRationale = quizScoreSubmitted || selectedOption !== undefined;
                          return (
                            <div key={q.id || qidx} className="bg-slate-900/30 border border-slate-850 p-4.5 rounded-xl space-y-3">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono text-amber-400 font-bold block bg-amber-950/20 w-fit px-1.5 py-0.5 rounded border border-amber-900/20">
                                  QUESTION {qidx + 1} OF {generatedContent.questions.length} · ID: {q.id}
                                </span>
                                <h4 className="text-white text-xs font-semibold leading-relaxed font-sans">
                                  {q.question}
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {q.options.map((option: string, oidx: number) => {
                                  const isSelected = selectedOption === oidx;
                                  const isCorrect = q.correctOption === oidx;
                                  let btnStyle = "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-300";
                                  
                                  if (quizScoreSubmitted) {
                                    if (isCorrect) {
                                      btnStyle = "bg-emerald-950/40 border-emerald-800 text-emerald-300 font-bold";
                                    } else if (isSelected) {
                                      btnStyle = "bg-rose-950/40 border-rose-900 text-rose-400";
                                    } else {
                                      btnStyle = "bg-slate-950/10 border-slate-900 text-slate-500 opacity-50";
                                    }
                                  } else if (isSelected) {
                                    btnStyle = "bg-indigo-950/40 border-indigo-650 text-indigo-300 font-bold";
                                  }

                                  return (
                                    <button
                                      key={oidx}
                                      disabled={quizScoreSubmitted}
                                      type="button"
                                      onClick={() => {
                                        setQuizAnswers(prev => ({ ...prev, [qidx]: oidx }));
                                      }}
                                      className={`w-full text-left p-3 rounded-xl border text-xs leading-normal transition flex items-center space-x-2.5 cursor-pointer disabled:cursor-not-allowed ${btnStyle}`}
                                    >
                                      <span className="font-mono font-bold text-[10px] text-slate-500">
                                        {["A", "B", "C", "D"][oidx]}.
                                      </span>
                                      <span className="font-sans font-medium">{option}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {showRationale && (
                                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed transition ${
                                  selectedOption === q.correctOption
                                    ? "bg-emerald-950/10 border-emerald-950/20 text-slate-300"
                                    : "bg-amber-950/10 border-amber-950/25 text-slate-300"
                                }`}>
                                  <div className="flex items-center mb-1 gap-1.5">
                                    <span className="font-bold text-[9px] font-mono uppercase tracking-wide text-amber-500">
                                      Teaching Explanation
                                    </span>
                                  </div>
                                  <p className="text-slate-450 leading-relaxed font-sans">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                        <div className="text-[11px] text-slate-400 font-mono">
                          {quizScoreSubmitted ? (
                            (() => {
                              const totalQuestions = generatedContent.questions.length;
                              let score = 0;
                              generatedContent.questions.forEach((q: any, i: number) => {
                                if (quizAnswers[i] === q.correctOption) score++;
                              });
                              const percent = Math.round((score / totalQuestions) * 100);
                              return (
                                <span className={`font-bold flex items-center gap-1.5 ${percent >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                                  Result Stamp: {score} / {totalQuestions} Correct ({percent}%) 
                                  {percent >= 75 ? " · Pass Certification" : " · Re-evaluation required"}
                                </span>
                              );
                            })()
                          ) : (
                            <span>Practise active. Select test choices above for response verification.</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizScoreSubmitted(false);
                            }}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                          >
                            Reset Exam
                          </button>
                          {!quizScoreSubmitted && (
                            <button
                              type="button"
                              onClick={() => setQuizScoreSubmitted(true)}
                              className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs px-4.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-lg shadow-indigo-600/15"
                            >
                              Submit Legers
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LAB */}
                  {contentType === "lab" && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 shrink-0" />
                          Virtual Lab Calibration and Safety Procedures
                        </span>
                        <span className="text-[10px] bg-slate-900 text-slate-500 font-mono px-2.5 py-0.5 rounded border border-slate-800">
                          Interactive Physical Procedure
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1">
                        <div className="md:col-span-4 bg-slate-900/30 border border-slate-850 p-4.5 rounded-xl flex flex-col gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                              Required Equipment Tools
                            </span>
                            <ul className="space-y-1.5 text-[11px] text-slate-300">
                              {generatedContent.toolsRequired?.map((tool: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-1.5 leading-tight font-sans">
                                  <Cpu className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                  <span>{tool}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5 pt-3 border-t border-slate-850">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                              Calibration Objectives
                            </span>
                            <ul className="space-y-1.5 text-[11px] text-slate-350">
                              {generatedContent.objectives?.map((obj: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-normal font-sans">
                                  <span className="h-1 w-1 bg-emerald-450 rounded-full shrink-0 mt-1.5 mr-0.5"></span>
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                          <div className="space-y-2 max-h-[175px] overflow-y-auto subtle-scrollbar pr-1 flex-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                              Calibration Sequence Steps
                            </span>

                            {generatedContent.procedureSteps?.map((step: any, sidx: number) => (
                              <div key={sidx} className="bg-slate-900/30 border border-slate-850 p-3.5 rounded-xl flex items-start space-x-3.5">
                                <div className="h-6 w-6 font-mono font-bold text-[10px] bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                                  0{sidx + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <h5 className="font-semibold text-white text-xs font-sans">{step.title}</h5>
                                  <p className="text-[11px] text-slate-400 leading-normal font-sans">{step.instruction}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-slate-900 space-y-2">
                            <span className="text-[10px] font-mono font-bold text-emerald-450 uppercase tracking-widest block">
                              Quality Assurance Verification Checkpoints
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {generatedContent.verificationChecklist?.map((check: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const next = [...labChecks];
                                    next[idx] = !next[idx];
                                    setLabChecks(next);
                                  }}
                                  className={`p-2.5 rounded-xl border text-[10px] text-left leading-normal flex items-start space-x-2 transition cursor-pointer ${
                                    labChecks[idx]
                                      ? "bg-emerald-950/30 border-emerald-800 text-emerald-400 font-bold"
                                      : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-350"
                                  }`}
                                >
                                  <div className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center ${
                                    labChecks[idx]
                                      ? "border-emerald-500 bg-emerald-600 text-slate-950"
                                      : "border-slate-800 bg-slate-950 text-transparent"
                                  }`}>
                                    <Check className="h-2.5 w-2.5" />
                                  </div>
                                  <span className="line-clamp-2 font-sans">{check}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[11px] font-mono mt-auto">
                        <div>
                          {labChecks.every(Boolean) && labChecks.length > 0 ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/20 px-3 py-1 border border-emerald-900/40 rounded-full text-[10px]">
                              <CheckCircle className="h-4 w-4" /> Physical Calibration Safe and NABH Standard Verified
                            </span>
                          ) : (
                            <span className="text-slate-500">Perform adjustments and verify checkpoints above.</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setLabChecks(new Array(generatedContent.verificationChecklist.length).fill(true))}
                          className="text-[10px] text-indigo-400 hover:text-indigo-350 cursor-pointer font-bold font-mono"
                        >
                          Auto Validate Checkpoints
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CHEATSHEET */}
                  {contentType === "cheatsheet" && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <span className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-4 w-4 shrink-0" />
                          Field Calibration and Auditing Reference Card
                        </span>
                        <span className="text-[10px] bg-slate-900 text-slate-500 font-mono px-2.5 py-0.5 rounded border border-slate-800">
                          Accredited References
                        </span>
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto subtle-scrollbar pr-1 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-2">
                            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                              Operational Summary & Context
                            </span>
                            <p className="text-slate-350 text-xs leading-relaxed font-sans">{generatedContent.summary}</p>
                          </div>

                          <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-2">
                            <span className="text-[11px] font-mono font-bold text-pink-400 uppercase tracking-widest block">
                              Calibration Schedules
                            </span>
                            <ul className="space-y-2 text-xs font-sans text-slate-300">
                              {generatedContent.calibrationIntervals?.map((interval: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-pink-450 shrink-0" />
                                  <span className="font-medium">{interval}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-2.5">
                          <span className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                            Mandatory Biomedical Safety Constants
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {generatedContent.keyThresholds?.map((threshold: string, idx: number) => (
                              <div key={idx} className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg flex flex-col justify-between">
                                <span className="text-[9px] font-mono text-slate-550 block uppercase mb-1">SAFETY CONST 0{idx + 1}</span>
                                <span className="text-white text-xs font-semibold font-sans">{threshold}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {generatedContent.commonTroubleshooting && (
                          <div className="bg-slate-900/30 border border-slate-850 rounded-xl overflow-hidden">
                            <div className="bg-indigo-950/20 border-b border-slate-850 p-3">
                              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                                Diagnostics Troubleshooting Matrix
                              </span>
                            </div>

                            <div className="p-4 space-y-4">
                              {generatedContent.commonTroubleshooting.map((trouble: any, idx: number) => {
                                return (
                                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-slate-850 last:border-0 last:pb-0 font-sans">
                                    <div className="md:col-span-3">
                                      <span className="text-[9px] text-rose-500 font-mono font-bold uppercase tracking-wider block">Symptom</span>
                                      <span className="text-white text-xs font-bold mt-0.5 block">{trouble.symptom}</span>
                                    </div>
                                    <div className="md:col-span-4">
                                      <span className="text-[9px] text-amber-500 font-mono font-bold uppercase tracking-wider block">Probable Cause</span>
                                      <span className="text-slate-450 text-xs mt-0.5 block">{trouble.rootCause}</span>
                                    </div>
                                    <div className="md:col-span-5">
                                      <span className="text-[9px] text-emerald-500 font-mono font-bold uppercase tracking-wider block">Immediate Action</span>
                                      <span className="text-emerald-400 text-xs font-medium mt-0.5 block">{trouble.correctiveAction}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-900 text-[10px] text-center font-mono text-slate-500 mt-auto">
                        Accreditation information matched to IEEE electronic devices clinical guidelines and local health statutes.
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-500 py-16">
                  <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-full text-indigo-400/40">
                    <Sparkles className="h-7 w-7 text-indigo-500/80 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-400 text-xs">Academy Simulator Pending</h5>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                      Click any of the educational asset templates on the left side to compile course materials in real-time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
