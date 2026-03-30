import { useState, useEffect } from "react";
import { getJoinedRoomsForCurrentUser } from "@/lib/room-service";

// ============================================
// ARENA DATA HOOKS
// ============================================

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "INSANE";

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  acceptance: number;
  tags: string[];
  description: string;
  starterCode: string;
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
  rating: number;
  streak: number;
  tier: string;
}

export interface ArenaRoom {
  id: string;
  code: string;
  name: string;
  memberCount: number;
  status: "ACTIVE" | "LOCKED";
  joinedAt: string;
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

export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
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

        const groups = rooms.map((room) => ({
          roomId: room.id,
          roomName: room.name,
          roomCode: room.code,
          problems: [],
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
