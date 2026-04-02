import { useState, useEffect } from "react";
import { getJoinedRoomsForCurrentUser } from "@/lib/room-service";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// ARENA DATA HOOKS
// ============================================

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "INSANE";

export interface Problem {
  id: string;
  slug: string;
  url: string;
  title: string;
  difficulty: Difficulty;
  acceptance: number;
  tags: string[];
  description: string;
  starterCode: string;
  points?: number;
  completed?: boolean;
}

export interface UserStats {
  username: string;
  rank: number;
  rating: number;
  solved: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
    INSANE: number;
  };
  recentSubmissions: number[];
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  totalPoints: number;
  solvedCount: number;
  updatedAt: string;
}

export interface ArenaRoom {
  id: string;
  code: string;
  name: string;
  memberCount: number;
  status: "ACTIVE" | "LOCKED";
  joinedAt: string;
  ownerId?: string;
}

export interface RoomPointSnapshot {
  roomId: string;
  roomName: string;
  totalPoints: number;
  currentRank: number;
  solved: number;
  velocity: number;
}

export interface RoomPulseEvent {
  id: string;
  roomId: string;
  roomName: string;
  actor: string;
  change: string;
  points: number;
  happenedAt: string;
}

export interface RoomProblemGroup {
  roomId: string;
  roomName: string;
  roomCode: string;
  problems: Problem[];
}

export function useProblems() {
  const [data, setData] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData([]);
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useProblem(id: string) {
  const [data, setData] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setData(null);
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [id]);

  return { data, isLoading };
}

export function useLeaderboard(roomId?: string) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      if (!roomId) {
        setData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: scoreRows, error: scoreError } = await supabase
          .from("room_leaderboard_cache")
          .select("user_id, total_points, solved_count, updated_at")
          .eq("room_id", roomId)
          .order("total_points", { ascending: false })
          .order("solved_count", { ascending: false });

        if (scoreError) {
          throw scoreError;
        }

        const userIds = (scoreRows ?? []).map((row) => (row as { user_id: string }).user_id);
        const usernamesByUserId = new Map<string, string>();

        if (userIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from("user_leetcode_profiles")
            .select("user_id, username")
            .in("user_id", userIds);

          if (profileError) {
            throw profileError;
          }

          for (const row of profileRows ?? []) {
            const typed = row as { user_id: string; username: string };
            usernamesByUserId.set(typed.user_id, typed.username);
          }
        }

        const entries: LeaderboardEntry[] = (scoreRows ?? []).map((row, index) => {
          const typed = row as {
            user_id: string;
            total_points: number;
            solved_count: number;
            updated_at: string;
          };
          return {
            id: typed.user_id,
            rank: index + 1,
            username: usernamesByUserId.get(typed.user_id) ?? "unknown-user",
            totalPoints: typed.total_points,
            solvedCount: typed.solved_count,
            updatedAt: typed.updated_at,
          };
        });

        if (!active) return;
        setData(entries);
      } catch (error) {
        console.warn("Failed to load room leaderboard from Supabase", error);
        if (!active) return;
        setData([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadLeaderboard();
    return () => {
      active = false;
    };
  }, [roomId]);

  return { data, isLoading };
}

export function useProfile() {
  const [data, setData] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(null);
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useJoinedRooms() {
  const [data, setData] = useState<ArenaRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRooms = async () => {
      setIsLoading(true);
      try {
        const rooms = await getJoinedRoomsForCurrentUser();
        if (!active) return;
        setData(rooms);
      } catch (error) {
        console.warn("Failed to load joined rooms from Supabase", error);
        if (!active) return;
        setData([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRooms();
    return () => {
      active = false;
    };
  }, []);

  return { data, isLoading };
}

export function useRoomPointSnapshots() {
  const [data, setData] = useState<RoomPointSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData([]);
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useRoomPulseEvents() {
  const [data, setData] = useState<RoomPulseEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData([]);
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useRoomProblemGroups() {
  const [data, setData] = useState<RoomProblemGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const rooms = await getJoinedRoomsForCurrentUser();
        if (!active) return;

        const baseGroups = rooms.map((room) => ({
          roomId: room.id,
          roomName: room.name,
          roomCode: room.code,
          problems: [],
        }));

        if (rooms.length === 0) {
          setData(baseGroups);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const today = new Date().toISOString().slice(0, 10);
        const roomIds = rooms.map((room) => room.id);

        const { data: assignmentRows, error: assignmentsError } = await supabase
          .from("room_daily_assignments")
          .select(
            "room_id, assign_date, problem_id, room_problems(id, slug, title, difficulty, topics, points)",
          )
          .in("room_id", roomIds)
          .eq("assign_date", today);

        if (assignmentsError) {
          throw assignmentsError;
        }

        let solvedKeys = new Set<string>();
        if (user) {
          const { data: solvedRows, error: solvedError } = await supabase
            .from("user_room_problem_status")
            .select("room_id, problem_id")
            .in("room_id", roomIds)
            .eq("user_id", user.id)
            .not("solved_at", "is", null);

          if (solvedError) {
            throw solvedError;
          }

          solvedKeys = new Set(
            (solvedRows ?? []).map(
              (row) => `${(row as { room_id: string }).room_id}:${(row as { problem_id: string }).problem_id}`,
            ),
          );
        }

        const problemsByRoom = new Map<string, Problem[]>();
        for (const row of assignmentRows ?? []) {
          const typedRow = row as {
            room_id: string;
            problem_id: string;
            room_problems: {
              id: string;
              slug: string;
              title: string;
              difficulty: "EASY" | "MEDIUM" | "HARD";
              topics: string[];
              points: number;
            } | null;
          };

          if (!typedRow.room_problems) continue;
          const pool = problemsByRoom.get(typedRow.room_id) ?? [];
          pool.push({
            id: typedRow.room_problems.id,
            slug: typedRow.room_problems.slug,
            url: `https://leetcode.com/problems/${typedRow.room_problems.slug}/`,
            title: typedRow.room_problems.title,
            difficulty: typedRow.room_problems.difficulty,
            acceptance: 0,
            tags: typedRow.room_problems.topics ?? [],
            description: "Open on LeetCode to solve this daily room assignment.",
            starterCode: "",
            points: typedRow.room_problems.points,
            completed: solvedKeys.has(`${typedRow.room_id}:${typedRow.problem_id}`),
          });
          problemsByRoom.set(typedRow.room_id, pool);
        }

        const groups = baseGroups.map((group) => ({
          ...group,
          problems: problemsByRoom.get(group.roomId) ?? [],
        }));

        setData(groups);
      } catch (error) {
        console.warn("Failed to load room problem groups from Supabase", error);
        if (!active) return;
        setData([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadGroups();
    return () => {
      active = false;
    };
  }, []);

  return { data, isLoading };
}
