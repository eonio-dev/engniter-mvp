import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
