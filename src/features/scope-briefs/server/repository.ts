import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/firestore";
import type {
  ScopeBrief,
  ScopeItem,
  ReviewStatus,
  NoPromiseOverride,
  FitMismatch,
} from "@/features/scope-briefs/schemas/scope-brief";

const COLLECTION = "scopeBriefs";

type NewScopeBriefData = Omit<ScopeBrief, "id" | "createdAt">;

function docToScopeBrief(id: string, data: FirebaseFirestore.DocumentData): ScopeBrief {
  return {
    id,
    opportunityId: data.opportunityId ?? "",
    jobId: data.jobId ?? "",
    version: data.version ?? 1,
    status: data.status ?? "draft",
    scopeConfidence: data.scopeConfidence ?? "Low",
    sparseInput: data.sparseInput ?? false,
    items: data.items ?? [],
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
    createdByJobId: data.createdByJobId ?? "",
    noPromiseOverride: data.noPromiseOverride ?? null,
    fitMismatches: data.fitMismatches ?? [],
    fitCheckedAt: data.fitCheckedAt ?? null,
  };
}

function getCreatedAtValue(data: FirebaseFirestore.DocumentData): number {
  const createdAt = data.createdAt;
  if (typeof createdAt?.toMillis === "function") {
    return createdAt.toMillis();
  }
  if (createdAt instanceof Date) {
    return createdAt.getTime();
  }
  if (typeof createdAt === "string") {
    const parsed = Date.parse(createdAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function createScopeBrief(input: NewScopeBriefData): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getLatestScopeBriefForOpportunity(
  opportunityId: string,
): Promise<ScopeBrief | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("opportunityId", "==", opportunityId)
   .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs
   .slice()
   .sort((left, right) => getCreatedAtValue(right.data()) - getCreatedAtValue(left.data()))[0]!;
  return docToScopeBrief(doc.id, doc.data());
}

export async function getScopeBrief(scopeBriefId: string): Promise<ScopeBrief | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(scopeBriefId).get();
  if (!doc.exists) return null;
  return docToScopeBrief(doc.id, doc.data()!);
}

export async function updateScopeItemInBrief(
  scopeBriefId: string,
  itemId: string,
  update: { reviewStatus: ReviewStatus; editedContent?: string | null },
): Promise<void> {
  if (update.reviewStatus === "edited" && (!update.editedContent || update.editedContent.trim().length === 0)) {
    throw Object.assign(new Error("Edited content is required when editing an item."), {
      code: "VALIDATION_ERROR",
    });
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(scopeBriefId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw Object.assign(new Error("Scope Brief not found."), { code: "NOT_FOUND" });
  }

  const data = snap.data()!;
  const items: ScopeItem[] = data.items ?? [];
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) {
    throw Object.assign(new Error("Item not found."), { code: "NOT_FOUND" });
  }

  items[idx] = {
    ...items[idx]!,
    reviewStatus: update.reviewStatus,
    editedContent:
      update.reviewStatus === "edited"
        ? (update.editedContent ?? null)
        : (items[idx]!.editedContent ?? null),
  };

  await ref.update({ items });
}

export async function updateScopeBriefStatus(
  scopeBriefId: string,
  status: "draft" | "approved",
): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(scopeBriefId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw Object.assign(new Error("Scope Brief not found."), { code: "NOT_FOUND" });
  }
  await ref.update({ status });
}

export async function setNoPromiseOverride(
  scopeBriefId: string,
  override: NoPromiseOverride | null,
): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(scopeBriefId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw Object.assign(new Error("Scope Brief not found."), { code: "NOT_FOUND" });
  }
  await ref.update({ noPromiseOverride: override });
}

export async function setFitMismatches(
  scopeBriefId: string,
  mismatches: FitMismatch[],
): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(scopeBriefId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw Object.assign(new Error("Scope Brief not found."), { code: "NOT_FOUND" });
  }
  await ref.update({
    fitMismatches: mismatches,
    fitCheckedAt: new Date().toISOString(),
  });
}
