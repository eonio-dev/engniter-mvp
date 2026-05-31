import { getAdminStorage } from "@/lib/firebase/storage";
import { getServerEnv } from "@/lib/config/env";

function getStorageBucket() {
  const bucket = getServerEnv().NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error(
      "Storage bucket not configured — set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local",
    );
  }
  return getAdminStorage().bucket(bucket);
}

function sanitizeFilename(filename: string): string {
  const safe = filename.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  return safe || `file_${Date.now()}`;
}

type UploadResult = {
  storageRef: string;
  storageBucket: string;
};

export async function uploadContextFile(
  opportunityId: string,
  itemId: string,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<UploadResult> {
  const bucket = getStorageBucket();
  const safe = sanitizeFilename(filename);
  const storagePath = `opportunities/${opportunityId}/context-items/${itemId}/${safe}`;
  const file = bucket.file(storagePath);

  await file.save(fileBuffer, {
    contentType: mimeType,
    metadata: { cacheControl: "private, max-age=0" },
  });

  return {
    storageRef: storagePath,
    storageBucket: bucket.name,
  };
}

export async function deleteContextFile(
  storageRef: string,
  storageBucket: string,
): Promise<void> {
  try {
    const bucket = getAdminStorage().bucket(storageBucket);
    await bucket.file(storageRef).delete();
  } catch {
    // Deletion failure is non-fatal — log and continue
    console.error(`Failed to delete storage file: ${storageBucket}/${storageRef}`);
  }
}
