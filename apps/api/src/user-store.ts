import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { InquiryDto, SavedSearchDto, UserDto, WatchlistItemDto } from "./contracts.js";

interface PersistedUser {
  id: string;
  email: string;
  name: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

interface PersistedStore {
  users: PersistedUser[];
  savedSearches: SavedSearchDto[];
  watchlistItems: WatchlistItemDto[];
  inquiries: InquiryDto[];
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const configuredStoreFile = process.env.APP_USER_STORE_FILE?.trim();
const defaultStoreFile =
  process.env.NODE_ENV === "production"
    ? "/tmp/globe-user-workspace.json"
    : path.resolve(repoRoot, "logs/user-workspace.json");
const storeFile = configuredStoreFile
  ? path.isAbsolute(configuredStoreFile)
    ? configuredStoreFile
    : path.resolve(repoRoot, configuredStoreFile)
  : defaultStoreFile;

const initialStore: PersistedStore = {
  users: [],
  savedSearches: [],
  watchlistItems: [],
  inquiries: []
};

let store: PersistedStore = { ...initialStore };

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashPassword = (password: string, salt: string): string =>
  createHash("sha256")
    .update(`${salt}:${password}`, "utf8")
    .digest("hex");

const toPublicUser = (user: PersistedUser): UserDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: "user",
  createdAt: user.createdAt
});

const hydrateStore = (): void => {
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

  const payload = parsed as {
    users?: unknown;
    savedSearches?: unknown;
    watchlistItems?: unknown;
    inquiries?: unknown;
  };

  if (Array.isArray(payload.users)) {
    store.users = payload.users.filter((entry): entry is PersistedUser => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }

      const candidate = entry as Partial<PersistedUser>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.email === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.passwordSalt === "string" &&
        typeof candidate.passwordHash === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  }

  if (Array.isArray(payload.savedSearches)) {
    store.savedSearches = payload.savedSearches.filter((entry): entry is SavedSearchDto => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }
      const candidate = entry as Partial<SavedSearchDto>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.userId === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.query === "string" &&
        Array.isArray(candidate.coverageTier) &&
        Array.isArray(candidate.state) &&
        typeof candidate.minConfidence === "string" &&
        typeof candidate.windowDays === "number" &&
        typeof candidate.legalDisplayOnly === "boolean" &&
        (typeof candidate.marketId === "string" || candidate.marketId === null) &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.updatedAt === "string"
      );
    });
  }

  if (Array.isArray(payload.watchlistItems)) {
    store.watchlistItems = payload.watchlistItems.filter((entry): entry is WatchlistItemDto => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }

      const candidate = entry as Partial<WatchlistItemDto>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.userId === "string" &&
        (candidate.type === "market" || candidate.type === "parcel") &&
        (typeof candidate.marketId === "string" || candidate.marketId === null) &&
        (typeof candidate.parcelId === "string" || candidate.parcelId === null) &&
        typeof candidate.label === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  }

  if (Array.isArray(payload.inquiries)) {
    store.inquiries = payload.inquiries.filter((entry): entry is InquiryDto => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }

      const candidate = entry as Partial<InquiryDto>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.userId === "string" &&
        typeof candidate.listingId === "string" &&
        typeof candidate.marketId === "string" &&
        typeof candidate.message === "string" &&
        (candidate.status === "submitted" || candidate.status === "acknowledged") &&
        typeof candidate.createdAt === "string"
      );
    });
  }
};

const persistStore = (): void => {
  mkdirSync(path.dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2), "utf8");
};

hydrateStore();

export const registerUserAccount = (
  email: string,
  password: string,
  name: string | null
):
  | { ok: true; user: UserDto }
  | { ok: false; errorCode: "email_taken" | "weak_password" | "invalid_payload" } => {
  const normalizedEmail = normalizeEmail(email);
  const cleanedName = (name ?? "").trim();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, errorCode: "invalid_payload" };
  }

  if (password.trim().length < 8) {
    return { ok: false, errorCode: "weak_password" };
  }

  if (store.users.some((user) => user.email === normalizedEmail)) {
    return { ok: false, errorCode: "email_taken" };
  }

  const salt = randomUUID();
  const now = new Date().toISOString();
  const user: PersistedUser = {
    id: `u-${randomUUID()}`,
    email: normalizedEmail,
    name: cleanedName.length > 0 ? cleanedName : normalizedEmail.split("@")[0] ?? "User",
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    createdAt: now
  };

  store.users = [...store.users, user];
  persistStore();

  return { ok: true, user: toPublicUser(user) };
};

export const authenticateUserAccount = (email: string, password: string): UserDto | null => {
  const normalizedEmail = normalizeEmail(email);
  const user = store.users.find((candidate) => candidate.email === normalizedEmail);
  if (!user) {
    return null;
  }

  const attemptedHash = hashPassword(password, user.passwordSalt);
  if (attemptedHash !== user.passwordHash) {
    return null;
  }

  return toPublicUser(user);
};

export const getUserById = (userId: string): UserDto | null => {
  const user = store.users.find((candidate) => candidate.id === userId);
  if (!user) {
    return null;
  }

  return toPublicUser(user);
};

export const listSavedSearchesForUser = (userId: string): SavedSearchDto[] =>
  store.savedSearches
    .filter((item) => item.userId === userId)
    .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt));

export const createSavedSearchForUser = (
  userId: string,
  payload: Omit<SavedSearchDto, "id" | "userId" | "createdAt" | "updatedAt">
): SavedSearchDto => {
  const now = new Date().toISOString();
  const next: SavedSearchDto = {
    id: `ss-${randomUUID()}`,
    userId,
    name: payload.name,
    query: payload.query,
    coverageTier: payload.coverageTier,
    state: payload.state,
    minConfidence: payload.minConfidence,
    windowDays: payload.windowDays,
    legalDisplayOnly: payload.legalDisplayOnly,
    marketId: payload.marketId,
    createdAt: now,
    updatedAt: now
  };

  store.savedSearches = [next, ...store.savedSearches];
  persistStore();

  return next;
};

export const listWatchlistItemsForUser = (userId: string): WatchlistItemDto[] =>
  store.watchlistItems
    .filter((item) => item.userId === userId)
    .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));

export const createWatchlistItemForUser = (
  userId: string,
  payload: Omit<WatchlistItemDto, "id" | "userId" | "createdAt">
): WatchlistItemDto => {
  const duplicate = store.watchlistItems.find(
    (item) =>
      item.userId === userId &&
      item.type === payload.type &&
      item.marketId === payload.marketId &&
      item.parcelId === payload.parcelId
  );
  if (duplicate) {
    return duplicate;
  }

  const next: WatchlistItemDto = {
    id: `wl-${randomUUID()}`,
    userId,
    type: payload.type,
    marketId: payload.marketId,
    parcelId: payload.parcelId,
    label: payload.label,
    createdAt: new Date().toISOString()
  };

  store.watchlistItems = [next, ...store.watchlistItems];
  persistStore();

  return next;
};

export const listInquiriesForUser = (userId: string): InquiryDto[] =>
  store.inquiries
    .filter((item) => item.userId === userId)
    .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));

export const createInquiryForUser = (
  userId: string,
  payload: Omit<InquiryDto, "id" | "userId" | "status" | "createdAt">
): InquiryDto => {
  const next: InquiryDto = {
    id: `iq-${randomUUID()}`,
    userId,
    listingId: payload.listingId,
    marketId: payload.marketId,
    message: payload.message,
    status: "submitted",
    createdAt: new Date().toISOString()
  };

  store.inquiries = [next, ...store.inquiries];
  persistStore();

  return next;
};
