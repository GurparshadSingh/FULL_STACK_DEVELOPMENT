# 15. DSA: LinkedList, Stack, Queue, Deque, Binary Search 🔥🔥🔥🔥🔥

---

## PART A — LINKED LISTS

### 15.1 Node Definition & Basic Traversal
```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}
// Traversal
ListNode curr = head;
while (curr != null) {
    System.out.println(curr.val);
    curr = curr.next;
}
```

### 15.2 Reverse a Linked List — iterative (memorize this exactly, it's THE most-asked LinkedList question)
```java
static ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;    // SAVE the next node BEFORE we overwrite curr.next — otherwise the list is lost!
        curr.next = prev;              // reverse the link
        prev = curr;                    // advance prev
        curr = next;                    // advance curr using the SAVED reference
    }
    return prev;                        // prev ends up as the new head
}
```
**The #1 bug in live-coded reversals:** forgetting to save `curr.next` before overwriting it — once you do `curr.next = prev`, the original "next" pointer is gone forever unless you saved it first.

**Recursive version (good to show you know both):**
```java
static ListNode reverseRecursive(ListNode head) {
    if (head == null || head.next == null) return head;      // base case: empty or single-node list
    ListNode newHead = reverseRecursive(head.next);            // reverse everything AFTER head first
    head.next.next = head;                                       // make the node AFTER head point back to head
    head.next = null;                                             // head becomes the new tail — must null out its old forward link
    return newHead;
}
```

### 15.3 Find the Middle Node (fast/slow pointers, revisited from file 14)
```java
static ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;    // for EVEN-length lists, this lands on the SECOND of the two middle nodes — clarify with interviewer if it matters
}
```

### 15.4 Merge Two Sorted Lists — the dummy-node trick
```java
static ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(-1);     // DUMMY head — eliminates ugly special-casing for "what's the very first real node"
    ListNode tail = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
        else { tail.next = l2; l2 = l2.next; }
        tail = tail.next;
    }
    tail.next = (l1 != null) ? l1 : l2;    // attach whichever list still has leftover nodes
    return dummy.next;                      // real head is AFTER the dummy
}
```
**Why the dummy node is such a common trick:** without it, you'd need extra `if (result == null)` logic to handle setting the very first node specially — the dummy node gives you a uniform "always append after `tail`" loop body, at the tiny cost of discarding one throwaway node at the end (`dummy.next`).

### 15.5 Remove the Nth Node From the End — one-pass with two pointers
```java
static ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(-1); dummy.next = head;
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i < n; i++) fast = fast.next;     // advance fast n steps ahead FIRST
    while (fast.next != null) {                         // then move both together until fast hits the last node
        fast = fast.next;
        slow = slow.next;
    }
    slow.next = slow.next.next;                          // slow is now RIGHT BEFORE the node to remove
    return dummy.next;
}
```
**Why the dummy node matters here specifically:** it correctly handles the edge case of removing the very first (head) node — without a dummy, `slow` would have no "previous" node to adjust `next` on when the head itself must be removed.

### 15.6 Detect & Find Cycle Start — Floyd's Algorithm (full version, referenced in file 14)
```java
static ListNode detectCycleStart(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {                       // cycle detected — now find the START
            ListNode ptr = head;
            while (ptr != slow) { ptr = ptr.next; slow = slow.next; }   // both now move 1 step at a time
            return ptr;                             // they meet exactly at the cycle's entry point
        }
    }
    return null;                                    // no cycle
}
```

---

## PART B — STACKS

### 15.7 Valid Parentheses — the canonical stack-matching problem
```java
static boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    for (char c : s.toCharArray()) {
        if (pairs.containsValue(c)) {           // it's an OPENING bracket
            stack.push(c);
        } else if (pairs.containsKey(c)) {       // it's a CLOSING bracket
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
        }
    }
    return stack.isEmpty();                       // ⚠ don't forget this — leftover UNCLOSED openers must fail too!
}
```
**The final `stack.isEmpty()` check is the most-forgotten line** — a string like `"((("` never fails the loop (nothing ever gets popped-and-mismatched), but it's clearly invalid because of unclosed brackets.

### 15.8 Monotonic Stack — Next Greater Element
```java
static int[] nextGreaterElement(int[] nums) {
    int[] result = new int[nums.length];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();     // stores INDICES, keeps values in DECREASING order from bottom to top
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];           // nums[i] is the "next greater" for whatever we just popped
        }
        stack.push(i);
    }
    return result;
}
```
**Why this is O(n) total, not O(n²), despite the nested loop:** each index is pushed onto the stack EXACTLY once and popped AT MOST once across the entire algorithm — the total number of push+pop operations is bounded by 2n, giving amortized O(n) even though there's a `while` loop nested inside a `for` loop.

### 15.9 Min Stack — O(1) `getMin()` alongside normal stack operations
```java
class MinStack {
    private Deque<Integer> stack = new ArrayDeque<>();
    private Deque<Integer> minStack = new ArrayDeque<>();    // parallel stack tracking the running minimum

    void push(int val) {
        stack.push(val);
        minStack.push(Math.min(val, minStack.isEmpty() ? val : minStack.peek()));  // push the min-SO-FAR, every time
    }
    void pop() { stack.pop(); minStack.pop(); }               // pop BOTH in lockstep — keeps them synchronized
    int top() { return stack.peek(); }
    int getMin() { return minStack.peek(); }                    // O(1) — no scanning needed
}
```
**Core trick:** instead of tracking just ONE running minimum (which would break once that minimum is popped), maintain a PARALLEL stack where each position remembers "what was the minimum at the time THIS element was pushed" — popping in lockstep automatically "restores" the correct previous minimum.

---

## PART C — QUEUES & DEQUES

### 15.10 Sliding Window Maximum — Monotonic Deque (the hardest common Deque pattern)
```java
static int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> deque = new ArrayDeque<>();    // stores INDICES; values are kept in DECREASING order front-to-back
    int[] result = new int[nums.length - k + 1];
    for (int i = 0; i < nums.length; i++) {
        if (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.pollFirst();   // evict indices that FELL OUT of the window
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();                       // evict smaller trailing elements — they can NEVER be the max again
        }                                            // (nums[i] is both later AND bigger, so anything smaller before it is useless)
        deque.offerLast(i);
        if (i >= k - 1) result[i - k + 1] = nums[deque.peekFirst()];    // front of deque = index of the current window's max
    }
    return result;
}
```
**Why smaller trailing elements can be safely discarded:** if `nums[i]` is both newer (will stay in the window longer) AND larger than some earlier element still in the deque, that earlier smaller element can **never** become the window's maximum before `nums[i]` does — it's permanently dominated and safe to discard. This "maintain a monotonic decreasing deque of candidates" trick achieves O(n) total, since each index is added and removed from the deque at most once (same amortized argument as the monotonic stack in 15.8).

### 15.11 BFS with a Queue (foundation, expanded fully in file 17 for graphs)
```java
Queue<TreeNode> queue = new LinkedList<>();     // Queue interface — LinkedList or ArrayDeque both work as the implementation
queue.offer(root);
while (!queue.isEmpty()) {
    int levelSize = queue.size();                 // snapshot BEFORE the inner loop — needed to process level-by-level!
    for (int i = 0; i < levelSize; i++) {
        TreeNode node = queue.poll();
        // process node
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
}
```
**Why snapshot `queue.size()` before the inner loop:** the queue's size keeps changing as you `offer()` children into it DURING the inner loop — capturing `levelSize` up front is what lets you correctly process "exactly this level's nodes" without accidentally spilling into the next level's nodes within the same inner-loop pass.

---

## PART D — BINARY SEARCH

### 15.12 The Classic Template — get the boundary conditions EXACTLY right
```java
static int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;         // inclusive bounds: valid range is [left, right]
    while (left <= right) {                          // <= because both ends are still valid candidates to check
        int mid = left + (left + (right - left) / 2 - left);  // (written verbosely to emphasize:) mid = left + (right-left)/2
        int mid2 = left + (right - left) / 2;          // ⭐ THE overflow-safe formula — NEVER write (left+right)/2!
        if (nums[mid2] == target) return mid2;
        else if (nums[mid2] < target) left = mid2 + 1;  // target is to the right -> discard [left, mid] entirely
        else right = mid2 - 1;                            // target is to the left -> discard [mid, right] entirely
    }
    return -1;                                          // not found
}
```
**Why `left + (right - left) / 2` instead of `(left + right) / 2`:** if `left` and `right` are both large (close to `Integer.MAX_VALUE`), their sum can overflow `int` before the division happens — this is a real, frequently-tested bug (revisit file 01's overflow section).

### 15.13 Find First/Last Occurrence (binary search on a range with duplicates)
```java
static int findFirst(int[] nums, int target) {
    int left = 0, right = nums.length - 1, result = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            result = mid;
            right = mid - 1;              // KEEP SEARCHING LEFT even after finding a match — looking for an EARLIER one
        } else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return result;
}
// findLast is symmetric: on a match, set left = mid + 1 instead, to keep searching RIGHT
```
**The key insight:** don't `return` immediately on finding a match — keep narrowing the search in the direction that could reveal an EARLIER (or later) occurrence, using `result` as a running "best answer found so far."

### 15.14 Search in Rotated Sorted Array
```java
static int searchRotated(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {                  // LEFT half [left..mid] is sorted
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;   // target in the sorted left half
            else left = mid + 1;
        } else {                                          // otherwise RIGHT half [mid..right] must be sorted
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;   // target in the sorted right half
            else right = mid - 1;
        }
    }
    return -1;
}
```
**The core insight:** in a rotated sorted array, AT LEAST ONE of the two halves around `mid` is always fully (normally) sorted — determine which half is sorted first (`nums[left] <= nums[mid]`), then check if the target falls within that sorted half's value range to decide which half to discard.

### 15.15 Binary Search on the Answer (a very common "disguised" binary search pattern)
Used when the ANSWER itself (not an array index) lies in a monotonic search space — e.g., "minimum capacity to ship packages within D days," "Koko eating bananas," "minimum time to complete tasks."
```java
static int minEatingSpeed(int[] piles, int h) {
    int left = 1, right = Arrays.stream(piles).max().getAsInt();
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canFinish(piles, h, mid)) right = mid;         // mid WORKS -> try to do even better (search lower speeds)
        else left = mid + 1;                                  // mid too slow -> need a higher speed
    }
    return left;                                              // left == right at this point — the minimum viable speed
}
static boolean canFinish(int[] piles, int h, int speed) {
    long hoursNeeded = 0;
    for (int p : piles) hoursNeeded += (p + speed - 1) / speed;   // ceiling division without floating point
    return hoursNeeded <= h;
}
```
**Recognizing this pattern in an interview:** if you can write a `boolean canAchieve(candidateAnswer)` check that is **monotonic** (once true, stays true for all "easier" candidates in one direction), binary search on the answer space applies — even though there's no literal sorted array in sight.

---

## 🚩 Common Traps Recap (Phase 15)

1. When reversing a linked list, save `curr.next` BEFORE overwriting it.
2. Dummy-head nodes eliminate special-casing for "is this the very first node" in list-building/removal problems.
3. Valid Parentheses needs a final `stack.isEmpty()` check to catch unclosed openers.
4. Monotonic stack/deque problems achieve O(n) despite a nested `while` because each element is pushed/popped at most once total (amortized analysis).
5. Never write `(left + right) / 2` — always `left + (right - left) / 2` to avoid overflow.
6. In BFS level-order traversal, snapshot `queue.size()` before the inner loop, not after.
7. First/Last-occurrence binary search must keep narrowing instead of returning immediately on the first match found.
8. Rotated-array binary search: figure out WHICH half is sorted first, then check if the target lies within that half's range.

## ❓ Rapid-Fire Q&A

**Q: Why is the Sliding Window Maximum (monotonic deque) solution O(n) instead of O(n·k)?**
A: Although there's a nested `while` loop for evicting smaller trailing elements, each array index is added to the deque exactly once and removed at most once across the ENTIRE run — the total work across all iterations is bounded by O(n), not O(n) per window (which would be O(n·k)).

**Q: What's the purpose of a dummy head node in linked list problems?**
A: It provides a guaranteed non-null "previous" node before the real head, letting you use uniform logic (e.g., always `prev.next = ...`) without special-casing operations that affect the very first node (insertion at head, deletion of head).

**Q: How do you recognize that a problem calls for "binary search on the answer" rather than searching an actual array?**
A: The problem asks for a minimum/maximum value satisfying some condition, and you can write a monotonic feasibility check `canAchieve(x)` — true for all values on one side of some threshold and false on the other — even without any explicit sorted array to search over.

**Q: In `findFirstOccurrence`, why do you set `right = mid - 1` (not return) upon finding a match?**
A: Because there might be an earlier occurrence of the target further to the left; recording the match in a `result` variable and continuing to search left ensures you find the leftmost (first) occurrence rather than an arbitrary one.
