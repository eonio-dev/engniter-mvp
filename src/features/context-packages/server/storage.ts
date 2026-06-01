import { getAdminStorage } from "@/lib/firebase/storage";
import { getServerStorageBucketName } from "@/lib/config/env";

function getPrimaryBucketName() {
  const bucketName = getServerStorageBucketName();
  if (!bucketName) {
    throw new Error(
      "Storage bucket not configured — set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_ADMIN_PROJECT_ID in .env.local",
    );
  }
  return bucketName;
}

function getBucketCandidates() {
  const primary = getPrimaryBucketName();
  const candidates = [primary];

  if (primary.endsWith(".firebasestorage.app")) {
    candidates.push(primary.replace(/\.firebasestorage\.app$/, ".appspot.com"));
  } else if (primary.endsWith(".appspot.com")) {
    candidates.push(primary.replace(/\.appspot\.com$/, ".firebasestorage.app"));
  }

  return [...new Set(candidates)];
}

function isBucketNotFoundError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return "code" in error
    && (error as Error & { code?: unknown }).code === 404
    && /bucket does not exist/i.test(error.message);
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
  const safe = sanitizeFilename(filename);
  const storagePath = `opportunities/${opportunityId}/context-items/${itemId}/${safe}`;
  const bucketCandidates = getBucketCandidates();

  for (const [index, bucketName] of bucketCandidates.entries()) {
    const bucket = getAdminStorage().bucket(bucketName);
    const file = bucket.file(storagePath);

    try {
      await file.save(fileBuffer, {
        contentType: mimeType,
        metadata: { cacheControl: "private, max-age=0" },
      });

      return {
        storageRef: storagePath,
        storageBucket: bucket.name,
      };
    } catch (error) {
      if (!isBucketNotFoundError(error) || index === bucketCandidates.length - 1) {
        throw error;
      }
    }
  }

  throw new Error("Storage upload failed.");
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
