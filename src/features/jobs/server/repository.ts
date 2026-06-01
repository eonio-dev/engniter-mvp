import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/firestore";
import type { Job, JobStatus } from "@/features/jobs/schemas/job";

const COLLECTION = "jobs";

function docToJob(id: string, data: FirebaseFirestore.DocumentData): Job {
  return {
    id,
    type: data.type ?? "extract-context-package",
    opportunityId: data.opportunityId ?? "",
    status: data.status ?? "queued",
    createdByUserId: data.createdByUserId ?? "",
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? "",
    errorCode: data.errorCode ?? null,
    errorMessage: data.errorMessage ?? null,
    resultRef: data.resultRef ?? null,
  };
}

export async function createJob(input: {
  type: "extract-context-package";
  opportunityId: string;
  createdByUserId: string;
}): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    type: input.type,
    opportunityId: input.opportunityId,
    status: "queued" as JobStatus,
    createdByUserId: input.createdByUserId,
    errorCode: null,
    errorMessage: null,
    resultRef: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getJob(jobId: string): Promise<Job | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(jobId).get();
  if (!doc.exists) return null;
  return docToJob(doc.id, doc.data()!);
}

export async function updateJobStatus(
  jobId: string,
  update: {
    status: JobStatus;
    errorCode?: string | null;
    errorMessage?: string | null;
    resultRef?: string | null;
  },
): Promise<void> {
  const db = getAdminFirestore();
  const payload: Record<string, unknown> = {
    status: update.status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if ("errorCode" in update) payload.errorCode = update.errorCode ?? null;
  if ("errorMessage" in update) payload.errorMessage = update.errorMessage ?? null;
  if ("resultRef" in update) payload.resultRef = update.resultRef ?? null;
  await db.collection(COLLECTION).doc(jobId).update(payload);
}

export async function getActiveJobForOpportunity(
  opportunityId: string,
): Promise<Job | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("opportunityId", "==", opportunityId)
    .where("status", "in", ["queued", "running"])
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0]!;
  return docToJob(doc.id, doc.data());
}

export async function listJobsForOpportunity(
  opportunityId: string,
): Promise<Job[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("opportunityId", "==", opportunityId)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();
  return snapshot.docs.map((doc) => docToJob(doc.id, doc.data()));
}
