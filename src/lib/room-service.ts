import { supabase } from "@/integrations/supabase/client";
import type { ArenaRoom } from "@/hooks/use-arena-data";
import { hasCompletedProfileForUser } from "@/lib/profile-service";

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
}

export interface JoinRoomInput {
  code: string;
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

async function ensureProfileCompleted(userId: string) {
  const profileCompleted = await hasCompletedProfileForUser(userId).catch(
    () => false,
  );
  if (!profileCompleted) {
    throw new Error("Complete your profile before creating or joining rooms.");
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

async function getCurrentUserIdOrNull() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn("Failed to resolve current user", {
        message: error.message,
        code: error.code,
      });
      return null;
    }

    return user?.id ?? null;
  } catch (error) {
    console.warn("Unexpected error while resolving current user", error);
    return null;
  }
}

async function getCurrentUserId() {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  return userId;
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
  await ensureProfileCompleted(ownerId);
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
    ownerId,
  });

  // Best effort: seed room pool/assignments so Problems page is not empty.
  void triggerRoomSync(room.id);

  return room;
}

export async function joinRoomByCodeForCurrentUser(input: string | JoinRoomInput) {
  const payload =
    typeof input === "string"
      ? ({ code: input } as JoinRoomInput)
      : input;

  const userId = await getCurrentUserId();
  await ensureProfileCompleted(userId);
  const code = normalizeRoomCode(payload.code);

  if (!validateRoomCode(code)) {
    throw new Error("Invalid room code.");
  }

  const room = await lookupRoomByCodeForJoin(code);

  if (room.status === "LOCKED") {
    throw new Error("This room is locked.");
  }

  const { error: joinError } = await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: userId,
    role: "MEMBER",
  });

  // If the user already joined earlier, unique violation is expected and safe to ignore.
  if (joinError && joinError.code !== "23505") {
    throw joinError;
  }

  cacheRoom({
    id: room.id,
    code: room.code,
    name: room.name,
    memberCount: 1,
    status: room.status,
    joinedAt: new Date().toISOString(),
    ownerId: room.owner_id,
  });

  // Best effort: refresh assignments once a member joins.
  void triggerRoomSync(room.id);

  return room;
}

export async function getJoinedRoomsForCurrentUser() {
  const cachedRooms = readCachedJoinedRooms();
  const userId = await getCurrentUserIdOrNull();

  if (!userId) {
    return cachedRooms;
  }

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
