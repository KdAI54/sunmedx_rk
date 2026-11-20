import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  writeBatch,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { initialAssets, initialSpares, initialCourses } from "../data";
import { UserRole } from "../types";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
 * Seeds Firestore with initial medical assets, spares, courses, and audit logs
 * when an authenticated operator signs in and collections are empty.
 */
export async function seedFirestoreDatabase() {
  if (!auth.currentUser) {
    return;
  }

  try {
    // Check asset count
    const assetsCol = collection(db, "assets");
    const assetsSnap = await getDocs(assetsCol);

    if (assetsSnap.empty) {
      const batch = writeBatch(db);
      initialAssets.forEach((asset) => {
        const assetRef = doc(db, "assets", asset.id);
        batch.set(assetRef, asset);
      });
      await batch.commit();
    }

    // Check spares count
    const sparesCol = collection(db, "spares");
    const sparesSnap = await getDocs(sparesCol);

    if (sparesSnap.empty) {
      const batch = writeBatch(db);
      initialSpares.forEach((spare) => {
        const spareRef = doc(db, "spares", spare.id);
        batch.set(spareRef, spare);
      });
      await batch.commit();
    }

    // Check courses count
    const coursesCol = collection(db, "courses");
    const coursesSnap = await getDocs(coursesCol);
    if (coursesSnap.empty) {
      const batch = writeBatch(db);
      initialCourses.forEach((course) => {
        const courseRef = doc(db, "courses", course.id);
        batch.set(courseRef, course);
      });
      await batch.commit();
    }

    // Check activity logs count and seed defaults if empty
    const logsCol = collection(db, "activity_logs");
    const logsSnap = await getDocs(logsCol);
    if (logsSnap.empty) {
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
        batch.set(logRef, { id: logRef.id, ...log });
      });
      await batch.commit();
    }
  } catch (error) {
    console.warn("Firestore seeding skipped or restricted for current user:", error);
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
  if (!auth.currentUser) {
    return;
  }
  try {
    const logRef = doc(collection(db, "activity_logs"));
    await setDoc(logRef, {
      id: logRef.id,
      type,
      action,
      details,
      targetId,
      targetName,
      userEmail: userEmail || auth.currentUser.email || "admin@sunmedx.com",
      userRole: userRole || "Admin",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "activity_logs");
  }
}
