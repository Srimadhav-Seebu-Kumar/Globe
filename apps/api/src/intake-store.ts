import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { IntakeSubmissionDto } from "./contracts.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const configuredStoreFile = process.env.APP_INTAKE_STORE_FILE?.trim();
const defaultStoreFile =
  process.env.NODE_ENV === "production"
    ? "/tmp/globe-intake-submissions.json"
    : path.resolve(repoRoot, "logs/intake-submissions.json");
const storeFile = configuredStoreFile
  ? path.isAbsolute(configuredStoreFile)
    ? configuredStoreFile
    : path.resolve(repoRoot, configuredStoreFile)
  : defaultStoreFile;

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

let submissions: IntakeSubmissionDto[] = [];

const hydrate = (): void => {
  if (!existsSync(storeFile)) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(storeFile, "utf8")) as unknown;
  } catch {
    return;
  }

  if (!Array.isArray(parsed)) {
    return;
  }

  submissions = parsed.filter((entry): entry is IntakeSubmissionDto => {
    if (typeof entry !== "object" || entry === null) {
      return false;
    }
    const candidate = entry as Partial<IntakeSubmissionDto>;
    return (
      typeof candidate.id === "string" &&
      (candidate.type === "demo_request" ||
        candidate.type === "listing_submission" ||
        candidate.type === "issue_report" ||
        candidate.type === "password_reset") &&
      (candidate.status === "pending" || candidate.status === "approved" || candidate.status === "rejected") &&
      typeof candidate.submittedAt === "string" &&
      typeof candidate.submittedByEmail === "string" &&
      (typeof candidate.submittedByUserId === "string" || candidate.submittedByUserId === null) &&
      (typeof candidate.marketId === "string" || candidate.marketId === null) &&
      typeof candidate.title === "string" &&
      typeof candidate.description === "string" &&
      (candidate.priority === "low" || candidate.priority === "medium" || candidate.priority === "high") &&
      typeof candidate.payload === "object" &&
      candidate.payload !== null
    );
  });
};

const persist = (): void => {
  mkdirSync(path.dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(submissions, null, 2), "utf8");
};

hydrate();

export const listIntakeSubmissions = (): IntakeSubmissionDto[] =>
  [...submissions].sort((left, right) => +new Date(right.submittedAt) - +new Date(left.submittedAt));

export const createIntakeSubmission = (
  payload: Omit<IntakeSubmissionDto, "id" | "status" | "submittedAt" | "submittedByEmail">
): IntakeSubmissionDto => {
  const now = new Date().toISOString();
  const next: IntakeSubmissionDto = {
    id: `intake-${randomUUID()}`,
    status: "pending",
    submittedAt: now,
    submittedByEmail: normalizeEmail(payload.payload.email ?? payload.payload.contactEmail ?? "unknown@unknown.invalid"),
    submittedByUserId: payload.submittedByUserId,
    marketId: payload.marketId,
    type: payload.type,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    payload: payload.payload
  };

  submissions = [next, ...submissions];
  persist();
  return next;
};

export const setIntakeSubmissionDecision = (
  submissionId: string,
  decision: "approved" | "rejected"
): { ok: boolean; item: IntakeSubmissionDto | null } => {
  const index = submissions.findIndex((item) => item.id === submissionId);
  if (index < 0) {
    return { ok: false, item: null };
  }

  const current = submissions[index];
  if (!current) {
    return { ok: false, item: null };
  }

  const next: IntakeSubmissionDto = {
    ...current,
    status: decision
  };

  submissions = [...submissions.slice(0, index), next, ...submissions.slice(index + 1)];
  persist();
  return { ok: true, item: next };
};
