import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/firestore";
import type { ContextItem } from "@/features/context-packages/schemas/context-item";

type NewContextItemData = Omit<ContextItem, "id" | "createdAt">;

function subcollection(opportunityId: string) {
  return getAdminFirestore()
    .collection("opportunities")
    .doc(opportunityId)
    .collection("contextItems");
}

function docToContextItem(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ContextItem {
  return {
    id,
    opportunityId: data.opportunityId ?? "",
    sourceType: data.sourceType ?? "text",
    uploaderId: data.uploaderId ?? "",
    title: data.title ?? "",
    content: data.content ?? null,
    storageRef: data.storageRef ?? null,
    storageBucket: data.storageBucket ?? null,
    mimeType: data.mimeType ?? null,
    sizeBytes: data.sizeBytes ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
  };
}

export async function addContextItem(
  opportunityId: string,
  item: NewContextItemData,
): Promise<string> {
  const ref = subcollection(opportunityId).doc();
  await ref.set({
    ...item,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function listContextItems(
  opportunityId: string,
): Promise<ContextItem[]> {
  const snapshot = await subcollection(opportunityId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => docToContextItem(doc.id, doc.data()));
}

export async function listContextItemsChronological(
  opportunityId: string,
): Promise<ContextItem[]> {
  const snapshot = await subcollection(opportunityId)
    .orderBy("createdAt", "asc")
    .get();
  return snapshot.docs.map((doc) => docToContextItem(doc.id, doc.data()));
}

export async function deleteContextItem(
  opportunityId: string,
  itemId: string,
): Promise<void> {
  await subcollection(opportunityId).doc(itemId).delete();
}
