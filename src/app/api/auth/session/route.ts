import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import {
  createSessionDeletionResponse,
  createSessionResponse,
} from "@/features/auth/server/session-response";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };

    return createSessionResponse(body.idToken, getAdminAuth());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create a secure session.",
      },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  return createSessionDeletionResponse();
}
