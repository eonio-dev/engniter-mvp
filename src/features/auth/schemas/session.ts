import { z } from "zod";

export const sessionSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  emailVerified: z.boolean(),
  roles: z.array(z.string()),
});

export type AppSession = z.infer<typeof sessionSchema>;

export function normalizeRoles(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

type SessionClaims = {
  uid?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  roles?: unknown;
  role?: unknown;
};

export function toAppSession(claims: SessionClaims): AppSession {
  return sessionSchema.parse({
    uid: claims.uid ?? claims.sub ?? "",
    email: claims.email ?? null,
    displayName: claims.name ?? null,
    photoUrl: claims.picture ?? null,
    emailVerified: Boolean(claims.email_verified),
    roles: normalizeRoles(claims.roles ?? claims.role),
  });
}
