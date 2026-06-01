"use client";

import { useActionState } from "react";
import type { CreateOpportunityInput, UpdateOpportunityInput } from "@/features/opportunities/types";

type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; opportunityId: string };

type OpportunityMetadataFormProps = {
  mode: "create";
  action: (formData: unknown) => Promise<
    { data: { opportunityId: string } } | { error: { code: string; message: string } }
  >;
  initialValues?: Partial<CreateOpportunityInput>;
} | {
  mode: "edit";
  opportunityId: string;
  action: (formData: unknown) => Promise<
    { data: { opportunityId: string } } | { error: { code: string; message: string } }
  >;
  initialValues?: Partial<UpdateOpportunityInput>;
};

async function formAction(
  _prev: FormState,
  formData: FormData,
  action: OpportunityMetadataFormProps["action"],
  opportunityId?: string,
): Promise<FormState> {
  const input: Record<string, string | null> = {
    title: formData.get("title") as string,
    technicalOwner: formData.get("technicalOwner") as string,
    clientName: (formData.get("clientName") as string) || null,
    projectType: (formData.get("projectType") as string) || null,
    estimatedValue: (formData.get("estimatedValue") as string) || null,
    proposalDeadline: (formData.get("proposalDeadline") as string) || null,
    fitCriteria: (formData.get("fitCriteria") as string) || null,
  };

  if (opportunityId) {
    (input as Record<string, string | null>).opportunityId = opportunityId;
  }

  const result = await action(input);
  if ("error" in result) {
    return { status: "error", message: result.error.message };
  }
  return { status: "success", opportunityId: result.data.opportunityId };
}

export function OpportunityMetadataForm(props: OpportunityMetadataFormProps) {
  const opportunityId = props.mode === "edit" ? props.opportunityId : undefined;
  const initialValues = props.initialValues ?? {};

  const boundAction = async (prev: FormState, formData: FormData) =>
    formAction(prev, formData, props.action, opportunityId);

  const [state, dispatch, isPending] = useActionState<FormState, FormData>(
    boundAction,
    { status: "idle" },
  );

  return (
    <form action={dispatch} noValidate className="opportunity-form">
      {state.status === "error" && (
        <div className="form-error" role="alert">
          {state.message}
        </div>
      )}

      <section className="form-section" aria-labelledby="opportunity-basics-title">
        <div className="form-section-header">
          <h2 id="opportunity-basics-title" className="form-section-title">Basics</h2>
          <p className="form-section-copy">
            Capture core opportunity details first. Required fields marked with *.
          </p>
        </div>

        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="title" className="form-label">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              aria-required="true"
              defaultValue={(initialValues as { title?: string }).title ?? ""}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="technicalOwner" className="form-label">
              Technical owner <span aria-hidden="true">*</span>
            </label>
            <input
              id="technicalOwner"
              name="technicalOwner"
              type="text"
              required
              aria-required="true"
              defaultValue={(initialValues as { technicalOwner?: string }).technicalOwner ?? ""}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="clientName" className="form-label">
              Client name
            </label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              defaultValue={(initialValues as { clientName?: string | null }).clientName ?? ""}
              className="form-input"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      <section className="form-section" aria-labelledby="opportunity-planning-title">
        <div className="form-section-header">
          <h2 id="opportunity-planning-title" className="form-section-title">Planning context</h2>
          <p className="form-section-copy">
            Add commercial and delivery context so next workflow steps start with cleaner inputs.
          </p>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="projectType" className="form-label">
              Project type
            </label>
            <input
              id="projectType"
              name="projectType"
              type="text"
              defaultValue={(initialValues as { projectType?: string | null }).projectType ?? ""}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="estimatedValue" className="form-label">
              Estimated value
            </label>
            <input
              id="estimatedValue"
              name="estimatedValue"
              type="text"
              defaultValue={(initialValues as { estimatedValue?: string | null }).estimatedValue ?? ""}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="proposalDeadline" className="form-label">
              Proposal deadline
            </label>
            <input
              id="proposalDeadline"
              name="proposalDeadline"
              type="date"
              defaultValue={(initialValues as { proposalDeadline?: string | null }).proposalDeadline ?? ""}
              className="form-input"
            />
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="fitCriteria" className="form-label">
              Internal fit criteria
            </label>
            <textarea
              id="fitCriteria"
              name="fitCriteria"
              rows={4}
              defaultValue={(initialValues as { fitCriteria?: string | null }).fitCriteria ?? ""}
              className="form-input form-textarea"
            />
            <p className="form-hint">
              Stack preferences, delivery guardrails, or budget constraints.
            </p>
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending
            ? props.mode === "create"
              ? "Creating…"
              : "Saving…"
            : props.mode === "create"
              ? "Create Opportunity"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
