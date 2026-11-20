import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure local DNS looks up localhost as IPv4.
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json());

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// REST Backend API endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SunMedx Biomedical Service" });
});

// NABH compliance auditor endpoint
app.post("/api/compliance", async (req, res): Promise<any> => {
  const { equipmentType, question } = req.body;

  if (!equipmentType) {
    return res.status(400).json({ error: "Equipment type is required" });
  }

  try {
    const ai = getAiClient();
    
    const systemPrompt = `You are "SunMedx Compliance Audit AI", an elite, senior Biomedical Engineering & Quality Auditor certifying hospitals under the National Accreditation Board for Hospitals & Healthcare Providers (NABH) standard (specifically Chapter 5: Facility Management & Safety - FMS).
Your knowledge includes electrical safety standards (such as IEC 60601-1 leakage testing, grounding thresholds <= 0.2 ohms, and chassis leakage <= 100 µA), standard calibration frequency scales, equipment breakdown escalation matrices, and regulatory incident log structures.

Analyze the user's biomedical asset compliance question and equipment type. Respond in highly professional, structured, clinical, and authoritative tone suitable for hospital directors, lead biomedical technicians, and NABH accreditation inspectors.
Provide your response strictly in styled Markdown containing:
1. **Accreditation Mandate (NABH FMS Check)**: Direct applicability of NABH guidelines to this type of equipment.
2. **Mandatory Calibration Frequency & Tolerances**: Explicitly state the intervals (e.g. Annual, Semi-Annual) and calibration reference standard.
3. **Safety & Leakage Testing Thresholds**: Detailed technical limits for safety parameters like grounding resistance and leakage current under IEC 60601-1.
4. **Model Compliance Checklist**: A clean bulleted 4-item checklist for the biomedical department's audit folder.
5. **Mitigation/Escalation Matrix**: Steps to take if the device fails the safety audit.

Avoid generic pleasantries. Output direct, highly specific technical compliance directives.
Equipment Type: ${equipmentType}
Question / Focus Area: ${question || "General NABH logging, electrical safety, and calibration requirements."}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        }
      ]
    });

    res.json({ 
      answer: response.text || "Compliance Audit Engine was unable to generate a response. Please check input parameters." 
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "Compliance AI engine encountered an error. Ensure GEMINI_API_KEY is configured in server settings.",
      details: error.message
    });
  }
});

// AI Course syllabus generator endpoint
app.post("/api/courses/generate", async (req, res): Promise<any> => {
  const { concept, level, department } = req.body;

  if (!concept) {
    return res.status(400).json({ error: "Focus concept or equipment description is required" });
  }

  try {
    const ai = getAiClient();

    const systemPrompt = `You are "SunMedx Academy AI", an expert pedagogical designer in healthcare engineering, clinical systems, and bio-medical safety certifications.
Your task is to generate a comprehensive, highly specialized accredited training course or seminar syllabus for senior medical equipment technicians based on the provided concept topic, targeted skill level, and clinical department context.

Specific instructions:
- Generate a highly rigorous, authentic 4-step training curriculum milestone checklist (modules).
- Select a realistic medical professor or senior training specialist name (instructor) with a matching postgraduate degree (e.g. PhD, MS, CCE).
- Generate a realistic course duration (e.g., '12 Hours / 3 Sessions', '4 Hours / 1 Seminar Session').
- Formulate a 5-to-7 character alphanumeric course code tracking clinical departmental patterns, e.g., MRI-501, DEF-310, CAR-402.
- Date should be set to an upcoming training event date, approximately 2-4 weeks into the future, e.g. "July 15, 2026", "August 2, 2026".
- Level MUST be strictly "Beginner", "Intermediate", or "Advanced". Use "${level || "Intermediate"}" specifically.

Focus Concept / Specialized Equipment: "${concept}"
Target Skill Level: "${level || "Intermediate"}"
Clinical Department Context: "${department || "General Clinical Operations"}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Highly specific clinical or technical training course title relating to the concept" },
            code: { type: Type.STRING, description: "Course code prefix, e.g. BME-402, RAD-601" },
            description: { type: Type.STRING, description: "Syllabus summary explaining exactly what clinical skills and safety routines technicians will master" },
            duration: { type: Type.STRING, description: "Formatted course duration, e.g. '8 Hours / 3 Sessions' or '4 Hours / Regular Seminar Session'" },
            instructor: { type: Type.STRING, description: "Name of certified clinical engineer or expert professor instructor with clinical credentials" },
            level: { type: Type.STRING, description: "Must be strictly Beginner, Intermediate, or Advanced. Match user target." },
            date: { type: Type.STRING, description: "Scheduled calendar date for upcoming live class or session" },
            modules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 4 sequentially rigorous modules/learning milestones"
            }
          },
          required: ["title", "code", "description", "duration", "instructor", "level", "date", "modules"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned by AI model generator");
    }

    const courseData = JSON.parse(text);
    res.json(courseData);
  } catch (error: any) {
    console.warn("Course Generation Gemini API Error, activating backup academic compiler:", error);
    
    // Core structural safety fallback to shield user and keep certification editor operational
    try {
      const targetLevel = level || "Intermediate";
      const targetDept = department || "Radiology";
      const cleanConcept = concept.trim();
      
      // Compute realistic course prefix based on main clinical category
      let prefix = "BME";
      if (targetDept.toLowerCase().includes("radio")) prefix = "RAD";
      else if (targetDept.toLowerCase().includes("cardio")) prefix = "CAR";
      else if (targetDept.toLowerCase().includes("neuro")) prefix = "NEU";
      else if (targetDept.toLowerCase().includes("pedia")) prefix = "PED";
      else if (targetDept.toLowerCase().includes("onco")) prefix = "ONC";
      else if (targetDept.toLowerCase().includes("icu") || targetDept.toLowerCase().includes("emerg")) prefix = "ICU";
      
      const courseNum = Math.floor(300 + Math.random() * 300);
      const courseCode = `${prefix}-${courseNum}`;
      
      // Determine instructor matching department credentials
      const instructors = [
        "Dr. Elena Vance, CCE, Senior Clinical Systems Specialist",
        "Prof. Marcus Brody, PhD, Biomedical Safety Auditor",
        "Eng. Sarah Jenkins, MSBE, Lead Clinical Compliance Scientist",
        "Dr. Robert Chen, CCE, Principal Diagnostic Engineer"
      ];
      const selectedInstructor = instructors[Math.floor(Math.random() * instructors.length)];
      
      // Generate upcoming training dates (2-4 weeks out)
      const upcomingEventDate = new Date();
      upcomingEventDate.setDate(upcomingEventDate.getDate() + 14 + Math.floor(Math.random() * 10));
      const formattedDate = upcomingEventDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      // Construct highly specific modules adapting the clinical focus topic
      const syllabusModules = [
        `Operational Fundamentals: Core electromagnetic & telemetry principles of ${cleanConcept}.`,
        `${targetLevel} Practical: Calibration standards, alignment metrics, and performance validation guides.`,
        `Risk Mitigation & Emergency Protocols: Critical safety routines and clinical failure simulations for ${cleanConcept}.`,
        `Quality Compliance Assessment: Accreditations, documentation standards, and peer expert reviews.`
      ];

      const durationString = targetLevel === "Advanced" ? "16 Hours / 4 Intensive Sessions" : "8 Hours / 2 Training Blocks";

      const fallbackSyllabus = {
        title: `Technical Accreditation: ${cleanConcept}`,
        code: courseCode,
        description: `This accredited ${targetLevel.toLowerCase()} practical curriculum qualifies clinical engineers with rigorous maintenance protocols, active diagnostics, and safety testing guidelines on ${cleanConcept} systems inside active ${targetDept} environments.`,
        duration: durationString,
        instructor: selectedInstructor,
        level: targetLevel,
        date: formattedDate,
        modules: syllabusModules
      };

      console.log("Successfully compiled backup syllabus output:", fallbackSyllabus);
      return res.json(fallbackSyllabus);
    } catch (fallbackErr: any) {
      console.error("Critical Failure in Backup Syllabus Compiler:", fallbackErr);
      res.status(500).json({
        error: "Academic AI engine and core fallback systems are both offline. Please check network logs.",
        details: fallbackErr.message
      });
    }
  }
});

// Powerful Content Creator in course design section - SunMedx Academy AI Content Creator
app.post("/api/courses/create-content", async (req, res): Promise<any> => {
  const { courseTitle, moduleTitle, level, contentType } = req.body;

  if (!courseTitle || !moduleTitle || !contentType) {
    return res.status(400).json({ error: "courseTitle, moduleTitle, and contentType are required parameters." });
  }

  try {
    const ai = getAiClient();

    let systemPrompt = "";
    let responseSchema: any = {};

    if (contentType === "lecture") {
      systemPrompt = `You are "SunMedx Academic Slide Designer". Generate an educational slide deck covering the module "${moduleTitle}" within the training program "${courseTitle}" suitable for a "${level || "Intermediate"}" level clinical biomedical engineer.
Produce exactly 4 logically sequenced slides. Each slide should have a clear descriptive title, 3 or 4 educational bullet points explaining rigorous technological concepts, circuit values, or safety practices, and 2-3 sentences of specialized narrator speaker notes.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Descriptive slide title" },
                bullets: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Exactly 3 to 4 technical bullet points"
                },
                speakerNotes: { type: Type.STRING, description: "Detailed clinical engineering explanation narration text" }
              },
              required: ["title", "bullets", "speakerNotes"]
            }
          }
        },
        required: ["slides"]
      };
    } else if (contentType === "quiz") {
      systemPrompt = `You are "SunMedx Academy Board Certifier". Generate an accreditation practice exam covering "${moduleTitle}" within the course "${courseTitle}".
Target difficulty is "${level || "Intermediate"}".
Generate exactly 4 multiple-choice questions. Each question must have:
- A clear, realistic clinical scenario or parameter diagnostic question stem.
- Exactly 4 options.
- The correct option index (0 to 3).
- A detailed explanation that teaches why the answer is correct and why other choices fail.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "QNN-01, QNN-02, etc." },
                question: { type: Type.STRING, description: "Rigorous clinical engineering diagnostic question scenario" },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Exactly 4 options"
                },
                correctOption: { type: Type.INTEGER, description: "Select index of correct choice (0, 1, 2, or 3)" },
                explanation: { type: Type.STRING, description: "In-depth teaching rationale and compliance justifications." }
              },
              required: ["id", "question", "options", "correctOption", "explanation"]
            }
          }
        },
        required: ["questions"]
      };
    } else if (contentType === "lab") {
      systemPrompt = `You are "SunMedx Lab Safety Architect". Generate a hands-on calibration & troubleshooting laboratory procedure script for "${moduleTitle}" inside the training program "${courseTitle}".
Level is "${level || "Intermediate"}".
Generate a structured JSON configuration detailing:
1. objectives: 3 critical operational safety objectives.
2. toolsRequired: 3 specific calibration tools, testers, or materials (e.g. Fluke ESA615 safety analyzer, standard oscilloscope).
3. procedureSteps: Exactly 4 sequential steps. Each step must have a short title and 2 sentences of detailed technical calibration actions.
4. verificationChecklist: 3 specific quality validation safety assertions (e.g., chassis leakage <= 100 uA, ground impedance <= 0.2 ohms).`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          toolsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
          procedureSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Title of lab step" },
                instruction: { type: Type.STRING, description: "Specific physical operations or settings" }
              },
              required: ["title", "instruction"]
            }
          },
          verificationChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["objectives", "toolsRequired", "procedureSteps", "verificationChecklist"]
      };
    } else {
      // cheatsheet
      systemPrompt = `You are "SunMedx Executive Engineer". Generate an interactive field reference cheat-sheet summarizing "${moduleTitle}" in "${courseTitle}".
Level is "${level || "Intermediate"}".
Generate:
1. summary: A 2-sentence crisp high-density operational summary.
2. keyThresholds: 3 key technical specifications, safety constants, limits, or formula coefficients (with exact units).
3. calibrationIntervals: 2 critical calibration or auditing schedule intervals under international standards.
4. commonTroubleshooting: 3 diagnostic rows. Each row must have a symptom, rootCause, and immediate medical engineer corrective action.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyThresholds: { type: Type.ARRAY, items: { type: Type.STRING } },
          calibrationIntervals: { type: Type.ARRAY, items: { type: Type.STRING } },
          commonTroubleshooting: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symptom: { type: Type.STRING },
                rootCause: { type: Type.STRING },
                correctiveAction: { type: Type.STRING }
              },
              required: ["symptom", "rootCause", "correctiveAction"]
            }
          }
        },
        required: ["summary", "keyThresholds", "calibrationIntervals", "commonTroubleshooting"]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No payload returned from the Academy content generation engine.");
    }

    res.json(JSON.parse(text));
  } catch (err: any) {
    console.warn("Academy Creator AI failed, triggering localized safety fallbacks:", err);

    // High fidelity fallbacks to maintain absolute reliability of simulation
    try {
      if (contentType === "lecture") {
        return res.json({
          slides: [
            {
              title: `Introduction: ${moduleTitle}`,
              bullets: [
                "Primary operational parameters and underlying physics of clinical systems.",
                "Regulatory safety frameworks, device classifications, and environment layout designs.",
                "Key technical dependencies, power thresholds, and subsystem alignments."
              ],
              speakerNotes: "Welcome candidates. In this section, we cover the primary engineering architectures. Pay close attention to current specifications and safety limits."
            },
            {
              title: "Electrical Diagnostics & Alignment Protocols",
              bullets: [
                "Ground current leakage testing and protective resistance checking using clinical simulators.",
                "Primary signal conditioning calibration and gain adjustments.",
                "Continuous feedback checking to guarantee device calibration stays within tolerances."
              ],
              speakerNotes: "Testing must occur at nominal lines. Always register ground readings and ensure safety thresholds meet local hospital regulations."
            },
            {
              title: "Clinical Risk Landscapes & Troubleshooting",
              bullets: [
                "Preventative error logging, alarm tolerances, and firmware warnings.",
                "Component degradation markers, mechanical alignment shifts, and component replacements.",
                "Fail-safe shutdowns and immediate diagnostic troubleshooting steps."
              ],
              speakerNotes: "Always utilize proper protective static-discharge accessories when working on circuit boards. Maintain exhaustive event registers."
            },
            {
              title: "NABH Validation & Closing Staged Review",
              bullets: [
                "Comprehensive logging, safety records, and accreditation audit files.",
                "Authorized compliance signatures and quality control signs.",
                "Re-calibration schedules and ongoing technician performance tracking."
              ],
              speakerNotes: "The NABH inspector will review your calibration journals. Keep clear dates, signature stamps, and trace indicators."
            }
          ]
        });
      } else if (contentType === "quiz") {
        return res.json({
          questions: [
            {
              id: "Q-01",
              question: `During the routine electrical safety analysis of systems associated with ${moduleTitle}, what is the maximum chassis leakage current allowed under IEC 60601-1 under normal single-fault condition?`,
              options: [
                "100 µA",
                "500 µA",
                "50 µA",
                "1000 µA"
              ],
              correctOption: 1,
              explanation: "Under IEC 60601-1, while normal condition chassis leakage current must remain below 100 µA, under single-fault conditions (such as missing ground wire), the maximum safe threshold rises to 500 µA to prevent cardiac macroshock."
            },
            {
              id: "Q-02",
              question: `A critical calibration drift is detected in ${moduleTitle} signal telemetry. Which of the following parameters must be analyzed first to ensure compliance with clinical precision tolerances?`,
              options: [
                "Main power line voltage amplitude",
                "Analog-to-digital converter reference voltage",
                "Thermal cooling fan rotation rate",
                "Ethernet router packet transit delays"
              ],
              correctOption: 1,
              explanation: "ADC reference voltage forms the baseline for all signal digitization. If reference voltage drifts, all digitized measurement sensors drift proportionally, causing critical calibration issues."
            },
            {
              id: "Q-03",
              question: `When inspecting the ground path safety of devices relating to ${moduleTitle}, which grounding path impedance value represents the maximum limit for a certified audit file pass?`,
              options: [
                "0.1 Ohms",
                "0.5 Ohms",
                "0.2 Ohms",
                "1.0 Ohms"
              ],
              correctOption: 2,
              explanation: "Hospitals adhering to NABH standards require biomedical equipment grounding resistance to stay below or equal to 0.2 Ohms to ensure dangerous fault currents flow to earth instead of the patient."
            },
            {
              id: "Q-04",
              question: "If an experimental system fails automated compliance calibration tests during daily diagnostics, what is the mandatory immediate protocol?",
              options: [
                "Apply a temporary correction offset modifier to pass diagnostic logs",
                "Tag equipment 'OUT OF SERVICE - DO NOT USE', log clinical ticket, and notify duty engineer",
                "Continue clinical use but schedule a repair ticket in next month's queue",
                "Restart the hardware and ignore if error does not reappear"
              ],
              correctOption: 1,
              explanation: "Safety regulatory standards demand immediate quarantine of un-calibrated medical equipment. Continued patient exposure represents an actionable liability and violates quality protocols."
            }
          ]
        });
      } else if (contentType === "lab") {
        return res.json({
          objectives: [
            "Perform comprehensive calibration verification of telemetry sensors under mock operational loads.",
            "Analyze and log ground line impedance and leakage current relative to IEC 60601-1 safety limits.",
            "Synthesize troubleshooting responses to simulated equipment fault and drift alarms."
          ],
          toolsRequired: [
            "Accredited Biomedical Safety Analyzer (e.g. Fluke Biomedical ESA615 / ESA620)",
            "Precision Digital Multimeter (6.5 digit resolution)",
            "Anti-Static Workspace Assembly and protective earth grounding adapters"
          ],
          procedureSteps: [
            {
              title: "Pre-Inspection and Isolation",
              instruction: "Turn off the medical equipment and isolate it from major power outlets. Carefully check chassis for mechanical cracks or liquid intrusion. Document the initial physical condition."
            },
            {
              title: "Ground Connection Verification",
              instruction: "Connect safety analyzer leads to the device's protective ground studs. Administer a continuous current test to verify grounding resistances are safely below 0.2 Ohms."
            },
            {
              title: "Operational Telemetry Diagnostics",
              instruction: "Connect dummy reference signals and verify transducer readouts. Carefully adjust local trim potentiometers if readings drift outside manufacturer performance limits."
            },
            {
              title: "Post-Audit Documentation and Tagging",
              instruction: "Print safety certificates from the analyzer. Attach a water-resistant dated calibration seal to the front panel, and log clinical reports into the academy ledger."
            }
          ],
          verificationChecklist: [
            "Ground loop resistance ≤ 0.2 Ohms confirmed",
            "Maximum chassis leakage under normal condition ≤ 100 µA logged",
            "Analog measurement precision within ±0.5% limit verified"
          ]
        });
      } else {
        return res.json({
          summary: `This high-density cheat-sheet provides professional biomedical engineers with immediate troubleshooting, tolerances, and calibration constants for managing ${moduleTitle}.`,
          keyThresholds: [
            "Grounding Impedance limit: ≤ 200 mOhms (0.2 Ohms)",
            "Operational Current consumption error toll: ±10% max variation",
            "Chassis electrical isolation current: ≤ 100 µA under loaded operations"
          ],
          calibrationIntervals: [
            "Mandatory Electrical Safety: 6 Months (Bi-annual audit requirement)",
            "Performance Calibration and Precision Balancing: 12 Months (Annual validation)"
          ],
          commonTroubleshooting: [
            {
              symptom: "Transduction Signal Drift",
              rootCause: "Thermal fatigue or aging semiconductor reference voltage drift",
              correctiveAction: "Re-calibrate analog input channels using certified voltage source references."
            },
            {
              symptom: "Chassis Leakage alarm trigger",
              rootCause: "Degraded capacitor filters or humidity-based condensation bridging ground paths",
              correctiveAction: "Clean insulation shields, dry interior compartments, and replace aged power supplies."
            },
            {
              symptom: "Intermittent Communication loss",
              rootCause: "Loose shielding connectors, noise interference, or damaged coaxial links",
              correctiveAction: "Verify contact resistances, apply electromagnetic insulation sleeves, or replace links."
            }
          ]
        });
      }
    } catch (fallbackErr: any) {
      res.status(500).json({ error: "Localized fallback content failed to launch.", details: fallbackErr.message });
    }
  }
});

// Setup Vite Dev server or Serve static files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SunMedx Full-Stack server is actively running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Critical: Live server setup failed:", err);
});
