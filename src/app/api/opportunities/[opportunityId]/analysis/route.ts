export const runtime = "nodejs";
import { getCurrentUser } from "@/features/auth/server/get-current-user";
import { canAccessProtectedArea } from "@/features/auth/server/access";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { createJob, getActiveJobForOpportunity, updateJobStatus } from "@/features/jobs/server/repository";
import { createScopeBrief, getLatestScopeBriefForOpportunity } from "@/features/scope-briefs/server/repository";
import { listContextItemsChronological } from "@/features/context-packages/server/repository";
import { analyzeContextPackage } from "@/server/ai/analyze-context-package";
import { getServerEnv } from "@/lib/config/env";

async function runAnalysis(jobId: string, opportunityId: string) {
  try {
    await updateJobStatus(jobId, { status: "running" });

    const contextItems = await listContextItemsChronological(opportunityId);
    const analysisResult = await analyzeContextPackage(contextItems);

    const existingBrief = await getLatestScopeBriefForOpportunity(opportunityId);
    const version = existingBrief ? existingBrief.version + 1 : 1;

    const scopeBriefId = await createScopeBrief({
      opportunityId,
      jobId,
      version,
      status: "draft",
      scopeConfidence: analysisResult.scopeConfidence,
      sparseInput: analysisResult.sparseInput,
      items: analysisResult.items,
      createdByJobId: jobId,
      noPromiseOverride: null,
      fitMismatches: [],
      fitCheckedAt: null,
    });

    await updateJobStatus(jobId, {
      status: "succeeded",
      resultRef: `scopeBriefs/${scopeBriefId}`,
    });
  } catch (err) {
    const error = err as { code?: string; message?: string };
    await updateJobStatus(jobId, {
      status: "failed",
      errorCode: error.code ?? "UNKNOWN",
      errorMessage: error.message ?? "Analysis failed.",
    }).catch(() => {});
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  const { opportunityId } = await params;

  const session = await getCurrentUser();
  if (!session || !canAccessProtectedArea(session)) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Opportunity not found." } },
      { status: 404 },
    );
  }
  if (opportunity.createdByUserId !== session.uid) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "You do not have permission to analyse this Opportunity." } },
      { status: 403 },
    );
  }

  if (!getServerEnv().ANTHROPIC_API_KEY) {
    return Response.json(
      { error: { code: "CONFIGURATION_ERROR", message: "ANTHROPIC_API_KEY is not configured." } },
      { status: 503 },
    );
  }

  const activeJob = await getActiveJobForOpportunity(opportunityId);
  if (activeJob) {
    return Response.json({ data: { jobId: activeJob.id } });
  }

  const jobId = await createJob({
    type: "extract-context-package",
    opportunityId,
    createdByUserId: session.uid,
  });

  setTimeout(() => {
    void runAnalysis(jobId, opportunityId);
  }, 0);

  return Response.json({ data: { jobId } });
}
