import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  writeBatch,
  getDoc,
  addDoc,
  getDocFromServer
} from "firebase/firestore";
import { initialAssets, initialSpares, initialCourses } from "../data";
import { UserRole } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyBzzfvKhmAWGvdDeNaMMiLl6i3-KgUdfyU",
  authDomain: "sunmedx.firebaseapp.com",
  projectId: "sunmedx",
  storageBucket: "sunmedx.firebasestorage.app",
  messagingSenderId: "802052719636",
  appId: "1:802052719636:web:cd1f80b4a52f60460e9301"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-79542dbc-863f-47f3-8b1e-34f28c59728a");

// Validate connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration: client is offline.");
    }
  }
}
testConnection();

/**
 * Seeds Firestore with initial medical assets and e-commerce spare parts if not already populated.
 * Uses preset IDs to avoid duplication and remain fully idempotent.
 */
export async function seedFirestoreDatabase() {
  try {
    // Check asset count
    const assetsCol = collection(db, "assets");
    const assetsSnap = await getDocs(assetsCol);
    
    if (assetsSnap.empty) {
      console.log("Seeding assets collection...");
      const batch = writeBatch(db);
      initialAssets.forEach((asset) => {
        const assetRef = doc(db, "assets", asset.id);
        batch.set(assetRef, asset);
      });
      await batch.commit();
      console.log("Assets seeded successfully.");
    }

    // Check spares count
    const sparesCol = collection(db, "spares");
    const sparesSnap = await getDocs(sparesCol);
    
    if (sparesSnap.empty) {
      console.log("Seeding spares collection...");
      const batch = writeBatch(db);
      initialSpares.forEach((spare) => {
        const spareRef = doc(db, "spares", spare.id);
        batch.set(spareRef, spare);
      });
      await batch.commit();
      console.log("Spares seeded successfully.");
    }

    // Check courses count
    const coursesCol = collection(db, "courses");
    const coursesSnap = await getDocs(coursesCol);
    if (coursesSnap.empty) {
      console.log("Seeding courses collection...");
      const batch = writeBatch(db);
      initialCourses.forEach((course) => {
        const courseRef = doc(db, "courses", course.id);
        batch.set(courseRef, course);
      });
      await batch.commit();
      console.log("Courses seeded successfully.");
    }

    // Check activity logs count and seed defaults if empty
    const logsCol = collection(db, "activity_logs");
    const logsSnap = await getDocs(logsCol);
    if (logsSnap.empty) {
      console.log("Seeding activity logs collection...");
      const batch = writeBatch(db);
      const initialLogs = [
        {
          type: "asset",
          action: "Asset Status Changed",
          details: "MRI Scanner 3T status was changed to Operational.",
          targetId: "AST-4401",
          targetName: "MRI Scanner 3T",
          userEmail: "krishnadigitalai@gmail.com",
          userRole: "Admin",
          timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString()
        },
        {
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
      initialLogs.forEach((log) => {
        const logRef = doc(collection(db, "activity_logs"));
        batch.set(logRef, log);
      });
      await batch.commit();
      console.log("Activity logs seeded successfully.");
    }
  } catch (error) {
    console.warn("Failed to automatically seed database. This is common if Firestore rules restrict write access before signing in:", error);
  }
}

/**
 * Pushes a new system activity audit log to Firestore for real-time tracking.
 */
export async function logSystemActivity(
  type: "asset" | "ticket" | "procurement",
  action: string,
  details: string,
  targetId: string,
  targetName: string,
  userEmail?: string,
  userRole?: UserRole
) {
  try {
    const logsCol = collection(db, "activity_logs");
    await addDoc(logsCol, {
      type,
      action,
      details,
      targetId,
      targetName,
      userEmail: userEmail || "guest.admin@sunmedx.com",
      userRole: userRole || "Admin",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to write to activity_logs:", err);
  }
}

