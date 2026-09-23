# 14. DSA: Arrays, Strings, Hashing, Two Pointers, Sliding Window 🔥🔥🔥🔥🔥

---

## 14.1 Hashing Patterns

### Pattern: Complement Lookup (Two Sum family)
```java
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();     // value -> index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) return new int[]{seen.get(complement), i};
        seen.put(nums[i], i);                          // add AFTER checking — avoids using the same element twice
    }
    return new int[]{-1, -1};
}
```
**Why add AFTER checking, not before:** if you insert `nums[i]` into the map before checking, and `target == 2 * nums[i]`, you'd incorrectly match an element with itself (using the same index twice, which single-pass Two Sum forbids).
**Complexity:** O(n) time, O(n) space — trades space for turning an O(n²) brute force (`for i, for j`) into a single pass.

### Pattern: Frequency Counting
```java
static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;         // early exit — different lengths can NEVER be anagrams
    int[] freq = new int[26];                             // fixed-size array beats HashMap for known small alphabets — faster, O(1) space
    for (char c : s.toCharArray()) freq[c - 'a']++;
    for (char c : t.toCharArray()) freq[c - 'a']--;
    for (int f : freq) if (f != 0) return false;
    return true;
}
```
**Interview tip:** for lowercase-English-letter problems, a fixed `int[26]` array is almost always preferable to a `HashMap<Character, Integer>` — simpler code, better cache locality, no autoboxing/hashing overhead.

### Pattern: Prefix Sum + HashMap (Subarray Sum equals K)
```java
static int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);                 // CRITICAL base case: an empty prefix (sum=0) exists once, BEFORE the array starts
    int sum = 0, count = 0;
    for (int n : nums) {
        sum += n;
        count += prefixCount.getOrDefault(sum - k, 0);   // if (sum - k) has occurred before, that subarray sums to k
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}
```
**The `prefixCount.put(0, 1)` seed value is the #1 thing people forget** — without it, subarrays that start at index 0 and happen to sum exactly to `k` are never counted (since `sum - k == 0` would need a "prefix sum of 0 occurred once" entry that only the seed provides).

---

## 14.2 Two Pointers

### Pattern A: Opposite-ends convergence (sorted array)
```java
static boolean twoSumSorted(int[] nums, int target) {   // nums MUST be sorted for this pattern
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return true;
        else if (sum < target) left++;      // sum too small -> need a bigger value -> move left pointer up
        else right--;                        // sum too big -> need a smaller value -> move right pointer down
    }
    return false;
}
```
**Why moving the pointer is correct (the proof interviewers want):** since the array is sorted, if `nums[left] + nums[right] < target`, then pairing `nums[left]` with ANY smaller-or-equal index than `right` would only make the sum smaller — so `right` can never be part of a valid pair with anything ≤ current `left` other than what we've already ruled out; the only way forward is increasing `left`.

### Pattern B: Fast & Slow pointers (cycle detection — Floyd's algorithm)
```java
static boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;          // moves 1 step
        fast = fast.next.next;     // moves 2 steps
        if (slow == fast) return true;    // they meet -> a cycle exists
    }
    return false;                          // fast reached the end (null) -> no cycle
}
```
**Why they're guaranteed to meet if a cycle exists:** once both pointers are inside the cycle, the gap between them shrinks by exactly 1 each iteration (fast gains 1 net step on slow per iteration) — a shrinking gap on a finite loop MUST eventually reach 0, meaning they meet. This can never happen if there's no cycle, since `fast` will hit `null` and exit first.

**Finding the cycle's START node (a common LeetCode follow-up):** after detecting a meeting point, reset one pointer to `head`, then advance both ONE step at a time — they meet exactly at the cycle's entry point. (Proof relies on the mathematical relationship between the distance to the cycle start and the meeting point — worth knowing the trick exists even if you don't derive it live.)

### Pattern C: Same-direction (remove duplicates in-place from sorted array)
```java
static int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int slow = 0;                              // slow = index of the last UNIQUE element placed so far
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;                            // new logical length
}
```

---

## 14.3 Sliding Window

### Pattern A: Fixed-size window
```java
static double maxAverage(int[] nums, int k) {
    int sum = 0;
    for (int i = 0; i < k; i++) sum += nums[i];      // build the INITIAL window
    int maxSum = sum;
    for (int i = k; i < nums.length; i++) {
        sum += nums[i] - nums[i - k];                 // slide: add new right element, remove leftmost outgoing element
        maxSum = Math.max(maxSum, sum);
    }
    return (double) maxSum / k;
}
```
**Why this beats brute force:** recomputing the sum of every window from scratch is O(n·k); sliding the window by adding/removing just ONE element per step is O(n) total — a huge complexity win purely from reusing previous work instead of redoing it.

### Pattern B: Variable-size window (expand/shrink based on a condition)
```java
static int lengthOfLongestSubstring(String s) {          // longest substring with NO repeating characters
    Map<Character, Integer> lastSeen = new HashMap<>();
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
            left = lastSeen.get(c) + 1;                    // jump `left` PAST the previous occurrence, don't just increment
        }
        lastSeen.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```
**The `>= left` check is essential:** without it, a stale earlier occurrence of `c` that's already OUTSIDE the current window could incorrectly shrink `left` backward — you must confirm the previous occurrence is actually still INSIDE the current window before reacting to it.

**Generic variable-window skeleton (memorize this shape — it solves a huge fraction of sliding-window problems):**
```java
int left = 0;
for (int right = 0; right < n; right++) {
    // 1. include nums[right] into the window's running state
    while (/* window is invalid, e.g. some_condition_violated */) {
        // 2. shrink from the left until valid again
        left++;
    }
    // 3. window [left, right] is now valid — update the answer here
}
```

---

## 14.4 Kadane's Algorithm — Maximum Subarray Sum

```java
static int maxSubArray(int[] nums) {
    int maxEndingHere = nums[0], maxSoFar = nums[0];
    for (int i = 1; i < nums.length; i++) {
        maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);   // either EXTEND the previous subarray, or START FRESH here
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}
```
**The core insight:** if the running sum ever becomes negative, it can only ever DRAG DOWN any future subarray sum it's prepended to — so it's always at least as good to "restart" from the current element alone. This is a classic 1D Dynamic Programming problem in disguise (`maxEndingHere` is a DP state), O(n) time, O(1) space.

---

## 14.5 Prefix Sum Arrays — O(1) range-sum queries after O(n) preprocessing

```java
int[] prefix = new int[nums.length + 1];      // prefix[i] = sum of nums[0..i-1]; prefix[0] = 0 by convention
for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];

int rangeSum = prefix[right + 1] - prefix[left];    // sum of nums[left..right], INCLUSIVE, in O(1)
```
**Why the `+1` offset convention:** using a 1-indexed prefix array (size n+1, with `prefix[0]=0`) avoids annoying `if (left == 0)` special-casing that a naive 0-indexed version would otherwise need for ranges starting at index 0.

---

## 14.6 Dutch National Flag (3-way partitioning) — sort an array of 0s, 1s, 2s in one pass

```java
static void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] == 0) { swap(nums, low++, mid++); }         // 0 belongs at the front — advance BOTH pointers
        else if (nums[mid] == 1) { mid++; }                        // 1 is already in its correct middle zone
        else { swap(nums, mid, high--); }                          // 2 belongs at the end — advance ONLY high;
                                                                      // do NOT advance mid here! The swapped-in value
                                                                      // from `high` hasn't been classified yet.
    }
}
```
**Why `mid` does NOT advance after swapping with `high`:** the element swapped in from position `high` is completely unexamined — it could be a 0, 1, or 2 — so `mid` must stay put and re-examine it on the next iteration. This asymmetry (advance both pointers on a "0" swap, but only one on a "2" swap) is the #1 detail people get wrong when reproducing this algorithm from memory.

---

## 14.7 Merge Intervals

```java
static int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));    // MUST sort by start first — the whole trick relies on this
    List<int[]> result = new ArrayList<>();
    for (int[] interval : intervals) {
        if (result.isEmpty() || result.get(result.size() - 1)[1] < interval[0]) {
            result.add(interval);                                      // no overlap with the last merged interval -> new entry
        } else {
            result.get(result.size() - 1)[1] =
                Math.max(result.get(result.size() - 1)[1], interval[1]);  // overlap -> extend the last interval's end
        }
    }
    return result.toArray(new int[0][]);
}
```
**Edge case to explicitly call out:** `[1,4]` and `[4,5]` DO count as overlapping/touching (`interval[0] <= lastEnd`, using `<` vs `<=` in the check above depends on whether touching endpoints should merge — clarify this with the interviewer, since problem statements vary on whether `[1,4]` and `[4,5]` should merge into `[1,5]` or stay separate).

---

## 🚩 Common Traps Recap (Phase 14)

1. Two Sum (hashmap version): insert the current element into the map AFTER checking for its complement, not before.
2. Subarray-sum-equals-K needs a seeded `prefixCount.put(0, 1)` base case for prefixes starting at index 0.
3. Sliding window for "longest substring without repeats" must verify the previous occurrence is still INSIDE the current window (`>= left`) before reacting to it.
4. Dutch National Flag: don't advance `mid` after swapping with `high` — the swapped-in element is unexamined.
5. Merge Intervals REQUIRES sorting by start time first — the greedy merge only works on sorted input.
6. Prefix sums: use a 1-indexed (size n+1) convention to avoid special-casing range queries starting at index 0.

## ❓ Rapid-Fire Q&A

**Q: Why does Kadane's algorithm work — what's the underlying insight?**
A: A negative running sum can never help any future subarray sum it's prepended to, so it's always optimal to "reset" the running sum to the current element whenever the running sum drops below the current element's own value — this greedy/DP insight avoids needing to check all O(n²) subarrays.

**Q: What's the time/space complexity improvement sliding window gives you over brute force for "longest substring without repeating characters"?**
A: Brute force checks all O(n²) substrings, each requiring O(n) to validate — O(n³) naively (or O(n²) with a smarter validity check). Sliding window processes each character a bounded number of times (each index enters and leaves the window at most once), giving O(n) time, O(min(n, alphabet size)) space.

**Q: When would you use a fixed-size array (`int[26]`) instead of a `HashMap<Character,Integer>` for frequency counting?**
A: Whenever the key space is small and known upfront (e.g., lowercase English letters) — the array avoids hashing/autoboxing overhead and is more cache-friendly, at the cost of being less general if the character set is unknown or very large (e.g., full Unicode).
