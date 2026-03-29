import { useState, useEffect } from 'react';

// ============================================
// MOCK DATA HOOKS FOR LEETCODE ARENA
// ============================================

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';

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

const MOCK_PROBLEMS: Problem[] = [
  {
    id: "1", title: "Two Sum: Neon Edition", difficulty: "EASY", acceptance: 52.3,
    tags: ["Array", "Hash Table"],
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    starterCode: "function twoSum(nums, target) {\n  // Enter the grid...\n}"
  },
  {
    id: "2", title: "Add Two Polymorphic Numbers", difficulty: "MEDIUM", acceptance: 41.2,
    tags: ["Linked List", "Math"],
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
    starterCode: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\nfunction addTwoNumbers(l1, l2) {\n  \n}"
  },
  {
    id: "3", title: "Longest Substring Without Repeating Glitches", difficulty: "MEDIUM", acceptance: 34.5,
    tags: ["Hash Table", "String", "Sliding Window"],
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    starterCode: "function lengthOfLongestSubstring(s) {\n  \n}"
  },
  {
    id: "4", title: "Median of Two Sorted Mainframes", difficulty: "HARD", acceptance: 22.1,
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
    starterCode: "function findMedianSortedArrays(nums1, nums2) {\n  \n}"
  },
  {
    id: "5", title: "Regular Expression Matching Processor", difficulty: "HARD", acceptance: 28.4,
    tags: ["String", "Dynamic Programming", "Recursion"],
    description: "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `'.'` and `'*'` where:\n- `.` Matches any single character.\n- `*` Matches zero or more of the preceding element.",
    starterCode: "function isMatch(s, p) {\n  \n}"
  },
  {
    id: "6", title: "Quantum Entanglement Router", difficulty: "INSANE", acceptance: 8.9,
    tags: ["Graph", "Advanced Math", "Quantum"],
    description: "Navigate the quantum state space to find the shortest path between entangled nodes without collapsing the wave function.",
    starterCode: "function routeQuantum(nodes, edges) {\n  // Warning: Reality may distort\n}"
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "u1", rank: 1, username: "NeoCoder", rating: 3450, streak: 124, tier: "Grandmaster" },
  { id: "u2", rank: 2, username: "Trinity_01", rating: 3320, streak: 89, tier: "Grandmaster" },
  { id: "u3", rank: 3, username: "MorpheusLog", rating: 3100, streak: 42, tier: "Master" },
  { id: "u4", rank: 4, username: "CypherHex", rating: 2950, streak: 15, tier: "Master" },
  { id: "u5", rank: 5, username: "SwitchBlt", rating: 2880, streak: 7, tier: "Diamond" },
  { id: "u6", rank: 6, username: "AgentSmith", rating: 2750, streak: 3, tier: "Diamond" },
  { id: "u7", rank: 7, username: "OracleBot", rating: 2600, streak: 21, tier: "Platinum" },
  { id: "u8", rank: 8, username: "Niobe_Net", rating: 2540, streak: 5, tier: "Platinum" },
  { id: "u9", rank: 9, username: "GhostInShell", rating: 2490, streak: 11, tier: "Gold" },
  { id: "u10", rank: 10, username: "TankOperator", rating: 2400, streak: 2, tier: "Gold" },
];

const MOCK_STATS: UserStats = {
  username: "Guest_Player_99",
  rank: 4021,
  rating: 1850,
  solved: {
    EASY: 142,
    MEDIUM: 89,
    HARD: 12,
    INSANE: 0
  },
  recentSubmissions: [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0] // 1 is success, 0 is fail
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
      setData(MOCK_PROBLEMS.find(p => p.id === id) || null);
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
