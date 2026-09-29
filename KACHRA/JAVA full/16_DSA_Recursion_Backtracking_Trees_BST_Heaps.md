# 16. DSA: Recursion, Backtracking, Trees, BST, Heaps 🔥🔥🔥🔥

---

## PART A — BACKTRACKING (builds on file 03 §3.11–3.12)

### 16.1 The Universal Backtracking Template
```java
void backtrack(/* state */) {
    if (/* base case: a complete solution is built */) {
        result.add(new ArrayList<>(current));    // ALWAYS copy — see file 03 §3.11 for why
        return;
    }
    for (/* each choice available at this step */) {
        // 1. MAKE the choice
        current.add(choice);
        // 2. RECURSE deeper
        backtrack(/* updated state */);
        // 3. UNDO the choice (backtrack!)
        current.remove(current.size() - 1);
    }
}
```

### 16.2 N-Queens — the classic constraint-satisfaction backtracking problem
```java
static List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queenCol = new int[n];                        // queenCol[row] = column of the queen placed in that row
    backtrack(0, n, queenCol, result);
    return result;
}
static void backtrack(int row, int n, int[] queenCol, List<List<String>> result) {
    if (row == n) { result.add(buildBoard(queenCol, n)); return; }
    for (int col = 0; col < n; col++) {
        if (isValid(queenCol, row, col)) {
            queenCol[row] = col;                          // place
            backtrack(row + 1, n, queenCol, result);        // recurse to the next row
            // no explicit "undo" needed here — queenCol[row] is simply OVERWRITTEN on the next loop iteration
        }
    }
}
static boolean isValid(int[] queenCol, int row, int col) {
    for (int r = 0; r < row; r++) {
        int c = queenCol[r];
        if (c == col) return false;                        // same column
        if (Math.abs(c - col) == Math.abs(r - row)) return false;  // same diagonal (row-diff equals col-diff)
    }
    return true;
}
```
**Note the "no explicit undo" subtlety:** because `queenCol[row]` is a fixed-size array indexed by `row`, placing a NEW queen in the same row on the next loop iteration naturally overwrites the old one — there's nothing to manually "remove." This is a good example of how the backtracking template's exact "undo" step varies depending on how you represent state (array-overwrite vs. list-append/remove).

### 16.3 Combination Sum — handling "reuse allowed" vs "no reuse" vs "no duplicates in output"
```java
// Elements CAN be reused unlimited times (e.g. coin change combinations)
static void combinationSum(int[] candidates, int target, int start, List<Integer> current, List<List<Integer>> result) {
    if (target == 0) { result.add(new ArrayList<>(current)); return; }
    if (target < 0) return;                                  // prune — this branch can never succeed
    for (int i = start; i < candidates.length; i++) {
        current.add(candidates[i]);
        combinationSum(candidates, target - candidates[i], i, current, result);   // pass `i`, NOT `i+1` -> allows reuse of candidates[i]
        current.remove(current.size() - 1);
    }
}
```
**The single line that controls everything:** passing `i` (allows reusing the current element again) vs. `i + 1` (each element used at most once) vs. sorting the input + adding an `if (i > start && candidates[i] == candidates[i-1]) continue;` skip-duplicates guard (for "no duplicate combinations in the output, given a candidates array WITH duplicate values") — these three small variations cover almost the entire "combination sum" family of interview questions.

### 16.4 Pruning — why it matters for performance, not just correctness
```java
if (target < 0) return;     // EARLY EXIT — stops exploring a doomed branch immediately instead of recursing all the way down
```
Sorting candidates first (`Arrays.sort(candidates)`) lets you `break` (not just `continue`) out of a loop early once `candidates[i] > remainingTarget`, since everything after it is even larger — a genuinely important optimization to mention, turning a potentially-huge search tree into a much smaller pruned one.

---

## PART B — BINARY TREES

### 16.5 Node Definition & The Three DFS Traversals
```java
class TreeNode { int val; TreeNode left, right; TreeNode(int val) { this.val = val; } }

// PRE-order: Root -> Left -> Right   (use when you need to process the parent BEFORE its children, e.g. copying a tree)
static void preorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    result.add(node.val);
    preorder(node.left, result);
    preorder(node.right, result);
}
// IN-order: Left -> Root -> Right    (gives SORTED order for a valid BST — this is THE key property to remember)
static void inorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    inorder(node.left, result);
    result.add(node.val);
    inorder(node.right, result);
}
// POST-order: Left -> Right -> Root  (use when children must be fully processed BEFORE the parent, e.g. deleting a tree, computing subtree sizes)
static void postorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    postorder(node.left, result);
    postorder(node.right, result);
    result.add(node.val);
}
```
**The base case `if (node == null) return;` is what makes recursive tree code so short** — you never need to explicitly check "does this node have a left child" before recursing; the null check at the TOP of the next call handles it uniformly.

### Iterative traversal (using an explicit Stack — asked as a follow-up to test if you understand WHY recursion works)
```java
static List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);
        if (node.right != null) stack.push(node.right);    // push RIGHT first...
        if (node.left != null) stack.push(node.left);       // ...so LEFT is popped and processed FIRST (LIFO)
    }
    return result;
}
```
**Why right is pushed before left:** a stack is LIFO — to visit LEFT before RIGHT (as pre-order requires), the left child must be the LAST thing pushed so it's the FIRST thing popped.

**In-order iterative is trickier** (requires tracking "have I gone as far left as possible yet"):
```java
static List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }   // go all the way left, pushing every node along the way
        curr = stack.pop();                                              // backtrack to the last unprocessed ancestor
        result.add(curr.val);
        curr = curr.right;                                                // then explore its right subtree
    }
    return result;
}
```

### 16.6 Common Tree Properties (recursive "combine children's answers" pattern)
```java
static int height(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(height(node.left), height(node.right));
}
static boolean isBalanced(TreeNode node) {
    return checkHeight(node) != -1;
}
static int checkHeight(TreeNode node) {                       // returns -1 as a SENTINEL to signal "already unbalanced" — avoids
    if (node == null) return 0;                                 // recomputing height repeatedly (a naive version is O(n^2)!)
    int left = checkHeight(node.left);
    if (left == -1) return -1;
    int right = checkHeight(node.right);
    if (right == -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
}
```
**Why the sentinel `-1` trick matters:** a naive "isBalanced" that calls a separate `height()` function at every node is O(n²) worst case (recomputing subtree heights repeatedly for a skewed tree); folding the height computation AND the balance check into ONE traversal, short-circuiting with a sentinel value the moment imbalance is found anywhere below, brings it down to O(n) — a genuinely important optimization interviewers specifically probe for.

**Diameter of a binary tree (longest path between any two nodes, not necessarily through the root):**
```java
static int diameter = 0;
static int diameterOfBinaryTree(TreeNode root) {
    depth(root);
    return diameter;
}
static int depth(TreeNode node) {
    if (node == null) return 0;
    int left = depth(node.left), right = depth(node.right);
    diameter = Math.max(diameter, left + right);       // update the GLOBAL answer using a SIDE EFFECT during the recursion
    return 1 + Math.max(left, right);                    // but RETURN just the depth, for the parent's own calculation
}
```
**The pattern to recognize:** "the answer isn't necessarily what gets returned/passed up the recursion" — here, the returned value (depth) and the tracked answer (diameter, via a side-effecting global/instance variable) are DIFFERENT things, computed together in one pass. This exact "return one thing, but ALSO track a separate running global answer" shape recurs in many tree problems (e.g., max path sum).

---

## PART C — BINARY SEARCH TREES (BST)

### 16.7 The BST Invariant
For every node: **all values in the left subtree < node's value < all values in the right subtree** (recursively, for EVERY node, not just the immediate children — a common misunderstanding).

### 16.8 Validate BST — the classic "wrong first attempt" question
```java
// ❌ WRONG — only checks IMMEDIATE children, misses violations further down the tree
static boolean isValidBSTWrong(TreeNode node) {
    if (node == null) return true;
    if (node.left != null && node.left.val >= node.val) return false;
    if (node.right != null && node.right.val <= node.val) return false;
    return isValidBSTWrong(node.left) && isValidBSTWrong(node.right);
}
// This WRONGLY accepts a tree where a left-subtree's RIGHT grandchild is greater than the ROOT (violates the global rule)!

// ✅ CORRECT — pass down a valid (min, max) RANGE that tightens at every level
static boolean isValidBST(TreeNode node, Long min, Long max) {
    if (node == null) return true;
    if ((min != null && node.val <= min) || (max != null && node.val >= max)) return false;
    return isValidBST(node.left, min, (long) node.val) &&   // left subtree's upper bound tightens to node.val
           isValidBST(node.right, (long) node.val, max);      // right subtree's lower bound tightens to node.val
}
// Called initially as: isValidBST(root, null, null)
```
**Why `Long` (boxed) instead of `int` for min/max:** using `Integer.MIN_VALUE`/`MAX_VALUE` as sentinel bounds breaks if the tree ACTUALLY contains a node with that exact value — widening to `long` (or using boxed `Long` with `null` for "no bound yet") sidesteps this edge case entirely.

**Alternative approach:** an in-order traversal of a valid BST must produce a **strictly increasing sequence** — you can validate by doing an in-order traversal and checking each value is greater than the previous one, which is arguably more intuitive than the range-passing approach.

### 16.9 Search & Insert in a BST — O(h) where h = height (O(log n) balanced, O(n) worst case skewed)
```java
static TreeNode search(TreeNode node, int target) {
    if (node == null || node.val == target) return node;
    return target < node.val ? search(node.left, target) : search(node.right, target);
}
static TreeNode insert(TreeNode node, int val) {
    if (node == null) return new TreeNode(val);          // found the correct empty spot — create it
    if (val < node.val) node.left = insert(node.left, val);
    else if (val > node.val) node.right = insert(node.right, val);
    return node;                                            // return `node` unchanged if val already exists (no duplicates)
}
```

### 16.10 Delete from a BST — the trickiest of the three, has 3 cases
```java
static TreeNode delete(TreeNode node, int key) {
    if (node == null) return null;
    if (key < node.val) node.left = delete(node.left, key);
    else if (key > node.val) node.right = delete(node.right, key);
    else {
        // FOUND the node to delete — three cases:
        if (node.left == null) return node.right;             // Case 1: no left child -> replace with right subtree (handles leaf too)
        if (node.right == null) return node.left;              // Case 2: no right child -> replace with left subtree
        // Case 3: TWO children — replace with the in-order SUCCESSOR (smallest value in the right subtree)
        TreeNode successor = node.right;
        while (successor.left != null) successor = successor.left;
        node.val = successor.val;                                // copy the successor's VALUE up
        node.right = delete(node.right, successor.val);           // then delete the (now-duplicated) successor node from the right subtree
    }
    return node;
}
```
**Why the in-order successor (or equally valid: in-order predecessor, the largest value in the left subtree) works:** it's the smallest value that's still LARGER than everything in the left subtree AND smaller than everything else remaining in the right subtree — swapping it into the deleted node's position preserves the BST invariant everywhere.

### 16.11 Lowest Common Ancestor (LCA) in a BST — uses the BST property directly, no need for a generic tree LCA algorithm
```java
static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (p.val < root.val && q.val < root.val) return lowestCommonAncestor(root.left, p, q);    // both smaller -> go left
    if (p.val > root.val && q.val > root.val) return lowestCommonAncestor(root.right, p, q);    // both larger -> go right
    return root;    // otherwise, `p` and `q` are on DIFFERENT sides (or one equals `root`) — root IS the split point / LCA
}
```

---

## PART D — HEAPS (patterns beyond file 07's `PriorityQueue` basics)

### 16.12 Kth Largest Element — the "bounded heap" trick
```java
static int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();     // MIN-heap, size capped at k
    for (int n : nums) {
        minHeap.offer(n);
        if (minHeap.size() > k) minHeap.poll();                   // evict the SMALLEST once we exceed k elements
    }
    return minHeap.peek();                                          // the smallest element remaining IS the kth largest overall
}
```
**Why a MIN-heap (not a max-heap) finds the Kth LARGEST:** by always keeping only the k LARGEST elements seen so far (evicting the smallest whenever the heap overflows past size k), the root of this size-k min-heap is, by construction, the smallest among the k largest — exactly the Kth largest element. **Complexity: O(n log k)** — a genuine improvement over sorting the whole array (O(n log n)) when `k` is small relative to `n`.

### 16.13 Top K Frequent Elements
```java
static int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);
    PriorityQueue<Integer> minHeap = new PriorityQueue<>((a, b) -> freq.get(a) - freq.get(b));   // ordered by FREQUENCY, capped at size k
    for (int key : freq.keySet()) {
        minHeap.offer(key);
        if (minHeap.size() > k) minHeap.poll();
    }
    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) result[i] = minHeap.poll();     // heap drains smallest-frequency-first — fill result BACKWARD
    return result;
}
```

### 16.14 Merge K Sorted Lists — heap-of-heads pattern
```java
static ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> minHeap = new PriorityQueue<>((a, b) -> a.val - b.val);
    for (ListNode node : lists) if (node != null) minHeap.offer(node);    // seed the heap with each list's HEAD only
    ListNode dummy = new ListNode(-1), tail = dummy;
    while (!minHeap.isEmpty()) {
        ListNode smallest = minHeap.poll();
        tail.next = smallest;
        tail = tail.next;
        if (smallest.next != null) minHeap.offer(smallest.next);          // push the NEXT node from whichever list we just consumed from
    }
    return dummy.next;
}
```
**Complexity:** O(N log k) where N = total nodes across all lists, k = number of lists — the heap never holds more than `k` elements at once, and each of the N total nodes is pushed/popped exactly once.

---

## 🚩 Common Traps Recap (Phase 16)

1. Validating a BST by only checking immediate parent-child relationships is WRONG — you must propagate a tightening (min, max) range down the whole tree.
2. `combinationSum`'s "reuse allowed" vs "reuse forbidden" behavior is controlled entirely by passing `i` vs `i + 1` in the recursive call.
3. A naive `isBalanced` that separately recomputes `height()` at every node is O(n²) — fold both computations into a single traversal with a sentinel value for early exit.
4. Iterative pre-order pushes the RIGHT child before the LEFT child (stack is LIFO) to ensure left is processed first.
5. Kth-largest-element uses a MIN-heap capped at size k (not a max-heap) — a very common "backwards from intuition" trap.
6. BST deletion with two children: replace with in-order successor's VALUE, then delete the successor node itself from the right subtree.
7. Tree "diameter"-style problems often need a separate global/side-effect answer variable distinct from what's returned/passed up the recursion.

## ❓ Rapid-Fire Q&A

**Q: Why can't you validate a BST by just checking `node.left.val < node.val < node.right.val` at every node?**
A: That only enforces the constraint locally between parent and immediate children — it misses cases where a deeper descendant (e.g., a right-subtree grandchild that's smaller than an ancestor further up) violates the GLOBAL ordering constraint that must hold across the entire subtree.

**Q: What's the time complexity of finding the Kth largest element using a min-heap, and how does it compare to sorting?**
A: O(n log k) — better than sorting's O(n log n) whenever k is meaningfully smaller than n, since the heap never grows beyond size k.

**Q: In-order traversal of what kind of tree always produces a sorted sequence?**
A: A Binary Search Tree — this is BOTH a way to validate a BST and a way to extract sorted data from one in O(n).

**Q: Why is BST search/insert/delete O(log n) on average but O(n) in the worst case?**
A: Average case assumes a reasonably balanced tree, where each comparison eliminates roughly half the remaining nodes — height ≈ log n. In a degenerate, completely skewed tree (e.g., inserting sorted data in order with no rebalancing), the tree degrades into a linked list, and height becomes n — this is exactly why self-balancing variants (AVL, Red-Black trees, which back Java's `TreeMap`/`TreeSet`) exist.
