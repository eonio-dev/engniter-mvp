import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/firestore";
import type { Opportunity, CreateOpportunityInput } from "@/features/opportunities/schemas/opportunity";

const COLLECTION = "opportunities";

type CreateOpportunityData = CreateOpportunityInput & {
  createdByUserId: string;
};

type UpdateOpportunityData = Partial<
  Pick<
    Opportunity,
    | "title"
    | "technicalOwner"
    | "clientName"
    | "projectType"
    | "estimatedValue"
    | "proposalDeadline"
    | "fitCriteria"
  >
>;

function docToOpportunity(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Opportunity {
  return {
    id,
    title: data.title ?? "",
    technicalOwner: data.technicalOwner ?? "",
    clientName: data.clientName ?? null,
    projectType: data.projectType ?? null,
    estimatedValue: data.estimatedValue ?? null,
    proposalDeadline: data.proposalDeadline ?? null,
    fitCriteria: data.fitCriteria ?? null,
    status: data.status ?? "active",
    createdByUserId: data.createdByUserId ?? "",
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? "",
  };
}

export async function createOpportunity(
  input: CreateOpportunityData,
): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    title: input.title,
    technicalOwner: input.technicalOwner,
    clientName: input.clientName ?? null,
    projectType: input.projectType ?? null,
    estimatedValue: input.estimatedValue ?? null,
    proposalDeadline: input.proposalDeadline ?? null,
    fitCriteria: input.fitCriteria ?? null,
    status: "active",
    createdByUserId: input.createdByUserId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getOpportunity(
  opportunityId: string,
): Promise<Opportunity | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(opportunityId).get();
  if (!doc.exists) return null;
  return docToOpportunity(doc.id, doc.data()!);
}

export async function updateOpportunity(
  opportunityId: string,
  updates: UpdateOpportunityData,
): Promise<void> {
  const db = getAdminFirestore();
  // Only include fields that were explicitly passed (undefined = not provided, keep as-is)
  const payload: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  const allowedKeys = [
    "title",
    "technicalOwner",
    "clientName",
    "projectType",
    "estimatedValue",
    "proposalDeadline",
    "fitCriteria",
  ] as const;
  for (const key of allowedKeys) {
    if (key in updates) {
      payload[key] = updates[key] ?? null;
    }
  }
  await db.collection(COLLECTION).doc(opportunityId).update(payload);
}

export async function listOpportunitiesByUser(
  userId: string,
): Promise<Opportunity[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("createdByUserId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => docToOpportunity(doc.id, doc.data()));
}

export async function listOpportunities(): Promise<Opportunity[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => docToOpportunity(doc.id, doc.data()));
}
