import { useState, useEffect } from "react";

// ============================================
// MOCK DATA HOOKS FOR LEETCODE ARENA
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

const MOCK_PROBLEMS: Problem[] = [
  {
    id: "1",
    title: "Two Sum: Neon Edition",
    difficulty: "EASY",
    acceptance: 52.3,
    tags: ["Array", "Hash Table"],
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    starterCode: "function twoSum(nums, target) {\n  // Enter the grid...\n}",
  },
  {
    id: "2",
    title: "Add Two Polymorphic Numbers",
    difficulty: "MEDIUM",
    acceptance: 41.2,
    tags: ["Linked List", "Math"],
    description:
      "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
    starterCode:
      "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\nfunction addTwoNumbers(l1, l2) {\n  \n}",
  },
  {
    id: "3",
    title: "Longest Substring Without Repeating Glitches",
    difficulty: "MEDIUM",
    acceptance: 34.5,
    tags: ["Hash Table", "String", "Sliding Window"],
    description:
      "Given a string `s`, find the length of the longest substring without repeating characters.",
    starterCode: "function lengthOfLongestSubstring(s) {\n  \n}",
  },
  {
    id: "4",
    title: "Median of Two Sorted Mainframes",
    difficulty: "HARD",
    acceptance: 22.1,
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    description:
      "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
    starterCode: "function findMedianSortedArrays(nums1, nums2) {\n  \n}",
  },
  {
    id: "5",
    title: "Regular Expression Matching Processor",
    difficulty: "HARD",
    acceptance: 28.4,
    tags: ["String", "Dynamic Programming", "Recursion"],
    description:
      "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `'.'` and `'*'` where:\n- `.` Matches any single character.\n- `*` Matches zero or more of the preceding element.",
    starterCode: "function isMatch(s, p) {\n  \n}",
  },
  {
    id: "6",
    title: "Quantum Entanglement Router",
    difficulty: "INSANE",
    acceptance: 8.9,
    tags: ["Graph", "Advanced Math", "Quantum"],
    description:
      "Navigate the quantum state space to find the shortest path between entangled nodes without collapsing the wave function.",
    starterCode:
      "function routeQuantum(nodes, edges) {\n  // Warning: Reality may distort\n}",
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "u1",
    rank: 1,
    username: "NeoCoder",
    rating: 3450,
    streak: 124,
    tier: "Grandmaster",
  },
  {
    id: "u2",
    rank: 2,
    username: "Trinity_01",
    rating: 3320,
    streak: 89,
    tier: "Grandmaster",
  },
  {
    id: "u3",
    rank: 3,
    username: "MorpheusLog",
    rating: 3100,
    streak: 42,
    tier: "Master",
  },
  {
    id: "u4",
    rank: 4,
    username: "CypherHex",
    rating: 2950,
    streak: 15,
    tier: "Master",
  },
  {
    id: "u5",
    rank: 5,
    username: "SwitchBlt",
    rating: 2880,
    streak: 7,
    tier: "Diamond",
  },
  {
    id: "u6",
    rank: 6,
    username: "AgentSmith",
    rating: 2750,
    streak: 3,
    tier: "Diamond",
  },
  {
    id: "u7",
    rank: 7,
    username: "OracleBot",
    rating: 2600,
    streak: 21,
    tier: "Platinum",
  },
  {
    id: "u8",
    rank: 8,
    username: "Niobe_Net",
    rating: 2540,
    streak: 5,
    tier: "Platinum",
  },
  {
    id: "u9",
    rank: 9,
    username: "GhostInShell",
    rating: 2490,
    streak: 11,
    tier: "Gold",
  },
  {
    id: "u10",
    rank: 10,
    username: "TankOperator",
    rating: 2400,
    streak: 2,
    tier: "Gold",
  },
];

const MOCK_STATS: UserStats = {
  username: "Guest_Player_99",
  rank: 4021,
  rating: 1850,
  solved: {
    EASY: 142,
    MEDIUM: 89,
    HARD: 12,
    INSANE: 0,
  },
  recentSubmissions: [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0], // 1 is success, 0 is fail
};

const MOCK_ROOMS: ArenaRoom[] = [
  {
    id: "r-01",
    code: "NOVA42",
    name: "Neon Nexus Squad",
    memberCount: 12,
    status: "ACTIVE",
    joinedAt: "2026-03-20T12:00:00.000Z",
  },
  {
    id: "r-02",
    code: "BYTE77",
    name: "Byte Breakers",
    memberCount: 8,
    status: "ACTIVE",
    joinedAt: "2026-03-24T19:20:00.000Z",
  },
  {
    id: "r-03",
    code: "QUAD13",
    name: "Quad Core League",
    memberCount: 17,
    status: "LOCKED",
    joinedAt: "2026-03-27T09:10:00.000Z",
  },
];

const MOCK_ROOM_POINTS: RoomPointSnapshot[] = [
  {
    roomId: "r-01",
    roomName: "Neon Nexus Squad",
    totalPoints: 3220,
    currentRank: 3,
    solved: 19,
    velocity: 47,
  },
  {
    roomId: "r-02",
    roomName: "Byte Breakers",
    totalPoints: 1890,
    currentRank: 2,
    solved: 11,
    velocity: 31,
  },
  {
    roomId: "r-03",
    roomName: "Quad Core League",
    totalPoints: 950,
    currentRank: 8,
    solved: 6,
    velocity: 12,
  },
];

const MOCK_PULSE_EVENTS: RoomPulseEvent[] = [
  {
    id: "e-1",
    roomId: "r-01",
    roomName: "Neon Nexus Squad",
    actor: "NeoCoder",
    change: "Solved Quantum Entanglement Router",
    points: 340,
    happenedAt: "2m ago",
  },
  {
    id: "e-2",
    roomId: "r-02",
    roomName: "Byte Breakers",
    actor: "Trinity_01",
    change: "Hit speed bonus on Two Sum: Neon Edition",
    points: 110,
    happenedAt: "4m ago",
  },
  {
    id: "e-3",
    roomId: "r-03",
    roomName: "Quad Core League",
    actor: "OracleBot",
    change: "Completed Longest Substring Without Repeating Glitches",
    points: 220,
    happenedAt: "7m ago",
  },
  {
    id: "e-4",
    roomId: "r-01",
    roomName: "Neon Nexus Squad",
    actor: "You",
    change: "Cleared Add Two Polymorphic Numbers",
    points: 250,
    happenedAt: "9m ago",
  },
  {
    id: "e-5",
    roomId: "r-02",
    roomName: "Byte Breakers",
    actor: "GhostInShell",
    change: "Failed hard challenge and retried",
    points: 40,
    happenedAt: "12m ago",
  },
];

const ROOM_PROBLEM_MAP: Record<string, string[]> = {
  "r-01": ["1", "2", "4"],
  "r-02": ["3", "5"],
  "r-03": ["2", "4", "6", "1"],
};

export function useProblems() {
  const [data, setData] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_PROBLEMS);
      setIsLoading(false);
    }, 600);
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
      setData(MOCK_PROBLEMS.find((p) => p.id === id) || null);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  return { data, isLoading };
}

export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_LEADERBOARD);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useProfile() {
  const [data, setData] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_STATS);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useJoinedRooms() {
  const [data, setData] = useState<ArenaRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_ROOMS);
      setIsLoading(false);
    }, 420);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useRoomPointSnapshots() {
  const [data, setData] = useState<RoomPointSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_ROOM_POINTS);
      setIsLoading(false);
    }, 520);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useRoomPulseEvents() {
  const [data, setData] = useState<RoomPulseEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_PULSE_EVENTS);
      setIsLoading(false);
    }, 560);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

export function useRoomProblemGroups() {
  const [data, setData] = useState<RoomProblemGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const groups = MOCK_ROOMS.map((room) => {
        const problemIds = ROOM_PROBLEM_MAP[room.id] || [];
        const problems = problemIds
          .map((pid) => MOCK_PROBLEMS.find((problem) => problem.id === pid))
          .filter((problem): problem is Problem => Boolean(problem));

        return {
          roomId: room.id,
          roomName: room.name,
          roomCode: room.code,
          problems,
        };
      });

      setData(groups);
      setIsLoading(false);
    }, 480);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}
