export type UserRole = "Admin" | "Technician" | "Procurement";

export interface PortalUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  authProvider: "portal-credentials";
}

export interface Asset {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  department: string;
  serialNumber: string;
  status: "Operational" | "Under Maintenance" | "Calibration Due" | "Out of Order";
  purchaseDate: string;
  calibrationDate: string;
  contractType: "AMC" | "CMC" | "None";
  contractExpiry: string;
  maintenanceCost: number;
  location: string;
  usageHours?: number;
  serviceInterval?: number;
}

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  category: "Sensors & Probes" | "Batteries" | "Filters & Tubings" | "Cables" | "Imaging Parts";
  compatibleEquipment: string;
  price: number;
  stock: number;
  image: string;
  rating: number;
}

export interface ServiceTicket {
  id: string;
  assetId: string;
  assetName: string;
  issue: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved";
  loggedBy: string;
  loggedAt: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  instructor: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  date: string;
  modules: string[];
}

export interface CartItem {
  id: string;
  product: SparePart;
  quantity: number;
}

export interface SystemActivityLog {
  id: string;
  type: "asset" | "ticket" | "procurement";
  action: string;
  details: string;
  targetId: string;
  targetName: string;
  userEmail: string;
  userRole: UserRole;
  timestamp: string;
}
