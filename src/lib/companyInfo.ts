import { SunmedxCompanyInfo } from "../types";

const COMPANY_INFO_KEY = "sunmedx_company_info";

export const DEFAULT_COMPANY_INFO: SunmedxCompanyInfo = {
  companyName: "SunMedx",
  companyTagline: "Biomedical • R K Enterprises",
  heroBadgeText: "Biomedical Engineering · R K Enterprises · India",
  heroDescription:
    "SunMedx provides exceptional biomedical engineering solutions — high-performance medical instruments, ventilator systems support, practical clinical workshops, and expert NABH/ISO consultancy — facilitating better hospital practices across India.",
  aboutDescription:
    "SunMedx is a leading biomedical engineering brand operating under R K Enterprises in India. We supply world-class medical instruments including ventilator solutions, support packages, and strategic technical consultancy to healthcare facilities, dramatically improving operational accuracy.",
  missionStatement:
    "To make world-class biomedical engineering expertise accessible to every healthcare facility across India — through reliable instruments, practical training, and trusted consultancy.",
  yearsExperience: "10+",
  hospitalsServed: "200+",
  devicesSupported: "50+",
  phoneHotline: "+91 123-456-7890",
  corporateEmail: "info@sunmedx.com",
  headquarters: "India — Serving healthcare providers nationwide",
  portalFacilityName: "Apex Medical Center",
  footerNotice: "© 2026 SUNMEDX • R K ENTERPRISES • INDIA. ALL CLINICAL DOCUMENTATION SECURELY CO-SIGNED."
};

export function loadCompanyInfo(): SunmedxCompanyInfo {
  try {
    const saved = localStorage.getItem(COMPANY_INFO_KEY);
    if (saved) {
      return { ...DEFAULT_COMPANY_INFO, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn("Could not load saved SunMedx company info:", err);
  }
  return DEFAULT_COMPANY_INFO;
}

export function saveCompanyInfo(info: SunmedxCompanyInfo): SunmedxCompanyInfo {
  const merged = { ...DEFAULT_COMPANY_INFO, ...info };
  try {
    localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("Could not save SunMedx company info:", err);
  }
  return merged;
}

export function resetCompanyInfo(): SunmedxCompanyInfo {
  try {
    localStorage.removeItem(COMPANY_INFO_KEY);
  } catch (err) {
    console.warn("Could not reset SunMedx company info:", err);
  }
  return DEFAULT_COMPANY_INFO;
}
