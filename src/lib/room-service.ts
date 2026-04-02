import { supabase } from "@/integrations/supabase/client";
import type { ArenaRoom } from "@/hooks/use-arena-data";

export type RoomSourceType = "manual" | "list_url" | "topics";
export type RoomDurationType = "days" | "months" | "unlimited";

export interface CreateRoomInput {
  roomName?: string;
  sourceType: RoomSourceType;
  listUrl?: string;
  topics?: string[];
  questionCount?: number;
  durationType?: RoomDurationType;
  durationValue?: number | null;
  dailyEasyCount?: number;
  dailyMediumCount?: number;
  dailyHardCount?: number;
  assignmentTimezone?: string;
  assignmentTimeUtc?: string;
  leetcodeIdentityInput?: string;
}

export interface JoinRoomInput {
  code: string;
  leetcodeIdentityInput?: string;
}

interface RoomRow {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "LOCKED";
  created_at: string;
}

interface RoomMembershipRow {
  room_id: string;
  joined_at: string;
  rooms: RoomRow | null;
}

const JOINED_ROOMS_CACHE_KEY = "lc_arena_joined_rooms_cache_v1";

const ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;
const LEETCODE_USERNAME_REGEX = /^[A-Za-z0-9_-]{2,30}$/;

function buildDefaultRoomName() {
  return `Arena ${new Date().toISOString().slice(0, 10)}`;
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

export function validateRoomCode(code: string) {
  return ROOM_CODE_REGEX.test(normalizeRoomCode(code));
}

export function extractLeetCodeListSlug(listUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(listUrl);
  } catch {
    throw new Error("Invalid URL format. Please paste a full LeetCode list URL.");
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.includes("leetcode.com")) {
    throw new Error("Only leetcode.com URLs are supported.");
  }

  const path = parsed.pathname.replace(/\/+$/, "");
  const patterns = [/\/problem-list\/([^/]+)$/i, /\/lists\/([^/]+)$/i, /\/list\/([^/]+)$/i];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  const segments = path.split("/").filter(Boolean);
  const fallback = segments.at(-1);
  if (fallback) {
    return fallback;
  }

  throw new Error("Could not parse list slug from URL.");
}

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

function resolveLeetCodeIdentity(leetcodeIdentityInput?: string) {
  const rawIdentity = leetcodeIdentityInput?.trim() ?? "";

  if (!rawIdentity) {
    throw new Error(
      "LeetCode username or profile URL is required to participate in a room.",
    );
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

function computeRoomWindow(durationType: RoomDurationType, durationValue?: number | null) {
  const startsAt = new Date();

  if (durationType === "unlimited") {
    return { startsAt: startsAt.toISOString(), endsAt: null, durationValue: null };
  }

  if (!durationValue || durationValue <= 0) {
    throw new Error("Duration value must be greater than 0 for limited rooms.");
  }

  const endsAt = new Date(startsAt);
  if (durationType === "days") {
    endsAt.setDate(endsAt.getDate() + durationValue);
  } else {
    endsAt.setMonth(endsAt.getMonth() + durationValue);
  }

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    durationValue,
  };
}

async function upsertLeetCodeProfileForCurrentUser(
  userId: string,
  identity: { username: string; profileUrl: string },
) {
  const { error } = await supabase.from("user_leetcode_profiles").upsert(
    {
      user_id: userId,
      username: identity.username,
      profile_url: identity.profileUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    const isDuplicateUsernameConflict =
      error.code === "23505" &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("username");

    if (isDuplicateUsernameConflict) {
      console.warn(
        "Skipped saving LeetCode profile because the username is already linked to another account.",
        {
          userId,
          username: identity.username,
          message: error.message,
          details: error.details,
        },
      );
      return;
    }

    throw error;
  }
}

async function triggerRoomSync(roomId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("leetcode-importer", {
      body: {
        mode: "run-daily",
        roomId,
      },
    });

    if (error) {
      console.error("Room sync function error:", error);
      return;
    }

    console.log("Room sync triggered successfully:", data);
  } catch (err) {
    console.error("Room sync invoke failed:", err instanceof Error ? err.message : err);
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return user.id;
}

function mapToArenaRoom(row: RoomMembershipRow, memberCount = 1): ArenaRoom {
  const room = row.rooms;
  if (!room) {
    throw new Error("Room relationship not available.")
  }

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    memberCount,
    status: room.status,
    joinedAt: row.joined_at || room.created_at,
    ownerId: (room as any).owner_id,
  };
}

function readCachedJoinedRooms(): ArenaRoom[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(JOINED_ROOMS_CACHE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ArenaRoom[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((room) => Boolean(room?.id && room?.code && room?.name));
  } catch {
    return [];
  }
}

function writeCachedJoinedRooms(rooms: ArenaRoom[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(JOINED_ROOMS_CACHE_KEY, JSON.stringify(rooms.slice(0, 50)));
  } catch {
    // Ignore localStorage write failures.
  }
}

function clearCachedJoinedRooms() {
  writeCachedJoinedRooms([]);
}

function mergeJoinedRooms(primary: ArenaRoom[], fallback: ArenaRoom[]) {
  const byId = new Map<string, ArenaRoom>();

  for (const room of [...primary, ...fallback]) {
    if (!byId.has(room.id)) {
      byId.set(room.id, room);
    }
  }

  return Array.from(byId.values());
}

function cacheRoom(room: ArenaRoom) {
  const current = readCachedJoinedRooms();
  const merged = mergeJoinedRooms([room], current);
  writeCachedJoinedRooms(merged);
}

async function createUniqueRoomRecord(payload: Record<string, unknown>) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ ...payload, code })
      .select("id, code, name")
      .single();

    if (!error && data) {
      return data;
    }

    // Retry only duplicate-code conflicts.
    if (error && error.code !== "23505") {
      throw error;
    }
  }

  throw new Error("Failed to generate a unique room code. Please try again.");
}

async function lookupRoomByCodeForJoin(code: string) {
  const { data, error } = await supabase
    .rpc("lookup_room_by_code_for_join", { p_code: code })
    .single();

  if (error || !data) {
    throw new Error("Room not found for this code.");
  }

  return data as RoomRow & { owner_id?: string };
}

export async function createRoomForCurrentUser(input: CreateRoomInput) {
  const ownerId = await getCurrentUserId();
  const sourceType = input.sourceType;

  if (sourceType === "list_url" && !input.listUrl?.trim()) {
    throw new Error("List URL is required when source type is URL.");
  }

  if (sourceType === "topics" && (!input.topics || input.topics.length === 0)) {
    throw new Error("Pick at least one topic for topic-based generation.");
  }

  const roomName = input.roomName?.trim() || buildDefaultRoomName();
  const listUrl = input.listUrl?.trim();
  const listSlug = sourceType === "list_url" && listUrl ? extractLeetCodeListSlug(listUrl) : null;
  const topics = sourceType === "topics" ? input.topics ?? [] : [];
  const durationType = input.durationType ?? "unlimited";
  const roomWindow = computeRoomWindow(durationType, input.durationValue);
  const dailyEasyCount = input.dailyEasyCount ?? 0;
  const dailyMediumCount = input.dailyMediumCount ?? 1;
  const dailyHardCount = input.dailyHardCount ?? 0;

  if (dailyEasyCount < 0 || dailyMediumCount < 0 || dailyHardCount < 0) {
    throw new Error("Daily difficulty counts cannot be negative.");
  }

  if (dailyEasyCount + dailyMediumCount + dailyHardCount <= 0) {
    throw new Error("Set at least one daily problem across easy/medium/hard.");
  }

  const leetcodeIdentity = resolveLeetCodeIdentity(input.leetcodeIdentityInput);
  await upsertLeetCodeProfileForCurrentUser(ownerId, leetcodeIdentity);

  const room = await createUniqueRoomRecord({
    name: roomName,
    owner_id: ownerId,
    status: "ACTIVE",
    source_type: sourceType,
    list_url: listUrl ?? null,
    list_slug: listSlug,
    topic_tags: topics,
    question_count: input.questionCount ?? null,
    duration_type: durationType,
    duration_value: roomWindow.durationValue,
    starts_at: roomWindow.startsAt,
    ends_at: roomWindow.endsAt,
    daily_easy_count: dailyEasyCount,
    daily_medium_count: dailyMediumCount,
    daily_hard_count: dailyHardCount,
    assignment_timezone: input.assignmentTimezone ?? "UTC",
    assignment_time_utc: input.assignmentTimeUtc ?? "00:00:00",
  });

  const { error: membershipError } = await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: ownerId,
    role: "OWNER",
  });

  if (membershipError) {
    throw membershipError;
  }

  cacheRoom({
    id: room.id,
    code: room.code,
    name: room.name,
    memberCount: 1,
    status: "ACTIVE",
    joinedAt: new Date().toISOString(),
  });

  // Best effort: seed room pool/assignments so Problems page is not empty.
  void triggerRoomSync(room.id);

  return room;
}

export async function joinRoomByCodeForCurrentUser(rawCode: string) {
  return joinRoomByCodeForCurrentUserWithProfile({ code: rawCode });
}

export async function joinRoomByCodeForCurrentUserWithProfile(
  input: string | JoinRoomInput,
) {
  const payload =
    typeof input === "string"
      ? ({ code: input } as JoinRoomInput)
      : input;

  const userId = await getCurrentUserId();
  const code = normalizeRoomCode(payload.code);

  if (!validateRoomCode(code)) {
    throw new Error("Invalid room code.");
  }

  const leetcodeIdentity = resolveLeetCodeIdentity(payload.leetcodeIdentityInput);
  await upsertLeetCodeProfileForCurrentUser(userId, leetcodeIdentity);

  const room = await lookupRoomByCodeForJoin(code);

  if (room.status === "LOCKED") {
    throw new Error("This room is locked.");
  }

  const { error: joinError } = await supabase.from("room_members").upsert(
    {
      room_id: room.id,
      user_id: userId,
      role: "MEMBER",
    },
    { onConflict: "room_id,user_id" },
  );

  if (joinError) {
    throw joinError;
  }

  cacheRoom({
    id: room.id,
    code: room.code,
    name: room.name,
    memberCount: 1,
    status: room.status,
    joinedAt: new Date().toISOString(),
  });

  // Best effort: refresh assignments once a member joins.
  void triggerRoomSync(room.id);

  return room;
}

export async function getJoinedRoomsForCurrentUser() {
  const userId = await getCurrentUserId();
  const cachedRooms = readCachedJoinedRooms();

  // Step 1: Get room IDs the user is a member of
  const { data: membershipData, error: membershipError } = await supabase
    .from("room_members")
    .select("room_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (membershipError) {
    console.warn("Failed to load room memberships", {
      message: membershipError.message,
      code: membershipError.code,
      details: membershipError.details,
      hint: membershipError.hint,
    });
    return cachedRooms;
  }

  const memberships = (membershipData ?? []) as Array<{
    room_id: string;
    joined_at: string;
  }>;

  if (memberships.length === 0) {
    clearCachedJoinedRooms();
    return [];
  }

  // Step 2: Get room details for all membership room IDs
  const roomIds = memberships.map((item) => item.room_id);
  const { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select("id, code, name, status, created_at, owner_id")
    .in("id", roomIds);

  if (roomsError) {
    console.warn("Failed to load room details for memberships", {
      message: roomsError.message,
      code: roomsError.code,
      details: roomsError.details,
      hint: roomsError.hint,
    });
    return cachedRooms;
  }

  const roomsMap = new Map<string, RoomRow & { owner_id: string }>();
  for (const room of roomsData ?? []) {
    const typed = room as RoomRow & { owner_id: string };
    roomsMap.set(typed.id, typed);
  }

  // Step 3: Count members for each room (optional for display)
  const countsByRoom: Record<string, number> = {};
  if (roomIds.length > 0) {
    const { data: countsData } = await supabase
      .from("room_members")
      .select("room_id")
      .in("room_id", roomIds);

    for (const row of countsData ?? []) {
      const roomId = (row as { room_id: string }).room_id;
      countsByRoom[roomId] = (countsByRoom[roomId] ?? 0) + 1;
    }
  }

  // Step 4: Build the room list from memberships and room data
  const liveRooms = memberships
    .map((membership) => {
      const room = roomsMap.get(membership.room_id);
      if (!room) return null;

      return {
        id: room.id,
        code: room.code,
        name: room.name,
        memberCount: countsByRoom[room.id] ?? 1,
        status: room.status,
        joinedAt: membership.joined_at || room.created_at,
        ownerId: room.owner_id,
      };
    })
    .filter(Boolean) as ArenaRoom[];

  if (liveRooms.length === 0) {
    clearCachedJoinedRooms();
    return [];
  }

  writeCachedJoinedRooms(liveRooms);
  return liveRooms;
}

export async function deleteRoomForCurrentUser(roomId: string) {
  const userId = await getCurrentUserId();

  // Verify ownership
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("owner_id")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    throw new Error("Room not found.");
  }

  if ((room as { owner_id: string }).owner_id !== userId) {
    throw new Error("Only room owner can delete this room.");
  }

  const { error: deleteError } = await supabase.from("rooms").delete().eq("id", roomId);

  if (deleteError) {
    throw deleteError;
  }

  clearCachedJoinedRooms();
}
