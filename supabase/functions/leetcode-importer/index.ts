import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface RoomRow {
  id: string;
  owner_id: string;
  status: "ACTIVE" | "LOCKED";
  topic_tags: string[];
  ends_at: string | null;
  daily_easy_count: number;
  daily_medium_count: number;
  daily_hard_count: number;
}

interface PoolProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
}

interface ImportedProblemRow {
  leetcode_problem_id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  topics: string[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

const DIFFICULTY_MAP: Record<string, Difficulty | undefined> = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD",
};

const FALLBACK_PROBLEMS: Array<{
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
}> = [
  { slug: "two-sum", title: "Two Sum", difficulty: "EASY", topics: ["Array", "Hash Table"] },
  { slug: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", difficulty: "EASY", topics: ["Array", "Dynamic Programming"] },
  { slug: "valid-parentheses", title: "Valid Parentheses", difficulty: "EASY", topics: ["Stack", "String"] },
  { slug: "contains-duplicate", title: "Contains Duplicate", difficulty: "EASY", topics: ["Array", "Hash Table"] },
  { slug: "product-of-array-except-self", title: "Product of Array Except Self", difficulty: "MEDIUM", topics: ["Array", "Prefix Sum"] },
  { slug: "group-anagrams", title: "Group Anagrams", difficulty: "MEDIUM", topics: ["Hash Table", "String"] },
  { slug: "3sum", title: "3Sum", difficulty: "MEDIUM", topics: ["Array", "Two Pointers"] },
  { slug: "top-k-frequent-elements", title: "Top K Frequent Elements", difficulty: "MEDIUM", topics: ["Array", "Heap (Priority Queue)"] },
  { slug: "longest-consecutive-sequence", title: "Longest Consecutive Sequence", difficulty: "MEDIUM", topics: ["Array", "Hash Table"] },
  { slug: "merge-k-sorted-lists", title: "Merge k Sorted Lists", difficulty: "HARD", topics: ["Linked List", "Heap (Priority Queue)"] },
  { slug: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "HARD", topics: ["Array", "Two Pointers"] },
  { slug: "median-of-two-sorted-arrays", title: "Median of Two Sorted Arrays", difficulty: "HARD", topics: ["Array", "Binary Search"] },
];

const TOPIC_SLUG_OVERRIDES: Record<string, string> = {
  "Hash Table": "hash-table",
  "Dynamic Programming": "dynamic-programming",
  "Depth-First Search": "depth-first-search",
  "Binary Search": "binary-search",
  "Bit Manipulation": "bit-manipulation",
  "Breadth-First Search": "breadth-first-search",
  "Two Pointers": "two-pointers",
  "Prefix Sum": "prefix-sum",
  "Heap (Priority Queue)": "heap-priority-queue",
  "Graph Theory": "graph",
  "Binary Tree": "binary-tree",
  "Sliding Window": "sliding-window",
  "Union-Find": "union-find",
  "Number Theory": "number-theory",
  "Linked List": "linked-list",
  "Ordered Set": "ordered-set",
  "Segment Tree": "segment-tree",
  "Monotonic Stack": "monotonic-stack",
  "Divide and Conquer": "divide-and-conquer",
  "Binary Indexed Tree": "binary-indexed-tree",
  "Binary Search Tree": "binary-search-tree",
  "Hash Function": "hash-function",
  "Topological Sort": "topological-sort",
  "Shortest Path": "shortest-path",
  "String Matching": "string-matching",
  "Rolling Hash": "rolling-hash",
  "Game Theory": "game-theory",
  "Data Stream": "data-stream",
  "Monotonic Queue": "monotonic-queue",
  "Doubly-Linked List": "doubly-linked-list",
  "Merge Sort": "merge-sort",
  "Counting Sort": "counting-sort",
  "Minimum Spanning Tree": "minimum-spanning-tree",
  "Bucket Sort": "bucket-sort",
  Shell: "shell",
  "Reservoir Sampling": "reservoir-sampling",
  "Eulerian Circuit": "eulerian-circuit",
  "Radix Sort": "radix-sort",
  "Strongly Connected Component": "strongly-connected-component",
  "Rejection Sampling": "rejection-sampling",
  "Biconnected Component": "biconnected-component",
};

function toTopicSlug(topic: string) {
  const explicit = TOPIC_SLUG_OVERRIDES[topic.trim()];
  if (explicit) return explicit;
  return topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function pickRandom<T>(items: T[], count: number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, count));
}

async function fetchLeetCodeTopicProblems(topicSlug: string, limit = 50) {
  const query = `
    query topicQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        data {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://leetcode.com/problemset/",
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      query,
      variables: {
        categorySlug: "",
        limit,
        skip: 0,
        filters: {
          tags: [topicSlug],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode topic fetch failed with status ${response.status}`);
  }

  const payload = await response.json();
  const items = payload?.data?.questionList?.data ?? [];
  return items
    .map((item: {
      questionFrontendId: string;
      title: string;
      titleSlug: string;
      difficulty: string;
      topicTags: Array<{ name: string }>;
    }) => {
      const difficulty = DIFFICULTY_MAP[item.difficulty];
      if (!difficulty) return null;
      return {
        leetcode_problem_id: item.questionFrontendId,
        slug: item.titleSlug,
        title: item.title,
        difficulty,
        points: DIFFICULTY_POINTS[difficulty],
        topics: (item.topicTags ?? []).map((tag) => tag.name),
      };
    })
    .filter(Boolean);
}

async function fetchRecentAcceptedSlugs(username: string, limit = 200) {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        titleSlug
        timestamp
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://leetcode.com/",
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      query,
      variables: { username, limit },
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode submission fetch failed for ${username}`);
  }

  const payload = await response.json();
  const submissions = payload?.data?.recentAcSubmissionList ?? [];
  return submissions.map((item: { titleSlug: string; timestamp: string }) => ({
    slug: item.titleSlug,
    solvedAt: new Date(Number(item.timestamp) * 1000).toISOString(),
  }));
}

async function fetchLeetCodeTotalQuestionCount() {
  const response = await fetch("https://leetcode.com/api/problems/all/", {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: "https://leetcode.com/problemset/",
    },
  });

  if (!response.ok) {
    throw new Error(`LeetCode total-count fetch failed with status ${response.status}`);
  }

  const payload = await response.json();
  const total = Number(payload?.num_total ?? Number.NaN);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("LeetCode total-count response did not include a valid num_total.");
  }

  return Math.floor(total);
}

function isRoomActive(room: RoomRow) {
  if (room.status !== "ACTIVE") return false;
  if (!room.ends_at) return true;
  return new Date(room.ends_at).getTime() > Date.now();
}

async function refreshRoomPool(
  supabase: ReturnType<typeof createClient>,
  room: RoomRow,
) {
  const topics = room.topic_tags ?? [];
  const bucket = new Map<string, ImportedProblemRow>();

  for (const topic of topics) {
    const topicSlug = toTopicSlug(topic);
    try {
      const problems = await fetchLeetCodeTopicProblems(topicSlug, 60);
      for (const problem of problems) {
        bucket.set(problem.slug, problem);
      }
    } catch (error) {
      console.warn(`Topic fetch failed for ${topicSlug}`, error);
    }
  }

  // Fallback to a curated pool so assignments can still be generated.
  if (bucket.size === 0) {
    for (const problem of FALLBACK_PROBLEMS) {
      const matchesTopic =
        topics.length === 0 ||
        problem.topics.some((problemTopic) => topics.includes(problemTopic));
      if (!matchesTopic) {
        continue;
      }

      bucket.set(problem.slug, {
        leetcode_problem_id: `fallback-${problem.slug}`,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        points: DIFFICULTY_POINTS[problem.difficulty],
        topics: problem.topics,
      });
    }

    if (bucket.size === 0) {
      for (const problem of FALLBACK_PROBLEMS) {
        bucket.set(problem.slug, {
          leetcode_problem_id: `fallback-${problem.slug}`,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          points: DIFFICULTY_POINTS[problem.difficulty],
          topics: problem.topics,
        });
      }
    }
  }

  const rows = Array.from(bucket.values()).map((problem) => ({
    room_id: room.id,
    leetcode_problem_id: problem.leetcode_problem_id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    points: problem.points,
    topics: problem.topics,
    is_active: true,
  }));

  if (rows.length === 0) return { imported: 0, skipped: true };

  const { error } = await supabase
    .from("room_problems")
    .upsert(rows, { onConflict: "room_id,slug" });
  if (error) throw error;

  return { imported: rows.length, skipped: false };
}

async function assignDailyProblems(
  supabase: ReturnType<typeof createClient>,
  room: RoomRow,
  assignDate: string,
) {
  const { data: existingAssignments, error: existingError } = await supabase
    .from("room_daily_assignments")
    .select("problem_id")
    .eq("room_id", room.id)
    .eq("assign_date", assignDate);
  if (existingError) throw existingError;

  if ((existingAssignments ?? []).length > 0) {
    return { assigned: 0, skipped: true };
  }

  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", room.id);
  if (membersError) throw membersError;

  const memberIds = (members ?? []).map((m) => (m as { user_id: string }).user_id);

  const { data: poolRows, error: poolError } = await supabase
    .from("room_problems")
    .select("id, slug, title, difficulty, points")
    .eq("room_id", room.id)
    .eq("is_active", true);
  if (poolError) throw poolError;

  const pool: PoolProblem[] = (poolRows ?? []) as PoolProblem[];
  if (pool.length === 0) {
    return { assigned: 0, skipped: false };
  }

  const { data: solvedRows, error: solvedError } = await supabase
    .from("user_room_problem_status")
    .select("problem_id, user_id")
    .eq("room_id", room.id)
    .not("solved_at", "is", null);
  if (solvedError) throw solvedError;

  const solvedCountByProblem = new Map<string, number>();
  for (const row of solvedRows ?? []) {
    const problemId = (row as { problem_id: string }).problem_id;
    solvedCountByProblem.set(problemId, (solvedCountByProblem.get(problemId) ?? 0) + 1);
  }

  const memberCount = Math.max(memberIds.length, 1);
  const requested: Record<Difficulty, number> = {
    EASY: room.daily_easy_count,
    MEDIUM: room.daily_medium_count,
    HARD: room.daily_hard_count,
  };

  const selected: PoolProblem[] = [];
  const selectedIds = new Set<string>();

  for (const difficulty of ["EASY", "MEDIUM", "HARD"] as const) {
    const need = requested[difficulty];
    if (need <= 0) continue;

    const difficultyPool = pool.filter((problem) => problem.difficulty === difficulty);
    const strictUnsolved = difficultyPool.filter(
      (problem) => (solvedCountByProblem.get(problem.id) ?? 0) === 0,
    );
    const pickedStrict = pickRandom(strictUnsolved, need);

    for (const item of pickedStrict) {
      selected.push(item);
      selectedIds.add(item.id);
    }

    const remaining = need - pickedStrict.length;
    if (remaining <= 0) continue;

    const fallbackCandidates = difficultyPool
      .filter((problem) => !selectedIds.has(problem.id))
      .filter((problem) => (solvedCountByProblem.get(problem.id) ?? 0) < memberCount)
      .sort(
        (a, b) =>
          (solvedCountByProblem.get(a.id) ?? 0) - (solvedCountByProblem.get(b.id) ?? 0),
      );

    for (const item of pickRandom(fallbackCandidates, remaining)) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  }

  if (selected.length === 0) {
    return { assigned: 0, skipped: false };
  }

  const rows = selected.map((problem) => ({
    room_id: room.id,
    assign_date: assignDate,
    problem_id: problem.id,
    difficulty: problem.difficulty,
  }));

  const { error: insertError } = await supabase
    .from("room_daily_assignments")
    .insert(rows);
  if (insertError) throw insertError;

  return { assigned: rows.length, skipped: false };
}

async function syncSolvedAndLeaderboard(
  supabase: ReturnType<typeof createClient>,
  room: RoomRow,
  assignDate: string,
) {
  const { data: assignments, error: assignmentError } = await supabase
    .from("room_daily_assignments")
    .select("problem_id, room_problems(slug, points)")
    .eq("room_id", room.id)
    .eq("assign_date", assignDate);
  if (assignmentError) throw assignmentError;

  if ((assignments ?? []).length === 0) {
    return { solvedUpdates: 0 };
  }

  const assignmentBySlug = new Map<string, { problemId: string; points: number }>();
  for (const row of assignments ?? []) {
    const typed = row as {
      problem_id: string;
      room_problems: { slug: string; points: number } | null;
    };
    if (!typed.room_problems) continue;
    assignmentBySlug.set(typed.room_problems.slug, {
      problemId: typed.problem_id,
      points: typed.room_problems.points,
    });
  }

  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", room.id);
  if (membersError) throw membersError;

  let solvedUpdates = 0;
  for (const member of members ?? []) {
    const userId = (member as { user_id: string }).user_id;
    const { data: profile, error: profileError } = await supabase
      .from("user_leetcode_profiles")
      .select("username")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      continue;
    }

    const recentSolved = await fetchRecentAcceptedSlugs(
      (profile as { username: string }).username,
      250,
    );

    for (const solved of recentSolved) {
      const assignment = assignmentBySlug.get(solved.slug);
      if (!assignment) continue;

      const { error: statusError } = await supabase
        .from("user_room_problem_status")
        .upsert(
          {
            room_id: room.id,
            user_id: userId,
            problem_id: assignment.problemId,
            assigned_date: assignDate,
            solved_at: solved.solvedAt,
            points_awarded: assignment.points,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "room_id,user_id,problem_id,assigned_date" },
        );

      if (!statusError) {
        solvedUpdates += 1;
      }
    }

    const { error: profileUpdateError } = await supabase
      .from("user_leetcode_profiles")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.warn("Profile sync timestamp update failed", profileUpdateError.message);
    }
  }

  const { data: scoreRows, error: scoreError } = await supabase
    .from("user_room_problem_status")
    .select("user_id, points_awarded")
    .eq("room_id", room.id)
    .not("solved_at", "is", null);
  if (scoreError) throw scoreError;

  const totals = new Map<string, { totalPoints: number; solvedCount: number }>();
  for (const row of scoreRows ?? []) {
    const userId = (row as { user_id: string }).user_id;
    const points = (row as { points_awarded: number }).points_awarded ?? 0;
    const current = totals.get(userId) ?? { totalPoints: 0, solvedCount: 0 };
    current.totalPoints += points;
    current.solvedCount += 1;
    totals.set(userId, current);
  }

  const leaderboardRows = Array.from(totals.entries()).map(([userId, value]) => ({
    room_id: room.id,
    user_id: userId,
    total_points: value.totalPoints,
    solved_count: value.solvedCount,
    updated_at: new Date().toISOString(),
  }));

  if (leaderboardRows.length > 0) {
    const { error: leaderboardError } = await supabase
      .from("room_leaderboard_cache")
      .upsert(leaderboardRows, { onConflict: "room_id,user_id" });
    if (leaderboardError) throw leaderboardError;
  }

  return { solvedUpdates };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode ?? "run-daily");
    const requestedRoomId = body?.roomId ? String(body.roomId) : null;
    const assignDate = body?.assignDate
      ? String(body.assignDate)
      : new Date().toISOString().slice(0, 10);

    if (mode === "total-count") {
      const totalQuestions = await fetchLeetCodeTotalQuestionCount();
      return new Response(JSON.stringify({ mode, totalQuestions }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      });
    }

    const roomsQuery = supabase
      .from("rooms")
      .select(
        "id, owner_id, status, topic_tags, ends_at, daily_easy_count, daily_medium_count, daily_hard_count",
      )
      .eq("status", "ACTIVE");

    const { data: roomRows, error: roomsError } = requestedRoomId
      ? await roomsQuery.eq("id", requestedRoomId)
      : await roomsQuery;
    if (roomsError) throw roomsError;

    const rooms = ((roomRows ?? []) as RoomRow[]).filter(isRoomActive);
    const summary = {
      mode,
      assignDate,
      processedRooms: rooms.length,
      importedProblems: 0,
      assignedProblems: 0,
      solvedUpdates: 0,
      skippedRooms: 0,
    };

    for (const room of rooms) {
      try {
        if (mode === "refresh-pool" || mode === "run-daily") {
          const result = await refreshRoomPool(supabase, room);
          summary.importedProblems += result.imported;
        }

        if (mode === "assign-only" || mode === "run-daily") {
          const result = await assignDailyProblems(supabase, room, assignDate);
          summary.assignedProblems += result.assigned;
        }

        if (mode === "sync-only" || mode === "run-daily") {
          const result = await syncSolvedAndLeaderboard(supabase, room, assignDate);
          summary.solvedUpdates += result.solvedUpdates;
        }
      } catch (roomError) {
        summary.skippedRooms += 1;
        console.error(`Room ${room.id} failed`, roomError);
      }
    }

    return new Response(JSON.stringify(summary), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});
