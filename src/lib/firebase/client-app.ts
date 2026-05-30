import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import { getClientEnv } from "@/lib/config/env";

export function isFirebaseClientConfigured() {
  const config = getClientEnv();

  return Object.values(config).every(Boolean);
}

export function getClientApp() {
  if (!isFirebaseClientConfigured()) {
    throw new Error("Firebase client configuration is incomplete.");
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: getClientEnv().apiKey,
    authDomain: getClientEnv().authDomain,
    projectId: getClientEnv().projectId,
    storageBucket: getClientEnv().storageBucket,
    messagingSenderId: getClientEnv().messagingSenderId,
    appId: getClientEnv().appId,
  });
}

export function getClientAuth() {
  return getAuth(getClientApp());
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  return provider;
}
