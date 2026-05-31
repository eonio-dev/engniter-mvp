import { getCurrentUser } from "@/features/auth/server/get-current-user";
import { canAccessProtectedArea } from "@/features/auth/server/access";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { uploadContextFile, deleteContextFile } from "@/features/context-packages/server/storage";
import { addContextItem, deleteContextItem } from "@/features/context-packages/server/repository";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  const { opportunityId } = await params;

  const session = await getCurrentUser();
  if (!session || !canAccessProtectedArea(session)) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Opportunity not found." } },
      { status: 404 },
    );
  }
  if (opportunity.createdByUserId !== session.uid) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "You do not have permission to upload to this Opportunity." } },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: { code: "BAD_REQUEST", message: "Invalid multipart form data." } },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "A non-empty file is required." } },
      { status: 422 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "File exceeds the 20 MB limit." } },
      { status: 422 },
    );
  }

  const itemId = crypto.randomUUID();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const filename = file.name || "upload";

  let uploadResult: { storageRef: string; storageBucket: string };
  try {
    uploadResult = await uploadContextFile(opportunityId, itemId, fileBuffer, filename, mimeType);
  } catch (err) {
    console.error("Storage upload failed:", err);
    return Response.json(
      { error: { code: "UPLOAD_FAILED", message: "File upload to storage failed." } },
      { status: 500 },
    );
  }

  try {
    const confirmedItemId = await addContextItem(opportunityId, {
      opportunityId,
      sourceType: "file",
      uploaderId: session.uid,
      title: filename,
      content: null,
      storageRef: uploadResult.storageRef,
      storageBucket: uploadResult.storageBucket,
      mimeType,
      sizeBytes: file.size,
    });
    return Response.json({ data: { itemId: confirmedItemId, storageRef: uploadResult.storageRef } });
  } catch (err) {
    console.error("Firestore write failed after upload, attempting cleanup:", err);
    await deleteContextFile(uploadResult.storageRef, uploadResult.storageBucket);
    return Response.json(
      { error: { code: "UPLOAD_FAILED", message: "Failed to record upload. Please try again." } },
      { status: 500 },
    );
  }
}
