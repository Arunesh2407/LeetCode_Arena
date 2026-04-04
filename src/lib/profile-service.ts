import { supabase } from "@/integrations/supabase/client";

export interface UserProfileRow {
  user_id: string;
  username: string;
  profile_url: string;
  full_name: string | null;
  age: number | null;
  description: string | null;
  profile_completed_at: string | null;
  updated_at: string | null;
}

export interface UpsertUserProfileInput {
  fullName: string;
  age: number;
  description?: string;
  leetcodeIdentityInput: string;
}

const LEETCODE_USERNAME_REGEX = /^[A-Za-z0-9_-]{2,30}$/;

function normalizeLeetCodeUsername(username: string) {
  return username.trim();
}

function validateLeetCodeUsername(username: string) {
  return LEETCODE_USERNAME_REGEX.test(username);
}

export function extractLeetCodeUsernameFromProfileUrl(profileUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(profileUrl);
  } catch {
    throw new Error("Invalid LeetCode profile URL format.");
  }

  if (!parsed.hostname.toLowerCase().includes("leetcode.com")) {
    throw new Error("Only leetcode.com profile URLs are supported.");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    throw new Error("Could not parse username from profile URL.");
  }

  let username = segments[0];
  if ((segments[0] === "u" || segments[0] === "profile") && segments[1]) {
    username = segments[1];
  }

  username = username.replace(/^@/, "").trim();
  if (!validateLeetCodeUsername(username)) {
    throw new Error("LeetCode username in profile URL is invalid.");
  }

  return username;
}

function looksLikeUrl(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("://") ||
    normalized.startsWith("www.") ||
    normalized.includes("leetcode.com")
  );
}

function normalizePotentialProfileUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
}

export function resolveLeetCodeIdentity(leetcodeIdentityInput: string) {
  const rawIdentity = leetcodeIdentityInput.trim();

  if (!rawIdentity) {
    throw new Error("LeetCode username or profile URL is required.");
  }

  if (looksLikeUrl(rawIdentity)) {
    const profileUrl = normalizePotentialProfileUrl(rawIdentity);
    const username = extractLeetCodeUsernameFromProfileUrl(profileUrl);
    return { username, profileUrl: `https://leetcode.com/u/${username}/` };
  }

  const username = normalizeLeetCodeUsername(rawIdentity);
  if (!validateLeetCodeUsername(username)) {
    throw new Error("Invalid LeetCode username.");
  }

  return { username, profileUrl: `https://leetcode.com/u/${username}/` };
}

export function isProfileComplete(profile: Partial<UserProfileRow> | null | undefined) {
  if (!profile) {
    return false;
  }

  const fullName = profile.full_name?.trim() ?? "";
  const age = profile.age;
  const username = profile.username?.trim() ?? "";
  const profileUrl = profile.profile_url?.trim() ?? "";

  return (
    fullName.length >= 2 &&
    typeof age === "number" &&
    Number.isInteger(age) &&
    age >= 13 &&
    age <= 120 &&
    username.length >= 2 &&
    profileUrl.length > 0
  );
}

export async function getProfileForUser(userId: string) {
  const { data, error } = await supabase
    .from("user_leetcode_profiles")
    .select(
      "user_id, username, profile_url, full_name, age, description, profile_completed_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserProfileRow | null) ?? null;
}

export async function hasCompletedProfileForUser(userId: string) {
  const profile = await getProfileForUser(userId);
  return isProfileComplete(profile);
}

export async function upsertCurrentUserProfile(
  userId: string,
  input: UpsertUserProfileInput,
) {
  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 100) {
    throw new Error("Name must be between 2 and 100 characters.");
  }

  if (!Number.isInteger(input.age) || input.age < 13 || input.age > 120) {
    throw new Error("Age must be a whole number between 13 and 120.");
  }

  const identity = resolveLeetCodeIdentity(input.leetcodeIdentityInput);
  const description = input.description?.trim() ?? "";
  if (description.length > 500) {
    throw new Error("Description must be 500 characters or less.");
  }

  const { error } = await supabase.from("user_leetcode_profiles").upsert(
    {
      user_id: userId,
      full_name: fullName,
      age: input.age,
      description: description || null,
      username: identity.username,
      profile_url: identity.profileUrl,
      profile_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}
