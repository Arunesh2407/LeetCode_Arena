import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sample LeetCode problems pool for MVP (since the LeetCode API is unofficial and rate-limited)
const PROBLEM_POOL = [
  { leetcode_id: 1, title: "1. Two Sum", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/", topics: ["Arrays", "Hash Table"] },
  { leetcode_id: 167, title: "167. Two Sum II", difficulty: "Medium", url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", topics: ["Arrays", "Two Pointers"] },
  { leetcode_id: 15, title: "15. 3Sum", difficulty: "Medium", url: "https://leetcode.com/problems/3sum/", topics: ["Arrays", "Two Pointers", "Sorting"] },
  { leetcode_id: 20, title: "20. Valid Parentheses", difficulty: "Easy", url: "https://leetcode.com/problems/valid-parentheses/", topics: ["Strings", "Stack"] },
  { leetcode_id: 21, title: "21. Merge Two Sorted Lists", difficulty: "Easy", url: "https://leetcode.com/problems/merge-two-sorted-lists/", topics: ["Linked List", "Recursion"] },
  { leetcode_id: 53, title: "53. Maximum Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/", topics: ["Arrays", "Dynamic Programming"] },
  { leetcode_id: 70, title: "70. Climbing Stairs", difficulty: "Easy", url: "https://leetcode.com/problems/climbing-stairs/", topics: ["Dynamic Programming", "Math"] },
  { leetcode_id: 121, title: "121. Best Time to Buy and Sell Stock", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", topics: ["Arrays", "Dynamic Programming"] },
  { leetcode_id: 200, title: "200. Number of Islands", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/", topics: ["Arrays", "BFS", "DFS"] },
  { leetcode_id: 206, title: "206. Reverse Linked List", difficulty: "Easy", url: "https://leetcode.com/problems/reverse-linked-list/", topics: ["Linked List", "Recursion"] },
  { leetcode_id: 3, title: "3. Longest Substring Without Repeating Characters", difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", topics: ["Strings", "Sliding Window", "Hash Table"] },
  { leetcode_id: 49, title: "49. Group Anagrams", difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/", topics: ["Strings", "Hash Table", "Sorting"] },
  { leetcode_id: 56, title: "56. Merge Intervals", difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/", topics: ["Arrays", "Sorting"] },
  { leetcode_id: 76, title: "76. Minimum Window Substring", difficulty: "Hard", url: "https://leetcode.com/problems/minimum-window-substring/", topics: ["Strings", "Sliding Window", "Hash Table"] },
  { leetcode_id: 128, title: "128. Longest Consecutive Sequence", difficulty: "Medium", url: "https://leetcode.com/problems/longest-consecutive-sequence/", topics: ["Arrays", "Hash Table"] },
  { leetcode_id: 235, title: "235. Lowest Common Ancestor of a BST", difficulty: "Medium", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", topics: ["Binary Search Tree", "DFS"] },
  { leetcode_id: 238, title: "238. Product of Array Except Self", difficulty: "Medium", url: "https://leetcode.com/problems/product-of-array-except-self/", topics: ["Arrays", "Prefix Sum"] },
  { leetcode_id: 242, title: "242. Valid Anagram", difficulty: "Easy", url: "https://leetcode.com/problems/valid-anagram/", topics: ["Strings", "Hash Table", "Sorting"] },
  { leetcode_id: 347, title: "347. Top K Frequent Elements", difficulty: "Medium", url: "https://leetcode.com/problems/top-k-frequent-elements/", topics: ["Arrays", "Hash Table", "Heap"] },
  { leetcode_id: 11, title: "11. Container With Most Water", difficulty: "Medium", url: "https://leetcode.com/problems/container-with-most-water/", topics: ["Arrays", "Two Pointers", "Greedy"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { room_id } = await req.json();
    if (!room_id) {
      return new Response(JSON.stringify({ error: "room_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify host
    const { data: room } = await supabase.from("rooms").select("*").eq("id", room_id).single();
    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (room.host_user_id !== userId) {
      return new Response(JSON.stringify({ error: "Only host can start" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pick a random problem from the pool
    const picked = PROBLEM_POOL[Math.floor(Math.random() * PROBLEM_POOL.length)];

    // Use service role to insert problem and update room
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Insert problem
    const { error: probError } = await serviceClient.from("room_problems").insert({
      room_id,
      leetcode_id: picked.leetcode_id,
      title: picked.title,
      difficulty: picked.difficulty,
      url: picked.url,
      topics: picked.topics,
    });
    if (probError) throw probError;

    // Update room status
    const { error: roomError } = await serviceClient.from("rooms").update({ status: "in_progress" }).eq("id", room_id);
    if (roomError) throw roomError;

    // Set all participants to coding
    const { error: partError } = await serviceClient.from("room_participants").update({ status: "coding" }).eq("room_id", room_id);
    if (partError) throw partError;

    return new Response(JSON.stringify({ success: true, title: picked.title, url: picked.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
