import { PortalUser, UserRole } from "../types";

interface StoredPortalAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "sunmedx_portal_accounts";
const SESSION_KEY = "sunmedx_portal_session";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}

function loadAccounts(): StoredPortalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredPortalAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getPortalSession(): PortalUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalUser;
    if (parsed && parsed.uid && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPortalSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function registerPortalAccount(
  displayName: string,
  email: string,
  password: string
): Promise<PortalUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();

  if (!cleanName) {
    throw new Error("Please enter your full name.");
  }
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Please enter a valid corporate email address.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const accounts = loadAccounts();
  if (accounts.some((acc) => acc.email === normalizedEmail)) {
    throw new Error("An account with this email already exists. Please switch to Sign In.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const uid = `USR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newAccount: StoredPortalAccount = {
    uid,
    email: normalizedEmail,
    displayName: cleanName,
    role: "Admin",
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  saveAccounts([...accounts, newAccount]);

  const sessionUser: PortalUser = {
    uid: newAccount.uid,
    email: newAccount.email,
    displayName: newAccount.displayName,
    role: newAccount.role,
    authProvider: "portal-credentials"
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

export async function signInPortalAccount(
  email: string,
  password: string
): Promise<PortalUser> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error("Please enter both email and password.");
  }

  const accounts = loadAccounts();
  const match = accounts.find((acc) => acc.email === normalizedEmail);
  if (!match) {
    throw new Error("No account found for this email. Switch to Create Account to register.");
  }

  const candidateHash = await hashPassword(password, match.salt);
  if (candidateHash !== match.passwordHash) {
    throw new Error("Incorrect password. Please try again.");
  }

  const sessionUser: PortalUser = {
    uid: match.uid,
    email: match.email,
    displayName: match.displayName,
    role: match.role,
    authProvider: "portal-credentials"
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}
