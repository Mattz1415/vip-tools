import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";

export interface PublicFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedProjectId = "";

function getEnvConfig(): PublicFirebaseConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId,
  };
}

export async function fetchFirebaseWebConfig(): Promise<PublicFirebaseConfig | null> {
  try {
    const res = await fetch("/api/config/public", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.firebaseReady && data?.firebaseConfig?.apiKey) {
        return data.firebaseConfig as PublicFirebaseConfig;
      }
    }
  } catch {
    // fallback to env config
  }
  return getEnvConfig();
}

export async function signInWithGoogleFirebase() {
  const cfg = await fetchFirebaseWebConfig();
  if (!cfg || !cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    throw new Error(
      "Firebase belum dikonfigurasi. Owner dapat mengisi Firebase Web Config di halaman /owner (tab Firebase) atau file .env.local."
    );
  }

  if (!cachedApp || cachedProjectId !== cfg.projectId) {
    const existing = getApps().find((a) => a.name === `mattzlm-${cfg.projectId}`);
    cachedApp = existing || initializeApp(cfg, `mattzlm-${cfg.projectId}`);
    cachedAuth = getAuth(cachedApp);
    cachedProjectId = cfg.projectId;
  }

  if (!cachedAuth) {
    throw new Error("Gagal menginisialisasi Firebase Auth.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const cred = await signInWithPopup(cachedAuth, provider);
  const idToken = await cred.user.getIdToken(true);

  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Verifikasi login Google gagal di server VPS.");
  }
  return data.user as {
    username: string;
    role: "owner" | "admin" | "member";
    email: string;
    displayName: string;
    photoUrl: string;
    provider: "google";
  };
}

export async function signOutFirebaseQuietly() {
  if (cachedAuth) {
    try {
      await signOut(cachedAuth);
    } catch {
      // ignore
    }
  }
}
