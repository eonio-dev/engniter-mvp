import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { getAdminPrivateKey, getServerEnv, getServerStorageBucketName } from "@/lib/config/env";

export function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const env = getServerEnv();
  const privateKey = getAdminPrivateKey();
  const storageBucket = getServerStorageBucketName();

  if (env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey && env.FIREBASE_ADMIN_PROJECT_ID) {
    return initializeApp({
      credential: cert({
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
        projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      }),
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      storageBucket,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
