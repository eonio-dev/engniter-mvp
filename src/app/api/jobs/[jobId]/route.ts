import { getCurrentUser } from "@/features/auth/server/get-current-user";
import { canAccessProtectedArea } from "@/features/auth/server/access";
import { getJob } from "@/features/jobs/server/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const session = await getCurrentUser();
  if (!session || !canAccessProtectedArea(session)) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  const job = await getJob(jobId);
  if (!job) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Job not found." } },
      { status: 404 },
    );
  }

  if (job.createdByUserId !== session.uid) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "You do not have permission to view this job." } },
      { status: 403 },
    );
  }

  return Response.json({
    data: {
      job: {
        id: job.id,
        status: job.status,
        errorCode: job.errorCode,
        errorMessage: job.errorMessage,
        resultRef: job.resultRef,
      },
    },
  });
}
