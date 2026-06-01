import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),
  AUTH_ALLOWED_EMAIL_DOMAINS: z.string().default(""),
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().min(1).optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});

const env = envSchema.parse(process.env);

export function getServerEnv() {
  return env;
}

export function getClientEnv() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getAdminPrivateKey() {
  return env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function normalizeStorageBucketName(value: string) {
  return value
    .trim()
    .replace(/^gs:\/\//, "")
    .replace(/^https?:\/\/storage.googleapis.com\//, "")
    .replace(/\/+$/, "");
}

export function getServerStorageBucketName() {
  const configuredBucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (configuredBucket) {
    return normalizeStorageBucketName(configuredBucket);
  }

  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId) {
    return `${projectId}.firebasestorage.app`;
  }

  return undefined;
}
