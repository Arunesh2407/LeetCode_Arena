import { supabase } from "@/integrations/supabase/client";
import type { ArenaRoom } from "@/hooks/use-arena-data";

export type RoomSourceType = "manual" | "list_url" | "topics";

export interface CreateRoomInput {
  roomName?: string;
  sourceType: RoomSourceType;
  listUrl?: string;
  topics?: string[];
  questionCount?: number;
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
    throw new Error("Room relationship not available.");
  }

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    memberCount,
    status: room.status,
    joinedAt: row.joined_at || room.created_at,
  };
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

  const room = await createUniqueRoomRecord({
    name: roomName,
    owner_id: ownerId,
    status: "ACTIVE",
    source_type: sourceType,
    list_url: listUrl ?? null,
    list_slug: listSlug,
    topic_tags: topics,
    question_count: input.questionCount ?? null,
  });

  const { error: membershipError } = await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: ownerId,
    role: "OWNER",
  });

  if (membershipError) {
    throw membershipError;
  }

  return room;
}

export async function joinRoomByCodeForCurrentUser(rawCode: string) {
  const userId = await getCurrentUserId();
  const code = normalizeRoomCode(rawCode);

  if (!validateRoomCode(code)) {
    throw new Error("Invalid room code.");
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name, code, status")
    .eq("code", code)
    .single();

  if (roomError || !room) {
    throw new Error("Room not found for this code.");
  }

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

  return room;
}

export async function getJoinedRoomsForCurrentUser() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("room_members")
    .select("room_id, joined_at, rooms(id, code, name, status, created_at)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    throw error;
  }

  const memberships = (data ?? []) as unknown as RoomMembershipRow[];
  const roomIds = memberships.map((item) => item.room_id);

  let countsByRoom: Record<string, number> = {};
  if (roomIds.length > 0) {
    const { data: countsData, error: countsError } = await supabase
      .from("room_members")
      .select("room_id")
      .in("room_id", roomIds);

    if (countsError) {
      throw countsError;
    }

    countsByRoom = (countsData ?? []).reduce<Record<string, number>>((acc, row) => {
      const roomId = (row as { room_id: string }).room_id;
      acc[roomId] = (acc[roomId] ?? 0) + 1;
      return acc;
    }, {});
  }

  return memberships
    .filter((item) => Boolean(item.rooms))
    .map((item) => mapToArenaRoom(item, countsByRoom[item.room_id] ?? 1));
}
