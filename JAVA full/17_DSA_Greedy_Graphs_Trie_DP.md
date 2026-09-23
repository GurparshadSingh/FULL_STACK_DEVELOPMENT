# 17. DSA: Greedy, Graphs, Trie, Dynamic Programming 🔥🔥🔥🔥

---

## PART A — GREEDY

### 17.1 When Does Greedy Actually Work? (the theory question behind every greedy problem)
A greedy algorithm makes the **locally optimal choice at each step**, hoping it leads to a globally optimal solution. This only works when the problem has:
1. **Greedy choice property** — a locally optimal choice can always be extended to a globally optimal solution (no need to reconsider past choices).
2. **Optimal substructure** — an optimal solution to the whole problem contains optimal solutions to its subproblems.
**How to justify greedy correctness in an interview (the "exchange argument"):** show that any optimal solution can be transformed into the greedy solution, step by step, WITHOUT making it worse — implying the greedy solution is at least as good as any alternative optimum.

### 17.2 Activity Selection / Interval Scheduling — the canonical greedy problem
```java
static int maxActivities(int[][] intervals) {                            // intervals[i] = {start, end}
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));        // ⭐ sort by END time, NOT start time!
    int count = 1, lastEnd = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= lastEnd) {                                  // this activity starts after the last one ended
            count++;
            lastEnd = intervals[i][1];
        }
    }
    return count;
}
```
**Why sort by END time (not start time) — this exact detail is what interviewers probe:** picking the activity that finishes EARLIEST always leaves the most remaining room for future activities — sorting by start time doesn't give this guarantee (an early-starting activity could still run very long, blocking many others).

### 17.3 Jump Game — greedy reachability
```java
static boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;                 // current index is UNREACHABLE — no path could ever get here
        maxReach = Math.max(maxReach, i + nums[i]);       // greedily track the FARTHEST index reachable so far
    }
    return true;
}
```

---

## PART B — GRAPHS

### 17.4 Representation — Adjacency List vs Matrix
```java
// Adjacency LIST (preferred for SPARSE graphs — most interview graphs) — O(V + E) space
List<List<Integer>> adjList = new ArrayList<>();
for (int i = 0; i < n; i++) adjList.add(new ArrayList<>());
adjList.get(u).add(v);                                    // add edge u -> v (add both directions for undirected)

// Adjacency MATRIX (preferred for DENSE graphs, or when O(1) "are u and v connected" lookups matter) — O(V^2) space
int[][] adjMatrix = new int[n][n];
adjMatrix[u][v] = 1;
```
**Trade-off to state explicitly:** adjacency list is O(V+E) space and efficient to iterate a node's neighbors; adjacency matrix is O(V²) space but gives O(1) edge-existence checks — for most interview-scale sparse graphs (E << V²), **adjacency list is the default correct choice**.

### 17.5 BFS (Breadth-First Search) — shortest path in UNWEIGHTED graphs
```java
static int[] bfs(int start, List<List<Integer>> adjList, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    dist[start] = 0;
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : adjList.get(node)) {
            if (dist[neighbor] == -1) {                   // not yet visited
                dist[neighbor] = dist[node] + 1;
                queue.offer(neighbor);
            }
        }
    }
    return dist;
}
```
**Why BFS gives shortest paths in unweighted graphs:** BFS explores nodes in strictly increasing order of distance from the source (processing all nodes at distance `d` before any at distance `d+1`) — the FIRST time a node is reached is guaranteed to be via a shortest path.

### 17.6 DFS (Depth-First Search) — recursive and iterative
```java
static void dfsRecursive(int node, List<List<Integer>> adjList, boolean[] visited) {
    visited[node] = true;
    // process node
    for (int neighbor : adjList.get(node)) {
        if (!visited[neighbor]) dfsRecursive(neighbor, adjList, visited);
    }
}
static void dfsIterative(int start, List<List<Integer>> adjList, boolean[] visited) {
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited[node]) continue;                       // ⚠ mark-on-POP (not on-push) can push duplicates — must re-check here!
        visited[node] = true;
        for (int neighbor : adjList.get(node)) {
            if (!visited[neighbor]) stack.push(neighbor);
        }
    }
}
```
**BFS vs DFS — when to use which:** BFS for shortest-path/level-based problems in unweighted graphs; DFS for exhaustive exploration, cycle detection, topological sort, and connected-components — DFS also naturally maps onto the recursive call stack, which is why it's often shorter to write recursively (at the cost of stack-depth risk on very deep/large graphs — see file 03's StackOverflow discussion).

### 17.7 Cycle Detection

**Undirected graph** — a visited neighbor that ISN'T the immediate parent means a cycle:
```java
static boolean hasCycleUndirected(int node, int parent, List<List<Integer>> adjList, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : adjList.get(node)) {
        if (!visited[neighbor]) {
            if (hasCycleUndirected(neighbor, node, adjList, visited)) return true;
        } else if (neighbor != parent) {                     // visited AND not where we just came from -> cycle!
            return true;
        }
    }
    return false;
}
```
**Directed graph** — needs a THREE-color scheme (visited alone isn't enough, since revisiting a node via a DIFFERENT path is normal in a DAG, not necessarily a cycle):
```java
static boolean hasCycleDirected(int node, int[] state, List<List<Integer>> adjList) {
    // state: 0 = unvisited, 1 = IN PROGRESS (currently on the recursion stack), 2 = fully done
    state[node] = 1;
    for (int neighbor : adjList.get(node)) {
        if (state[neighbor] == 1) return true;               // hit a node CURRENTLY on the stack -> back edge -> CYCLE
        if (state[neighbor] == 0 && hasCycleDirected(neighbor, state, adjList)) return true;
    }
    state[node] = 2;
    return false;
}
```
**Why directed cycle detection needs 3 states, not just boolean visited:** in a DAG, a node can be legitimately reached via two different paths (no cycle) — what specifically indicates a cycle is reaching a node that's **currently on the active recursion stack** (state 1), not merely "visited at some point in the past" (state 2).

### 17.8 Topological Sort — only valid for DAGs (Directed Acyclic Graphs)

**Kahn's Algorithm (BFS-based, using in-degrees):**
```java
static List<Integer> topoSortKahn(int n, List<List<Integer>> adjList) {
    int[] inDegree = new int[n];
    for (List<Integer> neighbors : adjList) for (int v : neighbors) inDegree[v]++;
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++) if (inDegree[i] == 0) queue.offer(i);    // start with all "no prerequisite" nodes
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : adjList.get(node)) {
            if (--inDegree[neighbor] == 0) queue.offer(neighbor);          // this neighbor's LAST prerequisite is satisfied
        }
    }
    return order.size() == n ? order : new ArrayList<>();    // if fewer than n nodes processed -> a CYCLE exists (no valid topo order)
}
```
**The cycle-detection side-benefit is genuinely important to mention:** `order.size() < n` after the algorithm finishes is a reliable, elegant way to detect that the graph contains a cycle (some nodes' in-degrees never reached 0 because they were mutually dependent).

**DFS-based alternative:** perform DFS, and prepend each node to the result the moment its DFS call FINISHES (post-order) — reversing this post-order gives a valid topological order (works because a node's dependencies always finish their DFS calls before the node itself does).

### 17.9 Dijkstra's Algorithm — shortest path in WEIGHTED graphs (non-negative weights only)
```java
static int[] dijkstra(int start, List<List<int[]>> adjList, int n) {   // adjList.get(u) = List of {neighbor, weight}
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);  // {node, distance}, ordered by distance
    pq.offer(new int[]{start, 0});
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int node = curr[0], d = curr[1];
        if (d > dist[node]) continue;                       // STALE entry (a shorter path to `node` was already found and processed) — skip
        for (int[] edge : adjList.get(node)) {
            int neighbor = edge[0], weight = edge[1];
            if (dist[node] + weight < dist[neighbor]) {         // RELAX the edge
                dist[neighbor] = dist[node] + weight;
                pq.offer(new int[]{neighbor, dist[neighbor]});
            }
        }
    }
    return dist;
}
```
**Why Dijkstra fails with negative edge weights:** it greedily "finalizes" a node's shortest distance the first time it's popped from the priority queue with the smallest tentative distance, assuming no future path could ever improve it — a NEGATIVE edge encountered later could violate that assumption, giving an incorrect result. **Bellman-Ford** (below) is the correct choice when negative weights are possible.
**The `if (d > dist[node]) continue;` line is the "lazy deletion" pattern** — since Java's `PriorityQueue` has no efficient "decrease-key" operation, stale/outdated entries are simply left in the heap and skipped when popped, rather than removed proactively. **Complexity: O(E log V)** with a binary heap.

### 17.10 Bellman-Ford — handles negative weights, detects negative cycles
```java
static int[] bellmanFord(int start, int[][] edges, int n) {    // edges[i] = {u, v, weight}
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;
    for (int i = 0; i < n - 1; i++) {                            // relax ALL edges, n-1 times — the mathematically proven bound
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) dist[v] = dist[u] + w;
        }
    }
    for (int[] edge : edges) {                                    // one MORE pass to detect a negative cycle
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            throw new IllegalStateException("Graph contains a negative-weight cycle");
        }
    }
    return dist;
}
```
**Why exactly `n-1` relaxation rounds:** the shortest path between any two nodes in a graph with `n` nodes uses AT MOST `n-1` edges (a simple path can't revisit a node without forming a cycle) — so `n-1` rounds of relaxing every edge is guaranteed to have propagated the correct shortest distances everywhere, ASSUMING no negative cycle exists. **Complexity: O(V·E)** — slower than Dijkstra, but strictly more general.

### 17.11 Minimum Spanning Tree — Prim's & Kruskal's

**Kruskal's (edge-based, uses Union-Find/Disjoint Set):**
```java
static int kruskalMST(int n, int[][] edges) {          // edges[i] = {u, v, weight}
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);            // sort ALL edges by weight, ascending
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int totalWeight = 0, edgesUsed = 0;
    for (int[] edge : edges) {
        int u = find(parent, edge[0]), v = find(parent, edge[1]);
        if (u != v) {                                       // adding this edge would NOT form a cycle
            union(parent, u, v);
            totalWeight += edge[2];
            edgesUsed++;
            if (edgesUsed == n - 1) break;                    // an MST always has exactly n-1 edges — can stop early
        }
    }
    return totalWeight;
}
static int find(int[] parent, int x) {
    if (parent[x] != x) parent[x] = find(parent, parent[x]);  // PATH COMPRESSION — flattens the tree for future O(~1) lookups
    return parent[x];
}
static void union(int[] parent, int a, int b) { parent[find(parent, a)] = find(parent, b); }
```
**The Union-Find (Disjoint Set Union) structure is worth explaining on its own merits:** `find` answers "which connected component does this node belong to," and `union` merges two components — with **path compression** (as shown) and (ideally also) **union by rank/size**, both operations run in amortized **O(α(n))** time — practically constant for any realistic input size (`α` is the inverse Ackermann function, which grows so slowly it's ≤4 for any conceivable real-world `n`).

**Prim's (node-based, similar structure to Dijkstra using a priority queue)** — grows the MST one node at a time, always adding the cheapest edge that connects a NEW node to the existing tree; conceptually a close cousin of Dijkstra but tracking "cheapest edge to reach this node" instead of "cheapest total path to this node."

**Kruskal's vs Prim's — which to mention when:** Kruskal's is usually simpler to implement and preferred for sparse graphs (sorting edges is the bottleneck, O(E log E)); Prim's (with a heap) is often preferred for dense graphs.

---

## PART C — TRIE (Prefix Tree)

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];    // one slot per lowercase letter (use a HashMap<Character,TrieNode> for a wider alphabet)
    boolean isEndOfWord = false;
}
class Trie {
    private TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) node.children[idx] = new TrieNode();
            node = node.children[idx];
        }
        node.isEndOfWord = true;                  // mark the END of the actual inserted word (not just any prefix!)
    }
    boolean search(String word) {                  // exact word match
        TrieNode node = traverse(word);
        return node != null && node.isEndOfWord;    // must ALSO be a marked end-of-word, not just any valid prefix path
    }
    boolean startsWith(String prefix) {             // prefix-only match
        return traverse(prefix) != null;
    }
    private TrieNode traverse(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return null;
            node = node.children[idx];
        }
        return node;
    }
}
```
**Why `search()` and `startsWith()` must be implemented differently:** reaching the last character of a string via valid child pointers only proves that string is a **prefix** of SOMETHING inserted — the `isEndOfWord` flag is what distinguishes "this exact word was inserted" from "this is merely a prefix of a longer inserted word." Forgetting this distinction is the #1 Trie bug.
**Complexity:** insert/search/startsWith are all O(L) where L is the word/prefix length — **independent of how many words are stored**, which is the entire point of a Trie over, say, a `HashSet<String>` (which is O(L) average too for hashing, but a Trie shines for prefix-based queries like autocomplete, which a HashSet cannot do efficiently at all).

---

## PART D — DYNAMIC PROGRAMMING

### 17.12 The Core Idea & Two Implementation Styles

DP applies when a problem has **overlapping subproblems** (the same subproblem is solved multiple times in a naive recursive approach — see file 03's Fibonacci example) AND **optimal substructure** (an optimal solution can be built from optimal solutions to subproblems).

```java
// TOP-DOWN (Memoization) — write the natural recursion, add a cache
static int fib(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}
// BOTTOM-UP (Tabulation) — build the answer iteratively from the base cases upward
static int fibBottomUp(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```
**Top-down vs bottom-up trade-off to state explicitly:** top-down is often more natural to derive (write the brute-force recursion first, then add memoization) and only computes states actually needed; bottom-up avoids recursion-stack overhead/depth risk entirely and is often easier to further optimize for SPACE (see below).

### 17.13 0/1 Knapsack — the template for a huge family of DP problems
```java
static int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];       // dp[i][c] = max value using the first i items, capacity c
    for (int i = 1; i <= n; i++) {
        for (int c = 0; c <= capacity; c++) {
            dp[i][c] = dp[i - 1][c];                    // OPTION 1: don't take item i-1
            if (weights[i - 1] <= c) {
                dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);  // OPTION 2: take it
            }
        }
    }
    return dp[n][capacity];
}
```
**Space optimization (a very common interview follow-up):** since `dp[i][...]` only depends on `dp[i-1][...]`, you can collapse the 2D array to a **1D array**, iterating the capacity dimension **backward** (`c` from `capacity` down to `weights[i-1]`) to avoid a single item being counted more than once within the same iteration (which is exactly what distinguishes 0/1 knapsack's backward iteration from the UNBOUNDED knapsack/coin-change-with-repetition problem's FORWARD iteration).

### 17.14 Longest Common Subsequence (LCS)
```java
static int lcs(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];              // dp[i][j] = LCS length of a[0..i) and b[0..j)
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = 1 + dp[i - 1][j - 1];   // characters match -> extend diagonally
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);                        // no match -> best of dropping one char from either string
        }
    }
    return dp[n][m];
}
```

### 17.15 Longest Increasing Subsequence (LIS) — O(n²) DP and the O(n log n) upgrade
```java
// O(n^2) DP version
static int lengthOfLIS(int[] nums) {
    int[] dp = new int[nums.length];
    Arrays.fill(dp, 1);                                // every element is, at minimum, an LIS of length 1 (itself)
    int maxLen = 1;
    for (int i = 1; i < nums.length; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
        maxLen = Math.max(maxLen, dp[i]);
    }
    return maxLen;
}
// O(n log n) version — maintains a "tails" array + binary search (patience sorting insight)
static int lengthOfLISOptimized(int[] nums) {
    int[] tails = new int[nums.length];                 // tails[k] = smallest possible TAIL VALUE of an increasing subsequence of length k+1
    int size = 0;
    for (int n : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {                                  // binary search for the first tail >= n
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] < n) lo = mid + 1; else hi = mid;
        }
        tails[lo] = n;
        if (lo == size) size++;
    }
    return size;
}
```
**Why the O(n log n) `tails` array works (the genuinely tricky insight to articulate):** `tails` doesn't represent an ACTUAL subsequence — it tracks, for each possible LENGTH, the SMALLEST tail value achievable — keeping tail values as small as possible always maximizes future extension opportunities, which is exactly why binary-searching for "the first tail ≥ current number" and overwriting it (rather than always appending) is correct.

### 17.16 Coin Change (Minimum Coins) — Unbounded knapsack variant
```java
static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);                          // "infinity" sentinel — amount+1 is always an impossible/worse answer
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];         // still "infinity" -> genuinely unreachable
}
```
**Why coins can be reused (contrast with 0/1 Knapsack):** the inner loop iterates `dp[i]` FORWARD, referencing `dp[i - coin]` which may have already been updated using the SAME coin in this same outer pass — allowing that coin's unlimited reuse, unlike 0/1 knapsack's careful backward iteration that explicitly prevents reuse.

### 17.17 Edit Distance (Levenshtein Distance)
```java
static int editDistance(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i;             // base case: deleting all of `a`'s first i chars to reach an empty string
    for (int j = 0; j <= m; j++) dp[0][j] = j;             // base case: inserting all of `b`'s first j chars into an empty string
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];       // chars match -> no operation needed here
            else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],   // REPLACE
                                  Math.min(dp[i - 1][j],       // DELETE (from a)
                                           dp[i][j - 1]));      // INSERT (into a)
        }
    }
    return dp[n][m];
}
```
**Interview tip:** always explicitly draw/state the base cases (row 0 and column 0) — they represent "transforming an empty string into the other" and are the most commonly fumbled part of this problem when whiteboarding it live.

---

## 🚩 Common Traps Recap (Phase 17)

1. Activity selection greedy MUST sort by end time, not start time — a common, subtly-wrong first instinct.
2. Dijkstra fails silently (produces wrong answers, doesn't crash) with negative edge weights — use Bellman-Ford instead.
3. Directed-graph cycle detection needs a 3-state scheme (unvisited/in-progress/done); undirected only needs 2 states + parent-tracking.
4. Topological sort only exists for DAGs — Kahn's algorithm's `order.size() < n` is a clean way to detect the graph wasn't actually acyclic.
5. Trie's `search()` must check `isEndOfWord`, not just that the traversal path exists — a prefix path existing doesn't mean that exact word was inserted.
6. 0/1 Knapsack (each item once) iterates capacity BACKWARD when space-optimized to 1D; unbounded/coin-change problems iterate FORWARD to intentionally allow reuse.
7. LIS's O(n log n) `tails` array does not represent a real subsequence — it's a bookkeeping structure of best-possible tail values per length.
8. Edit Distance's base-case rows/columns represent transforming to/from an empty string — the most commonly skipped/incorrect part when deriving the recurrence live.

## ❓ Rapid-Fire Q&A

**Q: Why must Dijkstra's algorithm avoid negative edge weights?**
A: Dijkstra permanently finalizes a node's shortest distance the moment it's popped from the priority queue with the current minimum tentative distance, assuming no future relaxation could improve it — a negative edge discovered later could violate that assumption and produce an incorrect (too large) final distance.

**Q: What's the time complexity of Union-Find operations with path compression and union by rank?**
A: Amortized O(α(n)) per operation, where α is the inverse Ackermann function — effectively constant for any realistic input size.

**Q: Why does a Trie beat a HashSet<String> for autocomplete-style prefix queries?**
A: A HashSet can only answer "does this exact string exist" in O(L) — it has no efficient way to enumerate/check all strings sharing a given prefix, since hashing destroys any notion of string ordering/structure. A Trie's structure directly mirrors shared prefixes, letting you navigate to a prefix's node in O(L) and then enumerate everything below it.

**Q: How do you convert an O(n²) DP solution using a 2D array into an O(n) space solution?**
A: If `dp[i][...]` only ever depends on the immediately preceding row `dp[i-1][...]` (not older rows), you can collapse the array to 1D — but you must carefully choose the iteration direction (forward vs backward) to correctly avoid or allow accidentally reading an already-updated-this-pass value, depending on whether reuse within the same pass should be allowed (see Knapsack vs Coin Change above).

**Q: When would you prefer Bellman-Ford over Dijkstra despite it being slower?**
A: Whenever the graph might contain negative edge weights (Dijkstra is unsafe there), or when you specifically need to detect the presence of a negative-weight cycle, which Bellman-Ford can do directly via one extra relaxation pass.
