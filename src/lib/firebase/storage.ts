import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";

export function getAdminStorage() {
  return getStorage(getAdminApp());
}
