import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/firestore";
import type {
  ClarificationPacket,
  ClarificationQuestion,
} from "@/features/clarifications/schemas/clarification";

const COLLECTION = "clarificationPackets";

type NewClarificationPacketData = Omit<ClarificationPacket, "id" | "generatedAt">;

function docToClarificationPacket(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ClarificationPacket {
  return {
    id,
    opportunityId: data.opportunityId ?? "",
    scopeBriefId: data.scopeBriefId ?? "",
    scopeBriefVersion: data.scopeBriefVersion ?? 1,
    generatedAt: data.generatedAt?.toDate?.()?.toISOString() ?? data.generatedAt ?? "",
    questions: (data.questions ?? []) as ClarificationQuestion[],
  };
}

export async function createClarificationPacket(
  input: NewClarificationPacketData,
): Promise<string> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    ...input,
    generatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getLatestClarificationPacketForBrief(
  scopeBriefId: string,
): Promise<ClarificationPacket | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("scopeBriefId", "==", scopeBriefId)
    .orderBy("generatedAt", "desc")
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0]!;
  return docToClarificationPacket(doc.id, doc.data());
}
