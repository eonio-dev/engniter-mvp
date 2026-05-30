import type { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server.js";

import { SESSION_COOKIE_NAME } from "../../../lib/config/firebase-project.js";

export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

type SessionCookieAuth = {
  verifyIdToken(idToken: string): Promise<DecodedIdToken>;
  createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string>;
};

export async function createSessionResponse(
  idToken: string | undefined,
  auth: SessionCookieAuth,
) {
  if (!idToken) {
    return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
  }

  await auth.verifyIdToken(idToken);
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  return response;
}

export function createSessionDeletionResponse() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
