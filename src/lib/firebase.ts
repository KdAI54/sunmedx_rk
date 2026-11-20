import { initializeApp } from "firebase/app";
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
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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

export async function seedFirestoreDatabase() {
  try {
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
  } catch (error) {
    console.warn("Firestore seeding skipped:", error);
  }
}

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
    const logRef = doc(collection(db, "activity_logs"));
    await setDoc(logRef, {
      id: logRef.id,
      type,
      action,
      details,
      targetId,
      targetName,
      userEmail: userEmail || "admin@sunmedx.com",
      userRole: userRole || "Admin",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Activity log sync skipped:", err);
  }
}
