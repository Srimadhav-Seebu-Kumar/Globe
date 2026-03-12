import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ReviewItemDto } from "./contracts.js";
import { reviewQueue as seedReviewQueue } from "./data.js";

type ReviewDecision = {
  status: "approved" | "rejected";
  updatedAt: string;
};

const decisionStore = new Map<string, ReviewDecision>();
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const configuredStoreFile = process.env.APP_REVIEW_STORE_FILE?.trim();
const storeFile = configuredStoreFile
  ? path.isAbsolute(configuredStoreFile)
    ? configuredStoreFile
    : path.resolve(repoRoot, configuredStoreFile)
  : path.resolve(repoRoot, "logs/review-decisions.json");

const hydrateDecisions = (): void => {
  if (!existsSync(storeFile)) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(storeFile, "utf8")) as unknown;
  } catch {
    return;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return;
  }

  for (const [reviewId, decisionValue] of Object.entries(parsed)) {
    if (typeof decisionValue !== "object" || decisionValue === null) {
      continue;
    }

    const decision = decisionValue as { status?: unknown; updatedAt?: unknown };
    if ((decision.status !== "approved" && decision.status !== "rejected") || typeof decision.updatedAt !== "string") {
      continue;
    }

    decisionStore.set(reviewId, {
      status: decision.status,
      updatedAt: decision.updatedAt
    });
  }
};

const persistDecisions = (): void => {
  mkdirSync(path.dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(Object.fromEntries(decisionStore), null, 2), "utf8");
};

hydrateDecisions();

export const listReviewQueue = (): ReviewItemDto[] =>
  seedReviewQueue.map((item) => {
    const decision = decisionStore.get(item.id);
    if (!decision) {
      return { ...item };
    }

    return {
      ...item,
      status: decision.status
    };
  });

export const saveReviewDecision = (
  reviewId: string,
  decision: "approved" | "rejected"
): { ok: boolean; review: ReviewItemDto | null } => {
  const review = seedReviewQueue.find((candidate) => candidate.id === reviewId);
  if (!review) {
    return { ok: false, review: null };
  }

  decisionStore.set(reviewId, {
    status: decision,
    updatedAt: new Date().toISOString()
  });
  persistDecisions();

  return {
    ok: true,
    review: {
      ...review,
      status: decision
    }
  };
};
